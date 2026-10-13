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

test("una institución es titular sin atributos ficticios de persona", () => {
  const institucion: ClienteInstitucional = {
    id: "opaque-institution-7",
    tipoEntidad: "ClienteInstitucional",
    razonSocial: "Colegio Los Olivos S.A.C.",
    nombreComercial: "Los Olivos",
    activo: true,
    createdAt: now,
    updatedAt: now,
  };
  assert.equal(nombreTitularCuentaCliente(institucion), "Los Olivos");
  assert.equal("dni" in institucion, false);
  assert.equal("nombres" in institucion, false);
});

test("un cliente persona heredado conserva su nombre y el mismo clienteId", () => {
  const persona: Cliente = {
    id: "opaque-customer-4",
    tipoEntidad: "Cliente",
    nombres: "Juan",
    apellidos: "Torres",
    celular: "",
    correo: "",
    dni: "",
    direccion: "",
    pseudonimo: "",
    historialCompras: [],
    totalGastado: 0,
    categoriaCliente: CategoriaCliente.REGULAR,
    activo: true,
    createdAt: now,
    updatedAt: now,
  };
  assert.equal(nombreTitularCuentaCliente(persona), "Juan Torres");
});

test("la autorización del beneficiario exige vínculo activo del titular exacto", () => {
  const vinculo: VinculoBeneficiario = {
    id: "opaque-link-a",
    clienteId: "opaque-institution-7",
    personaId: "opaque-teacher-2",
    estado: "ACTIVO",
    revision: 1,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  };
  assert.deepEqual(validarVinculoBeneficiario(vinculo), []);
  assert.equal(autorizaBeneficiario(vinculo, vinculo.clienteId, {
    vinculoId: vinculo.id,
    personaId: vinculo.personaId,
  }), true);
  assert.equal(autorizaBeneficiario(vinculo, "opaque-other-payer", {
    vinculoId: vinculo.id,
    personaId: vinculo.personaId,
  }), false);
});
