import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertFiscalCajaNumberingProjection, readFiscalCajaNumberingProjection, resolveFiscalCajaNumberingAssignment,
  resolveFiscalOperationalCheckoutContext, resolveFiscalOperationalTaxContext,
  type FiscalCajaNumberingProjection, type FiscalV1PublicationPayload, type FiscalV1SignedPublicationBundle } from "../contracts";

const projection = (): FiscalCajaNumberingProjection => ({ schemaVersion: 1, tenantId: "tenant opaco / 🌱",
  issuerRuc: "20123456789", environment: "DEMO", registryId: "registro opaco : / 🌱", assignmentRevision: 3,
  assignments: [{ cajaId: "caja opaca : / 🌱", assignmentVersion: 2, establishmentId: "establecimiento opaco",
    series: { BOLETA: { series: "B007", creditNoteSeries: "BC07" }, FACTURA: { series: "F007", creditNoteSeries: "FC07" } } }] });
const config = (value = projection()) => ({ fiscal: { numeracionPorEntorno: { DEMO: value } } });
const scope = () => ({ tenantId: projection().tenantId, issuerRuc: projection().issuerRuc, environment: "DEMO" as const,
  cajaId: projection().assignments[0].cajaId, establishmentId: projection().assignments[0].establishmentId,
  documentType: "BOLETA" as const });
function payload(): FiscalV1PublicationPayload {
  const result = (JSON.parse(readFileSync(resolve(process.cwd(), "src/docs/fiscal/fixtures/fiscal-v1-signed-golden.json"), "utf8")) as {
    bundle: FiscalV1SignedPublicationBundle }).bundle.payload;
  return result;
}

test("proyección conserva IDs opacos y resuelve exactamente caja, entorno, emisor y familia", () => {
  assert.doesNotThrow(() => assertFiscalCajaNumberingProjection(projection()));
  const result = resolveFiscalCajaNumberingAssignment(config(), scope());
  assert.equal(result?.registryId, "registro opaco : / 🌱");
  assert.equal(result?.cajaId, "caja opaca : / 🌱");
  assert.equal(result?.series, "B007");
  assert.equal(result?.creditNoteSeries, "BC07");
  assert.equal(result?.assignmentRevision, 3);
  assert.equal(resolveFiscalCajaNumberingAssignment(config(), { ...scope(), documentType: "FACTURA" })?.series, "F007");
});

test("proyección ausente, ajena o incompleta nunca elige otro scope o caja", () => {
  assert.equal(readFiscalCajaNumberingProjection({}, scope()), null);
  for (const extra of [{ tenantId: "otro" }, { issuerRuc: "20987654321" }, { environment: "PRODUCTION" as const },
    { cajaId: "otra" }, { establishmentId: "otro" }]) {
    assert.equal(resolveFiscalCajaNumberingAssignment(config(), { ...scope(), ...extra }), null);
  }
  const onlyBoleta = { ...projection(), assignments: [{ ...projection().assignments[0],
    series: { BOLETA: { series: "B001", creditNoteSeries: "BC01" } } }] };
  assert.equal(resolveFiscalCajaNumberingAssignment(config(onlyBoleta), { ...scope(), documentType: "FACTURA" }), null);
});

test("proyección no acepta contadores, familias mezcladas, cajas duplicadas ni versiones ambiguas", () => {
  const base = projection(), assignment = base.assignments[0];
  const invalid: unknown[] = [ { ...base, nextCorrelative: 2 }, { ...base, assignmentRevision: 0 },
    { ...base, assignments: [assignment, assignment] },
    { ...base, assignments: [{ ...assignment, assignmentVersion: 1.5 }] },
    { ...base, assignments: [{ ...assignment, series: {} }] },
    { ...base, assignments: [{ ...assignment, series: { BOLETA: { series: "B001", creditNoteSeries: "FC01" } } }] },
    { ...base, assignments: [{ ...assignment, series: { BOLETA: { series: "B001", creditNoteSeries: "BC01", nextCorrelative: 1 } } }] } ];
  for (const value of invalid) assert.throws(() => assertFiscalCajaNumberingProjection(value), /FISCAL_CAJA_NUMBERING_PROJECTION_INVALID/);
});

test("una serie histórica compartida no se convierte en conflicto por cajas diferentes", () => {
  const base = projection();
  assert.doesNotThrow(() => assertFiscalCajaNumberingProjection({ ...base,
    assignments: [...base.assignments, { ...base.assignments[0], cajaId: "otra caja opaca" }] }));
});

test("contexto operativo usa perfil y capacidades firmados sin checkout previo ni cambiar publicación", () => {
  const signed = payload(), before = JSON.stringify(signed), profile = signed.profiles[0];
  const value = projection();
  const matching: FiscalCajaNumberingProjection = { ...value, tenantId: signed.tenantId, issuerRuc: profile.issuerRuc,
    environment: signed.environment, assignments: [{ ...value.assignments[0], establishmentId: profile.establishmentId }] };
  const assignment = resolveFiscalCajaNumberingAssignment(config(matching), { ...scope(), tenantId: signed.tenantId,
    issuerRuc: profile.issuerRuc, environment: signed.environment, establishmentId: profile.establishmentId })!;
  const resolved = resolveFiscalOperationalCheckoutContext({ payload: signed, assignment, documentType: "BOLETA", occurredOn: "2026-10-15" });
  assert.equal(resolved?.profile.profileVersion, profile.profileVersion);
  assert.equal(resolved?.checkout.series, "B007");
  assert.equal(resolved?.checkout.cajaId, assignment.cajaId);
  assert.equal(resolved?.operationalAssignment.registryId, assignment.registryId);
  assert.equal(JSON.stringify(signed), before);
  const tax = resolveFiscalOperationalTaxContext({ payload: signed, documentType: "BOLETA", occurredOn: "2026-10-15",
    establishmentId: profile.establishmentId, issuerRuc: profile.issuerRuc });
  assert.equal(tax?.profile.profileVersion, profile.profileVersion);
  assert.deepEqual(tax?.context, resolved?.checkout.context);
});

