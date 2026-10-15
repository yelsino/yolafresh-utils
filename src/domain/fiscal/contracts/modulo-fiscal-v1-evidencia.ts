import { validateFiscalCivilDate } from "./reglas-tributarias";
import { fiscalV1CanonicalSha256, fiscalV1DecisionFingerprintMaterial,
  verifyFiscalV1PublicationBundle } from "./modulo-fiscal-v1";
import type { FiscalV1Capability, FiscalV1SignedPublicationBundle, FiscalV1TrustedPublisherKey } from "./modulo-fiscal-v1.contract";
import type { FiscalV1CreditNoteDraft, FiscalV1DocumentRecord, FiscalV1PreparedCreditNote,
  FiscalV1PriorCreditNote, FiscalV1Snapshot } from "./modulo-fiscal-v1-evidencia.contract";

const fail = (code: string): never => { throw new Error(code); };
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const sha256 = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const cents = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const positive = (value: unknown): value is number => cents(value) && Number(value) > 0;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
function safeNumber(value: bigint): number {
  if (value < 0n || value > MAX_SAFE) fail("FISCAL_V1_AMOUNT_OVERFLOW");
  return Number(value);
}
function date(value: string, code: string): string { return validateFiscalCivilDate(value, code); }
function sameContext(a: {establishmentId: string; operationKind: string; buyerUse: string},
  b: {establishmentId: string; operationKind: string; buyerUse: string}): boolean {
  return a.establishmentId === b.establishmentId && a.operationKind === b.operationKind && a.buyerUse === b.buyerUse;
}
function effective(value: {effectiveFrom: string; effectiveTo?: string}, on: string): boolean {
  return value.effectiveFrom <= on && on <= (value.effectiveTo ?? "9999-12-31");
}

/** El backend vuelve a ejecutar el motor contra publicaciones; esta huella solo congela los campos recibidos. */
export function fiscalV1SnapshotFingerprint(snapshot: FiscalV1Snapshot): string {
  const { snapshotSha256: _ownHash, ...material } = snapshot;
  return fiscalV1CanonicalSha256(material);
}

