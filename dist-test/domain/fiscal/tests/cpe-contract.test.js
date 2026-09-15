"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const contracts_1 = require("../contracts");
const intent = {
    version: contracts_1.FISCAL_CPE_CONTRACT_VERSION,
    intentId: "intent_001",
    idempotencyKey: "stable-key-001",
    tenantId: "yolafresh__dev",
    actorId: "seller_001",
    saleId: "sale_001",
    saleSnapshotId: "snapshot_001",
    requestedDocumentType: "BOLETA",
    buyer: { documentType: "SIN_DOCUMENTO", documentNumber: null, legalName: "Consumidor final" },
    occurredAt: "2026-09-15T13:00:00.000Z",
    queuedAt: "2026-09-15T13:00:01.000Z",
};
const snapshot = {
    version: contracts_1.FISCAL_CPE_CONTRACT_VERSION,
    fiscalSnapshotId: "frozen_001",
    intentId: intent.intentId,
    tenantId: intent.tenantId,
    saleId: intent.saleId,
    saleSnapshotId: intent.saleSnapshotId,
    issuerRuc: "10770681397",
    issuerLegalName: "Empresa Demo",
    taxRegime: "RER",
    documentType: "BOLETA",
    buyer: intent.buyer,
    currency: "PEN",
    lines: [
        {
            lineId: "line_1",
            description: "Producto gravado",
            quantity: 1,
            unitCode: "NIU",
            unitPriceCents: 1180,
            discountCents: 0,
            totalCents: 1180,
            tax: {
                category: "GRAVADA",
                affectationCode: "10",
                taxScheme: "IGV",
                taxRateBasisPoints: 1800,
                taxableBaseCents: 1000,
                taxAmountCents: 180,
            },
        },
        {
            lineId: "line_2",
            description: "Producto exonerado",
            quantity: 1,
            unitCode: "NIU",
            unitPriceCents: 500,
            discountCents: 0,
            totalCents: 500,
            tax: {
                category: "EXONERADA",
                affectationCode: "20",
                taxScheme: "NONE",
                taxRateBasisPoints: 0,
                taxableBaseCents: 500,
                taxAmountCents: 0,
            },
        },
    ],
    totalCents: 1680,
    payment: { status: "PAID", paidAmountCents: 1680, paidAt: "2026-09-15T13:00:00.000Z" },
    frozenAt: "2026-09-15T13:00:02.000Z",
};
(0, node_test_1.default)("intención fiscal v1 conserva identidad y no concede número", () => {
    strict_1.default.deepEqual((0, contracts_1.validateFiscalIntentV1)(intent), []);
    strict_1.default.equal("series" in intent, false);
    strict_1.default.equal("number" in intent, false);
    strict_1.default.equal("issuerRuc" in intent, false);
});
(0, node_test_1.default)("intención fiscal rechaza identidad incompleta y fecha inválida", () => {
    const invalid = {
        ...intent,
        saleSnapshotId: " ",
        buyer: { documentType: "RUC", documentNumber: null, legalName: " " },
        queuedAt: "not-a-date",
    };
    strict_1.default.deepEqual((0, contracts_1.validateFiscalIntentV1)(invalid), [
        "saleSnapshotId",
        "buyer.legalName",
        "buyer.documentNumber",
        "queuedAt",
    ]);
});
(0, node_test_1.default)("snapshot fiscal exige afectación e impuesto por cada línea", () => {
    strict_1.default.deepEqual((0, contracts_1.validateFiscalSaleSnapshotV1)(snapshot), []);
    strict_1.default.equal(snapshot.lines[0].tax.taxRateBasisPoints, 1800);
    strict_1.default.equal(snapshot.lines[1].tax.taxRateBasisPoints, 0);
});
(0, node_test_1.default)("snapshot congelado conserva vínculo exacto con intención y venta", () => {
    strict_1.default.deepEqual((0, contracts_1.validateFiscalIntentSnapshotLinkV1)(intent, snapshot), []);
    strict_1.default.deepEqual((0, contracts_1.validateFiscalIntentSnapshotLinkV1)(intent, { ...snapshot, tenantId: "other" }), ["tenantId"]);
});
(0, node_test_1.default)("snapshot fiscal exige venta efectivamente pagada por el monto aplicado", () => {
    strict_1.default.deepEqual((0, contracts_1.validateFiscalSaleSnapshotV1)({
        ...snapshot,
        payment: { ...snapshot.payment, paidAmountCents: 1700 },
    }), ["payment.totalMismatch"]);
});
(0, node_test_1.default)("NRUS no puede construir factura fiscal", () => {
    strict_1.default.deepEqual((0, contracts_1.validateFiscalSaleSnapshotV1)({
        ...snapshot,
        taxRegime: "NRUS",
        documentType: "FACTURA",
    }), ["taxRegime.documentType"]);
});
(0, node_test_1.default)("snapshot fiscal detecta categoría/tasa inconsistente y total no conciliado", () => {
    const invalid = {
        ...snapshot,
        lines: [
            snapshot.lines[0],
            {
                ...snapshot.lines[1],
                tax: {
                    ...snapshot.lines[1].tax,
                    taxRateBasisPoints: 1800,
                    taxAmountCents: 90,
                },
            },
        ],
        totalCents: 1000,
    };
    strict_1.default.deepEqual((0, contracts_1.validateFiscalSaleSnapshotV1)(invalid), [
        "payment.totalMismatch",
        "lines[1].tax.nonTaxableAmounts",
        "totalCents.linesMismatch",
    ]);
});
(0, node_test_1.default)("timeout o envío PSE no permiten reenvío automático ni simulan aceptación", () => {
    strict_1.default.equal((0, contracts_1.canAutomaticallySubmitFiscalState)("RECIBIDA_BACKEND"), true);
    strict_1.default.equal((0, contracts_1.canAutomaticallySubmitFiscalState)("ENVIADA_PSE"), false);
    strict_1.default.equal((0, contracts_1.canAutomaticallySubmitFiscalState)("RESULTADO_DESCONOCIDO"), false);
    strict_1.default.equal((0, contracts_1.isFiscalTerminalState)("RESULTADO_DESCONOCIDO"), false);
    strict_1.default.equal((0, contracts_1.isFiscalTerminalState)("ACEPTADO_CON_OBSERVACION"), true);
});
(0, node_test_1.default)("evidencia terminal requiere identidad, XML firmado y CDR, no HTTP 200", () => {
    const evidence = {
        version: contracts_1.FISCAL_CPE_CONTRACT_VERSION,
        fiscalDocumentId: "doc_001",
        intentId: intent.intentId,
        tenantId: intent.tenantId,
        saleId: intent.saleId,
        issuerRuc: snapshot.issuerRuc,
        documentType: "BOLETA",
        series: "B001",
        number: 1,
        status: "ACEPTADO",
        issuedAt: "2026-09-15T13:00:03.000Z",
        provider: "SmartPSE",
        providerRequestId: null,
        signedXmlStorageRef: "evidence/xml/001",
        signedXmlSha256: "a".repeat(64),
        cdrStorageRef: "evidence/cdr/001",
        cdrSha256: "b".repeat(64),
        sunatResponseCode: "0",
        sunatResponseDescription: "Aceptado",
        observations: [],
    };
    strict_1.default.equal(evidence.status, "ACEPTADO");
    strict_1.default.equal(evidence.issuerRuc, snapshot.issuerRuc);
    strict_1.default.equal(evidence.cdrSha256.length, 64);
    strict_1.default.equal("httpStatus" in evidence, false);
    strict_1.default.deepEqual((0, contracts_1.validateFiscalEvidenceV1)(evidence), []);
    const identity = {
        issuerRuc: evidence.issuerRuc,
        documentType: evidence.documentType,
        series: evidence.series,
        number: evidence.number,
    };
    const cdr = {
        identity,
        responseCode: evidence.sunatResponseCode,
        responseDescription: evidence.sunatResponseDescription,
        status: evidence.status,
        observations: evidence.observations,
        signedXmlStorageRef: evidence.signedXmlStorageRef,
        signedXmlSha256: evidence.signedXmlSha256,
        cdrStorageRef: evidence.cdrStorageRef,
        cdrSha256: evidence.cdrSha256,
    };
    strict_1.default.equal((0, contracts_1.isSameFiscalDocumentIdentity)(identity, { ...identity, number: 2 }), false);
    strict_1.default.deepEqual((0, contracts_1.validateFiscalCdrVerificationV1)(cdr, identity), []);
    strict_1.default.deepEqual((0, contracts_1.validateFiscalCdrVerificationV1)(cdr, { ...identity, number: 2 }), ["identity"]);
});
(0, node_test_1.default)("subpath fiscal publica contratos v1 y validadores", () => {
    const fiscal = require("yola-fresh-utils/fiscal/contracts");
    strict_1.default.equal(fiscal.FISCAL_CPE_CONTRACT_VERSION, 1);
    strict_1.default.equal(typeof fiscal.validateFiscalIntentV1, "function");
    strict_1.default.equal(typeof fiscal.validateFiscalSaleSnapshotV1, "function");
    strict_1.default.equal(typeof fiscal.validateFiscalCdrVerificationV1, "function");
});
