import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_PERMISSION_ALIASES } from "../catalogs/permission-alias.catalog";
import { AUTH_PERMISSIONS } from "../catalogs/permission.catalog";
import { PERMISSION_METADATA } from "../metadata/permission-metadata.catalog";

const AUTH_PERMISSION_SET = new Set<string>(AUTH_PERMISSIONS);

test("AUTH_PERMISSIONS no tiene colisiones", () => {
  const uniquePermissions = new Set(AUTH_PERMISSIONS);
  assert.equal(uniquePermissions.size, AUTH_PERMISSIONS.length);
});

test("todo permiso tiene metadata completa", () => {
  for (const permission of AUTH_PERMISSIONS) {
    const metadata = PERMISSION_METADATA[permission];

    assert.ok(metadata, `Falta metadata para ${permission}`);
    assert.equal(metadata.id, permission);
    assert.ok(metadata.modulo.length > 0);
    assert.ok(metadata.recurso.length > 0);
    assert.ok(metadata.accion.length > 0);
    assert.ok(["low", "medium", "high", "critical"].includes(metadata.criticidad));
  }
});

test("aliases canónicos expanden solo a permisos válidos", () => {
  for (const [alias, permissions] of Object.entries(AUTH_PERMISSION_ALIASES)) {
    assert.ok(permissions.length > 0, `Alias ${alias} no debe expandir vacío`);

    for (const permission of permissions) {
      assert.ok(AUTH_PERMISSION_SET.has(permission), `${alias} expandió permiso inválido ${permission}`);
    }
  }
});

test("wildcard global expande a catálogo completo", () => {
  assert.deepEqual([...AUTH_PERMISSION_ALIASES["*"]], [...AUTH_PERMISSIONS]);
});