export function assertFiscalV1Snapshot(snapshot: FiscalV1Snapshot): void {
  if (!snapshot || snapshot.schemaVersion !== "fiscal-v1-snapshot" || !text(snapshot.snapshotId) ||
      !text(snapshot.issuerLegalName) || !snapshot.issuerEstablishment ||
      ![snapshot.issuerEstablishment.establishmentId, snapshot.issuerEstablishment.code,
        snapshot.issuerEstablishment.department, snapshot.issuerEstablishment.province,
        snapshot.issuerEstablishment.district, snapshot.issuerEstablishment.address].every(text) ||
      !/^\d{6}$/.test(snapshot.issuerEstablishment.ubigeo) ||
      snapshot.issuerEstablishment.countryCode !== "PE" ||
      snapshot.issuerEstablishment.establishmentId !== snapshot.decision?.context?.establishmentId ||
      (snapshot.buyerFiscalAddress !== undefined && !text(snapshot.buyerFiscalAddress)) ||
      !text(snapshot.series) || !positive(snapshot.number) || !cents(snapshot.createdAtMs) ||
      !sha256(snapshot.decisionSha256) || !sha256(snapshot.publicationPayloadSha256) ||
      !positive(snapshot.publicationRevision) || !sha256(snapshot.snapshotSha256) ||
      !snapshot.decision || !Array.isArray(snapshot.decision.lines) || !snapshot.decision.lines.length ||
      !Array.isArray(snapshot.lineDescriptions) ||
      snapshot.lineDescriptions.length !== snapshot.decision.lines.length)
    fail("FISCAL_V1_SNAPSHOT_INVALID");
  if (snapshot.decisionSha256 !== fiscalV1CanonicalSha256(snapshot.decision) ||
      snapshot.snapshotSha256 !== fiscalV1SnapshotFingerprint(snapshot))
    fail("FISCAL_V1_SNAPSHOT_HASH_INVALID");
  const lineIds = new Set(snapshot.decision.lines.map(line => line.lineId));
  if (lineIds.size !== snapshot.decision.lines.length ||
      snapshot.lineDescriptions.some(item => !item || !text(item.lineId) || !text(item.description) ||
        !lineIds.has(item.lineId)) || new Set(snapshot.lineDescriptions.map(item => item.lineId)).size !== lineIds.size)
    fail("FISCAL_V1_SNAPSHOT_LINES_INVALID");
  if (!positive(snapshot.decision.totalCents) ||
      safeNumber(snapshot.decision.lines.reduce((sum, line) => sum + BigInt(line.totalCents), 0n)) !== snapshot.decision.totalCents)
    fail("FISCAL_V1_SNAPSHOT_TOTAL_INVALID");
  if (snapshot.decision.lines.some(line => !positive(line.quantityMilli) || !positive(line.totalCents) ||
      !positive(line.unitPriceCents) || !cents(line.discountCents) ||
      !["GRAVADA", "EXONERADA", "INAFECTA"].includes(line.legalCategory) ||
      !line.disclosure ||
      (line.disclosure.kind === "ITEMIZED"
        ? !cents(line.disclosure.baseCents) || !cents(line.disclosure.taxCents) ||
          line.disclosure.baseCents + line.disclosure.taxCents !== line.totalCents ||
          (line.legalCategory === "GRAVADA"
            ? !positive(line.disclosure.appliedRateBasisPoints)
            : line.disclosure.appliedRateBasisPoints !== 0 || line.disclosure.taxCents !== 0)
        : line.disclosure.kind !== "NOT_ITEMIZED_BY_ISSUER" ||
          line.disclosure.baseCents !== null || line.disclosure.taxCents !== null ||
          line.disclosure.appliedRateBasisPoints !== null)))
    fail("FISCAL_V1_SNAPSHOT_TAX_INVALID");
  if (snapshot.decision.baseCents === null || snapshot.decision.taxCents === null) {
    if (snapshot.decision.baseCents !== null || snapshot.decision.taxCents !== null ||
        snapshot.decision.taxRegime !== "NRUS" ||
        snapshot.decision.lines.some(line => line.disclosure.kind !== "NOT_ITEMIZED_BY_ISSUER" ||
          line.disclosure.baseCents !== null || line.disclosure.taxCents !== null))
      fail("FISCAL_V1_SNAPSHOT_TAX_INVALID");
  } else if (!cents(snapshot.decision.baseCents) || !cents(snapshot.decision.taxCents) ||
      snapshot.decision.taxRegime !== "RER" ||
      snapshot.decision.baseCents + snapshot.decision.taxCents !== snapshot.decision.totalCents ||
      snapshot.decision.lines.some(line => line.disclosure.kind !== "ITEMIZED") ||
      safeNumber(snapshot.decision.lines.reduce((sum, line) => sum + BigInt(line.disclosure.baseCents ?? 0), 0n)) !== snapshot.decision.baseCents ||
      safeNumber(snapshot.decision.lines.reduce((sum, line) => sum + BigInt(line.disclosure.taxCents ?? 0), 0n)) !== snapshot.decision.taxCents)
    fail("FISCAL_V1_SNAPSHOT_TAX_INVALID");
  if (snapshot.paymentTerms?.kind === "CREDITO") {
    const installments = snapshot.paymentTerms.installments;
    if (!Array.isArray(installments) || !installments.length || installments.some(item =>
      !item || !positive(item.amountCents) || date(item.dueOn, "FISCAL_V1_CREDIT_DUE_DATE_INVALID") < snapshot.decision.occurredOn) ||
      safeNumber(installments.reduce((sum, item) => sum + BigInt(item.amountCents), 0n)) !== snapshot.decision.totalCents)
      fail("FISCAL_V1_SNAPSHOT_PAYMENT_INVALID");
  } else if (snapshot.paymentTerms?.kind !== "CONTADO") fail("FISCAL_V1_SNAPSHOT_PAYMENT_INVALID");
  if (snapshot.decision.documentType === "FACTURA" && snapshot.decision.buyer?.documentType !== "RUC")
    fail("FISCAL_V1_SNAPSHOT_BUYER_INVALID");
  // Decisión y snapshot se guardan juntos; nadie los completa después de firmar.
  fiscalV1DecisionFingerprintMaterial(snapshot.decision);
}

