import type { FiscalCatalogTaxConfiguration, FiscalCatalogPresentationTaxRule,
  FiscalEffectiveRecord, FiscalIssuerExemptionPosture, FiscalIssuerExemptionPostureRecord } from "./catalogo-tributario.contract";

/** Supported UBL units; no I/O, runtime or persistence dependency. */
export function isFiscalSupportedUnitCode(value: unknown): value is string {
  return typeof value === "string" && ["NIU", "ZZ", "KGM", "LTR"].includes(value);
}

const OFFICIAL_SOURCE_HOSTS = new Set([
  "sunat.gob.pe",
  "www.sunat.gob.pe",
  "cpe.sunat.gob.pe",
  "emprender.sunat.gob.pe",
  "orientacion.sunat.gob.pe",
  "mef.gob.pe",
  "www.mef.gob.pe",
  "busquedas.elperuano.pe",
]);

function requiredText(value: unknown, code: string, max = 500): string {
  if (typeof value !== "string" || !value.trim() || value !== value.trim() ||
    value.length > max) throw new Error(code);
  return value;
}

export function validateFiscalCivilDate(value: unknown, code: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(code);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(code);
  }
  return value;
}

function validateEffectiveRecord(record: FiscalEffectiveRecord): void {
  const from = validateFiscalCivilDate(record.effectiveFrom,
    "fiscal_catalog_effective_from_invalid");
  if (record.effectiveTo !== undefined) {
    const to = validateFiscalCivilDate(record.effectiveTo,
      "fiscal_catalog_effective_to_invalid");
    if (to < from) throw new Error("fiscal_catalog_effective_range_invalid");
  }
  validateFiscalCivilDate(record.sourceReviewedAt,
    "fiscal_catalog_source_review_date_invalid");
  requiredText(record.evidenceReference, "fiscal_catalog_evidence_required", 1000);
  requiredText(record.configuredBy, "fiscal_catalog_actor_required", 240);
  if (!Number.isSafeInteger(record.configuredAt) || record.configuredAt < 0) {
    throw new Error("fiscal_catalog_configured_at_invalid");
  }
  if (!record.legalSource || typeof record.legalSource !== "object") {
    throw new Error("fiscal_catalog_legal_source_required");
  }
  requiredText(record.legalSource.title, "fiscal_catalog_legal_source_title_required", 500);
  requiredText(record.legalSource.provision,
    "fiscal_catalog_legal_source_provision_required", 500);
  let uri: URL;
  try {
    uri = new URL(requiredText(record.legalSource.uri,
      "fiscal_catalog_legal_source_uri_invalid", 1000));
  } catch {
    throw new Error("fiscal_catalog_legal_source_uri_invalid");
  }
  if (uri.protocol !== "https:" || !OFFICIAL_SOURCE_HOSTS.has(uri.hostname.toLowerCase())) {
    throw new Error("fiscal_catalog_legal_source_not_official");
  }
}

