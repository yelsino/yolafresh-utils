/** Configuración fiscal actual. Identidades opacas; sin precios, XML o credenciales. */
import type { FiscalOfficialLegalSource } from "./catalogo-tributario.contract";

export const FISCAL_ISSUER_TAX_PROFILE_TYPE = "fiscal_issuer_tax_profile" as const;
export const FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE = "fiscal_presentation_tax_configuration" as const;
export const FISCAL_TAX_CONFIGURATION_TYPES = Object.freeze([
  FISCAL_ISSUER_TAX_PROFILE_TYPE, FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE,
] as const);

export interface FiscalConfigurationAudit {
  createdBy: string; createdAt: number; updatedBy: string; updatedAt: number;
}
export interface FiscalPresentationConfigurationReference {
  issuerRuc: string; configurationDocumentId: string;
}
export interface FiscalTaxEvidence {
  effectiveFrom: string; effectiveTo?: string;
  /** Sustento documental opcional. No implica una consulta o validación jurídica automática. */
  legalSource?: Partial<FiscalOfficialLegalSource>;
  sourceReviewedAt?: string; evidenceReference?: string;
}
type TaxAssessment =
  | { category: "GRAVADA"; affectationCode: "10"; taxRateBasisPoints: number; exemptionEligibility: "NOT_APPLICABLE" }
  | { category: "EXONERADA"; affectationCode: "20"; taxRateBasisPoints: 0; exemptionEligibility: "APPENDIX_I_ELIGIBLE" | "APPENDIX_II_ELIGIBLE" }
  | { category: "INAFECTA"; affectationCode: "30"; taxRateBasisPoints: 0; exemptionEligibility: "NOT_APPLICABLE" }
  | { category: "UNDETERMINED"; affectationCode: null; taxRateBasisPoints: null; exemptionEligibility: "UNDETERMINED"; reviewQuestion?: string };
type Offer =
  | { offerType: "GOOD"; tariffCode10?: string; physicalState?: string; compositionOrSpecies?: string; serviceDescription?: never }
  | { offerType: "SERVICE"; serviceDescription?: string; tariffCode10?: never; physicalState?: never; compositionOrSpecies?: never };
export type FiscalPresentationTaxRule = FiscalTaxEvidence & Offer & TaxAssessment & {
  ruleId: string; unitCode: "NIU" | "KGM" | "LTR" | "ZZ";
  /** Huella de unidad, conversión y naturaleza; nunca de precio, nombre o _rev. */
  catalogSemanticFingerprint: string;
};
export type FiscalIssuerTaxPosture = FiscalTaxEvidence & { postureId: string } & (
  | { posture: "RENOUNCED"; resultingAffectationCode: "10"; resultingTaxRateBasisPoints: number }
  | { posture: "NOT_RENOUNCED" | "UNDETERMINED"; resultingAffectationCode: null; resultingTaxRateBasisPoints: null }
);
export interface FiscalTaxDecision<Rule> {
  decisionId: string; operationId: string; reason: string;
  publishedBy: string; publishedAt: number; rules: Rule[];
}
export type FiscalPresentationTaxDecision = FiscalTaxDecision<FiscalPresentationTaxRule>;
export type FiscalIssuerTaxDecision = FiscalTaxDecision<FiscalIssuerTaxPosture>;
export interface FiscalConfigurationDraft<Rule> {
  operationId: string; rules: Rule[]; reason: string;
  updatedBy: string; updatedAt: number;
}
/** Recibos de comandos, no copias de borradores. Permiten recuperar una respuesta perdida. */
export interface FiscalConfigurationOperationReceipt {
  operationId: string; action: "CREATE" | "SAVE_DRAFT" | "PUBLISH" | "SET_STATUS";
  contentSha256: string; actorId: string; completedAt: number;
}
export interface FiscalTaxConfigurationRoot<Rule> {
  _id: string; _rev?: string; tenantId: string; issuerRuc: string;
  status: "ACTIVE" | "SUSPENDED";
  audit: FiscalConfigurationAudit;
  creationOperationId: string;
  draft: FiscalConfigurationDraft<Rule> | null;
  publishedDecisionId: string | null;
  decisionHistory: FiscalTaxDecision<Rule>[];
  operationReceipts: FiscalConfigurationOperationReceipt[];
}
/** ConfigEmpresa es dueño de RUC, razón social, régimen, domicilio, entorno y habilitación. */
export interface FiscalIssuerTaxProfileDocument extends FiscalTaxConfigurationRoot<FiscalIssuerTaxPosture> {
  type: typeof FISCAL_ISSUER_TAX_PROFILE_TYPE;
  companyDocumentId: string;
}
export interface FiscalPresentationTaxConfigurationDocument extends FiscalTaxConfigurationRoot<FiscalPresentationTaxRule> {
  type: typeof FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE;
  presentationId: string;
}
export type FiscalTaxConfigurationDocument = FiscalIssuerTaxProfileDocument | FiscalPresentationTaxConfigurationDocument;