export function assertFiscalV1DocumentRecord(document: FiscalV1DocumentRecord, snapshot: FiscalV1Snapshot): void {
  assertFiscalV1Snapshot(snapshot);
  if (!document || ![document.documentId, document.operationId, document.tenantId, document.issuerId,
    document.snapshotId].every(text) || !/^\d{11}$/.test(document.issuerRuc) ||
    !["DEMO", "PRODUCTION"].includes(document.environment) || !sha256(document.snapshotSha256) ||
    !["UNKNOWN", "SIGNED_SUBMISSION_PENDING", "TRIBUTARY_ACCEPTED", "TRIBUTARY_REJECTED"].includes(document.state))
    fail("FISCAL_V1_DOCUMENT_INVALID");
  const decision = snapshot.decision;
  if (document.snapshotId !== snapshot.snapshotId || document.snapshotSha256 !== snapshot.snapshotSha256 ||
      document.operationId !== decision.operationId || document.tenantId !== decision.tenantId ||
      document.issuerId !== decision.issuerId || document.issuerRuc !== decision.issuerRuc ||
      document.environment !== decision.environment) fail("FISCAL_V1_DOCUMENT_SNAPSHOT_MISMATCH");
  if (document.signedXml !== undefined && (!text(document.signedXml.storageRef) || !sha256(document.signedXml.sha256)))
    fail("FISCAL_V1_SIGNED_XML_INVALID");
  if (document.tributaryResult !== undefined && (!text(document.tributaryResult.storageRef) ||
      !sha256(document.tributaryResult.sha256) || !cents(document.tributaryResult.receivedAtMs) ||
      !["ACCEPTED", "REJECTED"].includes(document.tributaryResult.outcome)))
    fail("FISCAL_V1_TRIBUTARY_RESULT_INVALID");
  if (document.state === "UNKNOWN") {
    if (document.tributaryResult) fail("FISCAL_V1_DOCUMENT_STATE_CONTRADICTION");
  } else if (!document.signedXml || !text(document.providerOperationRef))
    fail("FISCAL_V1_DOCUMENT_SIGNED_EVIDENCE_REQUIRED");
  if (document.state === "SIGNED_SUBMISSION_PENDING" && document.tributaryResult)
    fail("FISCAL_V1_DOCUMENT_STATE_CONTRADICTION");
  if (document.state === "TRIBUTARY_ACCEPTED" && document.tributaryResult?.outcome !== "ACCEPTED" ||
      document.state === "TRIBUTARY_REJECTED" && document.tributaryResult?.outcome !== "REJECTED")
    fail("FISCAL_V1_DOCUMENT_TRIBUTARY_EVIDENCE_REQUIRED");
}

