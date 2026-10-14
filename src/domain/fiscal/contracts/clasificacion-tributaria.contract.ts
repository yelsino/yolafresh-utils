import type { FiscalCatalogTaxCategory, FiscalOfficialLegalSource } from "./catalogo-tributario.contract";

/** Resultado de resolver una regla para una presentación y una fecha. No es un comprobante. */
export type FiscalTaxClassification = {
  tenantId: string;
  presentationId: string;
  taxableEventDate: string;
  profileState: "NOT_CONFIGURED" | "DRAFT" | "APPROVED" | "SUSPENDED";
  category: FiscalCatalogTaxCategory;
  affectationCode: "10" | "20" | "30" | null;
  rateBasisPoints: number | null;
  unitCode: string | null;
  evidenceReference: string | null;
  legalSource: FiscalOfficialLegalSource | null;
  issuerExemptionPosture: {
    posture: "NOT_RENOUNCED" | "RENOUNCED";
    evidenceReference: string;
    legalSource: FiscalOfficialLegalSource;
    sourceReviewedAt: string;
    effectiveFrom: string;
    effectiveTo: string | null;
  } | null;
  sourceReviewedAt: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  ruleVersion: 1 | 2 | null;
  reason: string | null;
};
