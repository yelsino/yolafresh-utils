/** Reglas de empresa fiscal compartidas; sin red, reloj implícito ni almacenamiento. */
import type { ConfigEmpresa, EntornoEmisionFiscal, FiscalCompanyTaxRegimeDecision,
  RegimenTributarioEmpresa } from "../../shared/kernel/empresa.contract";
import { isFiscalTaxRegime } from "./cpe.contract";
import { fiscalConfigurationCanonicalJson } from "./configuracion-fiscal";
import type { FiscalV1Environment, FiscalV1IssuerProfile } from "./modulo-fiscal-v1.contract";
import { assertFiscalV1IssuerAuthority, fiscalV1PublicationArtifactFingerprint } from "./modulo-fiscal-v1";
import { validateFiscalCivilDate } from "./reglas-tributarias";

function fail(code: string): never { throw new Error(code); }
const text = (value: unknown): value is string => typeof value === "string" &&
  value.trim().length > 0 && value.trim() === value;

/** El servidor fija decisionId=operationId, actor y hora; no se aceptan del caller. */
export interface FiscalCompanyTaxRegimeCommand {
  readonly companyDocumentId: string;
  readonly expectedCompanyRevision: string;
  readonly operationId: string;
  readonly regimenTributario: RegimenTributarioEmpresa;
  readonly effectiveFrom: string;
  readonly supersedesDecisionId?: string;
  readonly reason?: string;
}

/** Payload remoto: _id es canónico; no requiere el id de la proyección SQLite. */
export type FiscalCompanyConfigurationDocument = Omit<ConfigEmpresa, "id"> & Readonly<{
  _id: string; _rev: string; id?: string;
}>;

export interface FiscalCompanyTaxRegimeCommandResponse {
  readonly ok: true;
  readonly configuration: FiscalCompanyConfigurationDocument;
}

export function assertFiscalCompanyTaxRegimeCommand(value: unknown): asserts value is FiscalCompanyTaxRegimeCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("FISCAL_COMPANY_REGIME_COMMAND_INVALID");
  const row = value as FiscalCompanyTaxRegimeCommand;
  const keys = Object.keys(row);
  if (["companyDocumentId", "expectedCompanyRevision", "operationId", "regimenTributario", "effectiveFrom"]
    .some(key => !keys.includes(key)) || keys.some(key => !["companyDocumentId", "expectedCompanyRevision",
      "operationId", "regimenTributario", "effectiveFrom", "supersedesDecisionId", "reason"].includes(key)) ||
    ![row.companyDocumentId, row.expectedCompanyRevision, row.operationId].every(text) ||
    !isFiscalTaxRegime(row.regimenTributario) || (row.reason !== undefined && !text(row.reason)))
    fail("FISCAL_COMPANY_REGIME_COMMAND_INVALID");
  validateFiscalCivilDate(row.effectiveFrom, "FISCAL_COMPANY_REGIME_DATE_INVALID");
  if (row.supersedesDecisionId !== undefined && (!text(row.supersedesDecisionId) || !text(row.reason)))
    fail("FISCAL_COMPANY_REGIME_CORRECTION_REASON_REQUIRED");
}

export type FiscalCompanyTaxRegimeResolution =
  | Readonly<{ status: "EFFECTIVE"; regimenTributario: RegimenTributarioEmpresa;
      decisionId: string; effectiveFrom: string; effectiveTo?: string }>
  | Readonly<{ status: "DECLARED_UNDATED"; regimenTributario: RegimenTributarioEmpresa }>
  | Readonly<{ status: "MISSING" }>
  | Readonly<{ status: "NOT_EFFECTIVE"; firstEffectiveFrom: string }>;

/** Resultado de una comprobación externa explícita; no es otro documento de empresa. */
export interface FiscalConfigurationReadiness {
  readonly ok: true;
  readonly provider: "XmlPeru";
  readonly tenantId: string;
  readonly issuerRuc: string;
  readonly issuerLegalName: string;
  readonly environment: FiscalV1Environment;
  readonly checkedAtMs: number;
  readonly regime: FiscalCompanyTaxRegimeResolution;
  readonly providerConnection: Readonly<{
    status: "VERIFIED" | "UNVERIFIED" | "NOT_CONFIGURED"; code?: string;
  }>;
  /** Habilitación comprobada en backend; no prueba que un documento haya sido aceptado. */
  readonly emissionEnabled: boolean;
  readonly documents: readonly Readonly<{
    documentType: "BOLETA" | "FACTURA";
    ready: boolean;
    code?: string;
    series?: string;
    creditNoteSeries?: string;
    publicationSha256?: string;
  }>[];
}

