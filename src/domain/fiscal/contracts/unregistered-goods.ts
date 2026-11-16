import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import { fiscalConfigurationCanonicalJson, projectFiscalTaxConfigurationDocument } from "./configuracion-fiscal";
import { projectFiscalCatalogPolicyDocument } from "./catalog-tax-policy.schema";
import { validateFiscalCivilDate } from "./reglas-tributarias";

/** A commercial line, never a fabricated catalogue presentation or a tax declaration. */
export interface FiscalV1UnregisteredGood {
  readonly description: string;
  readonly unitCode: "NIU" | "KGM" | "LTR";
}

/** Resolved only from the authenticated company's published default policy.
 * Callers read this authority themselves; a sale request cannot supply it. */
export interface FiscalV1UnregisteredGoodsPolicy {
  readonly tenantId: string;
  readonly issuerRuc: string;
  readonly companyDocumentId: string;
  readonly policyDocumentId: string;
  readonly decisionId: string;
  readonly ruleId: string;
  readonly publishedAt: number;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly legalCategory: "GRAVADA" | "EXONERADA" | "INAFECTA";
  readonly taxRateBasisPoints: number;
  readonly issuerPosture?: { readonly documentId: string; readonly decisionId: string; readonly ruleId: string };
  readonly fingerprintSha256: string;
}

function fail(code: string): never { throw new Error(code); }
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const fingerprint = (value: unknown) => bytesToHex(sha256(utf8ToBytes(fiscalConfigurationCanonicalJson(value))));

export function assertFiscalV1UnregisteredGood(value: unknown): asserts value is FiscalV1UnregisteredGood {
  const item = value as FiscalV1UnregisteredGood;
  if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).length !== 2 ||
      !text(item.description) || item.description !== item.description.trim() || item.description.length > 500 ||
      /[\x00-\x1f\x7f]/.test(item.description) || !["NIU", "KGM", "LTR"].includes(item.unitCode))
    fail("FISCAL_V1_UNREGISTERED_GOOD_INVALID");
}

export function fiscalV1UnregisteredGoodFromSnapshotItem(item: {
  origenProducto?: string; afectaInventario?: boolean; nombre: string; unidadComercial?: string;
}): FiscalV1UnregisteredGood | undefined {
  if (item.origenProducto === undefined) return undefined;
  if (item.origenProducto !== "NO_REGISTRADO" || item.afectaInventario !== false)
    fail("FISCAL_V1_UNREGISTERED_GOOD_INVALID");
  const units: Record<string, FiscalV1UnregisteredGood["unitCode"]> = {
    unidad: "NIU", unidades: "NIU", und: "NIU", niu: "NIU", kilogramo: "KGM", kg: "KGM", kgm: "KGM", litro: "LTR", l: "LTR", ltr: "LTR",
  };
  const result = { description: item.nombre.trim(), unitCode: units[item.unidadComercial?.trim().toLowerCase() ?? "unidad"] };
  assertFiscalV1UnregisteredGood(result);
  return result;
}

/** Verifies the immutable commercial origin as well as the description/unit. */
export function fiscalV1LineMatchesCommercialItem(line: { presentationId?: string; unregisteredGood?: FiscalV1UnregisteredGood },
  item: { presentacionId: string; origenProducto?: string; afectaInventario?: boolean; nombre: string; unidadComercial?: string }): boolean {
  if (line.unregisteredGood === undefined) return item.origenProducto === undefined && line.presentationId === item.presentacionId;
  const good = fiscalV1UnregisteredGoodFromSnapshotItem(item);
  return line.presentationId === undefined && good !== undefined &&
    good.description === line.unregisteredGood.description && good.unitCode === line.unregisteredGood.unitCode;
}

export function assertFiscalV1UnregisteredGoodsPolicy(value: FiscalV1UnregisteredGoodsPolicy,
  scope: { tenantId: string; issuerRuc: string; occurredOn: string }): void {
  if (!value || ![value.tenantId, value.companyDocumentId, value.policyDocumentId, value.decisionId, value.ruleId].every(text) ||
      value.tenantId !== scope.tenantId || value.issuerRuc !== scope.issuerRuc ||
      !Number.isSafeInteger(value.publishedAt) || value.publishedAt < 0 ||
      !Number.isSafeInteger(value.taxRateBasisPoints) ||
      (value.legalCategory === "GRAVADA" ? value.taxRateBasisPoints <= 0 || value.taxRateBasisPoints > 10000 :
        !["EXONERADA", "INAFECTA"].includes(value.legalCategory) || value.taxRateBasisPoints !== 0))
    fail("FISCAL_V1_UNREGISTERED_GOODS_POLICY_INVALID");
  const day = validateFiscalCivilDate(scope.occurredOn, "FISCAL_V1_OPERATION_DATE_INVALID");
  validateFiscalCivilDate(value.effectiveFrom, "FISCAL_V1_UNREGISTERED_GOODS_POLICY_INVALID");
  if (value.effectiveTo !== undefined) validateFiscalCivilDate(value.effectiveTo, "FISCAL_V1_UNREGISTERED_GOODS_POLICY_INVALID");
  if (day < value.effectiveFrom || value.effectiveTo !== undefined && day > value.effectiveTo)
    fail("FISCAL_V1_UNREGISTERED_GOODS_POLICY_NOT_EFFECTIVE");
  if (value.issuerPosture && ![value.issuerPosture.documentId, value.issuerPosture.decisionId, value.issuerPosture.ruleId].every(text))
    fail("FISCAL_V1_UNREGISTERED_GOODS_POLICY_INVALID");
  const { fingerprintSha256, ...material } = value;
  if (fingerprintSha256 !== fingerprint(material)) fail("FISCAL_V1_UNREGISTERED_GOODS_POLICY_INVALID");
}

