import { isFiscalTaxRegime } from "./cpe.contract";
import { fiscalConfigurationCanonicalJson } from "./configuracion-fiscal";
import { validateFiscalCivilDate } from "./reglas-tributarias";
import { sha256 as digestSha256 } from "@noble/hashes/sha256";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import nacl from "tweetnacl";
import type { FiscalV1Capability, FiscalV1EffectivePublication, FiscalV1IssuerProfile,
  FiscalV1LegalCategory, FiscalV1OperationContext, FiscalV1PreparedDecision, FiscalV1PreparedLine,
  FiscalV1PresentationRule, FiscalV1PublicationArtifact, FiscalV1PublicationPayload,
  FiscalV1SaleInput, FiscalV1SaleLineInput, FiscalV1SignedPublicationBundle,
  FiscalV1TrustedPublisherKey } from "./modulo-fiscal-v1.contract";

const fail = (code: string): never => { throw new Error(code); };
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const sha256 = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const cents = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const positive = (value: unknown): value is number => cents(value) && Number(value) > 0;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function exactKeys(value: unknown, required: readonly string[], optional: readonly string[], code: string): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail(code);
  const keys = Object.keys(value as object);
  if (required.some(key => !Object.prototype.hasOwnProperty.call(value, key)) ||
      keys.some(key => !required.includes(key) && !optional.includes(key))) fail(code);
}

function jsonValue(value: unknown): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(value, i)) fail("FISCAL_V1_CANONICAL_JSON_INVALID");
      jsonValue(value[i]);
    }
    return;
  }
  if (value && typeof value === "object" &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    for (const key of Object.keys(value)) jsonValue((value as Record<string, unknown>)[key]);
    return;
  }
  fail("FISCAL_V1_CANONICAL_JSON_INVALID");
}

function canonical(value: unknown): string {
  jsonValue(value);
  return fiscalConfigurationCanonicalJson(value);
}

function sha256Hex(value: string): string {
  return bytesToHex(digestSha256(utf8ToBytes(value)));
}

/** Huella de un valor JSON estricto; rechaza undefined, NaN y tipos no serializables. */
export function fiscalV1CanonicalSha256(value: unknown): string {
  return sha256Hex(canonical(value));
}