/** Traducción explícita; ausencia o valor desconocido nunca eligen un destino. */
export function toFiscalV1Environment(value: unknown): FiscalV1Environment | null {
  return value === "DEMO" ? "DEMO" : value === "PRODUCCION" ? "PRODUCTION" : null;
}

export function toCompanyFiscalEmissionEnvironment(value: unknown): EntornoEmisionFiscal | null {
  return value === "DEMO" ? "DEMO" : value === "PRODUCTION" ? "PRODUCCION" : null;
}

/** Valida el registro completo; ni el orden recibido ni updatedAt deciden la vigencia. */
export function assertFiscalCompanyTaxRegimeDecisions(value: unknown): asserts value is readonly FiscalCompanyTaxRegimeDecision[] {
  if (!Array.isArray(value)) fail("FISCAL_COMPANY_REGIME_CALENDAR_INVALID");
  const byId = new Map<string, FiscalCompanyTaxRegimeDecision>();
  const replaced = new Set<string>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
      fail("FISCAL_COMPANY_REGIME_DECISION_INVALID");
    const row = candidate as FiscalCompanyTaxRegimeDecision;
    const keys = Object.keys(row);
    if (["decisionId", "regimenTributario", "effectiveFrom", "recordedAtMs", "recordedBy"]
      .some(key => !keys.includes(key)) || keys.some(key => !["decisionId", "regimenTributario",
        "effectiveFrom", "recordedAtMs", "recordedBy", "supersedesDecisionId", "reason"].includes(key)) ||
      !text(row.decisionId) || !isFiscalTaxRegime(row.regimenTributario) || !text(row.recordedBy) ||
      !Number.isSafeInteger(row.recordedAtMs) || row.recordedAtMs < 0 ||
      (row.reason !== undefined && !text(row.reason))) fail("FISCAL_COMPANY_REGIME_DECISION_INVALID");
    validateFiscalCivilDate(row.effectiveFrom, "FISCAL_COMPANY_REGIME_DATE_INVALID");
    if (byId.has(row.decisionId)) fail("FISCAL_COMPANY_REGIME_DECISION_DUPLICATED");
    if (row.supersedesDecisionId !== undefined) {
      if (!text(row.supersedesDecisionId) || !text(row.reason))
        fail("FISCAL_COMPANY_REGIME_CORRECTION_REASON_REQUIRED");
      const previous = byId.get(row.supersedesDecisionId);
      if (!previous || replaced.has(previous.decisionId) || previous.effectiveFrom !== row.effectiveFrom ||
        row.recordedAtMs < previous.recordedAtMs) fail("FISCAL_COMPANY_REGIME_CORRECTION_INVALID");
      replaced.add(previous.decisionId);
    }
    byId.set(row.decisionId, row);
  }
  const starts = new Set<string>();
  for (const row of byId.values()) {
    if (replaced.has(row.decisionId)) continue;
    if (starts.has(row.effectiveFrom)) fail("FISCAL_COMPANY_REGIME_EFFECTIVE_DATE_AMBIGUOUS");
    starts.add(row.effectiveFrom);
  }
}

function activeDecisions(value: readonly FiscalCompanyTaxRegimeDecision[]): FiscalCompanyTaxRegimeDecision[] {
  const replaced = new Set(value.flatMap(row => row.supersedesDecisionId ? [row.supersedesDecisionId] : []));
  return value.filter(row => !replaced.has(row.decisionId)).sort((left, right) =>
    left.effectiveFrom.localeCompare(right.effectiveFrom));
}

function fiscalPart(config: unknown): Record<string, unknown> | null {
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const fiscal = (config as Record<string, unknown>).fiscal;
  return fiscal && typeof fiscal === "object" && !Array.isArray(fiscal)
    ? fiscal as Record<string, unknown> : null;
}

/** Sin calendario se conserva la declaración antigua, pero no se inventa una fecha para emitir. */
export function resolveFiscalCompanyTaxRegime(config: unknown, occurredOn: string): FiscalCompanyTaxRegimeResolution {
  validateFiscalCivilDate(occurredOn, "FISCAL_COMPANY_REGIME_DATE_INVALID");
  const fiscal = fiscalPart(config);
  if (!fiscal) return { status: "MISSING" };
  if (fiscal.regimenTributarioVigencias === undefined) return isFiscalTaxRegime(fiscal.regimenTributario)
    ? { status: "DECLARED_UNDATED", regimenTributario: fiscal.regimenTributario } : { status: "MISSING" };
  assertFiscalCompanyTaxRegimeDecisions(fiscal.regimenTributarioVigencias);
  const calendar = activeDecisions(fiscal.regimenTributarioVigencias);
  if (!calendar.length) return { status: "MISSING" };
  const index = calendar.findIndex((row, next) => row.effectiveFrom <= occurredOn &&
    (next === calendar.length - 1 || calendar[next + 1].effectiveFrom > occurredOn));
  if (index < 0) return { status: "NOT_EFFECTIVE", firstEffectiveFrom: calendar[0].effectiveFrom };
  const selected = calendar[index], next = calendar[index + 1];
  const effectiveTo = next ? new Date(new Date(`${next.effectiveFrom}T00:00:00.000Z`).getTime() - 86_400_000)
    .toISOString().slice(0, 10) : undefined;
  return { status: "EFFECTIVE", regimenTributario: selected.regimenTributario,
    decisionId: selected.decisionId, effectiveFrom: selected.effectiveFrom,
    ...(effectiveTo ? { effectiveTo } : {}) };
}

