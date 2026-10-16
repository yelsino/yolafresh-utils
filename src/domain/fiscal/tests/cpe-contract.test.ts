import assert from "node:assert/strict";
import test from "node:test";

import {
  FISCAL_CPE_CONTRACT_VERSION,
  FISCAL_INTENT_V2_CONTRACT_VERSION,
  FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION,
  FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION,
  FISCAL_SALE_SNAPSHOT_V2_CAPABILITY,
  canAutomaticallySubmitFiscalState,
  isFiscalTerminalState,
  isSameFiscalDocumentIdentity,
  validateFiscalCdrVerificationV1,
  validateFiscalEvidenceV1,
  validateFiscalIntent,
  validateFiscalIntentReplay,
  validateFiscalIntentV1,
  validateFiscalIntentV2,
  validateFiscalIntentSnapshotLinkV1,
  validateFiscalSaleSnapshot,
  validateFiscalSaleSnapshotV1,
  validateFiscalSaleSnapshotV2,
  type FiscalEvidenceV1,
  type FiscalIntentV1,
  type FiscalIntentV2,
  type FiscalSaleSnapshotV1,
  type FiscalSaleSnapshotV2,
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

const intentV2: FiscalIntentV2 = {
  ...intent,
  version: FISCAL_INTENT_V2_CONTRACT_VERSION,
  pricingDeclaration: {
    unitPriceTaxMode: "TAX_INCLUDED",
    taxComputationMode: "NOT_COMPUTED",
    currency: "PEN",
    commercialTotalCents: 1680,
  },
};

const snapshot: FiscalSaleSnapshotV2 = {
  version: FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION,
  capability: FISCAL_SALE_SNAPSHOT_V2_CAPABILITY,
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
      unitPriceTaxMode: "TAX_INCLUDED",
      discountCents: 0,
      commercialGrossBeforeDiscountCents: 1180,
      commercialGrossDiscountCents: 0,
      taxableBaseBeforeDiscountCents: 1000,
      baseDiscountCents: 0,
      discountReasonCode: "00",
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
      unitPriceTaxMode: "TAX_INCLUDED",
      discountCents: 0,
      commercialGrossBeforeDiscountCents: 500,
      commercialGrossDiscountCents: 0,
      taxableBaseBeforeDiscountCents: 500,
      baseDiscountCents: 0,
      discountReasonCode: "00",
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

function singleLineSnapshot(line: FiscalSaleSnapshotV2["lines"][number]): FiscalSaleSnapshotV2 {
  return { ...snapshot, fiscalSnapshotId: "d6f1ad92-345b-4134-9124-a57d43c016eb",
    lines: [line], totalCents: line.totalCents,
    payment: { status: "PAID", paidAmountCents: line.totalCents,
      paidAt: "2026-09-15T13:00:00.000Z" } };
}

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

test("intent V1 histórico sigue válido pero no acepta la declaración V2 ni campos desconocidos", () => {
  assert.deepEqual(validateFiscalIntentV1(intent), []);
  assert.deepEqual(validateFiscalIntent(intent), []);
  const mixed = { ...intent, pricingDeclaration: intentV2.pricingDeclaration } as FiscalIntentV1;
  assert.deepEqual(validateFiscalIntentV1(mixed), ["unknown.pricingDeclaration"]);
  assert.deepEqual(validateFiscalIntentV1({ ...intent,
    buyer: { ...intent.buyer, series: "B001" } } as FiscalIntentV1),
  ["buyer.unknown.series"]);
  assert.ok(validateFiscalIntentV1({ ...intent, buyer: null } as unknown as FiscalIntentV1)
    .includes("buyer"));
});

test("intent V2 declara precio TAX_INCLUDED sin cálculo tributario ni tocar snapshot", () => {
  assert.deepEqual(validateFiscalIntentV2(intentV2), []);
  assert.deepEqual(validateFiscalIntent(intentV2), []);
  assert.equal(intentV2.pricingDeclaration.commercialTotalCents, 1680);
  assert.equal("lines" in intentV2, false);
  assert.equal("tax" in intentV2, false);
  assert.equal("fiscalSnapshotId" in intentV2, false);
  assert.ok(validateFiscalIntentV1(intentV2 as unknown as FiscalIntentV1).includes("version"));
  assert.deepEqual(validateFiscalIntent({ ...intentV2, version: 3 } as unknown as FiscalIntentV2),
    ["version"]);
});

test("intent V2 rechaza EXACT, impuesto excluido, montos inválidos y payload extra", () => {
  assert.deepEqual(validateFiscalIntentV2({ ...intentV2,
    pricingDeclaration: { ...intentV2.pricingDeclaration,
      taxComputationMode: "EXACT" } } as unknown as FiscalIntentV2),
  ["pricingDeclaration.taxComputationMode"]);
  assert.deepEqual(validateFiscalIntentV2({ ...intentV2,
    pricingDeclaration: { ...intentV2.pricingDeclaration,
      unitPriceTaxMode: "TAX_EXCLUDED" } } as unknown as FiscalIntentV2),
  ["pricingDeclaration.unitPriceTaxMode"]);
  assert.deepEqual(validateFiscalIntentV2({ ...intentV2,
    pricingDeclaration: { ...intentV2.pricingDeclaration,
      commercialTotalCents: -1 } }),
  ["pricingDeclaration.commercialTotalCents"]);
  assert.deepEqual(validateFiscalIntentV2({ ...intentV2,
    pricingDeclaration: { ...intentV2.pricingDeclaration,
      taxAmountCents: 180 } } as FiscalIntentV2),
  ["pricingDeclaration.unknown.taxAmountCents"]);
  assert.deepEqual(validateFiscalIntentV2({ ...intentV2, issuerRuc: "10770681397" } as FiscalIntentV2),
    ["unknown.issuerRuc"]);
});

test("replay exige payload V1/V2 idéntico, incluida la declaración comercial", () => {
  assert.deepEqual(validateFiscalIntentReplay(intent, { ...intent }), []);
  assert.deepEqual(validateFiscalIntentReplay(intentV2, { ...intentV2,
    pricingDeclaration: { ...intentV2.pricingDeclaration } }), []);
  assert.deepEqual(validateFiscalIntentReplay(intentV2, { ...intentV2,
    pricingDeclaration: { ...intentV2.pricingDeclaration, commercialTotalCents: 1679 } }),
  ["replay.payloadMismatch"]);
  assert.deepEqual(validateFiscalIntentReplay(intentV2, { ...intentV2,
    buyer: { ...intentV2.buyer, legalName: "Otro comprador" } }),
  ["replay.payloadMismatch"]);
  assert.deepEqual(validateFiscalIntentReplay(intent, intentV2),
    ["replay.payloadMismatch"]);
  assert.deepEqual(validateFiscalIntentReplay(intentV2, { ...intentV2,
    pricingDeclaration: { ...intentV2.pricingDeclaration, taxRate: 18 } } as FiscalIntentV2),
  ["replay.pricingDeclaration.unknown.taxRate"]);
});

test("snapshot fiscal exige afectación e impuesto por cada línea", () => {
  assert.deepEqual(validateFiscalSaleSnapshot(snapshot), []);
  assert.deepEqual(validateFiscalSaleSnapshotV2(snapshot), []);
  assert.equal(snapshot.lines[0].tax.taxRateBasisPoints, 1800);
  assert.equal(snapshot.lines[0].unitPriceCents, 1180);
  assert.equal(snapshot.lines[0].tax.taxableBaseCents + snapshot.lines[0].tax.taxAmountCents,
    snapshot.lines[0].totalCents);
  assert.equal(snapshot.lines[1].tax.taxRateBasisPoints, 0);
});

test("snapshot V1 conserva solo la lectura legacy TAX_EXCLUDED y rechaza mezcla V2", () => {
  const { capability: _capability, ...snapshotWithoutCapability } = snapshot;
  const legacy: FiscalSaleSnapshotV1 = { ...snapshotWithoutCapability,
    version: FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION,
    payment: { status: "PAID", paidAmountCents: snapshot.totalCents,
      paidAt: "2026-09-15T13:00:00.000Z" },
    lines: snapshot.lines.map(({ unitPriceTaxMode: _mode,
      commercialGrossBeforeDiscountCents: _gross,
      commercialGrossDiscountCents: _discount,
      taxableBaseBeforeDiscountCents: _baseBefore,
      baseDiscountCents: _baseDiscount,
      discountReasonCode: _reason, ...line }, index) => ({ ...line,
        unitPriceCents: index === 0 ? 1000 : line.unitPriceCents })) };
  assert.deepEqual(validateFiscalSaleSnapshotV1(legacy), []);
  const mixed = { ...legacy, lines: [{ ...legacy.lines[0],
    unitPriceTaxMode: "TAX_INCLUDED" }, legacy.lines[1]] } as unknown as FiscalSaleSnapshotV1;
  assert.ok(validateFiscalSaleSnapshotV1(mixed).includes("lines[0].unitPriceTaxMode"));
  assert.ok(validateFiscalSaleSnapshotV1(snapshot as unknown as FiscalSaleSnapshotV1)
    .includes("version"));
  assert.ok(validateFiscalSaleSnapshotV1({ ...legacy, payment: {
    status: "DEFERRED", deferredAt: snapshot.frozenAt,
    deliveryDocumentId: "opaque-delivery", orderId: "opaque-order",
  } } as unknown as FiscalSaleSnapshotV1).includes("payment.status"));
});

test("snapshot V1 comprueba Cat07/Cat03 y precio sin tributo por cantidad", () => {
  const { capability: _capability, ...withoutCapability } = snapshot;
  const { unitPriceTaxMode: _mode, commercialGrossBeforeDiscountCents: _gross,
    commercialGrossDiscountCents: _discount,
    taxableBaseBeforeDiscountCents: _baseBefore, baseDiscountCents: _baseDiscount,
    discountReasonCode: _reason, ...line } = snapshot.lines[1];
  const legacy: FiscalSaleSnapshotV1 = { ...withoutCapability,
    version: FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION,
    lines: [{ ...line, lineId: "a3b86206-c335-4828-bbd7-97780c9bd798" }],
    totalCents: line.totalCents,
    payment: { status: "PAID", paidAmountCents: line.totalCents,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  assert.deepEqual(validateFiscalSaleSnapshotV1(legacy), []);
  assert.ok(validateFiscalSaleSnapshotV1({ ...legacy,
    lines: [{ ...legacy.lines[0], unitCode: "GRM" }] }).includes("lines[0].unitCode"));
  assert.ok(validateFiscalSaleSnapshotV1({ ...legacy,
    lines: [{ ...legacy.lines[0], unitPriceCents: 499 }] })
    .includes("lines[0].unitPriceQuantity"));
  assert.ok(validateFiscalSaleSnapshotV1({ ...legacy,
    lines: [{ ...legacy.lines[0], tax: { ...legacy.lines[0].tax,
      affectationCode: "30" } }] }).includes("lines[0].tax.affectationCode"));
});

test("Cat07 acepta solo la afectación onerosa coherente con cada categoría", () => {
  const exonerated = singleLineSnapshot(snapshot.lines[1]);
  const inafectaLine = { ...snapshot.lines[1], tax: {
    ...snapshot.lines[1].tax, category: "INAFECTA", affectationCode: "30",
  } } as FiscalSaleSnapshotV2["lines"][number];
  assert.deepEqual(validateFiscalSaleSnapshotV2(singleLineSnapshot(inafectaLine)), []);
  assert.ok(validateFiscalSaleSnapshotV2(singleLineSnapshot({ ...snapshot.lines[0],
    tax: { ...snapshot.lines[0].tax, affectationCode: "11" },
  })).includes("lines[0].tax.affectationCode"));
  assert.ok(validateFiscalSaleSnapshotV2({ ...exonerated, lines: [{ ...exonerated.lines[0],
    tax: { ...exonerated.lines[0].tax, affectationCode: "30" },
  }] }).includes("lines[0].tax.affectationCode"));
  const exportLine = { ...inafectaLine, tax: { ...inafectaLine.tax,
    category: "EXPORTACION", affectationCode: "40" } } as FiscalSaleSnapshotV2["lines"][number];
  const unsupported = validateFiscalSaleSnapshotV2(singleLineSnapshot(exportLine));
  assert.ok(unsupported.includes("lines[0].tax.category"));
  assert.ok(unsupported.includes("lines[0].tax.affectationCode"));
  const inheritedName = { ...inafectaLine, tax: { ...inafectaLine.tax,
    category: "toString" } } as unknown as FiscalSaleSnapshotV2["lines"][number];
  assert.ok(validateFiscalSaleSnapshotV2(singleLineSnapshot(inheritedName))
    .includes("lines[0].tax.category"));
});

test("Cat03 piloto y producto decimal half-up mantienen bruto y descuento por línea", () => {
  const fractional = { ...snapshot.lines[1], lineId: "11f28678-32f5-4ac0-ac57-44e0c66219e4",
    quantity: 0.335, unitCode: "KGM", unitPriceCents: 300,
    commercialGrossBeforeDiscountCents: 101, taxableBaseBeforeDiscountCents: 101,
    totalCents: 101, tax: { ...snapshot.lines[1].tax, taxableBaseCents: 101 },
  } as FiscalSaleSnapshotV2["lines"][number];
  assert.deepEqual(validateFiscalSaleSnapshotV2(singleLineSnapshot(fractional)), []);
  const halfCent = { ...fractional, quantity: 0.005, unitPriceCents: 100,
    commercialGrossBeforeDiscountCents: 1, taxableBaseBeforeDiscountCents: 1,
    totalCents: 1, tax: { ...fractional.tax, taxableBaseCents: 1 },
  } as FiscalSaleSnapshotV2["lines"][number];
  assert.deepEqual(validateFiscalSaleSnapshotV2(singleLineSnapshot(halfCent)), []);
  const discounted = { ...fractional, discountCents: 1,
    commercialGrossDiscountCents: 1, baseDiscountCents: 1, totalCents: 100,
    tax: { ...fractional.tax, taxableBaseCents: 100 },
  } as FiscalSaleSnapshotV2["lines"][number];
  assert.deepEqual(validateFiscalSaleSnapshotV2(singleLineSnapshot(discounted)), []);
  assert.ok(validateFiscalSaleSnapshotV2(singleLineSnapshot({ ...fractional,
    commercialGrossBeforeDiscountCents: 100 })).includes("lines[0].unitPriceQuantity"));
  assert.ok(validateFiscalSaleSnapshotV2(singleLineSnapshot({ ...fractional,
    unitCode: "GRM" })).includes("lines[0].unitCode"));
  assert.ok(validateFiscalSaleSnapshotV2(singleLineSnapshot({ ...fractional,
    quantity: 0.33500000001 })).includes("lines[0].quantity"));
  assert.ok(validateFiscalSaleSnapshotV2(singleLineSnapshot({ ...fractional,
    quantity: 1e-11 })).includes("lines[0].quantity"));
  assert.ok(validateFiscalSaleSnapshotV2(singleLineSnapshot({ ...fractional,
    discountCents: 101, commercialGrossDiscountCents: 101, baseDiscountCents: 101,
    totalCents: 0, tax: { ...fractional.tax, taxableBaseCents: 0 },
  } as FiscalSaleSnapshotV2["lines"][number])).includes("lines[0].unitPriceQuantity"));
});

test("cero y NRUS no convierten una clasificación no demostrada en gravada", () => {
  const zeroTax = { ...snapshot.lines[1], tax: {
    ...snapshot.lines[1].tax, category: "GRAVADA", affectationCode: "10",
    taxScheme: "NONE", taxRateBasisPoints: 0,
  } } as unknown as FiscalSaleSnapshotV2["lines"][number];
  const nrusZero = validateFiscalSaleSnapshotV2({ ...singleLineSnapshot(zeroTax),
    taxRegime: "NRUS" });
  assert.ok(nrusZero.includes("lines[0].tax.taxScheme"));
  assert.ok(nrusZero.includes("lines[0].tax.taxRateBasisPoints"));
  const mismatchedNonTaxed = validateFiscalSaleSnapshotV2({
    ...singleLineSnapshot(snapshot.lines[1]), taxRegime: "NRUS",
    lines: [{ ...snapshot.lines[1], tax: { ...snapshot.lines[1].tax,
      category: "INAFECTA", affectationCode: "20" } } as FiscalSaleSnapshotV2["lines"][number]],
  });
  assert.ok(mismatchedNonTaxed.includes("lines[0].tax.affectationCode"));
});

test("snapshot V2 exige capability y desglose TAX_INCLUDED consistente", () => {
  const missing = { ...snapshot, lines: [{ ...snapshot.lines[0],
    taxableBaseBeforeDiscountCents: undefined }, snapshot.lines[1]] } as unknown as FiscalSaleSnapshotV2;
  assert.ok(validateFiscalSaleSnapshotV2(missing)
    .includes("lines[0].taxableBaseBeforeDiscountCents"));
  const inconsistent = { ...snapshot, lines: [{ ...snapshot.lines[0],
    commercialGrossDiscountCents: 1 }, snapshot.lines[1]] };
  assert.ok(validateFiscalSaleSnapshotV2(inconsistent)
    .includes("lines[0].taxIncludedBreakdown"));
  assert.ok(validateFiscalSaleSnapshotV2({ ...snapshot,
    capability: "WRONG" } as unknown as FiscalSaleSnapshotV2).includes("capability"));

  const invalidPreDiscountTax: FiscalSaleSnapshotV2 = { ...snapshot,
    lines: [{ ...snapshot.lines[0], discountCents: 4,
      commercialGrossDiscountCents: 4, taxableBaseBeforeDiscountCents: 1001,
      baseDiscountCents: 4, totalCents: 1176,
      tax: { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV",
        taxRateBasisPoints: 1800, taxableBaseCents: 997, taxAmountCents: 179 } }],
    totalCents: 1176,
    payment: { status: "PAID", paidAmountCents: 1176,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  assert.deepEqual(validateFiscalSaleSnapshotV2(invalidPreDiscountTax),
    ["lines[0].preDiscountTaxArithmetic"]);

  const invalidPostDiscountTax: FiscalSaleSnapshotV2 = { ...snapshot,
    lines: [{ ...snapshot.lines[0], discountCents: 4,
      commercialGrossDiscountCents: 4, taxableBaseBeforeDiscountCents: 1000,
      baseDiscountCents: 2, totalCents: 1176,
      tax: { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV",
        taxRateBasisPoints: 1800, taxableBaseCents: 998, taxAmountCents: 178 } }],
    totalCents: 1176,
    payment: { status: "PAID", paidAmountCents: 1176,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  assert.deepEqual(validateFiscalSaleSnapshotV2(invalidPostDiscountTax),
    ["lines[0].postDiscountTaxArithmetic"]);
});

test("snapshot congelado conserva vínculo exacto con intención y venta", () => {
  assert.deepEqual(validateFiscalIntentSnapshotLinkV1(intent, snapshot), []);
  assert.deepEqual(validateFiscalIntentSnapshotLinkV1(intent, { ...snapshot, tenantId: "other" }), ["tenantId"]);
});

test("boleta V2 a crédito entregada conserva evidencia sin afirmar cobros ni saldos", () => {
  const deferred: FiscalSaleSnapshotV2 = { ...snapshot,
    payment: { status: "DEFERRED", deferredAt: "2026-09-15T12:00:00.000Z",
      deliveryDocumentId: "49b2749d-3416-424b-a8bd-9456f46a7b37", orderId: "opaque-order" } };
  assert.deepEqual(validateFiscalSaleSnapshotV2(deferred), []);
  assert.deepEqual(validateFiscalSaleSnapshotV2({ ...deferred, documentType: "FACTURA" }), ["payment.deferredDocumentType"]);
  assert.ok(validateFiscalSaleSnapshotV2({ ...deferred,
    payment: { ...deferred.payment, paidAmountCents: 0 } } as FiscalSaleSnapshotV2).includes("payment.unverifiedSettlement"));
  assert.ok(validateFiscalSaleSnapshotV2({ ...deferred,
    payment: { ...deferred.payment, deliveryDocumentId: "" } } as FiscalSaleSnapshotV2).includes("payment.deliveryDocumentId"));
});

test("snapshot fiscal exige venta efectivamente pagada por el monto aplicado", () => {
  assert.deepEqual(validateFiscalSaleSnapshotV2({
    ...snapshot,
    payment: { status: "PAID", paidAt: "2026-09-15T13:00:00.000Z", paidAmountCents: 1700 },
  }), ["payment.totalMismatch"]);
});

test("NRUS no puede construir factura fiscal", () => {
  assert.deepEqual(validateFiscalSaleSnapshotV2({
    ...snapshot,
    taxRegime: "NRUS",
    documentType: "FACTURA",
  }), ["taxRegime.documentType", "lines[0].tax.nrusDiscriminatedTax"]);
});

test("NRUS no convierte un IGV comercial en tributo desglosado de boleta", () => {
  assert.deepEqual(validateFiscalSaleSnapshotV2({
    ...snapshot,
    taxRegime: "NRUS",
  }), ["lines[0].tax.nrusDiscriminatedTax"]);
});

test("snapshot fiscal detecta categoría/tasa inconsistente y total no conciliado", () => {
  const invalid: FiscalSaleSnapshotV2 = {
    ...snapshot,
    lines: [
      snapshot.lines[0],
      {
        ...snapshot.lines[1],
        tax: {
          ...snapshot.lines[1].tax,
          taxRateBasisPoints: 1800,
          taxAmountCents: 90,
        } as unknown as FiscalSaleSnapshotV2["lines"][number]["tax"],
      },
    ],
    totalCents: 1000,
  };
  assert.deepEqual(validateFiscalSaleSnapshotV2(invalid), [
    "payment.totalMismatch",
    "lines[1].tax.nonTaxableAmounts",
    "totalCents.linesMismatch",
    "lines[1].taxIncludedBreakdown",
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

test("subpath fiscal publica contratos V1/V2 y validadores discriminados", () => {
  const fiscal = require("yola-fresh-utils/fiscal/contracts") as Record<string, unknown>;
  assert.equal(fiscal.FISCAL_CPE_CONTRACT_VERSION, 1);
  assert.equal(fiscal.FISCAL_INTENT_V2_CONTRACT_VERSION, 2);
  assert.equal(fiscal.FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION, 2);
  assert.equal(typeof fiscal.validateFiscalIntentV1, "function");
  assert.equal(typeof fiscal.validateFiscalIntentV2, "function");
  assert.equal(typeof fiscal.validateFiscalIntent, "function");
  assert.equal(typeof fiscal.validateFiscalIntentReplay, "function");
  assert.equal(typeof fiscal.validateFiscalSaleSnapshotV1, "function");
  assert.equal(typeof fiscal.validateFiscalSaleSnapshotV2, "function");
  assert.equal(typeof fiscal.validateFiscalCdrVerificationV1, "function");
});
