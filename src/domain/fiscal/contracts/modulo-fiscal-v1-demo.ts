import type { FiscalV1Snapshot } from "./modulo-fiscal-v1-evidencia.contract";
import { assertFiscalV1Snapshot } from "./modulo-fiscal-v1-evidencia";
import type { FiscalV1DemoDocumentRecord, FiscalV1DemoDocumentState,
  FiscalV1DemoProviderEvidence, FiscalV1DemoProviderReportedResult } from "./modulo-fiscal-v1-demo.contract";

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 1024): v is string => typeof v === "string" &&
  v.trim().length > 0 && v.length <= max && !/[\x00-\x1f\x7f]/.test(v);
const hash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const integer = (v: unknown, min = 0): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= min;
const exact = (v: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []) =>
  required.every(k => Object.prototype.hasOwnProperty.call(v, k)) &&
  Object.keys(v).every(k => required.includes(k) || optional.includes(k));
const artifact = (v: unknown): boolean => record(v) && exact(v, ["storageRef", "sha256"]) && text(v.storageRef) && hash(v.sha256);
const cdr = (v: unknown): boolean => record(v) && text(v.storageRef) && hash(v.sha256) &&
  (v.inspection === "MATCHED" && exact(v, ["storageRef", "sha256", "inspection"]) ||
    v.inspection === "UNAVAILABLE" && exact(v, ["storageRef", "sha256", "inspection", "diagnostic"]) && text(v.diagnostic, 500));

/** Solo valida hechos declarados. No comprueba firmas ni consulta al proveedor/SUNAT. */
export function validateFiscalV1DemoProviderReportedResult(value: unknown): readonly string[] {
  if (!record(value)) return ["demoResult"];
  const errors: string[] = [];
  if (!exact(value, ["environment", "acceptanceContext", "evidenceAssurance", "provider", "externalId", "receivedAtMs",
    "providerResolved", "providerReachedSunatReported", "description", "observations", "providerStateCode",
    "outcome", "responseCode", "providerHasCdr"], ["cdr"])) errors.push("shape");
  if (value.environment !== "DEMO" || value.acceptanceContext !== "DEMO_PROVIDER_REPORTED" ||
      value.evidenceAssurance !== "DEMO_CRYPTOGRAPHY_UNVERIFIED" || value.provider !== "XmlPeru") errors.push("assurance");
  if (!text(value.externalId, 256) || !integer(value.receivedAtMs) || value.providerResolved !== true ||
      value.providerReachedSunatReported !== true || !text(value.description, 4000) ||
      !Array.isArray(value.observations) || value.observations.some(v => !text(v, 4000))) errors.push("facts");
  if (typeof value.responseCode !== "string" || !/^(?:0|[1-9]\d{0,5})$/.test(value.responseCode)) errors.push("responseCode");
  if (value.providerStateCode === "05" || value.providerStateCode === "07") {
    if (value.responseCode !== "0" || value.providerHasCdr !== true || !cdr(value.cdr) ||
        value.outcome !== (value.providerStateCode === "05" ? "ACCEPTED" : "ACCEPTED_WITH_OBSERVATIONS") ||
        value.providerStateCode === "07" && (!Array.isArray(value.observations) || value.observations.length === 0))
      errors.push("outcome");
  } else if (value.providerStateCode === "09") {
    if (value.responseCode === "0" || value.outcome !== "REJECTED" || typeof value.providerHasCdr !== "boolean" ||
        (value.providerHasCdr ? !cdr(value.cdr) : value.cdr !== undefined)) errors.push("outcome");
  } else errors.push("providerStateCode");
  return errors;
}

export function assertFiscalV1DemoProviderReportedResult(value: unknown): asserts value is FiscalV1DemoProviderReportedResult {
  if (validateFiscalV1DemoProviderReportedResult(value).length) throw new Error("FISCAL_V1_DEMO_PROVIDER_RESULT_INVALID");
}

