/**
 * Sistema de Entidades y Roles para Retail
 *
 * @description Define la estructura base para manejar usuarios, roles y entidades
 * en un sistema de retail. Permite separar claramente entre:
 * - Usuario: cuenta digital con credenciales
 * - Entidad: contexto real (Cliente, Personal, Proveedor)
 * - Rol: permisos y capacidades en el sistema
 */
/**
 * Tipos de entidades disponibles en el sistema
 */
export type EntidadTipo = "Cliente" | "Personal" | "Proveedor";
/**
 * Interfaz base para todas las entidades del sistema
 *
 * @description Representa el "contexto real" de un usuario en el sistema
 * Una entidad puede ser un Cliente, Personal o Proveedor
 */
export interface Entidad {
    /** Identificador único de la entidad */
    id: string;
    /** Tipo de entidad que determina su comportamiento */
    tipoEntidad: EntidadTipo;
    /** Fecha de creación de la entidad */
    createdAt: Date;
    /** Fecha de última actualización */
    updatedAt: Date;
    /** Estado activo/inactivo de la entidad */
    activo: boolean;
}
/**
 * Interfaz para definir roles en el sistema
 *
 * @description Un rol define qué puede hacer un usuario dentro del sistema
 * Implementa Role-Based Access Control (RBAC)
 */
export interface Rol {
    /** Identificador único del rol */
    id: string;
    /** Nombre descriptivo del rol */
    nombre: string;
    /** Descripción del rol y sus responsabilidades */
    descripcion?: string;
    /** Lista de permisos que otorga este rol */
    permisos: string[];
    /** Indica si el rol está activo */
    activo: boolean;
    /** Fecha de creación del rol */
    fechaCreacion: Date;
}
/**
 * Tipos de permisos predefinidos en el sistema
 *
 * @description Define los permisos básicos que pueden ser asignados a roles
 * Formato: "recurso:acción"
 */
export declare enum Permisos {
    VENTAS_CREAR = "ventas:crear",
    VENTAS_VER = "ventas:ver",
    VENTAS_EDITAR = "ventas:editar",
    VENTAS_ELIMINAR = "ventas:eliminar",
    VENTAS_REPORTES = "ventas:reportes",
    PRODUCTOS_CREAR = "productos:crear",
    PRODUCTOS_VER = "productos:ver",
    PRODUCTOS_EDITAR = "productos:editar",
    PRODUCTOS_ELIMINAR = "productos:eliminar",
    PRODUCTOS_STOCK = "productos:stock",
    CLIENTES_CREAR = "clientes:crear",
    CLIENTES_VER = "clientes:ver",
    CLIENTES_EDITAR = "clientes:editar",
    CLIENTES_ELIMINAR = "clientes:eliminar",
    PERSONAL_CREAR = "personal:crear",
    PERSONAL_VER = "personal:ver",
    PERSONAL_EDITAR = "personal:editar",
    PERSONAL_ELIMINAR = "personal:eliminar",
    PROVEEDORES_CREAR = "proveedores:crear",
    PROVEEDORES_VER = "proveedores:ver",
    PROVEEDORES_EDITAR = "proveedores:editar",
    PROVEEDORES_ELIMINAR = "proveedores:eliminar",
    FINANZAS_VER = "finanzas:ver",
    FINANZAS_CREAR = "finanzas:crear",
    FINANZAS_EDITAR = "finanzas:editar",
    FINANZAS_REPORTES = "finanzas:reportes",
    SISTEMA_ADMIN = "sistema:admin",
    SISTEMA_CONFIGURACION = "sistema:configuracion",
    SISTEMA_USUARIOS = "sistema:usuarios",
    SISTEMA_ROLES = "sistema:roles",
    PERFIL_VER = "perfil:ver",
    PERFIL_EDITAR = "perfil:editar"
}
/**
 * Roles predefinidos del sistema
 */
export declare enum RolesPredefinidos {
    ADMIN = "admin",
    CAJERO = "cajero",
    VENDEDOR = "vendedor",
    CLIENTE = "cliente",
    PROVEEDOR = "proveedor",
    SUPERVISOR = "supervisor",
    CONTADOR = "contador"
}
/**
 * Interfaz para el contexto de sesión de un usuario
 *
 * @description Información que se mantiene durante la sesión activa
 */
export interface SesionContexto {
    /** Usuario autenticado */
    usuarioId: string;
    /** Entidad activa en la sesión (si tiene múltiples) */
    entidadActiva: Entidad;
    /** Roles activos en la sesión */
    rolesActivos: Rol[];
    /** Timestamp de inicio de sesión */
    inicioSesion: Date;
    /** Timestamp de última actividad */
    ultimaActividad: Date;
}
