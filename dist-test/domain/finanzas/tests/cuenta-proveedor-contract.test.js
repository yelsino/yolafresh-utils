"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const cuenta_proveedor_service_1 = require("../services/cuenta-proveedor.service");
const at = (day) => new Date(`2026-08-${String(day).padStart(2, "0")}T10:00:00.000Z`);
const cuenta = {
    id: "cuenta-proveedor-1",
    proveedorId: "proveedor-1",
    estado: "ACTIVA",
    moneda: "PEN",
    aperturaAt: at(1),
    createdAt: at(1),
    updatedAt: at(1),
};
const movimiento = (input) => ({
    cuentaId: cuenta.id,
    proveedorId: cuenta.proveedorId,
    moneda: cuenta.moneda,
    tipoOrigen: input.tipo === "COMPRA" ? "COMPRA" : "PAGO_PROVEEDOR",
    origenId: `origen-${input.id}`,
    estado: "CONTABILIZADO",
    idempotencyKey: `idem-${input.id}`,
    creadoPorId: "usuario-1",
    occurredAt: at(2),
    createdAt: at(2),
    ...input,
});
(0, node_test_1.default)("reconstruye deuda, pago parcial y saldo no aplicado", () => {
    const compra = movimiento({
        id: "compra-1",
        tipo: "COMPRA",
        direccion: "CREDITO",
        monto: 100,
    });
    const pago = movimiento({
        id: "pago-1",
        tipo: "PAGO",
        direccion: "DEBITO",
        monto: 70,
        createdAt: at(3),
        occurredAt: at(3),
    });
    const imputacion = {
        id: "imputacion-1",
        cuentaId: cuenta.id,
        proveedorId: cuenta.proveedorId,
        tipo: "APLICACION",
        movimientoOrigenId: pago.id,
        movimientoDestinoId: compra.id,
        monto: 60,
        moneda: "PEN",
        estrategia: "EXPLICITA",
        createdAt: at(3),
    };
    const resumen = (0, cuenta_proveedor_service_1.reconstruirResumenCuentaProveedor)({
        cuenta,
        movimientos: [pago, compra],
        imputaciones: [imputacion],
        reconstruidaAt: at(4),
    });
    strict_1.default.equal(resumen.saldoPorPagar, 40);
    strict_1.default.equal(resumen.saldoFavorNegocio, 10);
    strict_1.default.equal(resumen.saldoDebitoNoAplicado, 10);
});
(0, node_test_1.default)("reversa de imputacion resta la aplicacion sin borrar historia", () => {
    const compra = movimiento({
        id: "compra-1",
        tipo: "COMPRA",
        direccion: "CREDITO",
        monto: 100,
    });
    const pago = movimiento({
        id: "pago-1",
        tipo: "PAGO",
        direccion: "DEBITO",
        monto: 100,
    });
    const aplicacion = {
        id: "aplicacion-1",
        cuentaId: cuenta.id,
        proveedorId: cuenta.proveedorId,
        tipo: "APLICACION",
        movimientoOrigenId: pago.id,
        movimientoDestinoId: compra.id,
        monto: 100,
        moneda: "PEN",
        estrategia: "EXPLICITA",
        createdAt: at(3),
    };
    const reversa = {
        ...aplicacion,
        id: "reversa-1",
        tipo: "REVERSA",
        monto: 25,
        reversaDeImputacionId: aplicacion.id,
        createdAt: at(4),
    };
    const resumen = (0, cuenta_proveedor_service_1.reconstruirResumenCuentaProveedor)({
        cuenta,
        movimientos: [compra, pago],
        imputaciones: [reversa, aplicacion],
    });
    strict_1.default.equal(resumen.saldoPorPagar, 25);
    strict_1.default.equal(resumen.saldoFavorNegocio, 25);
});
(0, node_test_1.default)("reversa contable cancela el movimiento y libera sus imputaciones", () => {
    const compra = movimiento({
        id: "compra-1",
        tipo: "COMPRA",
        direccion: "CREDITO",
        monto: 100,
    });
    const pago = movimiento({
        id: "pago-1",
        tipo: "PAGO",
        direccion: "DEBITO",
        monto: 100,
        createdAt: at(3),
        occurredAt: at(3),
    });
    const reversaPago = movimiento({
        id: "reversa-pago-1",
        tipo: "REVERSA",
        tipoOrigen: "REVERSA",
        origenId: pago.id,
        direccion: "CREDITO",
        monto: 100,
        reversaDeMovimientoId: pago.id,
        createdAt: at(4),
        occurredAt: at(4),
    });
    const aplicacion = {
        id: "aplicacion-1",
        cuentaId: cuenta.id,
        proveedorId: cuenta.proveedorId,
        tipo: "APLICACION",
        movimientoOrigenId: pago.id,
        movimientoDestinoId: compra.id,
        monto: 100,
        moneda: "PEN",
        estrategia: "EXPLICITA",
        createdAt: at(3),
    };
    const resumen = (0, cuenta_proveedor_service_1.reconstruirResumenCuentaProveedor)({
        cuenta,
        movimientos: [compra, pago, reversaPago],
        imputaciones: [aplicacion],
    });
    strict_1.default.equal(resumen.saldoPorPagar, 100);
    strict_1.default.equal(resumen.saldoFavorNegocio, 0);
    strict_1.default.equal(resumen.cantidadMovimientosFuente, 3);
    strict_1.default.equal(resumen.cantidadImputacionesFuente, 0);
});
(0, node_test_1.default)("planifica FIFO estable y conserva excedente como saldo a favor", () => {
    const compra1 = movimiento({
        id: "compra-1",
        tipo: "COMPRA",
        direccion: "CREDITO",
        monto: 30,
        createdAt: at(2),
    });
    const compra2 = movimiento({
        id: "compra-2",
        tipo: "COMPRA",
        direccion: "CREDITO",
        monto: 50,
        createdAt: at(3),
    });
    const pago = movimiento({
        id: "pago-1",
        tipo: "PAGO",
        direccion: "DEBITO",
        monto: 100,
        createdAt: at(4),
    });
    const imputaciones = (0, cuenta_proveedor_service_1.planificarImputacionesCuentaProveedorFifo)({
        cuenta,
        movimientoOrigen: pago,
        movimientos: [compra2, pago, compra1],
        imputaciones: [],
        createdAt: at(4),
        idFactory: (index) => `fifo-${index}`,
    });
    strict_1.default.deepEqual(imputaciones.map((item) => [item.movimientoDestinoId, item.monto]), [
        ["compra-1", 30],
        ["compra-2", 50],
    ]);
    const resumen = (0, cuenta_proveedor_service_1.reconstruirResumenCuentaProveedor)({
        cuenta,
        movimientos: [compra1, compra2, pago],
        imputaciones,
    });
    strict_1.default.equal(resumen.saldoPorPagar, 0);
    strict_1.default.equal(resumen.saldoFavorNegocio, 20);
});
(0, node_test_1.default)("rechaza sobreaplicacion y moneda incompatible", () => {
    const compra = movimiento({
        id: "compra-1",
        tipo: "COMPRA",
        direccion: "CREDITO",
        monto: 10,
    });
    const pago = movimiento({
        id: "pago-1",
        tipo: "PAGO",
        direccion: "DEBITO",
        monto: 20,
    });
    const imputacion = {
        id: "imputacion-1",
        cuentaId: cuenta.id,
        proveedorId: cuenta.proveedorId,
        tipo: "APLICACION",
        movimientoOrigenId: pago.id,
        movimientoDestinoId: compra.id,
        monto: 11,
        moneda: "PEN",
        estrategia: "EXPLICITA",
        createdAt: at(3),
    };
    strict_1.default.throws(() => (0, cuenta_proveedor_service_1.reconstruirResumenCuentaProveedor)({
        cuenta,
        movimientos: [compra, pago],
        imputaciones: [imputacion],
    }), /excede_destino/);
    strict_1.default.throws(() => (0, cuenta_proveedor_service_1.reconstruirResumenCuentaProveedor)({
        cuenta,
        movimientos: [{ ...compra, moneda: "USD" }],
        imputaciones: [],
    }), /moneda_cuenta_proveedor_incompatible/);
});
