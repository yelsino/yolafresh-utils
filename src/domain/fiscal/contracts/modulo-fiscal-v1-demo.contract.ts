import type { FiscalV2CajaAssignment } from "./modulo-fiscal-v1.contract";

/** Metadatos de bytes archivados. El hash preserva integridad; no demuestra autenticidad X509. */
export interface FiscalV1DemoArtifact {
  readonly storageRef: string;
  readonly sha256: string;
}

/** ACK de la misma operación durable; no acredita firma confiable ni aceptación SUNAT. */
export interface FiscalV1DemoAck {
  readonly state: "DEMO_SUBMISSION_PENDING";
  readonly environment: "DEMO";
  readonly acceptanceContext: "DEMO_PROVIDER_REPORTED";
  readonly evidenceAssurance: "DEMO_CRYPTOGRAPHY_UNVERIFIED";
  readonly operationId: string;
  readonly saleId: string;
  readonly saleSha256: string;
  readonly draftSha256: string;
  readonly snapshotId: string;
  readonly snapshotSha256: string;
  readonly documentType: "03";
  readonly series: string;
  readonly number: number;
  readonly externalId: string;
  readonly providerXmlSha256: string;
}

export interface FiscalV1DemoPrintEvidence {
  readonly kind: "FISCAL_V1_DEMO_PRINT";
  readonly environment: "DEMO";
  readonly legalLegend: "DEMO · SIN VALIDEZ TRIBUTARIA";
  readonly providerXmlSha256: string;
}

export type FiscalV1DemoCdrArtifact = FiscalV1DemoArtifact & (
  | { readonly inspection: "MATCHED" }
  | { readonly inspection: "UNAVAILABLE"; readonly diagnostic: string }
);

/** Resultado atribuido exclusivamente al proveedor en DEMO. Nunca es FiscalV1TributaryResult.
 * Un inspector confiable debe rechazar contradicciones del CDR parseable; UNAVAILABLE
 * conserva bytes no interpretables y su diagnóstico, sin afirmar que el CDR sea correcto. */
export type FiscalV1DemoProviderReportedResult = Readonly<{
  environment: "DEMO";
  acceptanceContext: "DEMO_PROVIDER_REPORTED";
  evidenceAssurance: "DEMO_CRYPTOGRAPHY_UNVERIFIED";
  provider: "XmlPeru";
  externalId: string;
  receivedAtMs: number;
  providerResolved: true;
  /** Afirmación recibida del proveedor, no una comprobación independiente ante SUNAT. */
  providerReachedSunatReported: true;
  description: string;
  observations: readonly string[];
}> & (
  | { readonly providerStateCode: "05"; readonly outcome: "ACCEPTED";
      readonly responseCode: "0"; readonly providerHasCdr: true; readonly cdr: FiscalV1DemoCdrArtifact }
  | { readonly providerStateCode: "07"; readonly outcome: "ACCEPTED_WITH_OBSERVATIONS";
      readonly responseCode: "0"; readonly providerHasCdr: true; readonly cdr: FiscalV1DemoCdrArtifact }
  | ({ readonly providerStateCode: "09"; readonly outcome: "REJECTED"; readonly responseCode: string } & (
      | { readonly providerHasCdr: true; readonly cdr: FiscalV1DemoCdrArtifact }
      | { readonly providerHasCdr: false; readonly cdr?: never }
    ))
);

/** Rama de evidencia del mismo journal/operación V1; no prescribe otra raíz Couch ni otra reserva.
 * El adaptador coteja XML y JSON contra el snapshot congelado antes de construirla.
 * No debe pasar por los consumidores que exigen firma o CDR criptográficamente verificados. */
export interface FiscalV1DemoProviderEvidence {
  readonly schemaVersion: "fiscal-v1-demo-provider-evidence";
  readonly environment: "DEMO";
  readonly acceptanceContext: "DEMO_PROVIDER_REPORTED";
  readonly evidenceAssurance: "DEMO_CRYPTOGRAPHY_UNVERIFIED";
  readonly tenantId: string;
  readonly issuerId: string;
  readonly issuerRuc: string;
  readonly operationId: string;
  readonly saleId: string;
  readonly snapshotId: string;
  readonly snapshotSha256: string;
  readonly publicationPayloadSha256: string;
  readonly publicationRevision: number;
  readonly cajaAssignment?: FiscalV2CajaAssignment;
  readonly documentType: "03";
  readonly series: string;
  readonly number: number;
  readonly externalId: string;
  readonly providerXml: FiscalV1DemoArtifact;
  readonly contentInspection: "MATCHED_FROZEN_SNAPSHOT";
  readonly providerReportedResult?: FiscalV1DemoProviderReportedResult;
  readonly tributaryResult?: never;
}

export type FiscalV1DemoDocumentState = "DEMO_SUBMISSION_PENDING" | "DEMO_PROVIDER_ACCEPTED" |
  "DEMO_PROVIDER_ACCEPTED_WITH_OBSERVATIONS" | "DEMO_PROVIDER_REJECTED";

/** Proyección para UI/impresión del registro existente; no es aceptación tributaria. */
export interface FiscalV1DemoDocumentRecord extends FiscalV1DemoProviderEvidence {
  readonly documentId: string;
  readonly state: FiscalV1DemoDocumentState;
}
