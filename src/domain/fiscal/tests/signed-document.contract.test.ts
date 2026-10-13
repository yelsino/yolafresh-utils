import assert from "node:assert/strict";
import test from "node:test";
import {
  FISCAL_DOCUMENT_TYPE,
  FISCAL_PROCESS_TYPE,
  FISCAL_CPE_SCHEMA_VERSION,
  FISCAL_SALE_SNAPSHOT_CONTRACT_KIND,
  canAutomaticallyTransmitFiscalProcess,
  isFiscalSignedDocumentPrintable,
  validateFiscalProcess,
  validateFiscalProcessDocumentLink,
  validateFiscalSignedDocument,
  validateFiscalSignedDocumentSnapshotLink,
  type FiscalProcess,
  type FiscalSignedDocument,
  type FiscalSaleSnapshot,
} from "../contracts";

const signedDigest = Buffer.alloc(32, 0xab).toString("base64");
const demoSha1Digest = Buffer.alloc(20, 0xab).toString("base64");
const document: FiscalSignedDocument = {
  type: FISCAL_DOCUMENT_TYPE,
  documentId: "opaque-document-domain-id",
  tenantId: "synthetic-tenant",
  environment: "DEMO",
  identity: { issuerRuc: "10770681397", documentType: "BOLETA", series: "B001", number: 24 },
  origin: { kind: "VENTA", saleId: "sale-a", saleSnapshotId: "snapshot-a",
    intentId: "intent-a", fiscalSnapshotId: "fiscal-a" },
  issuer: { legalName: "Emisor sintético", fiscalAddress: "Domicilio de prueba",
    establishmentCode: "0000" },
  buyer: { documentType: "SIN_DOCUMENTO", documentNumber: null, legalName: "Consumidor final" },
  currency: "PEN",
  issueDate: "2026-10-08",
  issuedAt: "2026-10-08T10:00:00-05:00",
  signedAt: "2026-10-08T10:00:01-05:00",
  lines: [{
    lineId: "line-a", description: "Tomate fresco por kilo", quantity: "1.000",
    unitCode: "KGM", unitPriceCents: 500, grossCents: 500,
    discountCents: 0, totalCents: 500,
    tax: { category: "EXONERADA", affectationCode: "20", taxScheme: "NONE",
      taxRateBasisPoints: 0, taxableBaseCents: 500, taxAmountCents: 0 },
  }],
  totals: { taxableBaseCents: 0, exemptCents: 500, unaffectedCents: 0,
    taxCents: 0, payableCents: 500 },
  signature: { signedXml: { storageRef: "private/xml/synthetic", sha256: "a".repeat(64) },
    digestValue: signedDigest },
  print: { qrPayload: `10770681397|03|B001|00000024|0.00|5.00|2026-10-08|0||${signedDigest}`,
    digestOutsideQr: false,
    legalLegend: "BOLETA ELECTRÓNICA DEMO — SIN VALIDEZ TRIBUTARIA" },
};

const pending: FiscalProcess = {
  type: FISCAL_PROCESS_TYPE,
  processId: "opaque-process-domain-id",
  tenantId: document.tenantId,
  documentId: document.documentId,
  operation: "EMISION",
  state: "PENDIENTE_ENVIO",
  createdAt: "2026-10-08T10:00:02-05:00",
  updatedAt: "2026-10-08T10:00:02-05:00",
  attemptCount: 0,
  lastAttemptAt: null,
  nextAttemptAt: null,
  batchRef: null,
  provider: null,
  providerRequestId: null,
  operationXml: null,
  submittedXmlSha256: null,
  result: null,
};
const now = "2026-10-08T10:00:02-05:00";

