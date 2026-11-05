/** Validación estructural; no elige reglas vigentes ni ejecuta decisiones. */
import type {
  FiscalCatalogPolicyDocument, FiscalCatalogTaxDeclaration,
  FiscalProductTaxAssignmentRule, FiscalPresentationCatalogAssignment,
} from "./catalog-tax-policy.contract";
import {
  FISCAL_CATALOG_DEFAULT_POLICY_TYPE, FISCAL_PRODUCT_TAX_CONFIGURATION_TYPE,
} from "./catalog-tax-policy.contract";
import { validateFiscalTaxEvidence } from "./configuracion-fiscal";

const invalid = (code = "FISCAL_CATALOG_POLICY_INVALID"): never => { throw new Error(code); };
const record = (value: unknown): Record<string, any> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : invalid();
const opaque = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const timestamp = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const text = (value: unknown) => { if (!opaque(value)) invalid(); };
const hash = (value: unknown) => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
const list = (value: unknown, max: number): any[] =>
  Array.isArray(value) && value.length <= max ? value : invalid();
const pick = (input: Record<string, any>, keys: readonly string[]) =>
  Object.fromEntries(keys.filter(key => input[key] !== undefined).map(key => [key, input[key]]));
const evidence = (input: Record<string, any>) => ({
  ...pick(input, ["effectiveFrom", "effectiveTo", "sourceReviewedAt", "evidenceReference"]),
  ...(input.legalSource === undefined ? {} :
    { legalSource: pick(record(input.legalSource), ["uri", "title", "provision"]) }),
});

export function assertFiscalCatalogTaxDeclaration(value: unknown): asserts value is FiscalCatalogTaxDeclaration {
  const rule = record(value), treatment = record(rule.treatment);
  text(rule.ruleId);
  validateFiscalTaxEvidence(rule as FiscalCatalogTaxDeclaration);
  if (!["GOOD", "SERVICE"].includes(rule.offerType) || rule.classificationOrigin !== "CONTRIBUTOR_DECLARED")
    invalid("FISCAL_CATALOG_DECLARATION_INVALID");
  const valid = treatment.category === "GRAVADA"
    ? treatment.affectationCode === "10" && Number.isSafeInteger(treatment.rateBasisPoints) &&
      treatment.rateBasisPoints > 0 && treatment.rateBasisPoints <= 10000
    : treatment.category === "EXONERADA"
      ? treatment.affectationCode === "20" && treatment.rateBasisPoints === 0
      : treatment.category === "INAFECTA" && treatment.affectationCode === "30" && treatment.rateBasisPoints === 0;
  if (!valid) invalid("FISCAL_CATALOG_TREATMENT_INVALID");
}

export function projectFiscalCatalogTaxDeclaration(value: unknown): FiscalCatalogTaxDeclaration {
  assertFiscalCatalogTaxDeclaration(value);
  const rule = record(value);
  return {
    ...evidence(rule), ...pick(rule, ["ruleId", "offerType", "classificationOrigin"]),
    treatment: pick(record(rule.treatment), ["category", "affectationCode", "rateBasisPoints"]),
  } as FiscalCatalogTaxDeclaration;
}

export function projectFiscalProductTaxAssignmentRule(value: unknown): FiscalProductTaxAssignmentRule {
  const rule = record(value);
  text(rule.ruleId);
  validateFiscalTaxEvidence(rule as FiscalProductTaxAssignmentRule);
  if (rule.mode === "INHERIT_COMPANY_POLICY") {
    text(rule.policyDocumentId);
    if (rule.declaration !== undefined) invalid("FISCAL_CATALOG_ASSIGNMENT_AMBIGUOUS");
    return { ...evidence(rule), ruleId: rule.ruleId, mode: rule.mode, policyDocumentId: rule.policyDocumentId } as FiscalProductTaxAssignmentRule;
  }
  if (rule.mode !== "CUSTOM" || rule.policyDocumentId !== undefined) invalid("FISCAL_CATALOG_ASSIGNMENT_INVALID");
  const declaration = projectFiscalCatalogTaxDeclaration(rule.declaration);
  if (declaration.effectiveFrom !== rule.effectiveFrom || declaration.effectiveTo !== rule.effectiveTo)
    invalid("FISCAL_CATALOG_ASSIGNMENT_CALENDAR_MISMATCH");
  return { ...evidence(rule), ruleId: rule.ruleId, mode: rule.mode, declaration } as FiscalProductTaxAssignmentRule;
}

