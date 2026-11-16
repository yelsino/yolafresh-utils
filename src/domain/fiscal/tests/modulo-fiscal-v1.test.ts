import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nacl from "tweetnacl";
import { FiscalV1PublicationProofMemo } from "../contracts/fiscal-v1-publication-proof-memo";
import * as publicApi from "../../../index";
import { unregisteredPolicy } from "./unregistered-goods.fixture";
import { assertFiscalCashPaymentRounding, assertFiscalV1GlobalDiscount, assertFiscalV1IssuerAuthority, fiscalV1DecisionFingerprintMaterial,
  fiscalV1PublicationArtifactFingerprint, fiscalV1PublicationPayloadFingerprint, fiscalV1PublicationPayloadMaterial,
  prepareFiscalV1Sale as prepareFiscalV1SaleCore,
  verifyFiscalV1PublicationBundle,
  type FiscalV1Capability, type FiscalV1IssuerProfile, type FiscalV1LegalCategory,
  type FiscalV1PresentationRule, type FiscalV1SaleInput, type FiscalV1SignedPublicationBundle,
  type FiscalV1TrustedPublisherKey, type FiscalCashPaymentRounding } from "../contracts";

const HASH = "a".repeat(64);
const CONTEXT = { establishmentId: "local-1", operationKind: "DOMESTIC_RETAIL", buyerUse: "FINAL_CONSUMER" } as const;
const SOURCE = "fixture-sintetica:revisar-fuente-y-vigencia-antes-de-produccion";
const NOW = Date.UTC(2026, 9, 15);
const KEY_PAIR = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7));
const CASH_ROUNDING: FiscalCashPaymentRounding = { schemaVersion: 1, amountCents: -4,
  policyId: "opaque cash policy / ñ", policyVersion: 1, currency: "PEN", stepCents: 10,
  direction: "A_FAVOR_CLIENTE", application: "EFECTIVO_TOTAL" };
const GLOBAL_DISCOUNT = { schemaVersion: 1, amountCents: 10, baseCents: 115, reasonCode: "03", affectsTaxBase: false } as const;
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

test("unregistered goods share catalogue money calculation and preserve their approved company policy source", () => {
  const free = { lineId: "opaque free line / ñ", unregisteredGood: { description: "Leche bolsa 1 L", unitCode: "NIU" as const },
    quantityMilli: 3000, unitPriceCents: 150, discountCents: 0 };
  const input = { sale: sale({ lines: [sale().lines[0], free] }), profiles: [issuer()],
    rules: [rule("queso", "GRAVADA")], capabilities: [capability(["GRAVADA"])] };
  const result = prepareFiscalV1SaleCore({ sale: input.sale, ...signedBundle(input), unregisteredGoodsPolicy: unregisteredPolicy() });
  assert.equal(result.totalCents, 1630); assert.equal(result.lines[1].totalCents, 450);
  assert.equal(result.lines[1].presentationId, undefined);
  assert.deepEqual(result.lines[1].unregisteredGood, free.unregisteredGood);
  assert.deepEqual(result.lines[1].ruleRef.unregisteredGoodsPolicy, unregisteredPolicy());
  assert.throws(() => prepareFiscalV1SaleCore({ sale: input.sale, ...signedBundle(input) }), /UNREGISTERED_GOODS_POLICY_REQUIRED/);
});

test("amount-only unregistered goods preserve the entered total without fabricating a catalogue unit price", () => {
  const input = { sale: sale({ lines: [{ lineId: "opaque amount line", quantityMilli: 1000,
    unregisteredGood: { description: "Perejil", unitCode: "NIU" }, unitPriceCents: 0, manualGrossTotalCents: 150, discountCents: 0 }] }),
    profiles: [issuer()], rules: [], capabilities: [capability(["GRAVADA"])] };
  const result = prepareFiscalV1SaleCore({ sale: input.sale, ...signedBundle(input), unregisteredGoodsPolicy: unregisteredPolicy() });
  assert.equal(result.totalCents, 150); assert.equal(result.lines[0].unitPriceCents, 0);
  assert.equal(result.lines[0].manualGrossTotalCents, 150);
  const forged = { ...input.sale, lines: [{ ...input.sale.lines[0], presentationId: "fabricated", catalogSemanticFingerprintSha256: HASH }] };
  assert.throws(() => prepareFiscalV1SaleCore({ sale: forged as any, ...signedBundle(input), unregisteredGoodsPolicy: unregisteredPolicy() }), /CATALOG_REFERENCE_FORBIDDEN/);
});

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
  assert.equal(publicApi.assertFiscalV1GlobalDiscount, assertFiscalV1GlobalDiscount);
});

