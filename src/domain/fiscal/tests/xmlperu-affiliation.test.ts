import { test } from "node:test";
import assert from "node:assert/strict";
import { assertXmlPeruAffiliationRequest, assertXmlPeruAffiliationResponse,
  type XmlPeruAffiliationResponse } from "../contracts";

const demo = { operationId: "opaque-operation", expectedIssuerRuc: "20123456789", environment: "DEMO" };
const response: XmlPeruAffiliationResponse = { ok: true, provider: "XmlPeru", tenantId: "opaque-tenant",
  issuerRuc: "20123456789", issuerLegalName: "EMISOR SINTETICO", environment: "PRODUCTION", checkedAtMs: 12,
  status: "AFFILIATED", managementCredentialConfigured: true, signingCredentialConfigured: true, companyRegistered: true,
  procedures: { pse: "done", ose: null }, signing: "provider", destination: "sunat" };

test("Demo sólo acepta vinculación sin credenciales SOL ni autorización tributaria", () => {
  assert.doesNotThrow(() => assertXmlPeruAffiliationRequest({ ...demo, managementToken: "synthetic|management" }));
  for (const extra of [{ solUsername: "synthetic" }, { solPassword: "synthetic" }, { authorizeProcedures: true },
    { solPassword: undefined }, { authorizeProcedures: false }]) {
    assert.throws(() => assertXmlPeruAffiliationRequest({ ...demo, ...extra }), /DEMO_SOL_FORBIDDEN/);
  }
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
  for (const token of ["", "line\nbreak", "x".repeat(4097)])
    assert.throws(() => assertXmlPeruAffiliationRequest({ ...demo, managementToken: token }), /REQUEST_INVALID/);
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
