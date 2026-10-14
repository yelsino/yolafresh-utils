import type { FiscalCatalogSemanticInput, FiscalConfigurationActor, FiscalIssuerTaxPosture,
  FiscalIssuerTaxProfileDocument, FiscalPresentationConfigurationReference, FiscalPresentationTaxConfigurationDocument,
  FiscalPresentationTaxRule, FiscalResolvedPresentationTax, FiscalTaxConfigurationCommand,
  FiscalTaxConfigurationDocument, FiscalTaxConfigurationRoot, FiscalTaxEvidence, FiscalTaxResolutionSource } from "./configuracion-fiscal.contract";
import { FISCAL_ISSUER_TAX_PROFILE_TYPE, FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE } from "./configuracion-fiscal.contract";
import { validateFiscalCivilDate } from "./reglas-tributarias";

const fail = (code: string): never => { throw new Error(code); };
const object = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value)
  ? value as Record<string, any> : fail("FISCAL_CONFIGURATION_INVALID");
const opaque = (v: unknown): v is string => typeof v === "string" && !!v.trim();
const requireText = (v: unknown, code = "FISCAL_CONFIGURATION_TEXT_REQUIRED") => opaque(v) ? v : fail(code);
const time = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const hash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export function fiscalConfigurationCanonicalJson(v: unknown): string {
  const sort = (a: any): any => Array.isArray(a) ? a.map(sort) : a && typeof a === "object"
    ? Object.fromEntries(Object.keys(a).sort().filter(k => a[k] !== undefined).map(k => [k, sort(a[k])])) : a;
  return JSON.stringify(sort(v));
}
const pick = (v: Record<string, any>, fields: string[]) => Object.fromEntries(fields.filter(k => v[k] !== undefined).map(k => [k, v[k]]));
const EVIDENCE = ["effectiveFrom", "effectiveTo", "sourceReviewedAt", "evidenceReference"];
const RULE = [...EVIDENCE, "ruleId", "offerType", "unitCode", "catalogSemanticFingerprint", "tariffCode10", "physicalState",
  "compositionOrSpecies", "serviceDescription", "category", "affectationCode", "taxRateBasisPoints", "exemptionEligibility", "reviewQuestion"];
