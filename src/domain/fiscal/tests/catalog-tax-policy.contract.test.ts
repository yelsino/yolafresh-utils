import test from "node:test";
import assert from "node:assert/strict";
import {
  FISCAL_CATALOG_DEFAULT_POLICY_TYPE, FISCAL_PRODUCT_TAX_CONFIGURATION_TYPE,
  projectFiscalCatalogPolicyDocument, projectFiscalCatalogTaxDeclaration,
  projectFiscalPresentationCatalogAssignment, projectFiscalProductTaxAssignmentRule,
  projectFiscalTaxConfigurationDocument,
  validateFiscalTaxConfigurationTransition,
} from "../contracts";

const declaration = (extra: Record<string, unknown> = {}) => ({
  ruleId: "4ec89454-07cb-48f8-a57c-fb824c6472ce", offerType: "GOOD",
  effectiveFrom: "2026-11-05", classificationOrigin: "CONTRIBUTOR_DECLARED",
  treatment: { category: "GRAVADA", affectationCode: "10", rateBasisPoints: 1800 },
  ...extra,
});
const decision = (rules = [declaration()]) => ({
  decisionId: "e5f313bc-f7e4-45d1-8470-3439df600607", operationId: "operation-publish",
  reason: "Declaración del contribuyente", publishedBy: "actor-a", publishedAt: 20, rules,
});
const root = () => ({
  _id: "1f1e393e-4324-4dfa-88cf-515f92e283c8", _rev: "2-opaque", schemaVersion: 1,
  type: FISCAL_CATALOG_DEFAULT_POLICY_TYPE, tenantId: "tenant-a", issuerRuc: "20616438400",
  companyDocumentId: "opaque-company", status: "ACTIVE", creationOperationId: "create-a",
  audit: { createdBy: "actor-a", createdAt: 10, updatedBy: "actor-a", updatedAt: 20 },
  publishedDecisionId: "e5f313bc-f7e4-45d1-8470-3439df600607",
  decisionHistory: [decision()], draft: null,
  operationReceipts: [{ operationId: "operation-publish", action: "PUBLISH", contentSha256: "a".repeat(64),
    actorId: "actor-a", completedAt: 20 }],
});

test("accepts canonical opaque _id without requiring a duplicate id", () => {
  const value = projectFiscalCatalogPolicyDocument(root());
  assert.equal(value._id, root()._id);
  assert.equal("id" in value, false);
  assert.deepEqual(value.decisionHistory[0].rules[0], declaration());
});

test("replica projection strips private and unknown fields at every declaration boundary", () => {
  const input = root() as any;
  input.apiToken = "must-not-cross-boundary";
  input.audit.private = true;
  input.decisionHistory[0].rules[0].secret = true;
  input.decisionHistory[0].rules[0].treatment.secret = true;
  const value = projectFiscalCatalogPolicyDocument(input);
  assert.equal(JSON.stringify(value).includes("secret"), false);
  assert.equal(JSON.stringify(value).includes("apiToken"), false);
  assert.equal(JSON.stringify(value).includes("private"), false);
});

test("keeps exonerated and unaffected categories distinct despite their equal zero rate", () => {
  const exempt = projectFiscalCatalogTaxDeclaration(declaration({
    treatment: { category: "EXONERADA", affectationCode: "20", rateBasisPoints: 0 },
  }));
  const unaffected = projectFiscalCatalogTaxDeclaration(declaration({
    treatment: { category: "INAFECTA", affectationCode: "30", rateBasisPoints: 0 },
  }));
  assert.notDeepEqual(exempt.treatment, unaffected.treatment);
});

for (const rateBasisPoints of [1050, 1500, 1800]) {
  test("preserves exact integer basis points " + rateBasisPoints, () => {
    const value = projectFiscalCatalogTaxDeclaration(declaration({
      treatment: { category: "GRAVADA", affectationCode: "10", rateBasisPoints },
    }));
    assert.equal(value.treatment.rateBasisPoints, rateBasisPoints);
  });
}

for (const treatment of [
  { category: "GRAVADA", affectationCode: "10", rateBasisPoints: 0 },
  { category: "GRAVADA", affectationCode: "10", rateBasisPoints: 10.5 },
  { category: "EXONERADA", affectationCode: "30", rateBasisPoints: 0 },
  { category: "INAFECTA", affectationCode: "30", rateBasisPoints: 1800 },
]) {
  test("rejects inconsistent treatment " + JSON.stringify(treatment), () => {
    assert.throws(() => projectFiscalCatalogTaxDeclaration(declaration({ treatment })), /FISCAL_CATALOG_TREATMENT_INVALID/);
  });
}

