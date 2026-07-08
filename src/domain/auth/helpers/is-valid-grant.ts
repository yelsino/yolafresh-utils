import { AUTH_ALIAS_GRANTS } from "../catalogs/permission-alias.catalog";
import { AUTH_PERMISSIONS } from "../catalogs/permission.catalog";

const AUTH_GRANT_SET = new Set<string>([...AUTH_PERMISSIONS, ...AUTH_ALIAS_GRANTS]);

export function isValidGrant(grant: string): boolean {
  return AUTH_GRANT_SET.has(grant);
}
