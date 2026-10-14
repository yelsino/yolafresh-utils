import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as rootExports from "../../../index";
import * as fiscalExports from "../index";
import { applyFiscalTaxConfigurationCommand, createFiscalTaxConfiguration, fiscalConfigurationCanonicalJson,
  fiscalCatalogSemanticFingerprintMaterial, fiscalCatalogExpectedUnitCode, projectFiscalTaxConfigurationDocument, resolveFiscalPresentationTax,
  validateFiscalTaxResolutionSource,
  resolveFiscalPresentationReference, validateFiscalPresentationTaxRule, validateFiscalTaxConfigurationTransition,
  FISCAL_ISSUER_TAX_PROFILE_TYPE, FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE,
  type FiscalConfigurationActor, type FiscalIssuerTaxProfileDocument, type FiscalPresentationTaxConfigurationDocument,
  type FiscalPresentationTaxRule } from "../contracts";
const actor: FiscalConfigurationActor = { tenantId: "synthetic", actorId: "operator", canEdit: true, canPublish: true };
const digest = (v: unknown) => createHash("sha256").update(fiscalConfigurationCanonicalJson(v)).digest("hex");
const evidence = { effectiveFrom: "2026-10-01", sourceReviewedAt: "2026-10-01", evidenceReference: "synthetic-evidence",
  legalSource: { uri: "https://www.sunat.gob.pe/legislacion/igv/ley/", title: "Synthetic source", provision: "Synthetic provision" } };
const semantics = { tenantId: "synthetic", presentationId: "presentation", productBaseId: "base", tipoVenta: "peso",
  unidadContenido: "kilogramo", contenidoNeto: 1, unidadBaseInventario: "kilogramo", equivalenciaUnidadBase: 1, fraccionable: true };
test("public root and fiscal subpath export the same current business contracts", () => {
  for (const api of [rootExports, fiscalExports]) {
    assert.equal(api.FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE, "fiscal_presentation_tax_configuration");
    assert.equal(api.FISCAL_ISSUER_TAX_PROFILE_TYPE, "fiscal_issuer_tax_profile");
    assert.equal(api.resolveFiscalPresentationTax, resolveFiscalPresentationTax);
    assert.equal(api.applyFiscalTaxConfigurationCommand, applyFiscalTaxConfigurationCommand);
  }
});
const fingerprint = createHash("sha256").update(fiscalCatalogSemanticFingerprintMaterial(semantics)).digest("hex");
for (const [tipoVenta,base,contenido,expected] of [
  ["unidad","litro","mililitro","NIU"],["unidad","kilogramo","gramo","NIU"],["peso","kilogramo","gramo","KGM"],
  ["volumen","litro","mililitro","LTR"],
] as const) test(`fiscal quantity follows sale mode ${tipoVenta}, not container content ${contenido}`,()=>{
  assert.equal(fiscalCatalogExpectedUnitCode({...semantics,tipoVenta,unidadBaseInventario:base,unidadContenido:contenido},"GOOD"),expected);
});
for(const [tipoVenta,unidadBaseInventario] of [["peso","unidad"],["volumen","kilogramo"],["unrecognized","unidad"]])
  test(`rejects unsupported fiscal sale unit ${tipoVenta}/${unidadBaseInventario}`,()=>assert.throws(()=>fiscalCatalogExpectedUnitCode({...semantics,tipoVenta,unidadBaseInventario},"GOOD"),/UNIT_CATALOG/));
test("a service uses its supported fiscal service unit",()=>assert.equal(fiscalCatalogExpectedUnitCode(semantics,"SERVICE"),"ZZ"));
test("resolution trace rejects private extensions and invalid civil dates",()=>{
  const {c,p}=roots();const source=resolve(c,p).source;assert.equal(validateFiscalTaxResolutionSource(source),true);
  for(const invalid of [{...source,certificate:"secret"},{...source,taxableEventDate:"2026-02-30"},{...source,configurationDocumentId:""},{...source,catalogSemanticFingerprint:"abc"}])assert.equal(validateFiscalTaxResolutionSource(invalid),false);
});
const rule = (): Extract<FiscalPresentationTaxRule, { category: "GRAVADA"; offerType: "GOOD" }> => ({ ...evidence, legalSource: { ...evidence.legalSource }, ruleId: "rule", offerType: "GOOD", unitCode: "KGM",
  catalogSemanticFingerprint: fingerprint, tariffCode10: "0000000000", physicalState: "fixture", compositionOrSpecies: "fixture",
  category: "GRAVADA", affectationCode: "10", taxRateBasisPoints: 1800, exemptionEligibility: "NOT_APPLICABLE" });
