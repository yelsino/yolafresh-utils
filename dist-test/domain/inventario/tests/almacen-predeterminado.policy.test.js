"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const contracts_1 = require("../contracts");
const services_1 = require("../services");
const warehouse = (id, activo = true) => ({
    _id: id,
    type: "almacen",
    nombre: `Almacén ${id}`,
    tipo: contracts_1.TipoAlmacenEnum.TIENDA,
    activo,
    permitirLotes: true,
    permitirNegativos: false,
    createdAt: 1,
    updatedAt: 1,
});
(0, node_test_1.default)("sin almacenes disponibles no inventa una selección", () => {
    const result = (0, services_1.resolverAlmacenPredeterminado)([]);
    strict_1.default.equal(result.almacenId, null);
    strict_1.default.equal(result.origen, "SIN_ALMACENES");
    strict_1.default.equal(result.requiereSeleccion, false);
});
(0, node_test_1.default)("un único almacén activo se deriva automáticamente", () => {
    const result = (0, services_1.resolverAlmacenPredeterminado)([
        warehouse("activo"),
        warehouse("inactivo", false),
    ]);
    strict_1.default.equal(result.almacenId, "activo");
    strict_1.default.equal(result.origen, "UNICO_DISPONIBLE");
    strict_1.default.equal(result.requiereSeleccion, false);
});
(0, node_test_1.default)("varios almacenes sin configuración requieren selección explícita", () => {
    const result = (0, services_1.resolverAlmacenPredeterminado)([
        warehouse("uno"),
        warehouse("dos"),
    ]);
    strict_1.default.equal(result.almacenId, null);
    strict_1.default.equal(result.origen, "SELECCION_REQUERIDA");
    strict_1.default.equal(result.requiereSeleccion, true);
});
(0, node_test_1.default)("varios almacenes usan exclusivamente la referencia configurada", () => {
    const result = (0, services_1.resolverAlmacenPredeterminado)([warehouse("uno"), warehouse("dos")], "dos");
    strict_1.default.equal(result.almacenId, "dos");
    strict_1.default.equal(result.origen, "CONFIGURADO");
    strict_1.default.equal(result.requiereSeleccion, false);
});
(0, node_test_1.default)("una referencia inactiva o inexistente falla cerrada", () => {
    const result = (0, services_1.resolverAlmacenPredeterminado)([warehouse("uno"), warehouse("dos"), warehouse("viejo", false)], "viejo");
    strict_1.default.equal(result.almacenId, null);
    strict_1.default.equal(result.origen, "SELECCION_REQUERIDA");
    strict_1.default.equal(result.configuracionInvalida, true);
});
