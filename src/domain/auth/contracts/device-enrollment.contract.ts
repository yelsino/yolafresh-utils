export const DEVICE_ENROLLMENT_CONTRACT_VERSION = 1 as const;
export const DEVICE_ENROLLMENT_QR_ORIGIN = "https://enroll.yolafresh.com" as const;
export const DEVICE_ENROLLMENT_QR_PATH = "/device" as const;
export const DEVICE_ENROLLMENT_PROOF_ALGORITHM = "Ed25519" as const;
export const DEVICE_ENROLLMENT_PUBLIC_KEY_FORMAT = "spki-der-base64url" as const;
export const DEVICE_ENROLLMENT_PROOF_CHALLENGE_PREFIX = "yf-device-enrollment-v1" as const;

export const DEVICE_ENROLLMENT_STATUSES = [
  "INVITED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "EXPIRED",
  "REVOKED",
] as const;

export type DeviceEnrollmentStatus = (typeof DEVICE_ENROLLMENT_STATUSES)[number];
export type DeviceEnrollmentClientStatus = Exclude<DeviceEnrollmentStatus, "INVITED">;
export type DeviceEnrollmentDeviceType = "POS" | "KIOSK" | "MOBILE" | "DESKTOP" | string;

export const DEVICE_ENROLLMENT_ERROR_CODES = [
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
] as const;

export type DeviceEnrollmentErrorCode = (typeof DEVICE_ENROLLMENT_ERROR_CODES)[number];

export interface DeviceEnrollmentApiError {
  ok: false;
  error: DeviceEnrollmentErrorCode;
  message?: string;
  retryAfterSeconds?: number;
}

export interface DeviceEnrollmentQrData {
  version: typeof DEVICE_ENROLLMENT_CONTRACT_VERSION;
  invitationId: string;
  invitationToken: string;
}

export interface CreateDeviceEnrollmentInvitationRequest {
  deviceType?: DeviceEnrollmentDeviceType;
  allowedRoleIds?: string[];
  allowedSucursalIds?: string[];
  expiresInSeconds?: number;
}

export interface CreateDeviceEnrollmentInvitationResponse {
  ok: true;
  invitationId: string;
  qrPayload: string;
  expiresAt: string;
  contractVersion: typeof DEVICE_ENROLLMENT_CONTRACT_VERSION;
}

export interface ClaimDeviceEnrollmentRequest {
  invitationId: string;
  invitationToken: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceEnrollmentDeviceType;
  publicKey: string;
  appVersion: string;
}

export interface TenantEnrollmentPreview {
  tenantId?: string;
  tenantName?: string;
}

export interface ClaimDeviceEnrollmentResponse {
  ok: true;
  invitationId: string;
  enrollmentId: string;
  status: "AWAITING_APPROVAL";
  pollToken: string;
  tenantPreview?: TenantEnrollmentPreview;
  expiresAt: string;
  contractVersion: typeof DEVICE_ENROLLMENT_CONTRACT_VERSION;
}

export interface DeviceEnrollmentStatusResponse {
  ok: true;
  invitationId: string;
  enrollmentId: string;
  status: DeviceEnrollmentClientStatus;
  expiresAt: string;
  bootstrapExchangeToken?: string;
  proofChallenge?: string;
}

export interface CompleteDeviceEnrollmentRequest {
  enrollmentId: string;
  deviceId: string;
  bootstrapExchangeToken: string;
  proof: string;
}

export interface DeviceBindingView {
  bindingId: string;
  tenantId: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceEnrollmentDeviceType;
  allowedRoleIds?: string[];
  allowedSucursalIds: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface DeviceTenantConnection {
  backendBaseUrl: string;
  syncMode: "backend_scoped";
}

export interface CompleteDeviceEnrollmentResponse {
  ok: true;
  status: "COMPLETED";
  deviceBinding: DeviceBindingView;
  tenantConnection: DeviceTenantConnection;
}

export interface PendingDeviceEnrollment {
  invitationId: string;
  enrollmentId: string;
  deviceId: string;
  pollToken: string;
  backendBaseUrl: string;
  status: DeviceEnrollmentClientStatus;
  expiresAt: string;
}

export interface InstalledDeviceEnrollment {
  deviceBinding: DeviceBindingView;
  tenantConnection: DeviceTenantConnection;
}
