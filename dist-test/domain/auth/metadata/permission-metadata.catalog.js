"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_METADATA = void 0;
const permission_catalog_1 = require("../catalogs/permission.catalog");
const CRITICIDAD_POR_ACCION = {
    ver: "low",
    crear: "medium",
    exportar: "medium",
    editar: "high",
    editar_imagen: "high",
    asignar: "high",
    aprobar: "high",
    anular: "high",
    activar: "high",
    desactivar: "high",
    cerrar: "high",
    abrir: "high",
    global: "critical",
    enrolar: "high",
    revocar: "critical",
    configurar: "high",
    actualizar: "high",
    enviar: "high",
    confirmar: "high",
    abandonar: "high",
    liberar_incidencia: "critical",
    cobrar: "critical",
    configurar_redondeo: "high",
    administrar: "critical",
    recibir: "high",
    cancelar: "critical",
};
const PERMISSION_METADATA_OVERRIDES = {
    "sistema:admin:global": {
        criticidad: "critical",
        auditable: true,
        requiresActiveSession: true,
        uiVisible: false,
    },
    "iam:usuario:activar": {
        criticidad: "critical",
    },
    "iam:usuario:desactivar": {
        criticidad: "critical",
    },
    "iam:rol:asignar": {
        criticidad: "critical",
    },
    "iam:dispositivo:aprobar": {
        criticidad: "critical",
    },
    "caja:movimiento:anular": {
        criticidad: "critical",
    },
    "ventas:venta:anular": {
        criticidad: "critical",
    },
    "ventas:pedido:anular": {
        criticidad: "critical",
    },
    "inventario:ajuste:aprobar": {
        criticidad: "critical",
    },
    "inventario:almacen:administrar": {
        criticidad: "critical",
    },
    "inventario:politica:administrar": {
        criticidad: "critical",
    },
    "inventario:merma:aprobar": {
        criticidad: "critical",
    },
    "inventario:transferencia:cancelar": {
        criticidad: "critical",
    },
    "restaurante:sesion:liberar_incidencia": {
        criticidad: "critical",
    },
    "restaurante:cuenta:cobrar": {
        criticidad: "critical",
    },
};
function buildPermissionDefinition(id) {
    var _a, _b;
    const [modulo, recurso, accion] = id.split(":");
    const override = (_a = PERMISSION_METADATA_OVERRIDES[id]) !== null && _a !== void 0 ? _a : {};
    return {
        id,
        modulo,
        recurso,
        accion,
        criticidad: (_b = CRITICIDAD_POR_ACCION[accion]) !== null && _b !== void 0 ? _b : "medium",
        requiresActiveSession: true,
        auditable: true,
        uiVisible: true,
        ...override,
    };
}
exports.PERMISSION_METADATA = Object.freeze(permission_catalog_1.AUTH_PERMISSIONS.reduce((acc, permission) => {
    acc[permission] = buildPermissionDefinition(permission);
    return acc;
}, {}));
