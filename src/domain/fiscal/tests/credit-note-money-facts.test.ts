import assert from "node:assert/strict";
import test from "node:test";
import type { CabeceraEjecucionCobroCliente, CuentaCliente, ImputacionCuentaCliente, MovimientoCuentaCliente, RecepcionCobroCliente } from "../../finanzas/contracts";
import { construirHechosFinancierosVenta } from "../../finanzas/contracts";
import { construirHechosFinancierosVenta as fiscalCompatibilityMoneyFacts } from "../contracts/credit-note-money-facts";

test("the fiscal compatibility entry reuses the canonical ledger calculation", () => {
  assert.equal(fiscalCompatibilityMoneyFacts, construirHechosFinancierosVenta);
});

function fixture() {
  const date = new Date("2026-10-18T12:00:00Z");
  const cuenta: CuentaCliente = { id: " account / α ", clienteId: " customer / β ", moneda: "PEN", estado: "ACTIVA", createdAt: date };
  const debit: MovimientoCuentaCliente = { id: " debit / γ ", cuentaId: cuenta.id, clienteId: cuenta.clienteId, tipo: "VENTA", direccion: "DEBITO",
    estado: "CONTABILIZADO", monto: 100, moneda: "PEN", tipoOrigen: "VENTA", origenId: " sale / δ ", createdAt: date };
  const movimientos = [debit]; const imputaciones: ImputacionCuentaCliente[] = [];
  const recepcionesPorId = new Map<string, RecepcionCobroCliente>();
  const cabecerasPorEjecucionId = new Map<string, CabeceraEjecucionCobroCliente>();
  const add = (id: string, tipo: MovimientoCuentaCliente["tipo"], monto: number, extra: Partial<ImputacionCuentaCliente> = {}) => {
    const source: MovimientoCuentaCliente = { ...debit, id, tipo, direccion: "CREDITO", monto, tipoOrigen: "COBRO", origenId: id };
    const allocation: ImputacionCuentaCliente = { id: `allocation ${imputaciones.length}`, cuentaId: cuenta.id, clienteId: cuenta.clienteId,
      movimientoOrigenId: id, movimientoDestinoId: debit.id, monto, moneda: "PEN", estado: "APLICADA", createdAt: date, ...extra };
    movimientos.push(source); imputaciones.push(allocation); return { source, allocation };
  };
  const input = { cuenta, ventaId: debit.origenId, movimientos, imputaciones, recepcionesPorId, cabecerasPorEjecucionId };
  return { date, cuenta, debit, add, input };
}

test("official allocations separate paid money, applied customer balance, returns and unverified amounts without changing the ledger", () => {
  const f = fixture();
  const { source } = f.add(" paid source / ε ", "COBRO", 40, { ejecucionCobroManifestVersion: 1, ejecucionCobroId: " execution / ζ ", tipoComponenteEjecucionCobro: "DINERO_NUEVO", cobroId: " receipt / η " });
  source.recepcionCobroId = " receipt / η "; source.ejecucionCobroId = " execution / ζ "; source.ejecucionCobroManifestVersion = 1;
  const receipt = { id: source.recepcionCobroId, cuentaId: f.cuenta.id, clienteId: f.cuenta.clienteId, monto: 40, moneda: "PEN", estado: "LIQUIDADO",
    metodoPago: "DIGITAL", creadoPorId: "actor", custodioId: "actor", idempotencyKey: "receipt-key", ejecucionCobroId: source.ejecucionCobroId,
    ejecucionCobroManifestVersion: 1, createdAt: f.date } as RecepcionCobroCliente;
  f.input.recepcionesPorId.set(receipt.id, receipt);
  f.input.cabecerasPorEjecucionId.set(source.ejecucionCobroId, { type: "ejecucion_cobro_cliente", contractVersion: 1, ejecucionCobroId: source.ejecucionCobroId,
    cuentaId: f.cuenta.id, clienteId: f.cuenta.clienteId, moneda: "PEN", planHash: "a".repeat(64), plan: { montoAplicadoEsperado: 40,
      componentes: [{ tipo: "DINERO_NUEVO", claveIdempotencia: "receipt-key", montoAplicadoEsperado: 40, montoRecibidoEsperado: 40,
        metodoPago: "DIGITAL", creditos: [{ movimientoDestinoId: f.debit.id, montoAplicadoEsperado: 40 }] }] },
    componentesConfirmados: ["receipt-key"], estado: "CONFIRMADA", creadoPorId: "actor", createdAt: f.date, updatedAt: f.date });
  f.add("balance source", "DEPOSITO", 20, { tipoComponenteEjecucionCobro: "SALDO_FAVOR" });
  f.add("return source", "DEVOLUCION", 10); f.add("unknown source", "COBRO", 5);
  const before = JSON.stringify(f.input);
  assert.deepEqual(construirHechosFinancierosVenta(f.input), { cuentaId: f.cuenta.id, clienteId: f.cuenta.clienteId, ventaId: f.debit.origenId,
    movimientoVentaId: f.debit.id, moneda: "PEN", ventaCents: 10000, deudaPendienteCents: 2500, dineroCobradoVerificadoCents: 4000,
    saldoFavorAplicadoCents: 2000, otrosAjustesAplicadosCents: 1000, imputadoNoVerificadoCents: 500 });
  assert.equal(JSON.stringify(f.input), before);
  f.input.recepcionesPorId.set(receipt.id, { ...receipt, estado: "RECIBIDO" });
  assert.equal(construirHechosFinancierosVenta(f.input)?.dineroCobradoVerificadoCents, 0);
  assert.equal(construirHechosFinancierosVenta(f.input)?.imputadoNoVerificadoCents, 4500);
});

