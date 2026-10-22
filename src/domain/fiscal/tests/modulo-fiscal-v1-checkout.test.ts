import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nacl from "tweetnacl";
import { FISCAL_V1_PUBLICATION_DOCUMENT_TYPE, fiscalV1PublicationArtifactFingerprint,
  fiscalV1PublicationPayloadFingerprint, fiscalV1PublicationPayloadMaterial,
  projectFiscalV1PublicationDocument, resolveFiscalV1CheckoutContext, verifyFiscalV1PublicationBundle,
  type FiscalV1Capability, type FiscalV1CheckoutContext, type FiscalV1PublicationPayload,
  type FiscalV1SignedPublicationBundle, type FiscalV1TrustedPublisherKey } from "../contracts";

function golden() {
  return JSON.parse(readFileSync(resolve(process.cwd(), "src/docs/fiscal/fixtures/fiscal-v1-signed-golden.json"), "utf8")) as {
    bundle: FiscalV1SignedPublicationBundle; trustedKey: FiscalV1TrustedPublisherKey; nowMs: number;
  };
}

function signed(payload: FiscalV1PublicationPayload) {
  const original = golden();
  const pair = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(13));
  const key = { ...original.trustedKey, publicKeyBase64: Buffer.from(pair.publicKey).toString("base64") };
  const bundle: FiscalV1SignedPublicationBundle = { payload, payloadSha256: fiscalV1PublicationPayloadFingerprint(payload),
    signature: { algorithm: "Ed25519", keyId: key.keyId,
      signatureBase64: Buffer.from(nacl.sign.detached(Buffer.from(fiscalV1PublicationPayloadMaterial(payload)), pair.secretKey)).toString("base64") } };
  return { bundle, trustedKey: key, nowMs: original.nowMs };
}

function invoicePayload(): FiscalV1PublicationPayload {
  const payload = golden().bundle.payload;
  const context = { ...payload.capabilities[0].context, buyerUse: "BUSINESS" as const };
  const profile = { ...payload.profiles[0], taxRegime: "RER" as const };
  const capability: FiscalV1Capability = { ...payload.capabilities[0], taxRegime: "RER", documentType: "FACTURA", context };
  const correction: FiscalV1Capability = { ...capability, capabilityId: "cap-nota", documentType: "NOTA_CREDITO",
    creditNoteReasonCodes: ["01", "06", "07"] };
  return { ...payload,
    profiles: [{ ...profile, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(profile) }],
    capabilities: [capability, correction].map(row => ({ ...row, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(row) })),
    checkoutContexts: [{ profileVersion: profile.profileVersion, documentType: "FACTURA", series: "F003", creditNoteSeries: "FC01", context }] };
}

test("el bundle histórico conserva material/huella y no inventa contexto de checkout", () => {
  const { bundle, trustedKey, nowMs } = golden();
  const payload = verifyFiscalV1PublicationBundle(bundle, [trustedKey], nowMs);
  assert.equal(fiscalV1PublicationPayloadFingerprint(payload), bundle.payloadSha256);
  assert.equal(fiscalV1PublicationPayloadMaterial(payload).includes('"checkoutContexts"'), false);
  assert.equal(resolveFiscalV1CheckoutContext({ payload, documentType: "BOLETA", occurredOn: "2026-10-15" }), null);
});

test("contexto y series de factura están cubiertos por la firma y se resuelven localmente", () => {
  const fixture = signed(invoicePayload());
  const payload = verifyFiscalV1PublicationBundle(fixture.bundle, [fixture.trustedKey], fixture.nowMs);
  const result = resolveFiscalV1CheckoutContext({ payload, documentType: "FACTURA", occurredOn: "2026-10-15" });
  assert.equal(result?.profile.taxRegime, "RER");
  assert.equal(result?.checkout.series, "F003");
  assert.equal(result?.checkout.creditNoteSeries, "FC01");
  const tampered = { ...fixture.bundle, payload: { ...payload,
    checkoutContexts: [{ ...payload.checkoutContexts![0], series: "F999" }] } };
  assert.throws(() => verifyFiscalV1PublicationBundle(tampered, [fixture.trustedKey], fixture.nowMs), /PAYLOAD_HASH_INVALID/);
});

test("una autorización de checkout exige perfil/contexto/serie correctos y no admite contador", () => {
  const payload = invoicePayload(), row = payload.checkoutContexts![0];
  const invalid: unknown[] = [
    { ...row, series: "B003" }, { ...row, creditNoteSeries: "BC01" },
    { ...row, profileVersion: "otra-version" }, { ...row, nextCorrelative: 1 },
    { ...row, actorId: "inventado" }, { ...row, context: { ...row.context, establishmentId: "otro-local" } },
    { ...row, context: { ...row.context, buyerUse: "FINAL_CONSUMER" } },
  ];
  for (const candidate of invalid) {
    const fixture = signed({ ...payload, checkoutContexts: [candidate as FiscalV1CheckoutContext] });
    assert.throws(() => verifyFiscalV1PublicationBundle(fixture.bundle, [fixture.trustedKey], fixture.nowMs), /FISCAL_V1_CHECKOUT_/);
  }
});

