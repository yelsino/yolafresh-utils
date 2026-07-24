"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const auth_catalog_version_1 = require("../version/auth-catalog.version");
const expand_grant_1 = require("../helpers/expand-grant");
const expand_grants_1 = require("../helpers/expand-grants");
const get_catalog_version_1 = require("../helpers/get-catalog-version");
const get_permission_definition_1 = require("../helpers/get-permission-definition");
const get_role_definition_1 = require("../helpers/get-role-definition");
const is_system_admin_role_1 = require("../helpers/is-system-admin-role");
const is_valid_grant_1 = require("../helpers/is-valid-grant");
const is_valid_permission_1 = require("../helpers/is-valid-permission");
const list_all_permissions_1 = require("../helpers/list-all-permissions");
const list_all_roles_1 = require("../helpers/list-all-roles");
const resolve_role_grants_1 = require("../helpers/resolve-role-grants");
const resolve_role_permissions_1 = require("../helpers/resolve-role-permissions");
const permission_catalog_1 = require("../catalogs/permission.catalog");
(0, node_test_1.default)("expandGrant devuelve permiso atómico sin alterar", () => {
    strict_1.default.deepEqual((0, expand_grant_1.expandGrant)("ventas:venta:ver"), ["ventas:venta:ver"]);
});
(0, node_test_1.default)("expandGrant expande alias de módulo y wildcard total", () => {
    const ventas = (0, expand_grant_1.expandGrant)("ventas:*");
    const all = (0, expand_grant_1.expandGrant)("*");
    strict_1.default.ok(ventas.includes("ventas:venta:ver"));
    strict_1.default.ok(ventas.includes("ventas:pedido:aprobar"));
    strict_1.default.equal(all.length, permission_catalog_1.AUTH_PERMISSIONS.length);
});
(0, node_test_1.default)("expandGrants deduplica permisos", () => {
    const expanded = (0, expand_grants_1.expandGrants)(["ventas:*", "ventas:venta:ver"]);
    const matches = expanded.filter((permission) => permission === "ventas:venta:ver");
    strict_1.default.equal(matches.length, 1);
});
(0, node_test_1.default)("getRoleDefinition y resolveRolePermissions resuelven roles base", () => {
    const supervisor = (0, get_role_definition_1.getRoleDefinition)("supervisor");
    const grants = (0, resolve_role_grants_1.resolveRoleGrants)(["supervisor"]);
    const permissions = (0, resolve_role_permissions_1.resolveRolePermissions)(["supervisor"]);
    strict_1.default.ok(supervisor);
    strict_1.default.ok(grants.includes("ventas:*"));
    strict_1.default.ok(permissions.includes("ventas:venta:ver"));
    strict_1.default.ok(permissions.includes("inventario:stock:ver"));
});
(0, node_test_1.default)("cliente es un rol oficial sin permisos del ERP", () => {
    const cliente = (0, get_role_definition_1.getRoleDefinition)("cliente");
    strict_1.default.ok(cliente);
    strict_1.default.equal(cliente.id, "cliente");
    strict_1.default.deepEqual(cliente.grants, []);
    strict_1.default.deepEqual((0, resolve_role_permissions_1.resolveRolePermissions)(["cliente"]), []);
});
(0, node_test_1.default)("admin global resuelve wildcard total", () => {
    const permissions = (0, resolve_role_permissions_1.resolveRolePermissions)(["admin"]);
    strict_1.default.equal((0, is_system_admin_role_1.isSystemAdminRole)(["admin"]), true);
    strict_1.default.equal(permissions.length, permission_catalog_1.AUTH_PERMISSIONS.length);
});
(0, node_test_1.default)("validadores detectan permiso y grant inválidos", () => {
    strict_1.default.equal((0, is_valid_permission_1.isValidPermission)("ventas:venta:ver"), true);
    strict_1.default.equal((0, is_valid_permission_1.isValidPermission)("ventas:sucursal-lima:ver"), false);
    strict_1.default.equal((0, is_valid_grant_1.isValidGrant)("ventas:*"), true);
    strict_1.default.equal((0, is_valid_grant_1.isValidGrant)("ventas:sucursal-lima:*"), false);
});
(0, node_test_1.default)("getCatalogVersion expone versión vigente", () => {
    strict_1.default.equal((0, get_catalog_version_1.getCatalogVersion)(), auth_catalog_version_1.AUTH_CATALOG_VERSION);
});
(0, node_test_1.default)("helpers de listado y metadata exponen catálogo oficial", () => {
    const allPermissions = (0, list_all_permissions_1.listAllPermissions)();
    const allRoles = (0, list_all_roles_1.listAllRoles)();
    const permissionDefinition = (0, get_permission_definition_1.getPermissionDefinition)("ventas:venta:ver");
    strict_1.default.equal(allPermissions.length, permission_catalog_1.AUTH_PERMISSIONS.length);
    strict_1.default.ok(allRoles.some((role) => role.id === "admin"));
    strict_1.default.equal(permissionDefinition === null || permissionDefinition === void 0 ? void 0 : permissionDefinition.id, "ventas:venta:ver");
    strict_1.default.equal(permissionDefinition === null || permissionDefinition === void 0 ? void 0 : permissionDefinition.modulo, "ventas");
});
