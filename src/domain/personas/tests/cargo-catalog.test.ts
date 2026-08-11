import assert from "node:assert/strict";
import test from "node:test";

import {
  CargosPersonal,
  CATALOGO_CARGOS_PERSONAL,
  esCargoPersonalDisponible,
  listarCargosPersonalDisponibles,
} from "../contracts";
import { CARGOS_ROLES_SUGERIDOS } from "../contracts/rbac-catalogs.contract";
import { RolesPredefinidos } from "../contracts/roles.contract";

const CARGOS_GASTRONOMICOS = [
  CargosPersonal.ANFITRION,
  CargosPersonal.MOZO_MESERO,
  CargosPersonal.CAPITAN_SALON,
  CargosPersonal.COCINERO,
  CargosPersonal.JEFE_COCINA,
  CargosPersonal.BARTENDER_ENCARGADO_BARRA,
];

test("el catálogo define exactamente todos los cargos publicados", () => {
  assert.deepEqual(
    [...CATALOGO_CARGOS_PERSONAL.map((item) => item.key)].sort(),
    [...Object.values(CargosPersonal)].sort(),
  );
  assert.equal(
    new Set(CATALOGO_CARGOS_PERSONAL.map((item) => item.key)).size,
    CATALOGO_CARGOS_PERSONAL.length,
  );
});

test("retail y empresas legacy ocultan cargos gastronómicos", () => {
  const retail = listarCargosPersonalDisponibles({
    vertical: "RETAIL",
    capacidades: ["VENTA_MOSTRADOR", "CAJA"],
  });
  const legacy = listarCargosPersonalDisponibles(null);

  for (const cargo of CARGOS_GASTRONOMICOS) {
    assert.equal(retail.some((item) => item.key === cargo), false);
    assert.equal(legacy.some((item) => item.key === cargo), false);
  }
  assert.equal(
    retail.some((item) => item.key === CargosPersonal.REPARTIDOR),
    false,
  );
});

test("cargos gastronomicos sugieren roles gastronomicos y no roles Retail", () => {
  assert.deepEqual(CARGOS_ROLES_SUGERIDOS[CargosPersonal.MOZO_MESERO], [
    RolesPredefinidos.GASTRONOMIA_MESERO,
  ]);
  assert.deepEqual(CARGOS_ROLES_SUGERIDOS[CargosPersonal.COCINERO], [
    RolesPredefinidos.GASTRONOMIA_COCINERO,
  ]);
  assert.deepEqual(
    CARGOS_ROLES_SUGERIDOS[CargosPersonal.BARTENDER_ENCARGADO_BARRA],
    [RolesPredefinidos.GASTRONOMIA_BARRA],
  );
  assert.deepEqual(CARGOS_ROLES_SUGERIDOS[CargosPersonal.REPARTIDOR], []);
});

test("gastronomía expone salón, cocina y barra, pero no reparto sin capacidad", () => {
  const cargos = listarCargosPersonalDisponibles({
    vertical: "GASTRONOMIA",
    capacidades: ["PEDIDOS", "MESAS", "COMANDAS", "CAJA"],
  });

  for (const cargo of CARGOS_GASTRONOMICOS) {
    assert.equal(cargos.some((item) => item.key === cargo), true);
  }
  assert.equal(
    cargos.some((item) => item.key === CargosPersonal.REPARTIDOR),
    false,
  );
});

test("repartidor depende de delivery o rutas de reparto en cualquier vertical", () => {
  assert.equal(
    esCargoPersonalDisponible(CargosPersonal.REPARTIDOR, {
      vertical: "RETAIL",
      capacidades: ["DELIVERY"],
    }),
    true,
  );
  assert.equal(
    esCargoPersonalDisponible(CargosPersonal.REPARTIDOR, {
      vertical: "GASTRONOMIA",
      capacidades: ["RUTAS_REPARTO"],
    }),
    true,
  );
  assert.equal(
    esCargoPersonalDisponible(CargosPersonal.REPARTIDOR, {
      vertical: "GASTRONOMIA",
      capacidades: ["MESAS", "COMANDAS"],
    }),
    false,
  );
});
