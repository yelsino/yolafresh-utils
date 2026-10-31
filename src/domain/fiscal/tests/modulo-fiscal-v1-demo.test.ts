import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nacl from "tweetnacl";
import * as publicApi from "../../../index";
import { fiscalV1PublicationArtifactFingerprint, fiscalV1PublicationPayloadFingerprint,
  fiscalV1PublicationPayloadMaterial, prepareFiscalV1Sale, resolveFiscalV2CheckoutContext,
  verifyFiscalV1PublicationBundle, fiscalV1CanonicalSha256, fiscalV1SnapshotFingerprint,
  assertFiscalV1DemoProviderEvidence, assertFiscalV1DemoProviderReportedResult,
  assertFiscalV1DemoDocumentRecord, fiscalV1DemoDocumentState, validateFiscalV1TributaryResult,
  assertFiscalV1DocumentRecord, type FiscalV1DemoProviderEvidence, type FiscalV1DemoProviderReportedResult,
  type FiscalV1Snapshot, type FiscalV1Capability, type FiscalV1Environment,
  type FiscalV1PublicationPayload, type FiscalV1SaleInput, type FiscalV1SignedPublicationBundle,
  type FiscalV1TrustedPublisherKey } from "../contracts";

function fixture(environment: FiscalV1Environment = "DEMO") {
  const golden = JSON.parse(readFileSync(resolve(process.cwd(),
    "src/docs/fiscal/fixtures/fiscal-v1-signed-golden.json"), "utf8")) as {
      sale: FiscalV1SaleInput; bundle: FiscalV1SignedPublicationBundle;
      trustedKey: FiscalV1TrustedPublisherKey; nowMs: number;
    };
  const fingerprint = <T extends Parameters<typeof fiscalV1PublicationArtifactFingerprint>[0]>(row: T): T =>
    ({ ...row, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(row) });
  const profiles = golden.bundle.payload.profiles.map(row => fingerprint({ ...row, environment, taxRegime: "RER" as const }));
  const capabilities = golden.bundle.payload.capabilities.map(row => {
    const { evidence: _unused, ...rest } = row;
    return fingerprint({ ...rest, environment, taxRegime: "RER" as const,
      capabilityStatus: "DEMO_TEST_ONLY" as FiscalV1Capability["capabilityStatus"] });
  });
  const payload: FiscalV1PublicationPayload = { ...golden.bundle.payload, environment, profiles, capabilities,
    checkoutContextsV2: [{ cajaId: "caja/opaca/sin-semantica", assignmentVersion: 1,
      profileVersion: profiles[0].profileVersion, documentType: "BOLETA", series: "BQA1",
      context: golden.sale.context }] };
  const pair = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(29));
  const trustedKey = { ...golden.trustedKey, environment,
    publicKeyBase64: Buffer.from(pair.publicKey).toString("base64") };
  const signPayload = (value: FiscalV1PublicationPayload): FiscalV1SignedPublicationBundle => ({
    payload: value, payloadSha256: fiscalV1PublicationPayloadFingerprint(value),
    signature: { algorithm: "Ed25519", keyId: trustedKey.keyId,
      signatureBase64: Buffer.from(nacl.sign.detached(Buffer.from(fiscalV1PublicationPayloadMaterial(value)),
        pair.secretKey)).toString("base64") },
  });
  return { sale: { ...golden.sale, environment }, payload, bundle: signPayload(payload), signPayload,
    trustedKeys: [trustedKey], nowMs: golden.nowMs };
}

