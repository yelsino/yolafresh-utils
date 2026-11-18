import { test } from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { createHash } from "node:crypto";
import { assertFiscalV1DocumentRecord, assertFiscalV1Snapshot, assertFiscalV1SnapshotForIssuance, fiscalV1CanonicalSha256,
  fiscalV1PublicationArtifactFingerprint, fiscalV1PublicationPayloadFingerprint, fiscalV1PublicationPayloadMaterial,
  fiscalV1SnapshotFingerprint, prepareFiscalV1CreditNote, prepareFiscalV1Sale,
  type FiscalV1Capability, type FiscalV1CreditNoteDraft, type FiscalV1DocumentRecord,
  type FiscalV1IssuerProfile, type FiscalV1PresentationRule, type FiscalV1SignedPublicationBundle,
  type FiscalV1Snapshot, type FiscalV1TrustedPublisherKey,
  fiscalV1PreparedCreditLineEconomics, prepareFiscalCreditNote, validateFiscalSignedDocument,
  type FiscalSignedDocument, type FiscalV1PriorCreditNote } from "../contracts";
import { assertFiscalV1RegisteredCashSaleSnapshot, fiscalV1RegisteredCashEvidenceSha256, fiscalV1RegisteredCashSaleSource, fiscalV1RegisteredSaleSource,
  type FiscalV1RegisteredCashEvidence } from "../contracts";
import { resolveVentaCobro } from "../../ventas/contracts/venta-cobro.contract";
import type { IVentaSnapshot } from "../../ventas/contracts/venta-snapshot.contract";
import { resolveFiscalV1UnregisteredGoodsPolicy } from "../contracts";
import { unregisteredPolicyInput } from "./unregistered-goods.fixture";

const HASH = "a".repeat(64);
const NOW = Date.UTC(2026, 9, 15, 14);
const CONTEXT = { establishmentId: "local-sintetico", operationKind: "DOMESTIC_RETAIL", buyerUse: "BUSINESS" } as const;
const KEY_PAIR = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(9));
const TRUSTED_KEY: FiscalV1TrustedPublisherKey = { keyId: "test-key-2", publicKeyBase64: Buffer.from(KEY_PAIR.publicKey).toString("base64"),
  tenantId: "tenant-sintetico", environment: "DEMO", validFromMs: NOW - 86400000, validToMs: NOW + 86400000 };
const SOURCE = "fixture-sintetica-fiscal-v1";
const cashEvidence = (saleId: string, amountCents = 1100): FiscalV1RegisteredCashEvidence => ({
  schemaVersion: 1, tenantId: "tenant", saleId, cajaId: "caja", currency: "PEN", netAmountCents: amountCents,
  movements: [{ movementId: "movement / α", createdAtMs: NOW, type: "INGRESO", subtype: "VENTA", referenceType: "VENTA",
    referenceId: saleId, cajaId: "caja", currency: "PEN", method: "EFECTIVO", state: "ACTIVO", amountCents }] });

test("V5 freezes non-catalogue origin and description without changing old snapshot versions", () => {
  const { snapshot } = fixture("SUPPORTED", { documentType: "BOLETA" });
  const input = unregisteredPolicyInput();
  const policy = resolveFiscalV1UnregisteredGoodsPolicy({ ...input, tenantId: snapshot.decision.tenantId,
    issuerRuc: snapshot.decision.issuerRuc, policy: { ...input.policy, tenantId: snapshot.decision.tenantId, issuerRuc: snapshot.decision.issuerRuc } });
  const { presentationId: _catalogue, ...line } = snapshot.decision.lines[0];
  const free = { ...line, unitCode: "NIU" as const, unregisteredGood: { description: "Leche bolsa 1 L", unitCode: "NIU" as const },
    ruleRef: { configurationDocumentId: policy.policyDocumentId, decisionId: policy.decisionId, ruleId: policy.ruleId,
      fingerprintSha256: policy.fingerprintSha256, unregisteredGoodsPolicy: policy } };
  const freeze = (value: FiscalV1Snapshot): FiscalV1Snapshot => {
    const material = { ...value, decisionSha256: fiscalV1CanonicalSha256(value.decision) };
    return { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  };
  const value = freeze({ ...snapshot, schemaVersion: "fiscal-v1-snapshot-v5", decision: { ...snapshot.decision, lines: [free] },
    lineDescriptions: [{ lineId: free.lineId, description: free.unregisteredGood.description }] });
  assert.doesNotThrow(() => assertFiscalV1SnapshotForIssuance(value));
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...value, schemaVersion: "fiscal-v1-snapshot-v4" })), /VERSION_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...value, lineDescriptions: [{ lineId: free.lineId, description: "Another item" }] })), /UNREGISTERED_GOOD_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...value, decision: { ...value.decision, lines: [{ ...free, presentationId: "fabricated" }] } })), /UNREGISTERED_GOOD_INVALID/);
});

test("snapshot V4 binds a separate global allowance without changing legacy versions or line/tax bases", () => {
  const source = fixture("SUPPORTED", { documentType: "BOLETA" }), legacy = source.snapshot;
  const freeze = (value: FiscalV1Snapshot): FiscalV1Snapshot => {
    const material = { ...value, decisionSha256: fiscalV1CanonicalSha256(value.decision) };
    return { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  };
  const line = { ...legacy.decision.lines[0], unitPriceCents: 115, totalCents: 115,
    legalCategory: "EXONERADA" as const, disclosure: { kind: "ITEMIZED" as const,
      baseCents: 115, taxCents: 0, appliedRateBasisPoints: 0 } };
  const globalDiscount = { schemaVersion: 1, amountCents: 10, baseCents: 115, reasonCode: "03", affectsTaxBase: false } as const;
  const rounding = { schemaVersion: 1, amountCents: -5, policyId: "opaque policy / α", policyVersion: 1,
    currency: "PEN", stepCents: 10, direction: "A_FAVOR_CLIENTE", application: "EFECTIVO_TOTAL" } as const;
  const modern = freeze({ ...legacy, schemaVersion: "fiscal-v1-snapshot-v4",
    decision: { ...legacy.decision, lines: [line], totalCents: 100, baseCents: 115, taxCents: 0,
      globalDiscount, cashPaymentRounding: rounding } });
  const bytes = JSON.stringify(legacy), hash = legacy.snapshotSha256;
  assert.doesNotThrow(() => assertFiscalV1SnapshotForIssuance(modern));
  assert.equal(modern.decision.lines[0].totalCents, 115); assert.equal(modern.decision.baseCents, 115);
  assert.equal(modern.decision.totalCents, 100);
  for (const schemaVersion of ["fiscal-v1-snapshot", "fiscal-v1-snapshot-v2", "fiscal-v1-snapshot-v3"] as const)
    assert.throws(() => assertFiscalV1Snapshot(freeze({ ...modern, schemaVersion })), /SNAPSHOT_VERSION_INVALID/);
  const { globalDiscount: _discount, ...withoutGlobal } = modern.decision;
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...modern, decision: withoutGlobal })), /SNAPSHOT_VERSION_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot({ ...modern, decision: { ...modern.decision,
    globalDiscount: { ...globalDiscount, amountCents: 9 } } }), /SNAPSHOT_HASH_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...modern, decision: { ...modern.decision,
    globalDiscount: { ...globalDiscount, baseCents: 114 } } })), /GLOBAL_DISCOUNT_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...modern, decision: { ...modern.decision,
    lines: [{ ...line, legalCategory: "GRAVADA" }] } })), /GLOBAL_DISCOUNT_UNSUPPORTED/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...modern, paymentTerms: { kind: "CREDITO", netPendingCents: 100,
    installments: [{ dueOn: "2026-10-16", amountCents: 100 }] } })), /COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
  assert.throws(() => prepareFiscalV1CreditNote({ ...source, originalSnapshot: modern,
    originalDocument: { ...source.document, snapshotSha256: modern.snapshotSha256 }, priorCredits: [],
    ...source.publication } as never), /CREDIT_NOTE_COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
  assertFiscalV1SnapshotForIssuance(legacy);
  assert.equal(JSON.stringify(legacy), bytes); assert.equal(fiscalV1SnapshotFingerprint(legacy), hash);
});

