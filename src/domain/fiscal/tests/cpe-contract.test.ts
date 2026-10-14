import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  FISCAL_CPE_SCHEMA_VERSION,
  FISCAL_INTENT_CONTRACT_KIND,
  FISCAL_SALE_SNAPSHOT_CONTRACT_KIND,
  validateFiscalIntent,
  validateFiscalIntentReplay,
  validateFiscalIntentPricingDeclaration,
  validateFiscalIntentSnapshotLink,
  validateFiscalSaleSnapshot,
  type FiscalIntent,
  type FiscalSaleSnapshot,
} from "../contracts";

const intent: FiscalIntent = {
  contractKind: FISCAL_INTENT_CONTRACT_KIND,
  schemaVersion: FISCAL_CPE_SCHEMA_VERSION,
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
  pricingDeclaration: {
    taxComputationMode: "NOT_COMPUTED",
    currency: "PEN",
    commercialTotalCents: 1680,
    lines: [
      {
        lineId: "line_1",
        presentationId: "opaque-presentation-a",
        unitPriceTaxMode: "TAX_INCLUDED",
        agreedUnitPriceCents: 1180,
        agreedPriceSourceRef: "opaque-agreement-a",
        pricePolicyRef: "opaque-policy-a",
        pricePolicyVersion: "revision-a",
        fiscalPolicyRef: "opaque-fiscal-policy-a",
        fiscalPolicyVersion: "fiscal-revision-a",
        agreedAt: "2026-09-15T12:59:58.000Z",
      },
      {
        lineId: "line_2",
        presentationId: "opaque-presentation-b",
        unitPriceTaxMode: "TAX_INCLUDED",
        agreedUnitPriceCents: 500,
        agreedPriceSourceRef: "opaque-agreement-b",
        pricePolicyRef: "opaque-policy-b",
        pricePolicyVersion: "revision-b",
        fiscalPolicyRef: "opaque-fiscal-policy-b",
        fiscalPolicyVersion: "fiscal-revision-b",
        agreedAt: "2026-09-15T12:59:59.000Z",
      },
    ],
  },
};

const snapshot: FiscalSaleSnapshot = {
  contractKind: FISCAL_SALE_SNAPSHOT_CONTRACT_KIND,
  schemaVersion: FISCAL_CPE_SCHEMA_VERSION,
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

function singleLineSnapshot(line: FiscalSaleSnapshot["lines"][number]): FiscalSaleSnapshot {
  return { ...snapshot, fiscalSnapshotId: "d6f1ad92-345b-4134-9124-a57d43c016eb",
    lines: [line], totalCents: line.totalCents,
    payment: { status: "PAID", paidAmountCents: line.totalCents,
      paidAt: "2026-09-15T13:00:00.000Z" } };
}

function gravadaTax(baseCents: number, taxCents: number): FiscalSaleSnapshot["lines"][number]["tax"] {
  return { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV",
    taxRateBasisPoints: 1800, taxableBaseCents: baseCents, taxAmountCents: taxCents };
}

test("intención fiscal conserva identidad y no concede número", () => {
  assert.deepEqual(validateFiscalIntent(intent), []);
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
  assert.deepEqual(validateFiscalIntent(invalid), [
    "saleSnapshotId",
    "buyer.legalName",
    "buyer.documentNumber",
    "queuedAt",
  ]);
});

test("intent canónico declara precio con tributo incluido y políticas históricas por línea", () => {
  assert.deepEqual(validateFiscalIntent(intent), []);
  assert.deepEqual(validateFiscalIntentPricingDeclaration(intent.pricingDeclaration), []);
  assert.equal(intent.pricingDeclaration.lines[0].unitPriceTaxMode, "TAX_INCLUDED");
  assert.equal(intent.pricingDeclaration.lines[1].unitPriceTaxMode, "TAX_INCLUDED");
  assert.deepEqual(validateFiscalIntent({ ...intent, pricingDeclaration: {
    ...intent.pricingDeclaration,
    lines: [intent.pricingDeclaration.lines[0],
      { ...intent.pricingDeclaration.lines[1],
        presentationId: intent.pricingDeclaration.lines[0].presentationId,
        fiscalPolicyRef: intent.pricingDeclaration.lines[0].fiscalPolicyRef,
        fiscalPolicyVersion: intent.pricingDeclaration.lines[0].fiscalPolicyVersion }],
  } }), []);
  assert.deepEqual(validateFiscalIntent({ ...intent, pricingDeclaration: {
    ...intent.pricingDeclaration,
    lines: [{ ...intent.pricingDeclaration.lines[0],
      agreedAt: "2026-09-15T07:59:58.000-05:00" },
      intent.pricingDeclaration.lines[1]],
  } }), []);
  assert.equal("tax" in intent, false);
  assert.equal("approved" in intent.pricingDeclaration, false);
  const taxExcluded = { ...intent, pricingDeclaration: {
    ...intent.pricingDeclaration,
    lines: [{ ...intent.pricingDeclaration.lines[0], unitPriceTaxMode: "TAX_EXCLUDED" },
      intent.pricingDeclaration.lines[1]],
  } } as unknown as FiscalIntent;
  assert.ok(validateFiscalIntent(taxExcluded)
    .includes("pricingDeclaration.lines[0].unitPriceTaxMode"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    lines: [{ ...snapshot.lines[0], unitPriceTaxMode: "TAX_EXCLUDED" } as unknown as
      FiscalSaleSnapshot["lines"][number]],
    totalCents: snapshot.lines[0].totalCents,
    payment: { status: "PAID", paidAmountCents: snapshot.lines[0].totalCents,
      paidAt: "2026-09-15T13:00:00.000Z" },
  }).includes("lines[0].unitPriceTaxMode"));
});

