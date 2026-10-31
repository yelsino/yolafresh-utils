import { test } from "node:test";
import assert from "node:assert/strict";
import { assertFiscalV1ProviderChannelReceipt, validateFiscalProcess, type FiscalV1ProviderChannelReceipt,
  type FiscalProcess } from "../contracts";
import { assertFiscalV1DocumentGrant, assertFiscalV1PrintEvidence,
  assertFiscalV1TributaryResult, fiscalV1TributaryStatus,
  validateFiscalV1PrintEvidence, validateFiscalV1TributaryResult,
  type FiscalV1PrintEvidence, type FiscalV1PrintEvidenceBinding,
  type FiscalV1TributaryResult } from "../contracts";

const HASH = "a".repeat(64);
const receipt: FiscalV1ProviderChannelReceipt = { schemaVersion: "fiscal-v1-provider-channel-v1",
  assurance: "PROVIDER_AUTHENTICATED_CHANNEL", provider: "XmlPeru", origin: "https://api.xmlperu.dev",
  tenantId: "synthetic-tenant", issuerRuc: "20123456789", environment: "PRODUCTION", externalId: "synthetic-external",
  documentType: "01", series: "F001", number: 12, artifactKind: "SIGNED_XML", artifactSha256: HASH,
  receivedAtMs: 1792429200000 };
const receiptBinding = { tenantId: receipt.tenantId, issuerRuc: receipt.issuerRuc, environment: receipt.environment,
  externalId: receipt.externalId, documentType: receipt.documentType, series: receipt.series, number: receipt.number,
  artifactKind: receipt.artifactKind, artifactSha256: receipt.artifactSha256 };

test("provider-channel provenance binds scope, fiscal identity and exact bytes without claiming independent X509", () => {
  assert.doesNotThrow(() => assertFiscalV1ProviderChannelReceipt(receipt, receiptBinding, receipt.receivedAtMs));
  for (const changed of [{ tenantId: "another-tenant" }, { issuerRuc: "20987654321" }, { environment: "DEMO" },
    { externalId: "other-external" }, { documentType: "03" }, { series: "F002" }, { number: 13 },
    { artifactKind: "CDR" }, { artifactSha256: "b".repeat(64) }, { receivedAtMs: receipt.receivedAtMs - 1 },
    { assurance: "INDEPENDENT_X509" }, { origin: "https://attacker.invalid" }, { token: "never-store-secret" }])
    assert.throws(() => assertFiscalV1ProviderChannelReceipt({ ...receipt, ...changed }, receiptBinding, receipt.receivedAtMs),
      /FISCAL_V1_PROVIDER_RECEIPT_INVALID/);
});

test("a provider CDR receipt cannot be attached to different custody bytes", () => {
  const result = { storageRef: "opaque-cdr", sha256: HASH, receivedAtMs: receipt.receivedAtMs,
    outcome: "ACCEPTED", responseCode: "0", description: "Accepted", observations: [],
    providerReceipt: { ...receipt, artifactKind: "CDR" } };
  assert.deepEqual(validateFiscalV1TributaryResult(result, { requireDetails: true }), []);
  assert.ok(validateFiscalV1TributaryResult({ ...result, sha256: "b".repeat(64) }).includes("providerReceipt"));
  assert.ok(validateFiscalV1TributaryResult({ ...result, providerReceipt: receipt }).includes("providerReceipt"));
});

test("an authenticated resolved rejection without a CDR remains distinct from unverified provider reports", () => {
  const receivedAt = new Date(receipt.receivedAtMs).toISOString();
  const issuedAt = new Date(receipt.receivedAtMs - 1000).toISOString();
  const process: FiscalProcess = { type: "proceso_fiscal", processId: "opaque-process", tenantId: receipt.tenantId,
    documentId: "opaque-document", operation: "EMISION", state: "RECHAZADO", createdAt: issuedAt, updatedAt: receivedAt,
    attemptCount: 1, lastAttemptAt: issuedAt, nextAttemptAt: null, batchRef: null, provider: "XMLPERU_V1",
    providerRequestId: receipt.externalId, operationXml: null, submittedXmlSha256: HASH,
    result: { source: "PROVEEDOR_AUTENTICADO", receivedAt, operation: "EMISION",
      targetIdentity: { issuerRuc: receipt.issuerRuc, documentType: "FACTURA", series: "F001", number: 12 },
      status: "RECHAZADO", responseCode: "2335", description: "Rejected", observations: [],
      artifact: { storageRef: "opaque-provider-result", sha256: HASH },
      providerReceipt: { ...receipt, artifactKind: "PROVIDER_RESULT" } } };
  assert.deepEqual(validateFiscalProcess(process), []);
  assert.ok(validateFiscalProcess({ ...process, providerRequestId: "wrong-external-id" }).includes("result.providerReceipt"));
  assert.ok(validateFiscalProcess({ ...process, result: { ...process.result, providerReceipt: undefined } }).length > 0);
  assert.ok(validateFiscalProcess({ ...process, state: "ACEPTADO", result: { ...process.result, status: "ACEPTADO", responseCode: "0" } }).length > 0);
  assert.ok(validateFiscalProcess({ ...process, result: { source: "PROVEEDOR", reportedAt: receivedAt,
    reportedStatus: "rejected", description: "Unverified" } }).includes("result.stateMismatch"));
});

test("provider printable digest compatibility requires explicit matching assurance; custody still uses SHA-256", () => {
  const strictBinding: FiscalV1PrintEvidenceBinding = { environment: "PRODUCTION",
    identity: { issuerRuc: "20123456789", documentType: "01", series: "F001", number: 12 },
    issuedOn: "2026-10-19", currency: "PEN", totalCents: 11800, taxCents: 1800,
    buyer: { documentType: "RUC", documentNumber: "10123456789" }, signedXmlSha256: HASH };
  const value = { signedXmlSha256: HASH, digestOutsideQr: true, signedAt: "2026-10-19T12:00:00-05:00",
    qrPayload: "20123456789|01|F001|12|18.00|118.00|2026-10-19|6|10123456789",
    legalLegend: "FACTURA ELECTRÓNICA", digestValue: Buffer.alloc(20, 4).toString("base64"),
    evidenceAssurance: "PROVIDER_AUTHENTICATED_CHANNEL" as const };
  const bound = { ...strictBinding, evidenceAssurance: "PROVIDER_AUTHENTICATED_CHANNEL" as const };
  assert.deepEqual(validateFiscalV1PrintEvidence(value, bound), []);
  assert.ok(validateFiscalV1PrintEvidence(value, strictBinding).includes("print.evidenceAssurance"));
  assert.ok(validateFiscalV1PrintEvidence({ ...value, evidenceAssurance: undefined }, strictBinding).includes("print.digestValue"));
});
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