const POSTURE = [...EVIDENCE, "postureId", "posture", "resultingAffectationCode", "resultingTaxRateBasisPoints"];
const projectRule = (v: unknown, isPresentation: boolean) => {
  const r = object(v); return { ...pick(r, isPresentation ? RULE : POSTURE),
    ...(r.legalSource === undefined ? {} : {legalSource: pick(object(r.legalSource), ["uri", "title", "provision"])}) };
};
export function validateFiscalTaxEvidence(r: FiscalTaxEvidence): void {
  validateFiscalCivilDate(r.effectiveFrom, "FISCAL_EFFECTIVE_FROM_INVALID");
  if (r.effectiveTo !== undefined && validateFiscalCivilDate(r.effectiveTo, "FISCAL_EFFECTIVE_TO_INVALID") < r.effectiveFrom)
    fail("FISCAL_EFFECTIVE_RANGE_INVALID");
  if (r.sourceReviewedAt !== undefined) validateFiscalCivilDate(r.sourceReviewedAt, "FISCAL_SOURCE_REVIEW_DATE_INVALID");
  if (r.evidenceReference !== undefined) requireText(r.evidenceReference);
  if (r.legalSource === undefined) return;
  const s = object(r.legalSource);
  if (!["title", "provision", "uri"].some(key => s[key] !== undefined)) fail("FISCAL_LEGAL_SOURCE_INVALID");
  for (const key of ["title", "provision"]) if (s[key] !== undefined) requireText(s[key]);
  if (s.uri === undefined) return;
  let url: URL; try { url = new URL(requireText(s.uri)); } catch { return fail("FISCAL_LEGAL_SOURCE_INVALID"); }
  if (url.protocol !== "https:" || !["sunat.gob.pe", "www.sunat.gob.pe", "cpe.sunat.gob.pe", "emprender.sunat.gob.pe",
    "orientacion.sunat.gob.pe", "mef.gob.pe", "www.mef.gob.pe", "busquedas.elperuano.pe"].includes(url.hostname) || url.username || url.password)
    fail("FISCAL_LEGAL_SOURCE_NOT_OFFICIAL");
}
export function validateFiscalPresentationTaxRule(rule: FiscalPresentationTaxRule): void {
  const r = object(rule); validateFiscalTaxEvidence(rule); requireText(r.ruleId);
  if (!hash(r.catalogSemanticFingerprint)) fail("FISCAL_SEMANTIC_FINGERPRINT_REQUIRED");
  if (!["NIU", "KGM", "LTR", "ZZ"].includes(r.unitCode)) fail("FISCAL_UNIT_INVALID");
  if (r.offerType === "GOOD") {
    if (r.tariffCode10 !== undefined && !/^\d{10}$/.test(r.tariffCode10)) fail("FISCAL_TARIFF_REQUIRED");
    for (const key of ["physicalState", "compositionOrSpecies"]) if (r[key] !== undefined) requireText(r[key]);
    if (r.serviceDescription !== undefined) fail("FISCAL_GOOD_SERVICE_FIELDS_FORBIDDEN");
  } else if (r.offerType === "SERVICE") {
    if (r.serviceDescription !== undefined) requireText(r.serviceDescription);
    if (["tariffCode10", "physicalState", "compositionOrSpecies"].some(k => r[k] !== undefined)) fail("FISCAL_SERVICE_GOODS_FIELDS_FORBIDDEN");
  } else fail("FISCAL_OFFER_TYPE_REQUIRED");
  const valid = r.category === "GRAVADA" ? r.affectationCode === "10" && Number.isSafeInteger(r.taxRateBasisPoints) &&
      r.taxRateBasisPoints > 0 && r.taxRateBasisPoints <= 10000 && r.exemptionEligibility === "NOT_APPLICABLE"
    : r.category === "EXONERADA" ? r.affectationCode === "20" && r.taxRateBasisPoints === 0 &&
      r.exemptionEligibility === (r.offerType === "GOOD" ? "APPENDIX_I_ELIGIBLE" : "APPENDIX_II_ELIGIBLE")
    : r.category === "INAFECTA" ? r.affectationCode === "30" && r.taxRateBasisPoints === 0 && r.exemptionEligibility === "NOT_APPLICABLE"
    : r.category === "UNDETERMINED" && r.affectationCode === null && r.taxRateBasisPoints === null &&
      r.exemptionEligibility === "UNDETERMINED" && (r.reviewQuestion === undefined || opaque(r.reviewQuestion));
  if (!valid) fail("FISCAL_TAX_REPRESENTATION_MISMATCH");
}
export function validateFiscalIssuerTaxPosture(p: FiscalIssuerTaxPosture): void {
  validateFiscalTaxEvidence(p); requireText(p.postureId);
  if (p.posture === "RENOUNCED") {
    if (p.resultingAffectationCode !== "10" || !Number.isSafeInteger(p.resultingTaxRateBasisPoints) ||
      p.resultingTaxRateBasisPoints <= 0 || p.resultingTaxRateBasisPoints > 10000) fail("FISCAL_POSTURE_TAX_INVALID");
  } else if (!["NOT_RENOUNCED", "UNDETERMINED"].includes(p.posture) || p.resultingAffectationCode !== null ||
    p.resultingTaxRateBasisPoints !== null) fail("FISCAL_POSTURE_INVALID");
}
function validateCalendar(rules: readonly FiscalTaxEvidence[]): void {
  const ordered = [...rules].sort((a,b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  for (let i = 1; i < ordered.length; i++) if ((ordered[i-1].effectiveTo ?? "9999-12-31") >= ordered[i].effectiveFrom)
    fail("FISCAL_CALENDAR_OVERLAP");
}
/** Allowlist: una propiedad privada futura nunca llega al móvil por accidente. */
export function projectFiscalTaxConfigurationDocument(value: unknown): FiscalTaxConfigurationDocument {
  const r = object(value); const presentation = r.type === FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE;
  if (!presentation && r.type !== FISCAL_ISSUER_TAX_PROFILE_TYPE) fail("FISCAL_CONFIGURATION_TYPE_INVALID");
  if (!opaque(r._id) || (r._rev !== undefined && !opaque(r._rev)) || !opaque(r.tenantId) || !/^\d{11}$/.test(r.issuerRuc ?? "") ||
    !["ACTIVE", "SUSPENDED"].includes(r.status) || !opaque(r.creationOperationId) ||
    (r._conflicts !== undefined && (!Array.isArray(r._conflicts) || r._conflicts.length))) fail("FISCAL_CONFIGURATION_IDENTITY_INVALID");
  requireText(presentation ? r.presentationId : r.companyDocumentId);
  const audit = object(r.audit);
  if (!opaque(audit.createdBy) || !opaque(audit.updatedBy) || !time(audit.createdAt) || !time(audit.updatedAt) || audit.updatedAt < audit.createdAt)
    fail("FISCAL_CONFIGURATION_AUDIT_INVALID");
  if (!Array.isArray(r.decisionHistory) || !Array.isArray(r.operationReceipts) || r.decisionHistory.length > 5000 || r.operationReceipts.length > 10000)
    fail("FISCAL_CONFIGURATION_HISTORY_INVALID");
  const ids = new Set<string>();
  const rules = (values: unknown, published: boolean): any[] => {
    if (!Array.isArray(values) || !values.length || values.length > 1000) fail("FISCAL_CONFIGURATION_RULES_REQUIRED");
    const result: any[] = (values as unknown[]).map(v => projectRule(v, presentation));
    const ruleIds = new Set<string>();
    for (const rule of result) {
      if (presentation) validateFiscalPresentationTaxRule(rule); else validateFiscalIssuerTaxPosture(rule);
      const id = presentation ? rule.ruleId : rule.postureId;
      if (ruleIds.has(id)) fail("FISCAL_RULE_ID_DUPLICATED"); ruleIds.add(id);
      if (published && (rule.category === "UNDETERMINED" || rule.posture === "UNDETERMINED")) fail("FISCAL_DECISION_UNDETERMINED");
    }
    if (published) validateCalendar(result); return result;
  };
  const history = r.decisionHistory.map((value: unknown) => {
    const d = object(value); requireText(d.decisionId); requireText(d.operationId); requireText(d.reason); requireText(d.publishedBy);
    if (ids.has(d.decisionId) || !time(d.publishedAt)) fail("FISCAL_DECISION_HISTORY_INVALID"); ids.add(d.decisionId);
    return { ...pick(d, ["decisionId", "operationId", "reason", "publishedBy", "publishedAt"]), rules: rules(d.rules, true) };
  });
  if (!(r.publishedDecisionId === null && !history.length) && (!opaque(r.publishedDecisionId) ||
    history[history.length - 1]?.decisionId !== r.publishedDecisionId)) fail("FISCAL_PUBLISHED_DECISION_INVALID");
  const draft = r.draft === null ? null : (() => { const d = object(r.draft); requireText(d.operationId); requireText(d.reason);
    requireText(d.updatedBy); if (!time(d.updatedAt)) fail("FISCAL_DRAFT_AUDIT_INVALID");
    return { ...pick(d, ["operationId", "reason", "updatedBy", "updatedAt"]), rules: rules(d.rules, false) }; })();
  const receipts = r.operationReceipts.map((value: unknown) => { const op = object(value);
    requireText(op.operationId); requireText(op.actorId); if (!hash(op.contentSha256)) fail("FISCAL_OPERATION_HASH_INVALID");
    if (!["CREATE", "SAVE_DRAFT", "PUBLISH", "SET_STATUS"].includes(op.action) || !time(op.completedAt)) fail("FISCAL_OPERATION_INVALID");
    return pick(op, ["operationId", "action", "contentSha256", "actorId", "completedAt"]); });
  if (new Set(receipts.map((op: any) => op.operationId)).size !== receipts.length) fail("FISCAL_OPERATION_DUPLICATED");
  return { ...pick(r, ["_id", "_rev", "type", "tenantId", "issuerRuc", presentation ? "presentationId" : "companyDocumentId",
    "status", "creationOperationId", "publishedDecisionId"]), audit: pick(audit, ["createdBy", "createdAt", "updatedBy", "updatedAt"]),
    draft, decisionHistory: history, operationReceipts: receipts } as FiscalTaxConfigurationDocument;
}
export function fiscalCatalogSemanticFingerprintMaterial(input: FiscalCatalogSemanticInput): string {
  for (const key of ["tenantId", "presentationId", "productBaseId", "tipoVenta", "unidadContenido", "unidadBaseInventario"] as const) requireText(input[key]);
  if (![input.contenidoNeto, input.equivalenciaUnidadBase].every(v => typeof v === "number" && Number.isFinite(v) && v > 0) ||
    typeof input.fraccionable !== "boolean") fail("FISCAL_CATALOG_SEMANTICS_INVALID");
  return fiscalConfigurationCanonicalJson(pick(input, ["tenantId", "presentationId", "productBaseId", "tipoVenta", "unidadContenido",
    "contenidoNeto", "unidadBaseInventario", "equivalenciaUnidadBase", "fraccionable"]));
}
export function resolveFiscalPresentationReference(refs: readonly FiscalPresentationConfigurationReference[], issuerRuc: string): string {
  if (!Array.isArray(refs)) fail("FISCAL_CONFIGURATION_REFERENCE_REQUIRED");
  if (refs.some(r => !r || !opaque(r.issuerRuc) || !opaque(r.configurationDocumentId))) fail("FISCAL_CONFIGURATION_REFERENCE_INVALID");
  const matches = refs.filter(r => r.issuerRuc === issuerRuc);
  if (matches.length !== 1 || !opaque(matches[0].configurationDocumentId)) fail("FISCAL_CONFIGURATION_REFERENCE_AMBIGUOUS_OR_MISSING");
  return matches[0].configurationDocumentId;
}
/** Unidad de la cantidad vendida, no del contenido de un envase. */
export function fiscalCatalogExpectedUnitCode(input: FiscalCatalogSemanticInput, offerType: "GOOD" | "SERVICE"): "NIU" | "KGM" | "LTR" | "ZZ" {
  fiscalCatalogSemanticFingerprintMaterial(input);
  if (offerType === "SERVICE") return "ZZ";
  if (input.tipoVenta === "unidad") return "NIU";
  if (input.tipoVenta === "peso" && input.unidadBaseInventario === "kilogramo") return "KGM";
  if (input.tipoVenta === "volumen" && input.unidadBaseInventario === "litro") return "LTR";
  return fail("FISCAL_UNIT_CATALOG_MISMATCH");
}
/** Usa únicamente la publicación explícita; un borrador o una raíz huérfana jamás reemplazan una regla. */
export function resolveFiscalPresentationTax(input: {
  tenantId: string; issuerRuc: string; presentationId: string; taxableEventDate: string;
  configurationDocumentId: string; catalogSemanticFingerprint: string;
  configuration: FiscalPresentationTaxConfigurationDocument; issuerProfile: FiscalIssuerTaxProfileDocument;
}): FiscalResolvedPresentationTax {
  const c = projectFiscalTaxConfigurationDocument(input.configuration) as FiscalPresentationTaxConfigurationDocument;
  const p = projectFiscalTaxConfigurationDocument(input.issuerProfile) as FiscalIssuerTaxProfileDocument;
  if (c.type !== FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE || p.type !== FISCAL_ISSUER_TAX_PROFILE_TYPE ||
    c._id !== input.configurationDocumentId || c.presentationId !== input.presentationId ||
    [c,p].some(r => r.tenantId !== input.tenantId || r.issuerRuc !== input.issuerRuc)) fail("FISCAL_CONFIGURATION_SCOPE_MISMATCH");
  if ([c,p].some(r => r.status !== "ACTIVE" || !r.publishedDecisionId)) fail("FISCAL_CONFIGURATION_NOT_PUBLISHED_OR_SUSPENDED");
  const date = validateFiscalCivilDate(input.taxableEventDate, "FISCAL_TAX_EVENT_DATE_INVALID");
  const cd = c.decisionHistory.find(d => d.decisionId === c.publishedDecisionId)!;
  const pd = p.decisionHistory.find(d => d.decisionId === p.publishedDecisionId)!;
  const matching = cd.rules.filter(r => r.effectiveFrom <= date && date <= (r.effectiveTo ?? "9999-12-31"));
  if (matching.length !== 1) fail("FISCAL_RULE_NOT_EFFECTIVE"); const rule = matching[0];
  if (rule.catalogSemanticFingerprint !== input.catalogSemanticFingerprint) fail("FISCAL_CATALOG_RULE_OUTDATED");
  if (rule.category === "UNDETERMINED") return fail("FISCAL_DECISION_UNDETERMINED");
  let category = rule.category; let affectationCode: "10" | "20" | "30" = rule.affectationCode;
  let rateBasisPoints = rule.taxRateBasisPoints; let issuerPostureId: string | null = null;
  if (rule.category === "EXONERADA" && rule.offerType === "GOOD") {
    const postures = pd.rules.filter(r => r.effectiveFrom <= date && date <= (r.effectiveTo ?? "9999-12-31"));
    if (postures.length !== 1 || postures[0].posture === "UNDETERMINED") fail("FISCAL_ISSUER_POSTURE_NOT_EFFECTIVE");
    const posture = postures[0]; issuerPostureId = posture.postureId;
    if (posture.posture === "RENOUNCED") { category = "GRAVADA"; affectationCode = "10"; rateBasisPoints = posture.resultingTaxRateBasisPoints; }
  }
  return { tenantId: input.tenantId, issuerRuc: input.issuerRuc, presentationId: input.presentationId, taxableEventDate: date,
    category, affectationCode, rateBasisPoints, unitCode: rule.unitCode, source: {
      configurationDocumentId: c._id, decisionId: cd.decisionId, ruleId: rule.ruleId,
      issuerProfileDocumentId: p._id, issuerDecisionId: pd.decisionId, issuerPostureId,
      taxableEventDate: date, catalogSemanticFingerprint: rule.catalogSemanticFingerprint } };
}
export function validateFiscalTaxResolutionSource(value: unknown): value is FiscalTaxResolutionSource {
  try { const s = object(value); for (const key of ["configurationDocumentId", "decisionId", "ruleId", "issuerProfileDocumentId", "issuerDecisionId"]) requireText(s[key]);
    if (Object.keys(s).some(k => !["configurationDocumentId", "decisionId", "ruleId", "issuerProfileDocumentId", "issuerDecisionId",
      "issuerPostureId", "taxableEventDate", "catalogSemanticFingerprint"].includes(k))) return false;
    if (s.issuerPostureId !== null && !opaque(s.issuerPostureId)) return false;
    validateFiscalCivilDate(s.taxableEventDate, "FISCAL_SOURCE_DATE_INVALID"); return hash(s.catalogSemanticFingerprint);
  } catch { return false; }
}
/** Actor/reloj vienen del caso de uso. La revisión es CAS, no una fecha del teléfono. */
export function applyFiscalTaxConfigurationCommand<Root extends FiscalTaxConfigurationRoot<any> & { type: string }>(
  root: Root, command: FiscalTaxConfigurationCommand<Root["decisionHistory"][number]["rules"][number]>, actor: FiscalConfigurationActor, now: number, contentSha256: string,
): Root {
  projectFiscalTaxConfigurationDocument(root); requireText(command.operationId);
  if (actor.tenantId !== root.tenantId || !opaque(actor.actorId) || !actor.canEdit || (command.action === "PUBLISH" && !actor.canPublish)) fail("FISCAL_CONFIGURATION_FORBIDDEN");
  if (!hash(contentSha256)) fail("FISCAL_OPERATION_HASH_INVALID");
  const previous = root.operationReceipts.find(r => r.operationId === command.operationId);
  if (previous) { if (previous.contentSha256 !== contentSha256 || previous.actorId !== actor.actorId) fail("FISCAL_OPERATION_CONTENT_CONFLICT"); return projectFiscalTaxConfigurationDocument(root) as unknown as Root; }
  if ((root._rev ?? null) !== command.expectedRevision) fail("FISCAL_CONFIGURATION_REVISION_CONFLICT");
  if (!time(now) || now < root.audit.updatedAt) fail("FISCAL_CONFIGURATION_CLOCK_INVALID");
  const next = clone(root);
  if (command.action === "SAVE_DRAFT") next.draft = { operationId: command.operationId, rules: clone(command.rules), reason: command.reason, updatedBy: actor.actorId, updatedAt: now };
  else if (command.action === "PUBLISH") {
    requireText(command.decisionId); if (!next.draft) fail("FISCAL_DRAFT_REQUIRED");
    if (next.decisionHistory.some(d => d.decisionId === command.decisionId)) fail("FISCAL_DECISION_ID_DUPLICATED");
    next.decisionHistory.push({ decisionId: command.decisionId, operationId: command.operationId, reason: next.draft!.reason,
      publishedBy: actor.actorId, publishedAt: now, rules: clone(next.draft!.rules) });
    next.publishedDecisionId = command.decisionId; next.draft = null;
  } else if (command.action === "SET_STATUS") { requireText(command.reason); next.status = command.status; }
  else fail("FISCAL_CONFIGURATION_COMMAND_INVALID");
  next.audit.updatedBy = actor.actorId; next.audit.updatedAt = now;
  next.operationReceipts.push({ operationId: command.operationId, action: command.action, contentSha256, actorId: actor.actorId, completedAt: now });
  return projectFiscalTaxConfigurationDocument(next) as unknown as Root;
}

export function createFiscalTaxConfiguration(input: { _id: string; type: typeof FISCAL_ISSUER_TAX_PROFILE_TYPE;
  tenantId: string; issuerRuc: string; companyDocumentId: string; operationId: string } | {
  _id: string; type: typeof FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE; tenantId: string;
  issuerRuc: string; presentationId: string; operationId: string }, actor: FiscalConfigurationActor, now: number,
  contentSha256: string): FiscalTaxConfigurationDocument {
  if (actor.tenantId !== input.tenantId || !opaque(actor.actorId) || !actor.canEdit) fail("FISCAL_CONFIGURATION_FORBIDDEN");
  if (!time(now) || !hash(contentSha256)) fail("FISCAL_CONFIGURATION_CREATE_INVALID");
  const { operationId, ...identity } = input; requireText(operationId);
  return projectFiscalTaxConfigurationDocument({ ...identity, status: "ACTIVE", creationOperationId: operationId,
    audit: { createdBy: actor.actorId, createdAt: now, updatedBy: actor.actorId, updatedAt: now },
    draft: null, publishedDecisionId: null, decisionHistory: [], operationReceipts: [{ operationId,
      action: "CREATE", contentSha256, actorId: actor.actorId, completedAt: now }] });
}

/** Verifica actualización remota sin permitir alterar identidad, creador ni historial publicado. */
export function validateFiscalTaxConfigurationTransition(previous: FiscalTaxConfigurationDocument, next: FiscalTaxConfigurationDocument): void {
  projectFiscalTaxConfigurationDocument(previous); projectFiscalTaxConfigurationDocument(next);
  for (const key of ["_id", "type", "tenantId", "issuerRuc", "creationOperationId", "presentationId", "companyDocumentId"] as const)
    if ((previous as any)[key] !== (next as any)[key]) fail("FISCAL_CONFIGURATION_IDENTITY_IMMUTABLE");
  if (previous.audit.createdAt !== next.audit.createdAt || previous.audit.createdBy !== next.audit.createdBy || previous.audit.updatedAt > next.audit.updatedAt)
    fail("FISCAL_CONFIGURATION_CREATION_IMMUTABLE");
  for (const field of ["decisionHistory", "operationReceipts"] as const) {
    if (next[field].length < previous[field].length || fiscalConfigurationCanonicalJson(next[field].slice(0, previous[field].length)) !==
      fiscalConfigurationCanonicalJson(previous[field])) fail("FISCAL_CONFIGURATION_HISTORY_IMMUTABLE");
  }
}