test("does not allow a declaration to claim a SUNAT verification that did not happen", () => {
  assert.throws(() => projectFiscalCatalogTaxDeclaration(declaration({
    classificationOrigin: "SUNAT_VERIFIED",
  })), /FISCAL_CATALOG_DECLARATION_INVALID/);
});

test("inheritance and a numerically equal explicit override remain different assignments", () => {
  const inherited = projectFiscalProductTaxAssignmentRule({
    ruleId: "r-a", effectiveFrom: "2026-11-05", mode: "INHERIT_COMPANY_POLICY", policyDocumentId: root()._id,
  });
  const custom = projectFiscalProductTaxAssignmentRule({
    ruleId: "r-b", effectiveFrom: "2026-11-05", mode: "CUSTOM", declaration: declaration(),
  });
  assert.equal(inherited.mode, "INHERIT_COMPANY_POLICY");
  assert.equal(custom.mode, "CUSTOM");
  assert.throws(() => projectFiscalProductTaxAssignmentRule({
    ...inherited, declaration: declaration(),
  }), /AMBIGUOUS/);
});

test("validates a product root with a scoped company-policy reference", () => {
  const input = {
    ...root(), type: FISCAL_PRODUCT_TAX_CONFIGURATION_TYPE, productBaseId: "opaque-product",
    decisionHistory: [decision([{
      ruleId: "r-a", effectiveFrom: "2026-11-05", mode: "INHERIT_COMPANY_POLICY", policyDocumentId: root()._id,
    } as any])],
  };
  const value = projectFiscalCatalogPolicyDocument(input);
  assert.equal(value.type, FISCAL_PRODUCT_TAX_CONFIGURATION_TYPE);
  assert.equal((value as any).productBaseId, "opaque-product");
});

test("rejects mismatched assignment/declaration calendars and published overlapping rules", () => {
  assert.throws(() => projectFiscalProductTaxAssignmentRule({
    ruleId: "r-b", effectiveFrom: "2026-11-06", mode: "CUSTOM", declaration: declaration(),
  }), /CALENDAR_MISMATCH/);
  const input = root();
  input.decisionHistory = [decision([declaration(), declaration({ ruleId: "rule-b", effectiveFrom: "2026-12-01" })])];
  assert.throws(() => projectFiscalCatalogPolicyDocument(input), /CALENDAR_OVERLAP/);
});

test("rejects unsupported schemas, ambiguous histories and Couch conflict envelopes", () => {
  assert.throws(() => projectFiscalCatalogPolicyDocument({ ...root(), schemaVersion: 2 }), /SCHEMA_UNSUPPORTED/);
  assert.throws(() => projectFiscalCatalogPolicyDocument({ ...root(), publishedDecisionId: "not-in-history" }));
  assert.throws(() => projectFiscalCatalogPolicyDocument({ ...root(), _conflicts: ["other-revision"] }));
  assert.throws(() => projectFiscalCatalogPolicyDocument({ ...root(), _id: 17 }));
});

test("presentation assignment history survives the existing fiscal replica projection", () => {
  const assignment = projectFiscalPresentationCatalogAssignment({
    schemaVersion: 1, publishedDecisionId: "binding-decision",
    decisionHistory: [{ ...decision(), decisionId: "binding-decision", rules: [{
      ruleId: "binding-rule", effectiveFrom: "2026-11-05", mode: "INHERIT_PRODUCT",
      productConfigurationDocumentId: "opaque-product-configuration",
    }] }],
  });
  const input = {
    ...root(), type: "fiscal_presentation_tax_configuration", presentationId: "opaque-presentation",
    publishedDecisionId: null, decisionHistory: [], operationReceipts: [], catalogAssignment: assignment,
  };
  const value = projectFiscalTaxConfigurationDocument(input);
  assert.deepEqual("catalogAssignment" in value && value.catalogAssignment, assignment);
  const { catalogAssignment: _assignment, ...oldClientPayload } = input;
  assert.throws(() => validateFiscalTaxConfigurationTransition(value,
    projectFiscalTaxConfigurationDocument(oldClientPayload)), /ASSIGNMENT_HISTORY_IMMUTABLE/);
});