test("importe final RER S/3.50 sólo enlaza EXONERADA/20/0 sin modo tributario", () => {
  const { unitPriceTaxMode: _intentMode, ...declared } = intent.pricingDeclaration.lines[1];
  const { unitPriceTaxMode: _snapshotMode, ...frozen } = snapshot.lines[1];
  const finalIntent: FiscalIntent = { ...intent, pricingDeclaration: {
    ...intent.pricingDeclaration, commercialTotalCents: 350,
    lines: [{ ...declared, commercialAmountBasis: "FINAL_AMOUNT_AS_CHARGED",
      agreedUnitPriceCents: 350 }],
  } };
  const finalLine: FiscalSaleSnapshot["lines"][number] = {
    ...frozen, commercialAmountBasis: "FINAL_AMOUNT_AS_CHARGED",
    unitPriceCents: 350, commercialGrossBeforeDiscountCents: 350,
    taxableBaseBeforeDiscountCents: 350, totalCents: 350,
    tax: { category: "EXONERADA", affectationCode: "20", taxScheme: "NONE",
      taxRateBasisPoints: 0, taxableBaseCents: 350, taxAmountCents: 0 },
  };
  const finalSnapshot: FiscalSaleSnapshot = { ...snapshot, lines: [finalLine],
    totalCents: 350, payment: { status: "PAID", paidAmountCents: 350,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  assert.deepEqual(validateFiscalIntent(finalIntent), []);
  assert.deepEqual(validateFiscalSaleSnapshot(finalSnapshot), []);
  assert.deepEqual(validateFiscalIntentSnapshotLink(finalIntent, finalSnapshot), []);
  assert.ok(validateFiscalSaleSnapshot({ ...finalSnapshot,
    lines: [{ ...finalLine, tax: { ...finalLine.tax, category: "GRAVADA",
      affectationCode: "10", taxScheme: "IGV", taxRateBasisPoints: 1800 } }],
  } as unknown as FiscalSaleSnapshot).includes("lines[0].commercialAmountBasis"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    lines: [{ ...snapshot.lines[0], unitPriceTaxMode: undefined } as unknown as
      FiscalSaleSnapshot["lines"][number], snapshot.lines[1]],
  }).includes("lines[0].unitPriceTaxMode"));
  assert.ok(validateFiscalIntent({ ...finalIntent, pricingDeclaration: {
    ...finalIntent.pricingDeclaration,
    lines: [{ ...finalIntent.pricingDeclaration.lines[0], unitPriceTaxMode: "TAX_INCLUDED" }],
  } } as unknown as FiscalIntent)
    .includes("pricingDeclaration.lines[0].commercialAmountBasis"));
  assert.deepEqual(validateFiscalIntentSnapshotLink(intent, snapshot), []);
});

test("intent canónico rechaza campos ausentes, líneas vacías y duplicados por identidad opaca", () => {
  assert.deepEqual(validateFiscalIntent({ ...intent,
    pricingDeclaration: undefined } as unknown as FiscalIntent), ["pricingDeclaration"]);
  assert.deepEqual(validateFiscalIntent({ ...intent,
    pricingDeclaration: { ...intent.pricingDeclaration, lines: [] } }),
  ["pricingDeclaration.lines"]);
  const missing = { ...intent.pricingDeclaration.lines[0],
    presentationId: undefined, agreedPriceSourceRef: " ",
    pricePolicyRef: undefined, pricePolicyVersion: " ",
    fiscalPolicyRef: undefined, fiscalPolicyVersion: " ", agreedAt: undefined,
  };
  const missingErrors = validateFiscalIntent({ ...intent,
    pricingDeclaration: { ...intent.pricingDeclaration, lines: [missing] },
  } as unknown as FiscalIntent);
  assert.deepEqual(missingErrors, [
    "pricingDeclaration.lines[0].presentationId",
    "pricingDeclaration.lines[0].agreedPriceSourceRef",
    "pricingDeclaration.lines[0].pricePolicyRef",
    "pricingDeclaration.lines[0].pricePolicyVersion",
    "pricingDeclaration.lines[0].fiscalPolicyRef",
    "pricingDeclaration.lines[0].fiscalPolicyVersion",
    "pricingDeclaration.lines[0].agreedAt",
  ]);
  assert.deepEqual(validateFiscalIntent({ ...intent,
    pricingDeclaration: { ...intent.pricingDeclaration,
      lines: [intent.pricingDeclaration.lines[0],
        { ...intent.pricingDeclaration.lines[1], lineId: "line_1" }],
    },
  }), ["pricingDeclaration.lines[1].lineId"]);
  assert.deepEqual(validateFiscalIntent({ ...intent,
    pricingDeclaration: { ...intent.pricingDeclaration,
      lines: [intent.pricingDeclaration.lines[0],
        { ...intent.pricingDeclaration.lines[1],
          presentationId: "opaque-presentation-a" }],
    },
  }), []);
  assert.deepEqual(validateFiscalIntent({ ...intent,
    pricingDeclaration: { ...intent.pricingDeclaration, lines: [null] },
  } as unknown as FiscalIntent), ["pricingDeclaration.lines[0]"]);
  assert.deepEqual(validateFiscalIntent({ ...intent,
    pricingDeclaration: { ...intent.pricingDeclaration,
      lines: [{ ...intent.pricingDeclaration.lines[0], fiscalPolicyRef: " " }],
    },
  }), ["pricingDeclaration.lines[0].fiscalPolicyRef"]);
});

test("intent canónico rechaza importes, modo, fecha y autoridad declarada por el cliente", () => {
  for (const amount of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN]) {
    const invalid = { ...intent, pricingDeclaration: {
      ...intent.pricingDeclaration,
      lines: [{ ...intent.pricingDeclaration.lines[0], agreedUnitPriceCents: amount }],
    } };
    assert.ok(validateFiscalIntent(invalid).includes(
      "pricingDeclaration.lines[0].agreedUnitPriceCents"));
    assert.ok(validateFiscalIntent({ ...intent, pricingDeclaration: {
      ...intent.pricingDeclaration, commercialTotalCents: amount,
    } }).includes("pricingDeclaration.commercialTotalCents"));
  }
  const invalid = { ...intent, pricingDeclaration: {
    ...intent.pricingDeclaration,
    taxComputationMode: "EXACT",
    lines: [{ ...intent.pricingDeclaration.lines[0],
      unitPriceTaxMode: "UNKNOWN", agreedAt: "2026-09-15", approved: true,
      taxAmountCents: 180 }],
    approved: true,
  } } as unknown as FiscalIntent;
  assert.deepEqual(validateFiscalIntent(invalid), [
    "pricingDeclaration.taxComputationMode",
    "pricingDeclaration.lines[0].unitPriceTaxMode",
    "pricingDeclaration.lines[0].agreedAt",
    "pricingDeclaration.lines[0].unknown.approved",
    "pricingDeclaration.lines[0].unknown.taxAmountCents",
    "pricingDeclaration.unknown.approved",
  ]);
  for (const agreedAt of ["2026-02-30T12:00:00.000Z", "2026-09-15T12:00:00",
    "2026-09-15T25:00:00.000Z", "2026-09-15T12:00:00+25:00"]) {
    assert.ok(validateFiscalIntent({ ...intent, pricingDeclaration: {
      ...intent.pricingDeclaration,
      lines: [{ ...intent.pricingDeclaration.lines[0], agreedAt }],
    } }).includes("pricingDeclaration.lines[0].agreedAt"));
  }
});

