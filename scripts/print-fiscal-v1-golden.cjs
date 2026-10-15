/** Solo fixture sintética determinista; nunca usar esta semilla para publicar. */
const nacl = require('tweetnacl');
const { fiscalV1PublicationArtifactFingerprint, fiscalV1PublicationPayloadMaterial,
  fiscalV1PublicationPayloadFingerprint, prepareFiscalV1Sale,
  fiscalV1DecisionFingerprintMaterial } = require('../dist/domain/fiscal/contracts');

const HASH = 'a'.repeat(64);
const NOW = Date.UTC(2026, 9, 15, 12);
const context = { establishmentId: 'local-demo', operationKind: 'DOMESTIC_RETAIL', buyerUse: 'FINAL_CONSUMER' };
const pair = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(11));
const trustedKey = { keyId: 'fixture-key-not-production', publicKeyBase64: Buffer.from(pair.publicKey).toString('base64'),
  tenantId: 'tenant-anonimo', environment: 'DEMO', validFromMs: NOW - 86400000, validToMs: NOW + 86400000 };
const common = { status: 'PUBLISHED', effectiveFrom: '2026-10-01', publishedAt: NOW - 1000,
  sourceRef: 'synthetic-fixture-no-legal-authorization', fingerprintSha256: HASH };
const profile = { ...common, profileId: 'profile-demo', profileVersion: 'v1', tenantId: trustedKey.tenantId,
  issuerId: 'issuer-demo', issuerRuc: '10123456789', issuerLegalName: 'EMISOR ANONIMO', taxRegime: 'NRUS',
  environment: 'DEMO', establishmentId: context.establishmentId, see: 'SEE_CONTRIBUYENTE',
  provider: 'XmlPeru', adapterVersion: 'v1' };
const rule = { ...common, configurationDocumentId: 'opaque-config', decisionId: 'decision-1', ruleId: 'rule-1',
  tenantId: trustedKey.tenantId, issuerId: 'issuer-demo', presentationId: 'product-anonimo',
  catalogSemanticFingerprintSha256: HASH, unitCode: 'NIU', context, legalCategory: 'GRAVADA',
  taxRateBasisPoints: 1800 };
const capability = { ...common, capabilityId: 'cap-demo', tenantId: trustedKey.tenantId, issuerId: 'issuer-demo',
  profileVersion: 'v1', taxRegime: 'NRUS', environment: 'DEMO', documentType: 'BOLETA', context,
  legalCategories: ['GRAVADA'], see: 'SEE_CONTRIBUYENTE', provider: 'XmlPeru', adapterVersion: 'v1',
  capabilityStatus: 'SUPPORTED', evidence: { legalReviewRef: 'synthetic-only', providerXmlRef: 'synthetic-only',
    tributaryResultRef: 'synthetic-only' } };
const fingerprinted = item => ({ ...item, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(item) });
const payload = { schemaVersion: 'fiscal-v1', tenantId: trustedKey.tenantId, issuerId: 'issuer-demo',
  environment: 'DEMO', revision: 1, issuedAtMs: NOW - 1000, expiresAtMs: NOW + 3600000,
  profiles: [fingerprinted(profile)], rules: [fingerprinted(rule)], capabilities: [fingerprinted(capability)] };
const bundle = { payload, payloadSha256: fiscalV1PublicationPayloadFingerprint(payload),
  signature: { algorithm: 'Ed25519', keyId: trustedKey.keyId,
    signatureBase64: Buffer.from(nacl.sign.detached(Buffer.from(fiscalV1PublicationPayloadMaterial(payload), 'utf8'),
      pair.secretKey)).toString('base64') } };
const sale = { operationId: 'operation-demo', saleId: 'sale-demo', tenantId: trustedKey.tenantId,
  issuerId: 'issuer-demo', issuerRuc: '10123456789', environment: 'DEMO', currency: 'PEN',
  occurredOn: '2026-10-15', documentType: 'BOLETA', context,
  lines: [{ lineId: 'line-1', presentationId: 'product-anonimo', catalogSemanticFingerprintSha256: HASH,
    quantityMilli: 1000, unitPriceCents: 1180, discountCents: 0 }] };
const decision = prepareFiscalV1Sale({ sale, bundle, trustedKeys: [trustedKey], nowMs: NOW });
process.stdout.write(JSON.stringify({ fixtureKind: 'SYNTHETIC_NOT_AUTHORIZED_FOR_EMISSION', nowMs: NOW, trustedKey,
  bundle, sale, expectedDecision: decision, expectedDecisionCanonicalJson: fiscalV1DecisionFingerprintMaterial(decision) }, null, 2));