const minimalRule = () => {
  const {legalSource,sourceReviewedAt,evidenceReference,tariffCode10,physicalState,compositionOrSpecies,...operational} = rule();
  return operational;
};
test("operational configuration publishes and resolves without documentary details", () => {
  const {c,p} = roots();
  const draft = {action:"SAVE_DRAFT" as const,operationId:"minimal-draft",expectedRevision:null,reason:"Treatment configured",rules:[minimalRule()]};
  const saved = applyFiscalTaxConfigurationCommand(c,draft,actor,4,digest(draft));
  const publish = {action:"PUBLISH" as const,operationId:"minimal-publish",expectedRevision:null,decisionId:"minimal-decision"};
  const published = applyFiscalTaxConfigurationCommand(saved,publish,actor,5,digest(publish));
  assert.equal(resolve(published,p).rateBasisPoints,1800);
  assert.equal(published.audit.createdBy,c.audit.createdBy);
  assert.equal(published.decisionHistory.length,2);
  assert.equal("legalSource" in published.decisionHistory[1].rules[0],false);
});
test("exempt and unaffected operational rules do not require tariff or a legal URL", () => {
  for(const category of ["EXONERADA","INAFECTA"] as const){
    const {c,p}=roots();
    const assessment=category==="EXONERADA" ? {category:"EXONERADA" as const,affectationCode:"20" as const,taxRateBasisPoints:0 as const,exemptionEligibility:"APPENDIX_I_ELIGIBLE" as const}
      : {category:"INAFECTA" as const,affectationCode:"30" as const,taxRateBasisPoints:0 as const,exemptionEligibility:"NOT_APPLICABLE" as const};
    const configured={...minimalRule(),...assessment};
    c.decisionHistory[0].rules=[configured];
    assert.equal(resolve(c,p).category,category);
  }
});
test("an optional detail remains validated when explicitly supplied", () => {
  for(const details of [{tariffCode10:"123"},{tariffCode10:null},{physicalState:""},{compositionOrSpecies:7},{sourceReviewedAt:"2026-02-30"},
    {legalSource:{uri:"https://example.com/not-official"}},{legalSource:{}},{evidenceReference:""}]){
    assert.throws(()=>validateFiscalPresentationTaxRule({...minimalRule(),...details} as any));
  }
  validateFiscalPresentationTaxRule({...minimalRule(),legalSource:{uri:evidence.legalSource.uri}});
});
test("a reviewable draft can be incomplete, but never becomes a published zero-rate rule", () => {
  const {c}=roots();
  const draft={action:"SAVE_DRAFT" as const,operationId:"review-minimal",expectedRevision:null,reason:"Pending classification",
    rules:[{...minimalRule(),category:"UNDETERMINED" as const,affectationCode:null,taxRateBasisPoints:null,exemptionEligibility:"UNDETERMINED" as const}]};
  const saved=applyFiscalTaxConfigurationCommand(c,draft,actor,4,digest(draft));
  const publish={action:"PUBLISH" as const,operationId:"review-publish",expectedRevision:null,decisionId:"review-decision"};
  assert.throws(()=>applyFiscalTaxConfigurationCommand(saved,publish,actor,5,digest(publish)),/UNDETERMINED/);
});
test("optional source projection retains only documented fields, not private extensions", () => {
  const {c}=roots();c.decisionHistory[0].rules=[{...minimalRule(),legalSource:{uri:evidence.legalSource.uri,token:"secret"}} as any];
  const projected=projectFiscalTaxConfigurationDocument(c) as FiscalPresentationTaxConfigurationDocument;
  assert.deepEqual(projected.decisionHistory[0].rules[0].legalSource,{uri:evidence.legalSource.uri});
  assert.equal(JSON.stringify(projected).includes("secret"),false);
});
function roots() {
  let c = createFiscalTaxConfiguration({ _id: " config / Unicode ñ ", type: FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE,
    tenantId: actor.tenantId, issuerRuc: "20123456789", presentationId: "presentation", operationId: "create" }, actor, 1, digest("create")) as FiscalPresentationTaxConfigurationDocument;
  let p = createFiscalTaxConfiguration({ _id: "issuer opaque", type: FISCAL_ISSUER_TAX_PROFILE_TYPE, tenantId: actor.tenantId,
    issuerRuc: c.issuerRuc, companyDocumentId: "company", operationId: "create-profile" }, actor, 1, digest("create-profile")) as FiscalIssuerTaxProfileDocument;
  const command = { action: "SAVE_DRAFT" as const, operationId: "save", expectedRevision: null, rules: [rule()], reason: "initial" };
  c = applyFiscalTaxConfigurationCommand(c, command, actor, 2, digest(command));
  const publish = { action: "PUBLISH" as const, operationId: "publish", expectedRevision: null, decisionId: "decision" };
  c = applyFiscalTaxConfigurationCommand(c, publish, actor, 3, digest(publish));
  const posture = { action: "SAVE_DRAFT" as const, operationId: "save-profile", expectedRevision: null, reason: "issuer", rules: [{
    ...evidence, postureId: "posture", posture: "NOT_RENOUNCED" as const, resultingAffectationCode: null, resultingTaxRateBasisPoints: null }] };
  p = applyFiscalTaxConfigurationCommand(p, posture, actor, 2, digest(posture));
  const pp = { ...publish, operationId: "publish-profile", decisionId: "issuer-decision" };
  p = applyFiscalTaxConfigurationCommand(p, pp, actor, 3, digest(pp));
  return { c, p };
}
function resolve(c: FiscalPresentationTaxConfigurationDocument, p: FiscalIssuerTaxProfileDocument, date = "2026-10-11") {
  return resolveFiscalPresentationTax({ tenantId: actor.tenantId, issuerRuc: c.issuerRuc, presentationId: "presentation", taxableEventDate: date,
    configurationDocumentId: c._id, catalogSemanticFingerprint: fingerprint, configuration: c, issuerProfile: p });
}
test("opaque Couch identity, basic audit and immutable decisions", () => {
  const { c,p } = roots(); assert.equal((c as any).id, undefined); assert.equal(c.audit.createdBy, actor.actorId);
  assert.equal(resolve(c,p).source.decisionId, "decision"); assert.equal(c.decisionHistory.length, 1);
  assert.equal(c.draft, null); assert.equal(projectFiscalTaxConfigurationDocument(c)._id, c._id);
});
const invalidRoot: [string, (v: any) => void][] = [
  ["missing _id", v => delete v._id], ["missing type", v => delete v.type], ["legacy type", v => v.type = "fiscal_tax_profile_v2"],
  ["empty tenant", v => v.tenantId = ""], ["bad RUC", v => v.issuerRuc = "bad"], ["missing presentation", v => delete v.presentationId],
  ["conflicted", v => v._conflicts = ["other"]], ["bad status", v => v.status = "DRAFT"],
  ["missing author", v => v.audit.createdBy = ""], ["negative timestamp", v => v.audit.updatedAt = -1],
  ["missing pointer", v => delete v.publishedDecisionId], ["wrong pointer", v => v.publishedDecisionId = "other"],
  ["erased history", v => v.decisionHistory = []], ["duplicate decision", v => v.decisionHistory.push(v.decisionHistory[0])],
  ["missing receipts", v => delete v.operationReceipts], ["receipt invalid", v => v.operationReceipts[0].contentSha256 = "a"],
];
for (const [name, mutate] of invalidRoot) test(`rejects root: ${name}`, () => { const { c } = roots(); mutate(c); assert.throws(() => projectFiscalTaxConfigurationDocument(c)); });
const invalidRules: [string, (v: any) => void][] = [
  ["unknown category", v => v.category = "0"], ["wrong code", v => v.affectationCode = "20"], ["zero taxed rate", v => v.taxRateBasisPoints = 0],
  ["negative rate", v => v.taxRateBasisPoints = -1], ["fractional rate", v => v.taxRateBasisPoints = 1.5], ["huge rate", v => v.taxRateBasisPoints = 10001],
  ["missing nature", v => delete v.offerType], ["unknown nature", v => v.offerType = "PRODUCT"], ["wrong tariff", v => v.tariffCode10 = "1"],
  ["missing state", v => v.physicalState = ""], ["missing composition", v => v.compositionOrSpecies = ""],
  ["good/service collision", v => v.serviceDescription = "fixture"], ["missing unit", v => delete v.unitCode], ["unknown unit", v => v.unitCode = "KG"],
  ["missing fingerprint", v => delete v.catalogSemanticFingerprint], ["bad fingerprint", v => v.catalogSemanticFingerprint = "hash"],
  ["bad date", v => v.effectiveFrom = "2026-02-30"], ["reverse range", v => v.effectiveTo = "2025-01-01"],
  ["bad review date", v => v.sourceReviewedAt = "2026-13-01"], ["missing evidence", v => v.evidenceReference = ""],
  ["private source", v => v.legalSource.uri = "https://provider.invalid/x"], ["http source", v => v.legalSource.uri = "http://www.sunat.gob.pe/x"],
  ["empty title", v => v.legalSource.title = ""], ["wrong eligibility", v => v.exemptionEligibility = "APPENDIX_I_ELIGIBLE"],
  ["exempt nonzero", v => { v.category = "EXONERADA"; v.affectationCode = "20"; v.exemptionEligibility = "APPENDIX_I_ELIGIBLE"; }],
  ["unaffected nonzero", v => { v.category = "INAFECTA"; v.affectationCode = "30"; }],
  ["pending fake zero", v => { v.category = "UNDETERMINED"; v.taxRateBasisPoints = 0; }],
];
for (const [name, mutate] of invalidRules) test(`rejects rule: ${name}`, () => { const r = rule(); mutate(r); assert.throws(() => validateFiscalPresentationTaxRule(r)); });
for (const [date, valid] of [["2026-09-30",false],["2026-10-01",true],["2026-12-31",true],["2027-01-01",false]] as const)
  test(`inclusive period ${date}`, () => { const { c,p } = roots(); c.decisionHistory[0].rules[0].effectiveTo = "2026-12-31";
    if (valid) assert.equal(resolve(c,p,date).category, "GRAVADA"); else assert.throws(() => resolve(c,p,date)); });