const { grossCents: _grossCents, ...frozenLine } = document.lines[0];
const snapshot: FiscalSaleSnapshot = {
  contractKind: FISCAL_SALE_SNAPSHOT_CONTRACT_KIND,
  schemaVersion: FISCAL_CPE_SCHEMA_VERSION,
  fiscalSnapshotId: "fiscal-a", intentId: "intent-a", tenantId: "synthetic-tenant",
  saleId: "sale-a", saleSnapshotId: "snapshot-a", issuerRuc: "10770681397",
  issuerLegalName: "Emisor sintético", taxRegime: "RER", documentType: "BOLETA",
  buyer: document.buyer, currency: "PEN", totalCents: 500,
  payment: { status: "PAID", paidAmountCents: 500, paidAt: "2026-10-08T09:59:58-05:00" },
  frozenAt: "2026-10-08T09:59:59-05:00",
  lines: [{ ...frozenLine, quantity: 1,
    commercialGrossBeforeDiscountCents: 500,
    commercialGrossDiscountCents: 0, taxableBaseBeforeDiscountCents: 500,
    baseDiscountCents: 0, discountReasonCode: "00", unitPriceTaxMode: "TAX_INCLUDED" }],
};

test("el CPE firmado se imprime sin CDR, red ni proceso finalizado", () => {
  assert.deepEqual(validateFiscalSignedDocument(document), []);
  assert.equal(isFiscalSignedDocumentPrintable(document), true);
  assert.deepEqual(validateFiscalProcess(pending), []);
  assert.equal(canAutomaticallyTransmitFiscalProcess(pending, document, now), true);
  assert.deepEqual(validateFiscalProcessDocumentLink(pending, document), []);
  assert.deepEqual(validateFiscalSignedDocumentSnapshotLink(document, snapshot), []);
  assert.equal("cdr" in document, false);
  assert.equal("status" in document, false);
  assert.equal("_id" in document, false);
  assert.deepEqual(validateFiscalSignedDocument({ ...document, _id: "opaque/couch/random-9" }), []);
  assert.deepEqual(validateFiscalProcess({ ...pending, _id: "unrelated-technical-id" }), []);
});

test("acepta QR del emisor y el redondeo fiscal de una venta por peso", () => {
  const weighted: FiscalSignedDocument = { ...document,
    lines: [{ ...document.lines[0], quantity: "0.375", unitPriceCents: 800,
      grossCents: 300, totalCents: 300, tax: { ...document.lines[0].tax,
        taxableBaseCents: 300 } }],
    totals: { ...document.totals, exemptCents: 300, payableCents: 300 },
    print: { ...document.print, qrPayload: document.print.qrPayload.replace("|5.00|", "|3.00|") },
  };
  assert.deepEqual(validateFiscalSignedDocument(weighted), []);
  assert.equal(isFiscalSignedDocumentPrintable(weighted), true);
});

test("Demo admite DigestValue SHA-1 canónico del proveedor y conserva SHA-256", () => {
  const demoSha1: FiscalSignedDocument = { ...document,
    signature: { ...document.signature, digestValue: demoSha1Digest },
    print: { ...document.print,
      qrPayload: document.print.qrPayload.replace(signedDigest, demoSha1Digest) },
  };
  assert.deepEqual(validateFiscalSignedDocument(demoSha1), []);
  assert.equal(isFiscalSignedDocumentPrintable(demoSha1), true);
  assert.deepEqual(validateFiscalSignedDocument(document), []);
});

test("producción exige DigestValue SHA-256 y rechaza SHA-1 aunque coincida con QR", () => {
  const production: FiscalSignedDocument = { ...document, environment: "PRODUCCION",
    print: { ...document.print, legalLegend: "Representación impresa de boleta electrónica" },
  };
  assert.deepEqual(validateFiscalSignedDocument(production), []);
  const productionSha1: FiscalSignedDocument = { ...production,
    signature: { ...production.signature, digestValue: demoSha1Digest },
    print: { ...production.print,
      qrPayload: production.print.qrPayload.replace(signedDigest, demoSha1Digest) },
  };
  assert.ok(validateFiscalSignedDocument(productionSha1).includes("signature.digestValue"));
  assert.equal(isFiscalSignedDocumentPrintable(productionSha1), false);
});

