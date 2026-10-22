import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFiscalCompanyTaxRegimeDecision, assertFiscalCompanyTaxRegimeCommand,
  assertFiscalCompanyTaxRegimeDecisions, deriveFiscalV1IssuerProfileFromCompany,
  fiscalV1PublicationArtifactFingerprint, resolveFiscalCompanyTaxRegime,
  toCompanyFiscalEmissionEnvironment, toFiscalV1Environment } from "../contracts";
import type { ConfigEmpresa, FiscalCompanyTaxRegimeDecision } from "../../shared/kernel/empresa.contract";

const decision = (id: string, effectiveFrom: string, regimenTributario: FiscalCompanyTaxRegimeDecision["regimenTributario"],
  extra: Partial<FiscalCompanyTaxRegimeDecision> = {}): FiscalCompanyTaxRegimeDecision => ({
  decisionId: id, effectiveFrom, regimenTributario, recordedAtMs: 10, recordedBy: "actor-opaco", ...extra,
} as FiscalCompanyTaxRegimeDecision);

const calendar = [decision("declaracion-1", "2026-01-01", "NRUS"), decision("declaracion-2", "2026-10-01", "RER")];
const config = (decisions: readonly FiscalCompanyTaxRegimeDecision[] = calendar): Pick<ConfigEmpresa, "empresa" | "fiscal"> => ({
  empresa: { ruc: "10123456789", razonSocial: "EMPRESA SINTETICA" },
  fiscal: { moneda: "PEN", simboloMoneda: "S/", porcentajeIGV: 18, incluyeIGVEnPrecios: true,
    regimenTributario: "NRUS", regimenTributarioVigencias: decisions, entornoEmision: "DEMO", codigoEstablecimiento: "0001" },
});

test("la fecha de la operación selecciona el régimen y el fin se deriva del inicio siguiente", () => {
  assert.deepEqual(resolveFiscalCompanyTaxRegime(config(), "2026-09-30"), { status: "EFFECTIVE",
    regimenTributario: "NRUS", decisionId: "declaracion-1", effectiveFrom: "2026-01-01", effectiveTo: "2026-09-30" });
  assert.deepEqual(resolveFiscalCompanyTaxRegime(config(), "2026-10-01"), { status: "EFFECTIVE",
    regimenTributario: "RER", decisionId: "declaracion-2", effectiveFrom: "2026-10-01" });
  assert.deepEqual(resolveFiscalCompanyTaxRegime(config([...calendar].reverse()), "2026-10-01"),
    resolveFiscalCompanyTaxRegime(config(), "2026-10-01"));
});

test("una declaración antigua sin fecha no inventa vigencia; un calendario presente es la autoridad", () => {
  assert.deepEqual(resolveFiscalCompanyTaxRegime({ fiscal: { regimenTributario: "RER" } }, "2026-01-01"),
    { status: "DECLARED_UNDATED", regimenTributario: "RER" });
  assert.deepEqual(resolveFiscalCompanyTaxRegime(config([]), "2026-01-01"), { status: "MISSING" });
  assert.deepEqual(resolveFiscalCompanyTaxRegime(config(), "2025-12-31"),
    { status: "NOT_EFFECTIVE", firstEffectiveFrom: "2026-01-01" });
  assert.deepEqual(resolveFiscalCompanyTaxRegime(undefined, "2026-01-01"), { status: "MISSING" });
});

test("una transición futura no cambia el régimen de una operación anterior", () => {
  const next = appendFiscalCompanyTaxRegimeDecision(calendar, decision("futuro", "2027-01-01", "RMT"));
  assert.equal(resolveFiscalCompanyTaxRegime(config(next), "2026-10-22").status, "EFFECTIVE");
  assert.deepEqual(resolveFiscalCompanyTaxRegime(config(next), "2027-01-01"), { status: "EFFECTIVE",
    regimenTributario: "RMT", decisionId: "futuro", effectiveFrom: "2027-01-01" });
  assert.equal(calendar.length, 2);
});

test("corregir conserva el original y requiere referencia y motivo, con cadena sin forks", () => {
  const corrected = decision("correccion", "2026-01-01", "RER", { supersedesDecisionId: "declaracion-1", reason: "Error de declaración", recordedAtMs: 11 });
  const next = appendFiscalCompanyTaxRegimeDecision(calendar, corrected);
  assert.equal(next.length, 3);
  assert.equal(next[0].regimenTributario, "NRUS");
  assert.deepEqual(resolveFiscalCompanyTaxRegime(config(next), "2026-09-30"), { status: "EFFECTIVE",
    regimenTributario: "RER", decisionId: "correccion", effectiveFrom: "2026-01-01", effectiveTo: "2026-09-30" });
  assert.throws(() => appendFiscalCompanyTaxRegimeDecision(next,
    decision("fork", "2026-01-01", "RER", { supersedesDecisionId: "declaracion-1", reason: "Otra corrección" })), /CORRECTION_INVALID/);
  assert.throws(() => appendFiscalCompanyTaxRegimeDecision(calendar,
    decision("sin-motivo", "2026-01-01", "RER", { supersedesDecisionId: "declaracion-1" })), /REASON_REQUIRED/);
  assert.throws(() => appendFiscalCompanyTaxRegimeDecision(calendar,
    decision("sin-origen", "2026-01-01", "RER", { supersedesDecisionId: "ausente", reason: "Error" })), /CORRECTION_INVALID/);
  assert.throws(() => appendFiscalCompanyTaxRegimeDecision(calendar,
    decision("fecha-distinta", "2026-02-01", "RER", { supersedesDecisionId: "declaracion-1", reason: "Error" })), /CORRECTION_INVALID/);
});

