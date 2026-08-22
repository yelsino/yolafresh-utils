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
    assert.ok(
      ["low", "medium", "high", "critical"].includes(metadata.criticidad),
    );
  }
});

test("aliases canónicos expanden solo a permisos válidos", () => {
  for (const [alias, permissions] of Object.entries(AUTH_PERMISSION_ALIASES)) {
    assert.ok(permissions.length > 0, `Alias ${alias} no debe expandir vacío`);

    for (const permission of permissions) {
      assert.ok(
        AUTH_PERMISSION_SET.has(permission),
        `${alias} expandió permiso inválido ${permission}`,
      );
    }
  }
});

test("wildcard global expande a catálogo completo", () => {
  assert.deepEqual([...AUTH_PERMISSION_ALIASES["*"]], [...AUTH_PERMISSIONS]);
});

test("catalogo gastronomico separa salon, cocina, barra y caja", () => {
  assert.ok(AUTH_PERMISSION_SET.has("restaurante:pedido:editar"));
  assert.ok(
    AUTH_PERMISSION_SET.has("restaurante:preparacion_cocina:actualizar"),
  );
  assert.ok(
    AUTH_PERMISSION_SET.has("restaurante:preparacion_barra:actualizar"),
  );
  assert.ok(AUTH_PERMISSION_SET.has("restaurante:cuenta:cobrar"));
  assert.equal(
    PERMISSION_METADATA["restaurante:cuenta:cobrar"].criticidad,
    "critical",
  );
});

test("pedido comercial separa edición, aprobación y anulación", () => {
  assert.ok(AUTH_PERMISSION_SET.has("ventas:pedido:editar"));
  assert.ok(AUTH_PERMISSION_SET.has("ventas:pedido:aprobar"));
  assert.ok(AUTH_PERMISSION_SET.has("ventas:pedido:anular"));
  assert.equal(
    PERMISSION_METADATA["ventas:pedido:anular"].criticidad,
    "critical",
  );
});

test("administrar almacenes es un permiso crítico y auditable", () => {
  const permission = "inventario:almacen:administrar";
  assert.ok(AUTH_PERMISSION_SET.has(permission));
  assert.equal(PERMISSION_METADATA[permission].criticidad, "critical");
  assert.equal(PERMISSION_METADATA[permission].auditable, true);
  assert.equal(PERMISSION_METADATA[permission].requiresActiveSession, true);
});

test("operaciones de inventario tienen permisos atomicos y metadata auditable", () => {
  const esperados = [
    "inventario:politica:administrar",
    "inventario:merma:ver",
    "inventario:merma:crear",
    "inventario:merma:aprobar",
    "inventario:transferencia:ver",
    "inventario:transferencia:crear",
    "inventario:transferencia:enviar",
    "inventario:transferencia:recibir",
    "inventario:transferencia:cancelar",
  ] as const;

  for (const permission of esperados) {
    assert.ok(AUTH_PERMISSION_SET.has(permission));
    assert.equal(PERMISSION_METADATA[permission].auditable, true);
    assert.equal(PERMISSION_METADATA[permission].requiresActiveSession, true);
  }

  assert.equal(
    PERMISSION_METADATA["inventario:politica:administrar"].criticidad,
    "critical",
  );
  assert.equal(
    PERMISSION_METADATA["inventario:merma:aprobar"].criticidad,
    "critical",
  );
  assert.equal(
    PERMISSION_METADATA["inventario:transferencia:cancelar"].criticidad,
    "critical",
  );
});
