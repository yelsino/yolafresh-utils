import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_CATALOG_VERSION } from "../version/auth-catalog.version";
import { expandGrant } from "../helpers/expand-grant";
import { expandGrants } from "../helpers/expand-grants";
import { getCatalogVersion } from "../helpers/get-catalog-version";
import { getPermissionDefinition } from "../helpers/get-permission-definition";
import { getRoleDefinition } from "../helpers/get-role-definition";
import { isSystemAdminRole } from "../helpers/is-system-admin-role";
import { isValidGrant } from "../helpers/is-valid-grant";
import { isValidPermission } from "../helpers/is-valid-permission";
import { listAllPermissions } from "../helpers/list-all-permissions";
import { listAllRoles } from "../helpers/list-all-roles";
import { resolveRoleGrants } from "../helpers/resolve-role-grants";
import { resolveRolePermissions } from "../helpers/resolve-role-permissions";
import { AUTH_PERMISSIONS } from "../catalogs/permission.catalog";

test("expandGrant devuelve permiso atómico sin alterar", () => {
  assert.deepEqual(expandGrant("ventas:venta:ver"), ["ventas:venta:ver"]);
});

test("expandGrant expande alias de módulo y wildcard total", () => {
  const ventas = expandGrant("ventas:*");
  const all = expandGrant("*");

  assert.ok(ventas.includes("ventas:venta:ver"));
  assert.ok(ventas.includes("ventas:pedido:aprobar"));
  assert.equal(all.length, AUTH_PERMISSIONS.length);
});

test("expandGrants deduplica permisos", () => {
  const expanded = expandGrants(["ventas:*", "ventas:venta:ver"]);
  const matches = expanded.filter((permission) => permission === "ventas:venta:ver");

  assert.equal(matches.length, 1);
});

test("getRoleDefinition y resolveRolePermissions resuelven roles base", () => {
  const supervisor = getRoleDefinition("supervisor");
  const grants = resolveRoleGrants(["supervisor"]);
  const permissions = resolveRolePermissions(["supervisor"]);

  assert.ok(supervisor);
  assert.ok(grants.includes("ventas:*"));
  assert.ok(permissions.includes("ventas:venta:ver"));
  assert.ok(permissions.includes("inventario:stock:ver"));
});

test("admin global resuelve wildcard total", () => {
  const permissions = resolveRolePermissions(["admin"]);

  assert.equal(isSystemAdminRole(["admin"]), true);
  assert.equal(permissions.length, AUTH_PERMISSIONS.length);
});

test("validadores detectan permiso y grant inválidos", () => {
  assert.equal(isValidPermission("ventas:venta:ver"), true);
  assert.equal(isValidPermission("ventas:sucursal-lima:ver"), false);
  assert.equal(isValidGrant("ventas:*"), true);
  assert.equal(isValidGrant("ventas:sucursal-lima:*"), false);
});

test("getCatalogVersion expone versión vigente", () => {
  assert.equal(getCatalogVersion(), AUTH_CATALOG_VERSION);
});

test("helpers de listado y metadata exponen catálogo oficial", () => {
  const allPermissions = listAllPermissions();
  const allRoles = listAllRoles();
  const permissionDefinition = getPermissionDefinition("ventas:venta:ver");

  assert.equal(allPermissions.length, AUTH_PERMISSIONS.length);
  assert.ok(allRoles.some((role) => role.id === "admin"));
  assert.equal(permissionDefinition?.id, "ventas:venta:ver");
  assert.equal(permissionDefinition?.modulo, "ventas");
});