test("managed PSE Demo can prepare invoice/note capabilities without granting Production authority", () => {
  const h = fixture();
  const base = h.payload.capabilities[0];
  const fingerprint = (row: FiscalV1Capability) => ({ ...row, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(row) });
  const capabilities: FiscalV1Capability[] = [fingerprint({ ...base, capabilityId: "managed-invoice",
    documentType: "FACTURA", context: { ...base.context, buyerUse: "BUSINESS" }, providerEvidenceAssurance: "PROVIDER_AUTHENTICATED_CHANNEL" }),
    fingerprint({ ...base, capabilityId: "managed-credit-note", documentType: "NOTA_CREDITO",
      creditNoteReasonCodes: ["01", "06", "07"], providerEvidenceAssurance: "PROVIDER_AUTHENTICATED_CHANNEL" })];
  const payload = { ...h.payload, capabilities: [...h.payload.capabilities, ...capabilities] };
  assert.doesNotThrow(() => verifyFiscalV1PublicationBundle(h.signPayload(payload), h.trustedKeys, h.nowMs));
  const live = fixture("PRODUCTION");
  const livePayload = { ...live.payload, capabilities: live.payload.capabilities.map(row => fingerprint({
    ...row, providerEvidenceAssurance: "PROVIDER_AUTHENTICATED_CHANNEL" })) };
  assert.throws(() => verifyFiscalV1PublicationBundle(live.signPayload(livePayload), live.trustedKeys, live.nowMs),
    /FISCAL_V1_DEMO_TEST_CAPABILITY_INVALID/);
});

test("changing the declared PSE assurance invalidates the existing publication fingerprint", () => {
  const h = fixture();
  const payload = { ...h.payload, capabilities: h.payload.capabilities.map(row => ({
    ...row, providerEvidenceAssurance: "PROVIDER_AUTHENTICATED_CHANNEL" as const })) };
  assert.throws(() => verifyFiscalV1PublicationBundle(h.signPayload(payload), h.trustedKeys, h.nowMs));
});

test("DEMO_TEST_ONLY permite la primera boleta de prueba sin inventar evidencia SUPPORTED", () => {
  const f = fixture();
  const decision = prepareFiscalV1Sale(f);
  assert.equal(decision.documentType, "BOLETA");
  assert.equal(decision.totalCents, 1180);
  assert.equal(decision.baseCents, 1000);
  assert.equal(decision.taxCents, 180);
  assert.equal(f.payload.capabilities[0].evidence, undefined);
  assert.equal(f.payload.capabilities[0].capabilityStatus, "DEMO_TEST_ONLY");
  assert.equal(resolveFiscalV2CheckoutContext({ payload: f.payload, cajaId: "caja/opaca/sin-semantica",
    documentType: "BOLETA", occurredOn: f.sale.occurredOn })?.checkout.series, "BQA1");
});

function demoEvidence() {
  const f = fixture();
  const decision = prepareFiscalV1Sale(f);
  const material = { schemaVersion: "fiscal-v1-snapshot-v2" as const, snapshotId: "snapshot/opaco",
    decision, decisionSha256: fiscalV1CanonicalSha256(decision), publicationPayloadSha256: f.bundle.payloadSha256,
    publicationRevision: f.payload.revision, issuerLegalName: f.payload.profiles[0].issuerLegalName,
    issuerEstablishment: { establishmentId: f.sale.context.establishmentId, code: "0000", ubigeo: "150101",
      department: "LIMA", province: "LIMA", district: "LIMA", address: "DIRECCION SINTETICA", countryCode: "PE" as const },
    cajaAssignment: { cajaId: "caja/opaca/sin-semantica", assignmentVersion: 1 },
    lineDescriptions: decision.lines.map(line => ({ lineId: line.lineId, description: "PRODUCTO SINTETICO" })),
    paymentTerms: { kind: "CONTADO" as const }, series: "BQA1", number: 1, createdAtMs: f.nowMs };
  const snapshot: FiscalV1Snapshot = { ...material,
    snapshotSha256: fiscalV1SnapshotFingerprint({ ...material, snapshotSha256: "" }) };
  const evidence: FiscalV1DemoProviderEvidence = { schemaVersion: "fiscal-v1-demo-provider-evidence",
    environment: "DEMO", acceptanceContext: "DEMO_PROVIDER_REPORTED", evidenceAssurance: "DEMO_CRYPTOGRAPHY_UNVERIFIED",
    tenantId: decision.tenantId, issuerId: decision.issuerId, issuerRuc: decision.issuerRuc,
    operationId: decision.operationId, saleId: decision.saleId, snapshotId: snapshot.snapshotId,
    snapshotSha256: snapshot.snapshotSha256, publicationPayloadSha256: snapshot.publicationPayloadSha256,
    publicationRevision: snapshot.publicationRevision, cajaAssignment: snapshot.cajaAssignment,
    documentType: "03", series: snapshot.series, number: snapshot.number, externalId: "provider-external-id",
    providerXml: { storageRef: "archivo/xml/opaco", sha256: "a".repeat(64) }, contentInspection: "MATCHED_FROZEN_SNAPSHOT" };
  const result: FiscalV1DemoProviderReportedResult = { environment: "DEMO", acceptanceContext: "DEMO_PROVIDER_REPORTED",
    evidenceAssurance: "DEMO_CRYPTOGRAPHY_UNVERIFIED", provider: "XmlPeru", externalId: evidence.externalId,
    receivedAtMs: f.nowMs, providerResolved: true, providerReachedSunatReported: true,
    description: "Resultado DEMO reportado por XmlPeru", observations: [], providerStateCode: "05",
    outcome: "ACCEPTED", responseCode: "0", providerHasCdr: true,
    cdr: { storageRef: "archivo/cdr/opaco", sha256: "b".repeat(64), inspection: "UNAVAILABLE",
      diagnostic: "CDR_STRUCTURE_UNAVAILABLE" } };
  return { snapshot, evidence, result };
}

