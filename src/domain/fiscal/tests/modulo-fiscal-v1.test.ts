import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nacl from "tweetnacl";
import * as publicApi from "../../../index";
import { assertFiscalV1IssuerAuthority, fiscalV1DecisionFingerprintMaterial,
  fiscalV1PublicationArtifactFingerprint, fiscalV1PublicationPayloadFingerprint, fiscalV1PublicationPayloadMaterial,
  prepareFiscalV1Sale as prepareFiscalV1SaleCore,
  verifyFiscalV1PublicationBundle,
  type FiscalV1Capability, type FiscalV1IssuerProfile, type FiscalV1LegalCategory,
  type FiscalV1PresentationRule, type FiscalV1SaleInput, type FiscalV1SignedPublicationBundle,
  type FiscalV1TrustedPublisherKey } from "../contracts";

const HASH = "a".repeat(64);
const CONTEXT = { establishmentId: "local-1", operationKind: "DOMESTIC_RETAIL", buyerUse: "FINAL_CONSUMER" } as const;
const SOURCE = "fixture-sintetica:revisar-fuente-y-vigencia-antes-de-produccion";
const NOW = Date.UTC(2026, 9, 15);
const KEY_PAIR = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7));
const KEY: FiscalV1TrustedPublisherKey = { keyId: "llave-sintetica-v1",
  publicKeyBase64: Buffer.from(KEY_PAIR.publicKey).toString("base64"), tenantId: "tenant-a", environment: "DEMO",
  validFromMs: Date.UTC(2026, 9, 1), validToMs: Date.UTC(2026, 11, 1) };

type FixtureInput = { sale: FiscalV1SaleInput; profiles: readonly FiscalV1IssuerProfile[];
  rules: readonly FiscalV1PresentationRule[]; capabilities: readonly FiscalV1Capability[] };

function signedBundle(input: FixtureInput): { bundle: FiscalV1SignedPublicationBundle; trustedKeys: FiscalV1TrustedPublisherKey[]; nowMs: number } {
  const fingerprinted = <T extends FiscalV1IssuerProfile | FiscalV1PresentationRule | FiscalV1Capability>(item: T): T =>
    ({ ...item, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(item) });
  const payload = { schemaVersion: "fiscal-v1" as const, tenantId: input.sale.tenantId, issuerId: input.sale.issuerId,
    environment: input.sale.environment, revision: 1, issuedAtMs: NOW - 1000, expiresAtMs: NOW + 86400000,
    profiles: input.profiles.map(fingerprinted), rules: input.rules.map(fingerprinted),
    capabilities: input.capabilities.map(fingerprinted) };
  const material = fiscalV1PublicationPayloadMaterial(payload);
  const bundle: FiscalV1SignedPublicationBundle = { payload,
    payloadSha256: fiscalV1PublicationPayloadFingerprint(payload), signature: { algorithm: "Ed25519",
      keyId: KEY.keyId, signatureBase64: Buffer.from(nacl.sign.detached(Buffer.from(material, "utf8"),
        KEY_PAIR.secretKey)).toString("base64") } };
  return { bundle, trustedKeys: [{ ...KEY, tenantId: input.sale.tenantId, environment: input.sale.environment }], nowMs: NOW };
}

function prepareFiscalV1Sale(input: FixtureInput) {
  return prepareFiscalV1SaleCore({ sale: input.sale, ...signedBundle(input) });
}

function issuer(overrides: Partial<FiscalV1IssuerProfile> = {}): FiscalV1IssuerProfile {
  return { status: "PUBLISHED", effectiveFrom: "2026-10-01", publishedAt: 1,
    sourceRef: SOURCE, fingerprintSha256: HASH, profileId: "perfil-opaco", profileVersion: "v1",
    tenantId: "tenant-a", issuerId: "emisor-a", issuerRuc: "10123456789",
    issuerLegalName: "EMISOR SINTÉTICO", taxRegime: "RER", environment: "DEMO",
    establishmentId: CONTEXT.establishmentId, see: "SEE_CONTRIBUYENTE", provider: "XmlPeru",
    adapterVersion: "v1", ...overrides };
}

