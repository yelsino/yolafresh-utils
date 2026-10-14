import { validateFiscalSaleSnapshot } from "./cpe.contract";
import { fiscalConfigurationCanonicalJson, validateFiscalTaxResolutionSource } from "./configuracion-fiscal";
import type { FiscalTaxResolutionSource } from "./configuracion-fiscal.contract";
import type { FiscalBuyer, FiscalCurrency, FiscalDocumentIdentity, FiscalLineTax,
  FiscalSaleSnapshot } from "./cpe.contract";

/** Documento de CouchDB: el _id técnico es opaco y no sustituye documentId. */
export const FISCAL_DOCUMENT_TYPE = "comprobante_electronico" as const;

export interface FiscalArtifactReference {
  /** Referencia opaca al servicio de archivos; no es una URL pública obligatoria. */
  readonly storageRef: string;
  readonly sha256: string;
}

export type FiscalDocumentOrigin =
  | { readonly kind: "VENTA"; readonly saleId: string; readonly saleSnapshotId: string;
      readonly intentId: string; readonly fiscalSnapshotId: string }
  | { readonly kind: "CORRECCION"; readonly originalDocumentId: string;
      readonly originalIdentity: FiscalDocumentIdentity; readonly reasonCode: string;
      readonly reason: string };

/** Proyección de impresión conciliada con snapshot y XML; cantidad decimal exacta. */
export interface FiscalDocumentLine {
  readonly taxSource?: FiscalTaxResolutionSource;
  readonly lineId: string;
  readonly description: string;
  readonly quantity: string;
  readonly unitCode: string;
  readonly unitPriceCents: number;
  readonly grossCents: number;
  /** Exact cumulative proration residue, only on corrections; maximum one cent. */
  readonly roundingAdjustmentCents?: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly tax: FiscalLineTax;
}

export interface FiscalDocumentTotals {
  readonly taxableBaseCents: number;
  readonly exemptCents: number;
  readonly unaffectedCents: number;
  readonly taxCents: number;
  readonly payableCents: number;
}

/** Hecho firmado, numerado e inmutable. No afirma envío ni aceptación. */
export interface FiscalSignedDocument {
  readonly type: typeof FISCAL_DOCUMENT_TYPE;
  readonly documentId: string;
  readonly tenantId: string;
  /** El impresor debe distinguir inequívocamente una prueba de una emisión real. */
  readonly environment: "DEMO" | "PRODUCCION";
  readonly identity: FiscalDocumentIdentity;
  readonly origin: FiscalDocumentOrigin;
  readonly issuer: {
    readonly legalName: string;
    /** Domicilio fiscal textual congelado desde el perfil validado. */
    readonly fiscalAddress: string;
    /** Código de establecimiento del XML; no sustituye fiscalAddress. */
    readonly establishmentCode: string;
  };
  readonly buyer: FiscalBuyer;
  readonly currency: FiscalCurrency;
  /** Fecha fiscal tomada del XML firmado, independiente de la zona del reloj. */
  readonly issueDate: string;
  readonly issuedAt: string;
  /** Instante de verificación de la firma por el emisor, no campo del XML. */
  readonly signedAt: string;
  /** Snapshot suficiente para reproducir el papel sin red ni catálogo actual. */
  readonly lines: readonly FiscalDocumentLine[];
  readonly totals: FiscalDocumentTotals;
  readonly signature: {
    /** Referencia y SHA-256 de los bytes del XML firmado crudo. */
    readonly signedXml: FiscalArtifactReference;
    /** ds:DigestValue en base64 canónico: Demo admite SHA-1 o SHA-256; producción exige SHA-256. */
    readonly digestValue: string;
  };
  readonly print: {
    /** Contenido del QR del XML firmado, no un enlace que exija conexión. */
    readonly qrPayload: string;
    /** SUNAT permite imprimir el valor resumen fuera del QR. */
    readonly digestOutsideQr: boolean;
    readonly legalLegend: string;
  };
}

