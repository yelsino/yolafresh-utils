/** Hechos, solicitudes e invariantes fiscales independientes del canal de operación. */
import type { FiscalTaxResolutionSource } from "./configuracion-fiscal.contract";
import { validateFiscalTaxResolutionSource } from "./configuracion-fiscal";
import type { RegimenTributarioEmpresa } from "../../shared/kernel/empresa.contract";

export const FISCAL_CPE_SCHEMA_VERSION = 1 as const;
export const FISCAL_INTENT_CONTRACT_KIND = "YOLAFRESH_CPE_INTENT" as const;
export const FISCAL_SALE_SNAPSHOT_CONTRACT_KIND = "YOLAFRESH_CPE_SALE_SNAPSHOT" as const;

export type FiscalCpeDocumentType = "BOLETA" | "FACTURA";
export type FiscalDocumentType = FiscalCpeDocumentType | "NOTA_CREDITO" | "NOTA_DEBITO";
export type FiscalTaxRegime = RegimenTributarioEmpresa;
export const FISCAL_TAX_REGIMES = ["NRUS", "RER", "RMT", "REGIMEN_GENERAL"] as const satisfies readonly FiscalTaxRegime[];
export const isFiscalTaxRegime = (value: unknown): value is FiscalTaxRegime =>
  typeof value === "string" && (FISCAL_TAX_REGIMES as readonly string[]).includes(value);
export type FiscalCurrency = "PEN";

export type FiscalBuyerDocumentType =
  | "DNI"
  | "RUC"
  | "CE"
  | "PASAPORTE"
  | "SIN_DOCUMENTO";

export interface FiscalBuyer {
  readonly documentType: FiscalBuyerDocumentType;
  readonly documentNumber: string | null;
  readonly legalName: string;
}

/** Una solicitud no confirma que haya CPE ni concede número fiscal. */
export interface FiscalIntent {
  readonly contractKind: typeof FISCAL_INTENT_CONTRACT_KIND;
  readonly schemaVersion: typeof FISCAL_CPE_SCHEMA_VERSION;
  readonly intentId: string;
  readonly idempotencyKey: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly saleId: string;
  readonly saleSnapshotId: string;
  readonly requestedDocumentType: FiscalCpeDocumentType;
  readonly buyer: FiscalBuyer;
  /** Oportunidad comercial; no es fecha fiscal ni permite retrofechar. */
  readonly occurredAt: string;
  readonly queuedAt: string;
  readonly pricingDeclaration: FiscalIntentPricingDeclaration;
}

/**
 * Referencias del precio acordado. Validar su forma no prueba la vigencia
 * del acuerdo ni la política histórica de la presentación.
 */
interface FiscalIntentPriceLineEvidenceCommon {
  readonly lineId: string;
  readonly presentationId: string;
  readonly agreedUnitPriceCents: number;
  /** Referencia durable al acuerdo/cotización del precio de esta línea. */
  readonly agreedPriceSourceRef: string;
  /** Política histórica cuya vigencia debe verificarse en agreedAt. */
  readonly pricePolicyRef: string;
  readonly pricePolicyVersion: string;
  /** Política fiscal aplicable a esta presentación. */
  readonly fiscalPolicyRef: string;
  readonly fiscalPolicyVersion: string;
  readonly agreedAt: string;
}

/** El importe final exonerado no declara ni permite inferir un modo tributario. */
export type FiscalIntentPriceLineEvidence = FiscalIntentPriceLineEvidenceCommon & (
  | { readonly unitPriceTaxMode: FiscalUnitPriceTaxMode;
      readonly commercialAmountBasis?: never }
  | { readonly commercialAmountBasis: "FINAL_AMOUNT_AS_CHARGED";
      readonly unitPriceTaxMode?: never }
);

/** Importe acordado por línea; no declara por sí mismo la clasificación tributaria. */
export interface FiscalIntentPricingDeclaration {
  readonly taxComputationMode: "NOT_COMPUTED";
  readonly currency: "PEN";
  /** Total comercial declarado; debe conciliarse con la venta de origen. */
  readonly commercialTotalCents: number;
  readonly lines: readonly FiscalIntentPriceLineEvidence[];
}

export type FiscalTaxCategory =
  | "GRAVADA"
  | "EXONERADA"
  | "INAFECTA";

/** Semántica soportada por el primer snapshot fiscal. */
export type FiscalUnitPriceTaxMode = "TAX_INCLUDED";

