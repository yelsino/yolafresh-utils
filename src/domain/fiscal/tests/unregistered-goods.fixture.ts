import { resolveFiscalV1UnregisteredGoodsPolicy } from "../contracts";

export const unregisteredPolicyDocument = () => ({
  _id: "opaque policy / α", _rev: "opaque revision", schemaVersion: 1,
  type: "fiscal_catalog_default_policy", tenantId: "tenant-a", issuerRuc: "10123456789",
  companyDocumentId: "opaque company / β", status: "ACTIVE", creationOperationId: "create-policy",
  audit: { createdBy: "actor", createdAt: 10, updatedBy: "actor", updatedAt: 20 }, draft: null,
  publishedDecisionId: "published-policy", decisionHistory: [{ decisionId: "published-policy", operationId: "publish-policy",
    reason: "Synthetic test approval", publishedBy: "actor", publishedAt: 20,
    rules: [{ ruleId: "opaque good rule", offerType: "GOOD", effectiveFrom: "2026-10-01",
      classificationOrigin: "CONTRIBUTOR_DECLARED", treatment: { category: "GRAVADA", affectationCode: "10", rateBasisPoints: 1800 } }] }],
  operationReceipts: [{ operationId: "publish-policy", action: "PUBLISH", contentSha256: "a".repeat(64), actorId: "actor", completedAt: 20 }],
});

export const unregisteredPolicyInput = () => ({ tenantId: "tenant-a", issuerRuc: "10123456789",
  companyDocumentId: "opaque company / β", policyDocumentId: "opaque policy / α",
  occurredOn: "2026-10-15", policy: unregisteredPolicyDocument() });

export const unregisteredPolicy = () => resolveFiscalV1UnregisteredGoodsPolicy(unregisteredPolicyInput());
