/** Contratos puros compartidos. El backend es la única autoridad de emisor, serie y emisión. */
import type { RegimenTributarioEmpresa } from "../../shared/kernel/empresa.contract";

export const FISCAL_INTENT_CONTRACT_VERSION = 1 as const;
export const FISCAL_INTENT_V2_CONTRACT_VERSION = 2 as const;
export const FISCAL_EVIDENCE_CONTRACT_VERSION = 1 as const;
/** @deprecated Alias histórico solo para intents/evidencias V1; no usar en snapshots. */
export const FISCAL_CPE_CONTRACT_VERSION = FISCAL_INTENT_CONTRACT_VERSION;
export const FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION = 1 as const;
export const FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION = 2 as const;
export const FISCAL_SALE_SNAPSHOT_V2_CAPABILITY =
  "EXPLICIT_TAX_INCLUDED_PRICING_V2" as const;

export type FiscalCpeDocumentType = "BOLETA" | "FACTURA";
export type FiscalTaxRegime = RegimenTributarioEmpresa;
export type FiscalCurrency = "PEN";

export type FiscalBuyerDocumentType =
  | "DNI"
  | "RUC"
  | "CE"
  | "PASAPORTE"
  | "SIN_DOCUMENTO";

export interface FiscalBuyerV1 {
  readonly documentType: FiscalBuyerDocumentType;
  readonly documentNumber: string | null;
  readonly legalName: string;
}

/** Una solicitud no confirma que haya CPE ni concede número fiscal. */
export interface FiscalIntentV1 {
  readonly version: typeof FISCAL_INTENT_CONTRACT_VERSION;
  readonly intentId: string;
  readonly idempotencyKey: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly saleId: string;
  readonly saleSnapshotId: string;
  readonly requestedDocumentType: FiscalCpeDocumentType;
  readonly buyer: FiscalBuyerV1;
  /** Oportunidad comercial; no es fecha fiscal ni permite retrofechar. */
  readonly occurredAt: string;
  readonly queuedAt: string;
}

/**
 * Declaración comercial del cliente, no cálculo ni determinación tributaria.
 * El backend debe cotejar el total con la venta y su snapshot y congelar allí
 * los importes por línea antes de asignar serie/correlativo. EXACT y los
 * precios con impuesto excluido permanecen fuera de este contrato inicial.
 */
export interface FiscalIntentPricingDeclarationV2 {
  readonly unitPriceTaxMode: "TAX_INCLUDED";
  readonly taxComputationMode: "NOT_COMPUTED";
  readonly currency: "PEN";
  readonly commercialTotalCents: number;
}

/** V2 conserva la identidad V1; solo añade una declaración de precio verificable. */
export interface FiscalIntentV2 extends Omit<FiscalIntentV1, "version"> {
  readonly version: typeof FISCAL_INTENT_V2_CONTRACT_VERSION;
  readonly pricingDeclaration: FiscalIntentPricingDeclarationV2;
}

export type FiscalIntent = FiscalIntentV1 | FiscalIntentV2;

export type FiscalTaxCategory =
  | "GRAVADA"
  | "EXONERADA"
  | "INAFECTA"
  | "EXPORTACION"
  | "GRATUITA";

/** Semántica congelada de los importes unitarios/comerciales de la línea. */
export type FiscalUnitPriceTaxMode = "TAX_INCLUDED" | "TAX_EXCLUDED";

/** Todos los campos tributarios se fijan por línea; jamás se infiere IGV global. */
export type FiscalLineTaxV1 =
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
  readonly lineId: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitCode: string;
  readonly unitPriceCents: number;
  readonly discountCents: number;
  /** Importe fiscal después de descuento de ítem y tributo de esa línea. */
  readonly totalCents: number;
  readonly tax: FiscalLineTaxV1;
}

/**
 * Snapshot publicado originalmente: precio unitario y descuento SIN tributo.
 * V1 nunca admite campos TAX_INCLUDED; el adaptador legacy es explícito por
 * `snapshot.version === 1`, no por inferencia aritmética.
 */
export interface FiscalSaleLineV1 extends FiscalSaleLineCommon {}

/** Precio bruto y descomposición del descuento congelados por el backend V2. */
export interface FiscalSaleLineV2 extends FiscalSaleLineCommon {
  readonly unitPriceTaxMode: Extract<FiscalUnitPriceTaxMode, "TAX_INCLUDED">;
  readonly commercialGrossBeforeDiscountCents: number;
  readonly commercialGrossDiscountCents: number;
  readonly taxableBaseBeforeDiscountCents: number;
  readonly baseDiscountCents: number;
  readonly discountReasonCode: "00";
}

