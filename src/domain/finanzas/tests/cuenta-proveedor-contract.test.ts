import assert from "node:assert/strict";
import test from "node:test";

import type {
  CuentaProveedor,
  ImputacionCuentaProveedor,
  MovimientoCuentaProveedor,
} from "../contracts/cuenta-proveedor.contract";
import {
  planificarImputacionesCuentaProveedorFifo,
  reconstruirResumenCuentaProveedor,
} from "../services/cuenta-proveedor.service";

const at = (day: number) => new Date(`2026-08-${String(day).padStart(2, "0")}T10:00:00.000Z`);

const cuenta: CuentaProveedor = {
  id: "cuenta-proveedor-1",
  proveedorId: "proveedor-1",
  estado: "ACTIVA",
  moneda: "PEN",
  aperturaAt: at(1),
  createdAt: at(1),
  updatedAt: at(1),
};

const movimiento = (
  input: Partial<MovimientoCuentaProveedor> &
    Pick<MovimientoCuentaProveedor, "id" | "tipo" | "direccion" | "monto">,
): MovimientoCuentaProveedor => ({
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

test("reconstruye deuda, pago parcial y saldo no aplicado", () => {
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
  const imputacion: ImputacionCuentaProveedor = {
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

  const resumen = reconstruirResumenCuentaProveedor({
    cuenta,
    movimientos: [pago, compra],
    imputaciones: [imputacion],
    reconstruidaAt: at(4),
  });

  assert.equal(resumen.saldoPorPagar, 40);
  assert.equal(resumen.saldoFavorNegocio, 10);
  assert.equal(resumen.saldoDebitoNoAplicado, 10);
});

test("reversa de imputacion resta la aplicacion sin borrar historia", () => {
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
  const aplicacion: ImputacionCuentaProveedor = {
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
  const reversa: ImputacionCuentaProveedor = {
    ...aplicacion,
    id: "reversa-1",
    tipo: "REVERSA",
    monto: 25,
    reversaDeImputacionId: aplicacion.id,
    createdAt: at(4),
  };

  const resumen = reconstruirResumenCuentaProveedor({
    cuenta,
    movimientos: [compra, pago],
    imputaciones: [reversa, aplicacion],
  });

  assert.equal(resumen.saldoPorPagar, 25);
  assert.equal(resumen.saldoFavorNegocio, 25);
});

test("reversa contable cancela el movimiento y libera sus imputaciones", () => {
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
  const aplicacion: ImputacionCuentaProveedor = {
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

  const resumen = reconstruirResumenCuentaProveedor({
    cuenta,
    movimientos: [compra, pago, reversaPago],
    imputaciones: [aplicacion],
  });

  assert.equal(resumen.saldoPorPagar, 100);
  assert.equal(resumen.saldoFavorNegocio, 0);
  assert.equal(resumen.cantidadMovimientosFuente, 3);
  assert.equal(resumen.cantidadImputacionesFuente, 0);
});

test("planifica FIFO estable y conserva excedente como saldo a favor", () => {
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

  const imputaciones = planificarImputacionesCuentaProveedorFifo({
    cuenta,
    movimientoOrigen: pago,
    movimientos: [compra2, pago, compra1],
    imputaciones: [],
    createdAt: at(4),
    idFactory: (index) => `fifo-${index}`,
  });

  assert.deepEqual(
    imputaciones.map((item) => [item.movimientoDestinoId, item.monto]),
    [
      ["compra-1", 30],
      ["compra-2", 50],
    ],
  );
  const resumen = reconstruirResumenCuentaProveedor({
    cuenta,
    movimientos: [compra1, compra2, pago],
    imputaciones,
  });
  assert.equal(resumen.saldoPorPagar, 0);
  assert.equal(resumen.saldoFavorNegocio, 20);
});

test("rechaza sobreaplicacion y moneda incompatible", () => {
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
  const imputacion: ImputacionCuentaProveedor = {
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

  assert.throws(
    () =>
      reconstruirResumenCuentaProveedor({
        cuenta,
        movimientos: [compra, pago],
        imputaciones: [imputacion],
      }),
    /excede_destino/,
  );
  assert.throws(
    () =>
      reconstruirResumenCuentaProveedor({
        cuenta,
        movimientos: [{ ...compra, moneda: "USD" }],
        imputaciones: [],
      }),
    /moneda_cuenta_proveedor_incompatible/,
  );
});