test("rechaza base64 no canónico y DigestValue con longitud inválida en Demo", () => {
  for (const invalidDigest of ["signed-digest", "A".repeat(23) + "=",
    demoSha1Digest.slice(0, -2) + "B=", Buffer.alloc(19, 0xab).toString("base64")]) {
    const invalid: FiscalSignedDocument = { ...document,
      signature: { ...document.signature, digestValue: invalidDigest },
      print: { ...document.print,
        qrPayload: document.print.qrPayload.replace(signedDigest, invalidDigest) },
    };
    assert.ok(validateFiscalSignedDocument(invalid).includes("signature.digestValue"), invalidDigest);
    assert.equal(isFiscalSignedDocumentPrintable(invalid), false);
  }
});

test("el comprobante firmado no puede cambiar emisor, venta ni impuestos congelados", () => {
  assert.ok(validateFiscalSignedDocumentSnapshotLink({ ...document,
    identity: { ...document.identity, issuerRuc: "20616438400" },
    print: { ...document.print, qrPayload: document.print.qrPayload.replace(
      "10770681397|", "20616438400|") } }, snapshot)
    .includes("identity.issuerRuc"));
  assert.ok(validateFiscalSignedDocumentSnapshotLink({ ...document,
    origin: { kind: "VENTA", saleId: "different-sale", saleSnapshotId: "snapshot-a",
      intentId: "intent-a", fiscalSnapshotId: "fiscal-a" } }, snapshot)
    .includes("origin.saleId"));
  assert.ok(validateFiscalSignedDocumentSnapshotLink({ ...document,
    lines: [{ ...document.lines[0], tax: { ...document.lines[0].tax,
      affectationCode: "30" } }] }, snapshot).length > 0);
});

test("raíz y subpaths publican el mismo contrato fiscal", () => {
  const root = require("yola-fresh-utils") as Record<string, unknown>;
  const fiscal = require("yola-fresh-utils/fiscal") as Record<string, unknown>;
  const contracts = require("yola-fresh-utils/fiscal/contracts") as Record<string, unknown>;
  assert.equal(root.FISCAL_DOCUMENT_TYPE, FISCAL_DOCUMENT_TYPE);
  assert.equal(root.validateFiscalSignedDocument, fiscal.validateFiscalSignedDocument);
  assert.equal(root.validateFiscalProcess, contracts.validateFiscalProcess);
});

test("no habilita papel si falta firma, QR o detalle conciliado", () => {
  assert.ok(validateFiscalSignedDocument({ ...document, signature: null }).includes("signature"));
  assert.ok(validateFiscalSignedDocument({ ...document, environment: undefined })
    .includes("environment"));
  assert.ok(validateFiscalSignedDocument({ ...document, print: { ...document.print,
    legalLegend: "Representación impresa de boleta electrónica" } })
    .includes("print.legalLegend.demoWarning"));
  assert.ok(validateFiscalSignedDocument({ ...document, environment: "PRODUCCION" })
    .includes("print.legalLegend.productionMismatch"));
  assert.deepEqual(validateFiscalSignedDocument({ ...document, environment: "PRODUCCION",
    print: { ...document.print, legalLegend: "Representación impresa de boleta electrónica" } }), []);
  assert.ok(validateFiscalSignedDocument({ ...document, print: { ...document.print,
    qrPayload: "" } }).includes("print.qrPayload"));
  assert.ok(validateFiscalSignedDocument({ ...document, print: { ...document.print,
    qrPayload: document.print.qrPayload.replace("|00000024|", "|00000025|") } })
    .includes("print.qrPayload.identityMismatch"));
  assert.ok(validateFiscalSignedDocument({ ...document, print: { ...document.print,
    qrPayload: document.print.qrPayload.replace("|5.00|", "|6.00|") } })
    .includes("print.qrPayload.amountMismatch"));
  assert.ok(validateFiscalSignedDocument({ ...document, print: { ...document.print,
    qrPayload: document.print.qrPayload.replace(signedDigest, Buffer.alloc(32, 0xcd).toString("base64")) } })
    .includes("print.qrPayload.digestMismatch"));
  assert.ok(validateFiscalSignedDocument({ ...document,
    signature: { ...document.signature, digestValue: "signed-digest" },
    print: { ...document.print,
      qrPayload: document.print.qrPayload.replace(signedDigest, "signed-digest") } })
    .includes("signature.digestValue"));
  assert.ok(validateFiscalSignedDocument({ ...document, rawXml: "<Invoice/>", jwt: "secret" })
    .includes("unknown.rawXml"));
  assert.ok(validateFiscalSignedDocument({ ...document, signature: {
    ...document.signature, jwt: "secret" } }).includes("signature.unknown.jwt"));
  assert.ok(validateFiscalSignedDocument({ ...document, totals: { ...document.totals,
    payableCents: 499 } }).includes("totals.payableCents.linesMismatch"));
  assert.ok(validateFiscalSignedDocument({ ...document, lines: [{ ...document.lines[0],
    quantity: "2.000" }] }).includes("lines[0].unitPriceQuantityMismatch"));
  assert.equal(isFiscalSignedDocumentPrintable({ ...document, signedAt: "not-a-time" }), false);
});

