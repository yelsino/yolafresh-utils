import type { AuthPermission } from "../contracts/auth-permission.contract";
import { AUTH_PERMISSIONS } from "../catalogs/permission.catalog";

export function listAllPermissions(): AuthPermission[] {
  return [...AUTH_PERMISSIONS];
}
