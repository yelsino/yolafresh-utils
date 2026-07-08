import assert from "node:assert/strict";
import test from "node:test";

test("root export publica surface auth esperada", () => {
  // Self-reference prueba export real del paquete compilado.
  const pkg = require("yola-fresh-utils") as Record<string, unknown>;

  assert.ok(Array.isArray(pkg.AUTH_PERMISSIONS));
  assert.ok(typeof pkg.AUTH_ROLE_DEFINITIONS === "object");
  assert.ok(typeof pkg.PERMISSION_METADATA === "object");
  assert.equal(typeof pkg.expandGrant, "function");
  assert.equal(typeof pkg.expandGrants, "function");
  assert.equal(typeof pkg.resolveRolePermissions, "function");
  assert.equal(typeof pkg.getCatalogVersion, "function");
});

test("subpath auth publica misma surface base", () => {
  const authPkg = require("yola-fresh-utils/auth") as Record<string, unknown>;

  assert.ok(Array.isArray(authPkg.AUTH_PERMISSIONS));
  assert.ok(typeof authPkg.AUTH_ROLE_DEFINITIONS === "object");
  assert.ok(typeof authPkg.PERMISSION_METADATA === "object");
  assert.equal(typeof authPkg.expandGrant, "function");
  assert.equal(typeof authPkg.expandGrants, "function");
  assert.equal(typeof authPkg.resolveRolePermissions, "function");
  assert.equal(typeof authPkg.getCatalogVersion, "function");
});

test("root y subpath auth comparten versión de catálogo", () => {
  const pkg = require("yola-fresh-utils") as Record<string, unknown>;
  const authPkg = require("yola-fresh-utils/auth") as Record<string, unknown>;

  assert.equal(pkg.AUTH_CATALOG_VERSION, authPkg.AUTH_CATALOG_VERSION);
});