export function fiscalV1DemoDocumentState(result?: FiscalV1DemoProviderReportedResult): FiscalV1DemoDocumentState {
  if (result === undefined) return "DEMO_SUBMISSION_PENDING";
  assertFiscalV1DemoProviderReportedResult(result);
  return result.outcome === "ACCEPTED" ? "DEMO_PROVIDER_ACCEPTED" :
    result.outcome === "ACCEPTED_WITH_OBSERVATIONS" ? "DEMO_PROVIDER_ACCEPTED_WITH_OBSERVATIONS" : "DEMO_PROVIDER_REJECTED";
}

/** El snapshot vincula operación, publicación, caja e identidad. El adaptador conserva
 * la responsabilidad de cotejar los bytes y la capability DEMO_TEST_ONLY firmada. */
export function assertFiscalV1DemoProviderEvidence(value: unknown,
  snapshot: FiscalV1Snapshot): asserts value is FiscalV1DemoProviderEvidence {
  assertFiscalV1Snapshot(snapshot);
  if (!record(value) || !exact(value, ["schemaVersion", "environment", "acceptanceContext", "evidenceAssurance",
    "tenantId", "issuerId", "issuerRuc", "operationId", "saleId", "snapshotId", "snapshotSha256",
    "publicationPayloadSha256", "publicationRevision", "documentType", "series", "number", "externalId",
    "providerXml", "contentInspection"], ["cajaAssignment", "providerReportedResult"]) ||
      value.schemaVersion !== "fiscal-v1-demo-provider-evidence" || value.environment !== "DEMO" ||
      value.acceptanceContext !== "DEMO_PROVIDER_REPORTED" || value.evidenceAssurance !== "DEMO_CRYPTOGRAPHY_UNVERIFIED" ||
      value.contentInspection !== "MATCHED_FROZEN_SNAPSHOT" || !artifact(value.providerXml) || !text(value.externalId, 256))
    throw new Error("FISCAL_V1_DEMO_PROVIDER_EVIDENCE_INVALID");
  const d = snapshot.decision;
  const box = value.cajaAssignment;
  if (d.environment !== "DEMO" || d.documentType !== "BOLETA" || value.documentType !== "03" ||
      value.tenantId !== d.tenantId || value.issuerId !== d.issuerId || value.issuerRuc !== d.issuerRuc ||
      value.operationId !== d.operationId || value.saleId !== d.saleId || value.snapshotId !== snapshot.snapshotId ||
      value.snapshotSha256 !== snapshot.snapshotSha256 || value.publicationPayloadSha256 !== snapshot.publicationPayloadSha256 ||
      value.publicationRevision !== snapshot.publicationRevision || value.series !== snapshot.series || value.number !== snapshot.number ||
      (snapshot.cajaAssignment === undefined ? box !== undefined : !record(box) ||
        !exact(box, ["cajaId", "assignmentVersion"]) || box.cajaId !== snapshot.cajaAssignment.cajaId ||
        box.assignmentVersion !== snapshot.cajaAssignment.assignmentVersion))
    throw new Error("FISCAL_V1_DEMO_PROVIDER_EVIDENCE_BINDING_INVALID");
  if (value.providerReportedResult !== undefined) {
    assertFiscalV1DemoProviderReportedResult(value.providerReportedResult);
    if (value.providerReportedResult.externalId !== value.externalId || value.providerReportedResult.receivedAtMs < snapshot.createdAtMs)
      throw new Error("FISCAL_V1_DEMO_PROVIDER_RESULT_BINDING_INVALID");
  }
}

export function assertFiscalV1DemoDocumentRecord(value: unknown,
  snapshot: FiscalV1Snapshot): asserts value is FiscalV1DemoDocumentRecord {
  if (!record(value) || !text(value.documentId)) throw new Error("FISCAL_V1_DEMO_DOCUMENT_INVALID");
  const { documentId: _id, state, ...evidence } = value;
  assertFiscalV1DemoProviderEvidence(evidence, snapshot);
  if (state !== fiscalV1DemoDocumentState(evidence.providerReportedResult))
    throw new Error("FISCAL_V1_DEMO_DOCUMENT_STATE_INVALID");
}
