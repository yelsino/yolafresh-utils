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
    RolesPredefinidos["GASTRONOMIA_ANFITRION"] = "gastronomia-anfitrion";
    RolesPredefinidos["GASTRONOMIA_MESERO"] = "gastronomia-mesero";
    RolesPredefinidos["GASTRONOMIA_CAPITAN_SALON"] = "gastronomia-capitan-salon";
    RolesPredefinidos["GASTRONOMIA_COCINERO"] = "gastronomia-cocinero";
    RolesPredefinidos["GASTRONOMIA_JEFE_COCINA"] = "gastronomia-jefe-cocina";
    RolesPredefinidos["GASTRONOMIA_BARRA"] = "gastronomia-barra";
})(RolesPredefinidos || (exports.RolesPredefinidos = RolesPredefinidos = {}));
