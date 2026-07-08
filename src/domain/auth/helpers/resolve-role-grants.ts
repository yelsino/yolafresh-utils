import type { AuthGrant } from "../contracts/auth-grant.contract";
import { expandRoleGrants } from "./expand-role-grants";

export function resolveRoleGrants(roleIds: readonly string[]): AuthGrant[] {
  return expandRoleGrants(roleIds);
}