/** Solo el importe realmente aplicado a la venta; no el efectivo entregado para vuelto. */
export interface FiscalPaidSaleV1 {
  readonly status: "PAID";
  readonly paidAmountCents: number;
  readonly paidAt: string;
}

/** Boleta de crédito autorizada por entrega comprobada, sin afirmar cobro ni saldo financiero. */
export interface FiscalDeferredSaleV1 {
  readonly status: "DEFERRED";
  /** Fecha de la entrega verificada; no es fecha de vencimiento ni de emisión. */
  readonly deferredAt: string;
  readonly deliveryDocumentId: string;
  readonly orderId: string;
}

/** Hecho canónico congelado por backend tras conciliar Venta y venta_snapshot. */
export interface FiscalSaleSnapshotV1 {
  readonly version: typeof FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION;
  readonly fiscalSnapshotId: string;
  readonly intentId: string;
  readonly tenantId: string;
  readonly saleId: string;
  readonly saleSnapshotId: string;
  readonly issuerRuc: string;
  readonly issuerLegalName: string;
  readonly taxRegime: FiscalTaxRegime;
  readonly documentType: FiscalCpeDocumentType;
  readonly buyer: FiscalBuyerV1;
  readonly currency: FiscalCurrency;
  readonly lines: readonly FiscalSaleLineV1[];
  readonly totalCents: number;
  readonly payment: FiscalPaidSaleV1;
  readonly frozenAt: string;
}

/** Snapshot actual: el capability evita que un consumidor V1 lo reinterprete. */
export interface FiscalSaleSnapshotV2 {
  readonly version: typeof FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION;
  readonly capability: typeof FISCAL_SALE_SNAPSHOT_V2_CAPABILITY;
  readonly fiscalSnapshotId: string;
  readonly intentId: string;
  readonly tenantId: string;
  readonly saleId: string;
  readonly saleSnapshotId: string;
  readonly issuerRuc: string;
  readonly issuerLegalName: string;
  readonly taxRegime: FiscalTaxRegime;
  readonly documentType: FiscalCpeDocumentType;
  readonly buyer: FiscalBuyerV1;
  readonly currency: FiscalCurrency;
  readonly lines: readonly FiscalSaleLineV2[];
  readonly totalCents: number;
  readonly payment: FiscalPaidSaleV1 | FiscalDeferredSaleV1;
  readonly frozenAt: string;
}

export type FiscalSaleSnapshot = FiscalSaleSnapshotV1 | FiscalSaleSnapshotV2;

/** Local y backend tienen ciclos distintos. RECIBIDA_BACKEND tampoco es emitida. */
export type FiscalLocalState =
  | "COLA_LOCAL"
  | "ESPERANDO_VENTA_PUBLICADA"
  | "RECIBIDA_BACKEND"
  | "RESULTADO_DESCONOCIDO"
  | "ACEPTADO"
  | "ACEPTADO_CON_OBSERVACION"
  | "RECHAZADO"
  | "ACCION_SUPERVISOR";

export type FiscalBackendState =
  | "RECIBIDA_BACKEND"
  | "VALIDANDO"
  | "CONGELADA"
  | "NUMERADA"
  | "ENVIADA_PSE"
  | "RESULTADO_DESCONOCIDO"
  | "ACEPTADO"
  | "ACEPTADO_CON_OBSERVACION"
  | "RECHAZADO"
  | "ACCION_SUPERVISOR";

export type FiscalTerminalState =
  | "ACEPTADO"
  | "ACEPTADO_CON_OBSERVACION"
  | "RECHAZADO";

/** La identidad fiscal se comprueba dentro del CDR, no solo en el HTTP del PSE. */
export interface FiscalDocumentIdentityV1 {
  readonly issuerRuc: string;
  readonly documentType: FiscalCpeDocumentType;
  readonly series: string;
  readonly number: number;
}

/** Resultado estructural de parsear CDR y cotejar identidad con el XML enviado. */
export interface FiscalCdrVerificationV1 {
  readonly identity: FiscalDocumentIdentityV1;
  readonly responseCode: string;
  readonly responseDescription: string;
  readonly status: FiscalTerminalState;
  readonly observations: readonly string[];
  readonly signedXmlStorageRef: string;
  readonly signedXmlSha256: string;
  readonly cdrStorageRef: string;
  readonly cdrSha256: string;
}