const nonBlank = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const cents = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const hash = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f\d]{64}$/i.test(value);
/** Base64 canónico de 20 o 32 bytes; la tolerancia SHA-1 es exclusiva de Demo. */
const sha1Digest = /^(?:[A-Za-z0-9+/]{4}){6}[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=$/;
const sha256Digest = /^(?:[A-Za-z0-9+/]{4}){10}[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=$/;
const digest = (value: unknown, environment: unknown): value is string =>
  typeof value === "string" &&
  (sha256Digest.test(value) || (environment === "DEMO" && sha1Digest.test(value)));
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const timestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  Number.isFinite(Date.parse(value));
const issueDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

function rejectUnknown(value: Record<string, unknown>, fields: readonly string[],
  prefix: string, errors: string[]): void {
  for (const key of Object.keys(value))
    if (!fields.includes(key)) errors.push(`${prefix}unknown.${key}`);
}

function qrMoneyCents(value: string): bigint | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

function validateQr(document: Record<string, unknown>, errors: string[]): void {
  if (!record(document.identity) || !record(document.buyer) ||
    !record(document.totals) || !record(document.signature) || !record(document.print) ||
    !nonBlank(document.print.qrPayload)) return;
  const parts = document.print.qrPayload.split("|").map((part: string) => part.trim());
  if (parts.length === 11 && parts[10] === "") parts.pop();
  if (parts.length !== 9 && parts.length !== 10) { errors.push("print.qrPayload.fields"); return; }
  const identity = document.identity;
  const buyer = document.buyer;
  const totals = document.totals;
  const signature = document.signature;
  if (!cents(totals.taxCents) || !cents(totals.payableCents)) return;
  const codes: Record<string, string> = { BOLETA: "03", FACTURA: "01",
    NOTA_CREDITO: "07", NOTA_DEBITO: "08" };
  if (parts[0] !== identity.issuerRuc || parts[1] !== codes[String(identity.documentType)] ||
    parts[2] !== identity.series || !/^\d+$/.test(parts[3]) ||
    !Number.isSafeInteger(Number(parts[3])) || Number(parts[3]) !== identity.number)
    errors.push("print.qrPayload.identityMismatch");
  if (qrMoneyCents(parts[4]) !== BigInt(totals.taxCents) ||
    qrMoneyCents(parts[5]) !== BigInt(totals.payableCents))
    errors.push("print.qrPayload.amountMismatch");
  const qrDate = /^\d{2}\/\d{2}\/\d{4}$/.test(parts[6]) ?
    `${parts[6].slice(6)}-${parts[6].slice(3, 5)}-${parts[6].slice(0, 2)}` : parts[6];
  if (qrDate !== document.issueDate) errors.push("print.qrPayload.issueDateMismatch");
  const buyerCodes: Record<string, string> = { DNI: "1", RUC: "6", CE: "4", PASAPORTE: "7" };
  if (buyer.documentType === "SIN_DOCUMENTO") {
    if (parts[7] !== "" && parts[7] !== "0" && parts[7] !== "-")
      errors.push("print.qrPayload.buyerMismatch");
    if (parts[8] !== "" && parts[8] !== "-") errors.push("print.qrPayload.buyerMismatch");
  } else if (parts[7] !== buyerCodes[String(buyer.documentType)] ||
      parts[8] !== buyer.documentNumber) errors.push("print.qrPayload.buyerMismatch");
  if (parts.length === 10) {
    if (parts[9] !== signature.digestValue || document.print.digestOutsideQr !== false)
      errors.push("print.qrPayload.digestMismatch");
  } else if (document.print.digestOutsideQr !== true)
    errors.push("print.digestOutsideQr");
}

function expectedGrossCents(unitPriceCents: number, quantity: string): bigint | null {
  if (!cents(unitPriceCents) ||
    !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,10})?$/.test(quantity)) return null;
  const [whole, fraction = ""] = quantity.split(".");
  const denominator = BigInt(10) ** BigInt(fraction.length);
  const numerator = BigInt(whole + fraction);
  return (BigInt(unitPriceCents) * numerator * BigInt(2) + denominator) /
    (denominator * BigInt(2));
}

function validateIdentity(value: unknown, prefix: string, errors: string[]): void {
  if (!record(value)) { errors.push(prefix.slice(0, -1)); return; }
  rejectUnknown(value, ["issuerRuc", "documentType", "series", "number"], prefix, errors);
  if (typeof value.issuerRuc !== "string" || !/^\d{11}$/.test(value.issuerRuc))
    errors.push(`${prefix}issuerRuc`);
  if (!["BOLETA", "FACTURA", "NOTA_CREDITO", "NOTA_DEBITO"].includes(String(value.documentType)))
    errors.push(`${prefix}documentType`);
  if (!nonBlank(value.series)) errors.push(`${prefix}series`);
  if (!Number.isSafeInteger(value.number) || Number(value.number) < 1)
    errors.push(`${prefix}number`);
}

