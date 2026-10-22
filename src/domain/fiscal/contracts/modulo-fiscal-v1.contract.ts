/** Contrato canónico del módulo nuevo. No reutiliza el snapshot del piloto. */
import type { FiscalTaxRegime } from "./cpe.contract";

export type FiscalV1Environment = "DEMO" | "PRODUCTION";
export type FiscalV1DocumentType = "BOLETA" | "FACTURA" | "NOTA_CREDITO";
export type FiscalV1LegalCategory = "GRAVADA" | "EXONERADA" | "INAFECTA";
export type FiscalV1CapabilityStatus = "SUPPORTED" | "UNVERIFIED" | "UNSUPPORTED";

export interface FiscalV1EffectivePublication {
  readonly status: "PUBLISHED" | "SUSPENDED";
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly publishedAt: number;
  /** Referencia revisable, no prueba por sí misma de vigencia jurídica. */
  readonly sourceRef: string;
  readonly fingerprintSha256: string;
}

/** V1 permite un único emisor legal por tenant y entorno. */
export interface FiscalV1IssuerProfile extends FiscalV1EffectivePublication {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly tenantId: string;
  readonly issuerId: string;
  readonly issuerRuc: string;
  readonly issuerLegalName: string;
  readonly taxRegime: FiscalTaxRegime;
  readonly environment: FiscalV1Environment;
  readonly establishmentId: string;
  readonly see: string;
  readonly provider: string;
  readonly adapterVersion: string;
}

/** Ningún selector es comodín: la operación debe declarar todos sus hechos. */
export interface FiscalV1OperationContext {
  readonly establishmentId: string;
  readonly operationKind: "DOMESTIC_RETAIL" | "DOMESTIC_WHOLESALE";
  readonly buyerUse: "FINAL_CONSUMER" | "BUSINESS";
}

export type FiscalV1TaxAssessment =
  | { readonly legalCategory: "GRAVADA"; readonly taxRateBasisPoints: number }
  | { readonly legalCategory: "EXONERADA"; readonly taxRateBasisPoints: 0 }
  | { readonly legalCategory: "INAFECTA"; readonly taxRateBasisPoints: 0 };

export type FiscalV1PresentationRule = FiscalV1EffectivePublication & FiscalV1TaxAssessment & {
  /** Identidad técnica opaca del documento de publicación; no contiene semántica. */
  readonly configurationDocumentId: string;
  readonly decisionId: string;
  readonly ruleId: string;
  readonly tenantId: string;
  readonly issuerId: string;
  readonly presentationId: string;
  readonly catalogSemanticFingerprintSha256: string;
  readonly unitCode: "NIU" | "KGM" | "LTR" | "ZZ";
  readonly context: FiscalV1OperationContext;
};

export interface FiscalV1CapabilityEvidence {
  readonly legalReviewRef: string;
  readonly providerXmlRef: string;
  readonly tributaryResultRef: string;
  /** NRUS+boleta exige una vía correctiva probada antes de habilitar producción. */
  readonly correctiveRouteRef?: string;
}

export interface FiscalV1Capability extends FiscalV1EffectivePublication {
  readonly capabilityId: string;
  readonly tenantId: string;
  readonly issuerId: string;
  readonly profileVersion: string;
  readonly taxRegime: FiscalTaxRegime;
  readonly environment: FiscalV1Environment;
  readonly documentType: FiscalV1DocumentType;
  readonly context: FiscalV1OperationContext;
  /** Conjunto exacto, sin herencia de la capacidad de otro carrito. */
  readonly legalCategories: readonly FiscalV1LegalCategory[];
  readonly see: string;
  readonly provider: string;
  readonly adapterVersion: string;
  readonly capabilityStatus: FiscalV1CapabilityStatus;
  /** Obligatorio y exacto solo para NOTA_CREDITO; no se heredan causales de otra capacidad. */
  readonly creditNoteReasonCodes?: readonly string[];
  readonly evidence?: FiscalV1CapabilityEvidence;
}

/** Precios finales acordados en céntimos; cantidad con tres decimales exactos. */
export interface FiscalV1SaleLineInput {
  readonly lineId: string;
  readonly presentationId: string;
  readonly catalogSemanticFingerprintSha256: string;
  readonly quantityMilli: number;
  readonly unitPriceCents: number;
  readonly discountCents: number;
}

export interface FiscalV1SaleInput {
  readonly operationId: string;
  readonly saleId: string;
  readonly tenantId: string;
  readonly issuerId: string;
  readonly issuerRuc: string;
  readonly environment: FiscalV1Environment;
  readonly currency: "PEN";
  readonly occurredOn: string;
  readonly documentType: Exclude<FiscalV1DocumentType, "NOTA_CREDITO">;
  /** Factura exige RUC y razón social del adquirente; boleta puede identificarlo también. */
  readonly buyer?: { readonly documentType: "RUC" | "DNI"; readonly documentNumber: string; readonly legalName: string };
  readonly context: FiscalV1OperationContext;
  readonly lines: readonly FiscalV1SaleLineInput[];
}

