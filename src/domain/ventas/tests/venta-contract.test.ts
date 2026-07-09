import assert from "node:assert/strict";
import test from "node:test";

import { CondicionPagoVenta, VentaState } from "../../shared/kernel/enums";
import { ICarritoVenta, ProcedenciaVenta } from "../entities/CarritoVenta";
import { Venta, VentaCreateInput } from "../entities/Venta";
import { isVentaSnapshotImmutableState } from "../entities/VentaSnapshot";

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
    tasaImpuesto: 0,
    procedencia: ProcedenciaVenta.Tienda,
  };

  const ventaContado = Venta.fromCarritoVenta(carrito, "venta_contado");
  const ventaCredito = Venta.fromCarritoVenta(carrito, "venta_credito", {
    condicionPago: CondicionPagoVenta.CREDITO,
  });

  assert.equal(ventaContado.condicionPago, CondicionPagoVenta.CONTADO);
  assert.equal(ventaCredito.condicionPago, CondicionPagoVenta.CREDITO);
});

test("VentaSnapshot trata confirmada y anulada como estados finales", () => {
  assert.equal(isVentaSnapshotImmutableState(VentaState.CONFIRMADA), true);
  assert.equal(isVentaSnapshotImmutableState(VentaState.ANULADA), true);
  assert.equal(isVentaSnapshotImmutableState("DESPACHADA"), false);
});