/** Valida la forma y la aritmética; verificar la firma del XML es responsabilidad del emisor. */
export function validateFiscalSignedDocument(value: unknown): readonly string[] {
  if (!record(value)) return ["document"];
  const errors: string[] = [];
  rejectUnknown(value, ["_id", "_rev", "type", "documentId", "tenantId", "environment", "identity",
    "origin", "issuer", "buyer", "currency", "issueDate", "issuedAt", "signedAt",
    "lines", "totals", "signature", "print"], "", errors);
  if (value.type !== FISCAL_DOCUMENT_TYPE) errors.push("type");
  for (const key of ["documentId", "tenantId"] as const)
    if (!nonBlank(value[key])) errors.push(key);
  if (value.environment !== "DEMO" && value.environment !== "PRODUCCION")
    errors.push("environment");
  validateIdentity(value.identity, "identity.", errors);
  if (!record(value.origin)) errors.push("origin");
  else if (value.origin.kind === "VENTA") {
    rejectUnknown(value.origin, ["kind", "saleId", "saleSnapshotId", "intentId",
      "fiscalSnapshotId"], "origin.", errors);
    for (const key of ["saleId", "saleSnapshotId", "intentId", "fiscalSnapshotId"] as const)
      if (!nonBlank(value.origin[key])) errors.push(`origin.${key}`);
    if (record(value.identity) && !["BOLETA", "FACTURA"].includes(String(value.identity.documentType)))
      errors.push("origin.documentType");
  } else if (value.origin.kind === "CORRECCION") {
    rejectUnknown(value.origin, ["kind", "originalDocumentId", "originalIdentity",
      "reasonCode", "reason"], "origin.", errors);
    if (record(value.identity) && !["NOTA_CREDITO", "NOTA_DEBITO"].includes(String(value.identity.documentType)))
      errors.push("origin.documentType");
    for (const key of ["originalDocumentId", "reasonCode", "reason"] as const)
      if (!nonBlank(value.origin[key])) errors.push(`origin.${key}`);
    if (value.origin.originalDocumentId === value.documentId)
      errors.push("origin.originalDocumentId.selfReference");
    validateIdentity(value.origin.originalIdentity, "origin.originalIdentity.", errors);
    if (record(value.origin.originalIdentity) && record(value.identity) &&
      value.origin.originalIdentity.issuerRuc !== value.identity.issuerRuc)
      errors.push("origin.originalIdentity.issuerRucMismatch");
  } else errors.push("origin.kind");
  if (!record(value.issuer)) errors.push("issuer");
  else {
    rejectUnknown(value.issuer, ["legalName", "fiscalAddress", "establishmentCode"],
      "issuer.", errors);
    for (const key of ["legalName", "fiscalAddress", "establishmentCode"] as const)
      if (!nonBlank(value.issuer[key])) errors.push(`issuer.${key}`);
  }
  if (!record(value.buyer)) errors.push("buyer");
  else {
    rejectUnknown(value.buyer, ["documentType", "documentNumber", "legalName"], "buyer.", errors);
    if (!["DNI", "RUC", "CE", "PASAPORTE", "SIN_DOCUMENTO"].includes(String(value.buyer.documentType)))
      errors.push("buyer.documentType");
    if (!nonBlank(value.buyer.legalName)) errors.push("buyer.legalName");
    if (value.buyer.documentType === "SIN_DOCUMENTO" ? value.buyer.documentNumber !== null :
      !nonBlank(value.buyer.documentNumber)) errors.push("buyer.documentNumber");
    if (record(value.identity) && value.identity.documentType === "FACTURA" &&
      value.buyer.documentType !== "RUC") errors.push("buyer.documentTypeForFactura");
  }
  if (value.currency !== "PEN") errors.push("currency");
  if (!issueDate(value.issueDate)) errors.push("issueDate");
  for (const key of ["issuedAt", "signedAt"] as const)
    if (!timestamp(value[key])) errors.push(key);
  if (timestamp(value.issuedAt) && timestamp(value.signedAt) &&
    Date.parse(value.signedAt) < Date.parse(value.issuedAt)) errors.push("signedAt.beforeIssuedAt");
  if (!Array.isArray(value.lines) || value.lines.length === 0) errors.push("lines");
  const sums = { taxableBaseCents: 0n, exemptCents: 0n, unaffectedCents: 0n,
    taxCents: 0n, payableCents: 0n };
  if (Array.isArray(value.lines)) {
    const seen = new Set<string>();
    value.lines.forEach((line: unknown, index: number) => {
      const prefix = `lines[${index}]`;
      if (!record(line) || !record(line.tax)) { errors.push(prefix); return; }
      rejectUnknown(line, ["lineId", "description", "quantity", "unitCode", "unitPriceCents",
        "grossCents", "roundingAdjustmentCents", "discountCents", "totalCents", "tax", "taxSource"], `${prefix}.`, errors);
      if (line.taxSource !== undefined && !validateFiscalTaxResolutionSource(line.taxSource)) errors.push(`${prefix}.taxSource`);
      rejectUnknown(line.tax, ["category", "affectationCode", "taxScheme",
        "taxRateBasisPoints", "taxableBaseCents", "taxAmountCents"], `${prefix}.tax.`, errors);
      if (!nonBlank(line.lineId) || seen.has(line.lineId)) errors.push(`${prefix}.lineId`);
      else seen.add(line.lineId);
      if (!nonBlank(line.description)) errors.push(`${prefix}.description`);
      if (typeof line.quantity !== "string" ||
        !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,10})?$/.test(line.quantity) || Number(line.quantity) <= 0)
        errors.push(`${prefix}.quantity`);
      if (!nonBlank(line.unitCode)) errors.push(`${prefix}.unitCode`);
      if (!cents(line.unitPriceCents) || !cents(line.grossCents) ||
        !cents(line.discountCents) || !cents(line.totalCents))
        errors.push(`${prefix}.amounts`);
      if (cents(line.grossCents) && cents(line.discountCents) && cents(line.totalCents) &&
        line.grossCents - line.discountCents !== line.totalCents)
        errors.push(`${prefix}.grossDiscountMismatch`);
      const expectedGross = expectedGrossCents(line.unitPriceCents as number, String(line.quantity));
      const residue = line.roundingAdjustmentCents ?? 0;
      if (!Number.isInteger(residue) || Math.abs(Number(residue)) > 1 ||
          (line.roundingAdjustmentCents !== undefined && (!record(value.origin) || value.origin.kind !== "CORRECCION")))
        errors.push(`${prefix}.roundingAdjustmentCents`);
      if (expectedGross !== null && cents(line.grossCents) &&
        expectedGross + BigInt(Number.isInteger(residue) ? Number(residue) : 0) !== BigInt(line.grossCents)) errors.push(`${prefix}.unitPriceQuantityMismatch`);
      if (!cents(line.tax.taxableBaseCents) || !cents(line.tax.taxAmountCents))
        errors.push(`${prefix}.tax.amounts`);
      if (cents(line.totalCents) && cents(line.tax.taxableBaseCents) &&
        cents(line.tax.taxAmountCents) &&
        line.totalCents !== line.tax.taxableBaseCents + line.tax.taxAmountCents)
        errors.push(`${prefix}.tax.totalMismatch`);
      if (line.tax.category === "GRAVADA") {
        if (line.tax.taxScheme !== "IGV" || line.tax.affectationCode !== "10" ||
          !cents(line.tax.taxRateBasisPoints)) errors.push(`${prefix}.tax.gravada`);
      } else if (line.tax.category === "EXONERADA" || line.tax.category === "INAFECTA") {
        if (line.tax.taxScheme !== "NONE" || line.tax.taxRateBasisPoints !== 0 ||
          line.tax.taxAmountCents !== 0 ||
          line.tax.affectationCode !== (line.tax.category === "EXONERADA" ? "20" : "30"))
          errors.push(`${prefix}.tax.nonTaxable`);
      } else errors.push(`${prefix}.tax.category`);
      if (cents(line.totalCents)) sums.payableCents += BigInt(line.totalCents);
      if (cents(line.tax.taxAmountCents)) sums.taxCents += BigInt(line.tax.taxAmountCents);
      if (cents(line.tax.taxableBaseCents)) {
        const key = line.tax.category === "GRAVADA" ? "taxableBaseCents" :
          line.tax.category === "EXONERADA" ? "exemptCents" :
          line.tax.category === "INAFECTA" ? "unaffectedCents" : null;
        if (key) sums[key] += BigInt(line.tax.taxableBaseCents);
      }
    });
  }
  if (!record(value.totals)) errors.push("totals");
  else {
    rejectUnknown(value.totals, Object.keys(sums), "totals.", errors);
    for (const key of Object.keys(sums) as (keyof typeof sums)[]) {
      if (!cents(value.totals[key])) errors.push(`totals.${key}`);
      else if (BigInt(value.totals[key] as number) !== sums[key]) errors.push(`totals.${key}.linesMismatch`);
    }
  }
  if (!record(value.signature) || !record(value.signature.signedXml)) errors.push("signature");
  else {
    rejectUnknown(value.signature, ["signedXml", "digestValue"], "signature.", errors);
    rejectUnknown(value.signature.signedXml, ["storageRef", "sha256"],
      "signature.signedXml.", errors);
    if (!nonBlank(value.signature.signedXml.storageRef)) errors.push("signature.signedXml.storageRef");
    if (!hash(value.signature.signedXml.sha256)) errors.push("signature.signedXml.sha256");
    if (!digest(value.signature.digestValue, value.environment)) errors.push("signature.digestValue");
  }
  if (!record(value.print)) errors.push("print");
  else {
    rejectUnknown(value.print, ["qrPayload", "digestOutsideQr", "legalLegend"], "print.", errors);
    if (!nonBlank(value.print.qrPayload)) errors.push("print.qrPayload");
    if (typeof value.print.digestOutsideQr !== "boolean") errors.push("print.digestOutsideQr");
    if (!nonBlank(value.print.legalLegend)) errors.push("print.legalLegend");
    else if (value.environment === "DEMO" &&
      !/DEMO.*SIN VALIDEZ TRIBUTARIA|SIN VALIDEZ TRIBUTARIA.*DEMO/i.test(value.print.legalLegend))
      errors.push("print.legalLegend.demoWarning");
    else if (value.environment === "PRODUCCION" &&
      /DEMO|SIN VALIDEZ TRIBUTARIA/i.test(value.print.legalLegend))
      errors.push("print.legalLegend.productionMismatch");
  }
  validateQr(value, errors);
  return errors;
}

