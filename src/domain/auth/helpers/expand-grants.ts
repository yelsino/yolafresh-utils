import type { AuthGrant } from "../contracts/auth-grant.contract";
import type { AuthPermission } from "../contracts/auth-permission.contract";
import { expandGrant } from "./expand-grant";

export function expandGrants(grants: readonly AuthGrant[]): AuthPermission[] {
  return [...new Set(grants.flatMap((grant) => expandGrant(grant)))];
}
