import { AUTH_PERMISSIONS } from "../catalogs/permission.catalog";

const AUTH_PERMISSION_SET = new Set<string>(AUTH_PERMISSIONS);

export function isValidPermission(permission: string): boolean {
  return AUTH_PERMISSION_SET.has(permission);
}
