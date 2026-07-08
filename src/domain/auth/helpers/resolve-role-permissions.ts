import type { AuthPermission } from "../contracts/auth-permission.contract";
import { expandGrants } from "./expand-grants";
import { expandRoleGrants } from "./expand-role-grants";

export function resolveRolePermissions(roleIds: readonly string[]): AuthPermission[] {
  return expandGrants(expandRoleGrants(roleIds));
}