function rule(presentationId: string, category: FiscalV1LegalCategory,
  overrides: Partial<FiscalV1PresentationRule> = {}): FiscalV1PresentationRule {
  const tax = category === "GRAVADA"
    ? { legalCategory: "GRAVADA" as const, taxRateBasisPoints: 1800 }
    : category === "EXONERADA"
      ? { legalCategory: "EXONERADA" as const, taxRateBasisPoints: 0 as const }
      : { legalCategory: "INAFECTA" as const, taxRateBasisPoints: 0 as const };
  return { status: "PUBLISHED", effectiveFrom: "2026-10-01", publishedAt: 1, sourceRef: SOURCE,
    fingerprintSha256: HASH, configurationDocumentId: "couch/id/opaco", decisionId: "decision-1",
    ruleId: `rule-${presentationId}`, tenantId: "tenant-a", issuerId: "emisor-a", presentationId,
    catalogSemanticFingerprintSha256: HASH, unitCode: "NIU", context: CONTEXT, ...tax,
    ...overrides } as FiscalV1PresentationRule;
}

function capability(categories: readonly FiscalV1LegalCategory[],
  overrides: Partial<FiscalV1Capability> = {}): FiscalV1Capability {
  return { status: "PUBLISHED", effectiveFrom: "2026-10-01", publishedAt: 1, sourceRef: SOURCE,
    fingerprintSha256: HASH, capabilityId: "capability-1", tenantId: "tenant-a", issuerId: "emisor-a",
    profileVersion: "v1", taxRegime: "RER", environment: "DEMO", documentType: "BOLETA",
    context: CONTEXT, legalCategories: categories, see: "SEE_CONTRIBUYENTE", provider: "XmlPeru",
    adapterVersion: "v1", capabilityStatus: "SUPPORTED",
    evidence: { legalReviewRef: SOURCE, providerXmlRef: "fixture-xml-redactado",
      tributaryResultRef: "fixture-resultado-demo" }, ...overrides };
}

function sale(overrides: Partial<FiscalV1SaleInput> = {}): FiscalV1SaleInput {
  return { operationId: "op-1", saleId: "venta-1", tenantId: "tenant-a", issuerId: "emisor-a",
    issuerRuc: "10123456789", environment: "DEMO", currency: "PEN", occurredOn: "2026-10-15", documentType: "BOLETA",
    context: CONTEXT, lines: [{ lineId: "line-1", presentationId: "queso",
      catalogSemanticFingerprintSha256: HASH, quantityMilli: 1000, unitPriceCents: 1180, discountCents: 0 }],
    ...overrides };
}

test("el núcleo nuevo queda exportado por la API pública", () => {
  assert.equal(publicApi.prepareFiscalV1Sale, prepareFiscalV1SaleCore);
  assert.equal(publicApi.verifyFiscalV1PublicationBundle, verifyFiscalV1PublicationBundle);
});

test("fixture dorado firmado produce exactamente la misma decisión serializada", () => {
  const fixture = JSON.parse(readFileSync(resolve(process.cwd(),
    "src/docs/fiscal/fixtures/fiscal-v1-signed-golden.json"), "utf8"));
  assert.equal(fixture.fixtureKind, "SYNTHETIC_NOT_AUTHORIZED_FOR_EMISSION");
  const decision = prepareFiscalV1SaleCore({ sale: fixture.sale, bundle: fixture.bundle,
    trustedKeys: [fixture.trustedKey], nowMs: fixture.nowMs });
  assert.deepEqual(decision, fixture.expectedDecision);
  assert.equal(fiscalV1DecisionFingerprintMaterial(decision),
    fiscalV1DecisionFingerprintMaterial(fixture.expectedDecision));
});

test("NRUS conserva la categoría legal gravada, pero jamás inventa IGV 0 ni base 0", () => {
  const decision = prepareFiscalV1Sale({ sale: sale(), profiles: [issuer({ taxRegime: "NRUS" })],
    rules: [rule("queso", "GRAVADA")], capabilities: [capability(["GRAVADA"], { taxRegime: "NRUS" })] });
  assert.equal(decision.lines[0].legalCategory, "GRAVADA");
  assert.equal(Object.prototype.hasOwnProperty.call(decision.lines[0], "affectationCode"), false);
  assert.deepEqual(decision.lines[0].disclosure,
    { kind: "NOT_ITEMIZED_BY_ISSUER", baseCents: null, taxCents: null, appliedRateBasisPoints: null });
  assert.equal(decision.totalCents, 1180);
  assert.equal(decision.baseCents, null);
  assert.equal(decision.taxCents, null);
  assert.equal(decision.lines[0].ruleRef.configurationDocumentId, "couch/id/opaco");
});

