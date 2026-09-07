import { AUTH_ROLE_DEFINITIONS } from "../catalogs/role.catalog";
import type { AuthGrant } from "../contracts/auth-grant.contract";

export function expandRoleGrants(roleIds: readonly string[]): AuthGrant[] {
  const grants: AuthGrant[] = [];
  for (const roleId of roleIds) {
    const definition =
      AUTH_ROLE_DEFINITIONS[roleId as keyof typeof AUTH_ROLE_DEFINITIONS];
    grants.push(...(definition?.grants ?? []));
  }
  return [...new Set(grants)];
}
