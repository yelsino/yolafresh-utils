/**
 * Utilidades para Role-Based Access Control (RBAC)
 * 
 * @description Funciones para validar permisos, roles y gestionar acceso
 * Implementa un sistema robusto de control de acceso basado en roles
 */

import { IUsuario, LoginRespuesta } from "@/interfaces/usuario";
import { Rol, Permisos, RolesPredefinidos, SesionContexto, Entidad } from "@/interfaces/entidades";

/**
 * Verifica si un usuario tiene un permiso específico
 * 
 * @param usuario - Usuario a verificar
 * @param permiso - Permiso requerido
 * @returns true si tiene el permiso, false en caso contrario
 * 
 * @example
 * ```typescript
 * if (puede(usuario, Permisos.VENTAS_CREAR)) {
 *   // El usuario puede crear ventas
 * }
 * ```
 */
export function puede(usuario: IUsuario, permiso: string): boolean {
  // Verificar si el usuario está activo
  if (!usuario.activo || usuario.cuentaBloqueada) {
    return false;
  }

  // Los administradores tienen todos los permisos
  if (tieneRol(usuario, RolesPredefinidos.ADMIN)) {
    return true;
  }

  // Verificar si algún rol del usuario tiene el permiso
  return usuario.roles.some((rol: Rol) => 
    rol.activo && rol.permisos.includes(permiso)
  );
}

/**
 * Verifica si un usuario tiene un rol específico
 * 
 * @param usuario - Usuario a verificar
 * @param nombreRol - Nombre del rol a verificar
 * @returns true si tiene el rol, false en caso contrario
 */
export function tieneRol(usuario: IUsuario, nombreRol: string): boolean {
  return usuario.roles.some((rol: Rol) => 
    rol.activo && rol.nombre === nombreRol
  );
}

/**
 * Verifica si un usuario puede acceder a una entidad específica
 * 
 * @param usuario - Usuario a verificar
 * @param entidadId - ID de la entidad
 * @returns true si puede acceder, false en caso contrario
 */
export function puedeAccederEntidad(usuario: IUsuario, entidadId: string): boolean {
  return usuario.entidades.some((entidad: Entidad) => entidad.id === entidadId);
}

/**
 * Obtiene todos los permisos de un usuario (combinando todos sus roles)
 * 
 * @param usuario - Usuario del cual obtener permisos
 * @returns Array de permisos únicos
 */
export function obtenerPermisos(usuario: IUsuario): string[] {
  const permisos = new Set<string>();
  
  usuario.roles.forEach((rol: Rol) => {
    if (rol.activo) {
      rol.permisos.forEach((permiso: string) => permisos.add(permiso));
    }
  });
  
  return Array.from(permisos);
}

/**
 * Verifica múltiples permisos a la vez
 * 
 * @param usuario - Usuario a verificar
 * @param permisos - Array de permisos requeridos
 * @param requiereTodos - Si true, requiere TODOS los permisos. Si false, requiere AL MENOS UNO
 * @returns true si cumple la condición, false en caso contrario
 */
export function puedeMultiple(
  usuario: IUsuario, 
  permisos: string[], 
  requiereTodos: boolean = true
): boolean {
  if (requiereTodos) {
    return permisos.every(permiso => puede(usuario, permiso));
  } else {
    return permisos.some(permiso => puede(usuario, permiso));
  }
}

/**
 * Crea un contexto de sesión para un usuario
 * 
 * @param usuario - Usuario autenticado
 * @param entidadActivaId - ID de la entidad a activar (opcional)
 * @returns Contexto de sesión
 */
export function crearSesionContexto(
  usuario: IUsuario, 
  entidadActivaId?: string
): SesionContexto {
  let entidadActiva: Entidad;
  
  if (entidadActivaId) {
    const entidad = usuario.entidades.find((e: Entidad) => e.id === entidadActivaId);
    if (!entidad) {
      throw new Error(`Usuario no tiene acceso a la entidad ${entidadActivaId}`);
    }
    entidadActiva = entidad;
  } else {
    // Si no se especifica, usar la primera entidad o la predeterminada
    const entidadPredeterminada = usuario.configuraciones?.entidadPredeterminada;
    if (entidadPredeterminada) {
        const entidad = usuario.entidades.find((e: Entidad) => e.id === entidadPredeterminada);
      entidadActiva = entidad || usuario.entidades[0];
    } else {
      entidadActiva = usuario.entidades[0];
    }
  }

  return {
    usuarioId: usuario.id,
    entidadActiva,
    rolesActivos: usuario.roles.filter((rol: Rol) => rol.activo),
    inicioSesion: new Date(),
    ultimaActividad: new Date()
  };
}

/**
 * Middleware para verificar permisos en rutas/endpoints
 * 
 * @param permisoRequerido - Permiso necesario para acceder
 * @returns Función middleware
 */
export function requierePermiso(permisoRequerido: string) {
  return (usuario: IUsuario) => {
    if (!puede(usuario, permisoRequerido)) {
      throw new Error(`Acceso denegado. Se requiere el permiso: ${permisoRequerido}`);
    }
    return true;
  };
}

/**
 * Middleware para verificar roles en rutas/endpoints
 * 
 * @param rolRequerido - Rol necesario para acceder
 * @returns Función middleware
 */