/** Comprueba el contenido local; la firma criptográfica se verifica al crearlo. */
export function isFiscalSignedDocumentPrintable(value: unknown): value is FiscalSignedDocument {
  return validateFiscalSignedDocument(value).length === 0;
}

/** Un comprobante de venta debe corresponder al vendedor y a cada línea congelada. */
export function validateFiscalSignedDocumentSnapshotLink(
  document: FiscalSignedDocument,
  snapshot: FiscalSaleSnapshot,
): readonly string[] {
  const errors = [...validateFiscalSignedDocument(document),
    ...validateFiscalSaleSnapshot(snapshot).map((error) => `snapshot.${error}`)];
  if (errors.length) return errors;
  if (document.origin.kind !== "VENTA") return ["origin.kind"];
  if (document.tenantId !== snapshot.tenantId) errors.push("tenantId");
  for (const key of ["intentId", "saleId", "saleSnapshotId"] as const)
    if (document.origin[key] !== snapshot[key]) errors.push(`origin.${key}`);
  if (document.origin.fiscalSnapshotId !== snapshot.fiscalSnapshotId)
    errors.push("origin.fiscalSnapshotId");
  if (document.identity.issuerRuc !== snapshot.issuerRuc) errors.push("identity.issuerRuc");
  if (document.identity.documentType !== snapshot.documentType) errors.push("identity.documentType");
  if (document.issuer.legalName !== snapshot.issuerLegalName) errors.push("issuer.legalName");
  if (document.buyer.documentType !== snapshot.buyer.documentType ||
      document.buyer.documentNumber !== snapshot.buyer.documentNumber ||
      document.buyer.legalName !== snapshot.buyer.legalName) errors.push("buyer");
  if (document.currency !== snapshot.currency) errors.push("currency");
  if (document.totals.payableCents !== snapshot.totalCents) errors.push("totals.payableCents");
  if (Date.parse(document.issuedAt) < Date.parse(snapshot.frozenAt)) errors.push("issuedAt.beforeFrozenAt");
  const frozenLines = new Map(snapshot.lines.map((line) => [line.lineId, line]));
  if (document.lines.length !== frozenLines.size) errors.push("lines.length");
  for (const line of document.lines) {
    const frozen = frozenLines.get(line.lineId);
    if (!frozen || line.description !== frozen.description ||
        Number(line.quantity) !== frozen.quantity || line.unitCode !== frozen.unitCode ||
        line.unitPriceCents !== frozen.unitPriceCents ||
        line.grossCents !== frozen.commercialGrossBeforeDiscountCents ||
        line.discountCents !== frozen.discountCents || line.totalCents !== frozen.totalCents ||
        line.tax.category !== frozen.tax.category ||
        line.tax.affectationCode !== frozen.tax.affectationCode ||
        line.tax.taxScheme !== frozen.tax.taxScheme ||
        line.tax.taxRateBasisPoints !== frozen.tax.taxRateBasisPoints ||
        line.tax.taxableBaseCents !== frozen.tax.taxableBaseCents ||
        line.tax.taxAmountCents !== frozen.tax.taxAmountCents ||
        fiscalConfigurationCanonicalJson(line.taxSource ?? null) !== fiscalConfigurationCanonicalJson(frozen.taxSource ?? null)) errors.push(`lines.${line.lineId}`);
  }
  return errors;
}
