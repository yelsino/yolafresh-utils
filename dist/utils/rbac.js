"use strict";
/**
 * Utilidades para Role-Based Access Control (RBAC)
 *
 * @description Funciones para validar permisos, roles y gestionar acceso
 * Implementa un sistema robusto de control de acceso basado en roles
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIGURACIONES_ROLES = void 0;
exports.puede = puede;
exports.tieneRol = tieneRol;
exports.puedeAccederEntidad = puedeAccederEntidad;
exports.obtenerPermisos = obtenerPermisos;
exports.puedeMultiple = puedeMultiple;
exports.crearSesionContexto = crearSesionContexto;
exports.requierePermiso = requierePermiso;
exports.requiereRol = requiereRol;
exports.puedeEnEntidad = puedeEnEntidad;
exports.obtenerEntidadesAccesibles = obtenerEntidadesAccesibles;
exports.crearRolPredefinido = crearRolPredefinido;
const entidades_1 = require("@/interfaces/entidades");
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
function puede(usuario, permiso) {
    // Verificar si el usuario está activo
    if (!usuario.activo || usuario.cuentaBloqueada) {
        return false;
    }
    // Los administradores tienen todos los permisos
    if (tieneRol(usuario, entidades_1.RolesPredefinidos.ADMIN)) {
        return true;
    }
    // Verificar si algún rol del usuario tiene el permiso
    return usuario.roles.some((rol) => rol.activo && rol.permisos.includes(permiso));
}
/**
 * Verifica si un usuario tiene un rol específico
 *
 * @param usuario - Usuario a verificar
 * @param nombreRol - Nombre del rol a verificar
 * @returns true si tiene el rol, false en caso contrario
 */
function tieneRol(usuario, nombreRol) {
    return usuario.roles.some((rol) => rol.activo && rol.nombre === nombreRol);
}
/**
 * Verifica si un usuario puede acceder a una entidad específica
 *
 * @param usuario - Usuario a verificar
 * @param entidadId - ID de la entidad
 * @returns true si puede acceder, false en caso contrario
 */
function puedeAccederEntidad(usuario, entidadId) {
    return usuario.entidades.some((entidad) => entidad.id === entidadId);
}
/**
 * Obtiene todos los permisos de un usuario (combinando todos sus roles)
 *
 * @param usuario - Usuario del cual obtener permisos
 * @returns Array de permisos únicos
 */
