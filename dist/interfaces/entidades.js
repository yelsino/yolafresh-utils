"use strict";
/**
 * Sistema de Entidades y Roles para Retail
 *
 * @description Define la estructura base para manejar usuarios, roles y entidades
 * en un sistema de retail. Permite separar claramente entre:
 * - Usuario: cuenta digital con credenciales
 * - Entidad: contexto real (Cliente, Personal, Proveedor)
 * - Rol: permisos y capacidades en el sistema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesPredefinidos = exports.Permisos = void 0;
/**
 * Tipos de permisos predefinidos en el sistema
 *
 * @description Define los permisos básicos que pueden ser asignados a roles
 * Formato: "recurso:acción"
 */
var Permisos;
(function (Permisos) {
    // Permisos de Ventas
    Permisos["VENTAS_CREAR"] = "ventas:crear";
    Permisos["VENTAS_VER"] = "ventas:ver";
    Permisos["VENTAS_EDITAR"] = "ventas:editar";
    Permisos["VENTAS_ELIMINAR"] = "ventas:eliminar";
    Permisos["VENTAS_REPORTES"] = "ventas:reportes";
    // Permisos de Productos
    Permisos["PRODUCTOS_CREAR"] = "productos:crear";
    Permisos["PRODUCTOS_VER"] = "productos:ver";
    Permisos["PRODUCTOS_EDITAR"] = "productos:editar";
    Permisos["PRODUCTOS_ELIMINAR"] = "productos:eliminar";
    Permisos["PRODUCTOS_STOCK"] = "productos:stock";
    // Permisos de Clientes
    Permisos["CLIENTES_CREAR"] = "clientes:crear";
    Permisos["CLIENTES_VER"] = "clientes:ver";
    Permisos["CLIENTES_EDITAR"] = "clientes:editar";
    Permisos["CLIENTES_ELIMINAR"] = "clientes:eliminar";
    // Permisos de Personal
    Permisos["PERSONAL_CREAR"] = "personal:crear";
    Permisos["PERSONAL_VER"] = "personal:ver";
    Permisos["PERSONAL_EDITAR"] = "personal:editar";
    Permisos["PERSONAL_ELIMINAR"] = "personal:eliminar";
    // Permisos de Proveedores
    Permisos["PROVEEDORES_CREAR"] = "proveedores:crear";
    Permisos["PROVEEDORES_VER"] = "proveedores:ver";
    Permisos["PROVEEDORES_EDITAR"] = "proveedores:editar";
    Permisos["PROVEEDORES_ELIMINAR"] = "proveedores:eliminar";
    // Permisos de Finanzas
    Permisos["FINANZAS_VER"] = "finanzas:ver";
    Permisos["FINANZAS_CREAR"] = "finanzas:crear";
    Permisos["FINANZAS_EDITAR"] = "finanzas:editar";
    Permisos["FINANZAS_REPORTES"] = "finanzas:reportes";
    // Permisos de Sistema
    Permisos["SISTEMA_ADMIN"] = "sistema:admin";
    Permisos["SISTEMA_CONFIGURACION"] = "sistema:configuracion";
    Permisos["SISTEMA_USUARIOS"] = "sistema:usuarios";
    Permisos["SISTEMA_ROLES"] = "sistema:roles";
    // Permisos de Perfil
    Permisos["PERFIL_VER"] = "perfil:ver";
    Permisos["PERFIL_EDITAR"] = "perfil:editar";
})(Permisos || (exports.Permisos = Permisos = {}));
/**
 * Roles predefinidos del sistema
 */
var RolesPredefinidos;
(function (RolesPredefinidos) {
    RolesPredefinidos["ADMIN"] = "admin";
    RolesPredefinidos["CAJERO"] = "cajero";
    RolesPredefinidos["VENDEDOR"] = "vendedor";
    RolesPredefinidos["CLIENTE"] = "cliente";
    RolesPredefinidos["PROVEEDOR"] = "proveedor";
    RolesPredefinidos["SUPERVISOR"] = "supervisor";
    RolesPredefinidos["CONTADOR"] = "contador";
})(RolesPredefinidos || (exports.RolesPredefinidos = RolesPredefinidos = {}));
