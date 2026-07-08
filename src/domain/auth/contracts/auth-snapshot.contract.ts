import type { AuthGrant } from "./auth-grant.contract";
import type { AuthPermission } from "./auth-permission.contract";
import type { RoleId } from "./auth-role.contract";

export type AuthSnapshotScopes = {
  tenantIds?: string[];
  sucursalIds?: string[];
  almacenIds?: string[];
  cajaIds?: string[];
  organizacionIds?: string[];
};

export type AuthSnapshotPermissionsExpanded = AuthPermission[] | ["*"];

export type AuthSnapshot = {
  userId: string;
  username: string;
  tenantId: string;
  dbName?: string;
  roleIds: RoleId[];
  roleNames: string[];
  isSystemAdmin: boolean;
  grants: AuthGrant[];
  permissionsExpanded: AuthSnapshotPermissionsExpanded;
  scopes: AuthSnapshotScopes;
  catalogVersion: string;
  policyVersion: string;
  sessionId: string;
  deviceId: string;
  activo: boolean;
  lastAuthSyncAt: string;
  authSnapshotVersion: number;
};
