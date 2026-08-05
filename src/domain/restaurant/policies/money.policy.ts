import type {
  CargoCuentaRestaurante,
  TotalesCuentaRestaurante,
} from "../contracts/account.contract";
import type {
  DineroRestaurante,
  MonedaRestaurante,
} from "../contracts/common.contract";

export function dineroRestaurante(
  minorUnits: number,
  currency: MonedaRestaurante = "PEN",
): DineroRestaurante {
  if (!Number.isSafeInteger(minorUnits)) {
    throw new Error("DineroRestaurante.minorUnits debe ser un entero seguro");
  }
  return Object.freeze({ currency, minorUnits });
}

export function sumarDineroRestaurante(
  left: DineroRestaurante,
  right: DineroRestaurante,
): DineroRestaurante {
  assertSameCurrency(left, right);
  return dineroRestaurante(left.minorUnits + right.minorUnits, left.currency);
}

export function restarDineroRestaurante(
  left: DineroRestaurante,
  right: DineroRestaurante,
): DineroRestaurante {
  assertSameCurrency(left, right);
  return dineroRestaurante(left.minorUnits - right.minorUnits, left.currency);
}

export function calcularTotalesCuentaRestaurante(input: {
  currency: MonedaRestaurante;
  cargos: readonly CargoCuentaRestaurante[];
  servicio?: DineroRestaurante;
  propina?: DineroRestaurante;
  redondeo?: DineroRestaurante;
  pagos?: readonly DineroRestaurante[];
}): TotalesCuentaRestaurante {
  const zero = dineroRestaurante(0, input.currency);
  const servicio = input.servicio ?? zero;
  const propina = input.propina ?? zero;
  const redondeo = input.redondeo ?? zero;
  const subtotal = sumarListaDineroRestaurante(
    input.cargos.map((charge) => charge.subtotal),
    input.currency,
  );
  const descuento = sumarListaDineroRestaurante(
    input.cargos.map((charge) => charge.descuento),
    input.currency,
  );
  const impuesto = sumarListaDineroRestaurante(
    input.cargos.map((charge) => charge.impuesto),
    input.currency,
  );
  const cargoTotal = sumarListaDineroRestaurante(
    input.cargos.map((charge) => charge.total),
    input.currency,
  );
  const total = [servicio, propina, redondeo].reduce(
    sumarDineroRestaurante,
    cargoTotal,
  );
  const pagado = sumarListaDineroRestaurante(input.pagos ?? [], input.currency);
  const saldo = restarDineroRestaurante(total, pagado);
  if (saldo.minorUnits < 0) {
    throw new Error("Los pagos aplicados no pueden exceder el total de la cuenta");
  }
  return {
    subtotal,
    descuento,
    impuesto,
    servicio,
    propina,
    redondeo,
    total,
    pagado,
    saldo,
  };
}

export function sumarListaDineroRestaurante(
  values: readonly DineroRestaurante[],
  currency: MonedaRestaurante,
): DineroRestaurante {
  return values.reduce(
    sumarDineroRestaurante,
    dineroRestaurante(0, currency),
  );
}

function assertSameCurrency(
  left: DineroRestaurante,
  right: DineroRestaurante,
): void {
  if (left.currency !== right.currency) {
    throw new Error("No se puede operar dinero de monedas diferentes");
  }
}
