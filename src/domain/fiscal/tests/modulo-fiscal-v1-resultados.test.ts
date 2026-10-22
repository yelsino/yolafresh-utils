import { test } from "node:test";
import assert from "node:assert/strict";
import { assertFiscalV1DocumentGrant, assertFiscalV1PrintEvidence,
  assertFiscalV1TributaryResult, fiscalV1TributaryStatus,
  validateFiscalV1PrintEvidence, validateFiscalV1TributaryResult,
  type FiscalV1PrintEvidence, type FiscalV1PrintEvidenceBinding,
  type FiscalV1TributaryResult } from "../contracts";

const HASH = "a".repeat(64);
const binding: FiscalV1PrintEvidenceBinding = {
  environment: "DEMO", identity: { issuerRuc: "20123456789", documentType: "01", series: "F001", number: 12 },
  issuedOn: "2026-10-19", currency: "PEN", totalCents: 11800, taxCents: 1800,
  buyer: { documentType: "RUC", documentNumber: "10123456789" }, signedXmlSha256: HASH,
};
const print: FiscalV1PrintEvidence = { signedXmlSha256: HASH,
  digestValue: Buffer.alloc(32, 4).toString("base64"), digestOutsideQr: true,
  signedAt: "2026-10-19T12:00:00-05:00", legalLegend: "DEMO - SIN VALIDEZ TRIBUTARIA",
  qrPayload: "20123456789|01|F001|12|18.00|118.00|2026-10-19|6|10123456789" };
const cdr: FiscalV1TributaryResult = { storageRef: "private:cdr", sha256: HASH,
  receivedAtMs: 1792429200000, outcome: "ACCEPTED", responseCode: "0",
  description: "Aceptado", observations: ["4000 - Dato observado\nConservar descripción original"] };

test("factura se imprime con evidencia congelada sin inventar IDs del piloto ni afirmar CDR", () => {
  assert.deepEqual(validateFiscalV1PrintEvidence(print, binding), []);
  assert.doesNotThrow(() => assertFiscalV1PrintEvidence(print, binding));
  assert.equal(fiscalV1TributaryStatus(undefined), null);
  const noteBinding = { ...binding, identity: { ...binding.identity, documentType: "07" as const, series: "FC01" } };
  const notePrint = { ...print, qrPayload: print.qrPayload.replace("|01|F001|", "|07|FC01|") };
  assert.deepEqual(validateFiscalV1PrintEvidence(notePrint, noteBinding), []);
});

test("rechaza proyección de otro XML, receptor, fecha o identidad y montos alterados", () => {
  for (const changed of [
    { signedXmlSha256: "b".repeat(64) },
    { qrPayload: print.qrPayload.replace("|118.00|", "|119.00|") },
    { qrPayload: print.qrPayload.replace("|18.00|", "|0.00|") },
    { qrPayload: print.qrPayload.replace("|01|", "|03|") },
    { qrPayload: print.qrPayload.replace("F001", "F002") },
    { qrPayload: print.qrPayload.replace("|12|", "|13|") },
    { qrPayload: print.qrPayload.replace("2026-10-19", "2026-10-18") },
    { qrPayload: print.qrPayload.replace("10123456789", "10987654321") },
    { qrPayload: print.qrPayload + "|forged-digest" },
    { digestOutsideQr: false }, { signedAt: "2026-02-30T10:00:00Z" },
  ]) assert.ok(validateFiscalV1PrintEvidence({ ...print, ...changed }, binding).length, JSON.stringify(changed));
  assert.deepEqual(validateFiscalV1PrintEvidence(print, { ...binding,
    identity: { ...binding.identity, series: "B001" } }), ["print.binding"]);
  assert.deepEqual(validateFiscalV1PrintEvidence(print, { ...binding,
    buyer: { documentType: "DNI", documentNumber: "12345678" } }), ["print.binding"]);
});

