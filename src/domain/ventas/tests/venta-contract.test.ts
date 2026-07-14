import assert from "node:assert/strict";
import test from "node:test";

import { CondicionPagoVenta, VentaState } from "../../shared/kernel/enums";
import { CarritoVenta, ICarritoVenta, ProcedenciaVenta } from "../entities/CarritoVenta";
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

test("VentaSnapshot acepta descuentoTotal y montoRedondeo al reflejar Venta real", () => {
  const venta = new Venta(
    buildVentaInput({
      items: [
        {
          id: "item_001",
          presentacionId: "pres_001",
          cantidadVendida: 1,
          precioUnitario: 10,
          montoTotal: 10,
          descuento: 2,
        },
      ],
      subtotal: 10,
      impuesto: 0,
      total: 8.1,
      montoRedondeo: 0.1,
    }),
  );

  const snapshot = venta.toVentaSnapshot();

  assert.equal(snapshot.subtotal, 10);
  assert.equal(snapshot.descuentoTotal, 2);
  assert.equal(snapshot.impuesto, 0);
  assert.equal(snapshot.montoRedondeo, 0.1);
  assert.equal(snapshot.total, 8.1);
});

test("VentaSnapshot acepta montoRedondeo negativo cuando venta operativa lo requiere", () => {
  const venta = new Venta(
    buildVentaInput({
      items: [
        {
          id: "item_001",
          presentacionId: "pres_001",
          cantidadVendida: 1,
          precioUnitario: 10,
          montoTotal: 10,
        },
      ],
      subtotal: 10,
      impuesto: 0,
      total: 9.8,
      montoRedondeo: -0.2,
    }),
  );

  const snapshot = venta.toVentaSnapshot();

  assert.equal(snapshot.montoRedondeo, -0.2);
  assert.equal(snapshot.total, 9.8);
});

test("Venta.tryToVentaSnapshot no lanza excepción si snapshot estricto falla", () => {
  const venta = new Venta(
    buildVentaInput({
      items: [
        {
          id: "item_001",
          presentacionId: "pres_001",
          cantidadVendida: 1,
          precioUnitario: 10,
          montoTotal: 10,
        },
      ],
      subtotal: 10,
      impuesto: 0,
      total: 999,
    }),
  );

  const result = venta.tryToVentaSnapshot();

  assert.equal(result.snapshot, undefined);
  assert.ok(result.error instanceof Error);
  assert.match(
    result.error.message,
    /VentaSnapshot\.total debe ser consistente con subtotal - descuentoTotal \+ impuesto \+ montoRedondeo/,
  );
});

test("Venta.calcularTotalItem resta descuento aunque exista montoTotal bruto", () => {
  const venta = new Venta(
    buildVentaInput({
      items: [
        {
          id: "item_001",
          presentacionId: "pres_001",
          cantidadVendida: 1,
          precioUnitario: 10,
          montoTotal: 10,
          descuento: 2,
        },
      ],
      subtotal: 10,
      impuesto: 0,
      total: 8,
    }),
  );

  assert.equal(venta.calcularSubtotalItem(venta.items[0]!), 10);
  assert.equal(venta.calcularTotalItem(venta.items[0]!), 8);
  assert.equal(venta.calcularTotal(), 8);
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

  const item = carrito.items[0];

  assert.ok(item);
  assert.equal(item.montoTotal, 18.45);
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

  assert.ok(carrito.updatedAt.getTime() > new Date("2020-01-01T00:00:00.000Z").getTime());
});

test("CarritoVenta.fromJSON rechaza quantity inválida en vez de coercer a cero", () => {
  const carritoCorrupto = {
    id: "cart_bad",
    createdAt: new Date("2026-07-08T10:00:00.000Z"),
    updatedAt: new Date("2026-07-08T10:00:00.000Z"),
    nombre: "Carrito corrupto",
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
    subtotal: 10,
    descuentoTotal: 0,
    impuesto: 0,
    total: 10,
    cantidadItems: 1,
    cantidadTotal: 1,
    procedencia: ProcedenciaVenta.Tienda,
  } satisfies ICarritoVenta;

  assert.throws(
    () => CarritoVenta.fromJSON(carritoCorrupto),
    /CarritoVenta\.items\[0\]\.quantity debe ser un número finito/,
  );
});
