import { AUTH_PERMISSION_ALIASES } from "../catalogs/permission-alias.catalog";
import { AUTH_PERMISSIONS } from "../catalogs/permission.catalog";
import type { AuthGrant } from "../contracts/auth-grant.contract";
import type { AuthPermission } from "../contracts/auth-permission.contract";

export function expandGrant(grant: AuthGrant): AuthPermission[] {
  if ((AUTH_PERMISSIONS as readonly string[]).includes(grant)) {
    return [grant as AuthPermission];
  }

  const expanded = AUTH_PERMISSION_ALIASES[grant];
  return expanded ? [...expanded] as AuthPermission[] : [];
}
