import assert from "node:assert/strict";
import test from "node:test";
import { calculateSaleLineGrossAmount, calculateSaleLineGrossCents } from "../contracts/sale-line-money";
import { CarritoVenta, type CarItem, type ICarritoVenta } from "../entities/CarritoVenta";
import { TipoVentaEnum, UnidadMedidaEnum } from "../../inventario/contracts/producto.contract";

const cases = [
  { quantity: 0.57, unit: 2.5, cents: 143 },
  { quantity: 0.29, unit: 0.5, cents: 15 },
  { quantity: 1.005, unit: 1, cents: 101 },
  { quantity: 2.675, unit: 1, cents: 268 },
  { quantity: 0.001, unit: 5, cents: 1 },
  { quantity: 0.569, unit: 2.5, cents: 142 },
  { quantity: 0.571, unit: 2.5, cents: 143 },
  { quantity: 0.57, unit: 2.49, cents: 142 },
  { quantity: 0.57, unit: 2.51, cents: 143 },
  { quantity: 2.9, unit: 1.8, cents: 522 },
  { quantity: 0.32, unit: 4, cents: 128 },
  { quantity: 0.48, unit: 3.5, cents: 168 },
  { quantity: 0.49, unit: 3.8, cents: 186 },
] as const;

function item(id: string, quantity = 0.57, unit = 2.5): CarItem {
  return { id, product: { id: "  opaque presentation / ? Ω  ", nombre: "Synthetic",
    precioVenta: unit, tipoVenta: TipoVentaEnum.Peso, unidadContenido: UnidadMedidaEnum.Kilogramo,
    fraccionable: true }, quantity, precioUnitario: unit, descuento: 0, montoModificado: false };
}

for (const { quantity, unit, cents } of cases) {
  test(`one HALF_UP product: ${quantity} x ${unit} = ${cents} cents in cart and fiscal scales`, () => {
    assert.equal(calculateSaleLineGrossCents({ quantityMilli: Math.round(quantity * 1000),
      unitPriceCents: Math.round(unit * 100) }), BigInt(cents));
    assert.equal(calculateSaleLineGrossAmount(unit, quantity), cents / 100);
    const cart = new CarritoVenta("opaque synthetic cart");
    cart.agregarProducto({ ...item("  opaque line / :? α  ", quantity, unit), montoTotal: 1.42 });
    assert.equal(cart.items[0].montoTotal, cents / 100);
    assert.equal(cart.items[0].quantity, quantity);
    assert.equal(cart.items[0].precioUnitario, unit);
    assert.equal(cart.items[0].montoModificado, false);
  });
}

test("POS price and quantity representation noise uses the same existing fiscal scales", () => {
  for (const unit of [2.5, 2.5 - Number.EPSILON * 2, 2.5 + Number.EPSILON * 2])
    for (const quantity of [0.57, 0.57 - Number.EPSILON, 0.57 + Number.EPSILON]) {
      assert.equal(calculateSaleLineGrossAmount(unit, quantity), 1.43);
      assert.equal(calculateSaleLineGrossCents({ unitPriceCents: Math.round(unit * 100),
        quantityMilli: Math.round(quantity * 1000) }), 143n);
    }
});

test("generic finite quantities/prices keep legitimate extra precision and exponent notation", () => {
  for (const [unit, quantity, amount] of [
    [0.0125, 2, 0.03], [2.5, 1.2345, 3.09],
    [0.010000005, 1000000, 10000.01],
    [100000000, 0.000000001, 0.1], [0.000000001, 1000000000, 1],
    [1e20, 1, 1e20], [Number.MAX_VALUE, 1, Number.MAX_VALUE],
    [0, Number.MAX_VALUE, 0], [5e-324, 1e308, 0],
  ]) assert.equal(calculateSaleLineGrossAmount(unit, quantity), amount);
  // Extra precision beyond a few ULPs is real generic input, not a price change.
  assert.equal(calculateSaleLineGrossAmount(2.5 - 1e-12, 0.57), 1.42);
});