test("a valid snapshot hash cannot disguise ordinary basis inconsistent with its frozen line", () => {
  const original = fixture().snapshot;
  const decision = { ...original.decision, lines: original.decision.lines.map(line => ({ ...line,
    ordinaryFiscalTreatment: { basis: "APPENDIX_I", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0 } as const })) };
  const snapshot = { ...original, decision, decisionSha256: fiscalV1CanonicalSha256(decision) };
  const frozen = { ...snapshot, snapshotSha256: fiscalV1SnapshotFingerprint(snapshot) };
  assert.throws(() => assertFiscalV1Snapshot(frozen), /FISCAL_V1_ORDINARY_FISCAL_TREATMENT_MISMATCH/);
});

test("la referencia comercial usa identificadores opacos y congela cantidades, precios y descripción", () => {
  const commercial = { id: "opaque snapshot / α", ventaId: "opaque sale / β", moneda: "PEN", total: 3,
    items: [{ id: "line", presentacionId: "presentation", nombre: "Producto", cantidadVendida: 1,
      precioUnitario: 3, total: 3 }] } as IVentaSnapshot;
  const source = fiscalV1RegisteredSaleSource(commercial);
  assert.equal(source.snapshotId, commercial.id);
  assert.deepEqual(fiscalV1RegisteredSaleSource({ ...commercial, items: [{ ...commercial.items[0], imagenUrl: "different" }] }), source);
  assert.notEqual(fiscalV1RegisteredSaleSource({ ...commercial, total: 4 }).snapshotSha256, source.snapshotSha256);
  const { snapshot } = fixture();
  const frozen = { ...snapshot, commercialSource: source };
  const withSource = { ...frozen, snapshotSha256: fiscalV1SnapshotFingerprint(frozen) };
  assert.doesNotThrow(() => assertFiscalV1Snapshot(withSource));
  assert.throws(() => assertFiscalV1Snapshot({ ...withSource, commercialSource: { ...source, snapshotId: "changed" } }), /HASH_INVALID/);
});

test("registered cash source freezes original payment, date and explicit manual/rounding facts", () => {
  const commercial = { id: "cash snapshot / α", ventaId: "cash sale / β", createdAt: NOW,
    moneda: "PEN", subtotal: 11.04, descuentoTotal: 0, impuesto: 0, montoRedondeo: -0.04,
    total: 11, cobro: { schemaVersion: 1, totalVenta: 11, efectivoRecibido: 11 },
    redondeoPago: { schemaVersion: 1, monto: -0.04, politicaId: "policy", politicaVersion: 1 },
    items: [{ id: "line", presentacionId: "presentation", nombre: "Producto", cantidadVendida: 1,
      precioUnitario: 15, total: 11.04, montoModificado: true, descuento: 0 }] } as IVentaSnapshot;
  const evidence = cashEvidence(commercial.ventaId);
  const source = fiscalV1RegisteredCashSaleSource(commercial, evidence);
  assert.deepEqual(Object.keys(source).sort(), ["cashEvidenceSha256", "kind", "snapshotId", "snapshotSha256"]);
  assert.equal(source.kind, "REGISTERED_CASH_SALE");
  assert.equal(source.snapshotId, commercial.id);
  assert.deepEqual(fiscalV1RegisteredCashSaleSource({ ...commercial, items: [{ ...commercial.items[0], imagenUrl: "new" }] }, evidence), source);
  for (const changed of [
    { ...commercial, createdAt: NOW + 1 }, { ...commercial, subtotal: 11.03 },
    { ...commercial, impuesto: 0.01 }, { ...commercial, montoRedondeo: -0.03 },
    { ...commercial, cobro: { ...commercial.cobro!, efectivoRecibido: 12 } },
    { ...commercial, redondeoPago: { ...commercial.redondeoPago!, politicaVersion: 2 } },
    { ...commercial, items: [{ ...commercial.items[0], montoModificado: false }] },
    { ...commercial, items: [{ ...commercial.items[0], descuento: 1 }] },
  ]) assert.notEqual(fiscalV1RegisteredCashSaleSource(changed, evidence).snapshotSha256, source.snapshotSha256);
  assert.throws(() => fiscalV1RegisteredCashSaleSource({ ...commercial, createdAt: NaN }, evidence), /SOURCE_INVALID/);
  assert.notEqual(source.snapshotSha256, fiscalV1RegisteredSaleSource(commercial).snapshotSha256);
});

test("registered cash requires V3 even without a price adjustment and cannot masquerade as credit/factura", () => {
  const { snapshot } = fixture("SUPPORTED", { documentType: "BOLETA" });
  const source = { kind: "REGISTERED_CASH_SALE" as const, snapshotId: "cash / original", snapshotSha256: HASH, cashEvidenceSha256: HASH };
  const freeze = (value: FiscalV1Snapshot): FiscalV1Snapshot => ({ ...value, snapshotSha256: fiscalV1SnapshotFingerprint(value) });
  const cash = freeze({ ...snapshot, schemaVersion: "fiscal-v1-snapshot-v3", commercialSource: source });
  assert.doesNotThrow(() => assertFiscalV1SnapshotForIssuance(cash));
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...cash, schemaVersion: "fiscal-v1-snapshot" })), /VERSION_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...cash, paymentTerms: { kind: "CREDITO", netPendingCents: 1180,
    installments: [{ dueOn: "2026-11-01", amountCents: 1180 }] } })), /COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
  const invoice = fixture().snapshot;
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...invoice, schemaVersion: "fiscal-v1-snapshot-v3", commercialSource: source })), /COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
});

test("registered cash snapshot admits exact cash/manual gross/rounding and rejects fabricated financial facts", () => {
  const snapshot = { id: "snapshot", type: "venta_snapshot", ventaId: "sale", createdAt: NOW,
    moneda: "PEN", subtotal: 11.04, impuesto: 0, descuentoTotal: 0, montoRedondeo: -0.04, total: 11,
    redondeoPago: { schemaVersion: 1, monto: -0.04, politicaId: "cash-policy", politicaVersion: 1,
      moneda: "PEN", paso: 0.1, direccion: "A_FAVOR_CLIENTE", aplicacion: "EFECTIVO_TOTAL" },
    cobro: resolveVentaCobro({ totalVenta: 11 }),
    items: [{ id: "line", presentacionId: "product", nombre: "Producto", cantidadVendida: 1,
      precioUnitario: 15, total: 11.04, montoModificado: true, descuento: 0 }] } as IVentaSnapshot;
  const before = structuredClone(snapshot);
  assert.doesNotThrow(() => assertFiscalV1RegisteredCashSaleSnapshot(snapshot));
  assert.deepEqual(snapshot, before);
  const returned = resolveVentaCobro({ totalVenta: 11, efectivoRecibido: 20,
    devoluciones: [{ id: "change fact", metodoPago: "EFECTIVO", monto: 9, confirmadoAt: NOW, operadorId: "operator" }] });
  assert.doesNotThrow(() => assertFiscalV1RegisteredCashSaleSnapshot({ ...snapshot, cobro: returned }));
  assert.equal(returned.efectivoAplicado, 11);
  assert.equal(returned.vueltoDevuelto, 9);
  for (const invalid of [
    { ...snapshot, items: [{ ...snapshot.items[0], montoModificado: false }] },
    { ...snapshot, subtotal: 15 }, { ...snapshot, impuesto: 0.01 },
    { ...snapshot, descuentoTotal: 0.01 }, { ...snapshot, redondeoPago: undefined },
    { ...snapshot, cobro: undefined },
    { ...snapshot, cobro: resolveVentaCobro({ totalVenta: 11, efectivoRecibido: 12 }) },
  ]) assert.throws(() => assertFiscalV1RegisteredCashSaleSnapshot(invalid), /CASH_SNAPSHOT_INVALID/);
});