/** Todos los campos tributarios se fijan por línea; jamás se infiere IGV global. */
export type FiscalLineTax =
  | {
      readonly category: "GRAVADA";
      readonly affectationCode: string;
      readonly taxScheme: "IGV";
      readonly taxRateBasisPoints: number;
      readonly taxableBaseCents: number;
      readonly taxAmountCents: number;
    }
  | {
      readonly category: Exclude<FiscalTaxCategory, "GRAVADA">;
      readonly affectationCode: string;
      readonly taxScheme: "NONE";
      readonly taxRateBasisPoints: 0;
      readonly taxableBaseCents: number;
      readonly taxAmountCents: 0;
    };

interface FiscalSaleLineCommon {
  /** Procedencia congelada de la resolución de configuración por presentación. */
  readonly taxSource?: FiscalTaxResolutionSource;
  readonly lineId: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitCode: string;
  readonly unitPriceCents: number;
  readonly discountCents: number;
  /** Importe fiscal después de descuento de ítem y tributo de esa línea. */
  readonly totalCents: number;
  readonly tax: FiscalLineTax;
}

/** Precio bruto y descomposición del descuento congelados en el hecho fiscal. */
interface FiscalSaleLineBreakdown {
  readonly commercialGrossBeforeDiscountCents: number;
  readonly commercialGrossDiscountCents: number;
  readonly taxableBaseBeforeDiscountCents: number;
  readonly baseDiscountCents: number;
  readonly discountReasonCode: "00";
}

/** Importe final sin tributo discriminado: EXONERADA/20 o GRAVADA/10 de NRUS. */
export type FiscalSaleLine = FiscalSaleLineCommon & FiscalSaleLineBreakdown & (
  | { readonly unitPriceTaxMode: FiscalUnitPriceTaxMode;
      readonly commercialAmountBasis?: never }
  | { readonly commercialAmountBasis: "FINAL_AMOUNT_AS_CHARGED";
      readonly unitPriceTaxMode?: never }
);

/** Solo el importe realmente aplicado a la venta; no el efectivo entregado para vuelto. */
export interface FiscalPaidSale {
  readonly status: "PAID";
  readonly paidAmountCents: number;
  readonly paidAt: string;
}

/** Boleta de crédito autorizada por entrega comprobada, sin afirmar cobro ni saldo financiero. */
export interface FiscalDeferredSale {
  readonly status: "DEFERRED";
  /** Fecha de la entrega verificada; no es fecha de vencimiento ni de emisión. */
  readonly deferredAt: string;
  readonly deliveryDocumentId: string;
  readonly orderId: string;
}

/** Hecho fiscal congelado tras conciliar la venta y su detalle inmutable. */
export interface FiscalSaleSnapshot {
  readonly contractKind: typeof FISCAL_SALE_SNAPSHOT_CONTRACT_KIND;
  readonly schemaVersion: typeof FISCAL_CPE_SCHEMA_VERSION;
  readonly fiscalSnapshotId: string;
  readonly intentId: string;
  readonly tenantId: string;
  readonly saleId: string;
  readonly saleSnapshotId: string;
  readonly issuerRuc: string;
  readonly issuerLegalName: string;
  readonly taxRegime: FiscalTaxRegime;
  readonly documentType: FiscalCpeDocumentType;
  readonly buyer: FiscalBuyer;
  readonly currency: FiscalCurrency;
  readonly lines: readonly FiscalSaleLine[];
  readonly totalCents: number;
  readonly payment: FiscalPaidSale | FiscalDeferredSale;
  readonly frozenAt: string;
}

/** Identidad legal del comprobante emitido. */
export interface FiscalDocumentIdentity {
  readonly issuerRuc: string;
  readonly documentType: FiscalDocumentType;
  readonly series: string;
  readonly number: number;
}

const isNonNegativeCents = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;
const isNonBlank = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function isIsoTimestampWithOffset(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offset] = match;
  const [year, month, day, hour, minute, second] =
    [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() + 1 !== month ||
      calendar.getUTCDate() !== day || calendar.getUTCHours() !== hour ||
      calendar.getUTCMinutes() !== minute || calendar.getUTCSeconds() !== second) return false;
  if (offset !== "Z") {
    const offsetHour = Number(offset.slice(1, 3));
    const offsetMinute = Number(offset.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) return false;
  }
  return Number.isFinite(Date.parse(value));
}

// Subconjunto oneroso soportado por el contrato actual de boletas. Cat07
// contiene más supuestos; admitirlos exige reglas fiscales explícitas.
const SUPPORTED_AFFECTATION_CODES = {
  GRAVADA: "10",
  EXONERADA: "20",
  INAFECTA: "30",
} as const;
const SUPPORTED_UNIT_CODES = new Set(["NIU", "ZZ", "KGM", "LTR"]);

