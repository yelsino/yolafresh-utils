import { test } from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { assertFiscalV1DocumentRecord, assertFiscalV1Snapshot, fiscalV1CanonicalSha256,
  fiscalV1PublicationArtifactFingerprint, fiscalV1PublicationPayloadFingerprint, fiscalV1PublicationPayloadMaterial,
  fiscalV1SnapshotFingerprint, prepareFiscalV1CreditNote, prepareFiscalV1Sale,
  type FiscalV1Capability, type FiscalV1CreditNoteDraft, type FiscalV1DocumentRecord,
  type FiscalV1IssuerProfile, type FiscalV1PresentationRule, type FiscalV1SignedPublicationBundle,
  type FiscalV1Snapshot, type FiscalV1TrustedPublisherKey } from "../contracts";

const HASH = "a".repeat(64);
const NOW = Date.UTC(2026, 9, 15, 14);
const CONTEXT = { establishmentId: "local-sintetico", operationKind: "DOMESTIC_RETAIL", buyerUse: "BUSINESS" } as const;
const KEY_PAIR = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(9));
const TRUSTED_KEY: FiscalV1TrustedPublisherKey = { keyId: "test-key-2", publicKeyBase64: Buffer.from(KEY_PAIR.publicKey).toString("base64"),
  tenantId: "tenant-sintetico", environment: "DEMO", validFromMs: NOW - 86400000, validToMs: NOW + 86400000 };
const SOURCE = "fixture-sintetica-fiscal-v1";

type TestMode = { taxRegime?: "RER" | "NRUS"; documentType?: "FACTURA" | "BOLETA" };
function signed(capabilityStatus: "SUPPORTED" | "UNVERIFIED" = "SUPPORTED", mode: TestMode = {}) {
  const taxRegime = mode.taxRegime ?? "RER";
  const documentType = mode.documentType ?? "FACTURA";
  const issuerRuc = taxRegime === "NRUS" ? "10123456789" : "20123456789";
  const profile: FiscalV1IssuerProfile = { status: "PUBLISHED", effectiveFrom: "2026-10-01", publishedAt: NOW - 1000,
    sourceRef: SOURCE, fingerprintSha256: HASH, profileId: "profile-1", profileVersion: "v1", tenantId: "tenant-sintetico",
    issuerId: "issuer-sintetico", issuerRuc, issuerLegalName: "EMISOR SINTÉTICO", taxRegime,
    environment: "DEMO", establishmentId: CONTEXT.establishmentId, see: "SEE_CONTRIBUYENTE", provider: "XmlPeru",
    adapterVersion: "v1" };
  const rule: FiscalV1PresentationRule = { status: "PUBLISHED", effectiveFrom: "2026-10-01", publishedAt: NOW - 1000,
    sourceRef: SOURCE, fingerprintSha256: HASH, configurationDocumentId: "couch-id-opaco", decisionId: "decision-1",
    ruleId: "rule-1", tenantId: "tenant-sintetico", issuerId: "issuer-sintetico", presentationId: "queso",
    catalogSemanticFingerprintSha256: HASH, unitCode: "NIU", context: CONTEXT, legalCategory: "GRAVADA",
    taxRateBasisPoints: 1800 };
  const evidence = { legalReviewRef: SOURCE, providerXmlRef: "xml-fixture-redactado",
    tributaryResultRef: "resultado-demo-redactado" };
  const saleCapability: FiscalV1Capability = { status: "PUBLISHED", effectiveFrom: "2026-10-01", publishedAt: NOW - 1000,
    sourceRef: SOURCE, fingerprintSha256: HASH, capabilityId: "sale-cap", tenantId: "tenant-sintetico",
    issuerId: "issuer-sintetico", profileVersion: "v1", taxRegime, environment: "DEMO", documentType,
    context: CONTEXT, legalCategories: ["GRAVADA"], see: "SEE_CONTRIBUYENTE", provider: "XmlPeru",
    adapterVersion: "v1", capabilityStatus: "SUPPORTED", evidence };
  const noteCapability: FiscalV1Capability = { ...saleCapability, capabilityId: "note-cap", documentType: "NOTA_CREDITO",
    capabilityStatus, creditNoteReasonCodes: ["TEST_RETURN"] };
  const fingerprinted = <T extends FiscalV1IssuerProfile | FiscalV1PresentationRule | FiscalV1Capability>(item: T): T =>
    ({ ...item, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(item) });
  const payload = { schemaVersion: "fiscal-v1" as const, tenantId: "tenant-sintetico", issuerId: "issuer-sintetico",
    environment: "DEMO" as const, revision: 1, issuedAtMs: NOW - 500, expiresAtMs: NOW + 3600000,
    profiles: [fingerprinted(profile)], rules: [fingerprinted(rule)],
    capabilities: [fingerprinted(saleCapability), fingerprinted(noteCapability)] };
  const material = fiscalV1PublicationPayloadMaterial(payload);
  const bundle: FiscalV1SignedPublicationBundle = { payload, payloadSha256: fiscalV1PublicationPayloadFingerprint(payload),
    signature: { algorithm: "Ed25519", keyId: TRUSTED_KEY.keyId,
      signatureBase64: Buffer.from(nacl.sign.detached(Buffer.from(material, "utf8"), KEY_PAIR.secretKey)).toString("base64") } };
  return { bundle, trustedKeys: [TRUSTED_KEY], nowMs: NOW };
}