test("registered cash evidence freezes exact opaque movement identities and semantics independent of order", () => {
  const original = cashEvidence("sale");
  const evidence: FiscalV1RegisteredCashEvidence = { ...original, movements: [
    { ...original.movements[0], amountCents: 2000 },
    { ...original.movements[0], movementId: "change / β", type: "EGRESO", amountCents: 900 }] };
  const hash = fiscalV1RegisteredCashEvidenceSha256(evidence);
  assert.equal(fiscalV1RegisteredCashEvidenceSha256({ ...evidence, movements: [...evidence.movements].reverse() }), hash);
  assert.notEqual(fiscalV1RegisteredCashEvidenceSha256({ ...evidence,
    movements: [{ ...evidence.movements[0], movementId: "replacement same money" }, evidence.movements[1]] }), hash);
  assert.notEqual(fiscalV1RegisteredCashEvidenceSha256({ ...evidence,
    movements: [{ ...evidence.movements[0], createdAtMs: NOW + 1 }, evidence.movements[1]] }), hash);
  for (const invalid of [
    { ...evidence, netAmountCents: 2000 }, { ...evidence, movements: [evidence.movements[0], evidence.movements[0]] },
    { ...evidence, movements: [{ ...evidence.movements[0], referenceId: "other sale" }, evidence.movements[1]] },
    { ...evidence, movements: [{ ...evidence.movements[0], cajaId: "other caja" }, evidence.movements[1]] },
  ]) assert.throws(() => fiscalV1RegisteredCashEvidenceSha256(invalid), /CASH_EVIDENCE_INVALID/);
});

type TestMode = { taxRegime?: "RER" | "NRUS"; documentType?: "FACTURA" | "BOLETA";
  noteReasonCodes?: readonly string[] };
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
    capabilityStatus, creditNoteReasonCodes: mode.noteReasonCodes ?? ["TEST_RETURN"] };
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
    reasonCode: mode.noteReasonCodes?.[0] ?? "TEST_RETURN", issuedOn: "2026-10-15", recipientId: sale.buyer.documentNumber,
    ...(sale.documentType === "BOLETA" ? { originalGrant: { recipientId: sale.buyer.documentNumber,
      grantedAtMs: NOW - 1000, evidenceRef: "synthetic-grant" } } : {}),
    lines: [{ originalLineId: "line-1", creditQuantityMilli: 500, creditCents: 590 }] };
  return { publication, snapshot, document, draft };
}