test("replay exige misma evidencia completa y orden de líneas", () => {
  const copy: FiscalIntent = { ...intent, pricingDeclaration: {
    ...intent.pricingDeclaration,
    lines: intent.pricingDeclaration.lines.map((line) => ({ ...line })),
  } };
  assert.deepEqual(validateFiscalIntentReplay(intent, copy), []);
  for (const change of [
    { lineId: "another-line" },
    { agreedUnitPriceCents: 1181 },
    { presentationId: "another-presentation" },
    { agreedPriceSourceRef: "another-agreement" },
    { pricePolicyRef: "another-policy" },
    { pricePolicyVersion: "revision-b" },
    { fiscalPolicyRef: "another-fiscal-policy" },
    { fiscalPolicyVersion: "another-fiscal-revision" },
    { agreedAt: "2026-09-15T12:59:57.000Z" },
  ]) {
    const replay = { ...copy, pricingDeclaration: { ...copy.pricingDeclaration,
      lines: [{ ...copy.pricingDeclaration.lines[0], ...change },
        copy.pricingDeclaration.lines[1]],
    } } as FiscalIntent;
    assert.deepEqual(validateFiscalIntentReplay(intent, replay),
      ["replay.payloadMismatch"]);
  }
  assert.deepEqual(validateFiscalIntentReplay(intent, { ...copy,
    pricingDeclaration: { ...copy.pricingDeclaration,
      lines: [...copy.pricingDeclaration.lines].reverse(),
    },
  }), ["replay.payloadMismatch"]);
  assert.deepEqual(validateFiscalIntentReplay(intent, { ...copy,
    buyer: { ...copy.buyer, legalName: "Otro comprador" },
  }), ["replay.payloadMismatch"]);
  assert.deepEqual(validateFiscalIntentReplay(intent, { ...copy,
    pricingDeclaration: { ...copy.pricingDeclaration, commercialTotalCents: 1679 },
  }), ["replay.payloadMismatch"]);
  assert.deepEqual(validateFiscalIntentReplay(intent, { ...copy,
    pricingDeclaration: { ...copy.pricingDeclaration,
      lines: [{ ...copy.pricingDeclaration.lines[0], pricePolicyVersion: " " },
        copy.pricingDeclaration.lines[1]],
    },
  }), ["replay.pricingDeclaration.lines[0].pricePolicyVersion"]);
  assert.deepEqual(validateFiscalIntentReplay(intent, { ...copy,
    pricingDeclaration: { ...copy.pricingDeclaration,
      lines: [{ ...copy.pricingDeclaration.lines[0], unitPriceTaxMode: "TAX_EXCLUDED" },
        copy.pricingDeclaration.lines[1]],
    },
  } as unknown as FiscalIntent), ["replay.pricingDeclaration.lines[0].unitPriceTaxMode"]);
});