test("la API pública separa resultado Demo, evidencia verificada y estado de presentación", () => {
  assert.equal(publicApi.assertFiscalV1DemoProviderEvidence, assertFiscalV1DemoProviderEvidence);
  const { snapshot, evidence, result } = demoEvidence();
  assertFiscalV1DemoProviderEvidence(evidence, snapshot);
  assert.equal(fiscalV1DemoDocumentState(), "DEMO_SUBMISSION_PENDING");
  assertFiscalV1DemoProviderReportedResult(result);
  const completed = { ...evidence, providerReportedResult: result };
  assertFiscalV1DemoProviderEvidence(completed, snapshot);
  assert.equal(fiscalV1DemoDocumentState(result), "DEMO_PROVIDER_ACCEPTED");
  assertFiscalV1DemoDocumentRecord({ ...completed, documentId: "documento/opaco", state: "DEMO_PROVIDER_ACCEPTED" }, snapshot);
  assert.ok(validateFiscalV1TributaryResult(result).length > 0);
  assert.throws(() => assertFiscalV1DocumentRecord({ ...completed, documentId: "documento/opaco",
    state: "DEMO_PROVIDER_ACCEPTED" } as any, snapshot), /DOCUMENT_INVALID/);
});

test("Demo conserva CDR ininterpretable con SHA y diagnóstico sin afirmar CDR correcta o validada", () => {
  const { result } = demoEvidence();
  assertFiscalV1DemoProviderReportedResult(result);
  assert.equal(result.cdr?.inspection, "UNAVAILABLE");
  for (const cdr of [undefined, { ...result.cdr, diagnostic: "" }, { ...result.cdr, sha256: "x" },
    { ...result.cdr, inspection: "CONTRADICTED" }, { ...result.cdr, validated: true }]) {
    assert.throws(() => assertFiscalV1DemoProviderReportedResult({ ...result, cdr }), /DEMO_PROVIDER_RESULT_INVALID/);
  }
  assertFiscalV1DemoProviderReportedResult({ ...result,
    cdr: { storageRef: "cdr/opaco", sha256: "c".repeat(64), inspection: "MATCHED" } });
});

test("solo hechos reportados coherentes permiten outcomes Demo 05,07,09", () => {
  const { result } = demoEvidence();
  const observed = { ...result, providerStateCode: "07", outcome: "ACCEPTED_WITH_OBSERVATIONS", observations: ["observacion"] };
  assertFiscalV1DemoProviderReportedResult(observed);
  assert.equal(fiscalV1DemoDocumentState(observed), "DEMO_PROVIDER_ACCEPTED_WITH_OBSERVATIONS");
  const { cdr: _cdr, ...withoutCdr } = result;
  const rejected = { ...withoutCdr, providerStateCode: "09", outcome: "REJECTED", responseCode: "2335", providerHasCdr: false };
  assertFiscalV1DemoProviderReportedResult(rejected);
  assert.equal(fiscalV1DemoDocumentState(rejected), "DEMO_PROVIDER_REJECTED");
  for (const change of [{ providerResolved: false }, { providerStateCode: "03" }, { responseCode: "2335" },
    { providerReachedSunatReported: null }, { environment: "PRODUCTION" }, { evidenceAssurance: "CRYPTOGRAPHICALLY_VERIFIED" },
    { validated: true }, { tributaryResult: {} }, { providerStateCode: "07", outcome: "ACCEPTED_WITH_OBSERVATIONS" }]) {
    assert.throws(() => assertFiscalV1DemoProviderReportedResult({ ...result, ...change }), /DEMO_PROVIDER_RESULT_INVALID/);
  }
});