function fixture(capabilityStatus: "SUPPORTED" | "UNVERIFIED" = "SUPPORTED", mode: TestMode = {}) {
  const publication = signed(capabilityStatus, mode);
  const sale = { operationId: "sale-op", saleId: "sale-1", tenantId: "tenant-sintetico", issuerId: "issuer-sintetico",
    issuerRuc: publication.bundle.payload.profiles[0].issuerRuc, environment: "DEMO" as const,
    currency: "PEN" as const, occurredOn: "2026-10-15",
    documentType: mode.documentType ?? "FACTURA",
    buyer: { documentType: "RUC" as const, documentNumber: "20987654321", legalName: "COMPRADOR SINTÉTICO" },
    context: CONTEXT, lines: [{ lineId: "line-1", presentationId: "queso", catalogSemanticFingerprintSha256: HASH,
      quantityMilli: 1000, unitPriceCents: 1180, discountCents: 0 }] };
  const decision = prepareFiscalV1Sale({ sale, ...publication });
  const base = { schemaVersion: "fiscal-v1-snapshot" as const, snapshotId: "snapshot-1", decision,
    decisionSha256: fiscalV1CanonicalSha256(decision),
    publicationPayloadSha256: publication.bundle.payloadSha256,
    publicationRevision: publication.bundle.payload.revision,
    issuerLegalName: "EMISOR SINTÉTICO",
    issuerEstablishment: { establishmentId: CONTEXT.establishmentId, code: "0000", ubigeo: "150101",
      department: "LIMA", province: "LIMA", district: "LIMA", address: "CALLE SINTÉTICA 123",
      countryCode: "PE" as const }, lineDescriptions: [{ lineId: "line-1", description: "QUESO" }],
    paymentTerms: { kind: "CONTADO" as const }, series: sale.documentType === "BOLETA" ? "B001" : "F001",
    number: 1, createdAtMs: NOW };
  const snapshot: FiscalV1Snapshot = { ...base, snapshotSha256: fiscalV1SnapshotFingerprint({ ...base,
    snapshotSha256: HASH }) };
  const document: FiscalV1DocumentRecord = { documentId: "document-1", operationId: sale.operationId,
    tenantId: sale.tenantId, issuerId: sale.issuerId, issuerRuc: sale.issuerRuc, environment: sale.environment,
    snapshotId: snapshot.snapshotId, snapshotSha256: snapshot.snapshotSha256, state: "TRIBUTARY_ACCEPTED",
    providerOperationRef: "provider-op-1", signedXml: { storageRef: "signed-xml-1", sha256: HASH },
    tributaryResult: { storageRef: "cdr-1", sha256: HASH, receivedAtMs: NOW, outcome: "ACCEPTED" } };
  const draft: FiscalV1CreditNoteDraft = { noteOperationId: "note-op-1", noteId: "note-1", tenantId: sale.tenantId,
    issuerId: sale.issuerId, issuerRuc: sale.issuerRuc, environment: sale.environment,
    originalDocumentId: document.documentId, originalSnapshotSha256: snapshot.snapshotSha256,
    reasonCode: "TEST_RETURN", issuedOn: "2026-10-15", recipientId: sale.buyer.documentNumber,
    ...(sale.documentType === "BOLETA" ? { originalGrant: { recipientId: sale.buyer.documentNumber,
      grantedAtMs: NOW - 1000, evidenceRef: "synthetic-grant" } } : {}),
    lines: [{ originalLineId: "line-1", creditQuantityMilli: 500, creditCents: 590 }] };
  return { publication, snapshot, document, draft };
}

