import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVentaCobroMovimientos,
  parseVentaCobroSnapshot,
  resolveVentaCobro,
  validarVentaCobro,
  type VentaCobroDevolucion,
  type VentaCobroDigitalInput,
} from "../contracts/venta-cobro.contract";
import { VentaSnapshot } from "../entities/VentaSnapshot";
import { Venta } from "../entities/Venta";
import { VentaState, CondicionPagoVenta, ProcedenciaComercialEnum } from "../../shared/kernel/enums";

const digital = (montoRecibido: number, key = "opaque:payment / A"): VentaCobroDigitalInput => ({
  key,
  pagoId: `external ${key}`,
  origen: "CAPTURADO",
  metodoPago: "DIGITAL",
  montoRecibido,
});
const refund = (metodoPago: VentaCobroDevolucion["metodoPago"], monto = 5): VentaCobroDevolucion => ({
  id: "opaque refund # 7",
  metodoPago,
  monto,
  confirmadoAt: 1_000,
  operadorId: "operator / 1",
  cajaId: "box / 2",
  turnoCajaId: "shift / 3",
});
function netByMedium(movements: ReturnType<typeof buildVentaCobroMovimientos>, medium: string): number {
  return movements.filter((movement) => movement.metodoPago === medium)
    .reduce((sum, movement) => sum + (movement.tipo === "INGRESO" ? movement.monto : -movement.monto), 0);
}

test("venta 30 y digital 25 dejan efectivo 5 sin componente Pago en efectivo", () => {
  const cobro = resolveVentaCobro({ totalVenta: 30, pagosDigitales: [digital(25)] });
  assert.equal(cobro.efectivoRecibido, 5);
  assert.equal(cobro.efectivoAplicado, 5);
  assert.equal(cobro.pagosDigitales.length, 1);
  assert.equal(cobro.pagosDigitales[0].montoAplicado, 25);
  assert.equal(cobro.montoRecibido, 30);
  assert.equal(cobro.vueltoRequerido, 0);
  assert.deepEqual(buildVentaCobroMovimientos(cobro), [
    { key: "cobro:digital:opaque:payment / A", tipo: "INGRESO", monto: 25, metodoPago: "DIGITAL" },
    { key: "cobro:efectivo", tipo: "INGRESO", monto: 5, metodoPago: "EFECTIVO" },
  ]);
});

test("digital 30 para venta 25 aplica 25 y debe 5 hasta confirmar una devolución", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)] });
  assert.equal(cobro.efectivoRecibido, 0);
  assert.equal(cobro.pagosDigitales[0].montoRecibido, 30);
  assert.equal(cobro.pagosDigitales[0].montoAplicado, 25);
  assert.equal(cobro.montoAplicado, 25);
  assert.equal(cobro.vueltoRequerido, 5);
  assert.equal(cobro.vueltoDevuelto, 0);
  assert.equal(cobro.vueltoPendiente, 5);
  assert.equal(buildVentaCobroMovimientos(cobro).length, 1);
  assert.equal(netByMedium(buildVentaCobroMovimientos(cobro), "DIGITAL"), 30);
});

test("devolver efectivo 5 conserva ingreso digital 30 y egreso efectivo 5", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)], devoluciones: [refund("EFECTIVO")] });
  const movements = buildVentaCobroMovimientos(cobro);
  assert.equal(cobro.vueltoDevuelto, 5);
  assert.equal(cobro.vueltoPendiente, 0);
  assert.equal(netByMedium(movements, "DIGITAL"), 30);
  assert.equal(netByMedium(movements, "EFECTIVO"), -5);
  assert.equal(movements.reduce((sum, movement) => sum + (movement.tipo === "INGRESO" ? movement.monto : -movement.monto), 0), 25);
});

test("devolver digital 5 deja digital neto 25 sin afectar efectivo", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)], devoluciones: [refund("DIGITAL")] });
  const movements = buildVentaCobroMovimientos(cobro);
  assert.equal(netByMedium(movements, "DIGITAL"), 25);
  assert.equal(netByMedium(movements, "EFECTIVO"), 0);
  assert.equal(cobro.devoluciones[0].id, "opaque refund # 7");
  assert.equal(cobro.devoluciones[0].cajaId, "box / 2");
});

