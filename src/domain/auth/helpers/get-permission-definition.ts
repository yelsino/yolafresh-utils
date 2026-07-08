import type { AuthPermission, PermissionDefinition } from "../contracts/auth-permission.contract";
import { PERMISSION_METADATA } from "../metadata/permission-metadata.catalog";

export function getPermissionDefinition(
  permission: AuthPermission,
): PermissionDefinition | undefined {
  return PERMISSION_METADATA[permission];
}