test("wire CPE inicial exige contractKind y schemaVersion y rechaza version legado", () => {
  assert.equal(intent.contractKind, FISCAL_INTENT_CONTRACT_KIND);
  assert.equal(snapshot.contractKind, FISCAL_SALE_SNAPSHOT_CONTRACT_KIND);
  assert.equal(intent.schemaVersion, 1);
  assert.equal(snapshot.schemaVersion, 1);
  const { contractKind: _intentKind, schemaVersion: _intentSchema, ...legacyIntent } = intent;
  const { contractKind: _snapshotKind, schemaVersion: _snapshotSchema,
    ...legacySnapshot } = snapshot;
  assert.ok(validateFiscalIntent({ ...legacyIntent, version: 1 } as unknown as FiscalIntent)
    .length > 0);
  assert.ok(validateFiscalSaleSnapshot({ ...legacySnapshot, version: 1 } as unknown as FiscalSaleSnapshot)
    .length > 0);
  for (const schemaVersion of [2, 3]) {
    assert.ok(validateFiscalIntent({ ...intent, schemaVersion } as unknown as FiscalIntent)
      .includes("schemaVersion"));
    assert.ok(validateFiscalSaleSnapshot({ ...snapshot, schemaVersion } as unknown as FiscalSaleSnapshot)
      .includes("schemaVersion"));
  }
  assert.ok(validateFiscalIntent({ ...intent, contractKind: "OTHER" } as unknown as FiscalIntent)
    .includes("contractKind"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    contractKind: "OTHER" } as unknown as FiscalSaleSnapshot).includes("contractKind"));
});

test("snapshot fiscal exige afectación e impuesto por cada línea", () => {
  assert.deepEqual(validateFiscalSaleSnapshot(snapshot), []);
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    taxRegime: "OTHER" } as unknown as FiscalSaleSnapshot).includes("taxRegime"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    documentType: "OTHER" } as unknown as FiscalSaleSnapshot).includes("documentType"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    currency: "USD" } as unknown as FiscalSaleSnapshot).includes("currency"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    buyer: { ...snapshot.buyer, legalName: " " } }).includes("buyer.legalName"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    rawXml: "<Invoice/>" } as unknown as FiscalSaleSnapshot).includes("unknown.rawXml"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    lines: [{ ...snapshot.lines[0], rawXml: "<Invoice/>" }, snapshot.lines[1]] } as FiscalSaleSnapshot)
    .includes("lines[0].unknown.rawXml"));
  assert.ok(validateFiscalSaleSnapshot({ ...snapshot,
    payment: { ...snapshot.payment, extra: true } } as unknown as FiscalSaleSnapshot)
    .includes("payment.unknown.extra"));
  assert.equal(snapshot.lines[0].tax.taxRateBasisPoints, 1800);
  assert.equal(snapshot.lines[0].unitPriceCents, 1180);
  assert.equal(snapshot.lines[0].tax.taxableBaseCents + snapshot.lines[0].tax.taxAmountCents,
    snapshot.lines[0].totalCents);
  assert.equal(snapshot.lines[1].tax.taxRateBasisPoints, 0);
});

test("Cat07 acepta solo la afectación onerosa coherente con cada categoría", () => {
  const exonerated = singleLineSnapshot(snapshot.lines[1]);
  const inafectaLine = { ...snapshot.lines[1], tax: {
    ...snapshot.lines[1].tax, category: "INAFECTA", affectationCode: "30",
  } } as FiscalSaleSnapshot["lines"][number];
  assert.deepEqual(validateFiscalSaleSnapshot(singleLineSnapshot(inafectaLine)), []);
  assert.ok(validateFiscalSaleSnapshot(singleLineSnapshot({ ...snapshot.lines[0],
    tax: { ...snapshot.lines[0].tax, affectationCode: "11" },
  })).includes("lines[0].tax.affectationCode"));
  assert.ok(validateFiscalSaleSnapshot({ ...exonerated, lines: [{ ...exonerated.lines[0],
    tax: { ...exonerated.lines[0].tax, affectationCode: "30" },
  }] }).includes("lines[0].tax.affectationCode"));
  const exportLine = { ...inafectaLine, tax: { ...inafectaLine.tax,
    category: "EXPORTACION", affectationCode: "40" } } as unknown as FiscalSaleSnapshot["lines"][number];
  const unsupported = validateFiscalSaleSnapshot(singleLineSnapshot(exportLine));
  assert.ok(unsupported.includes("lines[0].tax.category"));
  assert.ok(unsupported.includes("lines[0].tax.affectationCode"));
  const inheritedName = { ...inafectaLine, tax: { ...inafectaLine.tax,
    category: "toString" } } as unknown as FiscalSaleSnapshot["lines"][number];
  assert.ok(validateFiscalSaleSnapshot(singleLineSnapshot(inheritedName))
    .includes("lines[0].tax.category"));
});

