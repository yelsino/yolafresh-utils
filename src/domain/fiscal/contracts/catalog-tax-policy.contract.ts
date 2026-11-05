/**
 * Declaraciones fiscales de catálogo. Este módulo solo define contratos.
 * La resolución por fecha, autorización, persistencia y publicación viven
 * en los casos de uso de los consumidores.
 */
import type {
  FiscalConfigurationAudit, FiscalConfigurationOperationReceipt,
  FiscalTaxConfigurationRoot, FiscalTaxDecision, FiscalTaxEvidence,
} from "./configuracion-fiscal.contract";

export const FISCAL_CATALOG_DEFAULT_POLICY_TYPE = "fiscal_catalog_default_policy" as const;
export const FISCAL_PRODUCT_TAX_CONFIGURATION_TYPE = "fiscal_product_tax_configuration" as const;
export const FISCAL_CATALOG_POLICY_DOCUMENT_TYPES = [
  FISCAL_CATALOG_DEFAULT_POLICY_TYPE, FISCAL_PRODUCT_TAX_CONFIGURATION_TYPE,
] as const;

export type FiscalCatalogDeclaredTreatment =
  | { category: "GRAVADA"; affectationCode: "10"; rateBasisPoints: number }
  | { category: "EXONERADA"; affectationCode: "20"; rateBasisPoints: 0 }
  | { category: "INAFECTA"; affectationCode: "30"; rateBasisPoints: 0 };

export interface FiscalCatalogTaxDeclaration extends FiscalTaxEvidence {
  ruleId: string;
  offerType: "GOOD" | "SERVICE";
  treatment: FiscalCatalogDeclaredTreatment;
  /** Autoría de la clasificación; no afirma una verificación de SUNAT. */
  classificationOrigin: "CONTRIBUTOR_DECLARED";
}

export interface FiscalCatalogDefaultPolicyDocument
  extends FiscalTaxConfigurationRoot<FiscalCatalogTaxDeclaration> {
  type: typeof FISCAL_CATALOG_DEFAULT_POLICY_TYPE;
  schemaVersion: 1;
  companyDocumentId: string;
}

export type FiscalProductTaxAssignmentRule = FiscalTaxEvidence & { ruleId: string } & (
  | { mode: "INHERIT_COMPANY_POLICY"; policyDocumentId: string }
  | { mode: "CUSTOM"; declaration: FiscalCatalogTaxDeclaration }
);

export interface FiscalProductTaxConfigurationDocument
  extends FiscalTaxConfigurationRoot<FiscalProductTaxAssignmentRule> {
  type: typeof FISCAL_PRODUCT_TAX_CONFIGURATION_TYPE;
  schemaVersion: 1;
  companyDocumentId: string;
  productBaseId: string;
  automaticAssignment?: FiscalCatalogAutomaticAssignmentAudit;
}

export type FiscalCatalogPolicyDocument =
  FiscalCatalogDefaultPolicyDocument | FiscalProductTaxConfigurationDocument;

/** Se almacena dentro de la raíz fiscal existente de una presentación. */
export type FiscalPresentationCatalogAssignmentRule = FiscalTaxEvidence & { ruleId: string } & (
  | { mode: "INHERIT_PRODUCT"; productConfigurationDocumentId: string }
  | { mode: "CUSTOM"; configurationDecisionId: string }
);
export interface FiscalPresentationCatalogAssignment {
  schemaVersion: 1;
  publishedDecisionId: string;
  decisionHistory: FiscalTaxDecision<FiscalPresentationCatalogAssignmentRule>[];
}

export interface FiscalCatalogConfigurationReference {
  issuerRuc: string;
  configurationDocumentId: string;
}