/** Referencias y hashes, no tokens, JWT ni XML/CDR crudos en el payload de UI. */
export interface FiscalEvidenceV1 extends FiscalDocumentIdentityV1 {
  readonly version: typeof FISCAL_EVIDENCE_CONTRACT_VERSION;
  readonly fiscalDocumentId: string;
  readonly intentId: string;
  readonly tenantId: string;
  readonly saleId: string;
  readonly status: FiscalTerminalState;
  readonly issuedAt: string;
  readonly provider: string;
  readonly providerRequestId: string | null;
  readonly signedXmlStorageRef: string;
  readonly signedXmlSha256: string;
  readonly cdrStorageRef: string;
  readonly cdrSha256: string;
  readonly sunatResponseCode: string;
  readonly sunatResponseDescription: string;
  readonly observations: readonly string[];
}

export function isFiscalTerminalState(
  state: FiscalLocalState | FiscalBackendState,
): state is FiscalTerminalState {
  return state === "ACEPTADO" || state === "ACEPTADO_CON_OBSERVACION" || state === "RECHAZADO";
}

/** Un timeout posterior al envío nunca autoriza volver a firmar/enviar. */
export function canAutomaticallySubmitFiscalState(state: FiscalBackendState): boolean {
  return state === "RECIBIDA_BACKEND" || state === "VALIDANDO" || state === "CONGELADA";
}

export function isSameFiscalDocumentIdentity(
  expected: FiscalDocumentIdentityV1,
  actual: FiscalDocumentIdentityV1,
): boolean {
  return expected.issuerRuc === actual.issuerRuc &&
    expected.documentType === actual.documentType &&
    expected.series === actual.series &&
    expected.number === actual.number;
}

const isNonNegativeCents = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;
const isNonBlank = (value: string): boolean => value.trim().length > 0;

// Subconjunto oneroso soportado por el emisor de boletas del backend. Cat07
// contiene más supuestos; admitirlos exige primero su flujo fiscal propio.
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

const INTENT_V1_FIELDS = [
  "version", "intentId", "idempotencyKey", "tenantId", "actorId", "saleId",
  "saleSnapshotId", "requestedDocumentType", "buyer", "occurredAt", "queuedAt",
] as const;
const INTENT_V2_FIELDS = [...INTENT_V1_FIELDS, "pricingDeclaration"] as const;
const BUYER_FIELDS = ["documentType", "documentNumber", "legalName"] as const;
const PRICING_DECLARATION_V2_FIELDS = [
  "unitPriceTaxMode", "taxComputationMode", "currency", "commercialTotalCents",
] as const;

function validateFiscalIntentCommon(intent: unknown, version: 1 | 2): string[] {
  const errors: string[] = [];
  if (!isRecord(intent)) return ["intent"];
  if (intent.version !== version) errors.push("version");
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
  rejectUnknownFields(intent, version === 1 ? INTENT_V1_FIELDS : INTENT_V2_FIELDS, "", errors);
  return errors;
}

function isRoundedTaxQuota(baseCents: number, taxCents: number,
  taxRateBasisPoints: number): boolean {
  if (!isNonNegativeCents(baseCents) || !isNonNegativeCents(taxCents) ||
      !isNonNegativeCents(taxRateBasisPoints)) return false;
  const numerator = BigInt(baseCents) * BigInt(taxRateBasisPoints);
  const denominator = BigInt(10_000);
  return BigInt(taxCents) >= numerator / denominator &&
    BigInt(taxCents) <= (numerator + denominator - BigInt(1)) / denominator;
}

export function validateFiscalIntentV1(intent: FiscalIntentV1): readonly string[] {
  return validateFiscalIntentCommon(intent, FISCAL_INTENT_CONTRACT_VERSION);
}

export function validateFiscalIntentV2(intent: FiscalIntentV2): readonly string[] {
  const errors = validateFiscalIntentCommon(intent, FISCAL_INTENT_V2_CONTRACT_VERSION);
  if (!isRecord(intent) || !isRecord(intent.pricingDeclaration)) {
    errors.push("pricingDeclaration");
    return errors;
  }
  const pricing = intent.pricingDeclaration;
  if (pricing.unitPriceTaxMode !== "TAX_INCLUDED") {
    errors.push("pricingDeclaration.unitPriceTaxMode");
  }
  if (pricing.taxComputationMode !== "NOT_COMPUTED") {
    errors.push("pricingDeclaration.taxComputationMode");
  }
  if (pricing.currency !== "PEN") errors.push("pricingDeclaration.currency");
  if (typeof pricing.commercialTotalCents !== "number" ||
    !isNonNegativeCents(pricing.commercialTotalCents)) {
    errors.push("pricingDeclaration.commercialTotalCents");
  }
  rejectUnknownFields(pricing, PRICING_DECLARATION_V2_FIELDS, "pricingDeclaration.", errors);
  return errors;
}

