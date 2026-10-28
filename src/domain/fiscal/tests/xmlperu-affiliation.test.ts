import { test } from "node:test";
import assert from "node:assert/strict";
import { assertXmlPeruAffiliationRequest, assertXmlPeruAffiliationResponse,
  type XmlPeruAffiliationResponse } from "../contracts";

const demo = { operationId: "opaque-operation", expectedIssuerRuc: "20123456789", environment: "DEMO" };
const response: XmlPeruAffiliationResponse = { ok: true, provider: "XmlPeru", tenantId: "opaque-tenant",
  issuerRuc: "20123456789", issuerLegalName: "EMISOR SINTETICO", environment: "PRODUCTION", checkedAtMs: 12,
  status: "AFFILIATED", managementCredentialConfigured: true, signingCredentialConfigured: true, companyRegistered: true,
  procedures: { pse: "done", ose: null }, signing: "provider", destination: "sunat" };

test("el registro Demo conserva compatibilidad sin SOL y nunca implica autorización tributaria", () => {
  assert.doesNotThrow(() => assertXmlPeruAffiliationRequest(demo));
  for (const extra of [{ solUsername: "synthetic" }, { solPassword: "synthetic" }, { authorizeProcedures: true },
    { solPassword: undefined }, { authorizeProcedures: false }]) {
    assert.throws(() => assertXmlPeruAffiliationRequest({ ...demo, ...extra }), /DEMO_SOL_FORBIDDEN/);
  }
});

test("la autorización SUNAT explícita admite empresa vinculada Demo sin cambiar entorno", () => {
  const command = { ...demo, action: "AUTHORIZE_SUNAT", solUsername: "synthetic",
    solPassword: " literal password ", authorizeProcedures: true };
  assert.doesNotThrow(() => assertXmlPeruAffiliationRequest(command));
  assert.equal(command.environment, "DEMO");
  assert.equal(command.solPassword, " literal password ");
  for (const extra of [{ authorizeProcedures: undefined }, { authorizeProcedures: false },
    { solUsername: "" }, { solPassword: "" }, { solUsername: undefined }, { solPassword: undefined }])
    assert.throws(() => assertXmlPeruAffiliationRequest({ ...command, ...extra }), /SUNAT_AUTHORIZATION_REQUIRED/);
});

test("la misma acción explícita exige SOL y consentimiento en Producción", () => {
  const command = { ...demo, environment: "PRODUCTION", action: "AUTHORIZE_SUNAT",
    solUsername: "synthetic", solPassword: "synthetic", authorizeProcedures: true };
  assert.doesNotThrow(() => assertXmlPeruAffiliationRequest(command));
  assert.throws(() => assertXmlPeruAffiliationRequest({ ...command, authorizeProcedures: false }), /SUNAT_AUTHORIZATION_REQUIRED/);
});

test("rechaza acciones desconocidas y credenciales mal formadas sin devolver secretos", () => {
  for (const action of [undefined, null, "LINK", "PROMOTE", "AUTHORIZE_SUNAT "])
    assert.throws(() => assertXmlPeruAffiliationRequest({ ...demo, action }), /REQUEST_INVALID/);
  const command = { ...demo, action: "AUTHORIZE_SUNAT", solUsername: "synthetic",
    solPassword: "synthetic", authorizeProcedures: true };
  for (const extra of [{ solUsername: " padded " }, { solUsername: "x".repeat(101) },
    { solPassword: "line\nbreak" }, { solPassword: "x".repeat(257) }])
    assert.throws(() => assertXmlPeruAffiliationRequest({ ...command, ...extra }), /SUNAT_AUTHORIZATION_REQUIRED/);
});
test("Producción exige autorización explícita y ambas credenciales; conserva la contraseña literal", () => {
  const command = { ...demo, environment: "PRODUCTION", solUsername: "synthetic", solPassword: " with spaces ", authorizeProcedures: true };
  assert.doesNotThrow(() => assertXmlPeruAffiliationRequest(command));
  assert.equal(command.solPassword, " with spaces ");
  for (const extra of [{ authorizeProcedures: false }, { solPassword: "" }, { solUsername: undefined }])
    assert.throws(() => assertXmlPeruAffiliationRequest({ ...command, ...extra }), /SUNAT_AUTHORIZATION_REQUIRED/);
});
test("el comando no permite autoridad de tenant, URLs, reclamo de cuenta ni secretos no contractuales", () => {
  for (const extra of [{ tenantId: "other" }, { providerUrl: "https://invalid.test" }, { confirm: true }, { accountToken: "synthetic" }])
    assert.throws(() => assertXmlPeruAffiliationRequest({ ...demo, ...extra }), /REQUEST_INVALID/);
});
test("el cliente no puede aportar ni sustituir la credencial multiempresa del integrador", () => {
  const production = { ...demo, environment: "PRODUCTION", solUsername: "synthetic", solPassword: "synthetic", authorizeProcedures: true };
  for (const command of [demo, production]) {
    for (const token of [undefined, "", "synthetic|management", "line\nbreak", "x".repeat(4097)])
      assert.throws(() => assertXmlPeruAffiliationRequest({ ...command, managementToken: token }), /REQUEST_INVALID/);
  }
});
test("la respuesta pública sólo admite hechos tipados y nunca secretos del proveedor", () => {
  assert.doesNotThrow(() => assertXmlPeruAffiliationResponse(response));
  for (const extra of [{ managementToken: "synthetic" }, { solPassword: "synthetic" }, { credentials: {} },
    { code: "provider echoed secret" }, { procedures: { pse: "anything", ose: null } }])
    assert.throws(() => assertXmlPeruAffiliationResponse({ ...response, ...extra }), /RESPONSE_INVALID/);
});
test("una conexión Demo o un trámite pendiente nunca se presenta como afiliación confirmada", () => {
  for (const extra of [{ environment: "DEMO" }, { procedures: { pse: "pending", ose: null } },
    { procedures: { pse: null, ose: null } }, { signingCredentialConfigured: false },
    { destination: "provider_ose", procedures: { pse: "done", ose: "not_started" } }])
    assert.throws(() => assertXmlPeruAffiliationResponse({ ...response, ...extra }), /RESPONSE_INVALID/);
  assert.doesNotThrow(() => assertXmlPeruAffiliationResponse({ ...response, environment: "DEMO", status: "DEMO_CONNECTED",
    procedures: { pse: "not_started", ose: null } }));
});

test("PSE confirmado en Demo conserva la conexión de pruebas sin otorgar emisión productiva", () => {
  const confirmed = { ...response, environment: "DEMO", status: "DEMO_CONNECTED" };
  assert.doesNotThrow(() => assertXmlPeruAffiliationResponse(confirmed));
  assert.throws(() => assertXmlPeruAffiliationResponse({ ...confirmed, status: "AFFILIATED" }), /RESPONSE_INVALID/);
  assert.doesNotThrow(() => assertXmlPeruAffiliationResponse({ ...confirmed,
    procedures: { pse: "not_started", ose: null }, code: "XMLPERU_AFFILIATION_SUNAT_AUTHORIZATION_AVAILABLE" }));
});
