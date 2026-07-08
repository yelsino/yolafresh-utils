import type { AUTH_ALIAS_GRANTS } from "../catalogs/permission-alias.catalog";
import type { AuthPermission } from "./auth-permission.contract";

export type AuthAliasGrant = (typeof AUTH_ALIAS_GRANTS)[number];

export type AuthGrant = AuthPermission | AuthAliasGrant;
