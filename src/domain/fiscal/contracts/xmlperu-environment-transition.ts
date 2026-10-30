import type { FiscalV1Environment } from "./modulo-fiscal-v1.contract";
import type { XmlPeruSunatProcedureState } from "./xmlperu-affiliation";

/** Metadata de la configuración canónica. documentId representa su _id opaco de CouchDB. */
export interface XmlPeruEnvironmentConfiguration {
  readonly documentId: string;
  readonly revision: string;
  readonly environment: FiscalV1Environment;
  readonly updatedAtMs: number;
}

interface XmlPeruEnvironmentScope {
  readonly ok: true;
  readonly provider: "XmlPeru";
  readonly tenantId: string;
  readonly issuerRuc: string;
  readonly issuerLegalName: string;
  readonly checkedAtMs: number;
}

/** Lectura online previa. No cambia entornos, no autoriza trámites SOL ni habilita emisión. */
export interface XmlPeruEnvironmentPreparation extends XmlPeruEnvironmentScope {
  readonly configuration: XmlPeruEnvironmentConfiguration;
  readonly providerEnvironment: FiscalV1Environment | null;
  readonly targetEnvironment: FiscalV1Environment;
  readonly canTransition: boolean;
  readonly credentialReuseReady: boolean;
  readonly procedures: Readonly<{ pse: XmlPeruSunatProcedureState; ose: XmlPeruSunatProcedureState }>;
  readonly pendingOperationId: string | null;
  readonly code?: string;
}

/** Comando online idempotente. La identidad del tenant/actor procede de la sesión autenticada. */
export interface XmlPeruEnvironmentTransitionRequest {
  readonly operationId: string;
  readonly expectedIssuerRuc: string;
  /** Revisión opaca obtenida del preflight del servidor; no se reconstruye desde fechas locales. */
  readonly expectedConfigurationRevision: string;
  readonly fromEnvironment: FiscalV1Environment;
  readonly toEnvironment: FiscalV1Environment;
}

export type XmlPeruEnvironmentTransitionState = "COMPLETED" | "PENDING" | "REJECTED";

/** Acuse o recuperación de la misma operación. No es autoridad para emitir un comprobante. */
export interface XmlPeruEnvironmentTransitionResponse extends XmlPeruEnvironmentScope {
  readonly operationId: string;
  /** Revisión original e inmutable del comando; permite recuperar el mismo POST desde otro dispositivo. */
  readonly expectedConfigurationRevision: string;
  readonly fromEnvironment: FiscalV1Environment;
  readonly toEnvironment: FiscalV1Environment;
  readonly status: XmlPeruEnvironmentTransitionState;
  readonly configuration: XmlPeruEnvironmentConfiguration;
  readonly providerEnvironment: FiscalV1Environment | null;
  readonly code?: string;
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === "string" &&
  value.length > 0 && value.length <= max && value.trim() === value && !/[\x00-\x1f\x7f]/.test(value);
const environment = (value: unknown): value is FiscalV1Environment => value === "DEMO" || value === "PRODUCTION";
const timestamp = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const ruc = (value: unknown): value is string => typeof value === "string" && /^\d{11}$/.test(value);
const procedure = (value: unknown): value is XmlPeruSunatProcedureState => value === null ||
  ["not_started", "pending", "done", "error"].includes(value as string);
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
function closed(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  return object(value) && required.every(key => own(value, key)) &&
    Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
function invalid(code: string): never { throw new Error(code); }
const diagnostic = (value: unknown) => value === undefined || typeof value === "string" &&
  /^XMLPERU_ENVIRONMENT_[A-Z0-9_]{1,96}$/.test(value);
const scopeKeys = ["ok", "provider", "tenantId", "issuerRuc", "issuerLegalName", "checkedAtMs"] as const;
function validScope(value: Record<string, unknown>): boolean {
  return value.ok === true && value.provider === "XmlPeru" && text(value.tenantId, 256) &&
    ruc(value.issuerRuc) && text(value.issuerLegalName, 500) && timestamp(value.checkedAtMs);
}
function validConfiguration(value: unknown): value is XmlPeruEnvironmentConfiguration {
  return closed(value, ["documentId", "revision", "environment", "updatedAtMs"]) &&
    text(value.documentId, 512) && text(value.revision, 512) &&
    environment(value.environment) && timestamp(value.updatedAtMs);
}

export function assertXmlPeruEnvironmentPreparation(value: unknown): asserts value is XmlPeruEnvironmentPreparation {
  const code = "XMLPERU_ENVIRONMENT_PREPARATION_INVALID";
  if (!closed(value, [...scopeKeys, "configuration", "providerEnvironment", "targetEnvironment",
    "canTransition", "credentialReuseReady", "procedures", "pendingOperationId"], ["code"]) ||
    !validScope(value) || !validConfiguration(value.configuration) ||
    !(value.providerEnvironment === null || environment(value.providerEnvironment)) ||
    !environment(value.targetEnvironment) || typeof value.canTransition !== "boolean" ||
    typeof value.credentialReuseReady !== "boolean" || !closed(value.procedures, ["pse", "ose"]) ||
    !procedure(value.procedures.pse) || !procedure(value.procedures.ose) ||
    !(value.pendingOperationId === null || text(value.pendingOperationId, 128)) || !diagnostic(value.code)) invalid(code);
  if (value.canTransition && (value.providerEnvironment !== value.configuration.environment ||
    value.targetEnvironment === value.configuration.environment || !value.credentialReuseReady ||
    value.pendingOperationId !== null || value.targetEnvironment === "PRODUCTION" && value.procedures.pse !== "done")) invalid(code);
}

export function assertXmlPeruEnvironmentTransitionRequest(value: unknown): asserts value is XmlPeruEnvironmentTransitionRequest {
  const code = "XMLPERU_ENVIRONMENT_REQUEST_INVALID";
  if (!closed(value, ["operationId", "expectedIssuerRuc", "expectedConfigurationRevision", "fromEnvironment", "toEnvironment"]) ||
    !text(value.operationId, 128) || !ruc(value.expectedIssuerRuc) || !text(value.expectedConfigurationRevision, 512) ||
    !environment(value.fromEnvironment) || !environment(value.toEnvironment) || value.fromEnvironment === value.toEnvironment) invalid(code);
}

export function assertXmlPeruEnvironmentTransitionResponse(value: unknown): asserts value is XmlPeruEnvironmentTransitionResponse {
  const code = "XMLPERU_ENVIRONMENT_RESPONSE_INVALID";
  if (!closed(value, [...scopeKeys, "operationId", "expectedConfigurationRevision", "fromEnvironment", "toEnvironment", "status", "configuration", "providerEnvironment"], ["code"]) ||
    !validScope(value) || !text(value.operationId, 128) || !text(value.expectedConfigurationRevision, 512) || !environment(value.fromEnvironment) ||
    !environment(value.toEnvironment) || value.fromEnvironment === value.toEnvironment ||
    !["COMPLETED", "PENDING", "REJECTED"].includes(value.status as string) ||
    !validConfiguration(value.configuration) || !(value.providerEnvironment === null || environment(value.providerEnvironment)) ||
    !diagnostic(value.code) || value.status !== "COMPLETED" && typeof value.code !== "string") invalid(code);
  if (value.status === "COMPLETED" && (value.configuration.environment !== value.toEnvironment ||
    value.providerEnvironment !== value.toEnvironment)) invalid(code);
}