test("Cat03 piloto y producto decimal half-up mantienen bruto y descuento por línea", () => {
  const fractional = { ...snapshot.lines[1], lineId: "11f28678-32f5-4ac0-ac57-44e0c66219e4",
    quantity: 0.335, unitCode: "KGM", unitPriceCents: 300,
    commercialGrossBeforeDiscountCents: 101, taxableBaseBeforeDiscountCents: 101,
    totalCents: 101, tax: { ...snapshot.lines[1].tax, taxableBaseCents: 101 },
  } as FiscalSaleSnapshot["lines"][number];
  assert.deepEqual(validateFiscalSaleSnapshot(singleLineSnapshot(fractional)), []);
  const halfCent = { ...fractional, quantity: 0.005, unitPriceCents: 100,
    commercialGrossBeforeDiscountCents: 1, taxableBaseBeforeDiscountCents: 1,
    totalCents: 1, tax: { ...fractional.tax, taxableBaseCents: 1 },
  } as FiscalSaleSnapshot["lines"][number];
  assert.deepEqual(validateFiscalSaleSnapshot(singleLineSnapshot(halfCent)), []);
  const discounted = { ...fractional, discountCents: 1,
    commercialGrossDiscountCents: 1, baseDiscountCents: 1, totalCents: 100,
    tax: { ...fractional.tax, taxableBaseCents: 100 },
  } as FiscalSaleSnapshot["lines"][number];
  assert.deepEqual(validateFiscalSaleSnapshot(singleLineSnapshot(discounted)), []);
  assert.ok(validateFiscalSaleSnapshot(singleLineSnapshot({ ...fractional,
    commercialGrossBeforeDiscountCents: 100 })).includes("lines[0].unitPriceQuantity"));
  assert.ok(validateFiscalSaleSnapshot(singleLineSnapshot({ ...fractional,
    unitCode: "GRM" })).includes("lines[0].unitCode"));
  assert.ok(validateFiscalSaleSnapshot(singleLineSnapshot({ ...fractional,
    quantity: 0.33500000001 })).includes("lines[0].quantity"));
  assert.ok(validateFiscalSaleSnapshot(singleLineSnapshot({ ...fractional,
    quantity: 1e-11 })).includes("lines[0].quantity"));
  assert.ok(validateFiscalSaleSnapshot(singleLineSnapshot({ ...fractional,
    discountCents: 101, commercialGrossDiscountCents: 101, baseDiscountCents: 101,
    totalCents: 0, tax: { ...fractional.tax, taxableBaseCents: 0 },
  } as FiscalSaleSnapshot["lines"][number])).includes("lines[0].unitPriceQuantity"));
});

test("cero y NRUS no convierten una clasificación no demostrada en gravada", () => {
  const zeroTax = { ...snapshot.lines[1], tax: {
    ...snapshot.lines[1].tax, category: "GRAVADA", affectationCode: "10",
    taxScheme: "NONE", taxRateBasisPoints: 0,
  } } as unknown as FiscalSaleSnapshot["lines"][number];
  const nrusZero = validateFiscalSaleSnapshot({ ...singleLineSnapshot(zeroTax),
    taxRegime: "NRUS" });
  assert.ok(nrusZero.includes("lines[0].tax.taxScheme"));
  const mismatchedNonTaxed = validateFiscalSaleSnapshot({
    ...singleLineSnapshot(snapshot.lines[1]), taxRegime: "NRUS",
    lines: [{ ...snapshot.lines[1], tax: { ...snapshot.lines[1].tax,
      category: "INAFECTA", affectationCode: "20" } } as FiscalSaleSnapshot["lines"][number]],
  });
  assert.ok(mismatchedNonTaxed.includes("lines[0].tax.affectationCode"));
});

