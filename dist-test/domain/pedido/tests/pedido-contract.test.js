"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
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
