import assert from "node:assert/strict";
import test from "node:test";

import {
  FISCAL_CPE_CONTRACT_VERSION,
  canAutomaticallySubmitFiscalState,
  isFiscalTerminalState,
  isSameFiscalDocumentIdentity,
  validateFiscalCdrVerificationV1,
  validateFiscalEvidenceV1,
  validateFiscalIntentV1,
  validateFiscalIntentSnapshotLinkV1,
  validateFiscalSaleSnapshotV1,
  type FiscalEvidenceV1,
  type FiscalIntentV1,
  type FiscalSaleSnapshotV1,
} from "../contracts";

const intent: FiscalIntentV1 = {
  version: FISCAL_CPE_CONTRACT_VERSION,
  intentId: "intent_001",
  idempotencyKey: "stable-key-001",
  tenantId: "yolafresh__dev",
  actorId: "seller_001",
  saleId: "sale_001",
  saleSnapshotId: "snapshot_001",
  requestedDocumentType: "BOLETA",
  buyer: { documentType: "SIN_DOCUMENTO", documentNumber: null, legalName: "Consumidor final" },
  occurredAt: "2026-09-15T13:00:00.000Z",
  queuedAt: "2026-09-15T13:00:01.000Z",
};

const snapshot: FiscalSaleSnapshotV1 = {
  version: FISCAL_CPE_CONTRACT_VERSION,
  fiscalSnapshotId: "frozen_001",
  intentId: intent.intentId,
  tenantId: intent.tenantId,
  saleId: intent.saleId,
  saleSnapshotId: intent.saleSnapshotId,
  issuerRuc: "10770681397",
  issuerLegalName: "Empresa Demo",
  taxRegime: "RER",
  documentType: "BOLETA",
  buyer: intent.buyer,
  currency: "PEN",
  lines: [
    {
      lineId: "line_1",
      description: "Producto gravado",
      quantity: 1,
      unitCode: "NIU",
      unitPriceCents: 1180,
      discountCents: 0,
      totalCents: 1180,
      tax: {
        category: "GRAVADA",
        affectationCode: "10",
        taxScheme: "IGV",
        taxRateBasisPoints: 1800,
        taxableBaseCents: 1000,
        taxAmountCents: 180,
      },
    },
    {
      lineId: "line_2",
      description: "Producto exonerado",
      quantity: 1,
      unitCode: "NIU",
      unitPriceCents: 500,
      discountCents: 0,
      totalCents: 500,
      tax: {
        category: "EXONERADA",
        affectationCode: "20",
        taxScheme: "NONE",
        taxRateBasisPoints: 0,
        taxableBaseCents: 500,
        taxAmountCents: 0,
      },
    },
  ],
  totalCents: 1680,
  payment: { status: "PAID", paidAmountCents: 1680, paidAt: "2026-09-15T13:00:00.000Z" },
  frozenAt: "2026-09-15T13:00:02.000Z",
};

test("intención fiscal v1 conserva identidad y no concede número", () => {
  assert.deepEqual(validateFiscalIntentV1(intent), []);
  assert.equal("series" in intent, false);
  assert.equal("number" in intent, false);
  assert.equal("issuerRuc" in intent, false);
});

test("intención fiscal rechaza identidad incompleta y fecha inválida", () => {
  const invalid = {
    ...intent,
    saleSnapshotId: " ",
    buyer: { documentType: "RUC" as const, documentNumber: null, legalName: " " },
    queuedAt: "not-a-date",
  };
  assert.deepEqual(validateFiscalIntentV1(invalid), [
    "saleSnapshotId",
    "buyer.legalName",
    "buyer.documentNumber",
    "queuedAt",
  ]);
});

test("snapshot fiscal exige afectación e impuesto por cada línea", () => {
  assert.deepEqual(validateFiscalSaleSnapshotV1(snapshot), []);
  assert.equal(snapshot.lines[0].tax.taxRateBasisPoints, 1800);
  assert.equal(snapshot.lines[1].tax.taxRateBasisPoints, 0);
});

test("snapshot congelado conserva vínculo exacto con intención y venta", () => {
  assert.deepEqual(validateFiscalIntentSnapshotLinkV1(intent, snapshot), []);
  assert.deepEqual(validateFiscalIntentSnapshotLinkV1(intent, { ...snapshot, tenantId: "other" }), ["tenantId"]);
});

test("snapshot fiscal exige venta efectivamente pagada por el monto aplicado", () => {
  assert.deepEqual(validateFiscalSaleSnapshotV1({
    ...snapshot,
    payment: { ...snapshot.payment, paidAmountCents: 1700 },
  }), ["payment.totalMismatch"]);
});

