import type { FiscalV1Environment } from "./modulo-fiscal-v1.contract";

/** Comando online efímero. Sus secretos nunca son un documento ni una operación offline. */
export interface XmlPeruAffiliationRequest {
  readonly operationId: string;
  readonly expectedIssuerRuc: string;
  readonly environment: FiscalV1Environment;
  readonly managementToken?: string;
  readonly solUsername?: string;
  readonly solPassword?: string;
  readonly authorizeProcedures?: true;
}

export type XmlPeruSunatProcedureState = "not_started" | "pending" | "done" | "error" | null;
export type XmlPeruAffiliationState = "NOT_CONFIGURED" | "NOT_LINKED" | "DEMO_CONNECTED" |
  "PENDING" | "AFFILIATED" | "REQUIRES_REVIEW" | "UNKNOWN";

/** Hechos externos consultados explícitamente; no otorga autoridad para emitir. Sin secretos. */
export interface XmlPeruAffiliationResponse {
  readonly ok: true;
  readonly provider: "XmlPeru";
  readonly tenantId: string;
  readonly issuerRuc: string;
  readonly issuerLegalName: string;
  readonly environment: FiscalV1Environment;
  readonly checkedAtMs: number;
  readonly status: XmlPeruAffiliationState;
  readonly managementCredentialConfigured: boolean;
  readonly signingCredentialConfigured: boolean;
  readonly companyRegistered: boolean;
  readonly procedures: Readonly<{ pse: XmlPeruSunatProcedureState; ose: XmlPeruSunatProcedureState }>;
  readonly signing: "provider" | "own_certificate" | "external" | null;
  readonly destination: "sunat" | "own_ose" | "provider_ose" | null;
  readonly code?: string;
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
const text = (value: unknown, max: number): value is string => typeof value === "string" &&
  value.length > 0 && value.length <= max && value.trim() === value && !/[\x00-\x1f\x7f]/.test(value);
const environment = (value: unknown): value is FiscalV1Environment => value === "DEMO" || value === "PRODUCTION";
const procedure = (value: unknown): value is XmlPeruSunatProcedureState =>
  value === null || ["not_started", "pending", "done", "error"].includes(value as string);
function invalid(code: string): never { throw new Error(code); }

export function assertXmlPeruAffiliationRequest(value: unknown): asserts value is XmlPeruAffiliationRequest {
  const code = "XMLPERU_AFFILIATION_REQUEST_INVALID";
  if (!object(value) || Object.keys(value).some(key => !["operationId", "expectedIssuerRuc", "environment",
    "managementToken", "solUsername", "solPassword", "authorizeProcedures"].includes(key)) ||
    !text(value.operationId, 128) || typeof value.expectedIssuerRuc !== "string" ||
    !/^\d{11}$/.test(value.expectedIssuerRuc) || !environment(value.environment)) invalid(code);
  if (value.managementToken !== undefined && (!text(value.managementToken, 4096) || /\s/.test(value.managementToken))) invalid(code);
  if (value.environment === "DEMO") {
    if (Object.prototype.hasOwnProperty.call(value, "solUsername") ||
      Object.prototype.hasOwnProperty.call(value, "solPassword") ||
      Object.prototype.hasOwnProperty.call(value, "authorizeProcedures")) invalid("XMLPERU_DEMO_SOL_FORBIDDEN");
  } else {
    if (!text(value.solUsername, 100) || typeof value.solPassword !== "string" ||
      !value.solPassword.length || value.solPassword.length > 256 || /[\x00-\x1f\x7f]/.test(value.solPassword) ||
      value.authorizeProcedures !== true) invalid("XMLPERU_SUNAT_AUTHORIZATION_REQUIRED");
  }
}

export function assertXmlPeruAffiliationResponse(value: unknown): asserts value is XmlPeruAffiliationResponse {
  const code = "XMLPERU_AFFILIATION_RESPONSE_INVALID";
  if (!object(value) || Object.keys(value).some(key => !["ok", "provider", "tenantId", "issuerRuc", "issuerLegalName",
    "environment", "checkedAtMs", "status", "managementCredentialConfigured", "signingCredentialConfigured",
    "companyRegistered", "procedures", "signing", "destination", "code"].includes(key)) || value.ok !== true ||
    value.provider !== "XmlPeru" || !text(value.tenantId, 256) || typeof value.issuerRuc !== "string" ||
    !/^\d{11}$/.test(value.issuerRuc) || !text(value.issuerLegalName, 500) || !environment(value.environment) ||
    !Number.isSafeInteger(value.checkedAtMs) || (value.checkedAtMs as number) < 0 ||
    !["NOT_CONFIGURED", "NOT_LINKED", "DEMO_CONNECTED", "PENDING", "AFFILIATED", "REQUIRES_REVIEW", "UNKNOWN"].includes(value.status as string) ||
    ["managementCredentialConfigured", "signingCredentialConfigured", "companyRegistered"].some(key => typeof value[key] !== "boolean") ||
    !object(value.procedures) || Object.keys(value.procedures).length !== 2 ||
    !procedure(value.procedures.pse) || !procedure(value.procedures.ose) ||
    ![null, "provider", "own_certificate", "external"].includes(value.signing as null) ||
    ![null, "sunat", "own_ose", "provider_ose"].includes(value.destination as null) ||
    (value.code !== undefined && (typeof value.code !== "string" || !/^[A-Z][A-Z0-9_]{0,95}$/.test(value.code)))) invalid(code);
  if (value.status === "DEMO_CONNECTED" && (value.environment !== "DEMO" || !value.companyRegistered ||
    !value.managementCredentialConfigured || !value.signingCredentialConfigured)) invalid(code);
  if (value.status === "AFFILIATED" && (value.environment !== "PRODUCTION" || !value.companyRegistered ||
    !value.managementCredentialConfigured || !value.signingCredentialConfigured || !value.signing || !value.destination ||
    (value.signing === "provider" && value.procedures.pse !== "done") ||
    (value.destination === "provider_ose" && value.procedures.ose !== "done") ||
    [value.procedures.pse, value.procedures.ose].some(state => state !== null && state !== "done"))) invalid(code);
}
