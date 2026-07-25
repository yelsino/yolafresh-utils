"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const index_1 = require("../index");
const invitationId = "550e8400-e29b-41d4-a716-446655440000";
(0, node_test_1.default)("parsea el QR canónico y conserva el token opaco", () => {
    const result = (0, index_1.parseDeviceEnrollmentQrPayload)(`https://enroll.yolafresh.com/device#v=1&i=${invitationId}&t=opaque-token`);
    strict_1.default.deepEqual(result, {
        ok: true,
        value: {
            version: 1,
            invitationId,
            invitationToken: "opaque-token",
        },
    });
});
(0, node_test_1.default)("rechaza origen, versión e identificador no válidos", () => {
    strict_1.default.deepEqual((0, index_1.parseDeviceEnrollmentQrPayload)(`http://enroll.yolafresh.com/device#v=1&i=${invitationId}&t=secret`), { ok: false, error: "invalid_origin" });
    strict_1.default.deepEqual((0, index_1.parseDeviceEnrollmentQrPayload)(`https://enroll.yolafresh.com/device#v=2&i=${invitationId}&t=secret`), { ok: false, error: "unsupported_version" });
    strict_1.default.deepEqual((0, index_1.parseDeviceEnrollmentQrPayload)("https://enroll.yolafresh.com/device#v=1&i=no-uuid&t=secret"), { ok: false, error: "invalid_invitation_id" });
});
(0, node_test_1.default)("construye exactamente el challenge Ed25519 del contrato v1", () => {
    strict_1.default.equal((0, index_1.buildDeviceEnrollmentProofChallenge)("enrollment-1", "device-1", "exchange-1"), "yf-device-enrollment-v1:enrollment-1:device-1:exchange-1");
});
(0, node_test_1.default)("publica vocabulario estable de estados y errores", () => {
    strict_1.default.equal(index_1.DEVICE_ENROLLMENT_CONTRACT_VERSION, 1);
    strict_1.default.ok(index_1.DEVICE_ENROLLMENT_STATUSES.includes("AWAITING_APPROVAL"));
    strict_1.default.ok(index_1.DEVICE_ENROLLMENT_STATUSES.includes("COMPLETED"));
    strict_1.default.ok(index_1.DEVICE_ENROLLMENT_ERROR_CODES.includes("invalid_device_proof"));
});
