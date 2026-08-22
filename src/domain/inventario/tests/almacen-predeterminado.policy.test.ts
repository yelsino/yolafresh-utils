import assert from "node:assert/strict";
import test from "node:test";

import { TipoAlmacenEnum, type Almacen } from "../contracts";
import { resolverAlmacenPredeterminado } from "../services";

const warehouse = (id: string, activo = true): Almacen => ({
  _id: id,
  type: "almacen",
  nombre: `Almacén ${id}`,
  tipo: TipoAlmacenEnum.TIENDA,
  activo,
  permitirLotes: true,
  permitirNegativos: false,
  createdAt: 1,
  updatedAt: 1,
});

test("sin almacenes disponibles no inventa una selección", () => {
  const result = resolverAlmacenPredeterminado([]);
  assert.equal(result.almacenId, null);
  assert.equal(result.origen, "SIN_ALMACENES");
  assert.equal(result.requiereSeleccion, false);
});

test("un único almacén activo se deriva automáticamente", () => {
  const result = resolverAlmacenPredeterminado([
    warehouse("activo"),
    warehouse("inactivo", false),
  ]);
  assert.equal(result.almacenId, "activo");
  assert.equal(result.origen, "UNICO_DISPONIBLE");
  assert.equal(result.requiereSeleccion, false);
});

test("varios almacenes sin configuración requieren selección explícita", () => {
  const result = resolverAlmacenPredeterminado([
    warehouse("uno"),
    warehouse("dos"),
  ]);
  assert.equal(result.almacenId, null);
  assert.equal(result.origen, "SELECCION_REQUERIDA");
  assert.equal(result.requiereSeleccion, true);
});

test("varios almacenes usan exclusivamente la referencia configurada", () => {
  const result = resolverAlmacenPredeterminado(
    [warehouse("uno"), warehouse("dos")],
    "dos",
  );
  assert.equal(result.almacenId, "dos");
  assert.equal(result.origen, "CONFIGURADO");
  assert.equal(result.requiereSeleccion, false);
});

test("una referencia inactiva o inexistente falla cerrada", () => {
  const result = resolverAlmacenPredeterminado(
    [warehouse("uno"), warehouse("dos"), warehouse("viejo", false)],
    "viejo",
  );
  assert.equal(result.almacenId, null);
  assert.equal(result.origen, "SELECCION_REQUERIDA");
  assert.equal(result.configuracionInvalida, true);
});
