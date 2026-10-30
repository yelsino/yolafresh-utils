import { test } from "node:test";
import assert from "node:assert/strict";
import { assertXmlPeruEnvironmentPreparation, assertXmlPeruEnvironmentTransitionRequest,
  assertXmlPeruEnvironmentTransitionResponse, type XmlPeruEnvironmentPreparation,
  type XmlPeruEnvironmentTransitionRequest, type XmlPeruEnvironmentTransitionResponse } from "../contracts";
import * as fiscalPublic from "../index";

const command: XmlPeruEnvironmentTransitionRequest = { operationId: "opaque operation / 🌱", expectedIssuerRuc: "20123456789",
  expectedConfigurationRevision: "opaque revision @ 🌱", fromEnvironment: "DEMO", toEnvironment: "PRODUCTION" };
const scope = { ok: true as const, provider: "XmlPeru" as const, tenantId: "opaque tenant 🌱",
  issuerRuc: "20123456789", issuerLegalName: "EMISOR SINTETICO", checkedAtMs: 0 };
const configuration = { documentId: "unstructured canonical document 🌱", revision: "opaque revision @ 🌱",
  environment: "DEMO" as const, updatedAtMs: 0 };
const preparation: XmlPeruEnvironmentPreparation = { ...scope, configuration, providerEnvironment: "DEMO",
  targetEnvironment: "PRODUCTION", canTransition: true, credentialReuseReady: true,
  procedures: { pse: "done", ose: null }, pendingOperationId: null };
const completed: XmlPeruEnvironmentTransitionResponse = { ...scope, operationId: command.operationId,
  expectedConfigurationRevision: command.expectedConfigurationRevision,
  fromEnvironment: "DEMO", toEnvironment: "PRODUCTION", status: "COMPLETED",
  configuration: { ...configuration, environment: "PRODUCTION" }, providerEnvironment: "PRODUCTION" };

test("los tres validadores se exportan por el módulo fiscal público", () => {
  assert.equal(fiscalPublic.assertXmlPeruEnvironmentPreparation, assertXmlPeruEnvironmentPreparation);
  assert.equal(fiscalPublic.assertXmlPeruEnvironmentTransitionRequest, assertXmlPeruEnvironmentTransitionRequest);
  assert.equal(fiscalPublic.assertXmlPeruEnvironmentTransitionResponse, assertXmlPeruEnvironmentTransitionResponse);
});

test("el comando conserva identificadores y revisión opacos sin imponer un formato Couch o UUID", () => {
  assert.doesNotThrow(() => assertXmlPeruEnvironmentTransitionRequest(command));
  assert.equal(command.expectedConfigurationRevision, "opaque revision @ 🌱");
  assert.doesNotThrow(() => assertXmlPeruEnvironmentPreparation(preparation));
  assert.doesNotThrow(() => assertXmlPeruEnvironmentTransitionResponse(completed));
});

test("la transición inversa usa el mismo contrato y no representa una reemisión", () => {
  assert.doesNotThrow(() => assertXmlPeruEnvironmentTransitionRequest({ ...command,
    fromEnvironment: "PRODUCTION", toEnvironment: "DEMO" }));
  assert.doesNotThrow(() => assertXmlPeruEnvironmentPreparation({ ...preparation,
    configuration: { ...configuration, environment: "PRODUCTION" }, providerEnvironment: "PRODUCTION",
    targetEnvironment: "DEMO", procedures: { pse: null, ose: null } }));
  assert.doesNotThrow(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed,
    fromEnvironment: "PRODUCTION", toEnvironment: "DEMO", configuration,
    providerEnvironment: "DEMO" }));
});