test("scaled operands keep their safe integer contract and do not lose product precision", () => {
  const max = Number.MAX_SAFE_INTEGER;
  assert.equal(calculateSaleLineGrossCents({ unitPriceCents: max, quantityMilli: max }),
    (BigInt(max) * BigInt(max) + 500n) / 1000n);
  for (const invalid of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => calculateSaleLineGrossCents({ unitPriceCents: invalid, quantityMilli: 1 }), /INPUT_INVALID/);
    assert.throws(() => calculateSaleLineGrossCents({ unitPriceCents: 1, quantityMilli: invalid }), /INPUT_INVALID/);
  }
});

test("generic invalid/negative inputs remain invalid and finite-result overflow fails closed", () => {
  for (const invalid of [NaN, Infinity, -Infinity, -1]) {
    assert.throws(() => calculateSaleLineGrossAmount(invalid, 1), /INPUT_INVALID/);
    assert.throws(() => calculateSaleLineGrossAmount(1, invalid), /INPUT_INVALID/);
  }
  assert.throws(() => calculateSaleLineGrossAmount(Number.MAX_VALUE, 2), /AMOUNT_OVERFLOW/);
  assert.equal(calculateSaleLineGrossAmount(0, 1), 0);
  assert.equal(calculateSaleLineGrossAmount(1, 0), 0);
  assert.equal(calculateSaleLineGrossAmount(-0, 1), 0);
  assert.equal(calculateSaleLineGrossAmount(1, -0), 0);
  const cart = new CarritoVenta("opaque invalid cart");
  assert.throws(() => cart.agregarProducto(item("opaque negative", 1, -1)), /no puede ser negativo/);
  assert.throws(() => cart.agregarProducto(item("opaque zero quantity", 0, 1)), /debe ser mayor a 0/);
  assert.throws(() => cart.agregarProducto(item("opaque negative zero quantity", -0, 1)), /debe ser mayor a 0/);
});

test("the exact product is independent of declared presentation units and opaque identifiers", () => {
  for (const [tipoVenta, unidadContenido] of [
    [TipoVentaEnum.Peso, UnidadMedidaEnum.Kilogramo],
    [TipoVentaEnum.Peso, UnidadMedidaEnum.Gramo],
    [TipoVentaEnum.Volumen, UnidadMedidaEnum.Litro],
    [TipoVentaEnum.Unidad, UnidadMedidaEnum.Unidad],
  ] as const) {
    const cart = new CarritoVenta("  cart / unrelated opaque key Ω  ");
    cart.agregarProducto({ ...item("opaque line / !?"), product: {
      ...item("unused").product, tipoVenta, unidadContenido } });
    assert.equal(cart.items[0].id, "opaque line / !?");
    assert.equal(cart.items[0].product.id, "  opaque presentation / ? Ω  ");
    assert.equal(cart.items[0].product.unidadContenido, unidadContenido);
    assert.equal(cart.items[0].montoTotal, 1.43);
  }
});

test("grouping rounds the complete quantity product once; quantity updates use that same product", () => {
  const grouped = new CarritoVenta("opaque grouped");
  grouped.agregarProducto(item("opaque first", 0.285));
  grouped.agregarProducto(item("opaque second", 0.285));
  assert.equal(grouped.items.length, 1);
  assert.equal(grouped.items[0].id, "opaque first");
  assert.equal(grouped.items[0].quantity, 0.57);
  assert.equal(grouped.items[0].montoTotal, 1.43);
  const cart = new CarritoVenta("opaque updated");
  cart.agregarProducto(item("opaque line", 0.56));
  assert.equal(cart.incrementarCantidad("opaque line", 0.01), true);
  assert.equal(cart.items[0].quantity, 0.57);
  assert.equal(cart.items[0].montoTotal, 1.43);
  assert.equal(cart.decrementarCantidad("opaque line", 0.01), true);
  assert.equal(cart.items[0].quantity, 0.56);
  assert.equal(cart.items[0].montoTotal, 1.4);
});