test("el replay conserva la misma declaración y un operationId distinto no sobrescribe una fecha", () => {
  assert.deepEqual(appendFiscalCompanyTaxRegimeDecision(calendar, calendar[0]), calendar);
  assert.throws(() => appendFiscalCompanyTaxRegimeDecision(calendar, { ...calendar[0], regimenTributario: "RER" }), /OPERATION_CONFLICT/);
  assert.throws(() => appendFiscalCompanyTaxRegimeDecision(calendar, decision("otro", "2026-10-01", "RMT")), /EFFECTIVE_DATE_AMBIGUOUS/);
  assert.throws(() => assertFiscalCompanyTaxRegimeDecisions([calendar[0], calendar[0]]), /DECISION_DUPLICATED/);
});

test("calendario y comando no aceptan campos inventados, actor falso, fechas inexistentes ni correcciones incompletas", () => {
  const command = { companyDocumentId: "documento/empresa/opaco", expectedCompanyRevision: "revision-opaca", operationId: "operacion-opaca",
    regimenTributario: "RER", effectiveFrom: "2026-10-01" };
  assert.doesNotThrow(() => assertFiscalCompanyTaxRegimeCommand(command));
  for (const patch of [{ recordedBy: "admin" }, { recordedAtMs: 42 }, { regimenTributario: "RUS" },
    { effectiveFrom: "2026-02-30" }, { expectedCompanyRevision: "" }, { supersedesDecisionId: "origen" }])
    assert.throws(() => assertFiscalCompanyTaxRegimeCommand({ ...command, ...patch }), /FISCAL_COMPANY_REGIME_/);
  assert.throws(() => assertFiscalCompanyTaxRegimeDecisions([{ ...calendar[0], effectiveTo: "2026-09-30" }]), /DECISION_INVALID/);
  assert.throws(() => resolveFiscalCompanyTaxRegime(config(), "ayer"), /DATE_INVALID/);
});

test("el mapeo de entornos es explícito, bidireccional y sin destino por defecto", () => {
  assert.equal(toFiscalV1Environment("PRODUCCION"), "PRODUCTION");
  assert.equal(toFiscalV1Environment("DEMO"), "DEMO");
  assert.equal(toCompanyFiscalEmissionEnvironment("PRODUCTION"), "PRODUCCION");
  assert.equal(toCompanyFiscalEmissionEnvironment("DEMO"), "DEMO");
  for (const value of [undefined, null, "production", "PRODUCCION_SIMULADA", true, {}, ["DEMO"]]) {
    assert.equal(toFiscalV1Environment(value), null);
    assert.equal(toCompanyFiscalEmissionEnvironment(value), null);
  }
});

const profileInput = () => ({ company: config(), authority: { tenantId: "tenant-sintetico", issuerId: "emisor-opaco",
  issuerRuc: "10123456789", environment: "DEMO" as const, establishmentId: "establecimiento-opaco", establishmentCode: "0001" },
  publication: { profileId: "perfil-opaco", profileVersion: "version-1", status: "PUBLISHED" as const,
    effectiveFrom: "2026-10-01", publishedAt: 20, sourceRef: "fixture-no-autoriza-emision", see: "SEE_CONTRIBUYENTE", adapterVersion: "v1" } });

test("el perfil V1 se deriva de la empresa y el calendario; fija XmlPeru y calcula su huella", () => {
  const profile = deriveFiscalV1IssuerProfileFromCompany(profileInput());
  assert.equal(profile.taxRegime, "RER");
  assert.equal(profile.issuerLegalName, "EMPRESA SINTETICA");
  assert.equal(profile.provider, "XmlPeru");
  assert.equal(profile.establishmentId, "establecimiento-opaco");
  assert.equal(profile.fingerprintSha256, fiscalV1PublicationArtifactFingerprint(profile));
  assert.equal("id" in profile, false);
});

test("no se publica un régimen sin fecha ni un perfil que cruce de período o autoridad", () => {
  const input = profileInput();
  const undated = config();
  delete undated.fiscal.regimenTributarioVigencias;
  assert.throws(() => deriveFiscalV1IssuerProfileFromCompany({ ...input, company: undated }), /EFFECTIVE_REQUIRED/);
  for (const authority of [{ ...input.authority, issuerRuc: "10999999999" },
    { ...input.authority, environment: "PRODUCTION" as const }, { ...input.authority, establishmentCode: "0002" }])
    assert.throws(() => deriveFiscalV1IssuerProfileFromCompany({ ...input, authority }), /AUTHORITY_MISMATCH/);
  assert.throws(() => deriveFiscalV1IssuerProfileFromCompany({ ...input,
    publication: { ...input.publication, effectiveFrom: "2026-09-01" } }), /PUBLICATION_RANGE_MISMATCH/);
  assert.doesNotThrow(() => deriveFiscalV1IssuerProfileFromCompany({ ...input,
    publication: { ...input.publication, effectiveFrom: "2026-09-01", effectiveTo: "2026-09-30" } }));
});
