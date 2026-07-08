import assert from "node:assert/strict";
import test from "node:test";

import type { AuthSnapshot } from "../contracts/auth-snapshot.contract";

test("AuthSnapshot permite dbName y wildcard total en permissionsExpanded", () => {
  const snapshot: AuthSnapshot = {
    userId: "user_1",
    username: "demo",
    tenantId: "tenant_1",
    dbName: "tenant_1_device_a",
    roleIds: ["admin"],
    roleNames: ["ADMIN"],
    isSystemAdmin: true,
    grants: ["*"],
    permissionsExpanded: ["*"],
    scopes: {
      tenantIds: ["tenant_1"],
    },
    catalogVersion: "2.0.0",
    policyVersion: "1",
    sessionId: "session_1",
    deviceId: "device_a",
    activo: true,
    lastAuthSyncAt: "2026-07-08T12:00:00.000Z",
    authSnapshotVersion: 1,
  };

  assert.equal(snapshot.dbName, "tenant_1_device_a");
  assert.deepEqual(snapshot.permissionsExpanded, ["*"]);
});
