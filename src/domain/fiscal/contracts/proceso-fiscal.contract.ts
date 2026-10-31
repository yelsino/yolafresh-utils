import type { FiscalDocumentIdentity } from "./cpe.contract";
import { validateFiscalSignedDocument } from "./comprobante-electronico.contract";
import type { FiscalArtifactReference, FiscalSignedDocument } from "./comprobante-electronico.contract";
import { assertFiscalV1ProviderChannelReceipt, type FiscalV1ProviderChannelReceipt } from "./modulo-fiscal-v1-proveedor.contract";

export const FISCAL_PROCESS_TYPE = "proceso_fiscal" as const;

export type FiscalOperation = "EMISION" | "BAJA";
export type FiscalTerminalState = "ACEPTADO" | "ACEPTADO_CON_OBSERVACION" | "RECHAZADO";
export type FiscalProcessState =
  | "PENDIENTE_ENVIO"
  | "ENVIANDO"
  | "RESULTADO_DESCONOCIDO"
  | "REPORTADO_PROVEEDOR"
  | FiscalTerminalState
  | "ACCION_MANUAL";

/** Reporte del proveedor: no sustituye la constancia de respuesta tributaria. */
export interface FiscalProviderReport {
  readonly source: "PROVEEDOR";
  readonly reportedAt: string;
  readonly reportedStatus: string;
  readonly description: string;
}

/** Resultado por CPE extraído de una CDR; su encabezado puede identificar un lote. */
export interface FiscalAuthorityResult {
  readonly source: "CDR";
  readonly receivedAt: string;
  readonly operation: FiscalOperation;
  /** Identidad del CPE afectado, no la identidad del resumen o comunicación. */
  readonly targetIdentity: FiscalDocumentIdentity;
  readonly status: FiscalTerminalState;
  readonly responseCode: string;
  readonly description: string;
  readonly observations: readonly string[];
  readonly cdr: FiscalArtifactReference;
  readonly providerReceipt?: FiscalV1ProviderChannelReceipt;
}

/** A resolved rejection without a CDR, obtained from the authenticated PSE.
 * The archived JSON is explicitly an API result, never a fabricated CDR. */
export type FiscalAuthenticatedProviderResult = Omit<FiscalAuthorityResult, "source" | "status" | "cdr" | "providerReceipt"> & {
  readonly source: "PROVEEDOR_AUTENTICADO";
  readonly status: "RECHAZADO";
  readonly artifact: FiscalArtifactReference;
  readonly providerReceipt: FiscalV1ProviderChannelReceipt;
};

/** Documento operativo separado del comprobante: admite varios procesos sobre el mismo CPE. */
export interface FiscalProcess {
  readonly type: typeof FISCAL_PROCESS_TYPE;
  readonly processId: string;
  readonly tenantId: string;
  readonly documentId: string;
  readonly operation: FiscalOperation;
  readonly state: FiscalProcessState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly attemptCount: number;
  readonly lastAttemptAt: string | null;
  readonly nextAttemptAt: string | null;
  /** Id del lote/resumen, si la modalidad transmite varios documentos juntos. */
  readonly batchRef: string | null;
  /** Proveedor e ID de solicitud sobreviven a timeouts sin respuesta. */
  readonly provider: string | null;
  readonly providerRequestId: string | null;
  /** XML firmado de la comunicación de baja; la emisión usa el XML del documento. */
  readonly operationXml: FiscalArtifactReference | null;
  /** SHA-256 de los bytes del XML firmado crudo enviado, nunca del ZIP archivado. */
  readonly submittedXmlSha256: string | null;
  readonly result: FiscalProviderReport | FiscalAuthorityResult | FiscalAuthenticatedProviderResult | null;
}

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonBlank = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const timestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  Number.isFinite(Date.parse(value));
const hash = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f\d]{64}$/i.test(value);
function rejectUnknown(value: Record<string, unknown>, fields: readonly string[],
  prefix: string, errors: string[]): void {
  for (const key of Object.keys(value))
    if (!fields.includes(key)) errors.push(`${prefix}unknown.${key}`);
}