/** Cantidad decimal UBL del piloto: hasta 12 enteros y 10 decimales. */
function fiscalQuantityRatio(value: number): { numerator: bigint; denominator: bigint } | null {
  if (!Number.isFinite(value) || value <= 0 || value > 999_999_999_999) return null;
  const [coefficient, exponentText = "0"] = String(value).split("e");
  const [integer, fraction = ""] = coefficient.split(".");
  let scale = fraction.length - Number(exponentText);
  let digits = integer + fraction;
  if (scale < 0) { digits += "0".repeat(-scale); scale = 0; }
  while (scale > 0 && digits.endsWith("0")) { digits = digits.slice(0, -1); scale--; }
  if (scale > 10) return null;
  return { numerator: BigInt(digits), denominator: BigInt(10) ** BigInt(scale) };
}

/** Precio en centavos × cantidad decimal exacta, redondeado half-up al centavo. */
function fiscalLineGrossCents(unitPriceCents: number, quantity: number): number | null {
  const ratio = fiscalQuantityRatio(quantity);
  if (!ratio || !isNonNegativeCents(unitPriceCents)) return null;
  const amount = (BigInt(unitPriceCents) * ratio.numerator * BigInt(2) + ratio.denominator) /
    (BigInt(2) * ratio.denominator);
  return amount <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(amount) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function rejectUnknownFields(value: Record<string, unknown>, allowed: readonly string[],
  prefix: string, errors: string[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${prefix}unknown.${key}`);
  }
}

const INTENT_FIELDS = [
  "contractKind", "schemaVersion", "intentId", "idempotencyKey", "tenantId", "actorId", "saleId",
  "saleSnapshotId", "requestedDocumentType", "buyer", "occurredAt", "queuedAt",
  "pricingDeclaration",
] as const;
const BUYER_FIELDS = ["documentType", "documentNumber", "legalName"] as const;
const PRICING_DECLARATION_FIELDS = [
  "taxComputationMode", "currency", "commercialTotalCents", "lines",
] as const;
const PRICE_LINE_EVIDENCE_FIELDS = [
  "lineId", "presentationId", "unitPriceTaxMode", "commercialAmountBasis",
  "agreedUnitPriceCents",
  "agreedPriceSourceRef", "pricePolicyRef", "pricePolicyVersion",
  "fiscalPolicyRef", "fiscalPolicyVersion", "agreedAt",
] as const;
const SNAPSHOT_FIELDS = [
  "contractKind", "schemaVersion", "fiscalSnapshotId", "intentId", "tenantId",
  "saleId", "saleSnapshotId", "issuerRuc", "issuerLegalName", "taxRegime",
  "documentType", "buyer", "currency", "lines", "totalCents", "payment", "frozenAt",
] as const;
const SNAPSHOT_LINE_FIELDS = [
  "lineId", "description", "quantity", "unitCode", "unitPriceCents", "taxSource",
  "discountCents", "totalCents", "tax", "unitPriceTaxMode", "commercialAmountBasis",
  "commercialGrossBeforeDiscountCents", "commercialGrossDiscountCents",
  "taxableBaseBeforeDiscountCents", "baseDiscountCents", "discountReasonCode",
] as const;
const LINE_TAX_FIELDS = [
  "category", "affectationCode", "taxScheme", "taxRateBasisPoints",
  "taxableBaseCents", "taxAmountCents",
] as const;
const PAID_FIELDS = ["status", "paidAmountCents", "paidAt"] as const;
const DEFERRED_FIELDS = ["status", "deferredAt", "deliveryDocumentId", "orderId"] as const;

function validateFiscalIntentFields(intent: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(intent)) return ["intent"];
  if (intent.contractKind !== FISCAL_INTENT_CONTRACT_KIND) errors.push("contractKind");
  if (intent.schemaVersion !== FISCAL_CPE_SCHEMA_VERSION) errors.push("schemaVersion");
  for (const key of ["intentId", "idempotencyKey", "tenantId", "actorId", "saleId", "saleSnapshotId"] as const) {
    if (typeof intent[key] !== "string" || !isNonBlank(intent[key])) errors.push(key);
  }
  if (intent.requestedDocumentType !== "BOLETA" && intent.requestedDocumentType !== "FACTURA") {
    errors.push("requestedDocumentType");
  }
  if (!isRecord(intent.buyer)) {
    errors.push("buyer");
  } else {
    const buyer = intent.buyer;
    if (!["DNI", "RUC", "CE", "PASAPORTE", "SIN_DOCUMENTO"].includes(
      String(buyer.documentType))) errors.push("buyer.documentType");
    if (intent.requestedDocumentType === "FACTURA" && buyer.documentType !== "RUC") {
      errors.push("buyer.documentTypeForFactura");
    }
    if (typeof buyer.legalName !== "string" || !isNonBlank(buyer.legalName)) {
      errors.push("buyer.legalName");
    }
    if (buyer.documentType === "SIN_DOCUMENTO") {
      if (buyer.documentNumber !== null) errors.push("buyer.documentNumber");
    } else if (typeof buyer.documentNumber !== "string" ||
      !isNonBlank(buyer.documentNumber)) {
      errors.push("buyer.documentNumber");
    }
    rejectUnknownFields(buyer, BUYER_FIELDS, "buyer.", errors);
  }
  for (const key of ["occurredAt", "queuedAt"] as const) {
    if (typeof intent[key] !== "string" || !Number.isFinite(Date.parse(intent[key]))) {
      errors.push(key);
    }
  }
  rejectUnknownFields(intent, INTENT_FIELDS, "", errors);
  return errors;
}
function isFloorOrCeilTaxIncludedQuota(grossCents: number, taxCents: number,
  taxRateBasisPoints: number): boolean {
  if (!isNonNegativeCents(grossCents) || !isNonNegativeCents(taxCents) ||
      !isNonNegativeCents(taxRateBasisPoints)) return false;
  const numerator = BigInt(grossCents) * BigInt(taxRateBasisPoints);
  const denominator = BigInt(10_000) + BigInt(taxRateBasisPoints);
  const actual = BigInt(taxCents);
  return actual >= numerator / denominator &&
    actual <= (numerator + denominator - BigInt(1)) / denominator;
}

function halfUpTaxIncludedQuota(grossCents: bigint,
  taxRateBasisPoints: number): bigint {
  const rate = BigInt(taxRateBasisPoints);
  const denominator = BigInt(10_000) + rate;
  return (grossCents * rate * BigInt(2) + denominator) /
    (denominator * BigInt(2));
}

/**
 * Valida solo la forma de las referencias y montos declarados. Aprobación
 * exige cotejo independiente de venta, presentación, acuerdo y política
 * histórica antes de la emisión; [] no autoriza emisión.
 */
export function validateFiscalIntentPricingDeclaration(
  pricing: FiscalIntentPricingDeclaration,
): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(pricing)) return ["pricingDeclaration"];
  if (pricing.taxComputationMode !== "NOT_COMPUTED") {
    errors.push("pricingDeclaration.taxComputationMode");
  }
  if (pricing.currency !== "PEN") errors.push("pricingDeclaration.currency");
  if (typeof pricing.commercialTotalCents !== "number" ||
      !isNonNegativeCents(pricing.commercialTotalCents) ||
      pricing.commercialTotalCents === 0) {
    errors.push("pricingDeclaration.commercialTotalCents");
  }
  if (!Array.isArray(pricing.lines) || pricing.lines.length === 0) {
    errors.push("pricingDeclaration.lines");
  } else {
    const lineIds = new Set<string>();
    for (const [index, line] of pricing.lines.entries()) {
      const prefix = `pricingDeclaration.lines[${index}].`;
      if (!isRecord(line)) {
        errors.push(prefix.slice(0, -1));
        continue;
      }
      if (typeof line.lineId !== "string" || !isNonBlank(line.lineId) ||
          lineIds.has(line.lineId)) {
        errors.push(`${prefix}lineId`);
      } else lineIds.add(line.lineId);
      for (const key of ["presentationId", "agreedPriceSourceRef", "pricePolicyRef",
        "pricePolicyVersion", "fiscalPolicyRef", "fiscalPolicyVersion"] as const) {
        if (typeof line[key] !== "string" || !isNonBlank(line[key])) {
          errors.push(`${prefix}${key}`);
        }
      }
      if (line.commercialAmountBasis === undefined) {
        if (line.unitPriceTaxMode !== "TAX_INCLUDED") {
          errors.push(`${prefix}unitPriceTaxMode`);
        }
      } else if (line.commercialAmountBasis !== "FINAL_AMOUNT_AS_CHARGED" ||
          line.unitPriceTaxMode !== undefined) {
        errors.push(`${prefix}commercialAmountBasis`);
      }
      if (typeof line.agreedUnitPriceCents !== "number" ||
          !isNonNegativeCents(line.agreedUnitPriceCents) ||
          line.agreedUnitPriceCents === 0) {
        errors.push(`${prefix}agreedUnitPriceCents`);
      }
      if (!isIsoTimestampWithOffset(line.agreedAt)) {
        errors.push(`${prefix}agreedAt`);
      }
      rejectUnknownFields(line, PRICE_LINE_EVIDENCE_FIELDS, prefix, errors);
    }
  }
  rejectUnknownFields(pricing, PRICING_DECLARATION_FIELDS,
    "pricingDeclaration.", errors);
  return errors;
}

export function validateFiscalIntent(intent: FiscalIntent): readonly string[] {
  const errors = validateFiscalIntentFields(intent);
  if (!isRecord(intent)) return errors;
  errors.push(...validateFiscalIntentPricingDeclaration(intent.pricingDeclaration));
  return errors;
}

/** Replay exacto: la misma clave no autoriza cambiar comprador, venta ni precio. */
export function validateFiscalIntentReplay(
  original: FiscalIntent,
  replay: FiscalIntent,
): readonly string[] {
  const originalErrors = validateFiscalIntent(original);
  if (originalErrors.length) return originalErrors.map((error) => `original.${error}`);
  const replayErrors = validateFiscalIntent(replay);
  if (replayErrors.length) return replayErrors.map((error) => `replay.${error}`);
  const fields = (intent: FiscalIntent): readonly unknown[] => [
    intent.contractKind, intent.schemaVersion, intent.intentId, intent.idempotencyKey, intent.tenantId,
    intent.actorId, intent.saleId, intent.saleSnapshotId, intent.requestedDocumentType,
    intent.buyer.documentType, intent.buyer.documentNumber, intent.buyer.legalName,
    intent.occurredAt, intent.queuedAt,
    intent.pricingDeclaration.taxComputationMode,
    intent.pricingDeclaration.currency,
    intent.pricingDeclaration.commercialTotalCents,
    intent.pricingDeclaration.lines.map((line) => [
      line.lineId, line.presentationId, line.unitPriceTaxMode,
      line.commercialAmountBasis,
      line.agreedUnitPriceCents, line.agreedPriceSourceRef,
      line.pricePolicyRef, line.pricePolicyVersion,
      line.fiscalPolicyRef, line.fiscalPolicyVersion, line.agreedAt,
    ]),
  ];
  return JSON.stringify(fields(original)) === JSON.stringify(fields(replay))
    ? [] : ["replay.payloadMismatch"];
}

function validateFiscalSaleSnapshotCommon(
  snapshot: FiscalSaleSnapshot,
  errors: string[],
): void {
  for (const key of ["fiscalSnapshotId", "intentId", "tenantId", "saleId", "saleSnapshotId", "issuerRuc", "issuerLegalName"] as const) {
    if (!isNonBlank(snapshot[key])) errors.push(key);
  }
  if (!/^\d{11}$/.test(snapshot.issuerRuc)) errors.push("issuerRuc.format");
  if (!isFiscalTaxRegime(snapshot.taxRegime)) {
    errors.push("taxRegime");
  }
  if (snapshot.documentType !== "BOLETA" && snapshot.documentType !== "FACTURA") {
    errors.push("documentType");
  }
  if (snapshot.currency !== "PEN") errors.push("currency");
  if (!["DNI", "RUC", "CE", "PASAPORTE", "SIN_DOCUMENTO"].includes(snapshot.buyer.documentType)) {
    errors.push("buyer.documentType");
  }
  if (!isNonBlank(snapshot.buyer.legalName)) errors.push("buyer.legalName");
  if (snapshot.buyer.documentType === "SIN_DOCUMENTO") {
    if (snapshot.buyer.documentNumber !== null) errors.push("buyer.documentNumber");
  } else if (!isNonBlank(snapshot.buyer.documentNumber)) {
    errors.push("buyer.documentNumber");
  }
  if (snapshot.documentType === "FACTURA" && snapshot.buyer.documentType !== "RUC") {
    errors.push("buyer.documentTypeForFactura");
  }
  if (snapshot.taxRegime === "NRUS" && snapshot.documentType === "FACTURA") {
    errors.push("taxRegime.documentType");
  }
  if (!isNonNegativeCents(snapshot.totalCents)) errors.push("totalCents");
  if (snapshot.payment.status === "PAID") {
    if (!isNonNegativeCents(snapshot.payment.paidAmountCents)) errors.push("payment.paidAmountCents");
    if (snapshot.payment.paidAmountCents !== snapshot.totalCents) errors.push("payment.totalMismatch");
    if (!Number.isFinite(Date.parse(snapshot.payment.paidAt))) errors.push("payment.paidAt");
  } else if (snapshot.payment.status === "DEFERRED") {
    if (snapshot.documentType !== "BOLETA") errors.push("payment.deferredDocumentType");
    if (!Number.isFinite(Date.parse(snapshot.payment.deferredAt))) errors.push("payment.deferredAt");
    if (typeof snapshot.payment.deliveryDocumentId !== "string" || !snapshot.payment.deliveryDocumentId.trim()) errors.push("payment.deliveryDocumentId");
    if (typeof snapshot.payment.orderId !== "string" || !snapshot.payment.orderId.trim()) errors.push("payment.orderId");
    if ("paidAmountCents" in snapshot.payment || "paidAt" in snapshot.payment || "outstandingAmountCents" in snapshot.payment) errors.push("payment.unverifiedSettlement");
  } else errors.push("payment.status");
  if (!Number.isFinite(Date.parse(snapshot.frozenAt))) errors.push("frozenAt");
  if (snapshot.lines.length === 0) errors.push("lines");
  const lineIds = new Set<string>();
  for (const [index, line] of snapshot.lines.entries()) {
    const prefix = `lines[${index}]`;
    if (line.taxSource !== undefined && !validateFiscalTaxResolutionSource(line.taxSource)) errors.push(`${prefix}.taxSource`);
    if (!isNonBlank(line.lineId) || lineIds.has(line.lineId)) errors.push(`${prefix}.lineId`);
    lineIds.add(line.lineId);
    if (!isNonBlank(line.description)) errors.push(`${prefix}.description`);
    if (!SUPPORTED_UNIT_CODES.has(line.unitCode)) errors.push(`${prefix}.unitCode`);
    if (!fiscalQuantityRatio(line.quantity)) errors.push(`${prefix}.quantity`);
    for (const key of ["unitPriceCents", "discountCents", "totalCents"] as const) {
      if (!isNonNegativeCents(line[key])) errors.push(`${prefix}.${key}`);
    }
    const supportedCategory = line.tax.category === "GRAVADA" ||
      line.tax.category === "EXONERADA" || line.tax.category === "INAFECTA";
    const expectedAffectation = supportedCategory
      ? SUPPORTED_AFFECTATION_CODES[line.tax.category] : null;
    if (!expectedAffectation) errors.push(`${prefix}.tax.category`);
    if (line.tax.affectationCode !== expectedAffectation) {
      errors.push(`${prefix}.tax.affectationCode`);
    }
    if (!isNonNegativeCents(line.tax.taxableBaseCents)) errors.push(`${prefix}.tax.taxableBaseCents`);
    if (!isNonNegativeCents(line.tax.taxAmountCents)) errors.push(`${prefix}.tax.taxAmountCents`);
    if (!Number.isSafeInteger(line.tax.taxRateBasisPoints) || line.tax.taxRateBasisPoints < 0) {
      errors.push(`${prefix}.tax.taxRateBasisPoints`);
    }
    // El Nuevo RUS no discrimina IGV u otro impuesto en la boleta. La
    // clasificación GRAVADA/10 se conserva, pero su tasa de emisión es cero.
    if (snapshot.taxRegime === "NRUS" &&
        (line.tax.taxRateBasisPoints !== 0 || line.tax.taxAmountCents !== 0)) {
      errors.push(`${prefix}.tax.nrusDiscriminatedTax`);
    }
    if (line.tax.category === "GRAVADA") {
      if (line.tax.taxScheme !== "IGV") errors.push(`${prefix}.tax.taxScheme`);
      if (line.tax.taxRateBasisPoints !== (snapshot.taxRegime === "NRUS" ? 0 : 1800)) {
        errors.push(`${prefix}.tax.taxRateBasisPoints`);
      }
    } else if (line.tax.taxScheme !== "NONE" || line.tax.taxRateBasisPoints !== 0 || line.tax.taxAmountCents !== 0) {
      errors.push(`${prefix}.tax.nonTaxableAmounts`);
    }
  }
  if (isNonNegativeCents(snapshot.totalCents) &&
      snapshot.lines.every((line) => isNonNegativeCents(line.totalCents)) &&
      snapshot.lines.reduce((sum, line) => sum + BigInt(line.totalCents), BigInt(0)) !==
        BigInt(snapshot.totalCents)) {
    errors.push("totalCents.linesMismatch");
  }
}

export function validateFiscalSaleSnapshot(snapshot: FiscalSaleSnapshot): readonly string[] {
  if (!isRecord(snapshot)) return ["snapshot"];
  const errors: string[] = [];
  rejectUnknownFields(snapshot, SNAPSHOT_FIELDS, "", errors);
  if (snapshot.contractKind !== FISCAL_SALE_SNAPSHOT_CONTRACT_KIND) errors.push("contractKind");
  if (snapshot.schemaVersion !== FISCAL_CPE_SCHEMA_VERSION) errors.push("schemaVersion");
  if (!isRecord(snapshot.payment)) errors.push("payment");
  if (!isRecord(snapshot.buyer)) errors.push("buyer");
  if (!Array.isArray(snapshot.lines)) errors.push("lines");
  if (errors.includes("payment") || errors.includes("buyer") || errors.includes("lines")) return errors;
  rejectUnknownFields(snapshot.buyer as unknown as Record<string, unknown>, BUYER_FIELDS,
    "buyer.", errors);
  const paymentFields = snapshot.payment.status === "PAID" ? PAID_FIELDS :
    snapshot.payment.status === "DEFERRED" ? DEFERRED_FIELDS : ["status"];
  rejectUnknownFields(snapshot.payment as unknown as Record<string, unknown>, paymentFields,
    "payment.", errors);
  for (const [index, line] of snapshot.lines.entries()) {
    if (!isRecord(line) || !isRecord(line.tax)) {
      errors.push(`lines[${index}]`);
    } else {
      rejectUnknownFields(line, SNAPSHOT_LINE_FIELDS, `lines[${index}].`, errors);
      rejectUnknownFields(line.tax, LINE_TAX_FIELDS, `lines[${index}].tax.`, errors);
    }
  }
  if (errors.some((error) => /^lines\[\d+\]$/.test(error))) return errors;
  validateFiscalSaleSnapshotCommon(snapshot, errors);
  let gravadaPreGrossCents = BigInt(0);
  let gravadaPreTaxCents = BigInt(0);
  let gravadaPostGrossCents = BigInt(0);
  let gravadaPostTaxCents = BigInt(0);
  let preAggregateComparable = true;
  let postAggregateComparable = true;
  let hasGravada = false;
  for (const [index, line] of snapshot.lines.entries()) {
    const prefix = `lines[${index}]`;
    if (line.commercialAmountBasis === undefined) {
      if (line.unitPriceTaxMode !== "TAX_INCLUDED") errors.push(`${prefix}.unitPriceTaxMode`);
    } else if (line.commercialAmountBasis !== "FINAL_AMOUNT_AS_CHARGED" ||
        line.unitPriceTaxMode !== undefined ||
        !((line.tax.category === "EXONERADA" && line.tax.affectationCode === "20" &&
          line.tax.taxScheme === "NONE") ||
          (snapshot.taxRegime === "NRUS" && line.tax.category === "GRAVADA" &&
            line.tax.affectationCode === "10" && line.tax.taxScheme === "IGV")) ||
        line.tax.taxRateBasisPoints !== 0 || line.tax.taxAmountCents !== 0) {
      errors.push(`${prefix}.commercialAmountBasis`);
    }
    const gross = fiscalLineGrossCents(line.unitPriceCents, line.quantity);
    if (gross === null || gross <= 0 || gross !== line.commercialGrossBeforeDiscountCents ||
        !isNonNegativeCents(line.discountCents) || line.discountCents >= gross) {
      errors.push(`${prefix}.unitPriceQuantity`);
    }
    const requiredAmounts = [
      "commercialGrossBeforeDiscountCents",
      "commercialGrossDiscountCents",
      "taxableBaseBeforeDiscountCents",
      "baseDiscountCents",
    ] as const;
    const amountsValid = requiredAmounts.every((key) => {
      const value = line[key];
      if (typeof value === "number" && isNonNegativeCents(value)) return true;
      errors.push(`${prefix}.${key}`);
      return false;
    });
    if (line.discountReasonCode !== "00") errors.push(`${prefix}.discountReasonCode`);
    if (amountsValid) {
      const { commercialGrossBeforeDiscountCents, commercialGrossDiscountCents,
        taxableBaseBeforeDiscountCents, baseDiscountCents } = line;
      const taxLineTotalMatches = isNonNegativeCents(line.tax.taxableBaseCents) &&
        isNonNegativeCents(line.tax.taxAmountCents) && isNonNegativeCents(line.totalCents) &&
        BigInt(line.tax.taxableBaseCents) + BigInt(line.tax.taxAmountCents) ===
          BigInt(line.totalCents);
      if (commercialGrossDiscountCents !== line.discountCents ||
          commercialGrossBeforeDiscountCents - commercialGrossDiscountCents !== line.totalCents ||
          taxableBaseBeforeDiscountCents - baseDiscountCents !== line.tax.taxableBaseCents ||
          !taxLineTotalMatches ||
          taxableBaseBeforeDiscountCents > commercialGrossBeforeDiscountCents ||
          baseDiscountCents > commercialGrossDiscountCents) {
        errors.push(`${prefix}.taxIncludedBreakdown`);
      }
      const taxBeforeDiscountCents = commercialGrossBeforeDiscountCents -
        taxableBaseBeforeDiscountCents;
      if (line.tax.category === "GRAVADA") {
        if (!isFloorOrCeilTaxIncludedQuota(commercialGrossBeforeDiscountCents,
          taxBeforeDiscountCents, line.tax.taxRateBasisPoints)) {
          errors.push(`${prefix}.preDiscountTaxArithmetic`);
        }
        if (!isFloorOrCeilTaxIncludedQuota(line.totalCents,
          line.tax.taxAmountCents, line.tax.taxRateBasisPoints)) {
          errors.push(`${prefix}.postDiscountTaxArithmetic`);
        }
      } else if (taxableBaseBeforeDiscountCents !== commercialGrossBeforeDiscountCents) {
        errors.push(`${prefix}.preDiscountTaxArithmetic`);
      } else if (line.tax.taxableBaseCents !== line.totalCents) {
        errors.push(`${prefix}.postDiscountTaxArithmetic`);
      }
    }
    if (line.tax.category === "GRAVADA") {
      hasGravada = true;
      const rateIsValid = line.tax.taxRateBasisPoints ===
        (snapshot.taxRegime === "NRUS" ? 0 : 1800);
      if (rateIsValid && isNonNegativeCents(line.commercialGrossBeforeDiscountCents) &&
          isNonNegativeCents(line.taxableBaseBeforeDiscountCents) &&
          line.taxableBaseBeforeDiscountCents <= line.commercialGrossBeforeDiscountCents) {
        gravadaPreGrossCents += BigInt(line.commercialGrossBeforeDiscountCents);
        gravadaPreTaxCents += BigInt(line.commercialGrossBeforeDiscountCents -
          line.taxableBaseBeforeDiscountCents);
      } else preAggregateComparable = false;
      if (rateIsValid && isNonNegativeCents(line.totalCents) &&
          isNonNegativeCents(line.tax.taxAmountCents)) {
        gravadaPostGrossCents += BigInt(line.totalCents);
        gravadaPostTaxCents += BigInt(line.tax.taxAmountCents);
      } else postAggregateComparable = false;
    }
  }
  if (hasGravada && preAggregateComparable &&
      gravadaPreTaxCents !== halfUpTaxIncludedQuota(gravadaPreGrossCents,
        snapshot.taxRegime === "NRUS" ? 0 : 1800)) {
    errors.push("tax.preDiscountAggregateMismatch");
  }
  if (hasGravada && postAggregateComparable &&
      gravadaPostTaxCents !== halfUpTaxIncludedQuota(gravadaPostGrossCents,
        snapshot.taxRegime === "NRUS" ? 0 : 1800)) {
    errors.push("tax.postDiscountAggregateMismatch");
  }
  return errors;
}

export function validateFiscalIntentSnapshotLink(
  intent: FiscalIntent,
  snapshot: FiscalSaleSnapshot,
): readonly string[] {
  const intentErrors = validateFiscalIntent(intent);
  if (intentErrors.length) return intentErrors.map((error) => `intent.${error}`);
  const snapshotErrors = validateFiscalSaleSnapshot(snapshot);
  if (snapshotErrors.length) return snapshotErrors.map((error) => `snapshot.${error}`);
  const errors: string[] = [];
  if (intent.intentId !== snapshot.intentId) errors.push("intentId");
  if (intent.tenantId !== snapshot.tenantId) errors.push("tenantId");
  if (intent.saleId !== snapshot.saleId) errors.push("saleId");
  if (intent.saleSnapshotId !== snapshot.saleSnapshotId) errors.push("saleSnapshotId");
  if (intent.requestedDocumentType !== snapshot.documentType) errors.push("documentType");
  if (intent.buyer.documentType !== snapshot.buyer.documentType ||
      intent.buyer.documentNumber !== snapshot.buyer.documentNumber ||
      intent.buyer.legalName !== snapshot.buyer.legalName) errors.push("buyer");
  if (intent.pricingDeclaration.currency !== snapshot.currency) errors.push("currency");
  if (intent.pricingDeclaration.commercialTotalCents !== snapshot.totalCents) {
    errors.push("pricingDeclaration.commercialTotalCents");
  }
  const intentLines = new Map(intent.pricingDeclaration.lines.map((line) => [line.lineId, line]));
  const snapshotLines = new Map(snapshot.lines.map((line) => [line.lineId, line]));
  if (intentLines.size !== snapshotLines.size ||
      [...intentLines.keys()].some((lineId) => !snapshotLines.has(lineId))) {
    errors.push("pricingDeclaration.lines");
  } else {
    for (const [lineId, line] of intentLines) {
      const frozen = snapshotLines.get(lineId)!;
      if (line.unitPriceTaxMode !== frozen.unitPriceTaxMode) {
        errors.push(`pricingDeclaration.lines.${lineId}.unitPriceTaxMode`);
      }
      if (line.commercialAmountBasis !== frozen.commercialAmountBasis) {
        errors.push(`pricingDeclaration.lines.${lineId}.commercialAmountBasis`);
      }
      if (line.agreedUnitPriceCents !== frozen.unitPriceCents) {
        errors.push(`pricingDeclaration.lines.${lineId}.agreedUnitPriceCents`);
      }
    }
  }
  return errors;
}