/** Nunca recalcule el original con reglas actuales ni asuma que una firma prueba otorgamiento/aceptación. */
export function prepareFiscalV1CreditNote(input: {
  readonly draft: FiscalV1CreditNoteDraft;
  readonly originalSnapshot: FiscalV1Snapshot;
  readonly originalDocument: FiscalV1DocumentRecord;
  readonly priorCredits: readonly FiscalV1PriorCreditNote[];
  readonly bundle: FiscalV1SignedPublicationBundle;
  readonly trustedKeys: readonly FiscalV1TrustedPublisherKey[];
  readonly nowMs: number;
}): FiscalV1PreparedCreditNote {
  const { draft, originalSnapshot, originalDocument, priorCredits, bundle, trustedKeys, nowMs } = input;
  assertFiscalV1DocumentRecord(originalDocument, originalSnapshot);
  const payload = verifyFiscalV1PublicationBundle(bundle, trustedKeys, nowMs);
  if (!draft || ![draft.noteOperationId, draft.noteId, draft.tenantId, draft.issuerId,
    draft.originalDocumentId, draft.recipientId, draft.reasonCode].every(text) ||
    !/^\d{11}$/.test(draft.issuerRuc) || !["DEMO", "PRODUCTION"].includes(draft.environment) ||
    !sha256(draft.originalSnapshotSha256) || !Array.isArray(draft.lines) || !draft.lines.length ||
    !Array.isArray(priorCredits)) fail("FISCAL_V1_CREDIT_NOTE_INVALID");
  const issuedOn = date(draft.issuedOn, "FISCAL_V1_CREDIT_NOTE_DATE_INVALID");
  const original = originalSnapshot.decision;
  if (issuedOn < original.occurredOn || draft.noteOperationId === original.operationId ||
      draft.originalDocumentId !== originalDocument.documentId ||
      draft.originalSnapshotSha256 !== originalSnapshot.snapshotSha256 ||
      [draft.tenantId, draft.issuerId, draft.issuerRuc, draft.environment].some((value, index) =>
        value !== [original.tenantId, original.issuerId, original.issuerRuc, original.environment][index]) ||
      payload.tenantId !== draft.tenantId || payload.issuerId !== draft.issuerId ||
      payload.environment !== draft.environment) fail("FISCAL_V1_CREDIT_NOTE_SCOPE_MISMATCH");
  if (original.documentType === "FACTURA") {
    if (originalDocument.state !== "TRIBUTARY_ACCEPTED" ||
        originalDocument.tributaryResult?.outcome !== "ACCEPTED" ||
        original.buyer?.documentType !== "RUC" || original.buyer.documentNumber !== draft.recipientId)
      fail("FISCAL_V1_CREDIT_NOTE_ORIGINAL_NOT_ELIGIBLE");
  } else if (original.documentType === "BOLETA") {
    if (!["SIGNED_SUBMISSION_PENDING", "TRIBUTARY_ACCEPTED"].includes(originalDocument.state) ||
        !originalDocument.signedXml || !draft.originalGrant ||
        draft.originalGrant.recipientId !== draft.recipientId || !text(draft.originalGrant.evidenceRef) ||
        !cents(draft.originalGrant.grantedAtMs) || draft.originalGrant.grantedAtMs > nowMs ||
        (original.buyer && original.buyer.documentNumber !== draft.recipientId))
      fail("FISCAL_V1_CREDIT_NOTE_ORIGINAL_NOT_ELIGIBLE");
  } else fail("FISCAL_V1_CREDIT_NOTE_ORIGINAL_NOT_ELIGIBLE");
  const profiles = payload.profiles.filter(profile => profile.status === "PUBLISHED" && effective(profile, issuedOn) &&
    profile.establishmentId === original.context.establishmentId && profile.issuerRuc === draft.issuerRuc);
  if (profiles.length !== 1) fail("FISCAL_V1_CREDIT_NOTE_PROFILE_NOT_UNIQUE");
  const profile = profiles[0];
  if (!["NRUS", "RER"].includes(profile.taxRegime)) fail("FISCAL_V1_REGIME_NOT_IMPLEMENTED");
  const originalLines = new Map(original.lines.map(line => [line.lineId, line]));
  const credited = new Map<string, bigint>();
  const creditedQuantities = new Map<string, bigint>();
  const priorIds = new Set<string>();
  for (const prior of priorCredits) {
    if (!prior || !text(prior.noteId) || !text(prior.operationId) || priorIds.has(prior.noteId) ||
        priorIds.has(prior.operationId) || prior.noteId === draft.noteId || prior.operationId === draft.noteOperationId ||
        prior.originalDocumentId !== originalDocument.documentId ||
        prior.originalSnapshotSha256 !== originalSnapshot.snapshotSha256 ||
        !["RESERVED", "UNKNOWN", "SIGNED", "TRIBUTARY_ACCEPTED"].includes(prior.state) || !Array.isArray(prior.lines))
      fail("FISCAL_V1_PRIOR_CREDIT_NOTE_INVALID");
    priorIds.add(prior.noteId); priorIds.add(prior.operationId);
    const seen = new Set<string>();
    for (const line of prior.lines) {
      if (!line || !text(line.originalLineId) || !positive(line.creditedQuantityMilli) ||
          !positive(line.creditedCents) ||
          !originalLines.has(line.originalLineId) || seen.has(line.originalLineId))
        fail("FISCAL_V1_PRIOR_CREDIT_NOTE_INVALID");
      seen.add(line.originalLineId);
      const originalLine = originalLines.get(line.originalLineId)!;
      const alreadyCents = credited.get(line.originalLineId) ?? 0n;
      const alreadyQuantity = creditedQuantities.get(line.originalLineId) ?? 0n;
      const nextQuantity = alreadyQuantity + BigInt(line.creditedQuantityMilli);
      const nextCents = alreadyCents + BigInt(line.creditedCents);
      if (nextQuantity > BigInt(originalLine.quantityMilli) || nextCents > BigInt(originalLine.totalCents))
        fail("FISCAL_V1_PRIOR_CREDIT_NOTE_INVALID");
      const expected = nextQuantity === BigInt(originalLine.quantityMilli)
        ? BigInt(originalLine.totalCents) - alreadyCents
        : (BigInt(originalLine.totalCents) * BigInt(line.creditedQuantityMilli) +
            BigInt(originalLine.quantityMilli) / 2n) / BigInt(originalLine.quantityMilli);
      if (BigInt(line.creditedCents) !== expected) fail("FISCAL_V1_PRIOR_CREDIT_NOTE_INVALID");
      credited.set(line.originalLineId, nextCents);
      creditedQuantities.set(line.originalLineId, nextQuantity);
    }
  }
  const seen = new Set<string>();
  const lines = draft.lines.map(line => {
    if (!line || !text(line.originalLineId) || !positive(line.creditQuantityMilli) ||
        !positive(line.creditCents) || seen.has(line.originalLineId))
      fail("FISCAL_V1_CREDIT_NOTE_LINE_INVALID");
    seen.add(line.originalLineId);
    const originalLine = originalLines.get(line.originalLineId);
    if (!originalLine) return fail("FISCAL_V1_CREDIT_NOTE_ORIGINAL_LINE_MISSING");
    const alreadyCents = credited.get(line.originalLineId) ?? 0n;
    const alreadyQuantity = creditedQuantities.get(line.originalLineId) ?? 0n;
    if (alreadyCents + BigInt(line.creditCents) > BigInt(originalLine.totalCents) ||
        alreadyQuantity + BigInt(line.creditQuantityMilli) > BigInt(originalLine.quantityMilli))
      fail("FISCAL_V1_CREDIT_NOTE_EXCEEDS_REMAINING");
    const finalQuantity = alreadyQuantity + BigInt(line.creditQuantityMilli) === BigInt(originalLine.quantityMilli);
    const expectedCents = finalQuantity
      ? BigInt(originalLine.totalCents) - alreadyCents
      : (BigInt(originalLine.totalCents) * BigInt(line.creditQuantityMilli) +
          BigInt(originalLine.quantityMilli) / 2n) / BigInt(originalLine.quantityMilli);
    if (BigInt(line.creditCents) !== expectedCents || expectedCents <= 0n)
      fail("FISCAL_V1_CREDIT_NOTE_QUANTITY_AMOUNT_MISMATCH");
    return { originalLineId: line.originalLineId, creditQuantityMilli: line.creditQuantityMilli,
      creditCents: line.creditCents, originalQuantityMilli: originalLine.quantityMilli,
      originalUnitPriceCents: originalLine.unitPriceCents, originalDiscountCents: originalLine.discountCents,
      originalLegalCategory: originalLine.legalCategory, originalRuleRef: { ...originalLine.ruleRef },
      originalDisclosure: { ...originalLine.disclosure } };
  });
  const categories = [...new Set(lines.map(line => line.originalLegalCategory))].sort().join("|");
  const matching = payload.capabilities.filter((capability: FiscalV1Capability) =>
    capability.status === "PUBLISHED" && effective(capability, issuedOn) &&
    capability.capabilityStatus === "SUPPORTED" && capability.documentType === "NOTA_CREDITO" &&
    capability.profileVersion === profile.profileVersion && capability.taxRegime === profile.taxRegime &&
    capability.environment === profile.environment && capability.see === profile.see &&
    capability.provider === profile.provider && capability.adapterVersion === profile.adapterVersion &&
    sameContext(capability.context, original.context) &&
    [...capability.legalCategories].sort().join("|") === categories &&
    capability.creditNoteReasonCodes?.includes(draft.reasonCode));
  if (matching.length !== 1) fail("FISCAL_V1_CREDIT_NOTE_CAPABILITY_NOT_SUPPORTED");
  const totalCents = safeNumber(lines.reduce((sum, line) => sum + BigInt(line.creditCents), 0n));
  return { noteOperationId: draft.noteOperationId, noteId: draft.noteId,
    originalDocumentId: originalDocument.documentId, originalSnapshotSha256: originalSnapshot.snapshotSha256,
    tenantId: draft.tenantId, issuerId: draft.issuerId, issuerRuc: draft.issuerRuc,
    environment: draft.environment, issuedOn, reasonCode: draft.reasonCode, recipientId: draft.recipientId,
    profileRef: { profileId: profile.profileId, profileVersion: profile.profileVersion,
      fingerprintSha256: profile.fingerprintSha256 },
    capabilityRef: { capabilityId: matching[0].capabilityId, fingerprintSha256: matching[0].fingerprintSha256 },
    lines, totalCents };
}