export function validateFiscalProcess(value: unknown): readonly string[] {
  if (!record(value)) return ["process"];
  const errors: string[] = [];
  rejectUnknown(value, ["_id", "_rev", "type", "processId", "tenantId", "documentId",
    "operation", "state", "createdAt", "updatedAt", "attemptCount", "lastAttemptAt",
    "nextAttemptAt", "batchRef", "provider", "providerRequestId", "operationXml",
    "submittedXmlSha256", "result"], "", errors);
  if (value.type !== FISCAL_PROCESS_TYPE) errors.push("type");
  for (const key of ["processId", "tenantId", "documentId"] as const)
    if (!nonBlank(value[key])) errors.push(key);
  if (value.operation !== "EMISION" && value.operation !== "BAJA") errors.push("operation");
  const states: FiscalProcessState[] = ["PENDIENTE_ENVIO", "ENVIANDO", "RESULTADO_DESCONOCIDO",
    "REPORTADO_PROVEEDOR", "ACEPTADO", "ACEPTADO_CON_OBSERVACION", "RECHAZADO", "ACCION_MANUAL"];
  if (!states.includes(value.state as FiscalProcessState)) errors.push("state");
  for (const key of ["createdAt", "updatedAt"] as const)
    if (!timestamp(value[key])) errors.push(key);
  if (timestamp(value.createdAt) && timestamp(value.updatedAt) &&
    Date.parse(value.updatedAt) < Date.parse(value.createdAt)) errors.push("updatedAt.beforeCreatedAt");
  if (!Number.isSafeInteger(value.attemptCount) || Number(value.attemptCount) < 0)
    errors.push("attemptCount");
  for (const key of ["lastAttemptAt", "nextAttemptAt"] as const)
    if (value[key] !== null && !timestamp(value[key])) errors.push(key);
  if (value.batchRef !== null && !nonBlank(value.batchRef)) errors.push("batchRef");
  if (value.provider !== null && !nonBlank(value.provider)) errors.push("provider");
  if (value.providerRequestId !== null && !nonBlank(value.providerRequestId))
    errors.push("providerRequestId");
  if (value.operation === "BAJA") {
    if (!record(value.operationXml) || !nonBlank(value.operationXml.storageRef) ||
      !hash(value.operationXml.sha256)) errors.push("operationXml");
    else rejectUnknown(value.operationXml, ["storageRef", "sha256"], "operationXml.", errors);
  } else if (value.operationXml !== null) errors.push("operationXml");
  if (Number(value.attemptCount) === 0 && value.lastAttemptAt !== null) errors.push("lastAttemptAt");
  if (Number(value.attemptCount) > 0 && !timestamp(value.lastAttemptAt)) errors.push("lastAttemptAt");
  if (Number(value.attemptCount) === 0 && value.providerRequestId !== null)
    errors.push("providerRequestId.beforeAttempt");
  if (Number(value.attemptCount) === 0 && value.submittedXmlSha256 !== null)
    errors.push("submittedXmlSha256.beforeAttempt");
  if (Number(value.attemptCount) > 0 && !hash(value.submittedXmlSha256))
    errors.push("submittedXmlSha256.required");
  if (["ENVIANDO", "RESULTADO_DESCONOCIDO", "REPORTADO_PROVEEDOR",
    "ACEPTADO", "ACEPTADO_CON_OBSERVACION", "RECHAZADO"].includes(String(value.state)) &&
    Number(value.attemptCount) === 0) errors.push("attemptCount.stateMismatch");
  if (Number(value.attemptCount) > 0 && !nonBlank(value.provider)) errors.push("provider.required");
  if (value.result !== null && !record(value.result)) errors.push("result");
  else if (record(value.result)) {
    const result = value.result;
    if (result.source === "PROVEEDOR") {
      rejectUnknown(result, ["source", "reportedAt", "reportedStatus", "description"],
        "result.", errors);
      if (value.state !== "REPORTADO_PROVEEDOR" && value.state !== "ACCION_MANUAL")
        errors.push("result.stateMismatch");
      if (!timestamp(result.reportedAt)) errors.push("result.reportedAt");
      for (const key of ["reportedStatus", "description"] as const)
        if (!nonBlank(result[key])) errors.push(`result.${key}`);
      if (!nonBlank(value.provider) || !nonBlank(value.providerRequestId))
        errors.push("result.providerRequest");
    } else if (result.source === "CDR" || result.source === "PROVEEDOR_AUTENTICADO") {
      const providerResult = result.source === "PROVEEDOR_AUTENTICADO";
      rejectUnknown(result, ["source", "receivedAt", "operation", "targetIdentity", "status", "responseCode",
        "description", "observations", "providerReceipt", providerResult ? "artifact" : "cdr"], "result.", errors);
      if (providerResult && (result.status !== "RECHAZADO" || result.responseCode === "0" || result.providerReceipt === undefined))
        errors.push("result.providerRejectionRequired");
      if (result.operation !== value.operation) errors.push("result.operation");
      if (!["ACEPTADO", "ACEPTADO_CON_OBSERVACION", "RECHAZADO"].includes(String(result.status)) ||
        value.state !== result.status) errors.push("result.status");
      if (!timestamp(result.receivedAt)) errors.push("result.receivedAt");
      if (!record(result.targetIdentity) || !/^\d{11}$/.test(String(result.targetIdentity.issuerRuc)) ||
        !nonBlank(result.targetIdentity.series) ||
        !Number.isSafeInteger(result.targetIdentity.number) || Number(result.targetIdentity.number) < 1 ||
        !["BOLETA", "FACTURA", "NOTA_CREDITO", "NOTA_DEBITO"].includes(String(result.targetIdentity.documentType)))
        errors.push("result.targetIdentity");
      else rejectUnknown(result.targetIdentity, ["issuerRuc", "documentType", "series", "number"],
        "result.targetIdentity.", errors);
      if (!nonBlank(result.responseCode)) errors.push("result.responseCode");
      if (!nonBlank(result.description)) errors.push("result.description");
      if (!Array.isArray(result.observations) ||
        !result.observations.every((item: unknown) => typeof item === "string"))
        errors.push("result.observations");
      const artifact = providerResult ? result.artifact : result.cdr;
      const artifactField = providerResult ? "artifact" : "cdr";
      if (!record(artifact) || !nonBlank(artifact.storageRef) || !hash(artifact.sha256)) errors.push(`result.${artifactField}`);
      else rejectUnknown(artifact, ["storageRef", "sha256"], `result.${artifactField}.`, errors);
      if (result.providerReceipt !== undefined) {
        try {
          const receipt = result.providerReceipt as FiscalV1ProviderChannelReceipt;
          const target = result.targetIdentity as unknown as FiscalDocumentIdentity;
          assertFiscalV1ProviderChannelReceipt(receipt, { tenantId: String(value.tenantId), issuerRuc: target.issuerRuc,
            environment: receipt.environment, externalId: String(value.providerRequestId),
            documentType: target.documentType === "BOLETA" ? "03" : target.documentType === "FACTURA" ? "01" : "07",
            series: target.series, number: target.number, artifactKind: providerResult ? "PROVIDER_RESULT" : "CDR",
            artifactSha256: String((artifact as Record<string, unknown>)?.sha256) }, Date.parse(String(value.createdAt)));
          if (Date.parse(String(result.receivedAt)) < receipt.receivedAtMs) errors.push("result.providerReceipt.receivedAt");
        } catch { errors.push("result.providerReceipt"); }
      }
    } else errors.push("result.source");
  }
  if (value.result === null && ["REPORTADO_PROVEEDOR", "ACEPTADO",
    "ACEPTADO_CON_OBSERVACION", "RECHAZADO"].includes(String(value.state)))
    errors.push("result.required");
  return errors;
}