export function requiereRol(rolRequerido: string) {
  return (usuario: IUsuario) => {
    if (!tieneRol(usuario, rolRequerido)) {
      throw new Error(`Acceso denegado. Se requiere el rol: ${rolRequerido}`);
    }
    return true;
  };
}

/**
 * Valida que un usuario pueda realizar una acción sobre una entidad específica
 * 
 * @param usuario - Usuario que intenta realizar la acción
 * @param permiso - Permiso requerido
 * @param entidadId - ID de la entidad sobre la cual se realizará la acción
 * @returns true si puede realizar la acción, false en caso contrario
 */
export function puedeEnEntidad(
  usuario: IUsuario, 
  permiso: string, 
  entidadId: string
): boolean {
  return puede(usuario, permiso) && puedeAccederEntidad(usuario, entidadId);
}

/**
 * Obtiene las entidades a las que un usuario tiene acceso, filtradas por tipo
 * 
 * @param usuario - Usuario del cual obtener entidades
 * @param tipo - Tipo de entidad a filtrar (opcional)
 * @returns Array de entidades accesibles
 */
export function obtenerEntidadesAccesibles(
  usuario: IUsuario, 
  tipo?: string
): Entidad[] {
  let entidades = usuario.entidades.filter((entidad: Entidad) => entidad.activo);
  
  if (tipo) {
    entidades = entidades.filter((entidad: Entidad) => entidad.tipoEntidad === tipo);
  }
  
  return entidades;
}

/**
 * Configuraciones predefinidas de roles del sistema
 */
export const CONFIGURACIONES_ROLES = {
  [RolesPredefinidos.ADMIN]: {
    nombre: RolesPredefinidos.ADMIN,
    descripcion: "Administrador del sistema con acceso completo",
    permisos: Object.values(Permisos)
  },
  
  [RolesPredefinidos.CAJERO]: {
    nombre: RolesPredefinidos.CAJERO,
    descripcion: "Cajero con permisos de venta y consulta",
    permisos: [
      Permisos.VENTAS_CREAR,
      Permisos.VENTAS_VER,
      Permisos.PRODUCTOS_VER,
      Permisos.CLIENTES_VER,
      Permisos.CLIENTES_CREAR,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR
    ]
  },
  
  [RolesPredefinidos.VENDEDOR]: {
    nombre: RolesPredefinidos.VENDEDOR,
    descripcion: "Vendedor con permisos de venta y gestión de clientes",
    permisos: [
      Permisos.VENTAS_CREAR,
      Permisos.VENTAS_VER,
      Permisos.PRODUCTOS_VER,
      Permisos.CLIENTES_CREAR,
      Permisos.CLIENTES_VER,
      Permisos.CLIENTES_EDITAR,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR
    ]
  },
  
  [RolesPredefinidos.CLIENTE]: {
    nombre: RolesPredefinidos.CLIENTE,
    descripcion: "Cliente con acceso limitado a su información",
    permisos: [
      Permisos.PRODUCTOS_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR
    ]
  },
  
  [RolesPredefinidos.PROVEEDOR]: {
    nombre: RolesPredefinidos.PROVEEDOR,
    descripcion: "Proveedor con acceso a gestión de productos y órdenes",
    permisos: [
      Permisos.PRODUCTOS_VER,
      Permisos.PRODUCTOS_CREAR,
      Permisos.PRODUCTOS_EDITAR,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR
    ]
  },
  
  [RolesPredefinidos.SUPERVISOR]: {
    nombre: RolesPredefinidos.SUPERVISOR,
    descripcion: "Supervisor con permisos de gestión y reportes",
    permisos: [
      Permisos.VENTAS_CREAR,
      Permisos.VENTAS_VER,
      Permisos.VENTAS_EDITAR,
      Permisos.VENTAS_REPORTES,
      Permisos.PRODUCTOS_VER,
      Permisos.PRODUCTOS_EDITAR,
      Permisos.PRODUCTOS_STOCK,
      Permisos.CLIENTES_VER,
      Permisos.CLIENTES_CREAR,
      Permisos.CLIENTES_EDITAR,
      Permisos.PERSONAL_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR
    ]
  },
  
  [RolesPredefinidos.CONTADOR]: {
    nombre: RolesPredefinidos.CONTADOR,
    descripcion: "Contador con acceso a finanzas y reportes",
    permisos: [
      Permisos.VENTAS_VER,
      Permisos.VENTAS_REPORTES,
      Permisos.FINANZAS_VER,
      Permisos.FINANZAS_CREAR,
      Permisos.FINANZAS_EDITAR,
      Permisos.FINANZAS_REPORTES,
      Permisos.CLIENTES_VER,
      Permisos.PROVEEDORES_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR
    ]
  }
};

/**
 * Crea un rol predefinido
 * 
 * @param tipo - Tipo de rol predefinido
 * @param id - ID único para el rol
 * @returns Objeto Rol configurado
 */
export function crearRolPredefinido(tipo: RolesPredefinidos, id: string): Rol {
  const config = CONFIGURACIONES_ROLES[tipo];
  
  return {
    id,
    nombre: config.nombre,
    descripcion: config.descripcion,
    permisos: config.permisos,
    activo: true,
    createdAt: new Date()
  };
}
