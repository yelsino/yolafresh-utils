import { FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE,
  type FiscalCatalogTaxConfigurationDocument } from "./catalogo-tributario.contract";
import { isFiscalTaxRegime } from "./cpe.contract";
import { validateFiscalCatalogPresentationTaxRule, validateFiscalIssuerExemptionPosture } from "./reglas-tributarias";

const record = (value: unknown): Record<string, any> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("FISCAL_TAX_CONFIGURATION_INVALID");
  return value as Record<string, any>;
};
const text = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const pick = (value: Record<string, any>, keys: readonly string[]): Record<string, any> =>
  Object.fromEntries(keys.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
const EFFECTIVE = ["effectiveFrom", "effectiveTo", "sourceReviewedAt", "evidenceReference", "configuredBy", "configuredAt"];
const RULE = [...EFFECTIVE, "presentationId", "catalogFingerprintSha256", "unitCode", "offerType",
  "tariffCode10", "physicalState", "compositionOrSpecies", "serviceDescription", "reviewQuestion",
  "category", "affectationCode", "taxRateBasisPoints", "exemptionEligibility"];
const POSTURE = [...EFFECTIVE, "posture", "resultingAffectationCode", "resultingTaxRateBasisPoints"];
const effective = (value: unknown, keys: readonly string[]) => {
  const row = record(value);
  return { ...pick(row, keys), legalSource: pick(record(row.legalSource), ["uri", "title", "provision"]) };
};

/** Positive projection of the SAME document. No archives, credentials, approval history or unknown fields. */
export function projectFiscalCatalogTaxConfiguration(value: unknown): FiscalCatalogTaxConfigurationDocument {
  const row = record(value);
  if (!text(row._id) || (row._rev !== undefined && !text(row._rev)) ||
      row.type !== FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE || row.schemaVersion !== 2 ||
      !text(row.tenantId) || !/^\d{11}$/.test(row.issuerRuc ?? "") || !text(row.issuerLegalName) ||
      !isFiscalTaxRegime(row.taxRegime) || !/^\d{4}$/.test(row.issuerFiscalAddressCode ?? "") ||
      !["DRAFT", "APPROVED", "SUSPENDED"].includes(row.approvalState) ||
      !Number.isSafeInteger(row.updatedAt) || row.updatedAt < 0 ||
      !Array.isArray(row.rules) || !Array.isArray(row.issuerExemptionPostures) ||
      (row._conflicts !== undefined && (!Array.isArray(row._conflicts) || row._conflicts.length)))
    throw new Error("FISCAL_TAX_CONFIGURATION_INVALID");
  const result = {
    ...pick(row, ["_id", "_rev", "type", "schemaVersion", "tenantId", "issuerRuc", "issuerLegalName",
      "taxRegime", "issuerFiscalAddressCode", "approvalState", "updatedAt"]),
    rules: row.rules.map((rule: unknown) => effective(rule, RULE)),
    issuerExemptionPostures: row.issuerExemptionPostures.map((posture: unknown) => effective(posture, POSTURE)),
  } as FiscalCatalogTaxConfigurationDocument;
  result.rules.forEach(validateFiscalCatalogPresentationTaxRule);
  result.issuerExemptionPostures.forEach(validateFiscalIssuerExemptionPosture);
  return result;
}

/** Exact, shared fingerprint material; the caller supplies the hash implementation. */
export function fiscalCatalogRevisionFingerprintMaterial(input: {
  tenantId: string; presentationId: string; presentationRevision: string;
  productBaseId: string; productBaseRevision: string;
}): string {
  if (Object.values(input).some(value => !text(value))) throw new Error("FISCAL_CATALOG_REVISION_REQUIRED");
  return JSON.stringify({ tenantId: input.tenantId, presentationId: input.presentationId,
    presentationRevision: input.presentationRevision, productBaseId: input.productBaseId,
    productBaseRevision: input.productBaseRevision });
}
