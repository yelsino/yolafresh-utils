"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
(0, node_test_1.default)("root export publica surface auth esperada", () => {
    // Self-reference prueba export real del paquete compilado.
    const pkg = require("yola-fresh-utils");
    strict_1.default.ok(Array.isArray(pkg.AUTH_PERMISSIONS));
    strict_1.default.ok(typeof pkg.AUTH_ROLE_DEFINITIONS === "object");
    strict_1.default.ok(typeof pkg.PERMISSION_METADATA === "object");
    strict_1.default.equal(typeof pkg.expandGrant, "function");
    strict_1.default.equal(typeof pkg.expandGrants, "function");
    strict_1.default.equal(typeof pkg.resolveRoleGrants, "function");
    strict_1.default.equal(typeof pkg.resolveRolePermissions, "function");
    strict_1.default.equal(typeof pkg.getPermissionDefinition, "function");
    strict_1.default.equal(typeof pkg.getCatalogVersion, "function");
    strict_1.default.equal(typeof pkg.listAllPermissions, "function");
    strict_1.default.equal(typeof pkg.listAllRoles, "function");
});
(0, node_test_1.default)("subpath auth publica misma surface base", () => {
    const authPkg = require("yola-fresh-utils/auth");
    strict_1.default.ok(Array.isArray(authPkg.AUTH_PERMISSIONS));
    strict_1.default.ok(typeof authPkg.AUTH_ROLE_DEFINITIONS === "object");
    strict_1.default.ok(typeof authPkg.PERMISSION_METADATA === "object");
    strict_1.default.equal(typeof authPkg.expandGrant, "function");
    strict_1.default.equal(typeof authPkg.expandGrants, "function");
    strict_1.default.equal(typeof authPkg.resolveRoleGrants, "function");
    strict_1.default.equal(typeof authPkg.resolveRolePermissions, "function");
    strict_1.default.equal(typeof authPkg.getPermissionDefinition, "function");
    strict_1.default.equal(typeof authPkg.getCatalogVersion, "function");
    strict_1.default.equal(typeof authPkg.listAllPermissions, "function");
    strict_1.default.equal(typeof authPkg.listAllRoles, "function");
});
(0, node_test_1.default)("root y subpath auth comparten versión de catálogo", () => {
    const pkg = require("yola-fresh-utils");
    const authPkg = require("yola-fresh-utils/auth");
    strict_1.default.equal(pkg.AUTH_CATALOG_VERSION, authPkg.AUTH_CATALOG_VERSION);
});
