"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDeviceEnrollmentQrPayload = parseDeviceEnrollmentQrPayload;
exports.buildDeviceEnrollmentProofChallenge = buildDeviceEnrollmentProofChallenge;
const device_enrollment_contract_1 = require("../contracts/device-enrollment.contract");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function parseDeviceEnrollmentQrPayload(payload, allowedOrigins = [device_enrollment_contract_1.DEVICE_ENROLLMENT_QR_ORIGIN]) {
    var _a, _b;
    let url;
    try {
        url = new URL(payload);
    }
    catch (_c) {
        return { ok: false, error: "invalid_url" };
    }
    if (!allowedOrigins.includes(url.origin))
        return { ok: false, error: "invalid_origin" };
    if (url.pathname !== device_enrollment_contract_1.DEVICE_ENROLLMENT_QR_PATH)
        return { ok: false, error: "invalid_path" };
    const params = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
    if (params.get("v") !== String(device_enrollment_contract_1.DEVICE_ENROLLMENT_CONTRACT_VERSION)) {
        return { ok: false, error: "unsupported_version" };
    }
    const invitationId = (_a = params.get("i")) !== null && _a !== void 0 ? _a : "";
    if (!UUID_PATTERN.test(invitationId))
        return { ok: false, error: "invalid_invitation_id" };
    const invitationToken = (_b = params.get("t")) !== null && _b !== void 0 ? _b : "";
    if (!invitationToken)
        return { ok: false, error: "missing_invitation_token" };
    return {
        ok: true,
        value: {
            version: device_enrollment_contract_1.DEVICE_ENROLLMENT_CONTRACT_VERSION,
            invitationId,
            invitationToken,
        },
    };
}
function buildDeviceEnrollmentProofChallenge(enrollmentId, deviceId, bootstrapExchangeToken) {
    return [
        device_enrollment_contract_1.DEVICE_ENROLLMENT_PROOF_CHALLENGE_PREFIX,
        enrollmentId,
        deviceId,
        bootstrapExchangeToken,
    ].join(":");
}
