import assert from "node:assert/strict";
import test from "node:test";
import { assertFiscalAmazoniaSaleFacts } from "../contracts";

const location = { status: "CONFIRMED", ubigeo: "120601", evidenceRef: "constancia/ubicación" };

test("acepta hechos completos y diferencia el consumo pendiente, parcial o con destinos separados", () => {
  for (const consumption of [location, { status: "PENDING" },
    { status: "PARTIAL_OUTSIDE", evidenceRef: "pedido A" }, { status: "SPLIT", evidenceRef: "pedido B" }]) {
    assert.doesNotThrow(() => assertFiscalAmazoniaSaleFacts({ transfer: location, consumption }));
  }
});

test("rechaza afirmaciones fiscales del cliente y ubicaciones sin evidencia válida", () => {
  for (const value of [
    { transfer: location, consumption: location, isEligible: true },
    { transfer: { ...location, ubigeo: "000000" }, consumption: location },
    { transfer: { status: "PENDING", ubigeo: "120601" }, consumption: location },
    { transfer: location, consumption: { ...location, evidenceRef: "   " } },
    { transfer: location, consumption: { status: "PARTIAL_OUTSIDE" } },
  ]) assert.throws(() => assertFiscalAmazoniaSaleFacts(value), /FISCAL_AMAZONIA_FACTS_INVALID/);
});
