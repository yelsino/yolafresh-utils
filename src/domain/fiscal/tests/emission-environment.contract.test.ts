import { test } from "node:test";
import assert from "node:assert/strict";
import { isFiscalCompanyEnabled, readFiscalEmissionEnvironment, type ConfigEmpresa,
  type EntornoEmisionFiscal } from "../../../index";

test("el entorno se lee del contrato fiscal, no del tenant ni del flag", () => {
  for (const tenantId of ["yolafresh__dev", "yolafresh__pe__001", "empresa-opaca"]) {
    for (const entornoEmision of ["DEMO", "PRODUCCION"] as const) {
      const fiscal: Pick<ConfigEmpresa["fiscal"], "entornoEmision" | "facturacionElectronicaEnabled"> = {
        entornoEmision, facturacionElectronicaEnabled: false,
      };
      assert.equal(readFiscalEmissionEnvironment({ tenantId, fiscal }), entornoEmision);
      assert.equal(isFiscalCompanyEnabled({ fiscal }), false);
    }
  }
});

test("ninguna configuración ausente, inválida o antigua elige un entorno", () => {
  for (const config of [null, undefined, [], {}, { fiscal: null }, { fiscal: [] },
    { fiscal: { facturacionElectronicaEnabled: true } },
    { tenantId: "yolafresh__dev", fiscal: { demo: { enabled: true } } },
    ...["demo", "production", "", 1, true, {}, []].map(entornoEmision => ({ fiscal: { entornoEmision } }))]) {
    assert.equal(readFiscalEmissionEnvironment(config), null);
  }
});

test("el contrato público solo admite los dos entornos fiscales", () => {
  const environment: EntornoEmisionFiscal = "PRODUCCION";
  assert.equal(environment, "PRODUCCION");
  // @ts-expect-error no existe un entorno de producción simulada que oculte Demo
  const invalid: EntornoEmisionFiscal = "PRODUCCION_SIMULADA";
  assert.ok(invalid);
});
