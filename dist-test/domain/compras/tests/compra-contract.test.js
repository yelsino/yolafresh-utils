"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const enums_1 = require("../../shared/kernel/enums");
const compra_contract_1 = require("../contracts/compra.contract");
const Compra_1 = require("../entities/Compra");
function buildCompraInput(overrides = {}) {
    return {
        id: "compra_001",
        eventoCompraId: "evento_001",
        proveedorId: "proveedor_001",
        tipoDocumento: compra_contract_1.TipoDocumentoCompraEnum.FACTURA,
        fechaDocumento: 1775000000000,
        fechaRegistro: 1775000000000,
        moneda: "PEN",
        subtotal: 24,
        total: 24,
        estadoPago: enums_1.EstadoPagoEnum.PENDIENTE,
        estado: compra_contract_1.EstadoCompraEnum.BORRADOR,
        items: [
            {
                id: "item_001",
                compraId: "compra_001",
                nombreItem: "Caja x12",
                cantidad: 2,
                costoUnitario: 12,
                costoTotal: 24,
                afectaInventario: true,
                presentacionId: "presentacion_caja_12",
                productoBaseId: "producto_001",
                factorUnidadBase: 12,
                unidadBaseInventario: "unidad",
                versionConversion: 3,
            },
        ],
        createdAt: 1775000000000,
        updatedAt: 1775000000000,
        ...overrides,
    };
}
(0, node_test_1.default)("Compra conserva el snapshot de conversión del item inventariable", () => {
    const compra = new Compra_1.Compra(buildCompraInput());
    const item = compra.toJSON().items[0];
    strict_1.default.equal(item.afectaInventario, true);
    if (!item.afectaInventario) {
        strict_1.default.fail("El item debía ser inventariable");
    }
    strict_1.default.equal(item.presentacionId, "presentacion_caja_12");
    strict_1.default.equal(item.productoBaseId, "producto_001");
    strict_1.default.equal(item.factorUnidadBase, 12);
    strict_1.default.equal(item.unidadBaseInventario, "unidad");
    strict_1.default.equal(item.versionConversion, 3);
});
(0, node_test_1.default)("Compra rechaza item físico sin unidad base congelada", () => {
    const input = buildCompraInput();
    const item = {
        ...input.items[0],
        unidadBaseInventario: undefined,
    };
    strict_1.default.throws(() => new Compra_1.Compra({
        ...input,
        items: [item],
    }), /unidadBaseInventario inválida/);
});
(0, node_test_1.default)("Compra exige versionConversion entera segura positiva", () => {
    for (const versionConversion of [
        undefined,
        0,
        -1,
        1.5,
        Number.MAX_SAFE_INTEGER + 1,
    ]) {
        const input = buildCompraInput();
        const item = { ...input.items[0], versionConversion };
        strict_1.default.throws(() => new Compra_1.Compra({
            ...input,
            items: [item],
        }), /versionConversion inválida: debe ser un entero seguro positivo/);
    }
});
(0, node_test_1.default)("Compra acepta item no inventariable sin metadatos físicos", () => {
    const compra = new Compra_1.Compra(buildCompraInput({
        subtotal: 15,
        total: 15,
        items: [
            {
                id: "item_servicio_001",
                compraId: "compra_001",
                nombreItem: "Servicio de transporte",
                cantidad: 1,
                costoUnitario: 15,
                costoTotal: 15,
                afectaInventario: false,
            },
        ],
    }));
    strict_1.default.equal(compra.toJSON().items[0].afectaInventario, false);
});