test("el comando sólo cambia entre dos entornos distintos y exige la revisión del servidor", () => {
  for (const extra of [{ fromEnvironment: "demo" }, { toEnvironment: "PRODUCCION" },
    { fromEnvironment: "DEMO", toEnvironment: "DEMO" }, { expectedConfigurationRevision: "" },
    { expectedConfigurationRevision: " padded " }, { expectedConfigurationRevision: "line\nbreak" },
    { expectedConfigurationRevision: "x".repeat(513) }, { expectedConfigurationRevision: undefined },
    { expectedIssuerRuc: "not-ruc" }, { operationId: "" }, { operationId: "x".repeat(129) }])
    assert.throws(() => assertXmlPeruEnvironmentTransitionRequest({ ...command, ...extra }), /XMLPERU_ENVIRONMENT_REQUEST_INVALID/);
});

test("el cliente no aporta autoridad de tenant, credenciales, afiliación ni firma a esta operación", () => {
  for (const extra of [{ tenantId: "other" }, { actorId: "other" }, { sessionId: "other" },
    { companyId: "other" }, { id: "other" }, { revision: "guessed" }, { expectedCompanyRevision: "guessed" },
    { managementToken: "synthetic-secret" }, { signingToken: "synthetic-secret" }, { solUsername: "synthetic" },
    { solPassword: "synthetic-secret" }, { authorizeProcedures: true }, { providerUrl: "https://invalid.test" },
    { createSigningToken: true }, { emitDocument: true }])
    assert.throws(() => assertXmlPeruEnvironmentTransitionRequest({ ...command, ...extra }),
      (error: unknown) => error instanceof Error && error.message === "XMLPERU_ENVIRONMENT_REQUEST_INVALID");
});

test("preflight no presenta como ejecutable un estado incierto, ocupado o sin credencial reutilizable", () => {
  for (const extra of [{ providerEnvironment: null }, { providerEnvironment: "PRODUCTION" },
    { credentialReuseReady: false }, { pendingOperationId: "opaque pending" }, { targetEnvironment: "DEMO" },
    { procedures: { pse: "pending", ose: null } }, { procedures: { pse: null, ose: null } }])
    assert.throws(() => assertXmlPeruEnvironmentPreparation({ ...preparation, ...extra }), /PREPARATION_INVALID/);
  assert.doesNotThrow(() => assertXmlPeruEnvironmentPreparation({ ...preparation, canTransition: false,
    credentialReuseReady: false, providerEnvironment: null, pendingOperationId: "opaque pending",
    procedures: { pse: "pending", ose: null }, code: "XMLPERU_ENVIRONMENT_PENDING" }));
});

test("el acuse sólo dice COMPLETED cuando proveedor y configuración coinciden en el destino", () => {
  for (const extra of [{ providerEnvironment: null }, { providerEnvironment: "DEMO" },
    { configuration }, { toEnvironment: "DEMO" }, { status: "SUCCESS" }, { status: "SIGNED" }])
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed, ...extra }), /RESPONSE_INVALID/);
});

test("PENDING y REJECTED conservan operación y hechos observados sin fingir éxito ni exigir repetir un PATCH", () => {
  for (const status of ["PENDING", "REJECTED"] as const) {
    assert.doesNotThrow(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed, status,
      configuration, providerEnvironment: null, code: "XMLPERU_ENVIRONMENT_REVIEW_REQUIRED" }));
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed, status }), /RESPONSE_INVALID/);
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed, status, code: undefined }), /RESPONSE_INVALID/);
  }
});

test("la recuperación conserva la revisión original aun cuando la configuración ya cambió", () => {
  const recovered: XmlPeruEnvironmentTransitionResponse = { ...completed,
    configuration: { ...completed.configuration, revision: "new opaque current revision" } };
  assert.doesNotThrow(() => assertXmlPeruEnvironmentTransitionResponse(recovered));
  const replay: XmlPeruEnvironmentTransitionRequest = { operationId: recovered.operationId,
    expectedIssuerRuc: recovered.issuerRuc, expectedConfigurationRevision: recovered.expectedConfigurationRevision,
    fromEnvironment: recovered.fromEnvironment, toEnvironment: recovered.toEnvironment };
  assert.deepEqual(replay, command);
  assert.doesNotThrow(() => assertXmlPeruEnvironmentTransitionRequest(replay));
  for (const expectedConfigurationRevision of [undefined, "", " padded ", "x".repeat(513)])
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse({ ...recovered, expectedConfigurationRevision }), /RESPONSE_INVALID/);
});

