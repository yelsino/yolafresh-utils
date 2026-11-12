import assert from "node:assert/strict";
import test from "node:test";
import { assertFiscalAmazoniaSaleFacts, assertFiscalAmazoniaLineDecisions,
  projectFiscalAmazoniaIssuerCommand } from "../contracts";

const location = { status: "CONFIRMED", ubigeo: "120601", evidenceRef: "constancia/ubicación" };

test("acepta hechos completos y diferencia el consumo pendiente, parcial o con destinos separados", () => {
  for (const consumption of [location, { status: "PENDING" },
    { status: "OUTSIDE", evidenceRef: "destino declarado" },
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

test("los fundamentos por línea son exclusivos, coherentes y no aceptan duplicados", () => {
  const rows = [
    { lineId: "g", basis: "LEY_27037_ART_13_1_A", ordinaryCategory: "GRAVADA", ordinaryTaxRateBasisPoints: 1800 },
    { lineId: "e", basis: "APPENDIX_I", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0 },
    { lineId: "o", basis: "ORDINARY_EXEMPTION", ordinaryCategory: "EXONERADA", ordinaryTaxRateBasisPoints: 0 },
    { lineId: "i", basis: "ORDINARY_UNAFFECTED", ordinaryCategory: "INAFECTA", ordinaryTaxRateBasisPoints: 0 },
  ];
  assert.doesNotThrow(() => assertFiscalAmazoniaLineDecisions(rows));
  for (const invalid of [[], [...rows, rows[0]], [{ ...rows[0], basis: "APPENDIX_I" }],
    [{ ...rows[1], ordinaryTaxRateBasisPoints: 1800 }], [{ ...rows[3], basis: "LEY_27037_ART_13_1_A" }]])
    assert.throws(() => assertFiscalAmazoniaLineDecisions(invalid), /LINE_DECISIONS_INVALID/);
});

test("el sobre Amazonía conserva el registro no aplicable de persona natural sin decidir su elegibilidad", () => {
  const command = { subject: "AMAZONIA", action: "SAVE_DRAFT", operationId: "proposal", expectedRevision: null,
    reason: "Declaración del emisor de prueba", assessment: { status: "ENABLED", environment: "DEMO",
      effectiveFrom: "2026-11-11", assessedOn: "2026-11-11", evidenceRefs: ["assessment"], requirements: {
        domicileAndHeadOffice: "MET", publicRegistration: "NOT_APPLICABLE",
        fixedAssets: { status: "MET", basisPoints: 7000, allProductionMeansInZone: true, cutoffOn: "2025-12-31" },
        production: { status: "NOT_APPLICABLE" },
      } } };
  assert.deepEqual(projectFiscalAmazoniaIssuerCommand(command), command);
  assert.throws(() => projectFiscalAmazoniaIssuerCommand({ ...command, eligible: true }), /CONFIGURATION_INVALID/);
});