test("global code03 preserves the 115-cent line/tax base and subtracts 10 before cash rounding to 100", () => {
  const original = sale({ lines: [{ ...sale().lines[0], unitPriceCents: 115 }] });
  const input = { sale: { ...original, globalDiscount: GLOBAL_DISCOUNT,
    cashPaymentRounding: { ...CASH_ROUNDING, amountCents: -5 } },
    profiles: [issuer()], rules: [rule("queso", "EXONERADA")], capabilities: [capability(["EXONERADA"])] };
  const bytes = JSON.stringify(input), result = prepareFiscalV1Sale(input);
  const unchanged = prepareFiscalV1Sale({ ...input, sale: original });
  assert.deepEqual(result.lines, unchanged.lines);
  assert.equal(result.lines[0].totalCents, 115); assert.equal(result.baseCents, 115); assert.equal(result.taxCents, 0);
  assert.equal(result.totalCents, 100); assert.deepEqual(result.globalDiscount, GLOBAL_DISCOUNT);
  assert.notEqual(result.globalDiscount, GLOBAL_DISCOUNT);
  assert.equal(JSON.stringify(input), bytes);
  const digital = prepareFiscalV1Sale({ ...input, sale: { ...original, globalDiscount: GLOBAL_DISCOUNT } });
  assert.equal(digital.totalCents, 105); assert.equal(digital.cashPaymentRounding, undefined);
  const threeCents = prepareFiscalV1Sale({ ...input, sale: { ...original,
    globalDiscount: { ...GLOBAL_DISCOUNT, amountCents: 3 }, cashPaymentRounding: { ...CASH_ROUNDING, amountCents: -2 } } });
  assert.equal(threeCents.totalCents, 110);
  assert.throws(() => prepareFiscalV1Sale({ ...input, sale: { ...input.sale,
    globalDiscount: { ...GLOBAL_DISCOUNT, amountCents: 3 } } }), /CASH_PAYMENT_ROUNDING_INVALID/);
});

