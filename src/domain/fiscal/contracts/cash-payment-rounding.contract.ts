/** A declared cash collection adjustment. It never changes fiscal line bases or tax. */
export interface FiscalCashPaymentRounding {
  readonly schemaVersion: 1;
  readonly amountCents: number;
  /** Opaque policy reference; its text does not determine payment semantics. */
  readonly policyId: string;
  readonly policyVersion: number;
  readonly currency: "PEN";
  readonly stepCents: 10;
  readonly direction: "A_FAVOR_CLIENTE";
  readonly application: "EFECTIVO_TOTAL";
}

/** Initial supported lane: round down the full cash payment to ten cents. */
export function assertFiscalCashPaymentRounding(
  value: unknown,
  preTotalCents: number,
  payableCents?: number,
): asserts value is FiscalCashPaymentRounding {
  const fail = (): never => { throw new Error("FISCAL_CASH_PAYMENT_ROUNDING_INVALID"); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
  const row = value as Record<string, unknown>;
  const keys = ["schemaVersion", "amountCents", "policyId", "policyVersion", "currency", "stepCents", "direction", "application"];
  if (Object.keys(row).length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(row, key)) ||
      row.schemaVersion !== 1 || typeof row.policyId !== "string" || !row.policyId.trim() ||
      !Number.isSafeInteger(row.policyVersion) || Number(row.policyVersion) < 1 ||
      row.currency !== "PEN" || row.stepCents !== 10 || row.direction !== "A_FAVOR_CLIENTE" ||
      row.application !== "EFECTIVO_TOTAL" || !Number.isSafeInteger(preTotalCents) || preTotalCents <= 0 ||
      !Number.isSafeInteger(row.amountCents) || Number(row.amountCents) < -9 || Number(row.amountCents) > -1 ||
      row.amountCents !== -(preTotalCents % 10)) return fail();
  const expected = preTotalCents + Number(row.amountCents);
  if (!Number.isSafeInteger(expected) || expected <= 0 ||
      payableCents !== undefined && (!Number.isSafeInteger(payableCents) || payableCents !== expected)) return fail();
}