test("draft remains isolated, new publication preserves history, operation replay is idempotent", () => {
  const { c,p } = roots(); const cmd = { action: "SAVE_DRAFT" as const, operationId: "new-draft", expectedRevision: null,
    reason: "future", rules: [{ ...rule(), effectiveTo: "2026-10-31" }, { ...rule(), ruleId: "next", effectiveFrom: "2026-11-01", taxRateBasisPoints: 2000 }] };
  const draft = applyFiscalTaxConfigurationCommand(c, cmd, actor, 4, digest(cmd));
  assert.equal(resolve(draft,p,"2026-11-01").rateBasisPoints, 1800);
  const pub = { action: "PUBLISH" as const, operationId: "next-pub", expectedRevision: null, decisionId: "next-decision" };
  const next = applyFiscalTaxConfigurationCommand(draft, pub, actor, 5, digest(pub));
  assert.equal(resolve(next,p,"2026-11-01").rateBasisPoints, 2000); assert.equal(next.decisionHistory.length, 2);
  assert.deepEqual(applyFiscalTaxConfigurationCommand(next, pub, actor, 6, digest(pub)), next);
  validateFiscalTaxConfigurationTransition(c,next);
  assert.throws(() => applyFiscalTaxConfigurationCommand(next, pub, actor, 6, digest({ ...pub, decisionId: "other" })), /CONTENT_CONFLICT/);
});
test("overlap can be edited in a draft, never published", () => {
  const { c } = roots(); const cmd = { action: "SAVE_DRAFT" as const, operationId: "overlap", expectedRevision: null, reason: "fix", rules: [rule(), { ...rule(), ruleId: "another" }] };
  const draft = applyFiscalTaxConfigurationCommand(c,cmd,actor,4,digest(cmd)); const pub = { action: "PUBLISH" as const, operationId: "bad-pub", expectedRevision: null, decisionId: "bad" };
  assert.throws(() => applyFiscalTaxConfigurationCommand(draft,pub,actor,5,digest(pub)), /OVERLAP/);
});
for (const scenario of ["tenant", "actor", "edit", "publish", "revision", "clock"])
  test(`command rejects ${scenario}`, () => { const { c } = roots(); const cmd = { action: "PUBLISH" as const, operationId: "new", expectedRevision: null, decisionId: "new" };
    const auth = { ...actor }; if (scenario === "tenant") auth.tenantId = "other"; if (scenario === "actor") auth.actorId = "";
    if (scenario === "edit") auth.canEdit = false; if (scenario === "publish") auth.canPublish = false;
    if (scenario === "revision") cmd.expectedRevision = "stale" as any;
    assert.throws(() => applyFiscalTaxConfigurationCommand(c,cmd,auth,scenario === "clock" ? 0 : 4,digest(cmd))); });
