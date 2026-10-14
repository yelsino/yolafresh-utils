import assert from "node:assert/strict";
import test from "node:test";

import { EstadoPagoEnum } from "../../shared/kernel/enums";
import { TipoEmpaqueEnum } from "../../inventario/contracts/producto.contract";
import {
  EstadoCompraEnum,
  ICompra,
  TipoDocumentoCompraEnum,
  esCompraItemInventariablePersonalizada,
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
  assert.equal(item.tipoPresentacionCompra, undefined);
  assert.equal(esCompraItemInventariablePersonalizada(item), false);
});

test("Compra conserva un empaque personalizado de 90 unidades sin presentación de catálogo", () => {
  const input = buildCompraInput({
    subtotal: 50,
    total: 50,
    items: [{
      id: "a41b9c4e-5c6a-4f85-a953-d38ac4ebce42",
      compraId: "compra_001",
      nombreItem: "Pepino, bolsa x90",
      cantidad: 1,
      costoUnitario: 50,
      costoTotal: 50,
      afectaInventario: true,
      tipoPresentacionCompra: "PERSONALIZADA",
      productoBaseId: "3e19bc35-f8ec-43f3-970f-4360d819d7e7",
      productoEmpaque: TipoEmpaqueEnum.Bolsa,
      factorUnidadBase: 90,
      unidadBaseInventario: "unidad",
    }],
  });
  const item = Compra.fromJSON(input).toJSON().items[0];
  if (!item.afectaInventario) {
    assert.fail("El item debía ser inventariable");
  }

  assert.equal(item.id, input.items[0].id);
  assert.equal(item.tipoPresentacionCompra, "PERSONALIZADA");
  assert.equal(item.presentacionId, undefined);
  assert.equal(item.versionConversion, undefined);
  assert.equal(item.productoBaseId, input.items[0].productoBaseId);
  assert.equal(item.productoEmpaque, TipoEmpaqueEnum.Bolsa);
  assert.equal(item.factorUnidadBase, 90);
  assert.equal(esCompraItemInventariablePersonalizada(item), true);
});

test("Compra mantiene cerrada la ruta heredada si falta presentación o versión", () => {
  const input = buildCompraInput();
  for (const [changes, message] of [
    [{ presentacionId: undefined }, /sin presentacionId/],
    [{ presentacionId: undefined, factorUnidadBase: 90 }, /sin presentacionId/],
    [{ versionConversion: undefined }, /versionConversion inválida/],
    [{ tipoPresentacionCompra: "DESCONOCIDA" }, /tipoPresentacionCompra inválido/],
  ] as const) {
    assert.throws(() => new Compra({
      ...input,
      items: [{ ...input.items[0], ...changes } as unknown as ICompra["items"][number]],
    }), message);
  }
});

test("Compra rechaza un empaque personalizado incompleto o mezclado con catálogo", () => {
  const input = buildCompraInput();
  const personalizada = {
    ...input.items[0],
    tipoPresentacionCompra: "PERSONALIZADA",
    presentacionId: undefined,
    versionConversion: undefined,
    productoEmpaque: TipoEmpaqueEnum.Bolsa,
  };
  for (const [changes, message] of [
    [{ productoEmpaque: undefined }, /productoEmpaque inválido/],
    [{ presentacionId: "presentacion_caja_12" }, /no admite presentacionId/],
    [{ versionConversion: 3 }, /no admite presentacionId ni versionConversion/],
    [{ factorUnidadBase: 0 }, /factorUnidadBase inválido/],
  ] as const) {
    assert.throws(() => new Compra({
      ...input,
      items: [{ ...personalizada, ...changes } as unknown as ICompra["items"][number]],
    }), message);
  }
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