test("global allowance validates exact keys, integer limits, matching base and a positive remainder", () => {
  assert.doesNotThrow(() => assertFiscalV1GlobalDiscount(GLOBAL_DISCOUNT, 115));
  const invalid: unknown[] = [null, [], {}, { ...GLOBAL_DISCOUNT, extra: true },
    { ...GLOBAL_DISCOUNT, schemaVersion: 2 }, { ...GLOBAL_DISCOUNT, reasonCode: "02" },
    { ...GLOBAL_DISCOUNT, affectsTaxBase: true }, { ...GLOBAL_DISCOUNT, baseCents: 114 },
    ...[0, -1, 115, 116, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(amountCents => ({ ...GLOBAL_DISCOUNT, amountCents })),
    { ...GLOBAL_DISCOUNT, [Symbol("hidden")]: true }];
  for (const value of invalid) assert.throws(() => assertFiscalV1GlobalDiscount(value, 115), /GLOBAL_DISCOUNT_INVALID/);
  assert.throws(() => assertFiscalV1GlobalDiscount(GLOBAL_DISCOUNT, Number.MAX_SAFE_INTEGER + 1), /GLOBAL_DISCOUNT_INVALID/);
});

test("global allowances keep existing line discounts separate and do not relax the cash/line-discount restriction", () => {
  const source = sale({ lines: [{ ...sale().lines[0], unitPriceCents: 125, discountCents: 10 }], globalDiscount: GLOBAL_DISCOUNT });
  const input = { sale: source, profiles: [issuer()], rules: [rule("queso", "INAFECTA")], capabilities: [capability(["INAFECTA"])] };
  const result = prepareFiscalV1Sale(input);
  assert.equal(result.lines[0].discountCents, 10); assert.equal(result.lines[0].totalCents, 115); assert.equal(result.totalCents, 105);
  assert.throws(() => prepareFiscalV1Sale({ ...input, sale: { ...source, cashPaymentRounding: { ...CASH_ROUNDING, amountCents: -5 } } }),
    /COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
});

test("global allowance rejects taxable/mixed baskets and invoices without inferring regime from the RUC", () => {
  const source = sale({ lines: [{ ...sale().lines[0], unitPriceCents: 115 }], globalDiscount: GLOBAL_DISCOUNT });
  for (const category of ["EXONERADA", "INAFECTA"] as const) {
    assert.equal(prepareFiscalV1Sale({ sale: source, profiles: [issuer()], rules: [rule("queso", category)], capabilities: [capability([category])] }).totalCents, 105);
  }
  assert.throws(() => prepareFiscalV1Sale({ sale: source, profiles: [issuer()], rules: [rule("queso", "GRAVADA")], capabilities: [capability(["GRAVADA"])] }), /GLOBAL_DISCOUNT_UNSUPPORTED/);
  const mixed = { ...source, lines: [...source.lines, { ...source.lines[0], lineId: "opaque taxed / α", presentationId: "other",
    catalogSemanticFingerprintSha256: HASH, unregisteredGood: undefined }],
    globalDiscount: { ...GLOBAL_DISCOUNT, baseCents: 230 } };
  assert.throws(() => prepareFiscalV1Sale({ sale: mixed, profiles: [issuer()], rules: [rule("queso", "EXONERADA"), rule("other", "GRAVADA")],
    capabilities: [capability(["EXONERADA", "GRAVADA"])] }), /GLOBAL_DISCOUNT_UNSUPPORTED/);
  assert.throws(() => prepareFiscalV1Sale({ sale: { ...source, documentType: "FACTURA" }, profiles: [issuer()], rules: [rule("queso", "EXONERADA")],
    capabilities: [capability(["EXONERADA"])] }), /COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
  const nrus = { ...source, issuerRuc: "15123456789" };
  const result = prepareFiscalV1Sale({ sale: nrus, profiles: [issuer({ issuerRuc: nrus.issuerRuc, taxRegime: "NRUS" })],
    rules: [rule("queso", "EXONERADA")], capabilities: [capability(["EXONERADA"], { taxRegime: "NRUS" })] });
  assert.equal(result.taxRegime, "NRUS"); assert.equal(result.totalCents, 105); assert.equal(result.taxCents, null);
  assert.throws(() => prepareFiscalV1Sale({ sale: nrus, profiles: [issuer({ issuerRuc: nrus.issuerRuc, taxRegime: "NRUS" })],
    rules: [rule("queso", "GRAVADA")], capabilities: [capability(["GRAVADA"], { taxRegime: "NRUS" })] }), /GLOBAL_DISCOUNT_UNSUPPORTED/);
});

test("global allowance cannot bring an unidentified buyer below the original-line identification threshold", () => {
  const source = sale({ lines: [{ ...sale().lines[0], unitPriceCents: 70001 }],
    globalDiscount: { ...GLOBAL_DISCOUNT, amountCents: 2, baseCents: 70001 } });
  const input = { sale: source, profiles: [issuer()], rules: [rule("queso", "EXONERADA")], capabilities: [capability(["EXONERADA"])] };
  assert.throws(() => prepareFiscalV1Sale(input), /BUYER_IDENTIFICATION_REQUIRED/);
  assert.equal(prepareFiscalV1Sale({ ...input, sale: { ...source,
    buyer: { documentType: "DNI", documentNumber: "12345678", legalName: "SYNTHETIC BUYER" } } }).totalCents, 69999);
});

function proofFixture(label: string) {
  const fixture = JSON.parse(readFileSync(resolve(process.cwd(),
    "src/docs/fiscal/fixtures/fiscal-v1-signed-golden.json"), "utf8")) as {
      sale: FiscalV1SaleInput; bundle: FiscalV1SignedPublicationBundle;
      trustedKey: FiscalV1TrustedPublisherKey; nowMs: number;
    };
  // keyId is opaque signature metadata, outside the already signed payload.
  const keyId = "opaque publisher / " + label;
  return { ...fixture, bundle: { ...fixture.bundle, signature: { ...fixture.bundle.signature, keyId } },
    trustedKeys: [{ ...fixture.trustedKey, keyId }] };
}
const copyProof = <T>(value: T): T => JSON.parse(JSON.stringify(value));

test("prepare reuses exact publication proof but still evaluates each current sale and returns caller data", t => {
  const fixture = proofFixture("prepare reuse"), calls = t.mock.method(nacl.sign.detached, "verify");
  const first = prepareFiscalV1SaleCore(fixture);
  const currentBundle = copyProof(fixture.bundle);
  assert.equal(verifyFiscalV1PublicationBundle(currentBundle, copyProof(fixture.trustedKeys), fixture.nowMs + 1), currentBundle.payload);
  const secondSale = { ...fixture.sale, saleId: "another opaque sale", operationId: "another opaque operation",
    lines: fixture.sale.lines.map(line => ({ ...line, quantityMilli: line.quantityMilli * 2 })) };
  const second = prepareFiscalV1SaleCore({ ...fixture, bundle: currentBundle, sale: secondSale, nowMs: fixture.nowMs + 2 });
  assert.equal(second.totalCents, first.totalCents * 2);
  assert.equal(second.saleId, secondSale.saleId);
  assert.throws(() => prepareFiscalV1SaleCore({ ...fixture,
    sale: { ...fixture.sale, lines: [{ ...fixture.sale.lines[0], quantityMilli: 0 }] } }), /FISCAL_V1_/);
  assert.throws(() => prepareFiscalV1SaleCore({ ...fixture,
    sale: { ...fixture.sale, occurredOn: "2000-01-01" } }), /FISCAL_V1_/);
  assert.equal(calls.mock.callCount(), 1);
});

test("the SDK proof never trusts advertised hashes after payload, signature, scope or public key replacement", () => {
  for (const kind of ["payload", "signature", "tenant", "environment", "publicKey", "revoked"] as const) {
    const fixture = proofFixture("tamper " + kind);
    verifyFiscalV1PublicationBundle(fixture.bundle, fixture.trustedKeys, fixture.nowMs);
    const changed = copyProof(fixture.bundle) as any;
    let supplied = copyProof(fixture.trustedKeys);
    if (kind === "payload") changed.payload.issuerId = "substituted opaque issuer";
    if (kind === "signature") changed.signature.signatureBase64 =
      (changed.signature.signatureBase64[0] === "A" ? "B" : "A") + changed.signature.signatureBase64.slice(1);
    if (kind === "tenant") changed.payload.tenantId = "other tenant";
    if (kind === "environment") changed.payload.environment = "PRODUCTION";
    if (kind === "publicKey") supplied = [{ ...supplied[0],
      publicKeyBase64: Buffer.from(nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(31)).publicKey).toString("base64") }];
    if (kind === "revoked") supplied = [];
    assert.equal(changed.payloadSha256, fixture.bundle.payloadSha256);
    assert.throws(() => verifyFiscalV1PublicationBundle(changed, supplied, fixture.nowMs + 1), /FISCAL_V1_/);
  }
});

test("publication proof is not an object identity cache and cannot conceal caller mutation", () => {
  const fixture = proofFixture("mutable data"), original = copyProof(fixture.bundle);
  verifyFiscalV1PublicationBundle(original, fixture.trustedKeys, fixture.nowMs);
  (original.payload as any).issuerId = "mutated after proof";
  assert.throws(() => verifyFiscalV1PublicationBundle(original, fixture.trustedKeys, fixture.nowMs + 1), /PAYLOAD_HASH_INVALID/);
  const current = copyProof(fixture.bundle);
  assert.equal(verifyFiscalV1PublicationBundle(current, fixture.trustedKeys, fixture.nowMs + 2), current.payload);
});

test("proof validity is bounded by publication/key expiry and never reads a wall clock", t => {
  const fixture = proofFixture("time validity");
  t.mock.method(Date, "now", () => { throw Error("wall clock must not be read"); });
  verifyFiscalV1PublicationBundle(fixture.bundle, fixture.trustedKeys, fixture.nowMs);
  assert.throws(() => verifyFiscalV1PublicationBundle(fixture.bundle, fixture.trustedKeys, fixture.bundle.payload.expiresAtMs), /NOT_CURRENT/);
  const shortKeys = [{ ...fixture.trustedKeys[0], validToMs: fixture.nowMs + 1000 }];
  verifyFiscalV1PublicationBundle(fixture.bundle, shortKeys, fixture.nowMs);
  assert.throws(() => verifyFiscalV1PublicationBundle(fixture.bundle, shortKeys, fixture.nowMs + 1000), /KEY_NOT_CURRENT/);
  assert.throws(() => verifyFiscalV1PublicationBundle(fixture.bundle, fixture.trustedKeys, NaN), /PAYLOAD_INVALID/);
});

test("internal memo keeps interleaved reader times but rechecks TTL, future key boundaries and rollback", () => {
  const fixture = proofFixture("internal time"), checks: number[] = [];
  const memo = new FiscalV1PublicationProofMemo((bundle, _keys, now) => { checks.push(now); return bundle.payload; });
  const supplied = [...fixture.trustedKeys, { ...fixture.trustedKeys[0], keyId: "future opaque key",
    validFromMs: fixture.nowMs + 1000, validToMs: fixture.nowMs + 2000 }];
  memo.verify(fixture.bundle, supplied, fixture.nowMs);
  memo.verify(copyProof(fixture.bundle), copyProof(supplied), fixture.nowMs + 2);
  memo.verify(copyProof(fixture.bundle), copyProof(supplied), fixture.nowMs + 1);
  assert.equal(checks.length, 1);
  memo.verify(fixture.bundle, supplied, fixture.nowMs + 1000);
  memo.verify(fixture.bundle, supplied, fixture.nowMs + 2000);
  assert.equal(checks.length, 3);
  memo.verify(fixture.bundle, supplied, fixture.nowMs + 302000);
  assert.equal(checks.length, 4);
  memo.verify(fixture.bundle, supplied, fixture.nowMs + 301999);
  assert.equal(checks.length, 5);
  memo.verify(fixture.bundle, supplied, NaN);
  memo.verify(fixture.bundle, supplied, fixture.nowMs + 302001);
  assert.equal(checks.length, 7);
});

test("internal memo does not retain failures or transformed verifier projections", () => {
  const fixture = proofFixture("errors"); let failures = 0, transformations = 0;
  const failing = new FiscalV1PublicationProofMemo(() => { failures++; throw Error("expected rejection"); });
  for (let i = 0; i < 2; i++) assert.throws(() => failing.verify(fixture.bundle, fixture.trustedKeys, fixture.nowMs), /expected rejection/);
  const projecting = new FiscalV1PublicationProofMemo(bundle => { transformations++; return copyProof(bundle.payload); });
  projecting.verify(fixture.bundle, fixture.trustedKeys, fixture.nowMs);
  projecting.verify(fixture.bundle, fixture.trustedKeys, fixture.nowMs + 1);
  assert.equal(failures, 2); assert.equal(transformations, 2);
});

test("memo eligibility never executes accessors or hides non-JSON/exotic descriptor values", () => {
  const fixture = proofFixture("descriptor guard");
  for (const kind of ["getter", "toJSON", "hidden", "undefined", "symbol", "function", "NaN", "negativeZero", "prototype", "sparse", "cycle"]) {
    let fullChecks = 0, getterCalls = 0, toJsonCalls = 0;
    const memo = new FiscalV1PublicationProofMemo(bundle => { fullChecks++; return bundle.payload; });
    memo.verify(fixture.bundle, fixture.trustedKeys, fixture.nowMs);
    const changed = copyProof(fixture.bundle) as any;
    if (kind === "getter") Object.defineProperty(changed, "extra", { enumerable: true, get: () => { getterCalls++; return undefined; } });
    if (kind === "toJSON") Object.defineProperty(changed, "toJSON", { get: () => { toJsonCalls++; return () => fixture.bundle; } });
    if (kind === "hidden") Object.defineProperty(changed, "extra", { value: "hidden", enumerable: false });
    if (kind === "undefined") changed.extra = undefined;
    if (kind === "symbol") changed[Symbol("extra")] = true;
    if (kind === "function") changed.extra = () => undefined;
    if (kind === "NaN") changed.extra = NaN;
    if (kind === "negativeZero") changed.extra = -0;
    if (kind === "prototype") Object.setPrototypeOf(changed, { inherited: true });
    if (kind === "sparse") changed.extra = new Array(1);
    if (kind === "cycle") changed.extra = changed;
    memo.verify(changed, fixture.trustedKeys, fixture.nowMs + 1);
    memo.verify(changed, fixture.trustedKeys, fixture.nowMs + 2);
    assert.equal(fullChecks, 3, kind); assert.equal(getterCalls, 0, kind); assert.equal(toJsonCalls, 0, kind);
  }
});

test("internal memo bounds successful proof count and serialized UTF16 memory", () => {
  const fixture = proofFixture("budgets"); let checks = 0;
  const memo = new FiscalV1PublicationProofMemo(bundle => { checks++; return bundle.payload; });
  memo.verify(fixture.bundle, fixture.trustedKeys, fixture.nowMs);
  for (let i = 0; i < 8; i++) memo.verify(fixture.bundle,
    [...fixture.trustedKeys, { ...fixture.trustedKeys[0], keyId: "opaque additional " + i }], fixture.nowMs);
  memo.verify(fixture.bundle, fixture.trustedKeys, fixture.nowMs + 1);
  assert.equal(checks, 10);
  const oversized = [{ ...fixture.trustedKeys[0], publicKeyBase64: "x".repeat(2 * 1024 * 1024) }];
  memo.verify(fixture.bundle, oversized, fixture.nowMs + 2);
  memo.verify(fixture.bundle, oversized, fixture.nowMs + 3);
  assert.equal(checks, 12);
  const large = [0, 1, 2].map(i => [{ ...fixture.trustedKeys[0], publicKeyBase64: i + "x".repeat(1536 * 1024) }]);
  for (const supplied of large) memo.verify(fixture.bundle, supplied, fixture.nowMs + 4);
  memo.verify(fixture.bundle, large[2], fixture.nowMs + 5);
  assert.equal(checks, 15);
  memo.verify(fixture.bundle, large[0], fixture.nowMs + 6);
  assert.equal(checks, 16);
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

test("ordinary basis is frozen from the signed rule without inventing a regional exemption outside Amazonía", () => {
  const ordinaryFiscalTreatment = { basis: "APPENDIX_I", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0 } as const;
  const input = { sale: sale(), profiles: [issuer()], rules: [rule("queso", "EXONERADA", { ordinaryFiscalTreatment })],
    capabilities: [capability(["EXONERADA"])] };
  const ordinary = prepareFiscalV1Sale(input);
  assert.deepEqual(ordinary.lines[0].ordinaryFiscalTreatment, ordinaryFiscalTreatment);
  assert.equal(Object.prototype.hasOwnProperty.call(ordinary, "amazonia"), false);
  const facts = { transfer: { status: "CONFIRMED", ubigeo: "120601", evidenceRef: "opaque establishment" },
    consumption: { status: "OUTSIDE", evidenceRef: "opaque evidence" } } as const;
  const regionalSale = { ...input.sale, amazoniaFacts: facts };
  const outside = prepareFiscalV1SaleCore({ sale: regionalSale, ...signedBundle({ ...input, sale: regionalSale }),
    amazonia: { facts, decision: { kind: "ORDINARY", reason: "OUTSIDE" } } });
  assert.deepEqual(outside.lines[0].ordinaryFiscalTreatment, ordinaryFiscalTreatment);
  assert.equal(outside.amazonia?.decision.kind, "ORDINARY");
  assert.equal(Object.prototype.hasOwnProperty.call(outside.amazonia!, "lineDecisions"), false);
  const legacy = prepareFiscalV1Sale({ ...input, rules: [rule("queso", "EXONERADA")] });
  assert.equal(Object.prototype.hasOwnProperty.call(legacy.lines[0], "ordinaryFiscalTreatment"), false);
  assert.notEqual(fiscalV1DecisionFingerprintMaterial(ordinary), fiscalV1DecisionFingerprintMaterial(legacy));
});

test("signed ordinary basis rejects regional law, incompatible category, extra fields and a nonzero ordinary rate", () => {
  for (const ordinaryFiscalTreatment of [
    { basis: "LEY_27037_ART_13_1_A", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0 },
    { basis: "APPENDIX_I", ordinaryCategory: "INAFECTA", ordinaryTaxRateBasisPoints: 0 },
    { basis: "APPENDIX_I", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 1800 },
    { basis: "APPENDIX_I", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0, inferred: true },
  ]) assert.throws(() => prepareFiscalV1Sale({ sale: sale(), profiles: [issuer()],
    rules: [rule("queso", "EXONERADA", { ordinaryFiscalTreatment } as any)], capabilities: [capability(["EXONERADA"])] }),
    /FISCAL_V1_ORDINARY_FISCAL_TREATMENT_INVALID/);
  assert.throws(() => prepareFiscalV1Sale({ sale: sale(), profiles: [issuer()],
    rules: [rule("queso", "GRAVADA", { ordinaryFiscalTreatment: {
      basis: "APPENDIX_I", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0 } })], capabilities: [capability(["GRAVADA"])] }),
    /FISCAL_V1_ORDINARY_FISCAL_TREATMENT_MISMATCH/);
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

test("boleta de consumidor final conserva buyer ausente hasta S/700 en Demo y Producción", () => {
  for (const environment of ["DEMO", "PRODUCTION"] as const) {
    for (const totalCents of [1100, 70_000]) {
      const decision = prepareFiscalV1Sale({
        sale: sale({ environment, lines: [{ ...sale().lines[0], unitPriceCents: totalCents }] }),
        profiles: [issuer({ environment })], rules: [rule("queso", "GRAVADA")],
        capabilities: [capability(["GRAVADA"], { environment })],
      });
      assert.equal(decision.totalCents, totalCents);
      assert.equal(Object.prototype.hasOwnProperty.call(decision, "buyer"), false);
      assert.equal(fiscalV1DecisionFingerprintMaterial(decision).includes('"buyer"'), false);
    }
  }
});

test("S/700.01 exige identificación sin bloquear la boleta identificada", () => {
  const common = { profiles: [issuer()], rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"])] };
  const overLimit = sale({ lines: [{ ...sale().lines[0], unitPriceCents: 70_001 }] });
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: overLimit }), /FISCAL_BUYER_IDENTIFICATION_REQUIRED/);
  const buyer = { documentType: "DNI", documentNumber: "12345678", legalName: "CLIENTE SINTÉTICO" } as const;
  assert.deepEqual(prepareFiscalV1Sale({ ...common, sale: { ...overLimit, buyer } }).buyer, buyer);
});

test("un comprador malformado no se convierte en consumidor final", () => {
  const common = { profiles: [issuer()], rules: [rule("queso", "GRAVADA")],
    capabilities: [capability(["GRAVADA"])] };
  for (const buyer of [null, { documentType: "SIN_DOCUMENTO", documentNumber: null, legalName: "Consumidor final" },
    { documentType: "DNI", documentNumber: "123", legalName: "Cliente" },
    { documentType: "DNI", documentNumber: 12345678, legalName: "Cliente" },
    { documentType: "RUC", documentNumber: "20123456789", legalName: "" }]) {
    assert.throws(() => prepareFiscalV1Sale({ ...common, sale: sale({ buyer: buyer as never }) }), /FISCAL_V1_BUYER_INVALID/);
  }
});

test("ajuste cash explícito conserva las cinco líneas, el precio de catálogo y la base antes del cobro", () => {
  for (const environment of ["DEMO", "PRODUCTION"] as const) {
    const amounts = [522, 128, 168, 186, 100];
    const lines = amounts.map((amount, index) => ({ ...sale().lines[0], lineId: `opaque line / ${index}`,
      presentationId: `opaque presentation / ${index}`, catalogSemanticFingerprintSha256: HASH, unregisteredGood: undefined,
      unitPriceCents: index === 4 ? 1500 : amount,
      ...(index === 4 ? { manualGrossTotalCents: 100 } : {}) }));
    const input = { sale: sale({ environment, lines, cashPaymentRounding: CASH_ROUNDING }),
      profiles: [issuer({ environment })], rules: lines.map(line => rule(line.presentationId, "EXONERADA")),
      capabilities: [capability(["EXONERADA"], { environment })] };
    const sourceBytes = JSON.stringify(input);
    const decision = prepareFiscalV1Sale(input);
    assert.deepEqual(decision.lines.map(line => line.totalCents), amounts);
    assert.equal(decision.lines[4].unitPriceCents, 1500);
    assert.equal(decision.lines[4].quantityMilli, 1000);
    assert.equal(decision.lines[4].manualGrossTotalCents, 100);
    assert.ok(decision.lines.every(line => line.discountCents === 0));
    assert.equal(decision.baseCents, 1104);
    assert.equal(decision.taxCents, 0);
    assert.equal(decision.totalCents, 1100);
    assert.deepEqual(decision.cashPaymentRounding, CASH_ROUNDING);
    assert.equal(JSON.stringify(input), sourceBytes);
    assert.deepEqual(prepareFiscalV1Sale(input), decision);
    const changedPolicy = prepareFiscalV1Sale({ ...input, sale: { ...input.sale,
      cashPaymentRounding: { ...CASH_ROUNDING, policyVersion: 2 } } });
    assert.notEqual(fiscalV1DecisionFingerprintMaterial(changedPolicy), fiscalV1DecisionFingerprintMaterial(decision));
  }
});

test("cash exige metadatos exactos y el resto decimal real, sin aceptar ajustes mixtos o descuentos", () => {
  for (let remainder = 1; remainder <= 9; remainder++)
    assert.doesNotThrow(() => assertFiscalCashPaymentRounding({ ...CASH_ROUNDING, amountCents: -remainder }, 1100 + remainder, 1100));
  for (const changed of [{ schemaVersion: 2 }, { amountCents: 0 }, { amountCents: 4 }, { amountCents: -10 },
    { amountCents: -3 }, { policyId: "" }, { policyVersion: 0 }, { currency: "USD" }, { stepCents: 5 },
    { direction: "A_FAVOR_COMERCIO" }, { application: "EFECTIVO_MIXTO" }, { extra: true }])
    assert.throws(() => assertFiscalCashPaymentRounding({ ...CASH_ROUNDING, ...changed }, 1104, 1100),
      /FISCAL_CASH_PAYMENT_ROUNDING_INVALID/);
  for (const [pre, payable] of [[1104, 1101], [1100, 1100], [4, 0], [1104.1, 1100]])
    assert.throws(() => assertFiscalCashPaymentRounding(CASH_ROUNDING, pre, payable), /FISCAL_CASH_PAYMENT_ROUNDING_INVALID/);
  const common = { profiles: [issuer()], rules: [rule("queso", "EXONERADA")], capabilities: [capability(["EXONERADA"])] };
  const cashSale = sale({ cashPaymentRounding: CASH_ROUNDING,
    lines: [{ ...sale().lines[0], unitPriceCents: 1104 }] });
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: { ...cashSale, documentType: "FACTURA" } }),
    /FISCAL_V1_COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: { ...cashSale,
    lines: [{ ...cashSale.lines[0], discountCents: 1 }] } }), /FISCAL_V1_COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
});