export function validateFiscalCatalogPresentationTaxRule(rule: FiscalCatalogPresentationTaxRule): void {
  validateEffectiveRecord(rule);
  requiredText(rule.presentationId, "fiscal_catalog_presentation_required", 500);
  if (rule.catalogFingerprintSha256 !== undefined &&
    !/^[a-f0-9]{64}$/.test(rule.catalogFingerprintSha256)) {
    throw new Error("fiscal_catalog_evidence_fingerprint_invalid");
  }
  if (rule.offerType === "SERVICE") {
    requiredText(rule.serviceDescription, "fiscal_catalog_service_description_required", 500);
    if (rule.tariffCode10 !== undefined || rule.physicalState !== undefined ||
      rule.compositionOrSpecies !== undefined) {
      throw new Error("fiscal_catalog_service_goods_fields_forbidden");
    }
  } else if (rule.offerType === undefined || rule.offerType === "GOOD") {
    if (rule.category === "UNDETERMINED") {
      if (rule.offerType !== "GOOD") {
        throw new Error("fiscal_catalog_pending_good_type_required");
      }
      requiredText(rule.reviewQuestion,
        "fiscal_catalog_pending_review_question_required", 1000);
      if (rule.tariffCode10 !== undefined && !/^\d{10}$/.test(rule.tariffCode10)) {
        throw new Error("fiscal_catalog_tariff_code_10_required");
      }
      if (rule.physicalState !== undefined) {
        requiredText(rule.physicalState, "fiscal_catalog_physical_state_invalid", 240);
      }
      if (rule.compositionOrSpecies !== undefined) {
        requiredText(rule.compositionOrSpecies,
          "fiscal_catalog_composition_or_species_invalid", 500);
      }
    } else {
      if (!/^\d{10}$/.test(rule.tariffCode10)) {
        throw new Error("fiscal_catalog_tariff_code_10_required");
      }
      requiredText(rule.physicalState, "fiscal_catalog_physical_state_required", 240);
      requiredText(rule.compositionOrSpecies,
        "fiscal_catalog_composition_or_species_required", 500);
    }
    if (rule.serviceDescription !== undefined) {
      throw new Error("fiscal_catalog_good_service_fields_forbidden");
    }
  } else {
    throw new Error("fiscal_catalog_offer_type_invalid");
  }
  if (rule.priceIncludesTax !== undefined &&
    typeof rule.priceIncludesTax !== "boolean") {
    throw new Error("fiscal_catalog_historical_price_tax_mode_invalid");
  }
  if (!/^[A-Z0-9]{3}$/.test(rule.unitCode)) {
    throw new Error("fiscal_catalog_unit_code_invalid");
  }
  if (!isFiscalSupportedUnitCode(rule.unitCode)) {
    throw new Error("fiscal_catalog_unit_code_unsupported_for_emission");
  }
  if (rule.category === "GRAVADA") {
    if (rule.affectationCode !== "10" || !Number.isSafeInteger(rule.taxRateBasisPoints) ||
      rule.taxRateBasisPoints <= 0 || rule.taxRateBasisPoints > 10_000 ||
      rule.exemptionEligibility !== "NOT_APPLICABLE") {
      throw new Error("fiscal_catalog_tax_representation_mismatch");
    }
    return;
  }
  if (rule.category === "EXONERADA") {
    if (rule.affectationCode !== "20" || rule.taxRateBasisPoints !== 0 ||
      rule.exemptionEligibility !== (rule.offerType === "SERVICE"
        ? "APPENDIX_II_ELIGIBLE" : "APPENDIX_I_ELIGIBLE")) {
      throw new Error("fiscal_catalog_tax_representation_mismatch");
    }
    return;
  }
  if (rule.category === "INAFECTA") {
    if (rule.affectationCode !== "30" || rule.taxRateBasisPoints !== 0 ||
      rule.exemptionEligibility !== "NOT_APPLICABLE") {
      throw new Error("fiscal_catalog_tax_representation_mismatch");
    }
    return;
  }
  if (rule.category !== "UNDETERMINED" || rule.affectationCode !== null ||
    rule.taxRateBasisPoints !== null || rule.exemptionEligibility !== "UNDETERMINED") {
    throw new Error("fiscal_catalog_tax_representation_mismatch");
  }
}

export function validateFiscalIssuerExemptionPosture(
  posture: FiscalIssuerExemptionPostureRecord,
): void {
  validateEffectiveRecord(posture);
  if (!["NOT_RENOUNCED", "RENOUNCED", "UNDETERMINED"].includes(posture.posture)) {
    throw new Error("fiscal_catalog_issuer_exemption_posture_invalid");
  }
  if (posture.posture === "RENOUNCED") {
    if (posture.resultingAffectationCode !== "10" ||
      !Number.isSafeInteger(posture.resultingTaxRateBasisPoints) ||
      posture.resultingTaxRateBasisPoints <= 0 ||
      posture.resultingTaxRateBasisPoints > 10_000) {
      throw new Error("fiscal_catalog_renunciation_tax_result_invalid");
    }
  } else if (posture.resultingAffectationCode !== null ||
    posture.resultingTaxRateBasisPoints !== null) {
    throw new Error("fiscal_catalog_renunciation_tax_result_invalid");
  }
}


