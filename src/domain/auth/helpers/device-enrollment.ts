import {
  DEVICE_ENROLLMENT_CONTRACT_VERSION,
  DEVICE_ENROLLMENT_PROOF_CHALLENGE_PREFIX,
  DEVICE_ENROLLMENT_QR_ORIGIN,
  DEVICE_ENROLLMENT_QR_PATH,
  DeviceEnrollmentQrData,
} from "../contracts/device-enrollment.contract";

export type DeviceEnrollmentQrParseError =
  | "invalid_url"
  | "invalid_origin"
  | "invalid_path"
  | "unsupported_version"
  | "invalid_invitation_id"
  | "missing_invitation_token";

export type DeviceEnrollmentQrParseResult =
  | { ok: true; value: DeviceEnrollmentQrData }
  | { ok: false; error: DeviceEnrollmentQrParseError };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseDeviceEnrollmentQrPayload(
  payload: string,
  allowedOrigins: readonly string[] = [DEVICE_ENROLLMENT_QR_ORIGIN],
): DeviceEnrollmentQrParseResult {
  let url: URL;
  try {
    url = new URL(payload);
  } catch {
    return { ok: false, error: "invalid_url" };
  }

  if (!allowedOrigins.includes(url.origin)) return { ok: false, error: "invalid_origin" };
  if (url.pathname !== DEVICE_ENROLLMENT_QR_PATH) return { ok: false, error: "invalid_path" };

  const params = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  if (params.get("v") !== String(DEVICE_ENROLLMENT_CONTRACT_VERSION)) {
    return { ok: false, error: "unsupported_version" };
  }

  const invitationId = params.get("i") ?? "";
  if (!UUID_PATTERN.test(invitationId)) return { ok: false, error: "invalid_invitation_id" };

  const invitationToken = params.get("t") ?? "";
  if (!invitationToken) return { ok: false, error: "missing_invitation_token" };

  return {
    ok: true,
    value: {
      version: DEVICE_ENROLLMENT_CONTRACT_VERSION,
      invitationId,
      invitationToken,
    },
  };
}

export function buildDeviceEnrollmentProofChallenge(
  enrollmentId: string,
  deviceId: string,
  bootstrapExchangeToken: string,
): string {
  return [
    DEVICE_ENROLLMENT_PROOF_CHALLENGE_PREFIX,
    enrollmentId,
    deviceId,
    bootstrapExchangeToken,
  ].join(":");
}