function decodeBase64(value: unknown, byteLength: number): Uint8Array {
  if (typeof value !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
    return fail("FISCAL_V1_SIGNATURE_ENCODING_INVALID");
  const encoded = value as string;
  const result: number[] = [];
  for (let index = 0; index < encoded.length; index += 4) {
    const chunk = encoded.slice(index, index + 4);
    const a = BASE64.indexOf(chunk[0]); const b = BASE64.indexOf(chunk[1]);
    const c = chunk[2] === "=" ? 0 : BASE64.indexOf(chunk[2]);
    const d = chunk[3] === "=" ? 0 : BASE64.indexOf(chunk[3]);
    const packed = (a << 18) | (b << 12) | (c << 6) | d;
    result.push((packed >> 16) & 255);
    if (chunk[2] !== "=") result.push((packed >> 8) & 255);
    if (chunk[3] !== "=") result.push(packed & 255);
  }
  if (result.length !== byteLength) fail("FISCAL_V1_SIGNATURE_ENCODING_INVALID");
  return Uint8Array.from(result);
}

const PUBLICATION_FIELDS = ["status", "effectiveFrom", "publishedAt", "sourceRef", "fingerprintSha256"];
const PUBLICATION_OPTIONAL = ["effectiveTo"];
const PROFILE_FIELDS = [...PUBLICATION_FIELDS, "profileId", "profileVersion", "tenantId", "issuerId", "issuerRuc",
  "issuerLegalName", "taxRegime", "environment", "establishmentId", "see", "provider", "adapterVersion"];
const RULE_FIELDS = [...PUBLICATION_FIELDS, "configurationDocumentId", "decisionId", "ruleId", "tenantId",
  "issuerId", "presentationId", "catalogSemanticFingerprintSha256", "unitCode", "context", "legalCategory",
  "taxRateBasisPoints"];
const CAPABILITY_FIELDS = [...PUBLICATION_FIELDS, "capabilityId", "tenantId", "issuerId", "profileVersion",
  "taxRegime", "environment", "documentType", "context", "legalCategories", "see", "provider",
  "adapterVersion", "capabilityStatus"];

function artifactShape(artifact: FiscalV1PublicationArtifact): void {
  if (!artifact || typeof artifact !== "object") fail("FISCAL_V1_PUBLICATION_ARTIFACT_INVALID");
  if ("profileId" in artifact) exactKeys(artifact, PROFILE_FIELDS, PUBLICATION_OPTIONAL, "FISCAL_V1_PUBLICATION_ARTIFACT_INVALID");
  else if ("ruleId" in artifact) {
    exactKeys(artifact, RULE_FIELDS, PUBLICATION_OPTIONAL, "FISCAL_V1_PUBLICATION_ARTIFACT_INVALID");
    exactKeys(artifact.context, ["establishmentId", "operationKind", "buyerUse"], [], "FISCAL_V1_CONTEXT_REQUIRED");
  } else if ("capabilityId" in artifact) {
    exactKeys(artifact, CAPABILITY_FIELDS, [...PUBLICATION_OPTIONAL, "evidence", "creditNoteReasonCodes"],
      "FISCAL_V1_PUBLICATION_ARTIFACT_INVALID");
    exactKeys(artifact.context, ["establishmentId", "operationKind", "buyerUse"], [], "FISCAL_V1_CONTEXT_REQUIRED");
    if (artifact.evidence !== undefined)
      exactKeys(artifact.evidence, ["legalReviewRef", "providerXmlRef", "tributaryResultRef"],
        ["correctiveRouteRef"], "FISCAL_V1_CAPABILITY_EVIDENCE_INVALID");
  } else fail("FISCAL_V1_PUBLICATION_ARTIFACT_INVALID");
}

/** Material que el publicador debe hashear, excluyendo solo la propia huella. */
export function fiscalV1PublicationArtifactMaterial(artifact: FiscalV1PublicationArtifact): string {
  artifactShape(artifact);
  const { fingerprintSha256: _fingerprint, ...material } = artifact;
  return canonical(material);
}

export function fiscalV1PublicationArtifactFingerprint(artifact: FiscalV1PublicationArtifact): string {
  return sha256Hex(fiscalV1PublicationArtifactMaterial(artifact));
}

/** Bytes exactos que el publicador debe firmar con Ed25519. */
export function fiscalV1PublicationPayloadMaterial(payload: FiscalV1PublicationPayload): string {
  exactKeys(payload, ["schemaVersion", "tenantId", "issuerId", "environment", "revision", "issuedAtMs", "expiresAtMs",
    "profiles", "rules", "capabilities"], [], "FISCAL_V1_PUBLICATION_PAYLOAD_INVALID");
  return canonical(payload);
}

export function fiscalV1PublicationPayloadFingerprint(payload: FiscalV1PublicationPayload): string {
  return sha256Hex(fiscalV1PublicationPayloadMaterial(payload));
}

function safeNumber(value: bigint): number {
  if (value < 0n || value > MAX_SAFE) fail("FISCAL_V1_AMOUNT_OVERFLOW");
  return Number(value);
}

function civilDate(value: string, code: string): string {
  return validateFiscalCivilDate(value, code);
}

function publication(value: FiscalV1EffectivePublication): void {
  if (!value || !["PUBLISHED", "SUSPENDED"].includes(value.status) ||
      !Number.isSafeInteger(value.publishedAt) || value.publishedAt < 0 ||
      !text(value.sourceRef) || !sha256(value.fingerprintSha256)) fail("FISCAL_V1_PUBLICATION_INVALID");
  civilDate(value.effectiveFrom, "FISCAL_V1_EFFECTIVE_DATE_INVALID");
  if (value.effectiveTo !== undefined &&
      civilDate(value.effectiveTo, "FISCAL_V1_EFFECTIVE_DATE_INVALID") < value.effectiveFrom)
    fail("FISCAL_V1_EFFECTIVE_RANGE_INVALID");
}

function effective(value: FiscalV1EffectivePublication, date: string): boolean {
  return value.effectiveFrom <= date && date <= (value.effectiveTo ?? "9999-12-31");
}

function context(value: FiscalV1OperationContext): void {
  if (!value || !text(value.establishmentId) ||
      !["DOMESTIC_RETAIL", "DOMESTIC_WHOLESALE"].includes(value.operationKind) ||
      !["FINAL_CONSUMER", "BUSINESS"].includes(value.buyerUse))
    fail("FISCAL_V1_CONTEXT_REQUIRED");
}

function sameContext(left: FiscalV1OperationContext, right: FiscalV1OperationContext): boolean {
  return left.establishmentId === right.establishmentId && left.operationKind === right.operationKind &&
    left.buyerUse === right.buyerUse;
}

function profile(value: FiscalV1IssuerProfile): void {
  publication(value);
  if (![value.profileId, value.profileVersion, value.tenantId, value.issuerId, value.issuerLegalName,
    value.establishmentId, value.see, value.provider, value.adapterVersion].every(text) ||
    !/^\d{11}$/.test(value.issuerRuc) || !isFiscalTaxRegime(value.taxRegime) ||
    !["DEMO", "PRODUCTION"].includes(value.environment)) fail("FISCAL_V1_PROFILE_INVALID");
  // El prefijo no acredita el régimen, pero un RUC de persona jurídica no puede
  // autorizar una capacidad NRUS. El régimen real exige evidencia por período.
  if (value.taxRegime === "NRUS" && !/^(?:10|15)\d{9}$/.test(value.issuerRuc))
    fail("FISCAL_V1_NRUS_ISSUER_TYPE_FORBIDDEN");
}

function rule(value: FiscalV1PresentationRule): void {
  publication(value); context(value.context);
  if (![value.configurationDocumentId, value.decisionId, value.ruleId, value.tenantId, value.issuerId,
    value.presentationId].every(text) || !sha256(value.catalogSemanticFingerprintSha256) ||
    !["NIU", "KGM", "LTR", "ZZ"].includes(value.unitCode)) fail("FISCAL_V1_RULE_INVALID");
  const taxValid = value.legalCategory === "GRAVADA"
    ? positive(value.taxRateBasisPoints) && value.taxRateBasisPoints <= 10000
    : value.legalCategory === "EXONERADA"
      ? value.taxRateBasisPoints === 0
      : value.legalCategory === "INAFECTA" && value.taxRateBasisPoints === 0;
  if (!taxValid) fail("FISCAL_V1_TAX_REPRESENTATION_INVALID");
}

function categorySet(values: readonly FiscalV1LegalCategory[]): string {
  if (!Array.isArray(values) || !values.length ||
      values.some(value => !["GRAVADA", "EXONERADA", "INAFECTA"].includes(value)) ||
      new Set(values).size !== values.length) fail("FISCAL_V1_CATEGORY_SET_INVALID");
  return [...values].sort().join("|");
}

function capability(value: FiscalV1Capability): void {
  publication(value); context(value.context); categorySet(value.legalCategories);
  if (![value.capabilityId, value.tenantId, value.issuerId, value.profileVersion, value.see,
    value.provider, value.adapterVersion].every(text) || !isFiscalTaxRegime(value.taxRegime) ||
    !["DEMO", "PRODUCTION"].includes(value.environment) || !["BOLETA", "FACTURA", "NOTA_CREDITO"].includes(value.documentType) ||
    !["SUPPORTED", "UNVERIFIED", "UNSUPPORTED"].includes(value.capabilityStatus))
    fail("FISCAL_V1_CAPABILITY_INVALID");
  if (value.documentType === "NOTA_CREDITO") {
    if (!Array.isArray(value.creditNoteReasonCodes) || !value.creditNoteReasonCodes.length ||
        value.creditNoteReasonCodes.some(code => !text(code)) ||
        new Set(value.creditNoteReasonCodes).size !== value.creditNoteReasonCodes.length)
      fail("FISCAL_V1_CREDIT_NOTE_REASONS_REQUIRED");
  } else if (value.creditNoteReasonCodes !== undefined) fail("FISCAL_V1_CREDIT_NOTE_REASONS_FORBIDDEN");
  if (value.capabilityStatus === "SUPPORTED" && (!value.evidence ||
      ![value.evidence.legalReviewRef, value.evidence.providerXmlRef, value.evidence.tributaryResultRef].every(text)))
    fail("FISCAL_V1_CAPABILITY_EVIDENCE_REQUIRED");
  if (value.capabilityStatus === "SUPPORTED" && value.taxRegime === "NRUS" &&
      value.documentType === "BOLETA" && value.environment === "PRODUCTION" &&
      !text(value.evidence?.correctiveRouteRef)) fail("FISCAL_V1_CORRECTIVE_ROUTE_REQUIRED");
}

function saleLine(value: FiscalV1SaleLineInput): void {
  if (!value || !text(value.lineId) || !text(value.presentationId) ||
      !sha256(value.catalogSemanticFingerprintSha256) || !positive(value.quantityMilli) ||
      !positive(value.unitPriceCents) || !cents(value.discountCents)) fail("FISCAL_V1_LINE_INVALID");
}

/** Límite de publicación V1; una identidad técnica de CouchDB no decide la autoridad. */
export function assertFiscalV1IssuerAuthority(profiles: readonly FiscalV1IssuerProfile[]): void {
  if (!Array.isArray(profiles)) fail("FISCAL_V1_PROFILES_REQUIRED");
  profiles.forEach(profile);
  const published = profiles.filter(item => item.status === "PUBLISHED");
  for (let i = 0; i < published.length; i++) for (let j = i + 1; j < published.length; j++) {
    const a = published[i], b = published[j];
    const overlaps = a.effectiveFrom <= (b.effectiveTo ?? "9999-12-31") &&
      b.effectiveFrom <= (a.effectiveTo ?? "9999-12-31");
    if (!overlaps) continue;
    if (a.tenantId === b.tenantId && (a.issuerId !== b.issuerId || a.issuerRuc !== b.issuerRuc))
      fail("FISCAL_V1_TENANT_MULTIPLE_ISSUERS");
    if (a.tenantId === b.tenantId && a.environment === b.environment)
      fail("FISCAL_V1_TENANT_PROFILE_OVERLAP");
    if (a.tenantId !== b.tenantId && a.environment === b.environment && a.issuerRuc === b.issuerRuc)
      fail("FISCAL_V1_ISSUER_AUTHORITY_DUPLICATED");
  }
}

/** Valida una publicación completa; la clave confiable se fija fuera del payload remoto. */
export function verifyFiscalV1PublicationBundle(bundle: FiscalV1SignedPublicationBundle,
  trustedKeys: readonly FiscalV1TrustedPublisherKey[], nowMs: number): FiscalV1PublicationPayload {
  exactKeys(bundle, ["payload", "payloadSha256", "signature"], [], "FISCAL_V1_BUNDLE_INVALID");
  exactKeys(bundle.signature, ["algorithm", "keyId", "signatureBase64"], [], "FISCAL_V1_SIGNATURE_INVALID");
  const payload = bundle.payload;
  const material = fiscalV1PublicationPayloadMaterial(payload);
  if (payload.schemaVersion !== "fiscal-v1" || !text(payload.tenantId) || !text(payload.issuerId) ||
      !["DEMO", "PRODUCTION"].includes(payload.environment) || !positive(payload.revision) ||
      !cents(payload.issuedAtMs) || !cents(payload.expiresAtMs) || !cents(nowMs) ||
      payload.issuedAtMs >= payload.expiresAtMs || !Array.isArray(payload.profiles) ||
      !Array.isArray(payload.rules) || !Array.isArray(payload.capabilities)) fail("FISCAL_V1_PUBLICATION_PAYLOAD_INVALID");
  if (nowMs < payload.issuedAtMs || nowMs >= payload.expiresAtMs)
    fail("FISCAL_V1_PUBLICATION_NOT_CURRENT");
  if (!sha256(bundle.payloadSha256) || bundle.payloadSha256 !== sha256Hex(material))
    fail("FISCAL_V1_PUBLICATION_PAYLOAD_HASH_INVALID");
  if (bundle.signature.algorithm !== "Ed25519" || !text(bundle.signature.keyId) ||
      !Array.isArray(trustedKeys)) fail("FISCAL_V1_SIGNATURE_INVALID");
  const matches = trustedKeys.filter(key => key?.keyId === bundle.signature.keyId &&
    key.tenantId === payload.tenantId && key.environment === payload.environment);
  if (matches.length !== 1) fail("FISCAL_V1_PUBLISHER_NOT_TRUSTED");
  const key = matches[0];
  exactKeys(key, ["keyId", "publicKeyBase64", "tenantId", "environment", "validFromMs", "validToMs"], [],
    "FISCAL_V1_PUBLISHER_KEY_INVALID");
  if (!cents(key.validFromMs) || !cents(key.validToMs) ||
      key.validFromMs > payload.issuedAtMs || key.validToMs <= nowMs || key.validFromMs >= key.validToMs)
    fail("FISCAL_V1_PUBLISHER_KEY_NOT_CURRENT");
  const publicKey = decodeBase64(key.publicKeyBase64, nacl.sign.publicKeyLength);
  const signature = decodeBase64(bundle.signature.signatureBase64, nacl.sign.signatureLength);
  if (!nacl.sign.detached.verify(utf8ToBytes(material), signature, publicKey))
    fail("FISCAL_V1_SIGNATURE_INVALID");
  payload.profiles.forEach(profile); payload.rules.forEach(rule); payload.capabilities.forEach(capability);
  if (payload.profiles.some(value => value.tenantId !== payload.tenantId || value.issuerId !== payload.issuerId ||
      value.environment !== payload.environment) ||
      payload.rules.some(value => value.tenantId !== payload.tenantId || value.issuerId !== payload.issuerId) ||
      payload.capabilities.some(value => value.tenantId !== payload.tenantId || value.issuerId !== payload.issuerId ||
        value.environment !== payload.environment)) fail("FISCAL_V1_SCOPE_MISMATCH");
  for (const item of [...payload.profiles, ...payload.rules, ...payload.capabilities]) {
    if (item.publishedAt > payload.issuedAtMs || item.fingerprintSha256 !== fiscalV1PublicationArtifactFingerprint(item))
      fail("FISCAL_V1_PUBLICATION_INTEGRITY_INVALID");
  }
  assertFiscalV1IssuerAuthority(payload.profiles);
  return payload;
}

/** Sin reloj, red, persistencia ni asignación de correlativos. */
export function prepareFiscalV1Sale(input: {
  readonly sale: FiscalV1SaleInput;
  readonly bundle: FiscalV1SignedPublicationBundle;
  readonly trustedKeys: readonly FiscalV1TrustedPublisherKey[];
  readonly nowMs: number;
}): FiscalV1PreparedDecision {
  const { sale, bundle, trustedKeys, nowMs } = input;
  if (!sale || ![sale.operationId, sale.saleId, sale.tenantId, sale.issuerId].every(text) ||
      !/^\d{11}$/.test(sale.issuerRuc) || !["DEMO", "PRODUCTION"].includes(sale.environment) || sale.currency !== "PEN" ||
      !["BOLETA", "FACTURA"].includes(sale.documentType) || !Array.isArray(sale.lines) || !sale.lines.length)
    fail("FISCAL_V1_SALE_INVALID");
  const payload = verifyFiscalV1PublicationBundle(bundle, trustedKeys, nowMs);
  const { profiles, rules, capabilities } = payload;
  if (sale.tenantId !== payload.tenantId || sale.issuerId !== payload.issuerId ||
      sale.environment !== payload.environment) fail("FISCAL_V1_SCOPE_MISMATCH");
  const date = civilDate(sale.occurredOn, "FISCAL_V1_OPERATION_DATE_INVALID");
  context(sale.context);
  if (sale.buyer && (!text(sale.buyer.legalName) ||
      !(sale.buyer.documentType === "RUC" && /^\d{11}$/.test(sale.buyer.documentNumber)) &&
      !(sale.buyer.documentType === "DNI" && /^\d{8}$/.test(sale.buyer.documentNumber))))
    fail("FISCAL_V1_BUYER_INVALID");
  if (profiles.some(value => value.tenantId !== sale.tenantId || value.issuerId !== sale.issuerId ||
      value.issuerRuc !== sale.issuerRuc || value.environment !== sale.environment) ||
      rules.some(value => value.tenantId !== sale.tenantId || value.issuerId !== sale.issuerId) ||
      capabilities.some(value => value.tenantId !== sale.tenantId || value.issuerId !== sale.issuerId))
    fail("FISCAL_V1_SCOPE_MISMATCH");
  const selectedProfiles = profiles.filter(value => effective(value, date));
  if (selectedProfiles.length !== 1) fail("FISCAL_V1_PROFILE_NOT_UNIQUE_OR_EFFECTIVE");
  const selectedProfile = selectedProfiles[0];
  if (selectedProfile.status !== "PUBLISHED" || selectedProfile.establishmentId !== sale.context.establishmentId)
    fail("FISCAL_V1_PROFILE_NOT_PUBLISHED_OR_CONTEXT_MISMATCH");
  if (!["NRUS", "RER"].includes(selectedProfile.taxRegime)) fail("FISCAL_V1_REGIME_NOT_IMPLEMENTED");
  if (selectedProfile.taxRegime === "NRUS" && sale.documentType !== "BOLETA") fail("FISCAL_V1_NRUS_FACTURA_FORBIDDEN");
  if (sale.documentType === "FACTURA" && (sale.context.buyerUse !== "BUSINESS" ||
      sale.buyer?.documentType !== "RUC")) fail("FISCAL_V1_FACTURA_BUYER_REQUIRED");
  const ids = new Set<string>();
  const prepared: FiscalV1PreparedLine[] = sale.lines.map(line => {
    saleLine(line); if (ids.has(line.lineId)) fail("FISCAL_V1_LINE_DUPLICATED"); ids.add(line.lineId);
    const matches = rules.filter(value => value.presentationId === line.presentationId &&
      sameContext(value.context, sale.context) && effective(value, date));
    if (matches.length !== 1) fail("FISCAL_V1_RULE_NOT_UNIQUE_OR_EFFECTIVE");
    const selected = matches[0];
    if (selected.status !== "PUBLISHED") fail("FISCAL_V1_RULE_NOT_PUBLISHED");
    if (selected.catalogSemanticFingerprintSha256 !== line.catalogSemanticFingerprintSha256)
      fail("FISCAL_V1_CATALOG_RULE_OUTDATED");
    const gross = (BigInt(line.quantityMilli) * BigInt(line.unitPriceCents) + 500n) / 1000n;
    if (BigInt(line.discountCents) > gross) fail("FISCAL_V1_DISCOUNT_EXCEEDS_GROSS");
    const discounted = gross - BigInt(line.discountCents);
    if (discounted === 0n) fail("FISCAL_V1_FREE_LINE_NOT_MODELED");
    const totalCents = safeNumber(discounted);
    const disclosure = selectedProfile.taxRegime === "NRUS"
      ? { kind: "NOT_ITEMIZED_BY_ISSUER" as const, baseCents: null, taxCents: null, appliedRateBasisPoints: null }
      : (() => {
          const base = selected.legalCategory === "GRAVADA"
            ? (discounted * 10000n + BigInt(10000 + selected.taxRateBasisPoints) / 2n) /
              BigInt(10000 + selected.taxRateBasisPoints)
            : discounted;
          return { kind: "ITEMIZED" as const, baseCents: safeNumber(base),
            taxCents: safeNumber(discounted - base), appliedRateBasisPoints: selected.taxRateBasisPoints };
        })();
    return { lineId: line.lineId, presentationId: line.presentationId, quantityMilli: line.quantityMilli,
      unitPriceCents: line.unitPriceCents, discountCents: line.discountCents, totalCents,
      unitCode: selected.unitCode, legalCategory: selected.legalCategory,
      disclosure, ruleRef: { configurationDocumentId: selected.configurationDocumentId, decisionId: selected.decisionId,
        ruleId: selected.ruleId, fingerprintSha256: selected.fingerprintSha256 } };
  });
  const legalCategories = categorySet([...new Set(prepared.map(line => line.legalCategory))]);
  const matchingCapabilities = capabilities.filter(value => effective(value, date) &&
    value.profileVersion === selectedProfile.profileVersion && value.taxRegime === selectedProfile.taxRegime &&
    value.environment === selectedProfile.environment && value.documentType === sale.documentType &&
    value.see === selectedProfile.see && value.provider === selectedProfile.provider &&
    value.adapterVersion === selectedProfile.adapterVersion && sameContext(value.context, sale.context) &&
    categorySet(value.legalCategories) === legalCategories);
  if (matchingCapabilities.length !== 1) fail("FISCAL_V1_CAPABILITY_NOT_UNIQUE_OR_EFFECTIVE");
  const selectedCapability = matchingCapabilities[0];
  if (selectedCapability.status !== "PUBLISHED" || selectedCapability.capabilityStatus !== "SUPPORTED")
    fail("FISCAL_V1_CAPABILITY_NOT_SUPPORTED");
  const totalCents = safeNumber(prepared.reduce((sum, line) => sum + BigInt(line.totalCents), 0n));
  const baseCents = selectedProfile.taxRegime === "NRUS" ? null :
    safeNumber(prepared.reduce((sum, line) => sum + BigInt(line.disclosure.baseCents ?? 0), 0n));
  const taxCents = selectedProfile.taxRegime === "NRUS" ? null :
    safeNumber(prepared.reduce((sum, line) => sum + BigInt(line.disclosure.taxCents ?? 0), 0n));
  if (baseCents !== null && taxCents !== null && baseCents + taxCents !== totalCents)
    fail("FISCAL_V1_TOTAL_MISMATCH");
  return { operationId: sale.operationId, saleId: sale.saleId, tenantId: sale.tenantId, issuerId: sale.issuerId,
    issuerRuc: sale.issuerRuc, taxRegime: selectedProfile.taxRegime, environment: sale.environment,
    currency: sale.currency, occurredOn: date, documentType: sale.documentType,
    ...(sale.buyer ? { buyer: { ...sale.buyer } } : {}), context: { ...sale.context },
    profileRef: { profileId: selectedProfile.profileId, profileVersion: selectedProfile.profileVersion,
      fingerprintSha256: selectedProfile.fingerprintSha256 },
    capabilityRef: { capabilityId: selectedCapability.capabilityId, fingerprintSha256: selectedCapability.fingerprintSha256 },
    lines: prepared, totalCents, baseCents, taxCents };
}

/** Material estable para que el adaptador calcule SHA-256, sin importar crypto en dominio. */
export function fiscalV1DecisionFingerprintMaterial(decision: FiscalV1PreparedDecision): string {
  return fiscalConfigurationCanonicalJson(decision);
}