/** Lector discriminado: un V2 inválido jamás vuelve a evaluarse como V1. */
export function validateFiscalIntent(intent: FiscalIntent): readonly string[] {
  const version = isRecord(intent) ? intent.version : undefined;
  if (version === FISCAL_INTENT_CONTRACT_VERSION) {
    return validateFiscalIntentV1(intent as FiscalIntentV1);
  }
  if (version === FISCAL_INTENT_V2_CONTRACT_VERSION) {
    return validateFiscalIntentV2(intent as FiscalIntentV2);
  }
  return ["version"];
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
    intent.version, intent.intentId, intent.idempotencyKey, intent.tenantId,
    intent.actorId, intent.saleId, intent.saleSnapshotId, intent.requestedDocumentType,
    intent.buyer.documentType, intent.buyer.documentNumber, intent.buyer.legalName,
    intent.occurredAt, intent.queuedAt,
    ...(intent.version === FISCAL_INTENT_V2_CONTRACT_VERSION ? [
      intent.pricingDeclaration.unitPriceTaxMode,
      intent.pricingDeclaration.taxComputationMode,
      intent.pricingDeclaration.currency,
      intent.pricingDeclaration.commercialTotalCents,
    ] : []),
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
    // El Nuevo RUS no discrimina IGV u otro impuesto en la boleta. Una tasa
    // comercial global no puede convertirse silenciosamente en tributo CPE.
    if (snapshot.taxRegime === "NRUS" &&
        (line.tax.taxScheme !== "NONE" || line.tax.taxRateBasisPoints !== 0 ||
          line.tax.taxAmountCents !== 0)) {
      errors.push(`${prefix}.tax.nrusDiscriminatedTax`);
    }
    if (line.tax.category === "GRAVADA") {
      if (line.tax.taxScheme !== "IGV") errors.push(`${prefix}.tax.taxScheme`);
      if (line.tax.taxRateBasisPoints !== 1800) {
        errors.push(`${prefix}.tax.taxRateBasisPoints`);
      }
      if (snapshot.version === FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION &&
          line.tax.taxRateBasisPoints === 1800 &&
          !isRoundedTaxQuota(line.tax.taxableBaseCents, line.tax.taxAmountCents, 1800)) {
        errors.push(`${prefix}.tax.arithmetic`);
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

const V2_LINE_FIELDS = [
  "unitPriceTaxMode",
  "commercialGrossBeforeDiscountCents",
  "commercialGrossDiscountCents",
  "taxableBaseBeforeDiscountCents",
  "baseDiscountCents",
  "discountReasonCode",
] as const;

export function validateFiscalSaleSnapshotV1(snapshot: FiscalSaleSnapshotV1): readonly string[] {
  const errors: string[] = [];
  if (snapshot.version !== FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION) errors.push("version");
  if ("capability" in snapshot) errors.push("capability");
  validateFiscalSaleSnapshotCommon(snapshot, errors);
  if ((snapshot.payment as { readonly status: unknown }).status !== "PAID") {
    errors.push("payment.status");
  }
  for (const [index, line] of snapshot.lines.entries()) {
    const record = line as unknown as Record<string, unknown>;
    for (const key of V2_LINE_FIELDS) {
      if (key in record) errors.push(`lines[${index}].${key}`);
    }
    const gross = fiscalLineGrossCents(line.unitPriceCents, line.quantity);
    if (gross === null || gross <= 0 || !isNonNegativeCents(line.discountCents) ||
        line.discountCents >= gross ||
        gross - line.discountCents !== line.tax.taxableBaseCents) {
      errors.push(`lines[${index}].unitPriceQuantity`);
    }
    if (isNonNegativeCents(line.totalCents) &&
        isNonNegativeCents(line.tax.taxableBaseCents) &&
        isNonNegativeCents(line.tax.taxAmountCents) &&
        BigInt(line.tax.taxableBaseCents) + BigInt(line.tax.taxAmountCents) !==
          BigInt(line.totalCents)) {
      errors.push(`lines[${index}].tax.lineTotalMismatch`);
    }
  }
  return errors;
}

export function validateFiscalSaleSnapshotV2(snapshot: FiscalSaleSnapshotV2): readonly string[] {
  const errors: string[] = [];
  if (snapshot.version !== FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION) errors.push("version");
  if (snapshot.capability !== FISCAL_SALE_SNAPSHOT_V2_CAPABILITY) errors.push("capability");
  validateFiscalSaleSnapshotCommon(snapshot, errors);
  for (const [index, line] of snapshot.lines.entries()) {
    const prefix = `lines[${index}]`;
    if (line.unitPriceTaxMode !== "TAX_INCLUDED") errors.push(`${prefix}.unitPriceTaxMode`);
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
          baseDiscountCents > commercialGrossDiscountCents ||
          (commercialGrossDiscountCents === 0
            ? baseDiscountCents !== 0
            : baseDiscountCents <= 0)) {
        errors.push(`${prefix}.taxIncludedBreakdown`);
      }
      const taxBeforeDiscountCents = commercialGrossBeforeDiscountCents -
        taxableBaseBeforeDiscountCents;
      if (line.tax.category === "GRAVADA") {
        if (!isRoundedTaxQuota(taxableBaseBeforeDiscountCents,
          taxBeforeDiscountCents, line.tax.taxRateBasisPoints)) {
          errors.push(`${prefix}.preDiscountTaxArithmetic`);
        }
        if (!isRoundedTaxQuota(line.tax.taxableBaseCents,
          line.tax.taxAmountCents, line.tax.taxRateBasisPoints)) {
          errors.push(`${prefix}.postDiscountTaxArithmetic`);
        }
      } else if (taxableBaseBeforeDiscountCents !== commercialGrossBeforeDiscountCents) {
        errors.push(`${prefix}.preDiscountTaxArithmetic`);
      } else if (line.tax.taxableBaseCents !== line.totalCents) {
        errors.push(`${prefix}.postDiscountTaxArithmetic`);
      }
    }
  }
  return errors;
}

/** Lector discriminado: jamás adapta un V2 inválido como si fuera V1. */
export function validateFiscalSaleSnapshot(snapshot: FiscalSaleSnapshot): readonly string[] {
  const version = (snapshot as { readonly version: unknown }).version;
  if (version === FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION) {
    return validateFiscalSaleSnapshotV1(snapshot as FiscalSaleSnapshotV1);
  }
  if (version === FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION) {
    return validateFiscalSaleSnapshotV2(snapshot as FiscalSaleSnapshotV2);
  }
  return ["version"];
}

export function validateFiscalIntentSnapshotLinkV1(
  intent: FiscalIntentV1,
  snapshot: FiscalSaleSnapshot,
): readonly string[] {
  const errors: string[] = [];
  if (intent.intentId !== snapshot.intentId) errors.push("intentId");
  if (intent.tenantId !== snapshot.tenantId) errors.push("tenantId");
  if (intent.saleId !== snapshot.saleId) errors.push("saleId");
  if (intent.saleSnapshotId !== snapshot.saleSnapshotId) errors.push("saleSnapshotId");
  if (intent.requestedDocumentType !== snapshot.documentType) errors.push("documentType");
  return errors;
}

const isSha256 = (value: string): boolean => /^[a-f\d]{64}$/i.test(value);

export function validateFiscalCdrVerificationV1(
  cdr: FiscalCdrVerificationV1,
  expectedIdentity: FiscalDocumentIdentityV1,
): readonly string[] {
  const errors: string[] = [];
  if (!isSameFiscalDocumentIdentity(expectedIdentity, cdr.identity)) errors.push("identity");
  if (!isNonBlank(cdr.responseCode)) errors.push("responseCode");
  if (!isNonBlank(cdr.responseDescription)) errors.push("responseDescription");
  if (!isNonBlank(cdr.signedXmlStorageRef)) errors.push("signedXmlStorageRef");
  if (!isSha256(cdr.signedXmlSha256)) errors.push("signedXmlSha256");
  if (!isNonBlank(cdr.cdrStorageRef)) errors.push("cdrStorageRef");
  if (!isSha256(cdr.cdrSha256)) errors.push("cdrSha256");
  return errors;
}

export function validateFiscalEvidenceV1(evidence: FiscalEvidenceV1): readonly string[] {
  const errors: string[] = [];
  if (evidence.version !== FISCAL_EVIDENCE_CONTRACT_VERSION) errors.push("version");
  for (const key of ["fiscalDocumentId", "intentId", "tenantId", "saleId", "issuerRuc", "series", "provider", "signedXmlStorageRef", "cdrStorageRef", "sunatResponseCode", "sunatResponseDescription"] as const) {
    if (!isNonBlank(evidence[key])) errors.push(key);
  }
  if (!Number.isSafeInteger(evidence.number) || evidence.number < 1) errors.push("number");
  if (!isSha256(evidence.signedXmlSha256)) errors.push("signedXmlSha256");
  if (!isSha256(evidence.cdrSha256)) errors.push("cdrSha256");
  if (!Number.isFinite(Date.parse(evidence.issuedAt))) errors.push("issuedAt");
  return errors;
}