test("snapshot exige desglose TAX_INCLUDED consistente", () => {
  const missing = { ...snapshot, lines: [{ ...snapshot.lines[0],
    taxableBaseBeforeDiscountCents: undefined }, snapshot.lines[1]] } as unknown as FiscalSaleSnapshot;
  assert.ok(validateFiscalSaleSnapshot(missing)
    .includes("lines[0].taxableBaseBeforeDiscountCents"));
  const inconsistent = { ...snapshot, lines: [{ ...snapshot.lines[0],
    commercialGrossDiscountCents: 1 }, snapshot.lines[1]] };
  assert.ok(validateFiscalSaleSnapshot(inconsistent)
    .includes("lines[0].taxIncludedBreakdown"));

  const invalidPreDiscountTax: FiscalSaleSnapshot = { ...snapshot,
    lines: [{ ...snapshot.lines[0], discountCents: 4,
      commercialGrossDiscountCents: 4, taxableBaseBeforeDiscountCents: 1001,
      baseDiscountCents: 4, totalCents: 1176,
      tax: { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV",
        taxRateBasisPoints: 1800, taxableBaseCents: 997, taxAmountCents: 179 } }],
    totalCents: 1176,
    payment: { status: "PAID", paidAmountCents: 1176,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  assert.deepEqual(validateFiscalSaleSnapshot(invalidPreDiscountTax),
    ["lines[0].preDiscountTaxArithmetic", "tax.preDiscountAggregateMismatch"]);

  const invalidPostDiscountTax: FiscalSaleSnapshot = { ...snapshot,
    lines: [{ ...snapshot.lines[0], discountCents: 4,
      commercialGrossDiscountCents: 4, taxableBaseBeforeDiscountCents: 1000,
      baseDiscountCents: 2, totalCents: 1176,
      tax: { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV",
        taxRateBasisPoints: 1800, taxableBaseCents: 998, taxAmountCents: 178 } }],
    totalCents: 1176,
    payment: { status: "PAID", paidAmountCents: 1176,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  assert.deepEqual(validateFiscalSaleSnapshot(invalidPostDiscountTax),
    ["lines[0].postDiscountTaxArithmetic", "tax.postDiscountAggregateMismatch"]);

  const oneCentTaxOnOneCentBase: FiscalSaleSnapshot["lines"][number] = {
    ...snapshot.lines[0], unitPriceCents: 2,
    commercialGrossBeforeDiscountCents: 2,
    taxableBaseBeforeDiscountCents: 1,
    totalCents: 2,
    tax: { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV",
      taxRateBasisPoints: 1800, taxableBaseCents: 1, taxAmountCents: 1 },
  };
  assert.deepEqual(validateFiscalSaleSnapshot(singleLineSnapshot(oneCentTaxOnOneCentBase)),
    ["tax.preDiscountAggregateMismatch", "tax.postDiscountAggregateMismatch"]);
});

test("snapshot calcula cuota TAX_INCLUDED desde el bruto, incluso por pocos centavos", () => {
  const grossThree: FiscalSaleSnapshot["lines"][number] = {
    ...snapshot.lines[0], unitPriceCents: 3,
    commercialGrossBeforeDiscountCents: 3, taxableBaseBeforeDiscountCents: 3,
    totalCents: 3, tax: gravadaTax(3, 0),
  };
  assert.deepEqual(validateFiscalSaleSnapshot(singleLineSnapshot(grossThree)), []);
  const grossFiftySix: FiscalSaleSnapshot["lines"][number] = {
    ...snapshot.lines[0], unitPriceCents: 56,
    commercialGrossBeforeDiscountCents: 56, taxableBaseBeforeDiscountCents: 47,
    totalCents: 56, tax: gravadaTax(47, 9),
  };
  assert.deepEqual(validateFiscalSaleSnapshot(singleLineSnapshot(grossFiftySix)), []);
  const taxOnlyDiscount: FiscalSaleSnapshot["lines"][number] = {
    ...snapshot.lines[0], unitPriceCents: 4,
    discountCents: 1, commercialGrossBeforeDiscountCents: 4,
    commercialGrossDiscountCents: 1, taxableBaseBeforeDiscountCents: 3,
    baseDiscountCents: 0, totalCents: 3,
    tax: gravadaTax(3, 0),
  };
  assert.deepEqual(validateFiscalSaleSnapshot(singleLineSnapshot(taxOnlyDiscount)), []);
});

test("snapshot acepta reparto de un centavo de IGV entre líneas gravadas de S/0.03 y S/0.04", () => {
  const lines: FiscalSaleSnapshot["lines"] = [
    { ...snapshot.lines[0], lineId: "gravada_1", unitPriceCents: 3,
      commercialGrossBeforeDiscountCents: 3, taxableBaseBeforeDiscountCents: 3,
      totalCents: 3, tax: gravadaTax(3, 0) },
    { ...snapshot.lines[0], lineId: "gravada_2", unitPriceCents: 4,
      commercialGrossBeforeDiscountCents: 4, taxableBaseBeforeDiscountCents: 3,
      totalCents: 4, tax: gravadaTax(3, 1) },
  ];
  const allocated: FiscalSaleSnapshot = { ...snapshot, lines, totalCents: 7,
    payment: { status: "PAID", paidAmountCents: 7,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  // Cada línea admite piso o techo; el bruto agregado de 7 céntimos exige 1 de IGV.
  assert.deepEqual(validateFiscalSaleSnapshot(allocated), []);
  const inflatedLine = { ...lines[0], unitPriceCents: 4,
    commercialGrossBeforeDiscountCents: 4, totalCents: 4,
    tax: gravadaTax(3, 1) };
  const aggregateDrift: FiscalSaleSnapshot = { ...allocated,
    lines: [inflatedLine, lines[1]], totalCents: 8,
    payment: { status: "PAID", paidAmountCents: 8,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  assert.deepEqual(validateFiscalSaleSnapshot(aggregateDrift),
    ["tax.preDiscountAggregateMismatch", "tax.postDiscountAggregateMismatch"]);
});

test("snapshot acepta reparto agregado de IGV antes y después de descuentos", () => {
  const lines: FiscalSaleSnapshot["lines"] = [
    { ...snapshot.lines[0], lineId: "gravada_1", unitPriceCents: 7,
      discountCents: 3, commercialGrossBeforeDiscountCents: 7,
      commercialGrossDiscountCents: 3, taxableBaseBeforeDiscountCents: 6,
      baseDiscountCents: 3, totalCents: 4,
      tax: gravadaTax(3, 1) },
    { ...snapshot.lines[0], lineId: "gravada_2", unitPriceCents: 7,
      discountCents: 4, commercialGrossBeforeDiscountCents: 7,
      commercialGrossDiscountCents: 4, taxableBaseBeforeDiscountCents: 6,
      baseDiscountCents: 3, totalCents: 3,
      tax: gravadaTax(3, 0) },
  ];
  const allocated: FiscalSaleSnapshot = { ...snapshot, lines, totalCents: 7,
    payment: { status: "PAID", paidAmountCents: 7,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  // Antes: brutos 7+7, IGV 1+1 = 2. Después: brutos 4+3, IGV 1+0 = 1.
  assert.deepEqual(validateFiscalSaleSnapshot(allocated), []);
  const postDiscountDrift: FiscalSaleSnapshot = { ...allocated,
    lines: [lines[0], { ...lines[1], discountCents: 3,
      commercialGrossDiscountCents: 3, totalCents: 4,
      tax: gravadaTax(3, 1) }],
    totalCents: 8,
    payment: { status: "PAID", paidAmountCents: 8,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  assert.deepEqual(validateFiscalSaleSnapshot(postDiscountDrift),
    ["tax.postDiscountAggregateMismatch"]);
});

test("snapshot suma solo brutos gravados y admite reparto de 9 céntimos entre cuatro líneas", () => {
  const gravadas: FiscalSaleSnapshot["lines"] = [3, 2, 2, 2].map((taxCents, index) => ({
    ...snapshot.lines[0], lineId: `gravada_${index + 1}`,
    unitPriceCents: 14, commercialGrossBeforeDiscountCents: 14,
    taxableBaseBeforeDiscountCents: 14 - taxCents, totalCents: 14,
    tax: gravadaTax(14 - taxCents, taxCents),
  }));
  const exonerada: FiscalSaleSnapshot["lines"][number] = {
    ...snapshot.lines[1], lineId: "exonerada_1", unitPriceCents: 10,
    commercialGrossBeforeDiscountCents: 10, taxableBaseBeforeDiscountCents: 10,
    totalCents: 10, tax: { category: "EXONERADA", affectationCode: "20",
      taxScheme: "NONE", taxRateBasisPoints: 0,
      taxableBaseCents: 10, taxAmountCents: 0 },
  };
  const allocated: FiscalSaleSnapshot = { ...snapshot,
    lines: [...gravadas, exonerada], totalCents: 66,
    payment: { status: "PAID", paidAmountCents: 66,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  // Bruto gravado 56 céntimos: IGV 9. El exonerado no entra en la cuota.
  assert.deepEqual(validateFiscalSaleSnapshot(allocated), []);
});

test("snapshot rechaza una cuota por línea fuera de piso y techo aunque cuadre el agregado", () => {
  const lines: FiscalSaleSnapshot["lines"] = [2, 0, 0, 0].map((taxCents, index) => ({
    ...snapshot.lines[0], lineId: `gravada_${index + 1}`,
    unitPriceCents: 4, commercialGrossBeforeDiscountCents: 4,
    taxableBaseBeforeDiscountCents: 4 - taxCents, totalCents: 4,
    tax: gravadaTax(4 - taxCents, taxCents),
  }));
  const invalid: FiscalSaleSnapshot = { ...snapshot, lines, totalCents: 16,
    payment: { status: "PAID", paidAmountCents: 16,
      paidAt: "2026-09-15T13:00:00.000Z" } };
  // El bruto agregado pide 2 céntimos, pero la primera línea de 4 admite 0 o 1.
  assert.deepEqual(validateFiscalSaleSnapshot(invalid), [
    "lines[0].preDiscountTaxArithmetic", "lines[0].postDiscountTaxArithmetic",
  ]);
});

test("snapshot congelado coteja intención, total comercial y líneas sin exigir orden", () => {
  assert.deepEqual(validateFiscalIntentSnapshotLink(intent, snapshot), []);
  assert.deepEqual(validateFiscalIntentSnapshotLink(intent,
    { ...snapshot, tenantId: "other" }), ["tenantId"]);
  assert.deepEqual(validateFiscalIntentSnapshotLink(intent,
    { ...snapshot, buyer: { ...snapshot.buyer, legalName: "Otro comprador" } }), ["buyer"]);
  assert.deepEqual(validateFiscalIntentSnapshotLink(intent,
    { ...snapshot, lines: [...snapshot.lines].reverse() }), []);
  assert.ok(validateFiscalIntentSnapshotLink(intent,
    { ...snapshot, totalCents: 1679 }).length > 0);
  assert.ok(validateFiscalIntentSnapshotLink(intent,
    { ...snapshot, lines: [{ ...snapshot.lines[0], lineId: "another-line" },
      snapshot.lines[1]] }).length > 0);
  const mismatchedMode = { ...snapshot,
    lines: [{ ...snapshot.lines[0], unitPriceTaxMode: "TAX_EXCLUDED" },
      snapshot.lines[1]] } as unknown as FiscalSaleSnapshot;
  assert.ok(validateFiscalIntentSnapshotLink(intent, mismatchedMode).length > 0);
});

test("boleta a crédito entregada conserva evidencia sin afirmar cobros ni saldos", () => {
  const deferred: FiscalSaleSnapshot = { ...snapshot,
    payment: { status: "DEFERRED", deferredAt: "2026-09-15T12:00:00.000Z",
      deliveryDocumentId: "49b2749d-3416-424b-a8bd-9456f46a7b37", orderId: "opaque-order" } };
  assert.deepEqual(validateFiscalSaleSnapshot(deferred), []);
  assert.deepEqual(validateFiscalSaleSnapshot({ ...deferred, documentType: "FACTURA" }),
    ["buyer.documentTypeForFactura", "payment.deferredDocumentType"]);
  assert.ok(validateFiscalSaleSnapshot({ ...deferred,
    payment: { ...deferred.payment, paidAmountCents: 0 } } as FiscalSaleSnapshot).includes("payment.unverifiedSettlement"));
  assert.ok(validateFiscalSaleSnapshot({ ...deferred,
    payment: { ...deferred.payment, deliveryDocumentId: "" } } as FiscalSaleSnapshot).includes("payment.deliveryDocumentId"));
});

test("snapshot fiscal exige venta efectivamente pagada por el monto aplicado", () => {
  assert.deepEqual(validateFiscalSaleSnapshot({
    ...snapshot,
    payment: { status: "PAID", paidAt: "2026-09-15T13:00:00.000Z", paidAmountCents: 1700 },
  }), ["payment.totalMismatch"]);
});

test("NRUS no puede construir factura fiscal", () => {
  assert.deepEqual(validateFiscalSaleSnapshot({
    ...snapshot,
    taxRegime: "NRUS",
    documentType: "FACTURA",
  }), ["buyer.documentTypeForFactura", "taxRegime.documentType", "lines[0].tax.nrusDiscriminatedTax",
    "lines[0].tax.taxRateBasisPoints"]);
});

test("NRUS no convierte un IGV comercial en tributo desglosado de boleta", () => {
  assert.deepEqual(validateFiscalSaleSnapshot({
    ...snapshot,
    taxRegime: "NRUS",
  }), ["lines[0].tax.nrusDiscriminatedTax", "lines[0].tax.taxRateBasisPoints"]);
});

test("NRUS conserva GRAVADA/10 con tasa documental cero y precio completo", () => {
  const taxable = snapshot.lines[0];
  const line: FiscalSaleSnapshot["lines"][number] = {
    ...taxable,
    taxableBaseBeforeDiscountCents: taxable.commercialGrossBeforeDiscountCents,
    tax: { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV",
      taxRateBasisPoints: 0, taxableBaseCents: taxable.totalCents, taxAmountCents: 0 },
  };
  const nrus = { ...singleLineSnapshot(line), taxRegime: "NRUS" as const };
  assert.deepEqual(validateFiscalSaleSnapshot(nrus), []);
  const { unitPriceTaxMode: _mode, ...withoutMode } = line;
  assert.deepEqual(validateFiscalSaleSnapshot({ ...nrus, lines: [{ ...withoutMode,
    commercialAmountBasis: "FINAL_AMOUNT_AS_CHARGED" }] }), []);
  assert.ok(validateFiscalSaleSnapshot({ ...nrus, taxRegime: "RER" })
    .includes("lines[0].tax.taxRateBasisPoints"));
  assert.ok(validateFiscalSaleSnapshot({ ...nrus, lines: [{ ...line,
    tax: { ...line.tax, taxAmountCents: 1 } as FiscalSaleSnapshot["lines"][number]["tax"] }] })
    .includes("lines[0].tax.nrusDiscriminatedTax"));
});

test("snapshot fiscal detecta categoría/tasa inconsistente y total no conciliado", () => {
  const invalid: FiscalSaleSnapshot = {
    ...snapshot,
    lines: [
      snapshot.lines[0],
      {
        ...snapshot.lines[1],
        tax: {
          ...snapshot.lines[1].tax,
          taxRateBasisPoints: 1800,
          taxAmountCents: 90,
        } as unknown as FiscalSaleSnapshot["lines"][number]["tax"],
      },
    ],
    totalCents: 1000,
  };
  assert.deepEqual(validateFiscalSaleSnapshot(invalid), [
    "payment.totalMismatch",
    "lines[1].tax.nonTaxableAmounts",
    "totalCents.linesMismatch",
    "lines[1].taxIncludedBreakdown",
  ]);
});

test("subpath fiscal publica los contratos canónicos de emisión y proceso", () => {
  const fiscal = require("yola-fresh-utils/fiscal/contracts") as Record<string, unknown>;
  const root = require("yola-fresh-utils/fiscal") as Record<string, unknown>;
  assert.equal(root.validateFiscalIntent, fiscal.validateFiscalIntent);
  assert.equal(fiscal.FISCAL_CPE_SCHEMA_VERSION, 1);
  assert.equal(fiscal.FISCAL_INTENT_CONTRACT_KIND, "YOLAFRESH_CPE_INTENT");
  assert.equal(fiscal.FISCAL_SALE_SNAPSHOT_CONTRACT_KIND, "YOLAFRESH_CPE_SALE_SNAPSHOT");
  assert.equal(fiscal.FISCAL_DOCUMENT_TYPE, "comprobante_electronico");
  assert.equal(fiscal.FISCAL_PROCESS_TYPE, "proceso_fiscal");
  for (const name of [
    "validateFiscalIntent", "validateFiscalIntentPricingDeclaration",
    "validateFiscalIntentReplay", "validateFiscalSaleSnapshot",
    "validateFiscalIntentSnapshotLink", "validateFiscalSignedDocument",
    "isFiscalSignedDocumentPrintable", "validateFiscalProcess",
    "validateFiscalProcessDocumentLink", "canAutomaticallyTransmitFiscalProcess",
  ]) {
    assert.equal(typeof fiscal[name], "function", name);
  }
  for (const legacyName of [
    "FISCAL_CPE_CONTRACT_VERSION", "FISCAL_INTENT_CONTRACT_VERSION",
    "FISCAL_INTENT_V2_CONTRACT_VERSION", "FISCAL_INTENT_V3_CONTRACT_VERSION",
    "FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION", "FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION",
    "FISCAL_SALE_SNAPSHOT_V2_CAPABILITY", "FISCAL_EVIDENCE_CONTRACT_VERSION",
    "validateFiscalIntentV1", "validateFiscalIntentV2", "validateFiscalIntentV3",
    "validateFiscalIntentPricingDeclarationV3",
    "validateFiscalSaleSnapshotV1", "validateFiscalSaleSnapshotV2",
    "validateFiscalIntentSnapshotLinkV1", "validateFiscalCdrVerificationV1",
    "validateFiscalEvidenceV1", "validateFiscalEvidence",
    "FISCAL_EVIDENCE_CONTRACT_KIND",
    "validateFiscalCdrVerification", "isSameFiscalDocumentIdentity",
    "canAutomaticallySubmitFiscalState", "isFiscalTerminalState",
  ]) {
    assert.equal(legacyName in fiscal, false, legacyName);
  }
});

test("la solicitud de emisión no mezcla estados del proceso fiscal", () => {
  const declarations = readFileSync(resolve(process.cwd(),
    "dist/domain/fiscal/contracts/cpe.contract.d.ts"), "utf8");
  for (const operationalType of [
    "FiscalBackendState", "FiscalLocalState", "FiscalCdrVerification",
  ]) {
    assert.equal(new RegExp(`\\b${operationalType}\\b`).test(declarations), false,
      operationalType);
  }
});