test("devolución parcial no oculta el saldo pendiente ni lo declara entregado", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)], devoluciones: [refund("EFECTIVO", 2)] });
  assert.equal(cobro.vueltoDevuelto, 2);
  assert.equal(cobro.vueltoPendiente, 3);
  assert.equal(netByMedium(buildVentaCobroMovimientos(cobro), "DIGITAL") + netByMedium(buildVentaCobroMovimientos(cobro), "EFECTIVO"), 28);
});

test("efectivo 30 para venta 25 usa bruto y devolución; no resta 5 de un ingreso ya neto", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, efectivoRecibido: 30, devoluciones: [refund("EFECTIVO")] });
  assert.deepEqual(cobro.pagosDigitales, []);
  assert.equal(cobro.efectivoAplicado, 25);
  assert.equal(netByMedium(buildVentaCobroMovimientos(cobro), "EFECTIVO"), 25);
});

test("dos digitales conservan lo recibido y asignan sólo el total de la venta", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(10, "A"), digital(20, "B")] });
  assert.deepEqual(cobro.pagosDigitales.map((payment) => payment.montoAplicado), [10, 15]);
  assert.deepEqual(cobro.pagosDigitales.map((payment) => payment.montoRecibido), [10, 20]);
  assert.equal(cobro.vueltoPendiente, 5);
});

test("confiar y manual mantienen origen explícito y no precisan un Pago remoto", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [
    { key: "local trust", origen: "CONFIANZA", metodoPago: "DIGITAL", montoRecibido: 10 },
    { key: "local manual", origen: "MANUAL", metodoPago: "DIGITAL", montoRecibido: 15 },
  ] });
  assert.deepEqual(cobro.pagosDigitales.map((payment) => payment.origen), ["CONFIANZA", "MANUAL"]);
  assert.ok(cobro.pagosDigitales.every((payment) => payment.pagoId === undefined));
  assert.equal(cobro.efectivoRecibido, 0);
});

test("céntimos no producen un vuelto ficticio por error de punto flotante", () => {
  const cobro = resolveVentaCobro({ totalVenta: 0.3, pagosDigitales: [digital(0.1, "A"), digital(0.2, "B")] });
  assert.equal(cobro.montoRecibido, 0.3);
  assert.equal(cobro.vueltoPendiente, 0);
  assert.equal(cobro.efectivoRecibido, 0);
});

test("efectivo predeterminado cubre el saldo exacto y nunca inventa pagos digitales", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25 });
  assert.equal(cobro.efectivoRecibido, 25);
  assert.deepEqual(cobro.pagosDigitales, []);
  assert.deepEqual(cobro.devoluciones, []);
});

test("rechaza déficit explícito, duplicados, devolución excesiva y precisión inválida", () => {
  assert.throws(() => resolveVentaCobro({ totalVenta: 30, pagosDigitales: [digital(25)], efectivoRecibido: 4 }), /no cubre/);
  assert.throws(() => resolveVentaCobro({ totalVenta: 30, pagosDigitales: [digital(25), digital(25)] }), /duplicada/);
  assert.throws(() => resolveVentaCobro({ totalVenta: 30, pagosDigitales: [digital(25), { ...digital(25), key: "other key" }] }), /mismo pago/);
  assert.throws(() => resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)], devoluciones: [refund("EFECTIVO", 6)] }), /exceder/);
  assert.throws(() => resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)], devoluciones: [refund("EFECTIVO", 2), refund("DIGITAL", 2)] }), /duplicado/);
  assert.throws(() => resolveVentaCobro({ totalVenta: Number.NaN }), /finito/);
  assert.throws(() => resolveVentaCobro({ totalVenta: -1 }), /no negativo/);
  assert.throws(() => resolveVentaCobro({ totalVenta: 1.001 }), /dos decimales/);
  assert.throws(() => resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(0)] }), /positivos/);
  assert.throws(() => resolveVentaCobro({ totalVenta: 25, pagosDigitales: [{ ...digital(25), metodoPago: "EFECTIVO" as "DIGITAL" }] }), /debe ser digital/);
});

