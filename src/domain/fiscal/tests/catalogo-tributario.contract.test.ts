import assert from "node:assert/strict";
import test from "node:test";
import { isFiscalCompanyEnabled, type ConfigEmpresa } from "../../shared/kernel/empresa.contract";
import { FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE, FISCAL_TAX_REGIMES, isFiscalTaxRegime,
  type FiscalCatalogTaxProfile, type FiscalCatalogTaxProfileDocument,
  type FiscalCatalogPresentationTaxRule, type FiscalCatalogPresentationTaxRuleInput,
  type FiscalTaxClassification } from "../contracts";
import type { FiscalCatalogTaxProfile as RootProfile } from "../../../index";
import type { FiscalCatalogTaxProfile as FiscalProfile } from "../index";
import { projectFiscalCatalogTaxConfiguration, resolveFiscalCatalogTaxRule,
  fiscalCatalogRevisionFingerprintMaterial } from "../contracts";

const exempt: FiscalCatalogPresentationTaxRule = {
  presentationId: "opaque/α", offerType: "GOOD", category: "EXONERADA",
  affectationCode: "20", taxRateBasisPoints: 0, exemptionEligibility: "APPENDIX_I_ELIGIBLE",
  tariffCode10: "0702000000", physicalState: "fresco", compositionOrSpecies: "tomate",
  unitCode: "KGM", effectiveFrom: "2026-10-01",
  legalSource: { uri: "https://www.sunat.gob.pe/", title: "Fuente de prueba", provision: "Caso sintético" },
  sourceReviewedAt: "2026-10-01", evidenceReference: "evidence-opaque",
  configuredBy: "actor-opaque", configuredAt: 1,
};
const profile: FiscalCatalogTaxProfile = {
  schemaVersion: 2, profileDocumentId: "random-identity/α",
  tenantId: "synthetic-tenant", issuerRuc: "20100070970", issuerLegalName: "Emisor sintético",
  taxRegime: "REGIMEN_GENERAL", issuerFiscalAddressCode: "0000", approvalState: "DRAFT",
  rules: [exempt], issuerExemptionPostures: [], approvedDecisionHistory: [], amendments: [],
  provisionedBy: "actor-opaque", createdAt: 1, updatedAt: 1,
};

test("proyecta solo configuración operativa, preservando identidad opaca y sin archivos privados", () => {
  const projected = projectFiscalCatalogTaxConfiguration({ ...profile, _id: "uuid / extraño", _rev: "opaque-revision",
    type: FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE, token: "private", legacyDraftArchive: { sourceDocument: { secret: true } },
    rules: [{ ...exempt, hidden: "private", legalSource: { ...exempt.legalSource, secret: true } }] });
  assert.equal(projected._id, "uuid / extraño");
  for (const key of ["id", "profileDocumentId", "legacyDraftArchive", "token", "approvedDecisionHistory"])
    assert.equal(key in projected, false);
  assert.equal("hidden" in projected.rules[0], false);
  assert.equal("secret" in projected.rules[0].legalSource, false);
  assert.deepEqual(projectFiscalCatalogTaxConfiguration(projected), projected);
});

test("resuelve vigencias, renuncia y servicios con la misma regla sin red ni datos comerciales", () => {
  const posture = { ...exempt, posture: "NOT_RENOUNCED" as const,
    resultingAffectationCode: null, resultingTaxRateBasisPoints: null };
  const configured = { ...profile, issuerExemptionPostures: [posture] };
  const query = { presentationId: exempt.presentationId, taxableEventDate: "2026-10-10" };
  assert.equal(resolveFiscalCatalogTaxRule(configured, query).resolvedTax.category, "EXONERADA");
  assert.equal(resolveFiscalCatalogTaxRule({ ...configured, issuerExemptionPostures: [{ ...posture,
    posture: "RENOUNCED", resultingAffectationCode: "10", resultingTaxRateBasisPoints: 1800 }] }, query).resolvedTax.category, "GRAVADA");
  assert.throws(() => resolveFiscalCatalogTaxRule(profile, query), /posture_not_effective/);
  const { tariffCode10, physicalState, compositionOrSpecies, ...common } = exempt;
  const service = { ...common, offerType: "SERVICE" as const,
    exemptionEligibility: "APPENDIX_II_ELIGIBLE" as const, serviceDescription: "Servicio sintético" };
  assert.equal(resolveFiscalCatalogTaxRule({ ...profile, rules: [service] }, query).issuerExemptionPosture, "NOT_APPLICABLE");
  assert.throws(() => resolveFiscalCatalogTaxRule(configured, { ...query, taxableEventDate: "2026-09-01" }), /rule_not_effective/);
  assert.throws(() => resolveFiscalCatalogTaxRule({ ...configured, rules: [exempt, exempt] }, query), /ambiguous/);
  assert.throws(() => resolveFiscalCatalogTaxRule(configured, { ...query, taxableEventDate: "2026-02-30" }), /date_invalid/);
});