function rules(values: unknown, project: (value: unknown) => any, published: boolean): any[] {
  const result = list(values, 1000).map(project);
  if (!result.length || new Set(result.map(rule => rule.ruleId)).size !== result.length) invalid();
  if (published) {
    const sorted = [...result].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    for (let i = 1; i < sorted.length; i++)
      if ((sorted[i - 1].effectiveTo ?? "9999-12-31") >= sorted[i].effectiveFrom)
        invalid("FISCAL_CATALOG_CALENDAR_OVERLAP");
  }
  return result;
}

function decisions(values: unknown, project: (value: unknown) => any): any[] {
  const result: Record<string, any>[] = list(values, 5000).map(value => {
    const decision = record(value);
    for (const field of ["decisionId", "operationId", "reason", "publishedBy"]) text(decision[field]);
    if (!timestamp(decision.publishedAt)) invalid();
    return { ...pick(decision, ["decisionId", "operationId", "reason", "publishedBy", "publishedAt"]),
      rules: rules(decision.rules, project, true) };
  });
  if (new Set(result.map(decision => decision.decisionId)).size !== result.length) invalid();
  return result;
}

export function projectFiscalPresentationCatalogAssignment(value: unknown): FiscalPresentationCatalogAssignment {
  const input = record(value);
  if (input.schemaVersion !== 1) invalid("FISCAL_CATALOG_SCHEMA_UNSUPPORTED");
  const history = decisions(input.decisionHistory, value => {
    const rule = record(value); text(rule.ruleId); validateFiscalTaxEvidence(rule as any);
    const field = rule.mode === "INHERIT_PRODUCT" ? "productConfigurationDocumentId"
      : rule.mode === "CUSTOM" ? "configurationDecisionId" : invalid("FISCAL_CATALOG_ASSIGNMENT_INVALID");
    text(rule[field]);
    if (rule.mode === "INHERIT_PRODUCT" && rule.configurationDecisionId !== undefined ||
        rule.mode === "CUSTOM" && rule.productConfigurationDocumentId !== undefined)
      invalid("FISCAL_CATALOG_ASSIGNMENT_AMBIGUOUS");
    return { ...evidence(rule), ...pick(rule, ["ruleId", "mode", field]) };
  });
  if (!history.length || history[history.length - 1].decisionId !== input.publishedDecisionId) invalid();
  return { schemaVersion: 1, publishedDecisionId: input.publishedDecisionId, decisionHistory: history } as FiscalPresentationCatalogAssignment;
}