test("parser rechaza importes derivados alterados en transporte", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)] });
  assert.equal(parseVentaCobroSnapshot({ ...cobro, vueltoDevuelto: 5 }), null);
  assert.equal(parseVentaCobroSnapshot({ ...cobro, montoRecibido: 25 }), null);
  assert.equal(parseVentaCobroSnapshot({ ...cobro, pagosDigitales: [{ ...cobro.pagosDigitales[0], montoAplicado: 30 }] }), null);
  assert.equal(parseVentaCobroSnapshot({ ...cobro, schemaVersion: 2 }), null);
  assert.equal(parseVentaCobroSnapshot(null), null);
  assert.equal(validarVentaCobro(cobro, 26).valida, false);
  assert.deepEqual(parseVentaCobroSnapshot(JSON.parse(JSON.stringify(cobro))), cobro);
});

test("plan repetido usa mismas claves y no convierte cálculo pendiente en egreso", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)] });
  assert.deepEqual(buildVentaCobroMovimientos(cobro), buildVentaCobroMovimientos(cobro));
  assert.ok(buildVentaCobroMovimientos(cobro).every((movement) => movement.tipo === "INGRESO"));
});

test("identidades opacas conservan incluso whitespace sin interpretación", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [
    { key: "   ", pagoId: " ", origen: "CAPTURADO", metodoPago: "DIGITAL", montoRecibido: 30 },
  ], devoluciones: [{ ...refund("EFECTIVO"), id: "\t", operadorId: " ", cajaId: "  " }] });
  assert.equal(cobro.pagosDigitales[0].key, "   ");
  assert.equal(cobro.pagosDigitales[0].pagoId, " ");
  assert.equal(cobro.devoluciones[0].id, "\t");
  assert.equal(cobro.devoluciones[0].operadorId, " ");
  assert.deepEqual(parseVentaCobroSnapshot(cobro), cobro);
});

const snapshotInput = () => ({
  id: "snapshot opaque",
  ventaId: "sale opaque",
  createdAt: 1_000,
  items: [{ id: "item opaque", presentacionId: "presentation opaque", nombre: "Producto", cantidadVendida: 1, precioUnitario: 25, total: 25 }],
  subtotal: 25,
  impuesto: 0,
  total: 25,
});

test("snapshot conserva cobro en ida y vuelta y separa memoria mutable", () => {
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)], devoluciones: [refund("EFECTIVO")] });
  const snapshot = new VentaSnapshot({ ...snapshotInput(), cobro });
  assert.deepEqual(snapshot.cobro, cobro);
  assert.ok(Object.isFrozen(snapshot.cobro));
  assert.ok(Object.isFrozen(snapshot.cobro?.pagosDigitales[0]));
  const json = snapshot.toJSON();
  assert.notEqual(json.cobro, snapshot.cobro);
  assert.notEqual(json.cobro?.pagosDigitales[0], snapshot.cobro?.pagosDigitales[0]);
  assert.deepEqual(VentaSnapshot.fromJSON(json).toJSON().cobro, cobro);
});

test("snapshot histórico admite ausencia de cobro y no infiere devoluciones", () => {
  const snapshot = new VentaSnapshot(snapshotInput());
  assert.equal(snapshot.cobro, undefined);
  assert.equal(VentaSnapshot.fromJSON(snapshot.toJSON()).toJSON().cobro, undefined);
});

test("snapshot rechaza cobro cuyo total difiere del precio histórico", () => {
  assert.throws(() => new VentaSnapshot({ ...snapshotInput(), cobro: resolveVentaCobro({ totalVenta: 30 }) }), /total comercial/);
});

test("fromVenta y toVentaSnapshot preservan el contexto de cobro", () => {
  const source = snapshotInput();
  const venta = new Venta({
    id: source.ventaId,
    nombre: "Venta",
    type: "venta",
    estado: VentaState.CONFIRMADA,
    condicionPago: CondicionPagoVenta.CONTADO,
    items: 1,
    subtotal: 25,
    impuesto: 0,
    total: 25,
    procedencia: ProcedenciaComercialEnum.TIENDA,
  });
  const cobro = resolveVentaCobro({ totalVenta: 25, pagosDigitales: [digital(30)] });
  assert.deepEqual(VentaSnapshot.fromVenta(venta, { items: source.items, cobro }).cobro, cobro);
  assert.deepEqual(venta.toVentaSnapshot({ items: source.items, cobro }).cobro, cobro);
  assert.equal(venta.toJSON().total, 25);
});