/** Referencias congeladas, no búsqueda de la política más reciente. */
export interface FiscalCatalogTaxOriginReference {
  documentId: string;
  decisionId: string;
  ruleId: string;
}
export interface FiscalCatalogResolvedTaxSource {
  kind: "COMPANY_POLICY" | "PRODUCT_OVERRIDE" | "PRESENTATION_OVERRIDE";
  policy?: FiscalCatalogTaxOriginReference;
  product?: FiscalCatalogTaxOriginReference;
  presentation?: FiscalCatalogTaxOriginReference;
  presentationAssignment?: FiscalCatalogTaxOriginReference;
  issuerPosture?: FiscalCatalogTaxOriginReference;
}

export interface FiscalCatalogTaxResolution {
  tenantId: string;
  issuerRuc: string;
  productBaseId: string;
  presentationId: string;
  taxableEventDate: string;
  offerType: "GOOD" | "SERVICE";
  treatment: FiscalCatalogDeclaredTreatment;
  source: FiscalCatalogResolvedTaxSource;
}

export type FiscalCatalogPolicyWriteRequest =
  | {
      action: "CREATE_POLICY";
      operationId: string;
      rootId: string;
      companyDocumentId: string;
      issuerRuc: string;
      expectedCompanyRevision: string;
    }
  | {
      action: "CREATE_PRODUCT_CONFIGURATION";
      operationId: string;
      rootId: string;
      companyDocumentId: string;
      productBaseId: string;
      issuerRuc: string;
      expectedProductRevision: string;
    }
  | {
      action: "SAVE_POLICY_DRAFT";
      operationId: string;
      rootId: string;
      expectedRevision: string;
      rules: FiscalCatalogTaxDeclaration[];
      reason: string;
    }
  | {
      action: "SAVE_PRODUCT_DRAFT";
      operationId: string;
      rootId: string;
      expectedRevision: string;
      rules: FiscalProductTaxAssignmentRule[];
      reason: string;
    }
  | {
      action: "PUBLISH";
      operationId: string;
      rootId: string;
      expectedRevision: string;
      decisionId: string;
    }
  | {
      action: "SET_STATUS";
      operationId: string;
      rootId: string;
      expectedRevision: string;
      status: "ACTIVE" | "SUSPENDED";
      reason: string;
    };

/** Datos auditables de una asignación derivada; no suplantan al aprobador. */
export interface FiscalCatalogAutomaticAssignmentAudit {
  operationId: string;
  createdBy: string;
  createdAt: number;
  approvedSource: FiscalCatalogTaxOriginReference;
}

export type FiscalCatalogPolicyAudit = FiscalConfigurationAudit;
export type FiscalCatalogPolicyOperationReceipt = FiscalConfigurationOperationReceipt;

/** Una intención del operador; sus fases técnicas son idempotentes y no se muestran como pasos de UI. */
export type FiscalCatalogConfigureRequest = {
  operationId: string;
  createOperationId: string;
  draftOperationId: string;
  decisionId: string;
  rootId: string;
  companyDocumentId: string;
  issuerRuc: string;
  expectedOwnerRevision: string;
  expectedRevision: string | null;
  reason: string;
  /** false conserva una propuesta sin alterar la decisión vigente; por omisión se solicita aprobación. */
  publish?: boolean;
} & (
  | { target: "POLICY"; rule: FiscalCatalogTaxDeclaration }
  | { target: "PRODUCT"; productBaseId: string; rule: FiscalProductTaxAssignmentRule }
);

/** Sólo solicita la herencia ya aprobada para un producto recién creado; no declara impuestos. */
export interface FiscalCatalogInheritNewProductRequest {
  productBaseId: string;
  rootId: string;
  operationId: string;
  createOperationId: string;
  draftOperationId: string;
  decisionId: string;
}

/** Volver a heredar en una presentación concreta sin reescribir sus decisiones particulares anteriores. */
export interface FiscalCatalogPresentationBindingRequest {
  operationId: string;
  createOperationId: string;
  decisionId: string;
  ruleId: string;
  rootId: string;
  presentationId: string;
  companyDocumentId: string;
  issuerRuc: string;
  expectedOwnerRevision: string;
  expectedRevision: string | null;
  productConfigurationDocumentId: string;
  effectiveFrom: string;
  reason: string;
}
