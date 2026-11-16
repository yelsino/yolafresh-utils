import type { FiscalV1Environment, FiscalV1PreparedDecision, FiscalV2CajaAssignment } from "./modulo-fiscal-v1.contract";
import type { FiscalV1DocumentGrant, FiscalV1TributaryResult } from "./modulo-fiscal-v1-resultados.contract";
import type { FiscalV1ProviderChannelReceipt } from "./modulo-fiscal-v1-proveedor.contract";
import type { FiscalAmazoniaLineDecision } from "./fiscal-amazonia-sale.contract";

/** Congela lo aprobado por el motor antes de pedir firma. No es por sí mismo un CPE. */
export interface FiscalV1Snapshot {
  readonly schemaVersion: "fiscal-v1-snapshot" | "fiscal-v1-snapshot-v2" | "fiscal-v1-snapshot-v3" | "fiscal-v1-snapshot-v4";
  readonly snapshotId: string;
  readonly decision: FiscalV1PreparedDecision;
  readonly decisionSha256: string;
  readonly publicationPayloadSha256: string;
  readonly publicationRevision: number;
  readonly issuerLegalName: string;
  readonly issuerEstablishment: {
    readonly establishmentId: string;
    readonly code: string;
    readonly ubigeo: string;
    readonly department: string;
    readonly province: string;
    readonly district: string;
    readonly address: string;
    readonly countryCode: "PE";
  };
  readonly buyerFiscalAddress?: string;
  /** Presente sólo para publicaciones con selección explícita por caja; cubierto por la huella. */
  readonly cajaAssignment?: FiscalV2CajaAssignment;
  /** Emisión posterior: referencia inmutable a la venta comercial ya registrada. */
  readonly commercialSource?: FiscalV1CommercialSource;
  readonly lineDescriptions: readonly { readonly lineId: string; readonly description: string }[];
  readonly paymentTerms: { readonly kind: "CONTADO" } | {
    readonly kind: "CREDITO";
    /** Required in snapshot-v2. The legacy snapshot is read-only recovery evidence;
     * do not reinterpret its installments as a newly verified remaining balance. */
    readonly netPendingCents?: number;
    readonly installments: readonly { readonly dueOn: string; readonly amountCents: number }[];
  };
  readonly series: string;
  readonly number: number;
  readonly createdAtMs: number;
  /** Huella del JSON canónico del snapshot sin este campo. */
  readonly snapshotSha256: string;
}

export interface FiscalV1RegisteredSaleSource {
  readonly kind: "REGISTERED_SALE";
  readonly snapshotId: string;
  readonly snapshotSha256: string;
}
/** Fiscal-only issuance for an already confirmed cash sale; never a new sale. */
export interface FiscalV1RegisteredCashSaleSource {
  readonly kind: "REGISTERED_CASH_SALE";
  readonly snapshotId: string;
  readonly snapshotSha256: string;
  readonly cashEvidenceSha256: string;
}

export interface FiscalV1RegisteredCashEvidence {
  readonly schemaVersion: 1;
  readonly tenantId: string;
  readonly saleId: string;
  readonly cajaId: string;
  readonly currency: "PEN";
  readonly netAmountCents: number;
  readonly movements: readonly Readonly<{ movementId: string; createdAtMs: number;
    type: "INGRESO" | "EGRESO"; subtype: "VENTA"; referenceType: "VENTA"; referenceId: string;
    cajaId: string; currency: "PEN"; method: "EFECTIVO"; state: "ACTIVO"; amountCents: number }>[];
}
export type FiscalV1CommercialSource = FiscalV1RegisteredSaleSource | FiscalV1RegisteredCashSaleSource;

export type FiscalV1PaymentTerms = FiscalV1Snapshot["paymentTerms"];

/** Firma, envío y aceptación son hechos diferentes; la venta no se deriva del estado de impresión. */
export type FiscalV1DocumentState = "UNKNOWN" | "SIGNED_SUBMISSION_PENDING" |
  "TRIBUTARY_ACCEPTED" | "TRIBUTARY_REJECTED";