test("la respuesta pública es cerrada también en configuración y procedimientos", () => {
  for (const extra of [{ signingToken: "synthetic-secret" }, { managementToken: "synthetic-secret" },
    { solPassword: "synthetic-secret" }, { providerResponse: {} }, { config: {} }, { emissionEnabled: true }]) {
    assert.throws(() => assertXmlPeruEnvironmentPreparation({ ...preparation, ...extra }), /PREPARATION_INVALID/);
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed, ...extra }), /RESPONSE_INVALID/);
  }
  for (const nested of [{ ...configuration, id: configuration.documentId },
    { ...configuration, _id: configuration.documentId }, { ...configuration, signingToken: "synthetic-secret" },
    { ...configuration, updatedAtMs: "2026-01-01" }, { ...configuration, revision: "" }]) {
    assert.throws(() => assertXmlPeruEnvironmentPreparation({ ...preparation, configuration: nested }), /PREPARATION_INVALID/);
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed, configuration: nested }), /RESPONSE_INVALID/);
  }
  for (const procedures of [{ pse: "done", ose: null, secret: "synthetic-secret" }, { pse: "unknown", ose: null }, { pse: "done" }])
    assert.throws(() => assertXmlPeruEnvironmentPreparation({ ...preparation, procedures }), /PREPARATION_INVALID/);
});

test("los diagnósticos son códigos controlados y el error nunca devuelve contenido del proveedor", () => {
  for (const code of ["token synthetic-secret", "XMLPERU_AFFILIATION_PENDING", "XMLPERU_ENVIRONMENT_", "xmlperu_environment_pending", "XMLPERU_ENVIRONMENT_X\nSECRET"]) {
    assert.throws(() => assertXmlPeruEnvironmentPreparation({ ...preparation, code }),
      (error: unknown) => error instanceof Error && error.message === "XMLPERU_ENVIRONMENT_PREPARATION_INVALID");
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed, code }),
      (error: unknown) => error instanceof Error && error.message === "XMLPERU_ENVIRONMENT_RESPONSE_INVALID");
  }
});

test("los timestamps y campos de identidad conservan tipos JSON inequívocos y admiten epoch cero", () => {
  for (const extra of [{ checkedAtMs: NaN }, { checkedAtMs: Infinity }, { checkedAtMs: -1 },
    { checkedAtMs: 0.5 }, { checkedAtMs: "0" }, { tenantId: " padded " }, { issuerRuc: "2012345678" },
    { issuerLegalName: "line\nbreak" }, { provider: "other" }, { ok: false }]) {
    assert.throws(() => assertXmlPeruEnvironmentPreparation({ ...preparation, ...extra }), /PREPARATION_INVALID/);
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse({ ...completed, ...extra }), /RESPONSE_INVALID/);
  }
  assert.doesNotThrow(() => assertXmlPeruEnvironmentPreparation(preparation));
  assert.doesNotThrow(() => assertXmlPeruEnvironmentTransitionResponse(completed));
});

test("los campos requeridos no se satisfacen por herencia ni por un sobre parcial", () => {
  const inherited = Object.assign(Object.create(command), {});
  assert.throws(() => assertXmlPeruEnvironmentTransitionRequest(inherited), /REQUEST_INVALID/);
  for (const value of [null, undefined, [], {}, { ok: true }]) {
    assert.throws(() => assertXmlPeruEnvironmentTransitionRequest(value), /REQUEST_INVALID/);
    assert.throws(() => assertXmlPeruEnvironmentPreparation(value), /PREPARATION_INVALID/);
    assert.throws(() => assertXmlPeruEnvironmentTransitionResponse(value), /RESPONSE_INVALID/);
  }
});
