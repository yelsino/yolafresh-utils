import type { FiscalV1Environment, FiscalV1PreparedDecision } from "./modulo-fiscal-v1.contract";

/** Congela lo aprobado por el motor antes de pedir firma. No es por sí mismo un CPE. */
export interface FiscalV1Snapshot {
  readonly schemaVersion: "fiscal-v1-snapshot";
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
  readonly lineDescriptions: readonly { readonly lineId: string; readonly description: string }[];
  readonly paymentTerms: { readonly kind: "CONTADO" } | {
    readonly kind: "CREDITO";
    readonly installments: readonly { readonly dueOn: string; readonly amountCents: number }[];
  };
  readonly series: string;
  readonly number: number;
  readonly createdAtMs: number;
  /** Huella del JSON canónico del snapshot sin este campo. */
  readonly snapshotSha256: string;
}

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
  readonly signedXml?: { readonly storageRef: string; readonly sha256: string };
  readonly tributaryResult?: { readonly storageRef: string; readonly sha256: string;
    readonly receivedAtMs: number; readonly outcome: "ACCEPTED" | "REJECTED" };
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
  readonly noteId: string;
  readonly operationId: string;
  readonly originalDocumentId: string;
  readonly originalSnapshotSha256: string;
  readonly state: "RESERVED" | "UNKNOWN" | "SIGNED" | "TRIBUTARY_ACCEPTED";
  readonly lines: readonly { readonly originalLineId: string; readonly creditedQuantityMilli: number;
    readonly creditedCents: number }[];
}

/** Preparación económica e histórica, no XML firmado ni ajuste automático de caja/stock. */
export interface FiscalV1PreparedCreditNote {
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
    readonly originalQuantityMilli: number;
    readonly originalUnitPriceCents: number;
    readonly originalDiscountCents: number;
    readonly originalLegalCategory: FiscalV1PreparedDecision["lines"][number]["legalCategory"];
    readonly originalRuleRef: FiscalV1PreparedDecision["lines"][number]["ruleRef"];
    readonly originalDisclosure: FiscalV1PreparedDecision["lines"][number]["disclosure"];
  }[];
  readonly totalCents: number;
}