test("una publicación NRUS rechaza RUC de persona jurídica antes de preparar la venta", () => {
  const input = { sale: sale({ issuerRuc: "20123456789" }),
    profiles: [issuer({ issuerRuc: "20123456789", taxRegime: "NRUS" })],
    rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"], { taxRegime: "NRUS" })] };
  assert.throws(() => prepareFiscalV1Sale(input), /FISCAL_V1_NRUS_ISSUER_TYPE_FORBIDDEN/);
});

test("una publicación NRUS admite un RUC sintético 15 sin deducir el régimen del prefijo", () => {
  const decision = prepareFiscalV1Sale({ sale: sale({ issuerRuc: "15123456789" }),
    profiles: [issuer({ issuerRuc: "15123456789", taxRegime: "NRUS" })],
    rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"], { taxRegime: "NRUS" })] });
  assert.equal(decision.taxRegime, "NRUS");
});

test("dos tenants con la misma presentación pueden obtener decisiones fiscales diferentes", () => {
  const nrus = prepareFiscalV1Sale({ sale: sale(), profiles: [issuer({ taxRegime: "NRUS" })],
    rules: [rule("queso", "GRAVADA")], capabilities: [capability(["GRAVADA"], { taxRegime: "NRUS" })] });
  const otherSale = sale({ tenantId: "tenant-b", issuerId: "emisor-b", issuerRuc: "20987654321" });
  const otherIssuer = issuer({ tenantId: otherSale.tenantId, issuerId: otherSale.issuerId,
    issuerRuc: otherSale.issuerRuc });
  const rer = prepareFiscalV1Sale({ sale: otherSale, profiles: [otherIssuer],
    rules: [rule("queso", "GRAVADA", { tenantId: otherSale.tenantId, issuerId: otherSale.issuerId })],
    capabilities: [capability(["GRAVADA"], { tenantId: otherSale.tenantId, issuerId: otherSale.issuerId })] });
  assert.equal(nrus.taxCents, null);
  assert.equal(rer.taxCents, 180);
  assert.equal(nrus.tenantId, "tenant-a");
  assert.equal(rer.tenantId, "tenant-b");
});

test("RER usa solo la tasa publicada: gravada, exonerada e inafecta en un carrito mixto", () => {
  const mixed = sale({ lines: [
    { lineId: "g", presentationId: "queso", catalogSemanticFingerprintSha256: HASH,
      quantityMilli: 1000, unitPriceCents: 1180, discountCents: 0 },
    { lineId: "e", presentationId: "tomate", catalogSemanticFingerprintSha256: HASH,
      quantityMilli: 1000, unitPriceCents: 300, discountCents: 0 },
    { lineId: "i", presentationId: "bolsa", catalogSemanticFingerprintSha256: HASH,
      quantityMilli: 1000, unitPriceCents: 200, discountCents: 0 },
  ] });
  const decision = prepareFiscalV1Sale({ sale: mixed, profiles: [issuer()],
    rules: [rule("queso", "GRAVADA"), rule("tomate", "EXONERADA"), rule("bolsa", "INAFECTA")],
    capabilities: [capability(["INAFECTA", "GRAVADA", "EXONERADA"])] });
  assert.equal(decision.totalCents, 1680);
  assert.equal(decision.baseCents, 1500);
  assert.equal(decision.taxCents, 180);
  assert.deepEqual(decision.lines.map(item => [item.legalCategory, item.disclosure.kind,
    item.disclosure.baseCents, item.disclosure.taxCents]), [
    ["GRAVADA", "ITEMIZED", 1000, 180], ["EXONERADA", "ITEMIZED", 300, 0],
    ["INAFECTA", "ITEMIZED", 200, 0] ]);
});

test("cantidad decimal y descuento se calculan en enteros con redondeo por línea", () => {
  const weighted = sale({ lines: [{ lineId: "w", presentationId: "peso",
    catalogSemanticFingerprintSha256: HASH, quantityMilli: 1350, unitPriceCents: 1000, discountCents: 170 }] });
  const decision = prepareFiscalV1Sale({ sale: weighted, profiles: [issuer()],
    rules: [rule("peso", "GRAVADA", { unitCode: "KGM" })], capabilities: [capability(["GRAVADA"])] });
  assert.equal(decision.totalCents, 1180);
  assert.equal(decision.baseCents, 1000);
  assert.equal(decision.taxCents, 180);
  assert.equal(decision.lines[0].unitCode, "KGM");
  assert.throws(() => prepareFiscalV1Sale({ sale: sale({ lines: [{ ...weighted.lines[0], discountCents: 1351 }] }),
    profiles: [issuer()], rules: [rule("peso", "GRAVADA")], capabilities: [capability(["GRAVADA"])] }),
  /FISCAL_V1_DISCOUNT_EXCEEDS_GROSS/);
});

test("misma presentación y fecha puede tener reglas distintas solo por contexto explícito", () => {
  const wholesale = { ...CONTEXT, operationKind: "DOMESTIC_WHOLESALE", buyerUse: "BUSINESS" } as const;
  const decision = prepareFiscalV1Sale({ sale: sale({ context: wholesale }), profiles: [issuer()],
    rules: [rule("queso", "EXONERADA"), rule("queso", "GRAVADA", { context: wholesale, ruleId: "wholesale-rule" })],
    capabilities: [capability(["GRAVADA"], { context: wholesale })] });
  assert.equal(decision.lines[0].ruleRef.ruleId, "wholesale-rule");
  assert.throws(() => prepareFiscalV1Sale({ sale: sale({ context: { ...wholesale, buyerUse: "UNKNOWN" as any } }),
    profiles: [issuer()], rules: [rule("queso", "GRAVADA")], capabilities: [capability(["GRAVADA"])] }),
  /FISCAL_V1_CONTEXT_REQUIRED/);
});

test("bloquea regla ausente, suspendida, solapada y huella de catálogo obsoleta", () => {
  const base = { sale: sale(), profiles: [issuer()], capabilities: [capability(["GRAVADA"])], rules: [rule("queso", "GRAVADA")] };
  assert.throws(() => prepareFiscalV1Sale({ ...base, rules: [] }), /FISCAL_V1_RULE_NOT_UNIQUE_OR_EFFECTIVE/);
  assert.throws(() => prepareFiscalV1Sale({ ...base, rules: [rule("queso", "GRAVADA", { status: "SUSPENDED" })] }),
    /FISCAL_V1_RULE_NOT_PUBLISHED/);
  assert.throws(() => prepareFiscalV1Sale({ ...base, rules: [...base.rules, rule("queso", "GRAVADA", { ruleId: "another" })] }),
    /FISCAL_V1_RULE_NOT_UNIQUE_OR_EFFECTIVE/);
  assert.throws(() => prepareFiscalV1Sale({ ...base, rules: [rule("queso", "GRAVADA", { catalogSemanticFingerprintSha256: "b".repeat(64) })] }),
    /FISCAL_V1_CATALOG_RULE_OUTDATED/);
});

test("capacidad es exacta: sin soporte, otra versión, otro conjunto u otra fecha bloquean", () => {
  const base = { sale: sale(), profiles: [issuer()], rules: [rule("queso", "GRAVADA")], capabilities: [capability(["GRAVADA"])] };
  for (const capabilities of [[], [capability(["GRAVADA"], { capabilityStatus: "UNVERIFIED" })],
    [capability(["GRAVADA"], { capabilityStatus: "UNSUPPORTED" })],
    [capability(["GRAVADA"], { profileVersion: "v2" })],
    [capability(["EXONERADA"])],
    [capability(["GRAVADA"], { effectiveFrom: "2026-10-16" })]])
    assert.throws(() => prepareFiscalV1Sale({ ...base, capabilities }), /FISCAL_V1_CAPABILITY_/);
  assert.throws(() => prepareFiscalV1Sale({ ...base, capabilities: [capability(["GRAVADA"], { evidence: undefined })] }),
    /FISCAL_V1_CANONICAL_JSON_INVALID/);
  assert.throws(() => prepareFiscalV1Sale({ ...base, capabilities: [capability(["GRAVADA"], { adapterVersion: "v2" })] }),
    /FISCAL_V1_CAPABILITY_NOT_UNIQUE_OR_EFFECTIVE/);
  assert.throws(() => prepareFiscalV1Sale({ ...base, capabilities: [capability(["GRAVADA"]), capability(["GRAVADA"],
    { capabilityId: "duplicate" })] }), /FISCAL_V1_CAPABILITY_NOT_UNIQUE_OR_EFFECTIVE/);
  assert.throws(() => prepareFiscalV1Sale({ sale: sale({ environment: "PRODUCTION" }),
    profiles: [issuer({ environment: "PRODUCTION", taxRegime: "NRUS" })], rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"], { environment: "PRODUCTION", taxRegime: "NRUS" })] }),
  /FISCAL_V1_CORRECTIVE_ROUTE_REQUIRED/);
});

test("cambio de perfil por fecha no reescribe el resultado histórico", () => {
  const historical = issuer({ effectiveFrom: "2026-10-01", effectiveTo: "2026-10-15", profileVersion: "old", fingerprintSha256: "b".repeat(64) });
  const current = issuer({ effectiveFrom: "2026-10-16", profileVersion: "new" });
  const common = { profiles: [historical, current], rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"], { profileVersion: "old" }), capability(["GRAVADA"], { profileVersion: "new" })] };
  const before = prepareFiscalV1Sale({ ...common, sale: sale({ occurredOn: "2026-10-15" }) });
  const after = prepareFiscalV1Sale({ ...common, sale: sale({ occurredOn: "2026-10-16" }) });
  assert.equal(before.profileRef.profileVersion, "old");
  assert.equal(after.profileRef.profileVersion, "new");
  assert.equal(before.profileRef.fingerprintSha256, fiscalV1PublicationArtifactFingerprint(historical));
  assert.equal(before.lines[0].totalCents, 1180);
});

test("la autoridad de emisión rechaza RUC compartido entre tenants del mismo entorno", () => {
  const first = issuer();
  const second = issuer({ tenantId: "tenant-b", issuerId: "emisor-b" });
  assert.throws(() => assertFiscalV1IssuerAuthority([first, second]), /FISCAL_V1_ISSUER_AUTHORITY_DUPLICATED/);
  assert.doesNotThrow(() => assertFiscalV1IssuerAuthority([first, { ...second, environment: "PRODUCTION" }]));
  assert.throws(() => assertFiscalV1IssuerAuthority([first, issuer({ issuerId: "otro", issuerRuc: "20987654321" })]),
    /FISCAL_V1_TENANT_MULTIPLE_ISSUERS/);
  assert.throws(() => assertFiscalV1IssuerAuthority([first, issuer({ environment: "PRODUCTION",
    issuerId: "otro", issuerRuc: "20987654321" })]), /FISCAL_V1_TENANT_MULTIPLE_ISSUERS/);
  assert.throws(() => assertFiscalV1IssuerAuthority([first, issuer({ profileId: "duplicado" })]),
    /FISCAL_V1_TENANT_PROFILE_OVERLAP/);
});

test("aísla tenant/RUC y no acepta factura NRUS ni GRAVADA con tasa cero", () => {
  const common = { sale: sale(), profiles: [issuer()], rules: [rule("queso", "GRAVADA")], capabilities: [capability(["GRAVADA"])] };
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ tenantId: "tenant-b" }) }), /FISCAL_V1_SCOPE_MISMATCH/);
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ issuerRuc: "20987654321" }) }), /FISCAL_V1_SCOPE_MISMATCH/);
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ documentType: "FACTURA" }),
    profiles: [issuer({ taxRegime: "NRUS" })] }), /FISCAL_V1_NRUS_FACTURA_FORBIDDEN/);
  assert.throws(() => prepareFiscalV1Sale({ ...common, rules: [rule("queso", "GRAVADA", { taxRateBasisPoints: 0 } as any)] }),
    /FISCAL_V1_TAX_REPRESENTATION_INVALID/);
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ occurredOn: "2026-02-30" }) }),
    /FISCAL_V1_OPERATION_DATE_INVALID/);
});