function obtenerPermisos(usuario) {
    const permisos = new Set();
    usuario.roles.forEach((rol) => {
        if (rol.activo) {
            rol.permisos.forEach((permiso) => permisos.add(permiso));
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
function puedeMultiple(usuario, permisos, requiereTodos = true) {
    if (requiereTodos) {
        return permisos.every(permiso => puede(usuario, permiso));
    }
    else {
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
function crearSesionContexto(usuario, entidadActivaId) {
    var _a;
    let entidadActiva;
    if (entidadActivaId) {
        const entidad = usuario.entidades.find((e) => e.id === entidadActivaId);
        if (!entidad) {
            throw new Error(`Usuario no tiene acceso a la entidad ${entidadActivaId}`);
        }
        entidadActiva = entidad;
    }
    else {
        // Si no se especifica, usar la primera entidad o la predeterminada
        const entidadPredeterminada = (_a = usuario.configuraciones) === null || _a === void 0 ? void 0 : _a.entidadPredeterminada;
        if (entidadPredeterminada) {
            const entidad = usuario.entidades.find((e) => e.id === entidadPredeterminada);
            entidadActiva = entidad || usuario.entidades[0];
        }
        else {
            entidadActiva = usuario.entidades[0];
        }
    }
    return {
        usuarioId: usuario.id,
        entidadActiva,
        rolesActivos: usuario.roles.filter((rol) => rol.activo),
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
function requierePermiso(permisoRequerido) {
    return (usuario) => {
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
function requiereRol(rolRequerido) {
    return (usuario) => {
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
function puedeEnEntidad(usuario, permiso, entidadId) {
    return puede(usuario, permiso) && puedeAccederEntidad(usuario, entidadId);
}
/**
 * Obtiene las entidades a las que un usuario tiene acceso, filtradas por tipo
 *
 * @param usuario - Usuario del cual obtener entidades
 * @param tipo - Tipo de entidad a filtrar (opcional)
 * @returns Array de entidades accesibles
 */
function obtenerEntidadesAccesibles(usuario, tipo) {
    let entidades = usuario.entidades.filter((entidad) => entidad.activo);
    if (tipo) {
        entidades = entidades.filter((entidad) => entidad.tipo === tipo);
    }
    return entidades;
}
/**
 * Configuraciones predefinidas de roles del sistema
 */
exports.CONFIGURACIONES_ROLES = {
    [entidades_1.RolesPredefinidos.ADMIN]: {
        nombre: entidades_1.RolesPredefinidos.ADMIN,
        descripcion: "Administrador del sistema con acceso completo",
        permisos: Object.values(entidades_1.Permisos)
    },
    [entidades_1.RolesPredefinidos.CAJERO]: {
        nombre: entidades_1.RolesPredefinidos.CAJERO,
        descripcion: "Cajero con permisos de venta y consulta",
        permisos: [
            entidades_1.Permisos.VENTAS_CREAR,
            entidades_1.Permisos.VENTAS_VER,
            entidades_1.Permisos.PRODUCTOS_VER,
            entidades_1.Permisos.CLIENTES_VER,
            entidades_1.Permisos.CLIENTES_CREAR,
            entidades_1.Permisos.PERFIL_VER,
            entidades_1.Permisos.PERFIL_EDITAR
        ]
    },
    [entidades_1.RolesPredefinidos.VENDEDOR]: {
        nombre: entidades_1.RolesPredefinidos.VENDEDOR,
        descripcion: "Vendedor con permisos de venta y gestión de clientes",
        permisos: [
            entidades_1.Permisos.VENTAS_CREAR,
            entidades_1.Permisos.VENTAS_VER,
            entidades_1.Permisos.PRODUCTOS_VER,
            entidades_1.Permisos.CLIENTES_CREAR,
            entidades_1.Permisos.CLIENTES_VER,
            entidades_1.Permisos.CLIENTES_EDITAR,
            entidades_1.Permisos.PERFIL_VER,
            entidades_1.Permisos.PERFIL_EDITAR
        ]
    },
    [entidades_1.RolesPredefinidos.CLIENTE]: {
        nombre: entidades_1.RolesPredefinidos.CLIENTE,
        descripcion: "Cliente con acceso limitado a su información",
        permisos: [
            entidades_1.Permisos.PRODUCTOS_VER,
            entidades_1.Permisos.PERFIL_VER,
            entidades_1.Permisos.PERFIL_EDITAR
        ]
    },
    [entidades_1.RolesPredefinidos.PROVEEDOR]: {
        nombre: entidades_1.RolesPredefinidos.PROVEEDOR,
        descripcion: "Proveedor con acceso a gestión de productos y órdenes",
        permisos: [
            entidades_1.Permisos.PRODUCTOS_VER,
            entidades_1.Permisos.PRODUCTOS_CREAR,
            entidades_1.Permisos.PRODUCTOS_EDITAR,
            entidades_1.Permisos.PERFIL_VER,
            entidades_1.Permisos.PERFIL_EDITAR
        ]
    },
    [entidades_1.RolesPredefinidos.SUPERVISOR]: {
        nombre: entidades_1.RolesPredefinidos.SUPERVISOR,
        descripcion: "Supervisor con permisos de gestión y reportes",
        permisos: [
            entidades_1.Permisos.VENTAS_CREAR,
            entidades_1.Permisos.VENTAS_VER,
            entidades_1.Permisos.VENTAS_EDITAR,
            entidades_1.Permisos.VENTAS_REPORTES,
            entidades_1.Permisos.PRODUCTOS_VER,
            entidades_1.Permisos.PRODUCTOS_EDITAR,
            entidades_1.Permisos.PRODUCTOS_STOCK,
            entidades_1.Permisos.CLIENTES_VER,
            entidades_1.Permisos.CLIENTES_CREAR,
            entidades_1.Permisos.CLIENTES_EDITAR,
            entidades_1.Permisos.PERSONAL_VER,
            entidades_1.Permisos.PERFIL_VER,
            entidades_1.Permisos.PERFIL_EDITAR
        ]
    },
    [entidades_1.RolesPredefinidos.CONTADOR]: {
        nombre: entidades_1.RolesPredefinidos.CONTADOR,
        descripcion: "Contador con acceso a finanzas y reportes",
        permisos: [
            entidades_1.Permisos.VENTAS_VER,
            entidades_1.Permisos.VENTAS_REPORTES,
            entidades_1.Permisos.FINANZAS_VER,
            entidades_1.Permisos.FINANZAS_CREAR,
            entidades_1.Permisos.FINANZAS_EDITAR,
            entidades_1.Permisos.FINANZAS_REPORTES,
            entidades_1.Permisos.CLIENTES_VER,
            entidades_1.Permisos.PROVEEDORES_VER,
            entidades_1.Permisos.PERFIL_VER,
            entidades_1.Permisos.PERFIL_EDITAR
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
function crearRolPredefinido(tipo, id) {
    const config = exports.CONFIGURACIONES_ROLES[tipo];
    return {
        id,
        nombre: config.nombre,
        descripcion: config.descripcion,
        permisos: config.permisos,
        activo: true,
        fechaCreacion: new Date()
    };
}
