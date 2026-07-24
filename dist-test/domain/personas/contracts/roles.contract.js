"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesPredefinidos = void 0;
/**
 * Roles predefinidos oficiales del sistema.
 *
 * Representan seeds/helpers iniciales de RBAC.
 * No limitan la creación de roles personalizados en apps consumidoras.
 */
var RolesPredefinidos;
(function (RolesPredefinidos) {
    RolesPredefinidos["ADMIN"] = "admin";
    RolesPredefinidos["SUPERVISOR"] = "supervisor";
    RolesPredefinidos["CAJERO"] = "cajero";
    RolesPredefinidos["VENTAS"] = "ventas";
    RolesPredefinidos["OPERACIONES"] = "operaciones";
    RolesPredefinidos["INVENTARIO"] = "inventario";
    RolesPredefinidos["COMPRAS"] = "compras";
    RolesPredefinidos["FINANZAS"] = "finanzas";
    RolesPredefinidos["VENDEDOR"] = "vendedor";
    RolesPredefinidos["CONTADOR"] = "contador";
    RolesPredefinidos["AUDITOR"] = "auditor";
    RolesPredefinidos["SOPORTE_TECNICO"] = "soporte-tecnico";
    RolesPredefinidos["SOLO_LECTURA"] = "solo-lectura";
})(RolesPredefinidos || (exports.RolesPredefinidos = RolesPredefinidos = {}));