test("snapshot congela emisor, dirección, descripciones, pago e identidad sin reparar datos después", () => {
  const { snapshot } = fixture();
  assert.doesNotThrow(() => assertFiscalV1Snapshot(snapshot));
  assert.throws(() => assertFiscalV1Snapshot({ ...snapshot,
    issuerEstablishment: { ...snapshot.issuerEstablishment, address: "ALTERADA" } }),
    /FISCAL_V1_SNAPSHOT_HASH_INVALID/);
  const wrongDescription = { ...snapshot, lineDescriptions: [{ lineId: "unknown", description: "QUESO" }] };
  assert.throws(() => assertFiscalV1Snapshot({ ...wrongDescription,
    snapshotSha256: fiscalV1SnapshotFingerprint(wrongDescription) }), /FISCAL_V1_SNAPSHOT_LINES_INVALID/);
  const wrongCredit = { ...snapshot, paymentTerms: { kind: "CREDITO" as const,
    installments: [{ dueOn: "2026-10-20", amountCents: 100 }] } };
  assert.throws(() => assertFiscalV1Snapshot({ ...wrongCredit,
    snapshotSha256: fiscalV1SnapshotFingerprint(wrongCredit) }), /FISCAL_V1_SNAPSHOT_PAYMENT_INVALID/);
  const wrongLineTax = { ...snapshot, decision: { ...snapshot.decision,
    lines: [{ ...snapshot.decision.lines[0], disclosure: { kind: "ITEMIZED" as const,
      baseCents: 999, taxCents: 180, appliedRateBasisPoints: 1800 } }] } };
  const rehashedDecision = { ...wrongLineTax, decisionSha256: fiscalV1CanonicalSha256(wrongLineTax.decision) };
  assert.throws(() => assertFiscalV1Snapshot({ ...rehashedDecision,
    snapshotSha256: fiscalV1SnapshotFingerprint(rehashedDecision) }), /FISCAL_V1_SNAPSHOT_TAX_INVALID/);
});

test("documento separa firma de aceptación y exige CDR para factura elegible", () => {
  const { snapshot, document } = fixture();
  assert.doesNotThrow(() => assertFiscalV1DocumentRecord(document, snapshot));
  assert.throws(() => assertFiscalV1DocumentRecord({ ...document, tributaryResult: undefined }, snapshot),
    /FISCAL_V1_DOCUMENT_TRIBUTARY_EVIDENCE_REQUIRED/);
  assert.throws(() => assertFiscalV1DocumentRecord({ ...document, snapshotSha256: "b".repeat(64) }, snapshot),
    /FISCAL_V1_DOCUMENT_SNAPSHOT_MISMATCH/);
  assert.doesNotThrow(() => assertFiscalV1DocumentRecord({ ...document, state: "SIGNED_SUBMISSION_PENDING",
    tributaryResult: undefined }, snapshot));
});

test("nota parcial y total usan importes/regla histórica y respetan saldo por línea", () => {
  const { publication, snapshot, document, draft } = fixture();
  const first = prepareFiscalV1CreditNote({ draft, originalSnapshot: snapshot, originalDocument: document,
    priorCredits: [], ...publication });
  assert.equal(first.totalCents, 590);
  assert.equal(first.lines[0].originalLegalCategory, "GRAVADA");
  assert.equal(first.lines[0].originalRuleRef.ruleId, "rule-1");
  const priorCredits = [{ noteId: "note-1", operationId: "note-op-1", originalDocumentId: document.documentId,
    originalSnapshotSha256: snapshot.snapshotSha256, state: "SIGNED" as const,
    lines: [{ originalLineId: "line-1", creditedQuantityMilli: 500, creditedCents: 590 }] }];
  const secondDraft = { ...draft, noteId: "note-2", noteOperationId: "note-op-2",
    lines: [{ originalLineId: "line-1", creditQuantityMilli: 500, creditCents: 590 }] };
  const second = prepareFiscalV1CreditNote({ draft: secondDraft, originalSnapshot: snapshot,
    originalDocument: document, priorCredits, ...publication });
  assert.equal(second.totalCents, 590);
  assert.throws(() => prepareFiscalV1CreditNote({ draft: { ...secondDraft,
    lines: [{ originalLineId: "line-1", creditQuantityMilli: 501, creditCents: 590 }] }, originalSnapshot: snapshot,
    originalDocument: document, priorCredits, ...publication }), /FISCAL_V1_CREDIT_NOTE_EXCEEDS_REMAINING/);
  assert.throws(() => prepareFiscalV1CreditNote({ draft: { ...secondDraft,
    lines: [{ originalLineId: "line-1", creditQuantityMilli: 500, creditCents: 589 }] }, originalSnapshot: snapshot,
    originalDocument: document, priorCredits, ...publication }), /FISCAL_V1_CREDIT_NOTE_QUANTITY_AMOUNT_MISMATCH/);
  assert.throws(() => prepareFiscalV1CreditNote({ draft: { ...secondDraft, reasonCode: "99" },
    originalSnapshot: snapshot, originalDocument: document, priorCredits, ...publication }),
  /FISCAL_V1_CREDIT_NOTE_CAPABILITY_NOT_SUPPORTED/);
});