for (const field of ["_id", "tenantId", "issuerRuc", "presentationId", "creationOperationId", "createdBy", "history"])
  test(`transition cannot alter ${field}`, () => { const { c } = roots(); const next = structuredClone(c) as any;
    if (field === "createdBy") next.audit.createdBy = "spoof"; else if (field === "history") next.decisionHistory[0].reason = "edited"; else next[field] = "other";
    assert.throws(() => validateFiscalTaxConfigurationTransition(c,next)); });
test("semantic fingerprint ignores name, price, photo and revisions", () => {
  const material = fiscalCatalogSemanticFingerprintMaterial(semantics);
  assert.equal(fiscalCatalogSemanticFingerprintMaterial({ ...semantics, nombre: "new", precioVenta: 9, _rev: "new" } as any), material);
  assert.notEqual(fiscalCatalogSemanticFingerprintMaterial({ ...semantics, equivalenciaUnidadBase: 2 }), material);
});
test("references choose explicit identity, never latest root", () => { assert.equal(resolveFiscalPresentationReference([{ issuerRuc: "20123456789", configurationDocumentId: " exact opaque " }],"20123456789")," exact opaque ");
  assert.throws(() => resolveFiscalPresentationReference([],"20123456789"));
  assert.throws(() => resolveFiscalPresentationReference([{ issuerRuc: "x", configurationDocumentId: "a" }, { issuerRuc: "x", configurationDocumentId: "b" }],"x")); });
