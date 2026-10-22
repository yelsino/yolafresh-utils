import type { FiscalV1Environment } from "./modulo-fiscal-v1.contract";

/** Verified CDR metadata. The XML/signature must be verified by the trusted adapter.
 * Optional details preserve historical records that only kept the binary outcome.
 * New CDR writes must include all three details; a missing list does not mean no observations. */
export interface FiscalV1TributaryResult {
  readonly storageRef: string;
  readonly sha256: string;
  readonly receivedAtMs: number;
  readonly outcome: "ACCEPTED" | "REJECTED";
  readonly responseCode?: string;
  readonly description?: string;
  readonly observations?: readonly string[];
}

export type FiscalV1TributaryStatus = "ACCEPTED" | "ACCEPTED_WITH_OBSERVATIONS" | "REJECTED";

/** Declaration of delivery/availability, never a CDR or proof of payment. */
export interface FiscalV1DocumentGrant {
  readonly recipientId: string;
  readonly grantedAtMs: number;
  readonly evidenceRef: string;
  readonly recordedBy: string;
}

/** Projection extracted only after the signed XML has passed identity, content and
 * certificate verification. It does not assert SUNAT acceptance or commercial commit. */
export interface FiscalV1PrintEvidence {
  readonly signedXmlSha256: string;
  readonly digestValue: string;
  readonly qrPayload: string;
  readonly digestOutsideQr: boolean;
  readonly signedAt: string;
  readonly legalLegend: string;
}

/** Frozen facts supplied by the verified sale/note and its ACK, never the live catalogue. */
export interface FiscalV1PrintEvidenceBinding {
  readonly environment: FiscalV1Environment;
  readonly identity: {
    readonly issuerRuc: string;
    readonly documentType: "01" | "03" | "07";
    readonly series: string;
    readonly number: number;
  };
  readonly issuedOn: string;
  readonly currency: "PEN";
  readonly totalCents: number;
  readonly taxCents: number;
  readonly buyer: { readonly documentType: "RUC" | "DNI"; readonly documentNumber: string };
  readonly signedXmlSha256: string;
}

