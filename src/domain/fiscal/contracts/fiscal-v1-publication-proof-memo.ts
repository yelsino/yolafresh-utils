import type { FiscalV1PublicationPayload, FiscalV1SignedPublicationBundle,
  FiscalV1TrustedPublisherKey } from "./modulo-fiscal-v1.contract";

type FullVerifier = (bundle: FiscalV1SignedPublicationBundle,
  trustedKeys: readonly FiscalV1TrustedPublisherKey[], nowMs: number) => FiscalV1PublicationPayload;
type Proof = Readonly<{ verifiedAtMs: number; reuseUntilMs: number }>;
const MAX_PROOFS = 8;
const PROOF_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRY_CHARS = 2 * 1024 * 1024;
const MAX_TOTAL_CHARS = 4 * 1024 * 1024;

/** Eligibility only. Hidden/undefined values, accessors and toJSON must keep the
 * full verifier's behavior; JSON.stringify is never allowed to hide them. */
function isPlainJsonData(value: unknown, ancestors = new Set<object>(), depth = 0): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value) && !Object.is(value, -0);
  if (typeof value !== "object" || depth > 128 || ancestors.has(value)) return false;
  const array = Array.isArray(value), prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== null && prototype !== Object.prototype) return false;
  if (prototype && (Object.getOwnPropertyDescriptor(prototype, "toJSON") ||
      prototype === Array.prototype && Object.getOwnPropertyDescriptor(Object.prototype, "toJSON"))) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
  if (array && names.length !== (value as unknown[]).length + 1) return false;
  ancestors.add(value);
  try {
    for (const name of names) {
      if (typeof name !== "string" || name === "toJSON") return false;
      const descriptor = descriptors[name];
      if (!("value" in descriptor)) return false;
      if (array && name === "length") continue;
      if (!descriptor.enumerable) return false;
      if (array && (!/^(0|[1-9]\d*)$/.test(name) || Number(name) >= (value as unknown[]).length)) return false;
      if (!isPlainJsonData(descriptor.value, ancestors, depth + 1)) return false;
    }
    return true;
  } finally { ancestors.delete(value); }
}

/** Internal cryptographic-proof memo; no package public export or alternate
 * authorization API. Exact bytes include the signature and ALL supplied keys.
 * Only byte strings and validity horizons survive a call, never mutable data.
 * Time comes exclusively from the existing caller-supplied nowMs argument.
 * The boundary is JSON DTO data, not a sandbox against arbitrary same-process
 * Proxy code; portable JavaScript cannot identify a transparent hostile Proxy. */
export class FiscalV1PublicationProofMemo {
  private readonly proofs = new Map<string, Proof>();
  private latestFullVerificationMs: number | undefined;
  private totalChars = 0;

  constructor(private readonly verifyFully: FullVerifier) {}

  private remove(bytes: string): void {
    if (this.proofs.delete(bytes)) this.totalChars -= bytes.length;
  }

  verify(bundle: FiscalV1SignedPublicationBundle, trustedKeys: readonly FiscalV1TrustedPublisherKey[], nowMs: number): FiscalV1PublicationPayload {
    const validClock = Number.isSafeInteger(nowMs) && nowMs >= 0;
    if (!validClock || this.latestFullVerificationMs !== undefined && nowMs < this.latestFullVerificationMs) {
      this.proofs.clear(); this.totalChars = 0;
    }
    let bytes: string | undefined;
    try {
      if (isPlainJsonData(bundle) && isPlainJsonData(trustedKeys)) {
        const serialized = JSON.stringify([bundle, trustedKeys]);
        if (serialized.length <= MAX_ENTRY_CHARS) bytes = serialized;
      }
    } catch { /* Exotic inputs keep the full verifier's acceptance/errors. */ }
    const proof = bytes === undefined ? undefined : this.proofs.get(bytes);
    if (validClock && proof && nowMs >= proof.verifiedAtMs && nowMs < proof.reuseUntilMs &&
        Number.isSafeInteger(bundle?.payload?.expiresAtMs) && nowMs < bundle.payload.expiresAtMs &&
        Array.isArray(trustedKeys) && trustedKeys.length > 0) {
      this.proofs.delete(bytes!); this.proofs.set(bytes!, proof);
      return bundle.payload;
    }
    // Hits do not advance this fence: readers may capture t1/t2 before async
    // storage and arrive in the opposite order without an actual clock rollback.
    if (validClock) this.latestFullVerificationMs = nowMs;
    const payload = this.verifyFully(bundle, trustedKeys, nowMs);
    if (bytes === undefined || !validClock || payload !== bundle.payload || !trustedKeys.length ||
        !Number.isSafeInteger(payload.expiresAtMs)) return payload;
    let reuseUntilMs = Math.min(nowMs + PROOF_TTL_MS, payload.expiresAtMs);
    for (const key of trustedKeys) {
      for (const boundary of [key.validFromMs, key.validToMs]) {
        if (!Number.isSafeInteger(boundary)) return payload;
        if (boundary > nowMs) reuseUntilMs = Math.min(reuseUntilMs, boundary);
      }
    }
    if (reuseUntilMs > nowMs) {
      this.remove(bytes);
      this.proofs.set(bytes, { verifiedAtMs: nowMs, reuseUntilMs });
      this.totalChars += bytes.length;
      while (this.proofs.size > MAX_PROOFS || this.totalChars > MAX_TOTAL_CHARS)
        this.remove(this.proofs.keys().next().value!);
    }
    return payload;
  }
}
