import type { FiscalV1Environment } from "./modulo-fiscal-v1.contract";

export const FISCAL_AMAZONIA_XML_LEGEND = "BIENES TRANSFERIDOS EN LA AMAZONÍA PARA SER CONSUMIDOS EN LA MISMA";

/** Localidades que el piloto puede presentar al operador. La cobertura se decide en el servidor. */
export const FISCAL_AMAZONIA_DEMO_DISTRICTS = [
  { ubigeo: "120601", name: "Satipo", department: "Jun\u00edn" },
  { ubigeo: "150101", name: "Lima", department: "Lima" },
] as const;
export type FiscalAmazoniaDemoUbigeo = typeof FISCAL_AMAZONIA_DEMO_DISTRICTS[number]["ubigeo"];

/** Cobertura inicial revisada: provincia Satipo. No representa toda la Amazonía peruana. */
export const FISCAL_AMAZONIA_SUPPORTED_DISTRICTS = [
  { ubigeo: "120601", name: "Satipo", department: "Junín" },
  { ubigeo: "120602", name: "Coviriali", department: "Junín" },
  { ubigeo: "120603", name: "Llaylla", department: "Junín" },
  { ubigeo: "120604", name: "Mazamari", department: "Junín" },
  { ubigeo: "120605", name: "Pampa Hermosa", department: "Junín" },
  { ubigeo: "120606", name: "Pangoa", department: "Junín" },
  { ubigeo: "120607", name: "Río Negro", department: "Junín" },
  { ubigeo: "120608", name: "Río Tambo", department: "Junín" },
  { ubigeo: "120609", name: "Vizcatán del Ene", department: "Junín" },
] as const;

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
    { readonly status: "OUTSIDE" | "PARTIAL_OUTSIDE" | "SPLIT"; readonly evidenceRef: string };
}

export type FiscalAmazoniaSaleDecision =
  | { readonly kind: "ORDINARY"; readonly reason: "DISABLED" | "OUTSIDE" }
  | { readonly kind: "REVIEW"; readonly reason: "APPROVAL_UNAVAILABLE" | "APPROVAL_OUTSIDE_VALIDITY" |
      "SCOPE_MISMATCH" | "FACTS_PENDING" | "TERRITORY_UNKNOWN" | "SPLIT_DESTINATIONS" |
      "PRODUCT_SCOPE_UNSUPPORTED" }
  | { readonly kind: "EXEMPT"; readonly basis: "LEY_27037_ART_13_1_A";
      readonly approvalId: string; readonly territoryVersion: string };

/** Fundamento elegido por el backend para la línea y su clasificación ordinaria congelada. */
export interface FiscalAmazoniaLineDecision {
  readonly lineId: string;
  readonly basis: "LEY_27037_ART_13_1_A" | "APPENDIX_I" | "ORDINARY_EXEMPTION" | "ORDINARY_UNAFFECTED";
  readonly ordinaryCategory: "GRAVADA" | "EXONERADA" | "INAFECTA";
  readonly ordinaryTaxRateBasisPoints: number;
}

export interface FiscalAmazoniaPreparedSale {
  readonly facts: FiscalAmazoniaSaleFacts;
  readonly decision: Extract<FiscalAmazoniaSaleDecision, { kind: "EXEMPT" | "ORDINARY" }>;
  /** Ausente en los snapshots del piloto original; no se agrega al revalidarlos. */
  readonly lineDecisions?: readonly FiscalAmazoniaLineDecision[];
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
    (value.status === "OUTSIDE" || value.status === "PARTIAL_OUTSIDE" || value.status === "SPLIT") &&
    hasFields(value, ["status", "evidenceRef"]) && isEvidenceRef(value.evidenceRef));
}

/** Comprueba la forma. El backend acredita vigencia, lugar y pertenencia. */
export function assertFiscalAmazoniaSaleFacts(value: unknown): asserts value is FiscalAmazoniaSaleFacts {
  if (!isRecord(value) || !hasFields(value, ["transfer", "consumption"]) ||
      !isLocationFact(value.transfer) || !isConsumptionFact(value.consumption))
    throw new Error("FISCAL_AMAZONIA_FACTS_INVALID");
}

/** Validación del contrato recibido; la elección de fundamento pertenece al backend. */
export function assertFiscalAmazoniaLineDecisions(value: unknown): asserts value is readonly FiscalAmazoniaLineDecision[] {
  const ids = new Set<string>();
  if (!Array.isArray(value) || !value.length || value.some(row => {
    if (!isRecord(row) || !hasFields(row, ["lineId", "basis", "ordinaryCategory", "ordinaryTaxRateBasisPoints"]) ||
        !isEvidenceRef(row.lineId) || ids.has(row.lineId) || !Number.isSafeInteger(row.ordinaryTaxRateBasisPoints)) return true;
    ids.add(row.lineId);
    if (row.ordinaryCategory === "GRAVADA") return row.basis !== "LEY_27037_ART_13_1_A" ||
      Number(row.ordinaryTaxRateBasisPoints) <= 0 || Number(row.ordinaryTaxRateBasisPoints) > 10000;
    if (row.ordinaryTaxRateBasisPoints !== 0) return true;
    return row.ordinaryCategory === "EXONERADA"
      ? row.basis !== "APPENDIX_I" && row.basis !== "ORDINARY_EXEMPTION"
      : row.ordinaryCategory !== "INAFECTA" || row.basis !== "ORDINARY_UNAFFECTED";
  })) throw new Error("FISCAL_AMAZONIA_LINE_DECISIONS_INVALID");
}
