import type { FiscalConfigurationCommand } from "./configuracion-fiscal.contract";
import type { FiscalV1Environment } from "./modulo-fiscal-v1.contract";
import { validateFiscalCivilDate } from "./reglas-tributarias";

type AssessmentScope = {
  readonly environment: FiscalV1Environment;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly assessedOn: string;
  readonly evidenceRefs: readonly string[];
};

export type FiscalAmazoniaIssuerAssessment = AssessmentScope & (
  | { readonly status: "DISABLED" }
  | {
    readonly status: "ENABLED";
    readonly requirements: {
      readonly domicileAndHeadOffice: "MET";
      readonly publicRegistration: "MET";
      readonly fixedAssets: {
        readonly status: "MET";
        readonly basisPoints: number;
        readonly allProductionMeansInZone: true;
        readonly cutoffOn: string;
      };
      readonly production: { readonly status: "MET" | "NOT_APPLICABLE" };
    };
  }
);

export interface FiscalAmazoniaIssuerConfiguration {
  readonly draft: {
    readonly operationId: string;
    readonly assessment: FiscalAmazoniaIssuerAssessment;
    readonly reason: string;
    readonly updatedBy: string;
    readonly updatedAt: number;
  } | null;
  readonly publishedDecisionIdByEnvironment: Partial<Record<FiscalV1Environment, string>>;
  readonly decisionHistory: readonly {
    readonly decisionId: string;
    readonly operationId: string;
    readonly assessment: FiscalAmazoniaIssuerAssessment;
    readonly reason: string;
    readonly publishedBy: string;
    readonly publishedAt: number;
  }[];
}

export type FiscalAmazoniaIssuerCommand = FiscalConfigurationCommand & { readonly subject: "AMAZONIA" } & (
  | { readonly action: "SAVE_DRAFT"; readonly assessment: FiscalAmazoniaIssuerAssessment; readonly reason: string }
  | { readonly action: "PUBLISH"; readonly decisionId: string }
);

const invalid = (): never => { throw new Error("FISCAL_AMAZONIA_ISSUER_CONFIGURATION_INVALID"); };

function exact(value: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const record = value as Record<string, unknown>;
  if (required.some(key => !Object.prototype.hasOwnProperty.call(record, key)) ||
      Object.keys(record).some(key => !required.includes(key) && !optional.includes(key))) return invalid();
  return record;
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value.length || value !== value.trim() || value.length > 500 ||
      /[\x00-\x1f\x7f]/.test(value)) return invalid();
  return value;
}

function stamp(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return invalid();
  return value;
}

export function projectFiscalAmazoniaIssuerAssessment(value: unknown): FiscalAmazoniaIssuerAssessment {
  const item = exact(value, ["status", "environment", "effectiveFrom", "assessedOn", "evidenceRefs"], ["effectiveTo", "requirements"]);
  const { environment, status } = item;
  if ((environment !== "DEMO" && environment !== "PRODUCTION") || !Array.isArray(item.evidenceRefs) ||
      item.evidenceRefs.length > 32) return invalid();
  const effectiveFrom = validateFiscalCivilDate(item.effectiveFrom, "FISCAL_AMAZONIA_ASSESSMENT_DATE_INVALID");
  const assessedOn = validateFiscalCivilDate(item.assessedOn, "FISCAL_AMAZONIA_ASSESSMENT_DATE_INVALID");
  const effectiveTo = item.effectiveTo === undefined ? undefined :
    validateFiscalCivilDate(item.effectiveTo, "FISCAL_AMAZONIA_ASSESSMENT_DATE_INVALID");
  const evidenceRefs = item.evidenceRefs.map(text);
  if ((effectiveTo && effectiveTo < effectiveFrom) || new Set(evidenceRefs).size !== evidenceRefs.length) return invalid();
  const scope: AssessmentScope = { environment, assessedOn, effectiveFrom, ...(effectiveTo ? { effectiveTo } : {}), evidenceRefs };
  if (status === "DISABLED" && item.requirements === undefined) return { ...scope, status };
  if (status !== "ENABLED" || evidenceRefs.length === 0) return invalid();
  const requirements = exact(item.requirements, ["domicileAndHeadOffice", "publicRegistration", "fixedAssets", "production"]);
  const fixedAssets = exact(requirements.fixedAssets, ["status", "basisPoints", "allProductionMeansInZone", "cutoffOn"]);
  const production = exact(requirements.production, ["status"]);
  const cutoffOn = validateFiscalCivilDate(fixedAssets.cutoffOn, "FISCAL_AMAZONIA_ASSESSMENT_DATE_INVALID");
  if (requirements.domicileAndHeadOffice !== "MET" || requirements.publicRegistration !== "MET" ||
      fixedAssets.status !== "MET" || fixedAssets.allProductionMeansInZone !== true ||
      typeof fixedAssets.basisPoints !== "number" || !Number.isSafeInteger(fixedAssets.basisPoints) ||
      fixedAssets.basisPoints < 7000 || fixedAssets.basisPoints > 10000 || cutoffOn > assessedOn ||
      (production.status !== "MET" && production.status !== "NOT_APPLICABLE")) return invalid();
  return { ...scope, status, requirements: {
    domicileAndHeadOffice: "MET", publicRegistration: "MET",
    fixedAssets: { status: "MET", basisPoints: fixedAssets.basisPoints, allProductionMeansInZone: true, cutoffOn },
    production: { status: production.status },
  } };
}

export function projectFiscalAmazoniaIssuerConfiguration(value: unknown): FiscalAmazoniaIssuerConfiguration {
  const root = exact(value, ["draft", "publishedDecisionIdByEnvironment", "decisionHistory"]);
  if (!Array.isArray(root.decisionHistory) || root.decisionHistory.length > 5000) return invalid();
  const published = exact(root.publishedDecisionIdByEnvironment, [], ["DEMO", "PRODUCTION"]);
  const ids = new Set<string>();
  const current: Partial<Record<FiscalV1Environment, string>> = {};
  const decisionHistory = root.decisionHistory.map(value => {
    const item = exact(value, ["decisionId", "operationId", "assessment", "reason", "publishedBy", "publishedAt"]);
    const decisionId = text(item.decisionId);
    if (ids.has(decisionId)) return invalid();
    ids.add(decisionId);
    const assessment = projectFiscalAmazoniaIssuerAssessment(item.assessment);
    current[assessment.environment] = decisionId;
    return { decisionId, assessment, operationId: text(item.operationId), reason: text(item.reason),
      publishedBy: text(item.publishedBy), publishedAt: stamp(item.publishedAt) };
  });
  if (published.DEMO !== current.DEMO || published.PRODUCTION !== current.PRODUCTION) return invalid();
  const draft = root.draft === null ? null : (() => {
    const item = exact(root.draft, ["operationId", "assessment", "reason", "updatedBy", "updatedAt"]);
    return { operationId: text(item.operationId), assessment: projectFiscalAmazoniaIssuerAssessment(item.assessment),
      reason: text(item.reason), updatedBy: text(item.updatedBy), updatedAt: stamp(item.updatedAt) };
  })();
  return { draft, publishedDecisionIdByEnvironment: current, decisionHistory };
}
