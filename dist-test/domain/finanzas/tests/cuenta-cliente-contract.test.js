"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
(0, node_test_1.default)("RecepcionCobroCliente admite código de constancia", () => {
    const recepcion = {
        id: "recepcion_001",
        codigoConstancia: "CONST-2026-0001",
        clienteId: "cliente_001",
        monto: 100,
        moneda: "PEN",
        metodoPago: "EFECTIVO",
        creadoPorId: "usuario_001",
        estado: "RECIBIDO",
        idempotencyKey: "recepcion:001",
        createdAt: new Date("2026-07-22T10:00:00.000Z"),
    };
    strict_1.default.equal(recepcion.codigoConstancia, "CONST-2026-0001");
});
