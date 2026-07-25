"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEVICE_ENROLLMENT_ERROR_CODES = exports.DEVICE_ENROLLMENT_STATUSES = exports.DEVICE_ENROLLMENT_PROOF_CHALLENGE_PREFIX = exports.DEVICE_ENROLLMENT_PUBLIC_KEY_FORMAT = exports.DEVICE_ENROLLMENT_PROOF_ALGORITHM = exports.DEVICE_ENROLLMENT_QR_PATH = exports.DEVICE_ENROLLMENT_QR_ORIGIN = exports.DEVICE_ENROLLMENT_CONTRACT_VERSION = void 0;
exports.DEVICE_ENROLLMENT_CONTRACT_VERSION = 1;
exports.DEVICE_ENROLLMENT_QR_ORIGIN = "https://enroll.yolafresh.com";
exports.DEVICE_ENROLLMENT_QR_PATH = "/device";
exports.DEVICE_ENROLLMENT_PROOF_ALGORITHM = "Ed25519";
exports.DEVICE_ENROLLMENT_PUBLIC_KEY_FORMAT = "spki-der-base64url";
exports.DEVICE_ENROLLMENT_PROOF_CHALLENGE_PREFIX = "yf-device-enrollment-v1";
exports.DEVICE_ENROLLMENT_STATUSES = [
    "INVITED",
    "AWAITING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
    "EXPIRED",
    "REVOKED",
];
exports.DEVICE_ENROLLMENT_ERROR_CODES = [
    "bad_request",
    "access_token_required",
    "poll_token_required",
    "device_binding_required",
    "enrollment_rate_limited",
    "invalid_enrollment_transition",
    "device_already_bound",
    "invitation_already_exists",
    "invitation_expired",
    "invitation_already_used",
    "enrollment_expired",
    "bootstrap_exchange_already_used",
    "invalid_invitation_token",
    "invalid_poll_token",
    "invalid_bootstrap_exchange",
    "invalid_device_proof",
    "invalid_device_public_key",
    "forbidden",
    "device_bound_to_other_tenant",
    "device_tenant_mismatch",
    "device_binding_mismatch",
    "device_binding_revoked",
    "device_binding_expired",
    "device_role_not_allowed",
    "device_sucursal_not_allowed",
    "enrollment_not_approved",
    "invitation_not_found",
    "enrollment_not_found",
    "device_not_enrolled",
];