/** Añade una decisión o recupera el mismo operationId; no modifica la historia existente. */
export function appendFiscalCompanyTaxRegimeDecision(existing: readonly FiscalCompanyTaxRegimeDecision[] | undefined,
  decision: FiscalCompanyTaxRegimeDecision): readonly FiscalCompanyTaxRegimeDecision[] {
  const rows = existing ?? [];
  assertFiscalCompanyTaxRegimeDecisions(rows);
  const previous = rows.find(row => row.decisionId === decision?.decisionId);
  if (previous) {
    if (fiscalConfigurationCanonicalJson(previous) !== fiscalConfigurationCanonicalJson(decision))
      fail("FISCAL_COMPANY_REGIME_OPERATION_CONFLICT");
    return rows.map(row => ({ ...row }));
  }
  const result = [...rows, { ...decision }];
  assertFiscalCompanyTaxRegimeDecisions(result);
  return result;
}

export interface FiscalV1CompanyIssuerProfileInput {
  readonly company: Pick<ConfigEmpresa, "empresa" | "fiscal">;
  /** Fijada por la autoridad backend; no es otro maestro editable. */
  readonly authority: Readonly<{ tenantId: string; issuerId: string; issuerRuc: string;
    environment: FiscalV1Environment; establishmentId: string; establishmentCode: string }>;
  readonly publication: Readonly<Pick<FiscalV1IssuerProfile, "profileId" | "profileVersion" | "status" |
    "effectiveFrom" | "effectiveTo" | "publishedAt" | "sourceRef" | "see" | "adapterVersion">>;
}

/** Deriva identidad y régimen; no firma, publica, concede capacidad ni consulta SUNAT. */
export function deriveFiscalV1IssuerProfileFromCompany(input: FiscalV1CompanyIssuerProfileInput): FiscalV1IssuerProfile {
  const { company, authority, publication } = input;
  const regime = resolveFiscalCompanyTaxRegime(company, publication.effectiveFrom);
  if (regime.status !== "EFFECTIVE") fail("FISCAL_COMPANY_REGIME_EFFECTIVE_REQUIRED");
  if (!company || !company.empresa || !company.fiscal ||
    company.empresa.ruc !== authority.issuerRuc || !text(company.empresa.razonSocial) ||
    toFiscalV1Environment(company.fiscal.entornoEmision) !== authority.environment ||
    company.fiscal.codigoEstablecimiento !== authority.establishmentCode ||
    !text(authority.establishmentCode)) fail("FISCAL_COMPANY_ISSUER_AUTHORITY_MISMATCH");
  if (publication.effectiveTo !== undefined)
    validateFiscalCivilDate(publication.effectiveTo, "FISCAL_COMPANY_REGIME_DATE_INVALID");
  if (regime.effectiveTo && (!publication.effectiveTo || publication.effectiveTo > regime.effectiveTo))
    fail("FISCAL_COMPANY_REGIME_PUBLICATION_RANGE_MISMATCH");
  const profile: FiscalV1IssuerProfile = { status: publication.status, profileId: publication.profileId,
    profileVersion: publication.profileVersion, effectiveFrom: publication.effectiveFrom,
    ...(publication.effectiveTo !== undefined ? { effectiveTo: publication.effectiveTo } : {}),
    publishedAt: publication.publishedAt, sourceRef: publication.sourceRef, see: publication.see,
    adapterVersion: publication.adapterVersion, tenantId: authority.tenantId,
    issuerId: authority.issuerId, issuerRuc: authority.issuerRuc, issuerLegalName: company.empresa.razonSocial,
    taxRegime: regime.regimenTributario, environment: authority.environment,
    establishmentId: authority.establishmentId, provider: "XmlPeru", fingerprintSha256: "0".repeat(64) };
  assertFiscalV1IssuerAuthority([profile]);
  return { ...profile, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(profile) };
}
