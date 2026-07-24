"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
(0, node_test_1.default)("AuthSnapshot permite dbName y wildcard total en permissionsExpanded", () => {
    const snapshot = {
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
        catalogVersion: "1.0.3",
        policyVersion: "1",
        sessionId: "session_1",
        deviceId: "device_a",
        activo: true,
        lastAuthSyncAt: "2026-07-08T12:00:00.000Z",
        authSnapshotVersion: 1,
    };
    strict_1.default.equal(snapshot.dbName, "tenant_1_device_a");
    strict_1.default.deepEqual(snapshot.permissionsExpanded, ["*"]);
});
