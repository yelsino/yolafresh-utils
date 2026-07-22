import assert from "node:assert/strict";
import test from "node:test";

import { CategoriaCliente, Cliente } from "../../personas/contracts/persons.contract";
import { IUsuario } from "../../personas/contracts/usuario.contract";
import { CondicionPagoVenta, VentaState } from "../../shared/kernel/enums";
import {
  CarritoVenta,
  ICarritoVenta,
  ProcedenciaVenta,
} from "../entities/CarritoVenta";
import { Venta, VentaCreateInput } from "../entities/Venta";
import {
  isVentaSnapshotImmutableState,
  VentaSnapshotItem,
} from "../entities/VentaSnapshot";

function buildSnapshotItem(
  overrides: Partial<VentaSnapshotItem> = {},
): VentaSnapshotItem {
  return {
    id: "item_001",
    presentacionId: "pres_001",
    nombre: "Producto test",
    cantidadVendida: 2,
    precioUnitario: 5,
    total: 10,
    ...overrides,
  };
}

function buildVentaInput(
  overrides: Partial<VentaCreateInput> = {},
): VentaCreateInput {
  return {
    id: "venta_test_001",
    nombre: "Venta test",
    type: "venta",
    estado: VentaState.CONFIRMADA,
    condicionPago: CondicionPagoVenta.CONTADO,
    items: 1,
    snapshotItems: [buildSnapshotItem()],
    subtotal: 10,
    impuesto: 0,
    total: 10,
    procedencia: ProcedenciaVenta.Tienda,
    ...overrides,
  };
}

