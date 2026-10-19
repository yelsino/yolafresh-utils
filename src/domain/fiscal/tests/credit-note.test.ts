import assert from "node:assert/strict";
import test from "node:test";
import { prepareFiscalCreditNote, planCreditNoteSettlement, fiscalCreditQuantity, FiscalCreditNoteError, type FiscalSignedDocument } from "../contracts";
import { positiveDecimalQuantity, DecimalQuantityError } from "../../shared/value-objects/DecimalQuantity";

test("shared decimal quantities preserve exact scale and fiscal error compatibility", () => {
  for (const [quantity, expected] of [["0.0000000001", 1n], ["1.25", 12500000000n],
    ["999999999999.9999999999", 9999999999999999999999n]] as const) {
    assert.equal(positiveDecimalQuantity(quantity), expected);
    assert.equal(fiscalCreditQuantity(quantity), expected);
  }
  for (const quantity of ["0", "-1", "01", "1e-3", "1.00000000001", "1000000000000", 1, null]) {
    assert.throws(() => positiveDecimalQuantity(quantity), DecimalQuantityError);
    assert.throws(() => fiscalCreditQuantity(quantity), (error: unknown) =>
      error instanceof FiscalCreditNoteError && error.message === "CREDIT_NOTE_QUANTITY_INVALID");
  }
});