test("bruto manual exige captura positiva y sin descuento; no añade redondeo ni cambia el catálogo", () => {
  const common = { profiles: [issuer()], rules: [rule("queso", "EXONERADA")], capabilities: [capability(["EXONERADA"])] };
  const manual = sale({ lines: [{ ...sale().lines[0], unitPriceCents: 1500, manualGrossTotalCents: 100 }] });
  const decision = prepareFiscalV1Sale({ ...common, sale: manual });
  assert.equal(decision.totalCents, 100);
  assert.equal(decision.lines[0].unitPriceCents, 1500);
  assert.equal(decision.lines[0].manualGrossTotalCents, 100);
  assert.equal(Object.prototype.hasOwnProperty.call(decision, "cashPaymentRounding"), false);
  for (const amount of [0, -1, 0.1, NaN])
    assert.throws(() => prepareFiscalV1Sale({ ...common, sale: { ...manual,
      lines: [{ ...manual.lines[0], manualGrossTotalCents: amount }] } }), /FISCAL_V1_MANUAL_GROSS_TOTAL_INVALID/);
});

test("el límite técnico inicial de anonimato V3 usa el importe anterior al ajuste", () => {
  const common = { profiles: [issuer()], rules: [rule("queso", "EXONERADA")], capabilities: [capability(["EXONERADA"])] };
  const rounded = sale({ lines: [{ ...sale().lines[0], unitPriceCents: 70_004 }], cashPaymentRounding: CASH_ROUNDING });
  assert.throws(() => prepareFiscalV1Sale({ ...common, sale: rounded }), /FISCAL_BUYER_IDENTIFICATION_REQUIRED/);
  assert.equal(prepareFiscalV1Sale({ ...common, sale: { ...rounded,
    buyer: { documentType: "DNI", documentNumber: "12345678", legalName: "SYNTHETIC BUYER" } } }).totalCents, 70_000);
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


test("Amazonia freezes confirmed facts and preserves final cents under the signed Demo capability", () => {
  const buyer = { documentType: "DNI", documentNumber: "12345678", legalName: "Cliente Demo" } as const;
  const facts = { transfer: { status: "CONFIRMED", ubigeo: "120601", evidenceRef: "local-1" },
    consumption: { status: "CONFIRMED", ubigeo: "120601", evidenceRef: "CASHIER_DECLARATION" } } as const;
  const regionalSale = sale({ issuerRuc: "20123456789", buyer, amazoniaFacts: facts });
  const profile = issuer({ issuerRuc: regionalSale.issuerRuc });
  const ordinaryRule = rule("queso", "GRAVADA");
  const exemptCapability = capability(["EXONERADA"], { amazoniaSale: "DEMO_PILOT", amazoniaTransferUbigeo: "120601" });
  const signed = signedBundle({ sale: regionalSale, profiles: [profile], rules: [ordinaryRule],
    capabilities: [capability(["EXONERADA"], { capabilityId: "ordinary-exemption" }), exemptCapability] });
  const amazonia = { facts, decision: { kind: "EXEMPT", basis: "LEY_27037_ART_13_1_A",
    approvalId: "opaque-approval", territoryVersion: "pilot-v1" } } as const;
  const input = { sale: regionalSale, ...signed, amazonia };
  const prepared = prepareFiscalV1SaleCore(input);
  assert.equal(prepared.totalCents, 1180);
  assert.equal(prepared.baseCents, 1180);
  assert.equal(prepared.taxCents, 0);
  assert.equal(prepared.lines[0].legalCategory, "EXONERADA");
  assert.equal(prepared.lines[0].ruleRef.ruleId, ordinaryRule.ruleId);
  assert.deepEqual(prepared.amazonia, amazonia);
  assert.throws(() => prepareFiscalV1SaleCore({ ...input, ...signedBundle({ sale: regionalSale,
    profiles: [profile], rules: [ordinaryRule], capabilities: [{ ...exemptCapability, amazoniaTransferUbigeo: "150101" }] }) }),
  /AMAZONIA_ESTABLISHMENT_MISMATCH/);
  assert.throws(() => prepareFiscalV1SaleCore({ ...input, ...signedBundle({ sale: regionalSale,
    profiles: [profile], rules: [ordinaryRule], capabilities: [capability(["EXONERADA"], { amazoniaSale: "DEMO_PILOT" })] }) }),
  /AMAZONIA_CAPABILITY_INVALID/);
  assert.throws(() => prepareFiscalV1SaleCore({ sale: regionalSale, ...signed }), /AMAZONIA_AUTHORITY_REQUIRED/);
  assert.throws(() => prepareFiscalV1SaleCore({ ...input, sale: { ...regionalSale,
    amazoniaFacts: { ...facts, consumption: { status: "CONFIRMED", ubigeo: "150101", evidenceRef: "CASHIER_DECLARATION" } } } }),
  /AMAZONIA_AUTHORITY_REQUIRED/);
  assert.throws(() => prepareFiscalV1SaleCore({ ...input, ...signedBundle({ sale: regionalSale,
    profiles: [profile], rules: [ordinaryRule], capabilities: [capability(["EXONERADA"])] }) }), /AMAZONIA_CAPABILITY_REQUIRED/);
  assert.throws(() => prepareFiscalV1SaleCore({ ...input, ...signedBundle({ sale: regionalSale,
    profiles: [profile], rules: [rule("queso", "EXONERADA")], capabilities: [exemptCapability] }) }), /AMAZONIA_LINE_SCOPE_UNSUPPORTED/);
});

test("Amazonía RER RUC10/20 en Producción conserva ApéndiceI, otras exoneraciones e inafectación por línea", () => {
  for (const issuerRuc of ["10123456789", "20123456789"]) {
    const facts = { transfer: { status: "CONFIRMED", ubigeo: "120601", evidenceRef: "local-1" },
      consumption: { status: "CONFIRMED", ubigeo: "120602", evidenceRef: "CASHIER_DECLARATION" } } as const;
    const regionalSale = sale({ environment: "PRODUCTION", issuerRuc, amazoniaFacts: facts,
      buyer: { documentType: "DNI", documentNumber: "12345678", legalName: "Synthetic buyer" },
      lines: ["g", "e", "o", "i"].map(lineId => ({ ...sale().lines[0], lineId, presentationId: lineId,
        catalogSemanticFingerprintSha256: HASH, unregisteredGood: undefined })) });
    const rows = [
      { lineId: "g", basis: "LEY_27037_ART_13_1_A", ordinaryCategory: "GRAVADA", ordinaryTaxRateBasisPoints: 1800 },
      { lineId: "e", basis: "APPENDIX_I", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0 },
      { lineId: "o", basis: "ORDINARY_EXEMPTION", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0 },
      { lineId: "i", basis: "ORDINARY_UNAFFECTED", ordinaryCategory: "INAFECTA", ordinaryTaxRateBasisPoints: 0 },
    ] as const;
    const signed = signedBundle({ sale: regionalSale, profiles: [issuer({ issuerRuc, environment: "PRODUCTION" })],
      rules: [rule("g", "GRAVADA"), rule("e", "EXONERADA"), rule("o", "EXONERADA"), rule("i", "INAFECTA")],
      capabilities: [capability(["EXONERADA", "INAFECTA"], { environment: "PRODUCTION",
        amazoniaSale: "ONEROUS_GOODS", amazoniaTransferUbigeo: "120601" })] });
    const amazonia = { facts, lineDecisions: rows, decision: { kind: "EXEMPT", basis: "LEY_27037_ART_13_1_A",
      approvalId: "approved", territoryVersion: "SATIPO-2026-11-11" } } as const;
    const input = { sale: regionalSale, ...signed, amazonia };
    const result = prepareFiscalV1SaleCore(input);
    assert.equal(result.totalCents, 4720);
    assert.equal(result.taxCents, 0);
    assert.deepEqual(result.lines.map(row => row.legalCategory), ["EXONERADA", "EXONERADA", "EXONERADA", "INAFECTA"]);
    assert.deepEqual(result.amazonia, amazonia);
    assert.equal(signed.bundle.payload.rules[0].legalCategory, "GRAVADA");
    assert.throws(() => prepareFiscalV1SaleCore({ ...input, amazonia: { ...amazonia, lineDecisions: rows.slice(1) } }),
      /LINE_DECISION_MISMATCH/);
    assert.throws(() => prepareFiscalV1SaleCore({ ...input, amazonia: { ...amazonia,
      lineDecisions: [{ ...rows[0], ordinaryTaxRateBasisPoints: 1000 }, ...rows.slice(1)] } }), /LINE_DECISION_MISMATCH/);
  }
});