export function projectFiscalCatalogPolicyDocument(value: unknown): FiscalCatalogPolicyDocument {
  const input = record(value), product = input.type === FISCAL_PRODUCT_TAX_CONFIGURATION_TYPE;
  if (!product && input.type !== FISCAL_CATALOG_DEFAULT_POLICY_TYPE) invalid("FISCAL_CATALOG_DOCUMENT_TYPE_INVALID");
  if (input.schemaVersion !== 1) invalid("FISCAL_CATALOG_SCHEMA_UNSUPPORTED");
  for (const field of ["_id", "tenantId", "companyDocumentId", "creationOperationId"]) text(input[field]);
  if (input._rev !== undefined) text(input._rev);
  if (!/^\d{11}$/.test(input.issuerRuc ?? "") || !["ACTIVE", "SUSPENDED"].includes(input.status) ||
      input._deleted === true || input._conflicts !== undefined &&
      (!Array.isArray(input._conflicts) || input._conflicts.length)) invalid();
  if (product) text(input.productBaseId);
  let automaticAssignment: Record<string, unknown> | undefined;
  if (input.automaticAssignment !== undefined) {
    if (!product) invalid("FISCAL_CATALOG_AUTOMATIC_ASSIGNMENT_INVALID");
    const automatic = record(input.automaticAssignment), source = record(automatic.approvedSource);
    for (const field of ["operationId", "createdBy"]) text(automatic[field]);
    for (const field of ["documentId", "decisionId", "ruleId"]) text(source[field]);
    if (!timestamp(automatic.createdAt)) invalid("FISCAL_CATALOG_AUTOMATIC_ASSIGNMENT_INVALID");
    automaticAssignment = { ...pick(automatic, ["operationId", "createdBy", "createdAt"]),
      approvedSource: pick(source, ["documentId", "decisionId", "ruleId"]) };
  }
  const audit = record(input.audit);
  text(audit.createdBy); text(audit.updatedBy);
  if (!timestamp(audit.createdAt) || !timestamp(audit.updatedAt) || audit.updatedAt < audit.createdAt) invalid();
  const project = product ? projectFiscalProductTaxAssignmentRule : projectFiscalCatalogTaxDeclaration;
  const history = decisions(input.decisionHistory, project);
  if (!(input.publishedDecisionId === null && !history.length) &&
      (!opaque(input.publishedDecisionId) || history[history.length - 1]?.decisionId !== input.publishedDecisionId)) invalid();
  const draft = input.draft === null ? null : (() => {
    const value = record(input.draft);
    for (const field of ["operationId", "reason", "updatedBy"]) text(value[field]);
    if (!timestamp(value.updatedAt)) invalid();
    return { ...pick(value, ["operationId", "reason", "updatedBy", "updatedAt"]), rules: rules(value.rules, project, false) };
  })();
  const receipts = list(input.operationReceipts, 10000).map(value => {
    const receipt = record(value); text(receipt.operationId); text(receipt.actorId);
    if (!["CREATE", "SAVE_DRAFT", "PUBLISH", "SET_STATUS"].includes(receipt.action) ||
        !hash(receipt.contentSha256) || !timestamp(receipt.completedAt)) invalid();
    return pick(receipt, ["operationId", "action", "contentSha256", "actorId", "completedAt"]);
  });
  if (new Set(receipts.map(receipt => receipt.operationId)).size !== receipts.length) invalid();
  return { ...pick(input, ["_id", "_rev", "type", "schemaVersion", "tenantId", "issuerRuc", "companyDocumentId",
    ...(product ? ["productBaseId"] : []), "status", "creationOperationId", "publishedDecisionId"]),
    ...(automaticAssignment ? { automaticAssignment } : {}),
    audit: pick(audit, ["createdBy", "createdAt", "updatedBy", "updatedAt"]),
    draft, decisionHistory: history, operationReceipts: receipts } as FiscalCatalogPolicyDocument;
}

export function assertFiscalCatalogResolvedTaxSource(value: unknown): void {
  const source = record(value);
  if (!["COMPANY_POLICY", "PRODUCT_OVERRIDE", "PRESENTATION_OVERRIDE"].includes(source.kind) ||
    Object.keys(source).some(key => !["kind", "policy", "product", "presentation", "presentationAssignment", "issuerPosture"].includes(key)))
    invalid("FISCAL_CATALOG_SOURCE_INVALID");
  const required = source.kind === "COMPANY_POLICY" ? "policy" : source.kind === "PRODUCT_OVERRIDE" ? "product" : "presentation";
  if (!source[required]) invalid("FISCAL_CATALOG_SOURCE_INVALID");
  for (const field of ["policy", "product", "presentation", "presentationAssignment", "issuerPosture"]) {
    if (source[field] === undefined) continue;
    const ref = record(source[field]);
    if (Object.keys(ref).some(key => !["documentId", "decisionId", "ruleId"].includes(key))) invalid("FISCAL_CATALOG_SOURCE_INVALID");
    for (const key of ["documentId", "decisionId", "ruleId"]) text(ref[key]);
  }
}