/** Datos comerciales relevantes para compatibilidad fiscal. El caller calcula SHA-256 del material. */
export interface FiscalCatalogSemanticInput {
  tenantId: string; presentationId: string; productBaseId: string;
  tipoVenta: string; unidadContenido: string; contenidoNeto: number;
  unidadBaseInventario: string; equivalenciaUnidadBase: number; fraccionable: boolean;
}
export interface FiscalTaxResolutionSource {
  configurationDocumentId: string; decisionId: string; ruleId: string;
  issuerProfileDocumentId: string; issuerDecisionId: string;
  issuerPostureId: string | null; taxableEventDate: string; catalogSemanticFingerprint: string;
}
export interface FiscalResolvedPresentationTax {
  tenantId: string; issuerRuc: string; presentationId: string; taxableEventDate: string;
  category: "GRAVADA" | "EXONERADA" | "INAFECTA";
  affectationCode: "10" | "20" | "30"; rateBasisPoints: number;
  unitCode: "NIU" | "KGM" | "LTR" | "ZZ";
  source: FiscalTaxResolutionSource;
}
export interface FiscalConfigurationCommand {
  operationId: string; expectedRevision: string | null;
}
export interface FiscalCreateConfigurationCommand {
  type: typeof FISCAL_ISSUER_TAX_PROFILE_TYPE | typeof FISCAL_PRESENTATION_TAX_CONFIGURATION_TYPE;
  rootId: string; issuerRuc: string; ownerDocumentId: string; companyDocumentId: string;
  expectedOwnerRevision: string; operationId: string;
}
export interface FiscalSaveConfigurationDraftCommand<Rule> extends FiscalConfigurationCommand {
  action: "SAVE_DRAFT"; rules: Rule[]; reason: string;
}
export interface FiscalPublishConfigurationCommand extends FiscalConfigurationCommand {
  action: "PUBLISH"; decisionId: string;
}
export interface FiscalSetConfigurationStatusCommand extends FiscalConfigurationCommand {
  action: "SET_STATUS"; status: "ACTIVE" | "SUSPENDED"; reason: string;
}
export type FiscalTaxConfigurationCommand<Rule> = FiscalSaveConfigurationDraftCommand<Rule> |
  FiscalPublishConfigurationCommand | FiscalSetConfigurationStatusCommand;
/** Petición administrativa durable; viaja por outbox, nunca como documento de CouchDB. */
export type FiscalConfigurationWriteRequest =
  | { action: "CREATE"; command: FiscalCreateConfigurationCommand }
  | { action: "EXECUTE"; rootId: string; command: FiscalTaxConfigurationCommand<FiscalPresentationTaxRule | FiscalIssuerTaxPosture> };
/** Scope autenticado. Un comando no puede declarar ni suplantar la auditoría. */
export interface FiscalConfigurationActor {
  tenantId: string; actorId: string; canEdit: boolean; canPublish: boolean;
}
