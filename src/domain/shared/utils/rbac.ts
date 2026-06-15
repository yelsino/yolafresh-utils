/**
 * Utilidades para Role-Based Access Control (RBAC)
 * 
 * @description Funciones para validar permisos, roles y gestionar acceso
 * Implementa un sistema robusto de control de acceso basado en roles
 */

import { IUsuario } from "@/interfaces/usuario";
import { Rol, SesionContexto, Entidad } from "@/interfaces/entidades";
import { Permisos } from "@/interfaces/permisos";
import { RolesPredefinidos } from "@/interfaces/roles";
import { CargosPersonal } from "@/interfaces/persons";

type ConfiguracionRolPredefinido = {
  nombre: RolesPredefinidos;
  descripcion: string;
  permisos: Permisos[];
};

const PERMISOS_IMPRESORAS_USO_UNIVERSAL: Permisos[] = [
  Permisos.IMPRESORAS_VER,
  Permisos.IMPRESORAS_CONECTAR,
  Permisos.IMPRESORAS_DESCONECTAR,
  Permisos.IMPRESORAS_PROBAR,
];

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
export function puede(usuario: IUsuario, permiso: Permisos): boolean {
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
export function obtenerPermisos(usuario: IUsuario): Permisos[] {
  const permisos = new Set<Permisos>();
  
  usuario.roles.forEach((rol: Rol) => {
    if (rol.activo) {
      rol.permisos.forEach((permiso: Permisos) => permisos.add(permiso));
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
  permisos: Permisos[], 
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
export function requierePermiso(permisoRequerido: Permisos) {
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
export function requiereRol(rolRequerido: RolesPredefinidos | string) {
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
  permiso: Permisos, 
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
  tipo?: Entidad["tipoEntidad"]
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
export const PERMISOS_CRITICOS: Permisos[] = [
  Permisos.USUARIOS_CREAR,
  Permisos.USUARIOS_DESACTIVAR,
  Permisos.USUARIOS_ASIGNAR_ROLES,
  Permisos.ROLES_EDITAR_PERMISOS,
  Permisos.PRODUCTOS_EDITAR_PRECIO,
  Permisos.PRODUCTOS_VER_COSTO,
  Permisos.VENTAS_ANULAR,
  Permisos.CAJA_ABRIR,
  Permisos.CAJA_CERRAR_CUALQUIERA,
  Permisos.CAJA_EDITAR_TURNO_CERRADO,
  Permisos.FINANZAS_EDITAR,
  Permisos.INVENTARIO_AJUSTAR,
  Permisos.COMPRAS_APROBAR,
  Permisos.COMPRAS_ANULAR,
  Permisos.CONFIGURACION_SISTEMA_EDITAR,
  Permisos.CONFIGURACION_INTEGRACIONES_EDITAR,
  Permisos.AUDITORIA_EXPORTAR,
];

export const CARGOS_ROLES_SUGERIDOS: Record<CargosPersonal, RolesPredefinidos[]> = {
  [CargosPersonal.ADMINISTRADOR]: [RolesPredefinidos.ADMIN],
  [CargosPersonal.SUPERVISOR]: [RolesPredefinidos.SUPERVISOR],
  [CargosPersonal.OPERADOR_ATENCION_COMERCIAL]: [RolesPredefinidos.VENTAS, RolesPredefinidos.CAJERO],
  [CargosPersonal.ASISTENTE_OPERACIONES_COMERCIALES]: [RolesPredefinidos.OPERACIONES],
  [CargosPersonal.ENCARGADO_COMPRAS]: [RolesPredefinidos.COMPRAS],
  [CargosPersonal.ENCARGADO_INVENTARIO]: [RolesPredefinidos.INVENTARIO],
  [CargosPersonal.ENCARGADO_ALMACEN]: [RolesPredefinidos.INVENTARIO, RolesPredefinidos.OPERACIONES],
  [CargosPersonal.DESPACHADOR]: [RolesPredefinidos.OPERACIONES, RolesPredefinidos.VENTAS],
  [CargosPersonal.AUXILIAR_ADMINISTRATIVO]: [RolesPredefinidos.FINANZAS, RolesPredefinidos.SOLO_LECTURA],
  [CargosPersonal.CONTADOR]: [RolesPredefinidos.CONTADOR, RolesPredefinidos.FINANZAS],
  [CargosPersonal.AUDITOR]: [RolesPredefinidos.AUDITOR],
  [CargosPersonal.SOPORTE_TECNICO]: [RolesPredefinidos.SOPORTE_TECNICO],
  [CargosPersonal.SECRETARIO]: [RolesPredefinidos.SOLO_LECTURA],
  [CargosPersonal.ADMINISTRATIVO]: [RolesPredefinidos.FINANZAS],
  [CargosPersonal.REPONEDOR]: [RolesPredefinidos.OPERACIONES],
  [CargosPersonal.CAJERO]: [RolesPredefinidos.CAJERO],
  [CargosPersonal.VENDEDOR]: [RolesPredefinidos.VENDEDOR],
};

export const CONFIGURACIONES_ROLES: Record<RolesPredefinidos, ConfiguracionRolPredefinido> = {
  [RolesPredefinidos.ADMIN]: {
    nombre: RolesPredefinidos.ADMIN,
    descripcion: "Administrador del sistema con acceso completo",
    permisos: [...new Set(Object.values(Permisos))] as Permisos[],
  },
  [RolesPredefinidos.SUPERVISOR]: {
    nombre: RolesPredefinidos.SUPERVISOR,
    descripcion: "Supervision operativa con control de ventas, caja, inventario y reportes",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.DASHBOARD_OPERATIVO,
      Permisos.ALERTAS_VER,
      Permisos.PUNTO_VENTA_VER,
      Permisos.PUNTO_VENTA_CREAR,
      Permisos.PUNTO_VENTA_BUSCAR_PRODUCTOS,
      Permisos.PUNTO_VENTA_ASIGNAR_CLIENTE,
      Permisos.VENTAS_CREAR,
      Permisos.VENTAS_VER,
      Permisos.VENTAS_VER_TODAS,
      Permisos.VENTAS_VER_DETALLE,
      Permisos.VENTAS_EDITAR,
      Permisos.VENTAS_ANULAR,
      Permisos.VENTAS_REPORTES,
      Permisos.CAJA_VER_PROPIA,
      Permisos.CAJA_VER_TODAS,
      Permisos.CAJA_ARQUEO,
      Permisos.CAJA_SUPERVISAR_ARQUEO,
      Permisos.CAJA_MOVIMIENTOS,
      Permisos.CAJA_VER_HISTORIAL_TURNOS,
      Permisos.PRODUCTOS_VER,
      Permisos.PRODUCTOS_EDITAR,
      Permisos.PRODUCTOS_STOCK,
      Permisos.INVENTARIO_VER,
      Permisos.INVENTARIO_CONTEO,
      Permisos.INVENTARIO_SOLICITAR_AJUSTE,
      Permisos.INVENTARIO_APROBAR_AJUSTE,
      Permisos.INVENTARIO_AJUSTAR,
      Permisos.CLIENTES_VER,
      Permisos.CLIENTES_CREAR,
      Permisos.CLIENTES_EDITAR,
      Permisos.PROVEEDORES_VER,
      Permisos.COMPRAS_VER,
      Permisos.REPORTES_VER,
      Permisos.REPORTES_VENTAS_VER,
      Permisos.REPORTES_CAJA_VER,
      Permisos.ANALISIS_OPERATIVO_VER,
      Permisos.NOTIFICACIONES_VER,
      Permisos.PERSONAL_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.CAJERO]: {
    nombre: RolesPredefinidos.CAJERO,
    descripcion: "Caja, cobros y cierre de turno propio",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.DASHBOARD_OPERATIVO,
      Permisos.PUNTO_VENTA_VER,
      Permisos.PUNTO_VENTA_CREAR,
      Permisos.PUNTO_VENTA_BUSCAR_PRODUCTOS,
      Permisos.PUNTO_VENTA_ASIGNAR_CLIENTE,
      Permisos.PUNTO_VENTA_IMPRIMIR_COMPROBANTE,
      Permisos.PUNTO_VENTA_REIMPRIMIR_COMPROBANTE,
      Permisos.VENTAS_CREAR,
      Permisos.VENTAS_VER,
      Permisos.VENTAS_VER_PROPIAS,
      Permisos.VENTAS_VER_DETALLE,
      Permisos.CAJA_VER_PROPIA,
      Permisos.CAJA_ABRIR,
      Permisos.CAJA_CERRAR,
      Permisos.CAJA_CERRAR_PROPIA,
      Permisos.CAJA_ARQUEO,
      Permisos.CAJA_ARQUEO_PROPIO,
      Permisos.CAJA_MOVIMIENTOS,
      Permisos.CUENTAS_VER,
      Permisos.CUENTAS_VER_PROPIAS,
      Permisos.CUENTAS_REGISTRAR_PAGO,
      Permisos.CLIENTES_VER,
      Permisos.CLIENTES_CREAR,
      Permisos.PRODUCTOS_VER,
      Permisos.PRODUCTOS_STOCK,
      Permisos.PAGOS_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.VENTAS]: {
    nombre: RolesPredefinidos.VENTAS,
    descripcion: "Atencion comercial, ventas y gestion basica de clientes",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.PUNTO_VENTA_VER,
      Permisos.PUNTO_VENTA_CREAR,
      Permisos.PUNTO_VENTA_BUSCAR_PRODUCTOS,
      Permisos.PUNTO_VENTA_PESAR_PRODUCTOS,
      Permisos.PUNTO_VENTA_ASIGNAR_CLIENTE,
      Permisos.PUNTO_VENTA_APLICAR_DESCUENTO,
      Permisos.PUNTO_VENTA_IMPRIMIR_COMPROBANTE,
      Permisos.VENTAS_CREAR,
      Permisos.VENTAS_VER,
      Permisos.VENTAS_VER_PROPIAS,
      Permisos.VENTAS_VER_DETALLE,
      Permisos.CLIENTES_VER,
      Permisos.CLIENTES_CREAR,
      Permisos.CLIENTES_EDITAR,
      Permisos.CLIENTES_VER_DETALLE,
      Permisos.PRODUCTOS_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.OPERACIONES]: {
    nombre: RolesPredefinidos.OPERACIONES,
    descripcion: "Operacion fisica, reposicion, despacho y apoyo de almacen",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.ALERTAS_VER,
      Permisos.PRODUCTOS_VER,
      Permisos.PRODUCTOS_STOCK,
      Permisos.INVENTARIO_VER,
      Permisos.INVENTARIO_VER_BASICO,
      Permisos.INVENTARIO_CONTEO,
      Permisos.INVENTARIO_REGISTRAR_MERMA,
      Permisos.ALMACENES_VER,
      Permisos.ALMACENES_VER_RECEPCIONES,
      Permisos.ALMACENES_VER_TRANSFERENCIAS,
      Permisos.UTILIDADES_MENU_PRINCIPAL,
      Permisos.PERFIL_VER,
    ],
  },
  [RolesPredefinidos.INVENTARIO]: {
    nombre: RolesPredefinidos.INVENTARIO,
    descripcion: "Control de stock, ajustes, mermas, almacenes y transferencias",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.ALERTAS_VER,
      Permisos.PRODUCTOS_VER,
      Permisos.PRODUCTOS_STOCK,
      Permisos.INVENTARIO_VER,
      Permisos.INVENTARIO_VER_TODOS_ALMACENES,
      Permisos.INVENTARIO_CONTEO,
      Permisos.INVENTARIO_SOLICITAR_AJUSTE,
      Permisos.INVENTARIO_APROBAR_AJUSTE,
      Permisos.INVENTARIO_AJUSTAR,
      Permisos.INVENTARIO_TRANSFERIR,
      Permisos.INVENTARIO_VER_MERMAS,
      Permisos.INVENTARIO_REGISTRAR_MERMA,
      Permisos.INVENTARIO_VER_HISTORIAL,
      Permisos.INVENTARIO_EXPORTAR,
      Permisos.ALMACENES_VER,
      Permisos.ALMACENES_CREAR_TRANSFERENCIA,
      Permisos.ALMACENES_VER_TRANSFERENCIAS,
      Permisos.ALMACENES_VER_RECEPCIONES,
      Permisos.REPORTES_INVENTARIO_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.COMPRAS]: {
    nombre: RolesPredefinidos.COMPRAS,
    descripcion: "Abastecimiento, proveedores, costos y recepcion de mercaderia",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.COMPRAS_VER,
      Permisos.COMPRAS_CREAR,
      Permisos.COMPRAS_EDITAR,
      Permisos.COMPRAS_APROBAR,
      Permisos.COMPRAS_RECEPCIONAR,
      Permisos.COMPRAS_VER_COSTOS,
      Permisos.COMPRAS_REGISTRAR_PAGO,
      Permisos.COMPRAS_VER_PAGOS,
      Permisos.COMPRAS_EXPORTAR,
      Permisos.PROVEEDORES_VER,
      Permisos.PROVEEDORES_CREAR,
      Permisos.PROVEEDORES_EDITAR,
      Permisos.PROVEEDORES_VER_DETALLE,
      Permisos.PROVEEDORES_VER_PAGOS,
      Permisos.PROVEEDORES_VER_HISTORIAL_COMPRAS,
      Permisos.ALMACENES_VER_RECEPCIONES,
      Permisos.ALMACENES_CREAR_RECEPCION,
      Permisos.REPORTES_COMPRAS_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.FINANZAS]: {
    nombre: RolesPredefinidos.FINANZAS,
    descripcion: "Control de ingresos, egresos, cuentas y caja historica",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.DASHBOARD_FINANCIERO,
      Permisos.FINANZAS_VER,
      Permisos.FINANZAS_CREAR,
      Permisos.FINANZAS_EDITAR,
      Permisos.FINANZAS_REPORTES,
      Permisos.CAJA_VER_TODAS,
      Permisos.CAJA_VER_HISTORIAL_TURNOS,
      Permisos.CUENTAS_VER,
      Permisos.CUENTAS_VER_TODAS,
      Permisos.CUENTAS_REGISTRAR_PAGO,
      Permisos.CUENTAS_AJUSTAR_DEUDA,
      Permisos.CUENTAS_VER_HISTORIAL,
      Permisos.CUENTAS_VER_MOROSIDAD,
      Permisos.PAGOS_VER,
      Permisos.PAGOS_VER_DIGITALES,
      Permisos.PAGOS_CONCILIAR,
      Permisos.REPORTES_VER,
      Permisos.REPORTES_FINANZAS_VER,
      Permisos.REPORTES_CAJA_VER,
      Permisos.ANALISIS_FINANCIERO_VER,
      Permisos.NOTIFICACIONES_VER_FINANCIERAS,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.VENDEDOR]: {
    nombre: RolesPredefinidos.VENDEDOR,
    descripcion: "Rol legacy para apps antiguas; equivalente funcional a ventas",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.PUNTO_VENTA_VER,
      Permisos.PUNTO_VENTA_CREAR,
      Permisos.PUNTO_VENTA_BUSCAR_PRODUCTOS,
      Permisos.PUNTO_VENTA_ASIGNAR_CLIENTE,
      Permisos.VENTAS_CREAR,
      Permisos.VENTAS_VER,
      Permisos.VENTAS_VER_PROPIAS,
      Permisos.CLIENTES_CREAR,
      Permisos.CLIENTES_VER,
      Permisos.CLIENTES_EDITAR,
      Permisos.PRODUCTOS_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.CONTADOR]: {
    nombre: RolesPredefinidos.CONTADOR,
    descripcion: "Revision contable y financiera con acceso a exportaciones y reportes",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.DASHBOARD_FINANCIERO,
      Permisos.VENTAS_VER,
      Permisos.VENTAS_VER_TODAS,
      Permisos.VENTAS_REPORTES,
      Permisos.VENTAS_EXPORTAR,
      Permisos.CAJA_VER_TODAS,
      Permisos.CAJA_VER_HISTORIAL_TURNOS,
      Permisos.COMPRAS_VER,
      Permisos.COMPRAS_VER_COSTOS,
      Permisos.COMPRAS_VER_PAGOS,
      Permisos.FINANZAS_VER,
      Permisos.FINANZAS_REPORTES,
      Permisos.CUENTAS_VER,
      Permisos.CUENTAS_VER_TODAS,
      Permisos.CUENTAS_VER_HISTORIAL,
      Permisos.PROVEEDORES_VER,
      Permisos.CLIENTES_VER,
      Permisos.PAGOS_VER,
      Permisos.PAGOS_CONCILIAR,
      Permisos.REPORTES_VER,
      Permisos.REPORTES_VENTAS_VER,
      Permisos.REPORTES_CAJA_VER,
      Permisos.REPORTES_FINANZAS_VER,
      Permisos.REPORTES_COMPRAS_VER,
      Permisos.REPORTES_EXPORTAR,
      Permisos.ANALISIS_FINANCIERO_VER,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.AUDITOR]: {
    nombre: RolesPredefinidos.AUDITOR,
    descripcion: "Revision de historial, auditoria y acciones sensibles sin operacion directa",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.VENTAS_VER,
      Permisos.VENTAS_VER_TODAS,
      Permisos.CAJA_VER_TODAS,
      Permisos.COMPRAS_VER,
      Permisos.INVENTARIO_VER,
      Permisos.USUARIOS_VER,
      Permisos.AUDITORIA_VER,
      Permisos.AUDITORIA_VER_ACCIONES_CRITICAS,
      Permisos.AUDITORIA_USUARIOS_VER,
      Permisos.AUDITORIA_CAJA_VER,
      Permisos.AUDITORIA_VENTAS_VER,
      Permisos.AUDITORIA_FINANZAS_VER,
      Permisos.REPORTES_VER,
      Permisos.NOTIFICACIONES_VER,
      Permisos.PERFIL_VER,
    ],
  },
  [RolesPredefinidos.SOPORTE_TECNICO]: {
    nombre: RolesPredefinidos.SOPORTE_TECNICO,
    descripcion: "Soporte tecnico, dispositivos, impresoras y configuracion operativa",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.UTILIDADES_VER,
      Permisos.UTILIDADES_USAR_CAMARA,
      Permisos.CONFIGURACION_VER,
      Permisos.CONFIGURACION_IMPRESORAS_VER,
      Permisos.CONFIGURACION_IMPRESORAS_EDITAR,
      Permisos.CONFIGURACION_SISTEMA_VER,
      Permisos.CONFIGURACION_INTEGRACIONES_VER,
      Permisos.NOTIFICACIONES_VER_SISTEMA,
      Permisos.PERFIL_VER,
      Permisos.PERFIL_EDITAR,
    ],
  },
  [RolesPredefinidos.SOLO_LECTURA]: {
    nombre: RolesPredefinidos.SOLO_LECTURA,
    descripcion: "Consulta autorizada sin crear, editar, anular ni aprobar registros",
    permisos: [
      ...PERMISOS_IMPRESORAS_USO_UNIVERSAL,
      Permisos.DASHBOARD_VER,
      Permisos.VENTAS_VER,
      Permisos.VENTAS_VER_DETALLE,
      Permisos.CAJA_VER_PROPIA,
      Permisos.PRODUCTOS_VER,
      Permisos.PRODUCTOS_STOCK,
      Permisos.CLIENTES_VER,
      Permisos.PROVEEDORES_VER,
      Permisos.PERSONAL_VER,
      Permisos.COMPRAS_VER,
      Permisos.INVENTARIO_VER,
      Permisos.REPORTES_VER,
      Permisos.NOTIFICACIONES_VER,
      Permisos.PERFIL_VER,
    ],
  },
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
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