function buildCliente(): Cliente {
  return {
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
}

function buildPersonal(): IUsuario {
  return {
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
}

function buildCarrito(): ICarritoVenta {
  return {
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
          unidadContenido: "unidad" as never,
          imagen: {
            base: "producto.jpg",
            sizes: {
              small: "producto-small.jpg",
              medium: "producto-medium.jpg",
              large: "producto-large.jpg",
            },
          },
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
    cliente: buildCliente(),
    personal: buildPersonal(),
  };
}

test("Venta conserva condición de pago en el resumen serializado", () => {
  const venta = new Venta(
    buildVentaInput({ condicionPago: CondicionPagoVenta.CREDITO }),
  );

  assert.equal(venta.condicionPago, CondicionPagoVenta.CREDITO);
  assert.equal(venta.toJSON().condicionPago, CondicionPagoVenta.CREDITO);
});

test("Venta rechaza creación sin condición de pago", () => {
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

test("Venta.items es un conteo entero mayor a cero", () => {
  assert.throws(
    () => new Venta(buildVentaInput({ items: 0, snapshotItems: [] })),
    /Venta\.items debe ser un entero mayor a 0/,
  );
  assert.throws(
    () => new Venta(buildVentaInput({ items: 1.5, snapshotItems: undefined })),
    /Venta\.items debe ser un entero mayor a 0/,
  );
});

test("Venta valida que el conteo coincida con el snapshot transitorio", () => {
  assert.throws(
    () =>
      new Venta(
        buildVentaInput({
          items: 2,
          snapshotItems: [buildSnapshotItem()],
        }),
      ),
    /Venta\.items debe coincidir con la cantidad de VentaSnapshot\.items/,
  );
});

test("Venta.toJSON no duplica el array de detalle", () => {
  const venta = new Venta(buildVentaInput());
  const serialized = venta.toJSON();

  assert.equal(serialized.items, 1);
  assert.equal(Array.isArray(serialized.items), false);
  assert.equal("snapshotItems" in serialized, false);
});

test("Venta.fromCarritoVenta construye conteo y snapshot histórico", () => {
  const cliente = buildCliente();
  const personal = buildPersonal();
  const carrito = { ...buildCarrito(), cliente, personal };

  const ventaContado = Venta.fromCarritoVenta(carrito, "venta_contado");
  const ventaCredito = Venta.fromCarritoVenta(carrito, "venta_credito", {
    condicionPago: CondicionPagoVenta.CREDITO,
  });
  const snapshot = ventaContado.toVentaSnapshot();

  assert.equal(ventaContado.items, 1);
  assert.equal(ventaCredito.condicionPago, CondicionPagoVenta.CREDITO);
  assert.equal(ventaContado.clienteId, cliente.id);
  assert.equal(ventaContado.vendedorId, personal.id);
  assert.equal(snapshot.items.length, ventaContado.items);
  assert.equal(snapshot.items[0]?.nombre, "Producto test");
  assert.equal(snapshot.items[0]?.unidadComercial, "unidad");
  assert.equal(snapshot.items[0]?.imagenUrl, "producto-small.jpg");
});

test("Venta rehidratada exige detalle explícito para construir snapshot", () => {
  const original = new Venta(buildVentaInput());
  const rehidratada = new Venta(original.toJSON() as VentaCreateInput);

  assert.throws(
    () => rehidratada.toVentaSnapshot(),
    /VentaSnapshotBuildContext\.items es requerido/,
  );

  const snapshot = rehidratada.toVentaSnapshot({
    items: [buildSnapshotItem()],
  });
  assert.equal(snapshot.items.length, rehidratada.items);
});

test("VentaSnapshot rechaza detalle que no coincide con Venta.items", () => {
  const venta = new Venta(
    buildVentaInput({ items: 2, snapshotItems: undefined }),
  );

  assert.throws(
    () => venta.toVentaSnapshot({ items: [buildSnapshotItem()] }),
    /Venta\.items debe coincidir con la cantidad de VentaSnapshot\.items/,
  );
});

test("VentaSnapshot preserva información histórica y override", () => {
  const item = buildSnapshotItem({
    nombre: "Zanahoria orgánica",
    imagenUrl: "zanahoria.jpg",
    unidadComercial: "kilogramo",
    montoModificado: true,
  });
  const venta = new Venta(
    buildVentaInput({ items: 1, snapshotItems: [item] }),
  );

  const snapshot = venta.toVentaSnapshot();

  assert.equal(snapshot.items[0]?.nombre, "Zanahoria orgánica");
  assert.equal(snapshot.items[0]?.imagenUrl, "zanahoria.jpg");
  assert.equal(snapshot.items[0]?.unidadComercial, "kilogramo");
  assert.equal(snapshot.items[0]?.montoModificado, true);
});

test("VentaSnapshot acepta descuento y montoRedondeo firmado", () => {
  const item = buildSnapshotItem({
    cantidadVendida: 1,
    precioUnitario: 10,
    total: 10,
    descuento: 2,
  });
  const venta = new Venta(
    buildVentaInput({
      items: 1,
      snapshotItems: [item],
      subtotal: 10,
      impuesto: 0,
      total: 7.8,
      montoRedondeo: -0.2,
    }),
  );

  const snapshot = venta.toVentaSnapshot();

  assert.equal(snapshot.descuentoTotal, 2);
  assert.equal(snapshot.montoRedondeo, -0.2);
  assert.equal(snapshot.total, 7.8);
});

test("Venta.tryToVentaSnapshot no lanza si el snapshot estricto falla", () => {
  const venta = new Venta(
    buildVentaInput({ total: 999 }),
  );

  const result = venta.tryToVentaSnapshot();

  assert.equal(result.snapshot, undefined);
  assert.ok(result.error instanceof Error);
  assert.match(
    result.error.message,
    /VentaSnapshot\.total debe ser consistente/,
  );
});

test("VentaSnapshot trata confirmada y anulada como estados finales", () => {
  assert.equal(isVentaSnapshotImmutableState(VentaState.CONFIRMADA), true);
  assert.equal(isVentaSnapshotImmutableState(VentaState.ANULADA), true);
  assert.equal(isVentaSnapshotImmutableState("DESPACHADA"), false);
});

test("CarritoVenta preserva precioUnitario cuando montoTotal es manual", () => {
  const carrito = new CarritoVenta("cart_override");

  carrito.agregarProducto({
    id: "item_001",
    product: {
      id: "pres_001",
      nombre: "Zanahoria",
      precioVenta: 1.8,
    },
    quantity: 1,
    precioUnitario: 1.8,
    montoTotal: 1.4,
    montoModificado: true,
  });

  const item = carrito.items[0];

  assert.ok(item);
  assert.equal(item.precioUnitario, 1.8);
  assert.equal(item.montoTotal, 1.4);
  assert.equal(item.montoModificado, true);
});

test("CarritoVenta invalida montoModificado al cambiar cantidad", () => {
  const carrito = new CarritoVenta("cart_quantity_reset");

  carrito.agregarProducto({
    id: "item_001",
    product: {
      id: "pres_001",
      nombre: "Zanahoria",
      precioVenta: 1.8,
    },
    quantity: 1,
    precioUnitario: 1.8,
    montoTotal: 1.4,
    montoModificado: true,
  });

  carrito.incrementarCantidad("item_001");

  const item = carrito.items[0];

  assert.ok(item);
  assert.equal(item.quantity, 2);
  assert.equal(item.precioUnitario, 1.8);
  assert.equal(item.montoModificado, false);
  assert.equal(item.montoTotal, 3.6);
});

test("CarritoVenta conserva redondeo monetario a 2 decimales", () => {
  const carrito = new CarritoVenta("cart_rounding");

  carrito.agregarProducto({
    id: "item_001",
    product: {
      id: "pres_001",
      nombre: "Producto test",
      precioVenta: 18.45,
    },
    quantity: 1,
    precioUnitario: 18.45,
  });

  assert.equal(carrito.items[0]?.montoTotal, 18.45);
  assert.equal(carrito.subtotal, 18.45);
});

test("CarritoVenta actualiza updatedAt al mutar items", () => {
  const carrito = new CarritoVenta("cart_touch");
  carrito.updatedAt = new Date("2020-01-01T00:00:00.000Z");

  carrito.agregarProducto({
    id: "item_001",
    product: {
      id: "pres_001",
      nombre: "Producto test",
      precioVenta: 5,
    },
    quantity: 1,
  });

  assert.ok(
    carrito.updatedAt.getTime() >
      new Date("2020-01-01T00:00:00.000Z").getTime(),
  );
});

test("CarritoVenta.fromJSON rechaza quantity inválida", () => {
  const carritoCorrupto = {
    ...buildCarrito(),
    id: "cart_bad",
    items: [
      {
        id: "item_001",
        product: {
          id: "pres_001",
          nombre: "Producto test",
          precioVenta: 10,
        },
        quantity: "abc" as unknown as number,
        precioUnitario: 10,
        montoTotal: 10,
      },
    ],
  } satisfies ICarritoVenta;

  assert.throws(
    () => CarritoVenta.fromJSON(carritoCorrupto),
    /CarritoVenta\.items\[0\]\.quantity debe ser un número finito/,
  );
});
