import assert from "node:assert/strict";
import test from "node:test";
import {
  DEVICE_ENROLLMENT_CONTRACT_VERSION,
  DEVICE_ENROLLMENT_ERROR_CODES,
  DEVICE_ENROLLMENT_STATUSES,
  buildDeviceEnrollmentProofChallenge,
  parseDeviceEnrollmentQrPayload,
} from "../index";
import type { InstalledDeviceEnrollment } from "../index";

const invitationId = "550e8400-e29b-41d4-a716-446655440000";

test("parsea el QR canónico y conserva el token opaco", () => {
  const result = parseDeviceEnrollmentQrPayload(
    `https://enroll.yolafresh.com/device#v=1&i=${invitationId}&t=opaque-token`,
  );

  assert.deepEqual(result, {
    ok: true,
    value: {
      version: 1,
      invitationId,
      invitationToken: "opaque-token",
    },
  });
});

test("rechaza origen, versión e identificador no válidos", () => {
  assert.deepEqual(
    parseDeviceEnrollmentQrPayload(
      `http://enroll.yolafresh.com/device#v=1&i=${invitationId}&t=secret`,
    ),
    { ok: false, error: "invalid_origin" },
  );
  assert.deepEqual(
    parseDeviceEnrollmentQrPayload(
      `https://enroll.yolafresh.com/device#v=2&i=${invitationId}&t=secret`,
    ),
    { ok: false, error: "unsupported_version" },
  );
  assert.deepEqual(
    parseDeviceEnrollmentQrPayload(
      "https://enroll.yolafresh.com/device#v=1&i=no-uuid&t=secret",
    ),
    { ok: false, error: "invalid_invitation_id" },
  );
});

test("construye exactamente el challenge Ed25519 del contrato v1", () => {
  assert.equal(
    buildDeviceEnrollmentProofChallenge("enrollment-1", "device-1", "exchange-1"),
    "yf-device-enrollment-v1:enrollment-1:device-1:exchange-1",
  );
});

test("publica vocabulario estable de estados y errores", () => {
  assert.equal(DEVICE_ENROLLMENT_CONTRACT_VERSION, 1);
  assert.ok(DEVICE_ENROLLMENT_STATUSES.includes("AWAITING_APPROVAL"));
  assert.ok(DEVICE_ENROLLMENT_STATUSES.includes("COMPLETED"));
  assert.ok(DEVICE_ENROLLMENT_ERROR_CODES.includes("invalid_device_proof"));
});

test("el contrato instalado admite una credencial bootstrap por dispositivo", () => {
  const installed: InstalledDeviceEnrollment = {
    deviceBinding: {
      bindingId: "binding-1",
      tenantId: "tenant-1",
      deviceId: "device-1",
      deviceName: "POS Caja 1",
      deviceType: "android",
      allowedSucursalIds: [],
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    },
    tenantConnection: {
      backendBaseUrl: "https://pos.example.com",
      syncMode: "backend_scoped",
      bootstrapAccessToken: "opaque-device-bootstrap-token",
    },
  };

  assert.equal(
    installed.tenantConnection.bootstrapAccessToken,
    "opaque-device-bootstrap-token",
  );
});
