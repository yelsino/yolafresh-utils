"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const permission_alias_catalog_1 = require("../catalogs/permission-alias.catalog");
const permission_catalog_1 = require("../catalogs/permission.catalog");
const permission_metadata_catalog_1 = require("../metadata/permission-metadata.catalog");
const AUTH_PERMISSION_SET = new Set(permission_catalog_1.AUTH_PERMISSIONS);
(0, node_test_1.default)("AUTH_PERMISSIONS no tiene colisiones", () => {
    const uniquePermissions = new Set(permission_catalog_1.AUTH_PERMISSIONS);
    strict_1.default.equal(uniquePermissions.size, permission_catalog_1.AUTH_PERMISSIONS.length);
});
(0, node_test_1.default)("todo permiso tiene metadata completa", () => {
    for (const permission of permission_catalog_1.AUTH_PERMISSIONS) {
        const metadata = permission_metadata_catalog_1.PERMISSION_METADATA[permission];
        strict_1.default.ok(metadata, `Falta metadata para ${permission}`);
        strict_1.default.equal(metadata.id, permission);
        strict_1.default.ok(metadata.modulo.length > 0);
        strict_1.default.ok(metadata.recurso.length > 0);
        strict_1.default.ok(metadata.accion.length > 0);
        strict_1.default.ok(["low", "medium", "high", "critical"].includes(metadata.criticidad));
    }
});
(0, node_test_1.default)("aliases canónicos expanden solo a permisos válidos", () => {
    for (const [alias, permissions] of Object.entries(permission_alias_catalog_1.AUTH_PERMISSION_ALIASES)) {
        strict_1.default.ok(permissions.length > 0, `Alias ${alias} no debe expandir vacío`);
        for (const permission of permissions) {
            strict_1.default.ok(AUTH_PERMISSION_SET.has(permission), `${alias} expandió permiso inválido ${permission}`);
        }
    }
});
(0, node_test_1.default)("wildcard global expande a catálogo completo", () => {
    strict_1.default.deepEqual([...permission_alias_catalog_1.AUTH_PERMISSION_ALIASES["*"]], [...permission_catalog_1.AUTH_PERMISSIONS]);
});