function endOrInfinity(value: string | undefined): string { return value ?? "9999-12-31"; }

/** Applies one dated rule. Profile authentication/approval remains an application boundary. */
function covers(record: { effectiveFrom: string; effectiveTo?: string }, date: string): boolean {
  return record.effectiveFrom <= date && date <= endOrInfinity(record.effectiveTo);
}

export function resolveFiscalCatalogTaxRule(profile: FiscalCatalogTaxConfiguration, input: {
  presentationId: string;
  taxableEventDate: string;
}): { rule: Exclude<FiscalCatalogPresentationTaxRule, { category: "UNDETERMINED" }>;
  resolvedTax: {
    category: "GRAVADA" | "EXONERADA" | "INAFECTA";
    affectationCode: "10" | "20" | "30";
    taxRateBasisPoints: number;
  };
  issuerExemptionPosture: Exclude<FiscalIssuerExemptionPosture, "UNDETERMINED"> |
    "NOT_APPLICABLE";
  issuerExemptionPostureRecord?: Exclude<FiscalIssuerExemptionPostureRecord,
    { posture: "UNDETERMINED" }> } {
  const date = validateFiscalCivilDate(input.taxableEventDate,
    "fiscal_catalog_taxable_event_date_invalid");
  requiredText(input.presentationId, "fiscal_catalog_presentation_required", 500);
  const rules = profile.rules.filter((rule) => rule.presentationId === input.presentationId &&
    covers(rule, date));
  if (rules.length !== 1) {
    throw new Error(rules.length === 0 ? "fiscal_catalog_rule_not_effective" :
      "fiscal_catalog_rule_effective_ambiguous");
  }
  const rule = rules[0];
  validateFiscalCatalogPresentationTaxRule(rule);
  if (rule.category === "UNDETERMINED") {
    throw new Error("fiscal_catalog_tax_decision_undetermined");
  }
  // La renuncia solo transforma bienes exonerados del Apéndice I. La exoneración
  // de un servicio del Apéndice II no depende de esa postura del emisor.
  if (rule.category !== "EXONERADA" || rule.offerType === "SERVICE") {
    return { rule, resolvedTax: { category: rule.category,
      affectationCode: rule.affectationCode,
      taxRateBasisPoints: rule.taxRateBasisPoints },
    issuerExemptionPosture: "NOT_APPLICABLE" };
  }
  const postures = profile.issuerExemptionPostures.filter((posture) => covers(posture, date));
  if (postures.length !== 1) {
    throw new Error(postures.length === 0 ? "fiscal_catalog_issuer_posture_not_effective" :
      "fiscal_catalog_issuer_posture_effective_ambiguous");
  }
  const postureRecord = postures[0];
  validateFiscalIssuerExemptionPosture(postureRecord);
  const posture = postureRecord.posture;
  if (posture === "UNDETERMINED") {
    throw new Error("fiscal_catalog_tax_decision_undetermined");
  }
  if (rule.category === "EXONERADA" && posture === "RENOUNCED") {
    return { rule, resolvedTax: { category: "GRAVADA",
      affectationCode: postureRecord.resultingAffectationCode,
      taxRateBasisPoints: postureRecord.resultingTaxRateBasisPoints },
    issuerExemptionPosture: posture,
    issuerExemptionPostureRecord: postureRecord };
  }
  return { rule, resolvedTax: { category: rule.category,
    affectationCode: rule.affectationCode,
    taxRateBasisPoints: rule.taxRateBasisPoints }, issuerExemptionPosture: posture,
  issuerExemptionPostureRecord: postureRecord };
}