test("una nota referencia al CPE original; no suplanta a la venta", () => {
  const note: FiscalSignedDocument = {
    ...document,
    documentId: "different-note-id",
    identity: { ...document.identity, documentType: "NOTA_CREDITO", series: "BC01" },
    print: { ...document.print, qrPayload: document.print.qrPayload.replace("|03|B001|", "|07|BC01|"),
      legalLegend: "NOTA DE CRÉDITO ELECTRÓNICA DEMO — SIN VALIDEZ TRIBUTARIA" },
    origin: { kind: "CORRECCION", originalDocumentId: document.documentId,
      originalIdentity: document.identity, reasonCode: "01", reason: "Devolución" },
  };
  assert.deepEqual(validateFiscalSignedDocument(note), []);
  assert.ok(validateFiscalSignedDocument({ ...note, origin: document.origin })
    .includes("origin.documentType"));
});

test("reporte del proveedor y CDR son hechos distintos", () => {
  const reported: FiscalProcess = { ...pending, state: "REPORTADO_PROVEEDOR",
    updatedAt: "2026-10-08T10:00:04-05:00", attemptCount: 1,
    provider: "Proveedor demo", providerRequestId: "req-1",
    submittedXmlSha256: document.signature.signedXml.sha256,
    lastAttemptAt: "2026-10-08T10:00:03-05:00",
    result: { source: "PROVEEDOR", reportedStatus: "05", description: "Aceptado en Demo",
      reportedAt: "2026-10-08T10:00:04-05:00" } };
  assert.deepEqual(validateFiscalProcess(reported), []);
  assert.equal(canAutomaticallyTransmitFiscalProcess(reported, document, now), false);
  assert.ok(validateFiscalProcess({ ...reported, state: "ACEPTADO" })
    .includes("result.stateMismatch"));
  const accepted: FiscalProcess = { ...reported, state: "ACEPTADO",
    result: { source: "CDR", receivedAt: "2026-10-08T10:00:05-05:00",
      operation: "EMISION", targetIdentity: document.identity, status: "ACEPTADO", responseCode: "0",
      description: "Aceptado", observations: [],
      cdr: { storageRef: "private/cdr/synthetic", sha256: "b".repeat(64) } } };
  assert.deepEqual(validateFiscalProcessDocumentLink(accepted, document), []);
  assert.ok(validateFiscalProcessDocumentLink({ ...accepted,
    submittedXmlSha256: "e".repeat(64) }, document)
    .includes("submittedXmlSha256.documentMismatch"));
  assert.ok(validateFiscalProcess({ ...accepted, rawXml: "<Invoice/>", jwt: "secret" })
    .includes("unknown.rawXml"));
  assert.ok(validateFiscalProcessDocumentLink({ ...accepted, result: {
    ...accepted.result!, targetIdentity: { ...document.identity, number: 25 },
  } as FiscalProcess["result"] }, document).includes("result.targetIdentityMismatch"));
});

