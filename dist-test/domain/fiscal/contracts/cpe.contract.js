"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FISCAL_CPE_CONTRACT_VERSION = void 0;
exports.isFiscalTerminalState = isFiscalTerminalState;
exports.canAutomaticallySubmitFiscalState = canAutomaticallySubmitFiscalState;
exports.isSameFiscalDocumentIdentity = isSameFiscalDocumentIdentity;
exports.validateFiscalIntentV1 = validateFiscalIntentV1;
exports.validateFiscalSaleSnapshotV1 = validateFiscalSaleSnapshotV1;
exports.validateFiscalIntentSnapshotLinkV1 = validateFiscalIntentSnapshotLinkV1;
exports.validateFiscalCdrVerificationV1 = validateFiscalCdrVerificationV1;
exports.validateFiscalEvidenceV1 = validateFiscalEvidenceV1;
exports.FISCAL_CPE_CONTRACT_VERSION = 1;
function isFiscalTerminalState(state) {
    return state === "ACEPTADO" || state === "ACEPTADO_CON_OBSERVACION" || state === "RECHAZADO";
}
/** Un timeout posterior al envío nunca autoriza volver a firmar/enviar. */
function canAutomaticallySubmitFiscalState(state) {
    return state === "RECIBIDA_BACKEND" || state === "VALIDANDO" || state === "CONGELADA";
}
function isSameFiscalDocumentIdentity(expected, actual) {
    return expected.issuerRuc === actual.issuerRuc &&
        expected.documentType === actual.documentType &&
        expected.series === actual.series &&
        expected.number === actual.number;
}
const isNonNegativeCents = (value) => Number.isSafeInteger(value) && value >= 0;
const isNonBlank = (value) => value.trim().length > 0;
function validateFiscalIntentV1(intent) {
    var _a;
    const errors = [];
    if (intent.version !== exports.FISCAL_CPE_CONTRACT_VERSION)
        errors.push("version");
    for (const key of ["intentId", "idempotencyKey", "tenantId", "actorId", "saleId", "saleSnapshotId"]) {
        if (!isNonBlank(intent[key]))
            errors.push(key);
    }
    if (intent.requestedDocumentType === "FACTURA" && intent.buyer.documentType !== "RUC") {
        errors.push("buyer.documentTypeForFactura");
    }
    if (!isNonBlank(intent.buyer.legalName))
        errors.push("buyer.legalName");
    if (intent.buyer.documentType === "SIN_DOCUMENTO") {
        if (intent.buyer.documentNumber !== null)
            errors.push("buyer.documentNumber");
    }
    else if (!((_a = intent.buyer.documentNumber) === null || _a === void 0 ? void 0 : _a.trim())) {
        errors.push("buyer.documentNumber");
    }
    if (!Number.isFinite(Date.parse(intent.occurredAt)))
        errors.push("occurredAt");
    if (!Number.isFinite(Date.parse(intent.queuedAt)))
        errors.push("queuedAt");
    return errors;
}
function validateFiscalSaleSnapshotV1(snapshot) {
    const errors = [];
    if (snapshot.version !== exports.FISCAL_CPE_CONTRACT_VERSION)
        errors.push("version");
    for (const key of ["fiscalSnapshotId", "intentId", "tenantId", "saleId", "saleSnapshotId", "issuerRuc", "issuerLegalName"]) {
        if (!isNonBlank(snapshot[key]))
            errors.push(key);
    }
    if (!/^\d{11}$/.test(snapshot.issuerRuc))
        errors.push("issuerRuc.format");
    if (snapshot.taxRegime === "NRUS" && snapshot.documentType === "FACTURA") {
        errors.push("taxRegime.documentType");
    }
    if (!isNonNegativeCents(snapshot.totalCents))
        errors.push("totalCents");
    if (!isNonNegativeCents(snapshot.payment.paidAmountCents))
        errors.push("payment.paidAmountCents");
    if (snapshot.payment.paidAmountCents !== snapshot.totalCents)
        errors.push("payment.totalMismatch");
    if (!Number.isFinite(Date.parse(snapshot.payment.paidAt)))
        errors.push("payment.paidAt");
    if (!Number.isFinite(Date.parse(snapshot.frozenAt)))
        errors.push("frozenAt");
    if (snapshot.lines.length === 0)
        errors.push("lines");
    const lineIds = new Set();
    for (const [index, line] of snapshot.lines.entries()) {
        const prefix = `lines[${index}]`;
        if (!isNonBlank(line.lineId) || lineIds.has(line.lineId))
            errors.push(`${prefix}.lineId`);
        lineIds.add(line.lineId);
        if (!isNonBlank(line.description))
            errors.push(`${prefix}.description`);
        if (!isNonBlank(line.unitCode))
            errors.push(`${prefix}.unitCode`);
        if (!Number.isFinite(line.quantity) || line.quantity <= 0)
            errors.push(`${prefix}.quantity`);
        for (const key of ["unitPriceCents", "discountCents", "totalCents"]) {
            if (!isNonNegativeCents(line[key]))
                errors.push(`${prefix}.${key}`);
        }
        if (!isNonBlank(line.tax.affectationCode))
            errors.push(`${prefix}.tax.affectationCode`);
        if (!isNonNegativeCents(line.tax.taxableBaseCents))
            errors.push(`${prefix}.tax.taxableBaseCents`);
        if (!isNonNegativeCents(line.tax.taxAmountCents))
            errors.push(`${prefix}.tax.taxAmountCents`);
        if (!Number.isSafeInteger(line.tax.taxRateBasisPoints) || line.tax.taxRateBasisPoints < 0) {
            errors.push(`${prefix}.tax.taxRateBasisPoints`);
        }
        // El Nuevo RUS no discrimina IGV u otro impuesto en la boleta. Una tasa
        // comercial global no puede convertirse silenciosamente en tributo CPE.
        if (snapshot.taxRegime === "NRUS" &&
            (line.tax.taxScheme !== "NONE" || line.tax.taxRateBasisPoints !== 0 ||
                line.tax.taxAmountCents !== 0)) {
            errors.push(`${prefix}.tax.nrusDiscriminatedTax`);
        }
        if (line.tax.category === "GRAVADA") {
            if (line.tax.taxScheme !== "IGV")
                errors.push(`${prefix}.tax.taxScheme`);
        }
        else if (line.tax.taxScheme !== "NONE" || line.tax.taxRateBasisPoints !== 0 || line.tax.taxAmountCents !== 0) {
            errors.push(`${prefix}.tax.nonTaxableAmounts`);
        }
    }
    if (snapshot.lines.every((line) => isNonNegativeCents(line.totalCents)) &&
        snapshot.lines.reduce((sum, line) => sum + line.totalCents, 0) !== snapshot.totalCents) {
        errors.push("totalCents.linesMismatch");
    }
    return errors;
}
function validateFiscalIntentSnapshotLinkV1(intent, snapshot) {
    const errors = [];
    if (intent.intentId !== snapshot.intentId)
        errors.push("intentId");
    if (intent.tenantId !== snapshot.tenantId)
        errors.push("tenantId");
    if (intent.saleId !== snapshot.saleId)
        errors.push("saleId");
    if (intent.saleSnapshotId !== snapshot.saleSnapshotId)
        errors.push("saleSnapshotId");
    if (intent.requestedDocumentType !== snapshot.documentType)
        errors.push("documentType");
    return errors;
}
const isSha256 = (value) => /^[a-f\d]{64}$/i.test(value);
function validateFiscalCdrVerificationV1(cdr, expectedIdentity) {
    const errors = [];
    if (!isSameFiscalDocumentIdentity(expectedIdentity, cdr.identity))
        errors.push("identity");
    if (!isNonBlank(cdr.responseCode))
        errors.push("responseCode");
    if (!isNonBlank(cdr.responseDescription))
        errors.push("responseDescription");
    if (!isNonBlank(cdr.signedXmlStorageRef))
        errors.push("signedXmlStorageRef");
    if (!isSha256(cdr.signedXmlSha256))
        errors.push("signedXmlSha256");
    if (!isNonBlank(cdr.cdrStorageRef))
        errors.push("cdrStorageRef");
    if (!isSha256(cdr.cdrSha256))
        errors.push("cdrSha256");
    return errors;
}
function validateFiscalEvidenceV1(evidence) {
    const errors = [];
    if (evidence.version !== exports.FISCAL_CPE_CONTRACT_VERSION)
        errors.push("version");
    for (const key of ["fiscalDocumentId", "intentId", "tenantId", "saleId", "issuerRuc", "series", "provider", "signedXmlStorageRef", "cdrStorageRef", "sunatResponseCode", "sunatResponseDescription"]) {
        if (!isNonBlank(evidence[key]))
            errors.push(key);
    }
    if (!Number.isSafeInteger(evidence.number) || evidence.number < 1)
        errors.push("number");
    if (!isSha256(evidence.signedXmlSha256))
        errors.push("signedXmlSha256");
    if (!isSha256(evidence.cdrSha256))
        errors.push("cdrSha256");
    if (!Number.isFinite(Date.parse(evidence.issuedAt)))
        errors.push("issuedAt");
    return errors;
}
