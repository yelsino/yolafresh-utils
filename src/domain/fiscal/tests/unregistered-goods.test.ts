import test from "node:test";
import assert from "node:assert/strict";
import { assertFiscalV1UnregisteredGood, assertFiscalV1UnregisteredGoodsPolicy,
  resolveFiscalV1UnregisteredGoodsPolicy } from "../contracts";
import { unregisteredPolicyInput, unregisteredPolicy } from "./unregistered-goods.fixture";
import { CarritoVenta } from "../../ventas/entities/CarritoVenta";

test("resolves a published company policy with opaque identities and no catalogue or duplicated id", () => {
  const input = unregisteredPolicyInput(), bytes = JSON.stringify(input), result = resolveFiscalV1UnregisteredGoodsPolicy(input);
  assert.equal(result.policyDocumentId, input.policyDocumentId);
  assert.equal(result.legalCategory, "GRAVADA"); assert.equal(result.taxRateBasisPoints, 1800);
  assert.equal("presentationId" in result, false); assert.equal("id" in input.policy, false);
  assert.equal(JSON.stringify(input), bytes);
  assert.deepEqual(resolveFiscalV1UnregisteredGoodsPolicy({ ...input, policy: { ...input.policy, _rev: "changed cosmetically" } }), result);
});

test("rejects other tenants, issuers, owners, suspended or unpublished policies and expired dates", () => {
  const input = unregisteredPolicyInput();
  for (const patch of [{ tenantId: "other" }, { issuerRuc: "20111111111" }, { companyDocumentId: "other" },
    { _id: "other" }, { status: "SUSPENDED" }, { publishedDecisionId: null }, { _deleted: true }, { _conflicts: ["conflict"] }])
    assert.throws(() => resolveFiscalV1UnregisteredGoodsPolicy({ ...input, policy: { ...input.policy, ...patch } }));
  assert.throws(() => resolveFiscalV1UnregisteredGoodsPolicy({ ...input, occurredOn: "2026-09-30" }), /NOT_EFFECTIVE/);
  const service = structuredClone(input.policy); service.decisionHistory[0].rules[0].offerType = "SERVICE";
  assert.throws(() => resolveFiscalV1UnregisteredGoodsPolicy({ ...input, policy: service }), /NOT_EFFECTIVE/);
});

test("a zero tax declaration requires the issuer posture; no missing configuration means automatic exemption", () => {
  const input = unregisteredPolicyInput(), policy = structuredClone(input.policy) as any;
  policy.decisionHistory[0].rules[0].treatment = { category: "EXONERADA", affectationCode: "20", rateBasisPoints: 0 };
  assert.throws(() => resolveFiscalV1UnregisteredGoodsPolicy({ ...input, policy }), /ISSUER_POSTURE_REQUIRED/);
});

test("rejects modified policy facts and validates the exact scope/date at every preparation", () => {
  const policy = unregisteredPolicy(), scope = unregisteredPolicyInput();
  assert.doesNotThrow(() => assertFiscalV1UnregisteredGoodsPolicy(policy, scope));
  assert.throws(() => assertFiscalV1UnregisteredGoodsPolicy({ ...policy, taxRateBasisPoints: 1050 }, scope), /POLICY_INVALID/);
  assert.throws(() => assertFiscalV1UnregisteredGoodsPolicy(policy, { ...scope, tenantId: "other" }), /POLICY_INVALID/);
});

test("free goods capture an explicit real description and commercial unit, never catalogue or tax fields", () => {
  for (const unitCode of ["NIU", "KGM", "LTR"])
    assert.doesNotThrow(() => assertFiscalV1UnregisteredGood({ description: "Leche & cacao <500 ml>", unitCode }));
  for (const input of [null, {}, { description: "", unitCode: "NIU" }, { description: "Bien", unitCode: "ZZ" },
    { description: "Bien\nOtro", unitCode: "NIU" }, { description: "Bien", unitCode: "NIU", taxRateBasisPoints: 0 }])
    assert.throws(() => assertFiscalV1UnregisteredGood(input), /UNREGISTERED_GOOD_INVALID/);
});

test("cart save/reload and commercial snapshots preserve explicit origin without ID-format semantics", () => {
  const cart = CarritoVenta.sinImpuestos();
  cart.agregarProducto({ id: "opaque line / ñ", product: { id: "arbitrary identity", nombre: "Perejil",
    origenProducto: "NO_REGISTRADO", afectaInventario: false }, quantity: 1, precioUnitario: 1.5 });
  const restored = CarritoVenta.fromJSON(cart.toJSON());
  assert.equal(restored.items[0].product.origenProducto, "NO_REGISTRADO");
  assert.equal(restored.items[0].product.afectaInventario, false);
  assert.equal(restored.toVentaSnapshot().items[0].product.origenProducto, "NO_REGISTRADO");
  const historical = cart.toJSON(); delete historical.items[0].product.origenProducto;
  assert.equal(CarritoVenta.fromJSON(historical).items[0].product.origenProducto, "NO_REGISTRADO");
});