test("safe projection strips private fields from root and nested objects", () => { const { c } = roots(); const v = c as any;
  v.solPassword = "secret"; v.decisionHistory[0].rules[0].token = "secret"; v.audit.token = "secret";
  assert.ok(!JSON.stringify(projectFiscalTaxConfigurationDocument(v)).includes("secret")); });

test("draft writes and their idempotent replay cannot persist or return private extensions", () => {
  const { c } = roots();
  const command = { action: "SAVE_DRAFT" as const, operationId: "safe-draft", expectedRevision: null,
    reason: "Reviewed", rules: [{ ...rule(), token: "secret", legalSource: { ...evidence.legalSource, apiKey: "secret" } }] };
  const next = applyFiscalTaxConfigurationCommand(c, command, actor, 4, digest(command));
  assert.ok(!JSON.stringify(next).includes("secret"));
  assert.ok(!JSON.stringify(applyFiscalTaxConfigurationCommand(next, command, actor, 5, digest(command))).includes("secret"));
});
test("suspended and foreign configurations are never replaced with another history", () => {
  const { c,p } = roots(); c.status = "SUSPENDED"; assert.throws(() => resolve(c,p)); c.status = "ACTIVE";
  p.tenantId = "foreign"; assert.throws(() => resolve(c,p));
});
test("seed 20261011: 300 adjacent calendars resolve exactly one period", () => {
  for (let length = 1; length <= 300; length++) {
    const { c,p } = roots(); const start = Date.UTC(2024,0,1);
    c.decisionHistory[0].rules = Array.from({length}, (_,i) => { const date = new Date(start + i * 86400000).toISOString().slice(0,10);
      return { ...rule(), ruleId: `rule-${i}`, effectiveFrom: date, effectiveTo: date }; });
    const date = c.decisionHistory[0].rules[length-1].effectiveFrom; assert.equal(resolve(c,p,date).source.ruleId,`rule-${length-1}`);
  }
});