test("asignación operativa nunca supera vigencias, capacidades suspendidas o identidad del perfil", () => {
  const signed = payload(), profile = signed.profiles[0], base = projection();
  const assignment = { ...resolveFiscalCajaNumberingAssignment(config(), scope())!, tenantId: signed.tenantId,
    issuerRuc: profile.issuerRuc, environment: signed.environment, establishmentId: profile.establishmentId };
  const input = { payload: signed, assignment, documentType: "BOLETA" as const, occurredOn: "2026-10-15" };
  assert.equal(resolveFiscalOperationalCheckoutContext({ ...input, occurredOn: "2026-09-01" }), null);
  assert.equal(resolveFiscalOperationalCheckoutContext({ ...input, assignment: { ...assignment, tenantId: "ajeno" } }), null);
  assert.equal(resolveFiscalOperationalCheckoutContext({ ...input, assignment: { ...assignment, issuerRuc: base.issuerRuc } }), null);
  assert.equal(resolveFiscalOperationalCheckoutContext({ ...input, payload: { ...signed,
    capabilities: signed.capabilities.map(row => ({ ...row, status: "SUSPENDED" })) } }), null);
  assert.equal(resolveFiscalOperationalTaxContext({ payload: signed, documentType: "BOLETA", occurredOn: "2026-10-15",
    establishmentId: "otra sucursal", issuerRuc: profile.issuerRuc }), null);
});

test("contexto tributario operativo rechaza ambigüedad y conserva ruta correctiva de factura", () => {
  const base = payload(), profile = { ...base.profiles[0], taxRegime: "RER" as const };
  const context = { ...base.capabilities[0].context, buyerUse: "BUSINESS" as const };
  const invoice = { ...base.capabilities[0], taxRegime: "RER" as const, documentType: "FACTURA" as const, context };
  const correction = { ...invoice, capabilityId: "corrección opaca", documentType: "NOTA_CREDITO" as const,
    creditNoteReasonCodes: ["01", "06", "07"] };
  const signed = { ...base, profiles: [profile], capabilities: [invoice, correction] };
  const input = { payload: signed, documentType: "FACTURA" as const, occurredOn: "2026-10-15", establishmentId: profile.establishmentId };
  assert.equal(resolveFiscalOperationalTaxContext(input)?.capabilities[0].documentType, "FACTURA");
  assert.equal(resolveFiscalOperationalTaxContext({ ...input, payload: { ...signed, capabilities: [invoice] } }), null);
  assert.equal(resolveFiscalOperationalTaxContext({ ...input, payload: { ...signed,
    capabilities: [invoice, { ...invoice, capabilityId: "otra autorización" }, correction] } }), null);
});

test("un contexto distingue carritos gravados, exonerados y mixtos sin elegir una capacidad arbitraria", () => {
  const base = payload(), profile = { ...base.profiles[0], taxRegime: "RER" as const };
  const context = { ...base.capabilities[0].context, buyerUse: "BUSINESS" as const };
  const categories = [["GRAVADA"], ["EXONERADA"], ["GRAVADA", "EXONERADA"]] as const;
  const sales = categories.map((legalCategories, index) => ({ ...base.capabilities[0],
    capabilityId: `autorización ${index}`, taxRegime: "RER" as const, documentType: "FACTURA" as const,
    legalCategories: [...legalCategories], context }));
  const notes = sales.map(row => ({ ...row, capabilityId: `nota ${row.capabilityId}`,
    documentType: "NOTA_CREDITO" as const, creditNoteReasonCodes: ["01", "06", "07"] }));
  const signed = { ...base, profiles: [profile], capabilities: [...sales, ...notes] };
  const input = { payload: signed, documentType: "FACTURA" as const, occurredOn: "2026-10-15", establishmentId: profile.establishmentId };
  assert.equal(resolveFiscalOperationalTaxContext(input)?.capabilities.length, 3);
  const assignment = { ...resolveFiscalCajaNumberingAssignment(config(), { ...scope(), documentType: "FACTURA" })!,
    tenantId: signed.tenantId, issuerRuc: profile.issuerRuc, environment: signed.environment, establishmentId: profile.establishmentId };
  assert.equal(resolveFiscalOperationalCheckoutContext({ ...input, assignment })?.checkout.series, "F007");
  for (const capabilities of [ [...sales, notes[2]], [...sales, ...notes, notes[0]], [...sales, sales[0], ...notes] ]) {
    assert.equal(resolveFiscalOperationalTaxContext({ ...input, payload: { ...signed, capabilities } }), null);
    assert.equal(resolveFiscalOperationalCheckoutContext({ ...input, assignment, payload: { ...signed, capabilities } }), null);
  }
});