function regionalNoteFixture() {
  const input = fixture("SUPPORTED", { noteReasonCodes: ["01", "06", "07"] });
  const original = input.snapshot.decision.lines[0];
  const line = { ...original, quantityMilli: 3000, unitPriceCents: 100, totalCents: 300,
    legalCategory: "EXONERADA" as const,
    disclosure: { kind: "ITEMIZED" as const, baseCents: 300, taxCents: 0, appliedRateBasisPoints: 0 } };
  const location = { status: "CONFIRMED" as const, ubigeo: "120601", evidenceRef: "historical-delivery" };
  const decision = { ...input.snapshot.decision, lines: [line], totalCents: 300, baseCents: 300, taxCents: 0,
    amazonia: { facts: { transfer: location, consumption: location },
      decision: { kind: "EXEMPT" as const, basis: "LEY_27037_ART_13_1_A" as const,
        approvalId: "historical-approval", territoryVersion: "historical-territory" },
      lineDecisions: [{ lineId: line.lineId, basis: "LEY_27037_ART_13_1_A" as const,
        ordinaryCategory: "GRAVADA" as const, ordinaryTaxRateBasisPoints: 1800 }] } };
  const material = { ...input.snapshot, decision, decisionSha256: fiscalV1CanonicalSha256(decision) };
  const snapshot = { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  const payload = { ...input.publication.bundle.payload, capabilities: input.publication.bundle.payload.capabilities.flatMap(cap => {
    if (cap.documentType !== "NOTA_CREDITO") return [cap];
    const regional = { ...cap, capabilityId: "regional-note", legalCategories: ["EXONERADA" as const],
      amazoniaSale: "ONEROUS_GOODS" as const, amazoniaTransferUbigeo: "120601" };
    return [cap, { ...regional, fingerprintSha256: fiscalV1PublicationArtifactFingerprint(regional) }];
  }) };
  const bundle = { payload, payloadSha256: fiscalV1PublicationPayloadFingerprint(payload),
    signature: { ...input.publication.bundle.signature, signatureBase64: Buffer.from(nacl.sign.detached(
      Buffer.from(fiscalV1PublicationPayloadMaterial(payload)), KEY_PAIR.secretKey)).toString("base64") } };
  return { ...input, snapshot, document: { ...input.document, snapshotSha256: snapshot.snapshotSha256 },
    publication: { ...input.publication, bundle },
    draft: { ...input.draft, originalSnapshotSha256: snapshot.snapshotSha256, reasonCode: "07",
      lines: [{ originalLineId: line.lineId, creditQuantityMilli: 1000, creditCents: 100 }] } };
}

test("nota regional conserva fundamento y tasa ordinaria aunque no exista autorización amazónica actual", () => {
  const { draft, snapshot, document, publication } = regionalNoteFixture();
  const prepared = prepareFiscalV1CreditNote({ draft, originalSnapshot: snapshot, originalDocument: document,
    priorCredits: [], ...publication });
  assert.equal(prepared.capabilityRef.capabilityId, "regional-note");
  assert.equal(prepared.lines[0].originalLegalCategory, "EXONERADA");
  assert.deepEqual(prepared.lines[0].originalAmazoniaLineDecision, snapshot.decision.amazonia!.lineDecisions![0]);
  assert.equal(prepared.lines[0].originalDisclosure.taxCents, 0);
  assert.equal("roundingAdjustmentCents" in prepared.lines[0], false);
  const second = prepareFiscalV1CreditNote({ draft: { ...draft, noteId: "second", noteOperationId: "second-op",
    lines: [{ originalLineId: "line-1", creditQuantityMilli: 2000, creditCents: 200 }] },
    originalSnapshot: snapshot, originalDocument: document, ...publication,
    priorCredits: [{ noteId: prepared.noteId, operationId: prepared.noteOperationId,
      originalDocumentId: document.documentId, originalSnapshotSha256: snapshot.snapshotSha256, state: "UNKNOWN",
      lines: [{ originalLineId: "line-1", creditedQuantityMilli: 1000, creditedCents: 100 }] }] });
  assert.equal(prepared.totalCents + second.totalCents, snapshot.decision.totalCents);
  assert.throws(() => prepareFiscalV1CreditNote({ draft: { ...draft, noteId: "over", noteOperationId: "over-op" },
    originalSnapshot: snapshot, originalDocument: document, ...publication,
    priorCredits: [{ noteId: "prior", operationId: "prior-op", originalDocumentId: document.documentId,
      originalSnapshotSha256: snapshot.snapshotSha256, state: "TRIBUTARY_REJECTED",
      lines: [{ originalLineId: "line-1", creditedQuantityMilli: 3000, creditedCents: 300 }] }] }), /EXCEEDS_REMAINING/);
});

test("devolución final absorbe el céntimo residual sin crear descuentos ni alterar el original", () => {
  const { draft, snapshot, document, publication } = regionalNoteFixture();
  const decision = { ...snapshot.decision, lines: [{ ...snapshot.decision.lines[0], quantityMilli: 3000,
    unitPriceCents: 1, totalCents: 3, disclosure: { kind: "ITEMIZED" as const, baseCents: 3, taxCents: 0, appliedRateBasisPoints: 0 } }],
    totalCents: 3, baseCents: 3 };
  const material = { ...snapshot, decision, decisionSha256: fiscalV1CanonicalSha256(decision) };
  const frozen = { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  const prepared = prepareFiscalV1CreditNote({ draft: { ...draft, originalSnapshotSha256: frozen.snapshotSha256,
    lines: [{ originalLineId: "line-1", creditQuantityMilli: 1500, creditCents: 1 }] }, originalSnapshot: frozen,
    originalDocument: { ...document, snapshotSha256: frozen.snapshotSha256 }, ...publication,
    priorCredits: [{ noteId: "prior", operationId: "prior-op", originalDocumentId: document.documentId,
      originalSnapshotSha256: frozen.snapshotSha256, state: "SIGNED",
      lines: [{ originalLineId: "line-1", creditedQuantityMilli: 1500, creditedCents: 2 }] }] });
  assert.equal(prepared.lines[0].roundingAdjustmentCents, -1);
  assert.equal(prepared.totalCents, 1);
});

test("tres devoluciones acumulan 2+1+2 céntimos y las reservas antiguas mantienen 2+2+1", () => {
  const input = regionalNoteFixture(), source = input.snapshot;
  const decision = { ...source.decision, lines: [{ ...source.decision.lines[0], quantityMilli: 1000,
    unitPriceCents: 5, totalCents: 5, disclosure: { kind: "ITEMIZED" as const,
      baseCents: 5, taxCents: 0, appliedRateBasisPoints: 0 } }], totalCents: 5, baseCents: 5 };
  const material = { ...source, decision, decisionSha256: fiscalV1CanonicalSha256(decision) };
  const snapshot = { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  for (const mode of ["CUMULATIVE", "LEGACY"] as const) {
    const priorCredits: import("../contracts").FiscalV1PriorCreditNote[] = [];
    const amounts = mode === "CUMULATIVE" ? [2, 1, 2] : [2, 2, 1];
    for (const [index, creditQuantityMilli] of [333, 333, 334].entries()) {
      const args = { draft: { ...input.draft, originalSnapshotSha256: snapshot.snapshotSha256,
        noteId: `note-${index}`, noteOperationId: `operation-${index}`,
        lines: [{ originalLineId: "line-1", creditQuantityMilli, creditCents: amounts[index] }] },
        originalSnapshot: snapshot, originalDocument: { ...input.document, snapshotSha256: snapshot.snapshotSha256 },
        ...input.publication, priorCredits, quantityProration: mode };
      const prepared = prepareFiscalV1CreditNote(args);
      assert.equal(prepared.totalCents, amounts[index]);
      assert.equal(prepared.quantityProration, mode === "CUMULATIVE" ? "CUMULATIVE" : undefined);
      assert.deepEqual(prepareFiscalV1CreditNote(args), prepared, "retry does not change the reservation");
      if (mode === "LEGACY") assert.equal("roundingAdjustmentCents" in prepared.lines[0], false);
      priorCredits.push({ noteId: prepared.noteId, operationId: prepared.noteOperationId,
        originalDocumentId: prepared.originalDocumentId, originalSnapshotSha256: snapshot.snapshotSha256,
        ...(prepared.quantityProration ? { quantityProration: prepared.quantityProration } : {}), state: "SIGNED",
        lines: [{ originalLineId: "line-1", creditedQuantityMilli: creditQuantityMilli, creditedCents: prepared.totalCents }] });
    }
    assert.equal(priorCredits.reduce((sum, prior) => sum + prior.lines[0].creditedCents, 0), 5);
  }
});

function discountedNoteFixture(quantityMilli = 1000, unitPriceCents = 1180, discountCents = 118, taxable = false) {
  const input = taxable ? fixture("SUPPORTED", { noteReasonCodes: ["01", "06", "07"] }) : regionalNoteFixture();
  const gross = Number((BigInt(quantityMilli) * BigInt(unitPriceCents) + 500n) / 1000n);
  const total = gross - discountCents, tax = taxable ? Number((BigInt(total) * 1800n + 5900n) / 11800n) : 0;
  const lineId = " ? opaque original line / 零 ";
  const line = { ...input.snapshot.decision.lines[0], lineId, quantityMilli, unitPriceCents, discountCents,
    totalCents: total, disclosure: { kind: "ITEMIZED" as const, baseCents: total - tax,
      taxCents: tax, appliedRateBasisPoints: taxable ? 1800 : 0 } };
  const decision = { ...input.snapshot.decision, lines: [line], totalCents: total, baseCents: total - tax, taxCents: tax,
    ...(input.snapshot.decision.amazonia ? { amazonia: { ...input.snapshot.decision.amazonia,
      lineDecisions: input.snapshot.decision.amazonia.lineDecisions!.map(item => ({ ...item, lineId })) } } : {}) };
  const material = { ...input.snapshot, decision, decisionSha256: fiscalV1CanonicalSha256(decision),
    lineDescriptions: [{ lineId, description: "Synthetic historical discounted line" }] };
  const snapshot = { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  return { ...input, snapshot, document: { ...input.document, snapshotSha256: snapshot.snapshotSha256 },
    draft: { ...input.draft, originalSnapshotSha256: snapshot.snapshotSha256, reasonCode: "07",
      lines: [{ originalLineId: lineId, creditQuantityMilli: quantityMilli, creditCents: total }] } };
}

function genericDiscountOriginal(input: ReturnType<typeof discountedNoteFixture>): FiscalSignedDocument {
  const { snapshot, document } = input, d = snapshot.decision, source = d.lines[0];
  const digest = Buffer.alloc(32, 0xab).toString("base64"), tax = source.disclosure.taxCents!;
  const total = source.totalCents, taxable = source.legalCategory === "GRAVADA";
  const generic: FiscalSignedDocument = { type: "comprobante_electronico", documentId: document.documentId, tenantId: d.tenantId, environment: "DEMO",
    identity: { issuerRuc: d.issuerRuc, documentType: d.documentType, series: snapshot.series, number: snapshot.number },
    origin: { kind: "VENTA", saleId: d.saleId, saleSnapshotId: "opaque sale snapshot",
      intentId: "opaque intent", fiscalSnapshotId: snapshot.snapshotId },
    issuer: { legalName: snapshot.issuerLegalName, fiscalAddress: snapshot.issuerEstablishment.address, establishmentCode: "0000" },
    buyer: { documentType: "RUC", documentNumber: d.buyer!.documentNumber, legalName: d.buyer!.legalName },
    currency: "PEN", issueDate: d.occurredOn, issuedAt: new Date(NOW).toISOString(), signedAt: new Date(NOW).toISOString(),
    lines: [{ lineId: source.lineId, description: snapshot.lineDescriptions[0].description,
      quantity: String(source.quantityMilli / 1000), unitCode: source.unitCode, unitPriceCents: source.unitPriceCents,
      grossCents: source.totalCents + source.discountCents, discountCents: source.discountCents, totalCents: source.totalCents,
      tax: taxable ? { category: "GRAVADA", affectationCode: "10", taxScheme: "IGV",
        taxRateBasisPoints: 1800, taxableBaseCents: total - tax, taxAmountCents: tax }
        : { category: "EXONERADA", affectationCode: "20", taxScheme: "NONE", taxRateBasisPoints: 0,
          taxableBaseCents: total, taxAmountCents: 0 } }],
    totals: { taxableBaseCents: taxable ? total - tax : 0, exemptCents: taxable ? 0 : total,
      unaffectedCents: 0, taxCents: tax, payableCents: total },
    signature: { signedXml: document.signedXml!, digestValue: digest },
    print: { qrPayload: `${d.issuerRuc}|${d.documentType === "BOLETA" ? "03" : "01"}|${snapshot.series}|${snapshot.number}|${(tax / 100).toFixed(2)}|${(total / 100).toFixed(2)}|${d.occurredOn}|6|${d.buyer!.documentNumber}|${digest}`,
      digestOutsideQr: false, legalLegend: "DEMO — SIN VALIDEZ TRIBUTARIA" } };
  assert.deepEqual(validateFiscalSignedDocument(generic), [], "generic comparison fixture must be valid");
  return generic;
}

test("discounted V1 full credit separates 1180 gross, 118 discount and 1062 net without a discount-sized residue", () => {
  for (const taxable of [false, true]) for (const reasonCode of ["01", "06", "07"]) {
    const input = discountedNoteFixture(1000, 1180, 118, taxable), bytes = JSON.stringify(input.snapshot);
    const prepared = prepareFiscalV1CreditNote({ draft: { ...input.draft, reasonCode }, originalSnapshot: input.snapshot,
      originalDocument: input.document, priorCredits: [], ...input.publication });
    assert.equal(prepared.lines[0].originalDiscountCents, 118);
    assert.equal("roundingAdjustmentCents" in prepared.lines[0], false);
    assert.deepEqual(fiscalV1PreparedCreditLineEconomics(prepared.lines[0], prepared.quantityProration),
      { grossCents: 1180, discountCents: 118, totalCents: 1062 });
    assert.equal(JSON.stringify(input.snapshot), bytes);
  }
});

test("discounted V1 three partial credits close gross/discount/net cents against the generic credit policy", () => {
  const input = discountedNoteFixture(3, 33300, 10), original = genericDiscountOriginal(input);
  const v1History: FiscalV1PriorCreditNote[] = [], genericHistory: ReturnType<typeof prepareFiscalCreditNote>[] = [];
  const parts: ReturnType<typeof fiscalV1PreparedCreditLineEconomics>[] = [], residues: number[] = [];
  for (let index = 0; index < 3; index++) {
    const note = prepareFiscalV1CreditNote({ ...input.publication, originalSnapshot: input.snapshot,
      originalDocument: input.document, priorCredits: v1History, draft: { ...input.draft,
        noteId: `opaque note ${index}`, noteOperationId: `opaque operation ${index}`,
        lines: [{ originalLineId: input.draft.lines[0].originalLineId, creditQuantityMilli: 1, creditCents: 30 }] } });
    const generic = prepareFiscalCreditNote(original, { operationId: note.noteOperationId, idempotencyKey: note.noteId,
      reasonCode: "07", reason: "Synthetic return", selections: [{ originalLineId: original.lines[0].lineId, quantity: "0.001" }] }, genericHistory);
    const economics = fiscalV1PreparedCreditLineEconomics(note.lines[0], note.quantityProration);
    assert.deepEqual(economics, { grossCents: generic.lines[0].grossCents,
      discountCents: generic.lines[0].discountCents, totalCents: generic.lines[0].totalCents });
    parts.push(economics); residues.push(note.lines[0].roundingAdjustmentCents ?? 0); genericHistory.push(generic);
    v1History.push({ noteId: note.noteId, operationId: note.noteOperationId, originalDocumentId: note.originalDocumentId,
      originalSnapshotSha256: note.originalSnapshotSha256, quantityProration: "CUMULATIVE", state: "UNKNOWN",
      lines: [{ originalLineId: note.lines[0].originalLineId, creditedQuantityMilli: 1, creditedCents: 30 }] });
  }
  assert.deepEqual(parts, [{ grossCents: 33, discountCents: 3, totalCents: 30 },
    { grossCents: 34, discountCents: 4, totalCents: 30 }, { grossCents: 33, discountCents: 3, totalCents: 30 }]);
  assert.deepEqual(residues, [0, 1, 0]);
});

test("deterministic exonerated partitions agree with generic cumulative gross/net/discount/tax and close every admitted series", () => {
  let admitted = 0, rejected = 0;
  for (const quantityMilli of [3, 7, 1000, 3000]) for (const unitPriceCents of [1, 5, 1180, 33300]) {
    const gross = Number((BigInt(quantityMilli) * BigInt(unitPriceCents) + 500n) / 1000n);
    for (const discount of [...new Set([1, Math.max(1, Math.floor(gross / 10))])]) {
      if (gross <= discount) continue;
      const input = discountedNoteFixture(quantityMilli, unitPriceCents, discount), original = genericDiscountOriginal(input);
      const third = Math.floor(quantityMilli / 3), half = Math.floor(quantityMilli / 2);
      for (const partition of [[quantityMilli], [half, quantityMilli - half], [third, third, quantityMilli - 2 * third],
        [1, quantityMilli - 1], [1, 1, quantityMilli - 2]]) {
        const v1History: FiscalV1PriorCreditNote[] = [], genericHistory: ReturnType<typeof prepareFiscalCreditNote>[] = [];
        let consumed = 0, net = 0, sumGross = 0, sumDiscount = 0, supported = true;
        for (const [index, quantity] of partition.entries()) {
          const next = consumed + quantity;
          const creditCents = Number((BigInt(input.snapshot.decision.totalCents) * BigInt(next) + BigInt(quantityMilli) / 2n) /
            BigInt(quantityMilli)) - net;
          const prepare = () => prepareFiscalV1CreditNote({ ...input.publication, originalSnapshot: input.snapshot,
            originalDocument: input.document, priorCredits: v1History, draft: { ...input.draft,
              noteId: `opaque grid note ${index}`, noteOperationId: `opaque grid operation ${index}`,
              lines: [{ originalLineId: input.draft.lines[0].originalLineId, creditQuantityMilli: quantity, creditCents }] } });
          let generic: ReturnType<typeof prepareFiscalCreditNote>;
          try { generic = prepareFiscalCreditNote(original, { operationId: `opaque grid operation ${index}`, idempotencyKey: `opaque grid note ${index}`,
            reasonCode: "07", reason: "Synthetic return", selections: [{ originalLineId: original.lines[0].lineId,
              quantity: String(quantity / 1000) }] }, genericHistory); }
          catch { assert.throws(prepare); rejected++; supported = false; break; }
          const prepared = prepare(), actual = fiscalV1PreparedCreditLineEconomics(prepared.lines[0], prepared.quantityProration);
          assert.deepEqual(actual, { grossCents: generic.lines[0].grossCents,
            discountCents: generic.lines[0].discountCents, totalCents: generic.lines[0].totalCents });
          assert.equal(generic.lines[0].tax.taxAmountCents, 0);
          assert.ok(Math.abs(prepared.lines[0].roundingAdjustmentCents ?? 0) <= 1);
          genericHistory.push(generic); consumed = next; net += actual.totalCents;
          sumGross += actual.grossCents; sumDiscount += actual.discountCents;
          v1History.push({ noteId: prepared.noteId, operationId: prepared.noteOperationId, originalDocumentId: prepared.originalDocumentId,
            originalSnapshotSha256: prepared.originalSnapshotSha256, quantityProration: "CUMULATIVE", state: "SIGNED",
            lines: [{ originalLineId: prepared.lines[0].originalLineId, creditedQuantityMilli: quantity, creditedCents: actual.totalCents }] });
        }
        if (supported) { admitted++; assert.equal(consumed, quantityMilli); assert.equal(sumGross, gross);
          assert.equal(sumDiscount, discount); assert.equal(net, gross - discount); }
      }
    }
  }
  assert.ok(admitted > 50); assert.ok(rejected > 0);
});

test("discounted taxable credit admits exact halves and full return but rejects unrepresentable historical tax fractions", () => {
  const input = discountedNoteFixture(1000, 1180, 118, true), genericOriginal = genericDiscountOriginal(input);
  const history: FiscalV1PriorCreditNote[] = [], genericHistory: ReturnType<typeof prepareFiscalCreditNote>[] = [];
  for (let index = 0; index < 2; index++) {
    const note = prepareFiscalV1CreditNote({ ...input.publication, originalSnapshot: input.snapshot,
      originalDocument: input.document, priorCredits: history, draft: { ...input.draft,
        noteId: `taxable note ${index}`, noteOperationId: `taxable op ${index}`,
        lines: [{ originalLineId: input.draft.lines[0].originalLineId, creditQuantityMilli: 500, creditCents: 531 }] } });
    const generic = prepareFiscalCreditNote(genericOriginal, { operationId: note.noteOperationId, idempotencyKey: note.noteId,
      reasonCode: "07", reason: "Synthetic return", selections: [{ originalLineId: note.lines[0].originalLineId, quantity: "0.5" }] }, genericHistory);
    assert.deepEqual(fiscalV1PreparedCreditLineEconomics(note.lines[0], note.quantityProration),
      { grossCents: 590, discountCents: 59, totalCents: 531 });
    assert.equal(generic.lines[0].tax.taxAmountCents, 81); assert.equal(generic.lines[0].tax.taxableBaseCents, 450);
    genericHistory.push(generic); history.push({ noteId: note.noteId, operationId: note.noteOperationId,
      originalDocumentId: note.originalDocumentId, originalSnapshotSha256: note.originalSnapshotSha256,
      quantityProration: "CUMULATIVE", state: "TRIBUTARY_REJECTED",
      lines: [{ originalLineId: note.lines[0].originalLineId, creditedQuantityMilli: 500, creditedCents: 531 }] });
  }
  assert.equal(genericHistory.reduce((sum, note) => sum + note.totals.taxCents, 0), 162);
  assert.throws(() => prepareFiscalV1CreditNote({ ...input.publication, originalSnapshot: input.snapshot,
    originalDocument: input.document, priorCredits: [], draft: { ...input.draft,
      lines: [{ originalLineId: input.draft.lines[0].originalLineId, creditQuantityMilli: 333, creditCents: 354 }] } }),
  /FISCAL_V1_CREDIT_NOTE_TAX_PRORATION_UNREPRESENTABLE/);
});

test("discounted cumulative notes reject forged history or rehashed original gross/discount inconsistency", () => {
  const input = discountedNoteFixture(1000, 1180, 118), id = input.draft.lines[0].originalLineId;
  const prior: FiscalV1PriorCreditNote = { noteId: "opaque prior note", operationId: "opaque prior op",
    originalDocumentId: input.document.documentId, originalSnapshotSha256: input.snapshot.snapshotSha256,
    quantityProration: "CUMULATIVE", state: "SIGNED", lines: [{ originalLineId: id, creditedQuantityMilli: 500, creditedCents: 531 }] };
  const args = { ...input.publication, originalSnapshot: input.snapshot, originalDocument: input.document,
    draft: { ...input.draft, lines: [{ originalLineId: id, creditQuantityMilli: 500, creditCents: 531 }] } };
  for (const changed of [{ ...prior, originalSnapshotSha256: "f".repeat(64) },
    { ...prior, lines: [{ ...prior.lines[0], creditedCents: 530 }] },
    { ...prior, lines: [{ ...prior.lines[0], creditedQuantityMilli: 499 }] },
    { ...prior, lines: [{ ...prior.lines[0], originalLineId: "another opaque line" }] }])
    assert.throws(() => prepareFiscalV1CreditNote({ ...args, priorCredits: [changed] }), /PRIOR_CREDIT_NOTE_INVALID/);
  const decision = { ...input.snapshot.decision, lines: [{ ...input.snapshot.decision.lines[0], discountCents: 117 }] };
  const material = { ...input.snapshot, decision, decisionSha256: fiscalV1CanonicalSha256(decision) };
  const snapshot = { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  assert.throws(() => prepareFiscalV1CreditNote({ ...args, originalSnapshot: snapshot,
    originalDocument: { ...input.document, snapshotSha256: snapshot.snapshotSha256 },
    draft: { ...args.draft, originalSnapshotSha256: snapshot.snapshotSha256 }, priorCredits: [] }),
  /FISCAL_V1_CREDIT_NOTE_ORIGINAL_LINE_AMOUNT_INVALID/);
});

test("prepared-line economics refuses invalid bounds and never authorizes a discounted legacy line", () => {
  const input = discountedNoteFixture();
  const note = prepareFiscalV1CreditNote({ ...input.publication, draft: input.draft,
    originalSnapshot: input.snapshot, originalDocument: input.document, priorCredits: [] });
  const line = note.lines[0];
  for (const changed of [{ ...line, creditQuantityMilli: 0 }, { ...line, creditQuantityMilli: -1 },
    { ...line, creditQuantityMilli: 1001 }, { ...line, originalQuantityMilli: Number.MAX_SAFE_INTEGER + 1 },
    { ...line, originalQuantityMilli: 0 }, { ...line, originalUnitPriceCents: -1 },
    { ...line, originalUnitPriceCents: Number.MAX_SAFE_INTEGER }, { ...line, creditCents: 1063 },
    { ...line, creditCents: 1061 }, { ...line, originalDiscountCents: -1 },
    { ...line, originalDiscountCents: 1181 }, { ...line, roundingAdjustmentCents: 2 },
    { ...line, roundingAdjustmentCents: -2 }, { ...line, roundingAdjustmentCents: 0.5 }])
    assert.throws(() => fiscalV1PreparedCreditLineEconomics(changed, "CUMULATIVE"), /ECONOMICS_INVALID/);
  assert.throws(() => fiscalV1PreparedCreditLineEconomics(line), /ECONOMICS_INVALID/);
  assert.throws(() => fiscalV1PreparedCreditLineEconomics(line, "LEGACY" as never), /ECONOMICS_INVALID/);
});

test("golden prepared bytes from e5e9cd7 stay identical for no-discount and legacy reservations", () => {
  const cases = [[fixture(), "CUMULATIVE", "893cad294da277c604379d73389bd890b6501788910b3cb1a44bcc6353599072"],
    [fixture(), "LEGACY", "43066c87a452888e77ee01174cadd71cf1f61be4c231fca9ed122fd75db7d9f6"],
    [discountedNoteFixture(1000, 1180, 1), "LEGACY", "cbb1ca3e14cb29d2ef32698e9ea7d842b3dd7a1794cbb22e5d4574efbd6edaee"]] as const;
  for (const [input, quantityProration, expected] of cases) {
    const value = prepareFiscalV1CreditNote({ ...input.publication, draft: input.draft,
      originalSnapshot: input.snapshot, originalDocument: input.document, priorCredits: [], quantityProration });
    assert.equal(createHash("sha256").update(JSON.stringify(value)).digest("hex"), expected);
  }
});

test("el snapshot congela caja y versión sin cambiar el material de snapshots anteriores", () => {
  const { snapshot } = fixture();
  const { snapshotSha256: _hash, ...oldMaterial } = snapshot;
  assert.equal(fiscalV1SnapshotFingerprint(snapshot), fiscalV1CanonicalSha256(oldMaterial));
  assert.equal("cajaAssignment" in snapshot, false);
  const material = { ...snapshot, cajaAssignment: { cajaId: "caja/opaca:α", assignmentVersion: 3 } };
  const assigned = { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  assert.doesNotThrow(() => assertFiscalV1Snapshot(assigned));
  assert.notEqual(assigned.snapshotSha256, snapshot.snapshotSha256);
  assert.throws(() => assertFiscalV1Snapshot({ ...assigned,
    cajaAssignment: { ...assigned.cajaAssignment, cajaId: "otra" } }), /HASH_INVALID/);
  for (const cajaAssignment of [{ cajaId: "caja", assignmentVersion: 0 }, { cajaId: "caja", assignmentVersion: 1.5 },
    { cajaId: "", assignmentVersion: 1 }, { cajaId: "caja", assignmentVersion: 1, series: "F001" }]) {
    const invalid = { ...snapshot, cajaAssignment };
    assert.throws(() => assertFiscalV1Snapshot({ ...invalid, snapshotSha256: fiscalV1SnapshotFingerprint(invalid) }), /SNAPSHOT_INVALID/);
  }
});

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

test("snapshot-v2 documenta saldo pendiente menor al total y solo cuotas futuras", () => {
  const { snapshot } = fixture();
  const credit = { ...snapshot, schemaVersion: "fiscal-v1-snapshot-v2" as const,
    paymentTerms: { kind: "CREDITO" as const, netPendingCents: 1000,
      installments: [{ dueOn: "2026-10-16", amountCents: 500 }, { dueOn: "2026-11-15", amountCents: 500 }] } };
  const fingerprinted = (value: typeof credit) => ({ ...value, snapshotSha256: fiscalV1SnapshotFingerprint(value) });
  assert.doesNotThrow(() => assertFiscalV1SnapshotForIssuance(fingerprinted(credit)));
  for (const paymentTerms of [
    { ...credit.paymentTerms, netPendingCents: 1181 },
    { ...credit.paymentTerms, netPendingCents: 0 },
    { ...credit.paymentTerms, installments: [{ dueOn: "2026-10-15", amountCents: 1000 }] },
    { ...credit.paymentTerms, installments: [{ dueOn: "2026-10-14", amountCents: 1000 }] },
    { ...credit.paymentTerms, installments: [{ dueOn: "2026-10-16", amountCents: 1180 }] },
  ]) assert.throws(() => assertFiscalV1SnapshotForIssuance(fingerprinted({ ...credit, paymentTerms })),
    /FISCAL_V1_SNAPSHOT_PAYMENT_INVALID/);
  const missingNet = { ...credit, paymentTerms: { kind: "CREDITO" as const,
    installments: credit.paymentTerms.installments } };
  assert.throws(() => assertFiscalV1SnapshotForIssuance({ ...missingNet,
    snapshotSha256: fiscalV1SnapshotFingerprint(missingNet) }), /FISCAL_V1_SNAPSHOT_PAYMENT_INVALID/);
});

test("crédito histórico conserva hash y recuperación pero no admite una nueva emisión", () => {
  const { snapshot } = fixture();
  const legacy = { ...snapshot, paymentTerms: { kind: "CREDITO" as const,
    installments: [{ dueOn: snapshot.decision.occurredOn, amountCents: snapshot.decision.totalCents }] } };
  const historical = { ...legacy, snapshotSha256: fiscalV1SnapshotFingerprint(legacy) };
  const before = JSON.stringify(historical);
  assert.doesNotThrow(() => assertFiscalV1Snapshot(historical));
  assert.throws(() => assertFiscalV1SnapshotForIssuance(historical), /FISCAL_V1_LEGACY_CREDIT_NOT_ADMISSIBLE/);
  assert.equal(JSON.stringify(historical), before);
  assert.doesNotThrow(() => assertFiscalV1SnapshotForIssuance(snapshot));
});

test("boleta sin documento respeta el mismo umbral al contado y a crédito aun con hashes válidos", () => {
  const { snapshot } = fixture("SUPPORTED", { taxRegime: "NRUS", documentType: "BOLETA" });
  const { buyer: _buyer, ...anonymous } = snapshot.decision;
  const freeze = (totalCents: number, credit = false): FiscalV1Snapshot => {
    const decision = { ...anonymous, totalCents, lines: anonymous.lines.map(line => ({ ...line,
      unitPriceCents: totalCents, totalCents })) };
    const material = { ...snapshot, decision, decisionSha256: fiscalV1CanonicalSha256(decision),
      ...(credit ? { schemaVersion: "fiscal-v1-snapshot-v2" as const,
        paymentTerms: { kind: "CREDITO" as const, netPendingCents: totalCents,
          installments: [{ dueOn: "2026-10-16", amountCents: totalCents }] } } : {}) };
    return { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  };
  for (const credit of [false, true]) {
    for (const totalCents of [1100, 48_760, 70_000]) {
      const value = freeze(totalCents, credit), bytes = JSON.stringify(value);
      assert.doesNotThrow(() => assertFiscalV1SnapshotForIssuance(value));
      assert.equal(value.decision.buyer, undefined);
      assert.equal(value.decision.totalCents, totalCents);
      if (value.paymentTerms.kind === "CREDITO") {
        assert.equal(value.paymentTerms.netPendingCents, totalCents);
        assert.equal(value.paymentTerms.installments[0].amountCents, totalCents);
      }
      assert.equal(JSON.stringify(value), bytes);
    }
    const overLimit = freeze(70_001, credit), historicalBytes = JSON.stringify(overLimit);
    assert.throws(() => assertFiscalV1SnapshotForIssuance(overLimit), /FISCAL_BUYER_IDENTIFICATION_REQUIRED/);
    assert.doesNotThrow(() => assertFiscalV1Snapshot(overLimit));
    assert.equal(JSON.stringify(overLimit), historicalBytes);
  }
});

test("factura a crédito sigue exigiendo RUC aun por debajo del umbral de boleta", () => {
  const { snapshot } = fixture();
  const { buyer: _buyer, ...anonymous } = snapshot.decision;
  const freeze = (decision: typeof snapshot.decision): FiscalV1Snapshot => {
    const material = { ...snapshot, schemaVersion: "fiscal-v1-snapshot-v2" as const, decision,
      decisionSha256: fiscalV1CanonicalSha256(decision), paymentTerms: { kind: "CREDITO" as const,
        netPendingCents: decision.totalCents,
        installments: [{ dueOn: "2026-10-16", amountCents: decision.totalCents }] } };
    return { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  };
  assert.throws(() => assertFiscalV1SnapshotForIssuance(freeze(anonymous)), /FISCAL_V1_SNAPSHOT_BUYER_INVALID/);
  assert.throws(() => assertFiscalV1SnapshotForIssuance(freeze({ ...anonymous,
    buyer: { documentType: "DNI", documentNumber: "12345678", legalName: "Comprador sintético" } })),
  /FISCAL_V1_SNAPSHOT_BUYER_INVALID/);
});

test("snapshot V3 exige hechos monetarios explícitos y no cambia los bytes de V1 ni V2", () => {
  const legacy = fixture("SUPPORTED", { documentType: "BOLETA" }).snapshot;
  const freeze = (value: FiscalV1Snapshot): FiscalV1Snapshot => ({ ...value,
    decisionSha256: fiscalV1CanonicalSha256(value.decision), snapshotSha256: fiscalV1SnapshotFingerprint({ ...value,
      decisionSha256: fiscalV1CanonicalSha256(value.decision) }) });
  const rounding = { schemaVersion: 1, amountCents: -4, policyId: "opaque policy / ñ", policyVersion: 1,
    currency: "PEN", stepCents: 10, direction: "A_FAVOR_CLIENTE", application: "EFECTIVO_TOTAL" } as const;
  const line = { ...legacy.decision.lines[0], unitPriceCents: 1104, totalCents: 1104,
    legalCategory: "EXONERADA" as const, disclosure: { kind: "ITEMIZED" as const,
      baseCents: 1104, taxCents: 0, appliedRateBasisPoints: 0 } };
  const modern = freeze({ ...legacy, schemaVersion: "fiscal-v1-snapshot-v3",
    decision: { ...legacy.decision, lines: [line], baseCents: 1104, taxCents: 0,
      totalCents: 1100, cashPaymentRounding: rounding } });
  assert.doesNotThrow(() => assertFiscalV1SnapshotForIssuance(modern));
  assert.equal(modern.decision.lines[0].totalCents, 1104);
  assert.equal(modern.decision.totalCents, 1100);
  for (const schemaVersion of ["fiscal-v1-snapshot", "fiscal-v1-snapshot-v2"] as const)
    assert.throws(() => assertFiscalV1Snapshot(freeze({ ...modern, schemaVersion })), /FISCAL_V1_SNAPSHOT_VERSION_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot({ ...modern, decision: { ...modern.decision,
    cashPaymentRounding: { ...rounding, policyVersion: 2 } } }), /FISCAL_V1_SNAPSHOT_HASH_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...modern, decision: { ...modern.decision,
    cashPaymentRounding: { ...rounding, amountCents: -3 } } })), /FISCAL_CASH_PAYMENT_ROUNDING_INVALID/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...modern, paymentTerms: { kind: "CREDITO", netPendingCents: 1100,
    installments: [{ dueOn: "2026-10-16", amountCents: 1100 }] } })), /FISCAL_V1_COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
  assert.throws(() => assertFiscalV1Snapshot(freeze({ ...legacy, schemaVersion: "fiscal-v1-snapshot-v3" })),
    /FISCAL_V1_SNAPSHOT_VERSION_INVALID/);
  const oldCredit = freeze({ ...legacy, schemaVersion: "fiscal-v1-snapshot-v2",
    paymentTerms: { kind: "CREDITO", netPendingCents: 1180,
      installments: [{ dueOn: "2026-10-16", amountCents: 1180 }] } });
  for (const historical of [legacy, oldCredit]) {
    const bytes = JSON.stringify(historical), hash = historical.snapshotSha256;
    assertFiscalV1Snapshot(historical);
    assertFiscalV1SnapshotForIssuance(historical);
    assert.equal(historical.snapshotSha256, hash);
    assert.equal(fiscalV1SnapshotFingerprint(historical), hash);
    assert.equal(JSON.stringify(historical), bytes);
  }
});

test("un importe manual conserva el precio fuente y exige V3 sin extender notas de crédito", () => {
  const source = fixture("SUPPORTED", { documentType: "BOLETA" });
  const line = { ...source.snapshot.decision.lines[0], unitPriceCents: 1500, manualGrossTotalCents: 100,
    totalCents: 100, legalCategory: "EXONERADA" as const,
    disclosure: { kind: "ITEMIZED" as const, baseCents: 100, taxCents: 0, appliedRateBasisPoints: 0 } };
  const decision = { ...source.snapshot.decision, lines: [line], totalCents: 100, baseCents: 100, taxCents: 0 };
  const material: FiscalV1Snapshot = { ...source.snapshot, schemaVersion: "fiscal-v1-snapshot-v3", decision,
    decisionSha256: fiscalV1CanonicalSha256(decision) };
  const snapshot = { ...material, snapshotSha256: fiscalV1SnapshotFingerprint(material) };
  assert.doesNotThrow(() => assertFiscalV1SnapshotForIssuance(snapshot));
  assert.equal(snapshot.decision.lines[0].unitPriceCents, 1500);
  assert.throws(() => prepareFiscalV1CreditNote({ ...source, originalSnapshot: snapshot,
    originalDocument: { ...source.document, snapshotSha256: snapshot.snapshotSha256 }, priorCredits: [],
    ...source.publication } as never), /FISCAL_V1_CREDIT_NOTE_COMMERCIAL_ADJUSTMENT_UNSUPPORTED/);
  const { manualGrossTotalCents: _manual, ...undisclosed } = line;
  const oldDecision = { ...decision, lines: [undisclosed] };
  const oldMaterial: FiscalV1Snapshot = { ...material, schemaVersion: "fiscal-v1-snapshot", decision: oldDecision,
    decisionSha256: fiscalV1CanonicalSha256(oldDecision) };
  const historical = { ...oldMaterial, snapshotSha256: fiscalV1SnapshotFingerprint(oldMaterial) };
  assert.doesNotThrow(() => assertFiscalV1Snapshot(historical));
  assert.throws(() => assertFiscalV1SnapshotForIssuance(historical), /FISCAL_V1_SNAPSHOT_TOTAL_INVALID/);
});

test("CDR rechazada de una nota no libera cantidades firmadas ni altera el resultado del original", () => {
  const { publication, snapshot, document, draft } = fixture();
  const prior = { noteId: "prior-note", operationId: "prior-op", originalDocumentId: document.documentId,
    originalSnapshotSha256: snapshot.snapshotSha256, state: "TRIBUTARY_REJECTED" as const,
    tributaryResult: { storageRef: "private:note-cdr", sha256: HASH, receivedAtMs: NOW,
      outcome: "REJECTED" as const, responseCode: "2022", description: "Nota rechazada", observations: [] },
    lines: [{ originalLineId: "line-1", creditedQuantityMilli: 1000, creditedCents: 1180 }] };
  const originalBefore = JSON.stringify(document);
  assert.throws(() => prepareFiscalV1CreditNote({ draft, originalSnapshot: snapshot,
    originalDocument: document, priorCredits: [prior], ...publication }), /CREDIT_NOTE_EXCEEDS_REMAINING/);
  assert.equal(JSON.stringify(document), originalBefore);
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

test("causales 01/06 exigen todo el original; 07 permite parcial y agotamiento posterior", () => {
  const { publication, snapshot, document, draft } = fixture("SUPPORTED",
    { noteReasonCodes: ["01", "06", "07"] });
  const full = { ...draft, lines: [{ originalLineId: "line-1", creditQuantityMilli: 1000,
    creditCents: 1180 }] };
  for (const reasonCode of ["01", "06"]) {
    assert.equal(prepareFiscalV1CreditNote({ draft: { ...full, reasonCode },
      originalSnapshot: snapshot, originalDocument: document,
      priorCredits: [], ...publication }).totalCents, 1180);
    assert.throws(() => prepareFiscalV1CreditNote({ draft: { ...draft, reasonCode },
      originalSnapshot: snapshot, originalDocument: document,
      priorCredits: [], ...publication }), /FISCAL_V1_CREDIT_NOTE_TOTAL_SCOPE_REQUIRED/);
  }
  const partial = { ...draft, reasonCode: "07" };
  assert.equal(prepareFiscalV1CreditNote({ draft: partial, originalSnapshot: snapshot,
    originalDocument: document, priorCredits: [], ...publication }).totalCents, 590);
  const priorCredits = [{ noteId: partial.noteId, operationId: partial.noteOperationId,
    originalDocumentId: document.documentId, originalSnapshotSha256: snapshot.snapshotSha256,
    state: "SIGNED" as const, lines: [{ originalLineId: "line-1",
      creditedQuantityMilli: 500, creditedCents: 590 }] }];
  const remaining = { ...partial, noteId: "note-2", noteOperationId: "note-op-2" };
  assert.equal(prepareFiscalV1CreditNote({ draft: remaining, originalSnapshot: snapshot,
    originalDocument: document, priorCredits, ...publication }).totalCents, 590);
  for (const reasonCode of ["01", "06"]) {
    assert.throws(() => prepareFiscalV1CreditNote({ draft: { ...remaining, reasonCode },
      originalSnapshot: snapshot, originalDocument: document, priorCredits,
      ...publication }), /FISCAL_V1_CREDIT_NOTE_TOTAL_SCOPE_REQUIRED/);
  }
  assert.throws(() => prepareFiscalV1CreditNote({ draft: { ...remaining,
    lines: [{ originalLineId: "line-1", creditQuantityMilli: 501, creditCents: 591 }] },
    originalSnapshot: snapshot, originalDocument: document, priorCredits,
    ...publication }), /FISCAL_V1_CREDIT_NOTE_EXCEEDS_REMAINING/);
});

test("nota V1 no recalcula un snapshot histórico alterado", () => {
  const { publication, snapshot, document, draft } = fixture("SUPPORTED",
    { noteReasonCodes: ["07"] });
  const alteredSnapshot = { ...snapshot,
    lineDescriptions: [{ lineId: "line-1", description: "OTRO PRODUCTO" }] };
  assert.throws(() => prepareFiscalV1CreditNote({ draft, originalSnapshot: alteredSnapshot,
    originalDocument: document, priorCredits: [], ...publication }),
  /FISCAL_V1_SNAPSHOT_HASH_INVALID/);
  const rehashedSnapshot = { ...alteredSnapshot,
    snapshotSha256: fiscalV1SnapshotFingerprint(alteredSnapshot) };
  assert.throws(() => prepareFiscalV1CreditNote({ draft,
    originalSnapshot: rehashedSnapshot, originalDocument: document,
    priorCredits: [], ...publication }),
  /FISCAL_V1_DOCUMENT_SNAPSHOT_MISMATCH/);
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
