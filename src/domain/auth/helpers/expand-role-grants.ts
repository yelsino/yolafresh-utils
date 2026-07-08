import { AUTH_ROLE_DEFINITIONS } from "../catalogs/role.catalog";
import type { AuthGrant } from "../contracts/auth-grant.contract";

export function expandRoleGrants(roleIds: readonly string[]): AuthGrant[] {
  return [
    ...new Set(
      roleIds.flatMap((roleId) => {
        const definition = AUTH_ROLE_DEFINITIONS[roleId as keyof typeof AUTH_ROLE_DEFINITIONS];
        return definition?.grants ?? [];
      }),
    ),
  ];
}
