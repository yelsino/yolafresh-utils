"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const pedido_contract_1 = require("../contracts/pedido.contract");
const producto_contract_1 = require("../../inventario/contracts/producto.contract");
(0, node_test_1.default)("PedidoItem conserva snapshot visual y señal de monto modificado", () => {
    const item = {
        id: "pedido_item_001",
        presentacionId: "pres_001",
        nombre: "Café americano",
        cantidadSolicitada: 2,
        cantidadAtendida: 1,
        precioUnitario: 8,
        subtotal: 16,
        montoModificado: true,
        unidadComercial: "taza",
        imagenUrl: "cafe-americano.jpg",
    };
    strict_1.default.equal(item.nombre, "Café americano");
    strict_1.default.equal(item.montoModificado, true);
    strict_1.default.equal(item.unidadComercial, "taza");
    strict_1.default.equal(item.imagenUrl, "cafe-americano.jpg");
});
(0, node_test_1.default)("PedidoItem schema 3 congela la decision y conversion de inventario", () => {
    const inventariable = {
        id: "pedido_item_stock",
        presentacionId: "pres_stock",
        nombre: "Arroz saco",
        cantidadSolicitada: 2,
        cantidadAtendida: 0,
        precioUnitario: 80,
        subtotal: 160,
        afectaInventario: true,
        tipoVenta: producto_contract_1.TipoVentaEnum.Unidad,
        productoBaseId: "producto_arroz",
        factorUnidadBase: 50,
        unidadBaseInventario: "kilogramo",
        versionConversion: 4,
    };
    const servicio = {
        id: "pedido_item_servicio",
        presentacionId: "servicio_delivery",
        nombre: "Delivery",
        cantidadSolicitada: 1,
        cantidadAtendida: 0,
        precioUnitario: 5,
        subtotal: 5,
        afectaInventario: false,
        tipoVenta: producto_contract_1.TipoVentaEnum.Unidad,
    };
    strict_1.default.equal(inventariable.afectaInventario, true);
    strict_1.default.equal(inventariable.factorUnidadBase, 50);
    strict_1.default.equal(inventariable.versionConversion, 4);
    strict_1.default.equal(servicio.afectaInventario, false);
    strict_1.default.equal(servicio.productoBaseId, undefined);
});
(0, node_test_1.default)("Pedido conserva checklist colaborativo, confirmacion y auditoria por actor", () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const changedAt = new Date("2026-08-21T20:15:00.000Z");
    const pedido = {
        id: "pedido_001",
        type: "pedido",
        schemaVersion: pedido_contract_1.PEDIDO_DOCUMENT_SCHEMA_VERSION,
        codigoPedido: "PED-001",
        estado: "ABIERTO",
        prioridad: "NORMAL",
        creadoPorId: "usuario_creador",
        fechaPedido: changedAt,
        items: [
            {
                id: "pedido_item_001",
                presentacionId: "pres_001",
                nombre: "Café americano",
                cantidadSolicitada: 2,
                cantidadAtendida: 0,
                precioUnitario: 8,
                subtotal: 16,
                afectaInventario: true,
                tipoVenta: producto_contract_1.TipoVentaEnum.Unidad,
                productoBaseId: "producto_cafe",
                factorUnidadBase: 1,
                unidadBaseInventario: "unidad",
                versionConversion: 1,
                checklist: {
                    marcado: true,
                    actualizadoPorId: "usuario_prepara",
                    actualizadoPorNombre: "Ana",
                    dispositivoId: "tablet-cocina",
                    actualizadoAt: changedAt,
                    revision: 1,
                },
            },
        ],
        checklist: {
            estado: "COMPLETADO",
            completado: true,
            version: 2,
            actualizadoAt: changedAt,
            confirmadoAt: changedAt,
            confirmadoPorId: "usuario_prepara",
            confirmadoPorNombre: "Ana",
            confirmadoDesdeDispositivoId: "tablet-cocina",
            historial: [
                {
                    id: "operation-001",
                    operacionId: "pedido-operation-001",
                    comandoHash: "sha256-command-001",
                    accion: "ITEM_MARCADO",
                    itemId: "pedido_item_001",
                    marcado: true,
                    usuarioId: "usuario_prepara",
                    usuarioNombre: "Ana",
                    dispositivoId: "tablet-cocina",
                    fecha: changedAt,
                },
            ],
        },
        subtotal: 16,
        total: 16,
        createdAt: changedAt,
        updatedAt: changedAt,
    };
    strict_1.default.equal(pedido.schemaVersion, 3);
    strict_1.default.equal((_b = (_a = pedido.items[0]) === null || _a === void 0 ? void 0 : _a.checklist) === null || _b === void 0 ? void 0 : _b.actualizadoPorNombre, "Ana");
    strict_1.default.equal((_c = pedido.checklist) === null || _c === void 0 ? void 0 : _c.completado, true);
    strict_1.default.equal((_e = (_d = pedido.checklist) === null || _d === void 0 ? void 0 : _d.historial[0]) === null || _e === void 0 ? void 0 : _e.accion, "ITEM_MARCADO");
    strict_1.default.equal((_g = (_f = pedido.checklist) === null || _f === void 0 ? void 0 : _f.historial[0]) === null || _g === void 0 ? void 0 : _g.operacionId, "pedido-operation-001");
    strict_1.default.equal((_j = (_h = pedido.checklist) === null || _h === void 0 ? void 0 : _h.historial[0]) === null || _j === void 0 ? void 0 : _j.comandoHash, "sha256-command-001");
    // Una cantidad atendida cero es valida: significa sin disponibilidad, no
    // que la linea haya quedado sin revisar.
    strict_1.default.equal((_k = pedido.items[0]) === null || _k === void 0 ? void 0 : _k.cantidadAtendida, 0);
});