export type FiscalV1PublicationArtifact = FiscalV1IssuerProfile | FiscalV1PresentationRule | FiscalV1Capability;

/** Contexto y series autorizados; no contienen reservas ni correlativos. */
export interface FiscalV1CheckoutContext {
  readonly profileVersion: string;
  readonly documentType: "BOLETA" | "FACTURA";
  readonly series: string;
  readonly creditNoteSeries?: string;
  readonly context: FiscalV1OperationContext;
}

/** Publicación íntegra e inmutable, con revisión monotónica por emisor y entorno. */
export interface FiscalV1PublicationPayload {
  readonly schemaVersion: "fiscal-v1";
  readonly tenantId: string;
  readonly issuerId: string;
  readonly environment: FiscalV1Environment;
  readonly revision: number;
  readonly issuedAtMs: number;
  readonly expiresAtMs: number;
  readonly profiles: readonly FiscalV1IssuerProfile[];
  readonly rules: readonly FiscalV1PresentationRule[];
  readonly capabilities: readonly FiscalV1Capability[];
  /** Opcional para conservar los bytes/hashes de publicaciones anteriores. */
  readonly checkoutContexts?: readonly FiscalV1CheckoutContext[];
}

/** La firma Ed25519 cubre los bytes UTF-8 del JSON canónico de `payload`. */
export interface FiscalV1SignedPublicationBundle {
  readonly payload: FiscalV1PublicationPayload;
  readonly payloadSha256: string;
  readonly signature: {
    readonly algorithm: "Ed25519";
    readonly keyId: string;
    readonly signatureBase64: string;
  };
}

export const FISCAL_V1_PUBLICATION_DOCUMENT_TYPE = "fiscal_v1_signed_publication" as const;

/** Proyección pública de la raíz existente; nunca distribuye historia ni claves de confianza. */
export interface FiscalV1PublicationDocument {
  readonly _id: string;
  readonly _rev?: string;
  readonly type: typeof FISCAL_V1_PUBLICATION_DOCUMENT_TYPE;
  readonly tenantId: string;
  readonly environment: FiscalV1Environment;
  readonly bundle: FiscalV1SignedPublicationBundle;
  readonly publishedBy?: string;
  readonly publishedAtMs?: number;
}

/** Ancla confiable instalada fuera del bundle; nunca viene de CouchDB ni del request fiscal. */
export interface FiscalV1TrustedPublisherKey {
  readonly keyId: string;
  readonly publicKeyBase64: string;
  readonly tenantId: string;
  readonly environment: FiscalV1Environment;
  readonly validFromMs: number;
  readonly validToMs: number;
}

export type FiscalV1LineDisclosure =
  | { readonly kind: "NOT_ITEMIZED_BY_ISSUER"; readonly baseCents: null; readonly taxCents: null; readonly appliedRateBasisPoints: null }
  | { readonly kind: "ITEMIZED"; readonly baseCents: number; readonly taxCents: number; readonly appliedRateBasisPoints: number };

export interface FiscalV1PreparedLine {
  readonly lineId: string;
  readonly presentationId: string;
  readonly quantityMilli: number;
  readonly unitPriceCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly unitCode: FiscalV1PresentationRule["unitCode"];
  readonly legalCategory: FiscalV1LegalCategory;
  /** El código documental/UBL se define y verifica en el adaptador, nunca a partir de esta categoría. */
  readonly disclosure: FiscalV1LineDisclosure;
  readonly ruleRef: {
    readonly configurationDocumentId: string;
    readonly decisionId: string;
    readonly ruleId: string;
    readonly fingerprintSha256: string;
  };
}

/** Aún no asigna serie/número ni implica que XmlPeru haya firmado. */
export interface FiscalV1PreparedDecision {
  readonly operationId: string;
  readonly saleId: string;
  readonly tenantId: string;
  readonly issuerId: string;
  readonly issuerRuc: string;
  readonly taxRegime: FiscalTaxRegime;
  readonly environment: FiscalV1Environment;
  readonly currency: "PEN";
  readonly occurredOn: string;
  readonly documentType: FiscalV1DocumentType;
  readonly buyer?: FiscalV1SaleInput["buyer"];
  readonly context: FiscalV1OperationContext;
  readonly profileRef: { readonly profileId: string; readonly profileVersion: string; readonly fingerprintSha256: string };
  readonly capabilityRef: { readonly capabilityId: string; readonly fingerprintSha256: string };
  readonly lines: readonly FiscalV1PreparedLine[];
  readonly totalCents: number;
  /** null = no discriminado; 0 solo significa impuesto calculado y conocido igual a cero. */
  readonly baseCents: number | null;
  readonly taxCents: number | null;
}
