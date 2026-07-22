import assert from "node:assert/strict";
import test from "node:test";

import type { RecepcionCobroCliente } from "../contracts/cuenta-cliente.contract";

test("RecepcionCobroCliente admite código de constancia", () => {
  const recepcion: RecepcionCobroCliente = {
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

  assert.equal(recepcion.codigoConstancia, "CONST-2026-0001");
});
