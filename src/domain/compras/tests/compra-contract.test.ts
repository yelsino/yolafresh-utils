import assert from "node:assert/strict";
import test from "node:test";

import { EstadoPagoEnum } from "../../shared/kernel/enums";
import {
  EstadoCompraEnum,
  ICompra,
  TipoDocumentoCompraEnum,
} from "../contracts/compra.contract";
import { Compra } from "../entities/Compra";

function buildCompraInput(overrides: Partial<ICompra> = {}): ICompra {
  return {
    id: "compra_001",
    eventoCompraId: "evento_001",
    proveedorId: "proveedor_001",
    tipoDocumento: TipoDocumentoCompraEnum.FACTURA,
    fechaDocumento: 1_775_000_000_000,
    fechaRegistro: 1_775_000_000_000,
    moneda: "PEN",
    subtotal: 24,
    total: 24,
    estadoPago: EstadoPagoEnum.PENDIENTE,
    estado: EstadoCompraEnum.BORRADOR,
    items: [
      {
        id: "item_001",
        compraId: "compra_001",
        nombreItem: "Caja x12",
        cantidad: 2,
        costoUnitario: 12,
        costoTotal: 24,
        afectaInventario: true,
        presentacionId: "presentacion_caja_12",
        productoBaseId: "producto_001",
        factorUnidadBase: 12,
        unidadBaseInventario: "unidad",
        versionConversion: 3,
      },
    ],
    createdAt: 1_775_000_000_000,
    updatedAt: 1_775_000_000_000,
    ...overrides,
  };
}

test("Compra conserva el snapshot de conversión del item inventariable", () => {
  const compra = new Compra(buildCompraInput());
  const item = compra.toJSON().items[0];

  assert.equal(item.afectaInventario, true);
  if (!item.afectaInventario) {
    assert.fail("El item debía ser inventariable");
  }
  assert.equal(item.presentacionId, "presentacion_caja_12");
  assert.equal(item.productoBaseId, "producto_001");
  assert.equal(item.factorUnidadBase, 12);
  assert.equal(item.unidadBaseInventario, "unidad");
  assert.equal(item.versionConversion, 3);
});

test("Compra rechaza item físico sin unidad base congelada", () => {
  const input = buildCompraInput();
  const item = {
    ...input.items[0],
    unidadBaseInventario: undefined,
  };

  assert.throws(
    () =>
      new Compra({
        ...input,
        items: [item as unknown as ICompra["items"][number]],
      }),
    /unidadBaseInventario inválida/,
  );
});

test("Compra exige versionConversion entera segura positiva", () => {
  for (const versionConversion of [
    undefined,
    0,
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    const input = buildCompraInput();
    const item = { ...input.items[0], versionConversion };

    assert.throws(
      () =>
        new Compra({
          ...input,
          items: [item as unknown as ICompra["items"][number]],
        }),
      /versionConversion inválida: debe ser un entero seguro positivo/,
    );
  }
});

test("Compra acepta item no inventariable sin metadatos físicos", () => {
  const compra = new Compra(
    buildCompraInput({
      subtotal: 15,
      total: 15,
      items: [
        {
          id: "item_servicio_001",
          compraId: "compra_001",
          nombreItem: "Servicio de transporte",
          cantidad: 1,
          costoUnitario: 15,
          costoTotal: 15,
          afectaInventario: false,
        },
      ],
    }),
  );

  assert.equal(compra.toJSON().items[0].afectaInventario, false);
});
