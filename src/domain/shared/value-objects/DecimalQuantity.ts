/** Exact positive decimal quantity in units of 10^-10; no binary floating-point conversion. */
export const DECIMAL_QUANTITY_SCALE = 10n ** 10n;
export class DecimalQuantityError extends Error {}
export function positiveDecimalQuantity(value: unknown): bigint {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,10})?$/.test(value))
    throw new DecimalQuantityError("DECIMAL_QUANTITY_INVALID");
  const [whole, fraction = ""] = value.split(".");
  const result = BigInt(whole) * DECIMAL_QUANTITY_SCALE + BigInt(fraction.padEnd(10, "0"));
  if (result <= 0n) throw new DecimalQuantityError("DECIMAL_QUANTITY_INVALID");
  return result;
}