test("timeout no autoriza reenvío automático del mismo XML", () => {
  const uncertain: FiscalProcess = { ...pending, state: "RESULTADO_DESCONOCIDO",
    updatedAt: "2026-10-08T10:00:04-05:00", attemptCount: 1,
    provider: "Proveedor demo", providerRequestId: "req-1",
    submittedXmlSha256: document.signature.signedXml.sha256,
    lastAttemptAt: "2026-10-08T10:00:03-05:00" };
  assert.deepEqual(validateFiscalProcess(uncertain), []);
  assert.equal(canAutomaticallyTransmitFiscalProcess(uncertain, document, now), false);
  assert.equal(canAutomaticallyTransmitFiscalProcess({ ...uncertain,
    state: "PENDIENTE_ENVIO" }, document, now), false);
  assert.equal(canAutomaticallyTransmitFiscalProcess({ ...pending,
    documentId: "unknown" }, document, now), false);
  assert.deepEqual(validateFiscalProcessDocumentLink({ ...uncertain,
    documentId: "other-document" }, document), ["documentId"]);
});

test("la baja conserva su propia comunicación firmada", () => {
  const baja: FiscalProcess = { ...pending, processId: "baja-1", operation: "BAJA",
    operationXml: { storageRef: "private/baja/synthetic", sha256: "c".repeat(64) } };
  assert.deepEqual(validateFiscalProcess(baja), []);
  assert.ok(validateFiscalProcess({ ...baja, operationXml: null }).includes("operationXml"));
  const sent: FiscalProcess = { ...baja, attemptCount: 1, state: "RESULTADO_DESCONOCIDO",
    provider: "Proveedor demo", providerRequestId: "baja-req", submittedXmlSha256: "c".repeat(64),
    lastAttemptAt: "2026-10-08T10:00:03-05:00" };
  assert.deepEqual(validateFiscalProcessDocumentLink(sent, document), []);
  assert.ok(validateFiscalProcessDocumentLink({ ...sent,
    submittedXmlSha256: document.signature.signedXml.sha256 }, document)
    .includes("submittedXmlSha256.documentMismatch"));
  const accepted: FiscalProcess = { ...sent, state: "ACEPTADO", result: {
    source: "CDR", receivedAt: "2026-10-08T10:00:05-05:00", operation: "BAJA",
    targetIdentity: document.identity, status: "ACEPTADO", responseCode: "0",
    description: "Baja aceptada", observations: [],
    cdr: { storageRef: "private/cdr/baja-synthetic", sha256: "d".repeat(64) },
  } };
  assert.deepEqual(validateFiscalProcessDocumentLink(accepted, document), []);
  assert.ok(validateFiscalProcess({ ...accepted, result: { ...accepted.result!,
    operation: "EMISION" } }).includes("result.operation"));
});

test("respeta la hora programada y exige huella para todo intento", () => {
  const scheduled: FiscalProcess = { ...pending,
    nextAttemptAt: "2026-10-08T10:01:00-05:00" };
  assert.equal(canAutomaticallyTransmitFiscalProcess(scheduled, document, now), false);
  assert.equal(canAutomaticallyTransmitFiscalProcess(scheduled, document,
    "2026-10-08T10:01:00-05:00"), true);
  assert.ok(validateFiscalProcess({ ...pending, providerRequestId: "req-before-send" })
    .includes("providerRequestId.beforeAttempt"));
  assert.ok(validateFiscalProcess({ ...pending, attemptCount: 1,
    lastAttemptAt: now, provider: "Proveedor demo" }).includes("submittedXmlSha256.required"));
});