export function originalFixture(): FiscalSignedDocument {
  const digest = Buffer.alloc(32, 0xab).toString("base64");
  return {
    type: "comprobante_electronico", documentId: "original domain opaque", tenantId: "synthetic-tenant",
    environment: "DEMO", identity: { issuerRuc: "10770681397", documentType: "BOLETA", series: "B001", number: 118 },
    origin: { kind: "VENTA", saleId: "sale opaque", saleSnapshotId: "snapshot opaque", intentId: "intent opaque", fiscalSnapshotId: "fiscal opaque" },
    issuer: { legalName: "Emisor de prueba", fiscalAddress: "Dirección histórica", establishmentCode: "0000" },
    buyer: { documentType: "SIN_DOCUMENTO", documentNumber: null, legalName: "Consumidor final" },
    currency: "PEN", issueDate: "2026-10-11", issuedAt: "2026-10-11T15:00:00Z", signedAt: "2026-10-11T15:00:01Z",
    lines: [{ lineId: "opaque line", description: "QUESO", quantity: "3", unitCode: "NIU", unitPriceCents: 118,
      grossCents: 354, discountCents: 0, totalCents: 354,
      tax: { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV", taxRateBasisPoints: 1800, taxableBaseCents: 300, taxAmountCents: 54 } }],
    totals: { taxableBaseCents: 300, exemptCents: 0, unaffectedCents: 0, taxCents: 54, payableCents: 354 },
    signature: { signedXml: { storageRef: "private opaque", sha256: "a".repeat(64) }, digestValue: digest },
    print: { qrPayload: `10770681397|03|B001|118|0.54|3.54|2026-10-11|||${digest}`, digestOutsideQr: false, legalLegend: "BOLETA DEMO — SIN VALIDEZ TRIBUTARIA" },
  };
}
const command = (quantity = "1") => ({ operationId: "operation opaque", idempotencyKey: "retry opaque", reasonCode: "07" as const,
  reason: "Devolución de una unidad", selections: [{ originalLineId: "opaque line", quantity }] });

test("partial credit preserves historical price, buyer, emitter and actual tax", () => {
  const doc = originalFixture(); const before = JSON.stringify(doc);
  const note = prepareFiscalCreditNote(doc, command(), []);
  assert.equal(note.totals.payableCents, 118);
  assert.equal(note.totals.taxCents, 18);
  assert.equal(note.originalDocumentId, doc.documentId);
  assert.deepEqual(note.buyer, doc.buyer);
  assert.equal(JSON.stringify(doc), before);
});
test("weighted partials conserve every cent through cumulative rounding", () => {
  const source = originalFixture();
  const doc = { ...source, lines: [{ ...source.lines[0], quantity: "0.003", unitCode: "KGM", unitPriceCents: 118000 }] };
  let history: ReturnType<typeof prepareFiscalCreditNote>[] = [];
  for (let i = 0; i < 3; i++) history.push(prepareFiscalCreditNote(doc, { ...command("0.001"), operationId: `op ${i}`, idempotencyKey: `key ${i}` }, history));
  assert.equal(history.reduce((s, n) => s + n.totals.payableCents, 0), 354);
  assert.equal(history.reduce((s, n) => s + n.totals.taxCents, 0), 54);
  assert.throws(() => prepareFiscalCreditNote(doc, command("0.001"), history), /QUANTITY_EXCEEDED/);
});
test("full cancellation and total return preserve totals and cannot follow a partial", () => {
  const doc = originalFixture();
  for (const reasonCode of ["01", "06"] as const) {
    assert.deepEqual(prepareFiscalCreditNote(doc, { ...command(), reasonCode, selections: [] }, []).totals, doc.totals);
    assert.throws(() => prepareFiscalCreditNote(doc, { ...command(), operationId: "another operation", idempotencyKey: "another key", reasonCode, selections: [] }, [prepareFiscalCreditNote(doc, command(), [])]), /FULL_AFTER_PARTIAL/);
  }
});
test("invalid causal, duplicate lines, zero/negative quantity and foreign history fail before signing", () => {
  const doc = originalFixture();
  assert.throws(() => prepareFiscalCreditNote(doc, { ...command(), reasonCode: "04" as never }, []), /REASON_UNSUPPORTED/);
  for (const q of ["0", "-1", "1e-3", "1.00000000001", "4"]) assert.throws(() => prepareFiscalCreditNote(doc, command(q), []));
  assert.throws(() => prepareFiscalCreditNote(doc, { ...command(), selections: [command().selections[0], command().selections[0]] }, []), /DUPLICATE_LINE/);
  const prior = prepareFiscalCreditNote(doc, command(), []);
  assert.throws(() => prepareFiscalCreditNote(doc, command(), [{ ...prior, tenantId: "foreign" }]), /HISTORY_SCOPE/);
});
test("NRUS historical zero IGV is not replaced by today's general rate", () => {
  const source = originalFixture();
  const doc = { ...source, lines: [{ ...source.lines[0], tax: { ...source.lines[0].tax, taxableBaseCents: 354, taxAmountCents: 0, taxRateBasisPoints: 0 } }] as FiscalSignedDocument["lines"],
    totals: { ...source.totals, taxableBaseCents: 354, taxCents: 0 },
    print: { ...source.print, qrPayload: source.print.qrPayload.replace("|0.54|", "|0.00|") } };
  assert.equal(prepareFiscalCreditNote(doc, command(), []).totals.taxCents, 0);
});
test("100 returned with 60 paid and 40 debt does not refund 100", () => {
  const plan = planCreditNoteSettlement({ adjustmentCents: 10000, outstandingDebtCents: 4000, refundablePaidCents: 6000, refundRequestedCents: 6000, fiscalDuplicateOnly: false });
  assert.deepEqual(plan, { debtReductionCents: 4000, refundCents: 6000, refundDueCents: 0 });
  assert.throws(() => planCreditNoteSettlement({ adjustmentCents: 10000, outstandingDebtCents: 4000, refundablePaidCents: 6000, refundRequestedCents: 10000, fiscalDuplicateOnly: false }), /REFUND_EXCEEDED/);
  assert.deepEqual(planCreditNoteSettlement({ adjustmentCents: 10000, outstandingDebtCents: 0, refundablePaidCents: 0, refundRequestedCents: 0, fiscalDuplicateOnly: true }), { debtReductionCents: 0, refundCents: 0, refundDueCents: 0 });
});
test("corrupt history cannot change historical taxes, buyer, totals, line membership or reuse a retry key", () => {
  const doc = originalFixture(); const prior = prepareFiscalCreditNote(doc, command(), []);
  const next = { ...command(), operationId: "next", idempotencyKey: "next key" };
  for (const changed of [
    { ...prior, buyer: { ...prior.buyer, legalName: "other" } },
    { ...prior, totals: { ...prior.totals, payableCents: 119 } },
    { ...prior, lines: [{ ...prior.lines[0], tax: { ...prior.lines[0].tax, taxRateBasisPoints: 0 } }] },
    { ...prior, lines: [prior.lines[0], prior.lines[0]] },
  ]) assert.throws(() => prepareFiscalCreditNote(doc, next, [changed as never]), /HISTORY/);
  assert.throws(() => prepareFiscalCreditNote(doc, { ...next, idempotencyKey: prior.idempotencyKey }, [prior]), /KEY_ALREADY_RESERVED/);
});
test("line discounts are retained and aggregate full refund/debt limits remain bounded", () => {
  const source = originalFixture(); const tax = source.lines[0].tax;
  if (tax.category !== "GRAVADA") throw new Error("INVALID_FIXTURE");
  const doc = { ...source, lines: [{ ...source.lines[0], grossCents: 354,
    discountCents: 18, totalCents: 336, tax: { ...tax, taxableBaseCents: 285, taxAmountCents: 51 } }],
    totals: { ...source.totals, taxableBaseCents: 285, taxCents: 51, payableCents: 336 },
    print: { ...source.print, qrPayload: source.print.qrPayload.replace("|0.54|3.54|", "|0.51|3.36|") } };
  const history: ReturnType<typeof prepareFiscalCreditNote>[] = [];
  for (let i = 0; i < 3; i++) history.push(prepareFiscalCreditNote(doc, { ...command(), operationId: `discount ${i}`, idempotencyKey: `discount key ${i}` }, history));
  assert.equal(history.reduce((v, n) => v + n.lines[0].discountCents, 0), 18);
  assert.equal(history.reduce((v, n) => v + n.totals.taxCents, 0), 51);
  assert.equal(history.reduce((v, n) => v + n.totals.payableCents, 0), 336);
});