/** Nunca inferir el vínculo desde _id; cotejar las claves contractuales. */
export function validateFiscalProcessDocumentLink(
  process: FiscalProcess,
  document: FiscalSignedDocument,
): readonly string[] {
  const errors = [...validateFiscalProcess(process)];
  if (errors.length) return errors;
  errors.push(...validateFiscalSignedDocument(document).map((error) => `document.${error}`));
  if (errors.length) return errors;
  if (process.tenantId !== document.tenantId) errors.push("tenantId");
  if (process.documentId !== document.documentId) errors.push("documentId");
  if (process.attemptCount > 0 && process.submittedXmlSha256 !==
      (process.operation === "EMISION" ? document.signature.signedXml.sha256 :
        process.operationXml?.sha256)) errors.push("submittedXmlSha256.documentMismatch");
  if (process.result?.source === "CDR" || process.result?.source === "PROVEEDOR_AUTENTICADO") {
    const actual = process.result.targetIdentity;
    const expected = document.identity;
    if (actual.issuerRuc !== expected.issuerRuc ||
        actual.documentType !== expected.documentType ||
        actual.series !== expected.series || actual.number !== expected.number)
      errors.push("result.targetIdentityMismatch");
    if (process.result.providerReceipt && process.result.providerReceipt.environment !==
      (document.environment === "PRODUCCION" ? "PRODUCTION" : "DEMO")) errors.push("result.providerReceipt.environmentMismatch");
  }
  return errors;
}

/** Un estado incierto exige consulta/conciliación, nunca reenvío ciego. */
export function canAutomaticallyTransmitFiscalProcess(
  process: FiscalProcess,
  document: FiscalSignedDocument,
  now: string,
): boolean {
  return validateFiscalProcessDocumentLink(process, document).length === 0 &&
    timestamp(now) && process.state === "PENDIENTE_ENVIO" && process.attemptCount === 0 &&
    (process.nextAttemptAt === null || Date.parse(process.nextAttemptAt) <= Date.parse(now));
}
