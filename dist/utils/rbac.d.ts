/**
 * Utilidades para Role-Based Access Control (RBAC)
 *
 * @description Funciones para validar permisos, roles y gestionar acceso
 * Implementa un sistema robusto de control de acceso basado en roles
 */
import { IUsuario } from "../interfaces/usuario";
import { Rol, Permisos, RolesPredefinidos, SesionContexto, Entidad } from "../interfaces/entidades";
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
export declare function puede(usuario: IUsuario, permiso: string): boolean;
/**
 * Verifica si un usuario tiene un rol específico
 *
 * @param usuario - Usuario a verificar
 * @param nombreRol - Nombre del rol a verificar
 * @returns true si tiene el rol, false en caso contrario
 */
export declare function tieneRol(usuario: IUsuario, nombreRol: string): boolean;
/**
 * Verifica si un usuario puede acceder a una entidad específica
 *
 * @param usuario - Usuario a verificar
 * @param entidadId - ID de la entidad
 * @returns true si puede acceder, false en caso contrario
 */
export declare function puedeAccederEntidad(usuario: IUsuario, entidadId: string): boolean;
/**
 * Obtiene todos los permisos de un usuario (combinando todos sus roles)
 *
 * @param usuario - Usuario del cual obtener permisos
 * @returns Array de permisos únicos
 */
export declare function obtenerPermisos(usuario: IUsuario): string[];
/**
 * Verifica múltiples permisos a la vez
 *
 * @param usuario - Usuario a verificar
 * @param permisos - Array de permisos requeridos
 * @param requiereTodos - Si true, requiere TODOS los permisos. Si false, requiere AL MENOS UNO
 * @returns true si cumple la condición, false en caso contrario
 */
export declare function puedeMultiple(usuario: IUsuario, permisos: string[], requiereTodos?: boolean): boolean;
/**
 * Crea un contexto de sesión para un usuario
 *
 * @param usuario - Usuario autenticado
 * @param entidadActivaId - ID de la entidad a activar (opcional)
 * @returns Contexto de sesión
 */
export declare function crearSesionContexto(usuario: IUsuario, entidadActivaId?: string): SesionContexto;
/**
 * Middleware para verificar permisos en rutas/endpoints
 *
 * @param permisoRequerido - Permiso necesario para acceder
 * @returns Función middleware
 */
export declare function requierePermiso(permisoRequerido: string): (usuario: IUsuario) => boolean;
/**
 * Middleware para verificar roles en rutas/endpoints
 *
 * @param rolRequerido - Rol necesario para acceder
 * @returns Función middleware
 */
export declare function requiereRol(rolRequerido: string): (usuario: IUsuario) => boolean;
/**
 * Valida que un usuario pueda realizar una acción sobre una entidad específica
 *
 * @param usuario - Usuario que intenta realizar la acción
 * @param permiso - Permiso requerido
 * @param entidadId - ID de la entidad sobre la cual se realizará la acción
 * @returns true si puede realizar la acción, false en caso contrario
 */
export declare function puedeEnEntidad(usuario: IUsuario, permiso: string, entidadId: string): boolean;
/**
 * Obtiene las entidades a las que un usuario tiene acceso, filtradas por tipo
 *
 * @param usuario - Usuario del cual obtener entidades
 * @param tipo - Tipo de entidad a filtrar (opcional)
 * @returns Array de entidades accesibles
 */
export declare function obtenerEntidadesAccesibles(usuario: IUsuario, tipo?: string): Entidad[];
/**
 * Configuraciones predefinidas de roles del sistema
 */
export declare const CONFIGURACIONES_ROLES: {
    admin: {
        nombre: RolesPredefinidos;
        descripcion: string;
        permisos: Permisos[];
    };
    cajero: {
        nombre: RolesPredefinidos;
        descripcion: string;
        permisos: Permisos[];
    };
    vendedor: {
        nombre: RolesPredefinidos;
        descripcion: string;
        permisos: Permisos[];
    };
    cliente: {
        nombre: RolesPredefinidos;
        descripcion: string;
        permisos: Permisos[];
    };
    proveedor: {
        nombre: RolesPredefinidos;
        descripcion: string;
        permisos: Permisos[];
    };
    supervisor: {
        nombre: RolesPredefinidos;
        descripcion: string;
        permisos: Permisos[];
    };
    contador: {
        nombre: RolesPredefinidos;
        descripcion: string;
        permisos: Permisos[];
    };
};
/**
 * Crea un rol predefinido
 *
 * @param tipo - Tipo de rol predefinido
 * @param id - ID único para el rol
 * @returns Objeto Rol configurado
 */
export declare function crearRolPredefinido(tipo: RolesPredefinidos, id: string): Rol;