test("nota no hereda soporte de factura ni permite original solo firmado", () => {
  const { publication, snapshot, document, draft } = fixture("UNVERIFIED");
  assert.throws(() => prepareFiscalV1CreditNote({ draft, originalSnapshot: snapshot,
    originalDocument: document, priorCredits: [], ...publication }),
  /FISCAL_V1_CREDIT_NOTE_CAPABILITY_NOT_SUPPORTED/);
  const supported = signed("SUPPORTED");
  assert.throws(() => prepareFiscalV1CreditNote({ draft, originalSnapshot: snapshot,
    originalDocument: { ...document, state: "SIGNED_SUBMISSION_PENDING", tributaryResult: undefined },
    priorCredits: [], ...supported }), /FISCAL_V1_CREDIT_NOTE_ORIGINAL_NOT_ELIGIBLE/);
  assert.throws(() => prepareFiscalV1CreditNote({ draft: { ...draft, tenantId: "otro-tenant" },
    originalSnapshot: snapshot, originalDocument: document, priorCredits: [], ...supported }),
  /FISCAL_V1_CREDIT_NOTE_SCOPE_MISMATCH/);
});

test("boleta exige otorgamiento probado y rechaza origen tributariamente rechazado", () => {
  const { publication, snapshot, document, draft } = fixture();
  const boletaDecision = { ...snapshot.decision, documentType: "BOLETA" as const };
  const boletaBase = { ...snapshot, decision: boletaDecision,
    decisionSha256: fiscalV1CanonicalSha256(boletaDecision), series: "B001" };
  const boletaSnapshot = { ...boletaBase, snapshotSha256: fiscalV1SnapshotFingerprint(boletaBase) };
  const boletaDocument = { ...document, snapshotSha256: boletaSnapshot.snapshotSha256,
    state: "TRIBUTARY_ACCEPTED" as const };
  const boletaDraft = { ...draft, originalSnapshotSha256: boletaSnapshot.snapshotSha256 };
  assert.throws(() => prepareFiscalV1CreditNote({ draft: boletaDraft,
    originalSnapshot: boletaSnapshot, originalDocument: boletaDocument, priorCredits: [], ...publication }),
  /FISCAL_V1_CREDIT_NOTE_ORIGINAL_NOT_ELIGIBLE/);
  const granted = { ...boletaDraft, originalGrant: { recipientId: draft.recipientId,
    grantedAtMs: NOW - 1000, evidenceRef: "synthetic-grant" } };
  assert.equal(prepareFiscalV1CreditNote({ draft: granted,
    originalSnapshot: boletaSnapshot, originalDocument: boletaDocument, priorCredits: [], ...publication }).totalCents, 590);
  assert.throws(() => prepareFiscalV1CreditNote({ draft: granted, originalSnapshot: boletaSnapshot,
    originalDocument: { ...boletaDocument, state: "TRIBUTARY_REJECTED",
      tributaryResult: { ...document.tributaryResult!, outcome: "REJECTED" } },
    priorCredits: [], ...publication }), /FISCAL_V1_CREDIT_NOTE_ORIGINAL_NOT_ELIGIBLE/);
});

test("NRUS no hereda soporte de nota desde la boleta aunque exista otorgamiento", () => {
  const { publication, snapshot, document, draft } = fixture("UNVERIFIED",
    { taxRegime: "NRUS", documentType: "BOLETA" });
  assert.equal(snapshot.decision.taxRegime, "NRUS");
  assert.equal(snapshot.decision.taxCents, null);
  assert.throws(() => prepareFiscalV1CreditNote({ draft, originalSnapshot: snapshot,
    originalDocument: document, priorCredits: [], ...publication }),
  /FISCAL_V1_CREDIT_NOTE_CAPABILITY_NOT_SUPPORTED/);
});