test("NRUS no puede construir factura fiscal", () => {
  assert.deepEqual(validateFiscalSaleSnapshotV1({
    ...snapshot,
    taxRegime: "NRUS",
    documentType: "FACTURA",
  }), ["taxRegime.documentType"]);
});

test("snapshot fiscal detecta categoría/tasa inconsistente y total no conciliado", () => {
  const invalid: FiscalSaleSnapshotV1 = {
    ...snapshot,
    lines: [
      snapshot.lines[0],
      {
        ...snapshot.lines[1],
        tax: {
          ...snapshot.lines[1].tax,
          taxRateBasisPoints: 1800,
          taxAmountCents: 90,
        } as unknown as FiscalSaleSnapshotV1["lines"][number]["tax"],
      },
    ],
    totalCents: 1000,
  };
  assert.deepEqual(validateFiscalSaleSnapshotV1(invalid), [
    "payment.totalMismatch",
    "lines[1].tax.nonTaxableAmounts",
    "totalCents.linesMismatch",
  ]);
});

test("timeout o envío PSE no permiten reenvío automático ni simulan aceptación", () => {
  assert.equal(canAutomaticallySubmitFiscalState("RECIBIDA_BACKEND"), true);
  assert.equal(canAutomaticallySubmitFiscalState("ENVIADA_PSE"), false);
  assert.equal(canAutomaticallySubmitFiscalState("RESULTADO_DESCONOCIDO"), false);
  assert.equal(isFiscalTerminalState("RESULTADO_DESCONOCIDO"), false);
  assert.equal(isFiscalTerminalState("ACEPTADO_CON_OBSERVACION"), true);
});

test("evidencia terminal requiere identidad, XML firmado y CDR, no HTTP 200", () => {
  const evidence: FiscalEvidenceV1 = {
    version: FISCAL_CPE_CONTRACT_VERSION,
    fiscalDocumentId: "doc_001",
    intentId: intent.intentId,
    tenantId: intent.tenantId,
    saleId: intent.saleId,
    issuerRuc: snapshot.issuerRuc,
    documentType: "BOLETA",
    series: "B001",
    number: 1,
    status: "ACEPTADO",
    issuedAt: "2026-09-15T13:00:03.000Z",
    provider: "SmartPSE",
    providerRequestId: null,
    signedXmlStorageRef: "evidence/xml/001",
    signedXmlSha256: "a".repeat(64),
    cdrStorageRef: "evidence/cdr/001",
    cdrSha256: "b".repeat(64),
    sunatResponseCode: "0",
    sunatResponseDescription: "Aceptado",
    observations: [],
  };
  assert.equal(evidence.status, "ACEPTADO");
  assert.equal(evidence.issuerRuc, snapshot.issuerRuc);
  assert.equal(evidence.cdrSha256.length, 64);
  assert.equal("httpStatus" in evidence, false);
  assert.deepEqual(validateFiscalEvidenceV1(evidence), []);
  const identity = {
    issuerRuc: evidence.issuerRuc,
    documentType: evidence.documentType,
    series: evidence.series,
    number: evidence.number,
  };
  const cdr = {
    identity,
    responseCode: evidence.sunatResponseCode,
    responseDescription: evidence.sunatResponseDescription,
    status: evidence.status,
    observations: evidence.observations,
    signedXmlStorageRef: evidence.signedXmlStorageRef,
    signedXmlSha256: evidence.signedXmlSha256,
    cdrStorageRef: evidence.cdrStorageRef,
    cdrSha256: evidence.cdrSha256,
  };
  assert.equal(isSameFiscalDocumentIdentity(identity, { ...identity, number: 2 }), false);
  assert.deepEqual(validateFiscalCdrVerificationV1(cdr, identity), []);
  assert.deepEqual(validateFiscalCdrVerificationV1(cdr, { ...identity, number: 2 }), ["identity"]);
});

test("subpath fiscal publica contratos v1 y validadores", () => {
  const fiscal = require("yola-fresh-utils/fiscal/contracts") as Record<string, unknown>;
  assert.equal(fiscal.FISCAL_CPE_CONTRACT_VERSION, 1);
  assert.equal(typeof fiscal.validateFiscalIntentV1, "function");
  assert.equal(typeof fiscal.validateFiscalSaleSnapshotV1, "function");
  assert.equal(typeof fiscal.validateFiscalCdrVerificationV1, "function");
});
