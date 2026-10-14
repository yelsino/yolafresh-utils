import type { FiscalTaxRegime } from "./cpe.contract";

/** Configuración tributaria: no contiene precios ni impuestos calculados de una venta. */
export type FiscalCatalogTaxCategory =
  | "GRAVADA"
  | "EXONERADA"
  | "INAFECTA"
  | "UNDETERMINED";

export type FiscalIssuerExemptionPosture =
  | "NOT_RENOUNCED"
  | "RENOUNCED"
  | "UNDETERMINED";

export interface FiscalOfficialLegalSource {
  /** URL HTTPS de SUNAT, MEF o El Peruano; una URL de proveedor no prueba la regla tributaria. */
  uri: string;
  title: string;
  provision: string;
}

export interface FiscalEffectiveRecord {
  /** Fechas civiles Lima, rango inclusivo. */
  effectiveFrom: string;
  effectiveTo?: string;
  legalSource: FiscalOfficialLegalSource;
  sourceReviewedAt: string;
  evidenceReference: string;
  configuredBy: string;
  configuredAt: number;
}

interface FiscalCatalogPresentationTaxRuleBase extends FiscalEffectiveRecord {
  /** Identidad contractual opaca de la presentación; no se interpreta su forma. */
  presentationId: string;
  /** Huella de las revisiones exactas presentación/producto leídas del tenant al configurar. */
  catalogFingerprintSha256?: string;
  /** Solo lectura de decisiones V2 históricas; el precio se decide en el contrato comercial. */
  priceIncludesTax?: boolean;
  unitCode: string;
}

type FiscalGoodOffer = {
  /** Ausente en decisiones V2 históricas; se leen como bien sin alterar su hash. */
  offerType?: "GOOD";
  tariffCode10: string;
  physicalState: string;
  compositionOrSpecies: string;
  serviceDescription?: never;
};

type FiscalServiceOffer = {
  offerType: "SERVICE";
  /** Naturaleza de la prestación sustentada por la fuente legal y la evidencia. */
  serviceDescription: string;
  tariffCode10?: never;
  physicalState?: never;
  compositionOrSpecies?: never;
};

/** Un bien pendiente conserva la pregunta sin inventar partida ni composición. */
type FiscalPendingGoodOffer = {
  offerType: "GOOD";
  tariffCode10?: string;
  physicalState?: string;
  compositionOrSpecies?: string;
  reviewQuestion: string;
  serviceDescription?: never;
};

type FiscalTaxRuleAssessment<ExemptionEligibility extends string> =
  | { category: "GRAVADA"; affectationCode: "10";
      taxRateBasisPoints: number; exemptionEligibility: "NOT_APPLICABLE" }
  | { category: "EXONERADA"; affectationCode: "20";
      taxRateBasisPoints: 0; exemptionEligibility: ExemptionEligibility }
  | { category: "INAFECTA"; affectationCode: "30";
      taxRateBasisPoints: 0; exemptionEligibility: "NOT_APPLICABLE" }
  | { category: "UNDETERMINED"; affectationCode: null;
      taxRateBasisPoints: null; exemptionEligibility: "UNDETERMINED" };

export type FiscalCatalogPresentationTaxRule =
  | (FiscalCatalogPresentationTaxRuleBase & FiscalGoodOffer &
      Exclude<FiscalTaxRuleAssessment<"APPENDIX_I_ELIGIBLE">,
        { category: "UNDETERMINED" }>)
  | (FiscalCatalogPresentationTaxRuleBase & FiscalPendingGoodOffer &
      Extract<FiscalTaxRuleAssessment<"APPENDIX_I_ELIGIBLE">,
        { category: "UNDETERMINED" }>)
  | (FiscalCatalogPresentationTaxRuleBase & FiscalServiceOffer &
      FiscalTaxRuleAssessment<"APPENDIX_II_ELIGIBLE">);

export type FiscalCatalogPresentationTaxRuleInput =
  FiscalCatalogPresentationTaxRule extends infer Rule
    ? Rule extends FiscalCatalogPresentationTaxRule
      ? Omit<Rule, "configuredBy" | "configuredAt" | "priceIncludesTax">
      : never
    : never;

export type FiscalIssuerExemptionPostureRecord =
  | (FiscalEffectiveRecord & {
      posture: "NOT_RENOUNCED";
      resultingAffectationCode: null;
      resultingTaxRateBasisPoints: null;
    })
  | (FiscalEffectiveRecord & {
      posture: "RENOUNCED";
      resultingAffectationCode: "10";
      resultingTaxRateBasisPoints: number;
    })
  | (FiscalEffectiveRecord & {
      posture: "UNDETERMINED";
      resultingAffectationCode: null;
      resultingTaxRateBasisPoints: null;
    });

