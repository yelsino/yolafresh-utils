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
(0, node_test_1.default)("catalogo gastronomico separa salon, cocina, barra y caja", () => {
    strict_1.default.ok(AUTH_PERMISSION_SET.has("restaurante:pedido:editar"));
    strict_1.default.ok(AUTH_PERMISSION_SET.has("restaurante:preparacion_cocina:actualizar"));
    strict_1.default.ok(AUTH_PERMISSION_SET.has("restaurante:preparacion_barra:actualizar"));
    strict_1.default.ok(AUTH_PERMISSION_SET.has("restaurante:cuenta:cobrar"));
    strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA["restaurante:cuenta:cobrar"].criticidad, "critical");
});
(0, node_test_1.default)("pedido comercial separa edición, aprobación y anulación", () => {
    strict_1.default.ok(AUTH_PERMISSION_SET.has("ventas:pedido:editar"));
    strict_1.default.ok(AUTH_PERMISSION_SET.has("ventas:pedido:aprobar"));
    strict_1.default.ok(AUTH_PERMISSION_SET.has("ventas:pedido:anular"));
    strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA["ventas:pedido:anular"].criticidad, "critical");
});
(0, node_test_1.default)("administrar almacenes es un permiso crítico y auditable", () => {
    const permission = "inventario:almacen:administrar";
    strict_1.default.ok(AUTH_PERMISSION_SET.has(permission));
    strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA[permission].criticidad, "critical");
    strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA[permission].auditable, true);
    strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA[permission].requiresActiveSession, true);
});
(0, node_test_1.default)("operaciones de inventario tienen permisos atomicos y metadata auditable", () => {
    const esperados = [
        "inventario:politica:administrar",
        "inventario:merma:ver",
        "inventario:merma:crear",
        "inventario:merma:aprobar",
        "inventario:transferencia:ver",
        "inventario:transferencia:crear",
        "inventario:transferencia:enviar",
        "inventario:transferencia:recibir",
        "inventario:transferencia:cancelar",
    ];
    for (const permission of esperados) {
        strict_1.default.ok(AUTH_PERMISSION_SET.has(permission));
        strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA[permission].auditable, true);
        strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA[permission].requiresActiveSession, true);
    }
    strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA["inventario:politica:administrar"].criticidad, "critical");
    strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA["inventario:merma:aprobar"].criticidad, "critical");
    strict_1.default.equal(permission_metadata_catalog_1.PERMISSION_METADATA["inventario:transferencia:cancelar"].criticidad, "critical");
});
