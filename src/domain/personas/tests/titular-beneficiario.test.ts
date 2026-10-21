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
} from "../contracts/persons.contract";

import { canonicalizeClienteDocument, normalizeClienteDocumentType } from "../contracts/cliente-document.contract";

const now = new Date("2026-10-13T00:00:00.000Z");

test("el cliente legado conserva su identidad opaca y usa nombres y facturación", () => {
  const legacy = { _id: "opaque/with-any-format", _rev: "2-x", type: "cliente_institucional",
    tipoEntidad: "ClienteInstitucional", razonSocial: "Colegio Los Olivos S.A.C.",
    nombreComercial: "Los Olivos", ruc: "20123456789", direccion: "Av. Prueba",
    activo: false, extra: { retained: true } };
  const cliente = canonicalizeClienteDocument(legacy);
  assert.deepEqual(cliente, { ...legacy, type: "cliente", tipoEntidad: "Cliente",
    nombres: "Los Olivos", pseudonimo: "Los Olivos",
    facturacion: { razonSocial: legacy.razonSocial, ruc: legacy.ruc,
      direccionFiscal: legacy.direccion } });
  assert.equal("dni" in cliente, false);
  assert.equal("id" in cliente, false);
  assert.deepEqual(canonicalizeClienteDocument(cliente), cliente);
  assert.equal(legacy.type, "cliente_institucional");
});

test("el borde conserva valores canónicos y no transforma otras entidades", () => {
  const cliente = canonicalizeClienteDocument({ _id: "opaque", type: "cliente_institucional",
    nombres: "Nombre actual", pseudonimo: "Alias actual", razonSocial: "Razón antigua",
    facturacion: { razonSocial: "Razón vigente", ruc: "20444444444", emailFacturacion: "a@test.local" } });
  assert.equal(cliente.nombres, "Nombre actual");
  assert.equal(cliente.pseudonimo, "Alias actual");
  assert.equal((cliente.facturacion as Record<string, unknown>).razonSocial, "Razón vigente");
  const other = { _id: "cliente_institucional-looking-id", type: "proveedor" };
  assert.equal(canonicalizeClienteDocument(other), other);
  assert.equal(normalizeClienteDocumentType("cliente_institucional"), "cliente");
  assert.equal(normalizeClienteDocumentType("proveedor"), "proveedor");
  assert.equal(canonicalizeClienteDocument({ tipoEntidad: "ClienteInstitucional", razonSocial: "Colegio" }).nombres, "Colegio");
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

import { mapVentaSnapshotActor, VentaSnapshot } from "../../ventas/entities/VentaSnapshot";
import {
  BENEFICIARIO_CATALOGO_TYPE,
  validarBeneficiarioCatalogo,
  type BeneficiarioCatalogoDocument,
} from "../contracts/beneficiario.contract";

test("catálogo reutilizable valida identidad opaca, clase, revisión y borrado lógico", () => {
  const document: BeneficiarioCatalogoDocument = {
    _id: " opción / α ", type: BENEFICIARIO_CATALOGO_TYPE, schemaVersion: 1,
    clase: "ETIQUETA", nombre: "Alumno", estado: "ACTIVO", revision: 1,
    createdAt: now.getTime(), updatedAt: now.getTime(),
    creadoPorId: "actor", actualizadoPorId: "actor",
  };
  assert.deepEqual(validarBeneficiarioCatalogo({ ...document, id: document._id }), []);
  assert.deepEqual(validarBeneficiarioCatalogo({ ...document, id: document._id,
    estado: "ELIMINADO", revision: 2 }), []);
  assert.equal(Object.prototype.hasOwnProperty.call(document, "id"), false);
  assert.ok(validarBeneficiarioCatalogo({ ...document, id: "", revision: 0,
    clase: "OTRO" as "ETIQUETA", nombre: " " }).length >= 4);
});

test("snapshot conserva referencias de catálogo y los nombres históricos", () => {
  const snapshot = new VentaSnapshot({ id: "snapshot-catalogo", ventaId: "venta", createdAt: 1,
    items: [{ id: "line", presentacionId: "product", nombre: "Producto", cantidadVendida: 1,
      precioUnitario: 1, total: 1 }], subtotal: 1, impuesto: 0, total: 1,
    beneficiario: { vinculoId: "vinculo", personaId: "persona", nombre: "Ana",
      etiquetaId: " etiqueta / α ", grupoId: "grupo", etiqueta: "Alumno", grupo: "3 A" } });
  assert.deepEqual(snapshot.toJSON().beneficiario, { vinculoId: "vinculo", personaId: "persona",
    nombre: "Ana", etiquetaId: " etiqueta / α ", grupoId: "grupo", etiqueta: "Alumno", grupo: "3 A" });
});

test("el snapshot conserva exactamente el identificador opaco del cliente", () => {
  const id = " cliente / α ";
  const actor = mapVentaSnapshotActor({ id, tipoEntidad: "Cliente", nombres: "Instituto" } as Cliente);
  assert.equal(actor?.id, id);
  const snapshot = new VentaSnapshot({ id: "snapshot", ventaId: "venta", createdAt: 1,
    items: [{ id: "line", presentacionId: "product", nombre: "Producto", cantidadVendida: 1,
      precioUnitario: 1, total: 1 }], subtotal: 1, impuesto: 0, total: 1, cliente: actor });
  assert.equal(snapshot.cliente?.id, id);
  assert.equal(snapshot.toJSON().cliente?.id, id);
});

for (const type of [" CLIENTE_INSTITUCIONAL ", "Cliente_Institucional"]) {
  test(`el borde armoniza el tipo legado ${JSON.stringify(type)} sin tocar identidades`, () => {
    const _id = " cliente / α ";
    const result = canonicalizeClienteDocument({ _id, _rev: "opaque-rev", type,
      razonSocial: "Empresa", activo: false });
    assert.equal(result.type, "cliente");
    assert.equal(result.tipoEntidad, "Cliente");
    assert.equal(result.nombres, "Empresa");
    assert.equal(result._id, _id);
    assert.equal(result._rev, "opaque-rev");
    assert.equal(normalizeClienteDocumentType(type), "cliente");
    assert.equal(result.activo, false);
  });
}
