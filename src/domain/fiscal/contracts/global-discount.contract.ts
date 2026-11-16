/** A separate global allowance; it never rewrites lines or reduces their IGV/IVAP bases. */
export interface FiscalV1GlobalDiscount {
  readonly schemaVersion: 1;
  readonly amountCents: number;
  readonly baseCents: number;
  readonly reasonCode: "03";
  readonly affectsTaxBase: false;
}

/** Exact cent amounts only. The supported lane must retain a positive payable. */
export function assertFiscalV1GlobalDiscount(value: unknown, baseCents: number): asserts value is FiscalV1GlobalDiscount {
  const fail = (): never => { throw new Error("FISCAL_V1_GLOBAL_DISCOUNT_INVALID"); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
  const row = value as Record<string, unknown>;
  const keys = ["schemaVersion", "amountCents", "baseCents", "reasonCode", "affectsTaxBase"];
  if (Reflect.ownKeys(row).length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(row, key)) ||
      row.schemaVersion !== 1 || row.reasonCode !== "03" || row.affectsTaxBase !== false ||
      !Number.isSafeInteger(baseCents) || baseCents <= 0 || row.baseCents !== baseCents ||
      !Number.isSafeInteger(row.amountCents) || Number(row.amountCents) <= 0 || Number(row.amountCents) >= baseCents)
    return fail();
}