test("dos filas del mismo perfil/contexto nunca se eligen por orden", () => {
  const payload = invoicePayload(), row = payload.checkoutContexts![0];
  const fixture = signed({ ...payload, checkoutContexts: [row, { ...row, series: "F004" }] });
  assert.throws(() => verifyFiscalV1PublicationBundle(fixture.bundle, [fixture.trustedKey], fixture.nowMs), /CHECKOUT_CONTEXT_AMBIGUOUS/);
});

test("factura conserva el gate de corrección y no anuncia otros regímenes operativos", () => {
  const payload = invoicePayload(), row = payload.checkoutContexts![0];
  assert.equal(resolveFiscalV1CheckoutContext({ payload: { ...payload, checkoutContexts: [{
    profileVersion: row.profileVersion, documentType: row.documentType, series: row.series, context: row.context }] },
    documentType: "FACTURA", occurredOn: "2026-10-15" }), null);
  assert.equal(resolveFiscalV1CheckoutContext({ payload: { ...payload,
    capabilities: payload.capabilities.filter(capability => capability.documentType !== "NOTA_CREDITO") },
    documentType: "FACTURA", occurredOn: "2026-10-15" }), null);
  const unsupported = { ...payload, profiles: payload.profiles.map(profile => ({ ...profile, taxRegime: "RMT" as const })),
    capabilities: payload.capabilities.map(capability => ({ ...capability, taxRegime: "RMT" as const })) };
  assert.equal(resolveFiscalV1CheckoutContext({ payload: unsupported, documentType: "FACTURA", occurredOn: "2026-10-15" }), null);
});

test("un perfil fuera de fecha o una capacidad suspendida no queda listo por tener serie", () => {
  const payload = invoicePayload();
  assert.equal(resolveFiscalV1CheckoutContext({ payload, documentType: "FACTURA", occurredOn: "2026-09-30" }), null);
  assert.equal(resolveFiscalV1CheckoutContext({ payload: { ...payload, capabilities: payload.capabilities.map(row =>
    ({ ...row, status: "SUSPENDED" as const })) }, documentType: "FACTURA", occurredOn: "2026-10-15" }), null);
});

test("boleta no recibe un requisito nuevo de serie NC por incorporar el campo opcional", () => {
  const payload = golden().bundle.payload, profile = payload.profiles[0], capability = payload.capabilities[0];
  const result = resolveFiscalV1CheckoutContext({ payload: { ...payload,
    checkoutContexts: [{ profileVersion: profile.profileVersion, documentType: "BOLETA", series: "B007", context: capability.context }] },
    documentType: "BOLETA", occurredOn: "2026-10-15" });
  assert.equal(result?.checkout.series, "B007");
});

test("el sobre Couch público conserva _id opaco sin id, elimina historia y nunca distribuye trust keys", () => {
  const fixture = signed(invoicePayload());
  const root = projectFiscalV1PublicationDocument({ _id: "documento/opaco:sin-patron", _rev: "rev-opaca",
    type: FISCAL_V1_PUBLICATION_DOCUMENT_TYPE, tenantId: fixture.bundle.payload.tenantId, environment: "DEMO",
    bundle: fixture.bundle, publishedBy: "actor-opaco", publishedAtMs: fixture.nowMs,
    history: [fixture.bundle], trustedKeys: [fixture.trustedKey], token: "NO_DISTRIBUIR" });
  assert.equal(root._id, "documento/opaco:sin-patron");
  assert.equal(root._rev, "rev-opaca");
  assert.equal("id" in root, false);
  assert.deepEqual(Object.keys(root).sort(), ["_id", "_rev", "type", "tenantId", "environment", "bundle", "publishedBy", "publishedAtMs"].sort());
  assert.notEqual(root.bundle, fixture.bundle);
});

test("bootstrap conserva publicaciones expiradas para auditoría sin darles confianza ni preparación", () => {
  const fixture = golden();
  const root = { _id: "opaco", type: FISCAL_V1_PUBLICATION_DOCUMENT_TYPE, tenantId: fixture.bundle.payload.tenantId,
    environment: "DEMO", bundle: fixture.bundle };
  assert.doesNotThrow(() => projectFiscalV1PublicationDocument(root));
  assert.throws(() => verifyFiscalV1PublicationBundle(fixture.bundle, [fixture.trustedKey], fixture.bundle.payload.expiresAtMs), /NOT_CURRENT/);
  assert.throws(() => projectFiscalV1PublicationDocument({ ...root, _conflicts: ["rev-conflicto"] }), /DOCUMENT_INVALID/);
  assert.throws(() => projectFiscalV1PublicationDocument({ ...root, tenantId: "otro-tenant" }), /SCOPE_MISMATCH/);
  assert.throws(() => projectFiscalV1PublicationDocument({ ...root, environment: "PRODUCTION" }), /SCOPE_MISMATCH/);
});
