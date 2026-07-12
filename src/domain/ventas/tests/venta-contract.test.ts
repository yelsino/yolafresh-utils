import assert from "node:assert/strict";
import test from "node:test";

import { CondicionPagoVenta, VentaState } from "../../shared/kernel/enums";
import { ICarritoVenta, ProcedenciaVenta } from "../entities/CarritoVenta";
import { Venta, VentaCreateInput } from "../entities/Venta";
import { isVentaSnapshotImmutableState } from "../entities/VentaSnapshot";
import { CategoriaCliente, Cliente } from "../../personas/contracts/persons.contract";
import { IUsuario } from "../../personas/contracts/usuario.contract";

function buildVentaInput(
  overrides: Partial<VentaCreateInput> = {},
): VentaCreateInput {
  return {
    id: "venta_test_001",
    nombre: "Venta test",
    type: "venta",
    estado: VentaState.CONFIRMADA,
    condicionPago: CondicionPagoVenta.CONTADO,
    items: [
      {
        id: "item_001",
        presentacionId: "pres_001",
        cantidadVendida: 2,
        precioUnitario: 5,
        montoTotal: 10,
      },
    ],
    subtotal: 10,
    impuesto: 0,
    total: 10,
    procedencia: ProcedenciaVenta.Tienda,
    ...overrides,
  };
}

test("Venta exige condicionPago y la conserva en contrato serializado", () => {
  const venta = new Venta(
    buildVentaInput({
      condicionPago: CondicionPagoVenta.CREDITO,
    }),
  );

  assert.equal(venta.condicionPago, CondicionPagoVenta.CREDITO);
  assert.equal(venta.toJSON().condicionPago, CondicionPagoVenta.CREDITO);
});

test("Venta rechaza creación sin condicionPago", () => {
  assert.throws(
    () =>
      new Venta(
        buildVentaInput({
          condicionPago: undefined as unknown as CondicionPagoVenta,
        }),
      ),
    /CondicionPago es requerida/,
  );
});

test("Venta.fromCarritoVenta usa CONTADO por defecto y permite CREDITO", () => {
  const cliente: Cliente = {
    id: "cliente_001",
    tipoEntidad: "Cliente",
    createdAt: new Date("2026-07-08T10:00:00.000Z"),
    updatedAt: new Date("2026-07-08T10:00:00.000Z"),
    activo: true,
    nombres: "Cliente Test",
    celular: "999999999",
    correo: "cliente@test.com",
    dni: "12345678",
    direccion: "Av. Test 123",
    pseudonimo: "cliente-test",
    historialCompras: [],
    totalGastado: 0,
    categoriaCliente: CategoriaCliente.REGULAR,
  };
  const personal: IUsuario = {
    id: "usuario_001",
    username: "vendedor.test",
    passwordHash: "hash",
    roles: [],
    entidades: [],
    activo: true,
    createdAt: new Date("2026-07-08T10:00:00.000Z"),
    updatedAt: new Date("2026-07-08T10:00:00.000Z"),
    intentosFallidos: 0,
    cuentaBloqueada: false,
    emailVerificado: true,
  };
  const carrito: ICarritoVenta = {
    id: "cart_001",
    createdAt: new Date("2026-07-08T10:00:00.000Z"),
    updatedAt: new Date("2026-07-08T10:00:00.000Z"),
    nombre: "Mostrador 1",
    items: [
      {
        id: "item_001",
        product: {
          id: "pres_001",
          nombre: "Producto test",
          precioVenta: 10,
        },
        quantity: 1,
        precioUnitario: 10,
        montoTotal: 10,
      },
    ],
    subtotal: 10,
    impuesto: 0,
    total: 10,
    descuentoTotal: 0,
    cantidadItems: 1,
    cantidadTotal: 1,
    procedencia: ProcedenciaVenta.Tienda,
    cliente,
    personal,
  };

  const ventaContado = Venta.fromCarritoVenta(carrito, "venta_contado");
  const ventaCredito = Venta.fromCarritoVenta(carrito, "venta_credito", {
    condicionPago: CondicionPagoVenta.CREDITO,
  });

  assert.equal(ventaContado.condicionPago, CondicionPagoVenta.CONTADO);
  assert.equal(ventaCredito.condicionPago, CondicionPagoVenta.CREDITO);
  assert.equal(ventaContado.clienteId, cliente.id);
  assert.equal(ventaContado.vendedorId, personal.id);
});

test("VentaSnapshot trata confirmada y anulada como estados finales", () => {
  assert.equal(isVentaSnapshotImmutableState(VentaState.CONFIRMADA), true);
  assert.equal(isVentaSnapshotImmutableState(VentaState.ANULADA), true);
  assert.equal(isVentaSnapshotImmutableState("DESPACHADA"), false);
});

test("VentaSnapshot preserva montoModificado por item", () => {
  const venta = new Venta(
    buildVentaInput({
      items: [
        {
          id: "item_001",
          presentacionId: "pres_001",
          cantidadVendida: 2,
          precioUnitario: 5,
          montoTotal: 10,
          montoModificado: true,
        },
      ],
    }),
  );

  const snapshot = venta.toVentaSnapshot();

  assert.equal(snapshot.items[0]?.montoModificado, true);
});