test("publicación exige firma, clave confiable, huellas y vigencia; no admite callback que apruebe todo", () => {
  const input = { sale: sale(), profiles: [issuer()], rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"])] };
  const signed = signedBundle(input);
  assert.equal(verifyFiscalV1PublicationBundle(signed.bundle, signed.trustedKeys, NOW).rules.length, 1);
  assert.throws(() => prepareFiscalV1SaleCore({ ...input, verifyPublication: () => true } as any),
    /FISCAL_V1_BUNDLE_INVALID/);
  assert.throws(() => prepareFiscalV1SaleCore({ sale: input.sale, ...signed, trustedKeys: [] }),
    /FISCAL_V1_PUBLISHER_NOT_TRUSTED/);
  assert.throws(() => prepareFiscalV1SaleCore({ sale: input.sale, ...signed, nowMs: NOW + 86400001 }),
    /FISCAL_V1_PUBLICATION_NOT_CURRENT/);
  assert.throws(() => prepareFiscalV1SaleCore({ sale: input.sale, ...signed, nowMs: NOW + 86400000 }),
    /FISCAL_V1_PUBLICATION_NOT_CURRENT/);
  assert.throws(() => prepareFiscalV1SaleCore({ sale: input.sale, ...signed,
    bundle: { ...signed.bundle, payload: { ...signed.bundle.payload,
      rules: [{ ...signed.bundle.payload.rules[0], sourceRef: "otro-origen" }] } } }),
    /FISCAL_V1_PUBLICATION_PAYLOAD_HASH_INVALID/);
  assert.throws(() => prepareFiscalV1SaleCore({ sale: input.sale, ...signed,
    bundle: { ...signed.bundle, signature: { ...signed.bundle.signature,
      signatureBase64: Buffer.alloc(64).toString("base64") } } }), /FISCAL_V1_SIGNATURE_INVALID/);
  const forged = { ...input, rules: [rule("queso", "EXONERADA", { fingerprintSha256: HASH })] };
  const forgedSigned = signedBundle(forged);
  const badPayload = { ...forgedSigned.bundle.payload, rules: [forged.rules[0]] };
  const badMaterial = fiscalV1PublicationPayloadMaterial(badPayload);
  const badBundle = { payload: badPayload, payloadSha256: fiscalV1PublicationPayloadFingerprint(badPayload),
    signature: { algorithm: "Ed25519" as const, keyId: KEY.keyId,
      signatureBase64: Buffer.from(nacl.sign.detached(Buffer.from(badMaterial, "utf8"),
        KEY_PAIR.secretKey)).toString("base64") } };
  assert.throws(() => prepareFiscalV1SaleCore({ sale: input.sale, bundle: badBundle,
    trustedKeys: signed.trustedKeys, nowMs: NOW }), /FISCAL_V1_PUBLICATION_INTEGRITY_INVALID/);
});

test("V1 exige PEN, comprador RUC en factura y rechaza gratuidad no modelada", () => {
  const common = { profiles: [issuer()], rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"])] };
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ currency: "USD" as any }) }),
    /FISCAL_V1_SALE_INVALID/);
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ documentType: "NOTA_CREDITO" as any }) }),
    /FISCAL_V1_SALE_INVALID/);
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ documentType: "FACTURA" }),
    capabilities: [capability(["GRAVADA"], { documentType: "FACTURA" })] }),
  /FISCAL_V1_FACTURA_BUYER_REQUIRED/);
  const factura = sale({ documentType: "FACTURA", context: { ...CONTEXT, buyerUse: "BUSINESS" },
    buyer: { documentType: "RUC", documentNumber: "20123456789", legalName: "COMPRADOR SINTÉTICO" } });
  const facturaDecision = prepareFiscalV1Sale({ sale: factura, profiles: [issuer()],
    rules: [rule("queso", "GRAVADA", { context: factura.context })],
    capabilities: [capability(["GRAVADA"], { documentType: "FACTURA", context: factura.context })] });
  assert.equal(facturaDecision.buyer?.documentNumber, "20123456789");
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ lines: [{ ...sale().lines[0], unitPriceCents: 0 }] }) }),
    /FISCAL_V1_LINE_INVALID/);
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ lines: [{ ...sale().lines[0], discountCents: 1180 }] }) }),
    /FISCAL_V1_FREE_LINE_NOT_MODELED/);
});

test("decisión serializada conserva nulidad y material canónico estable", () => {
  const args = { sale: sale(), profiles: [issuer({ taxRegime: "NRUS" })], rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"], { taxRegime: "NRUS" })] };
  const before = JSON.stringify(args);
  const decision = prepareFiscalV1Sale(args);
  const encoded = fiscalV1DecisionFingerprintMaterial(decision);
  assert.equal(fiscalV1DecisionFingerprintMaterial(JSON.parse(JSON.stringify(decision))), encoded);
  assert.equal(JSON.parse(encoded).taxCents, null);
  assert.equal(JSON.stringify(args), before);
});
