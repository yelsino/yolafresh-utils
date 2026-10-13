import assert from "node:assert/strict";
import test from "node:test";
import {
  autorizaBeneficiario,
  validarVinculoBeneficiario,
  type VinculoBeneficiario,
} from "../contracts/beneficiario.contract";
import {
  CategoriaCliente,
  nombreTitularCuentaCliente,
  type Cliente,
  type ClienteInstitucional,
} from "../contracts/persons.contract";

const now = new Date("2026-10-13T00:00:00.000Z");

test("institución titular sin atributos ficticios de persona", () => {
  const institucion: ClienteInstitucional = {
    id: "opaque-institution", tipoEntidad: "ClienteInstitucional",
    razonSocial: "Colegio del Pacífico", activo: true,
    createdAt: now, updatedAt: now,
  };
  assert.equal(nombreTitularCuentaCliente(institucion), "Colegio del Pacífico");
  assert.equal("dni" in institucion, false);
});

test("cliente persona legado conserva la cuenta existente", () => {
  const cliente: Cliente = {
    id: "opaque-payer", tipoEntidad: "Cliente", nombres: "Juan", apellidos: "Torres",
    celular: "", correo: "", dni: "", direccion: "", pseudonimo: "",
    historialCompras: [], totalGastado: 0, categoriaCliente: CategoriaCliente.REGULAR,
    activo: true, createdAt: now, updatedAt: now,
  };
  assert.equal(nombreTitularCuentaCliente(cliente), "Juan Torres");
});

test("vínculo activo autoriza solo al titular y persona exactos", () => {
  const vinculo: VinculoBeneficiario = {
    id: "opaque-link", clienteId: "opaque-payer", personaId: "opaque-receiver",
    estado: "ACTIVO", revision: 1,
    createdAt: now.getTime(), updatedAt: now.getTime(),
  };
  assert.deepEqual(validarVinculoBeneficiario(vinculo), []);
  assert.equal(autorizaBeneficiario(vinculo, vinculo.clienteId, {
    vinculoId: vinculo.id, personaId: vinculo.personaId,
  }), true);
  assert.equal(autorizaBeneficiario(vinculo, "another-payer", {
    vinculoId: vinculo.id, personaId: vinculo.personaId,
  }), false);
});
