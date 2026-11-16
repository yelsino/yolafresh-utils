export interface ScaledSaleLineMoney {
  readonly quantityMilli: number;
  readonly unitPriceCents: number;
}

const failInput = (): never => { throw new Error("SALE_LINE_MONEY_INPUT_INVALID"); };

/** One non-negative HALF_UP operation, after the complete exact product. */
function roundProductToCents(coefficient: bigint, decimalScale: number): bigint {
  const centsScale = decimalScale - 2;
  if (centsScale <= 0) return coefficient * 10n ** BigInt(-centsScale);
  const denominator = 10n ** BigInt(centsScale);
  return (coefficient + denominator / 2n) / denominator;
}

/** The fiscal/POS representation: thousandths of the commercial quantity and
 * cents of its price. Callers keep their own admission and overflow guards. */
export function calculateSaleLineGrossCents(input: ScaledSaleLineMoney): bigint {
  if (!Number.isSafeInteger(input.quantityMilli) || input.quantityMilli < 0 ||
      !Number.isSafeInteger(input.unitPriceCents) || input.unitPriceCents < 0) return failInput();
  return roundProductToCents(BigInt(input.quantityMilli) * BigInt(input.unitPriceCents), 5);
}

function decimalParts(value: number): { coefficient: bigint; scale: number } {
  const [mantissa, exponent = "0"] = value.toString().toLowerCase().split("e");
  const point = mantissa.indexOf(".");
  return { coefficient: BigInt(mantissa.replace(".", "")),
    scale: (point < 0 ? 0 : mantissa.length - point - 1) - Number(exponent) };
}

/** Match a genuinely scaled value despite representation noise. The existing
 * fiscal limit is an upper bound; the ULP bound preserves real extra precision
 * accepted by the generic cart API instead of silently quantizing it. */
function scaledOperand(value: number, scale: number): number | undefined {
  const scaled = value * scale;
  const integer = Math.round(scaled);
  if (!Number.isSafeInteger(integer) || value > 0 && integer === 0) return undefined;
  const representationNoise = Math.min(0.000001,
    Math.max(1, Math.abs(scaled)) * Number.EPSILON * 4);
  return Math.abs(scaled - integer) <= representationNoise ? integer : undefined;
}

/** Generic cart facade. It retains finite decimal/exponent quantities and
 * prices beyond the POS scales, without ever multiplying two floats as money. */
export function calculateSaleLineGrossAmount(unitAmount: number, quantity: number): number {
  if (!Number.isFinite(unitAmount) || unitAmount < 0 ||
      !Number.isFinite(quantity) || quantity < 0) return failInput();
  const unitPriceCents = scaledOperand(unitAmount, 100);
  const quantityMilli = scaledOperand(quantity, 1000);
  const cents = unitPriceCents !== undefined && quantityMilli !== undefined
    ? calculateSaleLineGrossCents({ unitPriceCents, quantityMilli })
    : (() => {
        const unit = decimalParts(unitAmount), count = decimalParts(quantity);
        return roundProductToCents(unit.coefficient * count.coefficient, unit.scale + count.scale);
      })();
  // Parsing the decimal exponent avoids an intermediate Number(cents) overflow
  // when the final generic monetary value is still finite.
  const amount = Number(`${cents}e-2`);
  if (!Number.isFinite(amount)) throw new Error("SALE_LINE_MONEY_AMOUNT_OVERFLOW");
  return amount;
}
