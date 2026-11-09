import type { FiscalV1Environment } from "./modulo-fiscal-v1.contract";

export const FISCAL_AMAZONIA_XML_LEGEND = "BIENES TRANSFERIDOS EN LA AMAZONÍA PARA SER CONSUMIDOS EN LA MISMA";

/** Localidades que el piloto puede presentar al operador. La cobertura se decide en el servidor. */
export const FISCAL_AMAZONIA_DEMO_DISTRICTS = [
  { ubigeo: "120601", name: "Satipo", department: "Jun\u00edn" },
  { ubigeo: "150101", name: "Lima", department: "Lima" },
] as const;
export type FiscalAmazoniaDemoUbigeo = typeof FISCAL_AMAZONIA_DEMO_DISTRICTS[number]["ubigeo"];

export interface FiscalAmazoniaScope {
  readonly tenantId: string;
  readonly issuerRuc: string;
  readonly environment: FiscalV1Environment;
}

/** Datos de la operación que el emisor puede sustentar. */
export type FiscalAmazoniaLocationFact =
  | { readonly status: "PENDING" }
  | { readonly status: "CONFIRMED"; readonly ubigeo: string; readonly evidenceRef: string };

export interface FiscalAmazoniaSaleFacts {
  readonly transfer: FiscalAmazoniaLocationFact;
  readonly consumption: FiscalAmazoniaLocationFact |
    { readonly status: "PARTIAL_OUTSIDE" | "SPLIT"; readonly evidenceRef: string };
}

export type FiscalAmazoniaSaleDecision =
  | { readonly kind: "ORDINARY"; readonly reason: "DISABLED" | "OUTSIDE" }
  | { readonly kind: "REVIEW"; readonly reason: "APPROVAL_UNAVAILABLE" | "APPROVAL_OUTSIDE_VALIDITY" |
      "SCOPE_MISMATCH" | "FACTS_PENDING" | "TERRITORY_UNKNOWN" | "SPLIT_DESTINATIONS" |
      "PRODUCT_SCOPE_UNSUPPORTED" }
  | { readonly kind: "EXEMPT"; readonly basis: "LEY_27037_ART_13_1_A";
      readonly approvalId: string; readonly territoryVersion: string };

export interface FiscalAmazoniaPreparedSale {
  readonly facts: FiscalAmazoniaSaleFacts;
  readonly decision: Extract<FiscalAmazoniaSaleDecision, { kind: "EXEMPT" | "ORDINARY" }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return Object.keys(value).length === fields.length && fields.every(field =>
    Object.prototype.hasOwnProperty.call(value, field));
}

function isEvidenceRef(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256 &&
    value === value.trim() && !/[\x00-\x1f\x7f]/.test(value);
}

function isLocationFact(value: unknown): value is FiscalAmazoniaLocationFact {
  if (!isRecord(value)) return false;
  if (value.status === "PENDING") return hasFields(value, ["status"]);
  return value.status === "CONFIRMED" && hasFields(value, ["status", "ubigeo", "evidenceRef"]) &&
    typeof value.ubigeo === "string" && /^\d{6}$/.test(value.ubigeo) &&
    value.ubigeo !== "000000" && isEvidenceRef(value.evidenceRef);
}

function isConsumptionFact(value: unknown): value is FiscalAmazoniaSaleFacts["consumption"] {
  return isLocationFact(value) || (isRecord(value) &&
    (value.status === "PARTIAL_OUTSIDE" || value.status === "SPLIT") &&
    hasFields(value, ["status", "evidenceRef"]) && isEvidenceRef(value.evidenceRef));
}

/** Comprueba la forma. El backend acredita vigencia, lugar y pertenencia. */
export function assertFiscalAmazoniaSaleFacts(value: unknown): asserts value is FiscalAmazoniaSaleFacts {
  if (!isRecord(value) || !hasFields(value, ["transfer", "consumption"]) ||
      !isLocationFact(value.transfer) || !isConsumptionFact(value.consumption))
    throw new Error("FISCAL_AMAZONIA_FACTS_INVALID");
}
