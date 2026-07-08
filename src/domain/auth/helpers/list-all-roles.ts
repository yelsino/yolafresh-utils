import type { RoleDefinition } from "../contracts/auth-role.contract";
import { AUTH_ROLE_DEFINITIONS } from "../catalogs/role.catalog";

export function listAllRoles(): RoleDefinition[] {
  return Object.values(AUTH_ROLE_DEFINITIONS);
}
