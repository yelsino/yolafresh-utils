import { AUTH_ROLE_DEFINITIONS } from "../catalogs/role.catalog";
import type { RoleDefinition } from "../contracts/auth-role.contract";

export function getRoleDefinition(roleId: string): RoleDefinition | undefined {
  return AUTH_ROLE_DEFINITIONS[roleId as keyof typeof AUTH_ROLE_DEFINITIONS];
}