test("material de revisión es idéntico al hash contractual existente", () => {
  const input = { tenantId: "tenant", presentationId: "opaque", presentationRevision: "rev-a",
    productBaseId: "base-opaque", productBaseRevision: "rev-b" };
  assert.equal(fiscalCatalogRevisionFingerprintMaterial(input), JSON.stringify(input));
});

test("el perfil es el mismo contrato en las superficies raíz y fiscal", () => {
  const root: RootProfile = profile;
  const fiscal: FiscalProfile = root;
  assert.equal(fiscal, profile);
  for (const path of ["yola-fresh-utils", "yola-fresh-utils/fiscal", "yola-fresh-utils/fiscal/contracts"]) {
    const api = require(path);
    assert.equal(api.FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE, FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE);
    assert.equal(api.isFiscalTaxRegime("REGIMEN_GENERAL"), true);
  }
});

test("el sobre Couch conserva _id opaco y no duplica id ni profileDocumentId", () => {
  const { profileDocumentId, revision, ...fields } = profile;
  const document: FiscalCatalogTaxProfileDocument = {
    ...fields, _id: profileDocumentId, type: FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE,
  };
  const restored = JSON.parse(JSON.stringify(document)) as FiscalCatalogTaxProfileDocument;
  assert.equal(restored._id, "random-identity/α");
  assert.equal(restored.type, "fiscal_tax_profile_v2");
  assert.equal("id" in restored, false);
  assert.equal("profileDocumentId" in restored, false);
  assert.equal(restored.rules[0].presentationId, "opaque/α");
  assert.equal(revision, undefined);
});

test("regímenes y flag comparten una sola definición, sin activar por ausencia o coerción", () => {
  assert.deepEqual(FISCAL_TAX_REGIMES, ["NRUS", "RER", "RMT", "REGIMEN_GENERAL"]);
  for (const regime of FISCAL_TAX_REGIMES) assert.equal(isFiscalTaxRegime(regime), true);
  for (const invalid of ["GENERAL", "", null, 1]) assert.equal(isFiscalTaxRegime(invalid), false);
  const enabled: Pick<ConfigEmpresa["fiscal"], "facturacionElectronicaEnabled"> =
    { facturacionElectronicaEnabled: true };
  assert.equal(isFiscalCompanyEnabled({ fiscal: enabled }), true);
  for (const invalid of [null, {}, [], { fiscal: [] }, { fiscal: {} },
    { fiscal: { facturacionElectronicaEnabled: false } },
    { fiscal: { facturacionElectronicaEnabled: "true" } },
    { fiscal: { facturacionElectronicaEnabled: 1 } }]) {
    assert.equal(isFiscalCompanyEnabled(invalid), false);
  }
});

test("clasificar una presentación no modifica producto, precio ni importe de venta", () => {
  const classification: FiscalTaxClassification = {
    tenantId: profile.tenantId, presentationId: exempt.presentationId,
    taxableEventDate: "2026-10-10", profileState: "APPROVED", category: "EXONERADA",
    affectationCode: "20", rateBasisPoints: 0, unitCode: exempt.unitCode,
    evidenceReference: exempt.evidenceReference, legalSource: exempt.legalSource,
    issuerExemptionPosture: null, sourceReviewedAt: exempt.sourceReviewedAt,
    effectiveFrom: exempt.effectiveFrom, effectiveTo: null, ruleVersion: 2, reason: null,
  };
  assert.equal(classification.rateBasisPoints, 0);
  assert.equal("taxAmountCents" in classification, false);
  assert.equal("precioVenta" in classification, false);
  // @ts-expect-error Una regla exonerada no puede declarar una tasa distinta de cero.
  const invalidRate: FiscalCatalogPresentationTaxRule = { ...exempt, taxRateBasisPoints: 1800 };
  // @ts-expect-error El alta de reglas fiscales no acepta decisiones comerciales de precio.
  const invalidPrice: FiscalCatalogPresentationTaxRuleInput = { ...exempt, priceIncludesTax: true };
  // @ts-expect-error El flag es booleano, no texto susceptible de coerción.
  const invalidFlag: ConfigEmpresa["fiscal"]["facturacionElectronicaEnabled"] = "true";
  void invalidRate; void invalidPrice; void invalidFlag;
});
