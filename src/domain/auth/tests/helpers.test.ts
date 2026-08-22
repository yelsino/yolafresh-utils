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
import { listarRolesAuthDisponibles } from "../catalogs/role.catalog";

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

test("cliente es un rol oficial sin permisos del ERP", () => {
  const cliente = getRoleDefinition("cliente");

  assert.ok(cliente);
  assert.equal(cliente.id, "cliente");
  assert.deepEqual(cliente.grants, []);
  assert.deepEqual(resolveRolePermissions(["cliente"]), []);
});

test("admin global resuelve wildcard total", () => {
  const permissions = resolveRolePermissions(["admin"]);

  assert.equal(isSystemAdminRole(["admin"]), true);
  assert.equal(permissions.length, AUTH_PERMISSIONS.length);
});

test("inventario puede editar imagenes de producto", () => {
  const permissions = resolveRolePermissions(["inventario"]);
  assert.ok(permissions.includes("productos:producto:editar_imagen"));
  assert.ok(permissions.includes("inventario:almacen:administrar"));
  assert.ok(permissions.includes("inventario:politica:administrar"));
  assert.ok(permissions.includes("inventario:merma:aprobar"));
  assert.ok(permissions.includes("inventario:transferencia:recibir"));
  assert.ok(permissions.includes("inventario:transferencia:cancelar"));
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

test("roles gastronomicos expanden permisos sin heredar ventas Retail", () => {
  const mesero = resolveRolePermissions(["gastronomia-mesero"]);
  const cocina = resolveRolePermissions(["gastronomia-cocinero"]);
  const barra = resolveRolePermissions(["gastronomia-barra"]);
  const cajero = resolveRolePermissions(["cajero"]);

  assert.ok(mesero.includes("restaurante:pedido:editar"));
  assert.ok(mesero.includes("restaurante:ronda:enviar"));
  assert.equal(mesero.includes("ventas:venta:crear"), false);
  assert.ok(cocina.includes("restaurante:preparacion_cocina:actualizar"));
  assert.equal(cocina.includes("restaurante:preparacion_barra:actualizar"), false);
  assert.ok(barra.includes("restaurante:preparacion_barra:actualizar"));
  assert.equal(barra.includes("restaurante:preparacion_cocina:actualizar"), false);
  assert.ok(cajero.includes("restaurante:cuenta:cobrar"));
  assert.equal(cajero.includes("restaurante:pedido:editar"), false);
});

test("catalogo de roles oculta gastronomia fuera de su vertical", () => {
  const retail = listarRolesAuthDisponibles({
    vertical: "RETAIL",
    capacidades: ["VENTA_MOSTRADOR", "CAJA"],
  });
  const gastronomia = listarRolesAuthDisponibles({
    vertical: "GASTRONOMIA",
    capacidades: ["PEDIDOS", "MESAS", "COMANDAS", "CAJA"],
  });

  assert.equal(retail.some((role) => role.id === "gastronomia-mesero"), false);
  assert.equal(retail.some((role) => role.id === "gastronomia-cocinero"), false);
  assert.equal(gastronomia.some((role) => role.id === "gastronomia-mesero"), true);
  assert.equal(gastronomia.some((role) => role.id === "gastronomia-cocinero"), true);
  assert.equal(gastronomia.some((role) => role.id === "cajero"), true);
});
