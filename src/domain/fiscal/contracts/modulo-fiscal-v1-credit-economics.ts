import { calculateSaleLineGrossCents } from "../../ventas/contracts/sale-line-money";
import type { FiscalV1PreparedCreditNote } from "./modulo-fiscal-v1-evidencia.contract";

type PreparedLine = FiscalV1PreparedCreditNote["lines"][number];
const invalid = (): never => { throw new Error("FISCAL_V1_CREDIT_NOTE_ECONOMICS_INVALID"); };
const cents = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;

/** Projection of an already-authorized prepared line, NOT admission of remote
 * input. The preparation must first be revalidated against original + history.
 * No-discount legacy lines retain their recorded amount as gross and net. */
export function fiscalV1PreparedCreditLineEconomics(line: PreparedLine,
  quantityProration?: "CUMULATIVE"): Readonly<{ grossCents: number; discountCents: number; totalCents: number }> {
  if (!line || !cents(line.creditQuantityMilli) || line.creditQuantityMilli <= 0 ||
      !cents(line.originalQuantityMilli) || line.originalQuantityMilli <= 0 ||
      line.creditQuantityMilli > line.originalQuantityMilli ||
      !cents(line.originalUnitPriceCents) || line.originalUnitPriceCents <= 0 ||
      !cents(line.creditCents) || line.creditCents <= 0 || !cents(line.originalDiscountCents) ||
      (quantityProration !== undefined && quantityProration !== "CUMULATIVE") ||
      (line.roundingAdjustmentCents !== undefined &&
        (!Number.isSafeInteger(line.roundingAdjustmentCents) || Math.abs(line.roundingAdjustmentCents) > 1))) invalid();
  if (line.originalDiscountCents === 0)
    return { grossCents: line.creditCents, discountCents: 0, totalCents: line.creditCents };
  if (quantityProration !== "CUMULATIVE") invalid();
  const originalGross = calculateSaleLineGrossCents({ quantityMilli: line.originalQuantityMilli,
    unitPriceCents: line.originalUnitPriceCents });
  const gross = calculateSaleLineGrossCents({ quantityMilli: line.creditQuantityMilli,
    unitPriceCents: line.originalUnitPriceCents }) + BigInt(line.roundingAdjustmentCents ?? 0);
  const discount = gross - BigInt(line.creditCents);
  if (originalGross > BigInt(Number.MAX_SAFE_INTEGER) || originalGross <= BigInt(line.originalDiscountCents) ||
      gross <= 0n || gross > originalGross || discount < 0n || discount > BigInt(line.originalDiscountCents) ||
      BigInt(line.creditCents) > originalGross - BigInt(line.originalDiscountCents) ||
      (line.creditQuantityMilli === line.originalQuantityMilli &&
        (gross !== originalGross || discount !== BigInt(line.originalDiscountCents)))) invalid();
  return { grossCents: Number(gross), discountCents: Number(discount), totalCents: line.creditCents };
}