test("evidencia Demo no cruza operación, snapshot, publicación, caja, número ni entorno", () => {
  const { snapshot, evidence, result } = demoEvidence();
  for (const change of [{ tenantId: "otro" }, { issuerRuc: "20111111111" }, { operationId: "otro" },
    { saleId: "otro" }, { snapshotSha256: "d".repeat(64) }, { publicationPayloadSha256: "e".repeat(64) },
    { publicationRevision: 2 }, { cajaAssignment: { cajaId: "otra", assignmentVersion: 1 } }, { cajaAssignment: undefined },
    { series: "BQA2" }, { number: 2 }, { environment: "PRODUCTION" }, { validated: true }, { tributaryResult: {} },
    { providerReportedResult: { ...result, externalId: "otro" } }]) {
    assert.throws(() => assertFiscalV1DemoProviderEvidence({ ...evidence, ...change }, snapshot), /DEMO_PROVIDER/);
  }
  assert.throws(() => assertFiscalV1DemoDocumentRecord({ ...evidence, documentId: "doc",
    state: "DEMO_PROVIDER_ACCEPTED" }, snapshot), /DEMO_DOCUMENT_STATE_INVALID/);
});

test("DEMO_TEST_ONLY es inválido en Producción aun con publicación correctamente firmada", () => {
  const f = fixture("PRODUCTION");
  assert.throws(() => verifyFiscalV1PublicationBundle(f.bundle, f.trustedKeys, f.nowMs),
    /FISCAL_V1_DEMO_TEST_CAPABILITY_INVALID/);
  assert.throws(() => prepareFiscalV1Sale(f), /FISCAL_V1_DEMO_TEST_CAPABILITY_INVALID/);
});

test("DEMO_TEST_ONLY no habilita factura ni nota y no acepta evidencia SUPPORTED ficticia", () => {
  const f = fixture();
  for (const change of [{ documentType: "FACTURA" }, { documentType: "NOTA_CREDITO", creditNoteReasonCodes: ["01"] },
    { evidence: { legalReviewRef: "x", providerXmlRef: "x", tributaryResultRef: "x" } }]) {
    const row = { ...f.payload.capabilities[0], ...change } as FiscalV1Capability;
    const payload = { ...f.payload, capabilities: [{ ...row,
      fingerprintSha256: fiscalV1PublicationArtifactFingerprint(row) }] };
    assert.throws(() => verifyFiscalV1PublicationBundle(f.signPayload(payload), f.trustedKeys, f.nowMs),
      /FISCAL_V1_DEMO_TEST_CAPABILITY_INVALID/);
  }
});

test("la capacidad Demo no omite firma, vigencia, caja ni reglas fiscales publicadas", () => {
  const f = fixture();
  assert.throws(() => prepareFiscalV1Sale({ ...f, trustedKeys: [] }), /PUBLISHER_NOT_TRUSTED/);
  assert.throws(() => prepareFiscalV1Sale({ ...f, nowMs: f.payload.expiresAtMs }), /PUBLICATION_NOT_CURRENT/);
  const withoutRules = { ...f.payload, rules: [] };
  assert.throws(() => prepareFiscalV1Sale({ ...f, bundle: f.signPayload(withoutRules) }), /RULE/);
  assert.equal(resolveFiscalV2CheckoutContext({ payload: f.payload, cajaId: "otra-caja",
    documentType: "BOLETA", occurredOn: f.sale.occurredOn }), null);
});
