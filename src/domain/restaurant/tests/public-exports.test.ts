import assert from "node:assert/strict";
import test from "node:test";

import {
  dineroRestaurante,
  puedeTransicionarSesionRestaurante,
} from "../index";
import type {
  ComandoRestaurante,
  CuentaConsumoRestaurante,
  MesaRestaurante,
  PedidoRestaurante,
  ProductoRestaurante,
  ResultadoComandoRestaurante,
} from "../index";

test("surface restaurant exporta un solo contrato canonico", () => {
  const exportedTypesCompile: [
    MesaRestaurante?,
    ProductoRestaurante?,
    CuentaConsumoRestaurante?,
    PedidoRestaurante?,
    ComandoRestaurante?,
    ResultadoComandoRestaurante?,
  ] = [];
  assert.equal(exportedTypesCompile.length, 0);
  assert.equal(dineroRestaurante(100).minorUnits, 100);
  assert.equal(puedeTransicionarSesionRestaurante("ABIERTA", "EN_ATENCION"), true);
});