export type FiscalIssuerExemptionPostureInput =
  FiscalIssuerExemptionPostureRecord extends infer Posture
    ? Posture extends FiscalIssuerExemptionPostureRecord
      ? Omit<Posture, "configuredBy" | "configuredAt">
      : never
    : never;

export interface FiscalCatalogDecisionSnapshot {
  schemaVersion: 2;
  tenantId: string;
  issuerRuc: string;
  issuerLegalName: string;
  taxRegime: FiscalTaxRegime;
  issuerFiscalAddressCode: string;
  rules: FiscalCatalogPresentationTaxRule[];
  issuerExemptionPostures: FiscalIssuerExemptionPostureRecord[];
}

export interface FiscalCatalogApprovedDecision {
  sequence: number;
  decision: FiscalCatalogDecisionSnapshot;
  decisionSha256: string;
  accountantApprovalReference: string;
  approvedBy: string;
  approvedAt: number;
  /**
   * Encadena también quién/cuándo/referencia y la enmienda que originó la aprobación.
   * Es opcional únicamente para poder leer perfiles V2 históricos y migrarlos de forma
   * explícita. Un perfil con alguna entrada sin este valor nunca queda listo para emitir.
   */
  approvalAuditSha256?: string;
}

export interface FiscalCatalogAmendmentAudit {
  sequence: number;
  baseDecisionSha256: string;
  reason: string;
  startedBy: string;
  startedAt: number;
}

/** La corrección conserva ambas decisiones del borrador sin alterar vigencias. */
export interface FiscalCatalogDraftRuleCorrection {
  sequence: number;
  previousRule: FiscalCatalogPresentationTaxRule;
  replacementRule: FiscalCatalogPresentationTaxRule;
  /** Opcionales solo al leer correcciones históricas anteriores a estas huellas. */
  previousRuleSha256?: string;
  replacementRuleSha256?: string;
  reason: string;
  correctedBy: string;
  correctedAt: number;
}

export interface FiscalCatalogTaxProfile {
  schemaVersion: 2;
  profileDocumentId: string;
  tenantId: string;
  issuerRuc: string;
  issuerLegalName: string;
  taxRegime: FiscalTaxRegime;
  issuerFiscalAddressCode: string;
  approvalState: "DRAFT" | "APPROVED" | "SUSPENDED";
  rules: FiscalCatalogPresentationTaxRule[];
  issuerExemptionPostures: FiscalIssuerExemptionPostureRecord[];
  /** Historial inmutable de cada decisión aprobada; no depende de revisiones MVCC antiguas. */
  approvedDecisionHistory: FiscalCatalogApprovedDecision[];
  amendments: FiscalCatalogAmendmentAudit[];
  /** Opcional para perfiles V2 anteriores a este historial. */
  draftRuleCorrections?: FiscalCatalogDraftRuleCorrection[];
  provisionedBy: string;
  createdAt: number;
  updatedAt: number;
  /** Copia íntegra del borrador anterior, en el mismo documento privado. */
  legacyDraftArchive?: {
    sourceRevision: string;
    sourceSha256: string;
    sourceDocument: Record<string, unknown>;
    migratedBy: string;
    migratedAt: number;
  };
  accountantApprovalReference?: string;
  approvedDecisionSha256?: string;
  approvedBy?: string;
  approvedAt?: number;
  suspendedBy?: string;
  suspendedAt?: number;
  suspensionReason?: string;
  revision?: string;
}

/** Identificador documental vigente. Cambiarlo exige una decisión de persistencia separada. */
export const FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE = "fiscal_tax_profile_v2" as const;

/** Sobre persistido: _id es opaco; no exige id ni profileDocumentId duplicados. */
export type FiscalCatalogTaxProfileDocument =
  Omit<FiscalCatalogTaxProfile, "profileDocumentId" | "revision"> & {
    _id: string;
    _rev?: string;
    type: typeof FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE;
  };

/** Operational view of the same profile, without private audit archives.
 * Not another Couch entity: it preserves the source _id, _rev and type. */
export type FiscalCatalogTaxConfiguration = Pick<FiscalCatalogTaxProfile,
  "schemaVersion" | "tenantId" | "issuerRuc" | "issuerLegalName" | "taxRegime" |
  "issuerFiscalAddressCode" | "approvalState" | "rules" | "issuerExemptionPostures" |
  "updatedAt">;

export type FiscalCatalogTaxConfigurationDocument = FiscalCatalogTaxConfiguration & {
  _id: string;
  _rev?: string;
  type: typeof FISCAL_CATALOG_TAX_PROFILE_DOCUMENT_TYPE;
};