/** No catalogue, name matching, ID parsing, percentage inference or unpublished draft. */
export function resolveFiscalV1UnregisteredGoodsPolicy(input: {
  tenantId: string; issuerRuc: string; companyDocumentId: string;
  policyDocumentId: string; occurredOn: string; policy: unknown; issuerProfile?: unknown; issuerProfileDocumentId?: string;
}): FiscalV1UnregisteredGoodsPolicy {
  const raw = input.policy as Record<string, unknown>;
  if (!raw || raw._deleted || Array.isArray(raw._conflicts) && raw._conflicts.length ||
      raw._conflicts != null && !Array.isArray(raw._conflicts)) fail("FISCAL_V1_UNREGISTERED_GOODS_POLICY_UNAVAILABLE");
  const root = projectFiscalCatalogPolicyDocument(raw);
  if (root.type !== "fiscal_catalog_default_policy" || root._id !== input.policyDocumentId ||
      root.companyDocumentId !== input.companyDocumentId || root.tenantId !== input.tenantId ||
      root.issuerRuc !== input.issuerRuc || root.status !== "ACTIVE" || !root.publishedDecisionId)
    fail("FISCAL_V1_UNREGISTERED_GOODS_POLICY_UNAVAILABLE");
  const day = validateFiscalCivilDate(input.occurredOn, "FISCAL_V1_OPERATION_DATE_INVALID");
  const decision = root.decisionHistory.find(row => row.decisionId === root.publishedDecisionId);
  const matches = decision?.rules.filter(rule => rule.offerType === "GOOD" && rule.effectiveFrom <= day &&
    (!rule.effectiveTo || rule.effectiveTo >= day)) ?? [];
  if (matches.length !== 1 || !decision) fail("FISCAL_V1_UNREGISTERED_GOODS_POLICY_NOT_EFFECTIVE");
  const rule = matches[0];
  let treatment = rule.treatment;
  let issuerPosture: FiscalV1UnregisteredGoodsPolicy["issuerPosture"];
  const ends = rule.effectiveTo ? [rule.effectiveTo] : [];
  const starts = [rule.effectiveFrom];
  if (treatment.category === "EXONERADA") {
    const profileRaw = input.issuerProfile as Record<string, unknown>;
    if (!profileRaw || profileRaw._deleted || Array.isArray(profileRaw._conflicts) && profileRaw._conflicts.length ||
        profileRaw._conflicts != null && !Array.isArray(profileRaw._conflicts))
      fail("FISCAL_V1_ISSUER_POSTURE_REQUIRED");
    const profile = projectFiscalTaxConfigurationDocument(profileRaw);
    if (profile.type !== "fiscal_issuer_tax_profile" || profile._id !== input.issuerProfileDocumentId || profile.tenantId !== input.tenantId ||
        profile.issuerRuc !== input.issuerRuc || profile.companyDocumentId !== input.companyDocumentId || profile.status !== "ACTIVE")
      fail("FISCAL_V1_ISSUER_POSTURE_REQUIRED");
    const published = profile.decisionHistory.find(row => row.decisionId === profile.publishedDecisionId);
    const postures = published?.rules.filter(row => row.effectiveFrom <= day && (!row.effectiveTo || row.effectiveTo >= day)) ?? [];
    if (!published || postures.length !== 1 || postures[0].posture === "UNDETERMINED") fail("FISCAL_V1_ISSUER_POSTURE_REQUIRED");
    const posture = postures[0];
    issuerPosture = { documentId: profile._id, decisionId: published.decisionId, ruleId: posture.postureId };
    starts.push(posture.effectiveFrom);
    if (posture.effectiveTo) ends.push(posture.effectiveTo);
    if (posture.posture === "RENOUNCED") treatment = { category: "GRAVADA", affectationCode: "10", rateBasisPoints: posture.resultingTaxRateBasisPoints };
  }
  const material = { tenantId: input.tenantId, issuerRuc: input.issuerRuc, companyDocumentId: input.companyDocumentId,
    policyDocumentId: root._id, decisionId: decision.decisionId, ruleId: rule.ruleId, publishedAt: decision.publishedAt,
    effectiveFrom: starts.sort().slice(-1)[0], ...(ends.length ? { effectiveTo: ends.sort()[0] } : {}),
    legalCategory: treatment.category, taxRateBasisPoints: treatment.rateBasisPoints,
    ...(issuerPosture ? { issuerPosture } : {}) };
  const result = { ...material, fingerprintSha256: fingerprint(material) };
  assertFiscalV1UnregisteredGoodsPolicy(result, input);
  return result;
}