test("missing receipt/manifest never fabricates verified money and opaque IDs are not trimmed", () => {
  const f = fixture();
  const { source } = f.add("source", "COBRO", 12, { ejecucionCobroManifestVersion: 1, tipoComponenteEjecucionCobro: "DINERO_NUEVO" });
  source.ejecucionCobroManifestVersion = 1;
  assert.equal(construirHechosFinancierosVenta(f.input)?.imputadoNoVerificadoCents, 1200);
  assert.equal(construirHechosFinancierosVenta({ ...f.input, ventaId: f.debit.origenId.trim() }), null);
});

test("duplicate debt, foreign scope, over-allocation and exact reversal references fail closed", () => {
  const duplicate = fixture(); duplicate.input.movimientos.push({ ...duplicate.debit, id: "another-debit" });
  assert.throws(() => construirHechosFinancierosVenta(duplicate.input), /ambiguo/);
  const foreign = fixture(); foreign.add("source", "COBRO", 10).allocation.clienteId = "other-client";
  assert.throws(() => construirHechosFinancierosVenta(foreign.input), /imputacion_venta_invalida/);
  const exceeded = fixture(); exceeded.add("source", "COBRO", 101);
  assert.throws(() => construirHechosFinancierosVenta(exceeded.input), /sobreimputada/);
  const reversed = fixture(); reversed.input.movimientos.push({ ...reversed.debit, id: "reversal", tipo: "REVERSA", direccion: "CREDITO", reversaDeMovimientoId: reversed.debit.id });
  assert.throws(() => construirHechosFinancierosVenta(reversed.input), /debito_venta_invalido/);
});

function verifiedMoneyFixture() {
  const f = fixture();
  const { source, allocation } = f.add("source", "COBRO", 40, { ejecucionCobroManifestVersion: 1,
    ejecucionCobroId: "execution", tipoComponenteEjecucionCobro: "DINERO_NUEVO", cobroId: "receipt" });
  Object.assign(source, { recepcionCobroId: "receipt", ejecucionCobroId: "execution", ejecucionCobroManifestVersion: 1 });
  const receipt: RecepcionCobroCliente = { id: "receipt", cuentaId: f.cuenta.id, clienteId: f.cuenta.clienteId,
    monto: 40, moneda: "PEN", estado: "LIQUIDADO", metodoPago: "DIGITAL", creadoPorId: "actor",
    idempotencyKey: "component", ejecucionCobroId: "execution", ejecucionCobroManifestVersion: 1, createdAt: f.date };
  const header: CabeceraEjecucionCobroCliente = { type: "ejecucion_cobro_cliente", contractVersion: 1,
    ejecucionCobroId: "execution", cuentaId: f.cuenta.id, clienteId: f.cuenta.clienteId, moneda: "PEN", planHash: "a".repeat(64),
    plan: { montoAplicadoEsperado: 40, componentes: [{ tipo: "DINERO_NUEVO", claveIdempotencia: "component",
      montoAplicadoEsperado: 40, montoRecibidoEsperado: 40, metodoPago: "DIGITAL",
      creditos: [{ movimientoDestinoId: f.debit.id, montoAplicadoEsperado: 40 }] }] },
    componentesConfirmados: ["component"], estado: "CONFIRMADA", creadoPorId: "actor", createdAt: f.date, updatedAt: f.date };
  f.input.recepcionesPorId.set(receipt.id, receipt);
  f.input.cabecerasPorEjecucionId.set(header.ejecucionCobroId, header);
  return { ...f, source, allocation, receipt, header };
}

test("a confirmed header cannot verify money against a missing, different or contradictory component plan", () => {
  const changes = [
    (f: ReturnType<typeof verifiedMoneyFixture>) => { f.header.plan.componentes = []; },
    (f: ReturnType<typeof verifiedMoneyFixture>) => { f.header.plan.componentes[0].creditos[0].movimientoDestinoId = "another debt"; },
    (f: ReturnType<typeof verifiedMoneyFixture>) => { f.header.plan.componentes[0].montoAplicadoEsperado = 30; },
    (f: ReturnType<typeof verifiedMoneyFixture>) => { const c = f.header.plan.componentes[0]; if (c.tipo === "DINERO_NUEVO") c.montoRecibidoEsperado = 50; },
    (f: ReturnType<typeof verifiedMoneyFixture>) => { const c = f.header.plan.componentes[0]; if (c.tipo === "DINERO_NUEVO") c.metodoPago = "EFECTIVO"; },
    (f: ReturnType<typeof verifiedMoneyFixture>) => { f.header.plan.componentes.push({ ...f.header.plan.componentes[0] }); },
    (f: ReturnType<typeof verifiedMoneyFixture>) => { delete f.allocation.cobroId; },
    (f: ReturnType<typeof verifiedMoneyFixture>) => { f.source.monto = 50; },
  ];
  for (const change of changes) {
    const f = verifiedMoneyFixture();
    assert.equal(construirHechosFinancierosVenta(f.input)?.dineroCobradoVerificadoCents, 4000);
    change(f);
    const facts = construirHechosFinancierosVenta(f.input)!;
    assert.equal(facts.dineroCobradoVerificadoCents, 0);
    assert.equal(facts.imputadoNoVerificadoCents, 4000);
  }
});

test("one settled receipt cannot be counted twice through two debt-crediting movements", () => {
  const f = verifiedMoneyFixture();
  const duplicateSource = { ...f.source, id: "another movement for same receipt" };
  f.input.movimientos.push(duplicateSource);
  f.input.imputaciones.push({ ...f.allocation, id: "another allocation", movimientoOrigenId: duplicateSource.id });
  const facts = construirHechosFinancierosVenta(f.input)!;
  assert.equal(facts.dineroCobradoVerificadoCents, 0);
  assert.equal(facts.imputadoNoVerificadoCents, 8000);
});