test("QR con digest conserva la misma identidad e incluye el resumen canónico", () => {
  const qr = { ...print, digestOutsideQr: false, qrPayload: `${print.qrPayload}|${print.digestValue}` };
  assert.deepEqual(validateFiscalV1PrintEvidence(qr, binding), []);
  assert.deepEqual(validateFiscalV1PrintEvidence({ ...qr, qrPayload: `${qr.qrPayload}|` }, binding), []);
  const short = { ...print, digestValue: Buffer.alloc(20, 1).toString("base64") };
  assert.deepEqual(validateFiscalV1PrintEvidence(short, binding), []);
  const production = { ...binding, environment: "PRODUCTION" as const };
  assert.ok(validateFiscalV1PrintEvidence({ ...short, legalLegend: "Representación impresa" }, production)
    .includes("print.digestValue"));
  assert.ok(validateFiscalV1PrintEvidence(print, production).includes("print.legalLegend.productionMismatch"));
  assert.ok(validateFiscalV1PrintEvidence({ ...print, legalLegend: "Representación impresa" }, binding)
    .includes("print.legalLegend.demoWarning"));
});

test("boleta y nota de boleta admiten DNI sin ampliar factura a comprador DNI", () => {
  for (const documentType of ["03", "07"] as const) {
    const scoped = { ...binding, identity: { ...binding.identity, documentType, series: "B001" },
      buyer: { documentType: "DNI" as const, documentNumber: "12345678" } };
    const evidence = { ...print, qrPayload: `20123456789|${documentType}|B001|12|18.00|118.00|19/10/2026|1|12345678` };
    assert.deepEqual(validateFiscalV1PrintEvidence(evidence, scoped), []);
  }
});

test("CDR con observaciones conserva detalle y distingue aceptación de rechazo y ausencia", () => {
  assert.deepEqual(validateFiscalV1TributaryResult(cdr, { requireDetails: true }), []);
  assert.equal(fiscalV1TributaryStatus(cdr), "ACCEPTED_WITH_OBSERVATIONS");
  assert.equal(fiscalV1TributaryStatus({ ...cdr, observations: [] }), "ACCEPTED");
  assert.equal(fiscalV1TributaryStatus({ ...cdr, outcome: "REJECTED", responseCode: "2022" }), "REJECTED");
  assert.equal(fiscalV1TributaryStatus(null), null);
  assert.throws(() => assertFiscalV1TributaryResult({ ...cdr, outcome: "REJECTED" }), /TRIBUTARY_RESULT_INVALID/);
  assert.throws(() => assertFiscalV1TributaryResult({ ...cdr, responseCode: "2022" }), /TRIBUTARY_RESULT_INVALID/);
  assert.throws(() => assertFiscalV1TributaryResult({ ...cdr, observations: [""] }), /TRIBUTARY_RESULT_INVALID/);
});

test("CDR histórico sigue legible sin fabricar detalle; nuevas escrituras requieren los tres campos", () => {
  const historical = { storageRef: cdr.storageRef, sha256: cdr.sha256,
    receivedAtMs: cdr.receivedAtMs, outcome: cdr.outcome };
  assert.deepEqual(validateFiscalV1TributaryResult(historical), []);
  assert.ok(validateFiscalV1TributaryResult(historical, { requireDetails: true }).includes("details.required"));
  assert.ok(validateFiscalV1TributaryResult({ ...historical, responseCode: "0" }).includes("details.required"));
  assert.equal("observations" in historical, false);
});

test("otorgamiento de factura conserva receptor y actor sin usarlo como aceptación o pago", () => {
  const grant = { recipientId: binding.buyer.documentNumber, grantedAtMs: cdr.receivedAtMs,
    evidenceRef: "private:delivery-proof", recordedBy: "operator-synthetic" };
  assert.doesNotThrow(() => assertFiscalV1DocumentGrant(grant, binding.buyer.documentNumber));
  assert.throws(() => assertFiscalV1DocumentGrant(grant, "20987654321"), /DOCUMENT_GRANT_INVALID/);
  assert.throws(() => assertFiscalV1DocumentGrant({ ...grant, evidenceRef: "" }), /DOCUMENT_GRANT_INVALID/);
});

