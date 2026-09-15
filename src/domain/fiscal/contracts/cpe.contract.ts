/** Contratos puros compartidos. El backend es la única autoridad de emisor, serie y emisión. */
import type { RegimenTributarioEmpresa } from "../../shared/kernel/empresa.contract";

export const FISCAL_CPE_CONTRACT_VERSION = 1 as const;

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
  readonly version: typeof FISCAL_CPE_CONTRACT_VERSION;
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

export type FiscalTaxCategory =
  | "GRAVADA"
  | "EXONERADA"
  | "INAFECTA"
  | "EXPORTACION"
  | "GRATUITA";

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

export interface FiscalSaleLineV1 {
  readonly lineId: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitCode: string;
  /** Precio comercial unitario PRE-IGV y antes del descuento de ítem. */
  readonly unitPriceCents: number;
  /** Descuento monetario del ítem sobre su base comercial, no descuento global. */
  readonly discountCents: number;
  /** Importe fiscal después de descuento de ítem y tributo de esa línea. */
  readonly totalCents: number;
  readonly tax: FiscalLineTaxV1;
}

/** Solo el importe realmente aplicado a la venta; no el efectivo entregado para vuelto. */
export interface FiscalPaidSaleV1 {
  readonly status: "PAID";
  readonly paidAmountCents: number;
  readonly paidAt: string;
}

/** Hecho canónico congelado por backend tras conciliar Venta y venta_snapshot. */
export interface FiscalSaleSnapshotV1 {
  readonly version: typeof FISCAL_CPE_CONTRACT_VERSION;
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
  readonly version: typeof FISCAL_CPE_CONTRACT_VERSION;
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

export function validateFiscalIntentV1(intent: FiscalIntentV1): readonly string[] {
  const errors: string[] = [];
  if (intent.version !== FISCAL_CPE_CONTRACT_VERSION) errors.push("version");
  for (const key of ["intentId", "idempotencyKey", "tenantId", "actorId", "saleId", "saleSnapshotId"] as const) {
    if (!isNonBlank(intent[key])) errors.push(key);
  }
  if (intent.requestedDocumentType === "FACTURA" && intent.buyer.documentType !== "RUC") {
    errors.push("buyer.documentTypeForFactura");
  }
  if (!isNonBlank(intent.buyer.legalName)) errors.push("buyer.legalName");
  if (intent.buyer.documentType === "SIN_DOCUMENTO") {
    if (intent.buyer.documentNumber !== null) errors.push("buyer.documentNumber");
  } else if (!intent.buyer.documentNumber?.trim()) {
    errors.push("buyer.documentNumber");
  }
  if (!Number.isFinite(Date.parse(intent.occurredAt))) errors.push("occurredAt");
  if (!Number.isFinite(Date.parse(intent.queuedAt))) errors.push("queuedAt");
  return errors;
}

export function validateFiscalSaleSnapshotV1(snapshot: FiscalSaleSnapshotV1): readonly string[] {
  const errors: string[] = [];
  if (snapshot.version !== FISCAL_CPE_CONTRACT_VERSION) errors.push("version");
  for (const key of ["fiscalSnapshotId", "intentId", "tenantId", "saleId", "saleSnapshotId", "issuerRuc", "issuerLegalName"] as const) {
    if (!isNonBlank(snapshot[key])) errors.push(key);
  }
  if (!/^\d{11}$/.test(snapshot.issuerRuc)) errors.push("issuerRuc.format");
  if (snapshot.taxRegime === "NRUS" && snapshot.documentType === "FACTURA") {
    errors.push("taxRegime.documentType");
  }
  if (!isNonNegativeCents(snapshot.totalCents)) errors.push("totalCents");
  if (!isNonNegativeCents(snapshot.payment.paidAmountCents)) errors.push("payment.paidAmountCents");
  if (snapshot.payment.paidAmountCents !== snapshot.totalCents) errors.push("payment.totalMismatch");
  if (!Number.isFinite(Date.parse(snapshot.payment.paidAt))) errors.push("payment.paidAt");
  if (!Number.isFinite(Date.parse(snapshot.frozenAt))) errors.push("frozenAt");
  if (snapshot.lines.length === 0) errors.push("lines");
  const lineIds = new Set<string>();
  for (const [index, line] of snapshot.lines.entries()) {
    const prefix = `lines[${index}]`;
    if (!isNonBlank(line.lineId) || lineIds.has(line.lineId)) errors.push(`${prefix}.lineId`);
    lineIds.add(line.lineId);
    if (!isNonBlank(line.description)) errors.push(`${prefix}.description`);
    if (!isNonBlank(line.unitCode)) errors.push(`${prefix}.unitCode`);
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) errors.push(`${prefix}.quantity`);
    for (const key of ["unitPriceCents", "discountCents", "totalCents"] as const) {
      if (!isNonNegativeCents(line[key])) errors.push(`${prefix}.${key}`);
    }
    if (!isNonBlank(line.tax.affectationCode)) errors.push(`${prefix}.tax.affectationCode`);
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
    } else if (line.tax.taxScheme !== "NONE" || line.tax.taxRateBasisPoints !== 0 || line.tax.taxAmountCents !== 0) {
      errors.push(`${prefix}.tax.nonTaxableAmounts`);
    }
  }
  if (snapshot.lines.every((line) => isNonNegativeCents(line.totalCents)) &&
      snapshot.lines.reduce((sum, line) => sum + line.totalCents, 0) !== snapshot.totalCents) {
    errors.push("totalCents.linesMismatch");
  }
  return errors;
}

export function validateFiscalIntentSnapshotLinkV1(
  intent: FiscalIntentV1,
  snapshot: FiscalSaleSnapshotV1,
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
  if (evidence.version !== FISCAL_CPE_CONTRACT_VERSION) errors.push("version");
  for (const key of ["fiscalDocumentId", "intentId", "tenantId", "saleId", "issuerRuc", "series", "provider", "signedXmlStorageRef", "cdrStorageRef", "sunatResponseCode", "sunatResponseDescription"] as const) {
    if (!isNonBlank(evidence[key])) errors.push(key);
  }
  if (!Number.isSafeInteger(evidence.number) || evidence.number < 1) errors.push("number");
  if (!isSha256(evidence.signedXmlSha256)) errors.push("signedXmlSha256");
  if (!isSha256(evidence.cdrSha256)) errors.push("cdrSha256");
  if (!Number.isFinite(Date.parse(evidence.issuedAt))) errors.push("issuedAt");
  return errors;
}
