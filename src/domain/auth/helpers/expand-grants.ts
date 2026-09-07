import type { AuthGrant } from "../contracts/auth-grant.contract";
import type { AuthPermission } from "../contracts/auth-permission.contract";
import { expandGrant } from "./expand-grant";

export function expandGrants(grants: readonly AuthGrant[]): AuthPermission[] {
  const expanded: AuthPermission[] = [];
  for (const grant of grants) {
    expanded.push(...expandGrant(grant));
  }
  return [...new Set(expanded)];
}
