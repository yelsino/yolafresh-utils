import type { FiscalV1DocumentGrant, FiscalV1PrintEvidence,
  FiscalV1PrintEvidenceBinding, FiscalV1TributaryResult, FiscalV1TributaryStatus } from
  "./modulo-fiscal-v1-resultados.contract";
import { validateFiscalCivilDate } from "./reglas-tributarias";

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max = 4000): value is string => typeof value === "string" &&
  value.trim().length > 0 && value.length <= max && !/[\x00-\x1f\x7f]/.test(value);
const cdrText = (value: unknown): value is string => typeof value === "string" &&
  value.trim().length > 0 && value.length <= 4000 && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
const cents = (value: unknown): value is number => typeof value === "number" &&
  Number.isSafeInteger(value) && value >= 0;
const hash = (value: unknown): value is string => typeof value === "string" && /^[a-f\d]{64}$/.test(value);
const date = (value: unknown): value is string => {
  try { return typeof value === "string" && validateFiscalCivilDate(value, "DATE_INVALID") === value; }
  catch { return false; }
};
const sha1Digest = /^(?:[A-Za-z0-9+/]{4}){6}[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=$/;
const sha256Digest = /^(?:[A-Za-z0-9+/]{4}){10}[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=$/;
const has = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);

/** This validates metadata, not CDR authenticity. Require details on new writes;
 * historical reads remain valid without inventing a response code or empty observations. */
export function validateFiscalV1TributaryResult(value: unknown,
  options: { readonly requireDetails?: boolean } = {}): readonly string[] {
  if (!record(value)) return ["tributaryResult"];
  const errors: string[] = [];
  if (!text(value.storageRef, 1024)) errors.push("storageRef");
  if (!hash(value.sha256)) errors.push("sha256");
  if (!cents(value.receivedAtMs)) errors.push("receivedAtMs");
  if (value.outcome !== "ACCEPTED" && value.outcome !== "REJECTED") errors.push("outcome");
  const detailKeys = ["responseCode", "description", "observations"];
  if (options.requireDetails || detailKeys.some(key => has(value, key))) {
    if (!detailKeys.every(key => has(value, key))) errors.push("details.required");
    if (typeof value.responseCode !== "string" || !/^(?:0|[1-9]\d{0,5})$/.test(value.responseCode))
      errors.push("responseCode");
    if (!cdrText(value.description)) errors.push("description");
    if (!Array.isArray(value.observations) || value.observations.some(item => !cdrText(item)))
      errors.push("observations");
    if (value.outcome === "ACCEPTED" && value.responseCode !== "0" ||
        value.outcome === "REJECTED" && value.responseCode === "0") errors.push("outcome.responseCodeMismatch");
  }
  return errors;
}

export function assertFiscalV1TributaryResult(value: unknown,
  options: { readonly requireDetails?: boolean } = {}): asserts value is FiscalV1TributaryResult {
  if (validateFiscalV1TributaryResult(value, options).length)
    throw new Error("FISCAL_V1_TRIBUTARY_RESULT_INVALID");
}

/** Null means no verified CDR has been recorded, never implicit acceptance. */
export function fiscalV1TributaryStatus(result: FiscalV1TributaryResult | null | undefined):
  FiscalV1TributaryStatus | null {
  if (result == null) return null;
  assertFiscalV1TributaryResult(result);
  if (result.outcome === "REJECTED") return "REJECTED";
  return result.observations?.length ? "ACCEPTED_WITH_OBSERVATIONS" : "ACCEPTED";
}

export function assertFiscalV1DocumentGrant(value: unknown,
  expectedRecipientId?: string): asserts value is FiscalV1DocumentGrant {
  if (!record(value) || !text(value.recipientId, 128) || !text(value.evidenceRef, 1024) ||
      !text(value.recordedBy, 256) || !cents(value.grantedAtMs) ||
      expectedRecipientId !== undefined && value.recipientId !== expectedRecipientId)
    throw new Error("FISCAL_V1_DOCUMENT_GRANT_INVALID");
}

function money(value: string): bigint | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

/** Validates the printable projection against already verified frozen facts.
 * It never verifies XML signatures and must not be used as an emission authority. */
export function validateFiscalV1PrintEvidence(value: unknown,
  binding: FiscalV1PrintEvidenceBinding): readonly string[] {
  if (!record(value)) return ["print"];
  const errors: string[] = [];
  const identity = binding?.identity;
  if (!binding || !["DEMO", "PRODUCTION"].includes(binding.environment) || !identity ||
      !/^\d{11}$/.test(identity.issuerRuc) || !["01", "03", "07"].includes(identity.documentType) ||
      !/^[FB][A-Z0-9]{3}$/.test(identity.series) ||
      identity.documentType === "01" && !identity.series.startsWith("F") ||
      identity.documentType === "03" && !identity.series.startsWith("B") ||
      !Number.isSafeInteger(identity.number) || identity.number < 1 || identity.number > 99999999 ||
      !date(binding.issuedOn) || binding.currency !== "PEN" ||
      !cents(binding.totalCents) || !cents(binding.taxCents) ||
      binding.taxCents > binding.totalCents || !hash(binding.signedXmlSha256) ||
      !binding.buyer || !(binding.buyer.documentType === "RUC"
        ? /^\d{11}$/.test(binding.buyer.documentNumber)
        : binding.buyer.documentType === "DNI" && /^\d{8}$/.test(binding.buyer.documentNumber)) ||
      identity.documentType === "01" && binding.buyer.documentType !== "RUC") return ["print.binding"];
  if (!hash(value.signedXmlSha256) || value.signedXmlSha256 !== binding.signedXmlSha256)
    errors.push("print.signedXmlSha256");
  if (typeof value.digestValue !== "string" ||
      !(sha256Digest.test(value.digestValue) || binding.environment === "DEMO" && sha1Digest.test(value.digestValue)))
    errors.push("print.digestValue");
  if (typeof value.signedAt !== "string" || !date(value.signedAt.slice(0, 10)) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value.signedAt) ||
      !Number.isFinite(Date.parse(value.signedAt))) errors.push("print.signedAt");
  if (!text(value.legalLegend, 1000)) errors.push("print.legalLegend");
  else if (binding.environment === "DEMO" &&
      !/DEMO.*SIN VALIDEZ TRIBUTARIA|SIN VALIDEZ TRIBUTARIA.*DEMO/i.test(value.legalLegend))
    errors.push("print.legalLegend.demoWarning");
  else if (binding.environment === "PRODUCTION" && /DEMO|SIN VALIDEZ TRIBUTARIA/i.test(value.legalLegend))
    errors.push("print.legalLegend.productionMismatch");
  if (typeof value.digestOutsideQr !== "boolean") errors.push("print.digestOutsideQr");
  if (!text(value.qrPayload, 4000)) return [...errors, "print.qrPayload"];
  const parts = value.qrPayload.split("|").map(part => part.trim());
  // A trailing separator is allowed; it does not create an extra QR field.
  if (parts.length === 11 && parts[10] === "") parts.pop();
  if (parts.length !== 9 && parts.length !== 10) return [...errors, "print.qrPayload.fields"];
  if (parts[0] !== identity.issuerRuc || parts[1] !== identity.documentType ||
      parts[2] !== identity.series || !/^\d{1,8}$/.test(parts[3]) || Number(parts[3]) !== identity.number)
    errors.push("print.qrPayload.identityMismatch");
  if (money(parts[4]) !== BigInt(binding.taxCents) || money(parts[5]) !== BigInt(binding.totalCents))
    errors.push("print.qrPayload.amountMismatch");
  const qrDate = /^\d{2}\/\d{2}\/\d{4}$/.test(parts[6])
    ? `${parts[6].slice(6)}-${parts[6].slice(3, 5)}-${parts[6].slice(0, 2)}` : parts[6];
  if (qrDate !== binding.issuedOn) errors.push("print.qrPayload.issueDateMismatch");
  if (parts[7] !== (binding.buyer.documentType === "RUC" ? "6" : "1") ||
      parts[8] !== binding.buyer.documentNumber) errors.push("print.qrPayload.buyerMismatch");
  if (parts.length === 10) {
    if (parts[9] !== value.digestValue || value.digestOutsideQr !== false)
      errors.push("print.qrPayload.digestMismatch");
  } else if (value.digestOutsideQr !== true) errors.push("print.digestOutsideQr");
  return errors;
}

export function assertFiscalV1PrintEvidence(value: unknown,
  binding: FiscalV1PrintEvidenceBinding): asserts value is FiscalV1PrintEvidence {
  if (validateFiscalV1PrintEvidence(value, binding).length)
    throw new Error("FISCAL_V1_PRINT_EVIDENCE_INVALID");
}