function legacyCart(withManual = false): CarritoVenta {
  const cart = new CarritoVenta("opaque captured cart");
  for (const [id, price] of [["opaque a", 4.5], ["opaque b", 2.5], ["opaque c", 1]] as const)
    cart.agregarProductoSeparado({ ...item(id, 1, price), product: { ...item(id).product, id: id + " presentation" } });
  cart.agregarProductoSeparado(item("  opaque legacy calculated / Ω  "));
  if (withManual) cart.agregarProductoSeparado({ ...item("opaque manual"), montoModificado: true, montoTotal: 1.42 });
  const serialized = cart.toJSON();
  serialized.items[3].montoTotal = 1.42;
  serialized.updatedAt = new Date("2020-01-01T00:00:00.000Z");
  return CarritoVenta.fromJSON(serialized);
}

test("legacy hydration and historical serialization retain the stored 1.42 / 9.42 without a repair call", () => {
  const cart = legacyCart();
  const before = JSON.stringify(cart.toJSON());
  assert.equal(cart.total, 9.42);
  assert.equal(cart.toVentaSnapshot().items[3].montoTotal, 1.42);
  assert.equal(cart.toVentaSnapshot().total, 9.42);
  assert.equal(JSON.stringify(CarritoVenta.fromJSON(cart.toJSON()).toJSON()), before);
});

test("explicit bounded recalculation changes only selected computed amounts and derives headers", () => {
  const cart = legacyCart(true), before = cart.toJSON();
  const selectedId = "  opaque legacy calculated / Ω  ";
  const changes = cart.recalculateCalculatedLineTotals([selectedId, selectedId, "unknown opaque id"]);
  assert.deepEqual(changes, [{ lineId: selectedId, previousTotal: 1.42, nextTotal: 1.43 }]);
  const after = cart.toJSON();
  assert.equal(after.items[3].montoTotal, 1.43);
  for (let index = 0; index < after.items.length; index++) {
    const { montoTotal: _before, ...originalFacts } = before.items[index];
    const { montoTotal: _after, ...currentFacts } = after.items[index];
    assert.deepEqual(currentFacts, originalFacts);
    if (index !== 3) assert.equal(after.items[index].montoTotal, before.items[index].montoTotal);
  }
  assert.equal(after.items[4].montoTotal, 1.42);
  assert.equal(after.items[4].montoModificado, true);
  assert.equal(cart.subtotal, 10.85);
  assert.equal(cart.total, 10.85);
  assert.notEqual(after.updatedAt?.getTime(), before.updatedAt?.getTime());
  const stable = JSON.stringify(after);
  assert.deepEqual(cart.recalculateCalculatedLineTotals(), []);
  assert.equal(JSON.stringify(cart.toJSON()), stable);
});

test("explicit recalculation requires exact opaque selections and does not touch manual amounts", () => {
  const cart = legacyCart(true), before = JSON.stringify(cart.toJSON());
  assert.deepEqual(cart.recalculateCalculatedLineTotals([]), []);
  assert.deepEqual(cart.recalculateCalculatedLineTotals(["opaque legacy calculated / Ω"]), []);
  assert.deepEqual(cart.recalculateCalculatedLineTotals(["opaque manual"]), []);
  assert.equal(JSON.stringify(cart.toJSON()), before);
});

test("a failed explicit recalculation never partially mutates an earlier line or its timestamp", () => {
  const input: ICarritoVenta = legacyCart().toJSON();
  input.items.push({ ...item("opaque overflowing later", 2, Number.MAX_VALUE), montoTotal: 1 });
  const cart = CarritoVenta.fromJSON(input), before = JSON.stringify(cart.toJSON());
  assert.throws(() => cart.recalculateCalculatedLineTotals(), /AMOUNT_OVERFLOW/);
  assert.equal(JSON.stringify(cart.toJSON()), before);
});

test("scaled and generic faces agree over a deterministic POS quantity/price grid", () => {
  for (let count = 1; count <= 1000; count++) {
    const quantityMilli = count * 317 % 99991 + 1;
    const unitPriceCents = count * 173 % 50003 + 1;
    const expected = (BigInt(quantityMilli) * BigInt(unitPriceCents) + 500n) / 1000n;
    assert.equal(calculateSaleLineGrossCents({ quantityMilli, unitPriceCents }), expected);
    assert.equal(calculateSaleLineGrossAmount(unitPriceCents / 100, quantityMilli / 1000), Number(expected) / 100);
  }
});