export interface FiscalV1DocumentRecord {
  readonly documentId: string;
  readonly operationId: string;
  readonly tenantId: string;
  readonly issuerId: string;
  readonly issuerRuc: string;
  readonly environment: FiscalV1Environment;
  readonly snapshotId: string;
  readonly snapshotSha256: string;
  readonly state: FiscalV1DocumentState;
  readonly providerOperationRef?: string;
  readonly signedXml?: { readonly storageRef: string; readonly sha256: string;
    readonly providerReceipt?: FiscalV1ProviderChannelReceipt };
  readonly tributaryResult?: FiscalV1TributaryResult;
  readonly grant?: FiscalV1DocumentGrant;
}

/** Base histórica de una nota. Aún no implica soporte técnico ni reserva correlativo. */
export interface FiscalV1CreditNoteDraft {
  readonly noteOperationId: string;
  readonly noteId: string;
  readonly tenantId: string;
  readonly issuerId: string;
  readonly issuerRuc: string;
  readonly environment: FiscalV1Environment;
  readonly originalDocumentId: string;
  readonly originalSnapshotSha256: string;
  readonly reasonCode: string;
  readonly issuedOn: string;
  /** V1 solo admite corrección por cantidad, no ajuste monetario sin unidades. */
  readonly lines: readonly { readonly originalLineId: string; readonly creditQuantityMilli: number;
    readonly creditCents: number }[];
  readonly recipientId: string;
  /** Evidencia de que la boleta original se otorgó a ese adquiriente. */
  readonly originalGrant?: { readonly recipientId: string; readonly grantedAtMs: number;
    readonly evidenceRef: string };
}

/** Toda reserva/firma/aceptación previa consume saldo; solo un rechazo inequívoco antes del efecto no lo hace. */
export interface FiscalV1PriorCreditNote {
  /** Ausente conserva el prorrateo por nota de la primera versión. */
  readonly quantityProration?: "CUMULATIVE";
  readonly noteId: string;
  readonly operationId: string;
  readonly originalDocumentId: string;
  readonly originalSnapshotSha256: string;
  readonly state: "RESERVED" | "UNKNOWN" | "SIGNED" | "TRIBUTARY_ACCEPTED" | "TRIBUTARY_REJECTED";
  /** Every note owns its response. A rejection after signing does not release its reservation. */
  readonly tributaryResult?: FiscalV1TributaryResult;
  readonly lines: readonly { readonly originalLineId: string; readonly creditedQuantityMilli: number;
    readonly creditedCents: number }[];
}

/** Preparación económica e histórica, no XML firmado ni ajuste automático de caja/stock. */
export interface FiscalV1PreparedCreditNote {
  /** Redondea el acumulado devuelto y resta lo ya consumido; ausencia = reserva histórica. */
  readonly quantityProration?: "CUMULATIVE";
  readonly providerEvidenceAssurance?: "PROVIDER_AUTHENTICATED_CHANNEL";
  readonly noteOperationId: string;
  readonly noteId: string;
  readonly originalDocumentId: string;
  readonly originalSnapshotSha256: string;
  readonly tenantId: string;
  readonly issuerId: string;
  readonly issuerRuc: string;
  readonly environment: FiscalV1Environment;
  readonly issuedOn: string;
  readonly reasonCode: string;
  readonly recipientId: string;
  readonly profileRef: FiscalV1PreparedDecision["profileRef"];
  readonly capabilityRef: FiscalV1PreparedDecision["capabilityRef"];
  readonly lines: readonly {
    readonly originalLineId: string;
    readonly creditQuantityMilli: number;
    readonly creditCents: number;
    /** Residuo de prorrateo acumulado respecto al precio unitario histórico; solo ±1 céntimo. */
    readonly roundingAdjustmentCents?: number;
    readonly originalQuantityMilli: number;
    readonly originalUnitPriceCents: number;
    readonly originalDiscountCents: number;
    readonly originalLegalCategory: FiscalV1PreparedDecision["lines"][number]["legalCategory"];
    readonly originalRuleRef: FiscalV1PreparedDecision["lines"][number]["ruleRef"];
    readonly originalDisclosure: FiscalV1PreparedDecision["lines"][number]["disclosure"];
    /** Fundamento congelado del original; nunca se recalcula con el beneficio vigente al devolver. */
    readonly originalAmazoniaLineDecision?: FiscalAmazoniaLineDecision;
  }[];
  readonly totalCents: number;
}
