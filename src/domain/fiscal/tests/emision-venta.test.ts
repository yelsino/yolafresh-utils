import test from "node:test";
import assert from "node:assert/strict";
import { readFiscalEmissionPolicy, createFiscalSaleDocumentSelection, assertFiscalSaleDocumentSelection,
  copyFiscalSaleDocumentSelection, type FiscalSaleDocumentSelection } from "../contracts";
import { Venta, type VentaCreateInput } from "../../ventas/entities/Venta";
import { VentaSnapshot } from "../../ventas/entities/VentaSnapshot";
import { CondicionPagoVenta, ProcedenciaComercialEnum, VentaState } from "../../shared/kernel/enums";
import * as publicApi from "../../../index";

const config = (modo: "MANUAL" | "AUTOMATICA", enabled = true) => ({ fiscal: { facturacionElectronicaEnabled: enabled,
  politicaEmision: modo === "MANUAL" ? { modo } : { modo, comprobantePredeterminado: "BOLETA" } } });
const sale = (selection?: FiscalSaleDocumentSelection): VentaCreateInput => ({ id: "venta opaca / 🌱", nombre: "Venta",
  type: "venta", estado: VentaState.CONFIRMADA, condicionPago: CondicionPagoVenta.CONTADO,
  procedencia: ProcedenciaComercialEnum.TIENDA, items: 1, snapshotItems: [{ id: "línea opaca", presentacionId: "presentación opaca",
    nombre: "Producto", cantidadVendida: 1, precioUnitario: 25, total: 25 }], subtotal: 25, impuesto: 0, total: 25,
  fiscalDocumentSelection: selection });

test("política y elección se exportan por el entrypoint público", () => {
  assert.equal(publicApi.createFiscalSaleDocumentSelection, createFiscalSaleDocumentSelection);
  assert.equal(publicApi.readFiscalEmissionPolicy, readFiscalEmissionPolicy);
});

test("empresa histórica conserva Manual y Ninguno sin inventar habilitación", () => {
  for (const value of [undefined, {}, { fiscal: {} }]) {
    assert.deepEqual(readFiscalEmissionPolicy(value), { modo: "MANUAL" });
    assert.deepEqual(createFiscalSaleDocumentSelection({ config: value }), {
      seleccion: "NINGUNO", origen: "EMPRESA", politicaAplicada: { modo: "MANUAL" } });
  }
});

test("Automática sólo establece el default con habilitación empresarial explícita", () => {
  assert.equal(createFiscalSaleDocumentSelection({ config: config("AUTOMATICA") }).seleccion, "BOLETA");
  assert.equal(createFiscalSaleDocumentSelection({ config: config("AUTOMATICA", false) }).seleccion, "NINGUNO");
  assert.equal(createFiscalSaleDocumentSelection({ config: { fiscal: { politicaEmision: {
    modo: "AUTOMATICA", comprobantePredeterminado: "FACTURA" } } } }).seleccion, "NINGUNO");
});

test("elección explícita Ninguno o Factura prevalece sobre default y no depende del RUC del cliente", () => {
  for (const seleccion of ["NINGUNO", "FACTURA"] as const) {
    const selected = createFiscalSaleDocumentSelection({ config: config("AUTOMATICA"), seleccion });
    assert.equal(selected.seleccion, seleccion);
    assert.equal(selected.origen, "OPERADOR");
  }
});

test("política y selección se copian y congelan, sin cambiar cuando cambia la empresa", () => {
  const source = config("AUTOMATICA");
  const selected = createFiscalSaleDocumentSelection({ config: source });
  source.fiscal.politicaEmision = { modo: "MANUAL" };
  assert.equal(selected.seleccion, "BOLETA");
  assert.deepEqual(selected.politicaAplicada, { modo: "AUTOMATICA", comprobantePredeterminado: "BOLETA" });
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(Object.isFrozen(selected.politicaAplicada), true);
  assert.notEqual(copyFiscalSaleDocumentSelection(selected), selected);
});

test("política corrupta no se convierte silenciosamente en otra política", () => {
  for (const politicaEmision of [null, { modo: "AUTO" }, { modo: "MANUAL", comprobantePredeterminado: "BOLETA" },
    { modo: "AUTOMATICA" }, { modo: "AUTOMATICA", comprobantePredeterminado: "NINGUNO" },
    { modo: "MANUAL", emitir: true }]) {
    assert.throws(() => readFiscalEmissionPolicy({ fiscal: { politicaEmision } }), /FISCAL_EMISSION_POLICY_INVALID/);
  }
});

test("selección persistida exige origen y política coherentes, no autoridad o número inventados", () => {
  const base = createFiscalSaleDocumentSelection({ config: config("AUTOMATICA") });
  for (const candidate of [{ ...base, seleccion: "OTRO" }, { ...base, seleccion: "FACTURA" },
    { ...base, origen: "SUNAT" }, { ...base, nextCorrelative: 1 }, { ...base, politicaAplicada: { modo: "MANUAL" } },
    { ...base, seleccion: new String("BOLETA") }]) {
    assert.throws(() => assertFiscalSaleDocumentSelection(candidate));
  }
});

test("Venta y Snapshot transportan elección completa y restauran sin consultar configuración", () => {
  const selected = createFiscalSaleDocumentSelection({ config: config("AUTOMATICA"), seleccion: "NINGUNO" });
  const venta = new Venta(sale(selected));
  const restored = new Venta(JSON.parse(JSON.stringify(venta.toJSON())));
  const snapshot = VentaSnapshot.fromJSON(JSON.parse(JSON.stringify(venta.toVentaSnapshot())));
  assert.deepEqual(restored.fiscalDocumentSelection, selected);
  assert.deepEqual(snapshot.fiscalDocumentSelection, selected);
  assert.equal(restored.total, 25);
  assert.equal(snapshot.total, 25);
  assert.equal(Object.isFrozen(restored.fiscalDocumentSelection), true);
  assert.equal(Object.isFrozen(snapshot.fiscalDocumentSelection?.politicaAplicada), true);
});

test("Venta y Snapshot históricos no reciben elección ni emisión retroactiva", () => {
  const venta = new Venta(sale());
  assert.equal(Object.prototype.hasOwnProperty.call(JSON.parse(JSON.stringify(venta.toJSON())), "fiscalDocumentSelection"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(JSON.parse(JSON.stringify(venta.toVentaSnapshot())), "fiscalDocumentSelection"), false);
});

test("constructor y validación comercial rechazan selección fiscal inválida", () => {
  const invalid = { seleccion: "BOLETA", origen: "EMPRESA", politicaAplicada: { modo: "MANUAL" } } as FiscalSaleDocumentSelection;
  assert.equal(Venta.validar(sale(invalid)).valida, false);
  assert.throws(() => new Venta(sale(invalid)), /fiscalDocumentSelection/);
  const snapshot = new Venta(sale()).toVentaSnapshot();
  assert.equal(VentaSnapshot.validar({ ...snapshot, fiscalDocumentSelection: invalid }).valida, false);
  assert.throws(() => VentaSnapshot.fromJSON({ ...snapshot, fiscalDocumentSelection: invalid }));
});
