import type { FiscalBuyer, FiscalCurrency, FiscalDocumentIdentity } from "./cpe.contract";
import { fiscalConfigurationCanonicalJson } from "./configuracion-fiscal";
import { validateFiscalSignedDocument, type FiscalDocumentLine, type FiscalDocumentTotals, type FiscalSignedDocument } from "./comprobante-electronico.contract";

/** MVP monetary adjustments to boletas; no generic discount/identity correction. */
export type FiscalCreditNoteReason = "01" | "06" | "07";
export interface FiscalCreditNoteCommand {
  readonly operationId: string;
  readonly idempotencyKey: string;
  readonly reasonCode: FiscalCreditNoteReason;
  readonly reason: string;
  /** Empty for full adjustment. IDs are opaque original line references. */
  readonly selections: readonly { readonly originalLineId: string; readonly quantity: string }[];
}
export interface FiscalCreditNoteSnapshot {
  readonly contractKind: "YOLAFRESH_CREDIT_NOTE";
  readonly schemaVersion: 1;
  readonly operationId: string;
  readonly idempotencyKey: string;
  readonly tenantId: string;
  readonly environment: "DEMO" | "PRODUCCION";
  readonly originalDocumentId: string;
  readonly originalIdentity: FiscalDocumentIdentity;
  readonly originalXmlSha256: string;
  readonly originalIssueDate: string;
  readonly reasonCode: FiscalCreditNoteReason;
  readonly reason: string;
  readonly issuer: FiscalSignedDocument["issuer"];
  readonly buyer: FiscalBuyer;
  readonly currency: FiscalCurrency;
  readonly lines: readonly FiscalDocumentLine[];
  readonly totals: FiscalDocumentTotals;
}
export class FiscalCreditNoteError extends Error {}
const fail = (code: string): never => { throw new FiscalCreditNoteError(code); };
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const cents = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const SCALE = 10n ** 10n;
export function fiscalCreditQuantity(value: unknown): bigint {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,10})?$/.test(value)) return fail("CREDIT_NOTE_QUANTITY_INVALID");
  const [whole, fraction = ""] = value.split(".");
  const result = BigInt(whole) * SCALE + BigInt(fraction.padEnd(10, "0"));
  if (result <= 0n) return fail("CREDIT_NOTE_QUANTITY_INVALID");
  return result;
}
const quantityString = (q: bigint): string => {
  const fraction = (q % SCALE).toString().padStart(10, "0").replace(/0+$/, "");
  return `${q / SCALE}${fraction ? `.${fraction}` : ""}`;
};
const proportional = (amount: number, quantity: bigint, total: bigint): number => {
  const result = (BigInt(amount) * quantity * 2n + total) / (total * 2n);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) return fail("CREDIT_NOTE_AMOUNT_OVERFLOW");
  return Number(result);
};
function totals(lines: readonly FiscalDocumentLine[]): FiscalDocumentTotals {
  const out = { taxableBaseCents: 0, exemptCents: 0, unaffectedCents: 0, taxCents: 0, payableCents: 0 };
  for (const line of lines) {
    const key = line.tax.category === "GRAVADA" ? "taxableBaseCents" : line.tax.category === "EXONERADA" ? "exemptCents" : "unaffectedCents";
    out[key] += line.tax.taxableBaseCents; out.taxCents += line.tax.taxAmountCents; out.payableCents += line.totalCents;
  }
  if (Object.values(out).some(v => !cents(v))) return fail("CREDIT_NOTE_AMOUNT_OVERFLOW");
  return out;
}
/** Pure client + server policy. History includes reservations/ambiguous signatures,
 * not only accepted notes: otherwise a second device could over-credit in flight.
 * A reservation is released ONLY with definitive proof it was never signed.
 */
export function prepareFiscalCreditNote(original: FiscalSignedDocument, command: FiscalCreditNoteCommand,
  consumingHistory: readonly FiscalCreditNoteSnapshot[]): FiscalCreditNoteSnapshot {
  if (validateFiscalSignedDocument(original).length || original.origin.kind !== "VENTA" || original.identity.documentType !== "BOLETA")
    return fail("CREDIT_NOTE_ORIGINAL_INVALID");
  if (!command || !["01", "06", "07"].includes(command.reasonCode)) return fail("CREDIT_NOTE_REASON_UNSUPPORTED");
  if (!text(command.operationId) || !text(command.idempotencyKey) || command.idempotencyKey.length > 240 ||
      !text(command.reason) || command.reason.length > 500 || !Array.isArray(command.selections)) return fail("CREDIT_NOTE_COMMAND_INVALID");
  const originalLines = new Map(original.lines.map(line => [line.lineId, line]));
  const used = new Map<string, { quantity: bigint; gross: number; discount: number; total: number; tax: number }>();
  const operations = new Set<string>();
  const keys = new Set<string>();
  for (const previous of consumingHistory) {
    if (!previous || previous.contractKind !== "YOLAFRESH_CREDIT_NOTE" || previous.schemaVersion !== 1 ||
        !text(previous.operationId) || !text(previous.idempotencyKey) || !["01", "06", "07"].includes(previous.reasonCode) ||
        !text(previous.reason) || !Array.isArray(previous.lines) || !previous.lines.length ||
        previous.tenantId !== original.tenantId || previous.environment !== original.environment ||
        previous.originalDocumentId !== original.documentId || previous.originalXmlSha256 !== original.signature.signedXml.sha256 ||
        previous.originalIssueDate !== original.issueDate || previous.currency !== original.currency ||
        fiscalConfigurationCanonicalJson(previous.issuer) !== fiscalConfigurationCanonicalJson(original.issuer) ||
        fiscalConfigurationCanonicalJson(previous.buyer) !== fiscalConfigurationCanonicalJson(original.buyer) ||
        fiscalConfigurationCanonicalJson(previous.originalIdentity) !== fiscalConfigurationCanonicalJson(original.identity) ||
        operations.has(previous.operationId) || keys.has(previous.idempotencyKey))
      return fail("CREDIT_NOTE_HISTORY_SCOPE");
    operations.add(previous.operationId);
    keys.add(previous.idempotencyKey);
    const priorLines = new Set<string>();
    for (const line of previous.lines) {
      const source = originalLines.get(line.lineId);
      if (!source || !line.tax || priorLines.has(line.lineId) || line.description !== source.description || line.unitCode !== source.unitCode ||
          line.unitPriceCents !== source.unitPriceCents || line.tax.category !== source.tax.category ||
          line.tax.affectationCode !== source.tax.affectationCode || line.tax.taxRateBasisPoints !== source.tax.taxRateBasisPoints ||
          line.tax.taxScheme !== source.tax.taxScheme || line.tax.taxableBaseCents !== line.totalCents - line.tax.taxAmountCents ||
          [line.grossCents, line.discountCents, line.totalCents, line.tax.taxAmountCents].some(v => !cents(v)))
        return fail("CREDIT_NOTE_HISTORY_INVALID");
      priorLines.add(line.lineId);
      const prior = used.get(line.lineId) ?? { quantity: 0n, gross: 0, discount: 0, total: 0, tax: 0 };
      prior.quantity += fiscalCreditQuantity(line.quantity);
      prior.gross += line.grossCents; prior.discount += line.discountCents; prior.total += line.totalCents; prior.tax += line.tax.taxAmountCents;
      const q = fiscalCreditQuantity(source.quantity);
      if (prior.quantity > q || prior.gross !== proportional(source.grossCents, prior.quantity, q) ||
          prior.total !== proportional(source.totalCents, prior.quantity, q) || prior.tax !== proportional(source.tax.taxAmountCents, prior.quantity, q) ||
          prior.discount !== prior.gross - prior.total) return fail("CREDIT_NOTE_HISTORY_INVALID");
      used.set(line.lineId, prior);
    }
    if (fiscalConfigurationCanonicalJson(previous.totals) !== fiscalConfigurationCanonicalJson(totals(previous.lines)))
      return fail("CREDIT_NOTE_HISTORY_INVALID");
  }
  if (operations.has(command.operationId)) return fail("CREDIT_NOTE_OPERATION_ALREADY_RESERVED");
  if (keys.has(command.idempotencyKey)) return fail("CREDIT_NOTE_KEY_ALREADY_RESERVED");
  if (command.reasonCode !== "07" && consumingHistory.length) return fail("CREDIT_NOTE_FULL_AFTER_PARTIAL");
  if (command.reasonCode !== "07" && command.selections.length) return fail("CREDIT_NOTE_FULL_SELECTIONS_INVALID");
  const selected = command.reasonCode === "07" ? command.selections : original.lines.map(l => ({ originalLineId: l.lineId, quantity: l.quantity }));
  if (!selected.length) return fail("CREDIT_NOTE_LINES_REQUIRED");
  const seen = new Set<string>();
  const lines = selected.map(selection => {
    if (seen.has(selection.originalLineId)) return fail("CREDIT_NOTE_DUPLICATE_LINE");
    seen.add(selection.originalLineId);
    const source = originalLines.get(selection.originalLineId);
    if (!source) return fail("CREDIT_NOTE_LINE_NOT_FOUND");
    const quantity = fiscalCreditQuantity(selection.quantity);
    const totalQuantity = fiscalCreditQuantity(source.quantity);
    const prior = used.get(source.lineId) ?? { quantity: 0n, gross: 0, discount: 0, total: 0, tax: 0 };
    const cumulative = prior.quantity + quantity;
    if (cumulative > totalQuantity) return fail("CREDIT_NOTE_QUANTITY_EXCEEDED");
    const grossCents = proportional(source.grossCents, cumulative, totalQuantity) - prior.gross;
    const totalCents = proportional(source.totalCents, cumulative, totalQuantity) - prior.total;
    const taxAmountCents = proportional(source.tax.taxAmountCents, cumulative, totalQuantity) - prior.tax;
    const discountCents = grossCents - totalCents;
    const roundingAdjustmentCents = grossCents - proportional(source.unitPriceCents, quantity, SCALE);
    if (Math.abs(roundingAdjustmentCents) > 1) return fail("CREDIT_NOTE_ROUNDING_UNREPRESENTABLE");
    if (discountCents < 0 || taxAmountCents > totalCents) return fail("CREDIT_NOTE_ROUNDING_UNREPRESENTABLE");
    return { ...source, quantity: quantityString(quantity), grossCents, discountCents, totalCents,
      ...(roundingAdjustmentCents ? { roundingAdjustmentCents } : {}),
      tax: { ...source.tax, taxableBaseCents: totalCents - taxAmountCents, taxAmountCents } } as FiscalDocumentLine;
  });
  const resultTotals = totals(lines);
  if (!resultTotals.payableCents) return fail("CREDIT_NOTE_ZERO_ADJUSTMENT");
  return JSON.parse(JSON.stringify({ contractKind: "YOLAFRESH_CREDIT_NOTE", schemaVersion: 1,
    operationId: command.operationId, idempotencyKey: command.idempotencyKey,
    tenantId: original.tenantId, environment: original.environment, originalDocumentId: original.documentId,
    originalIdentity: original.identity, originalXmlSha256: original.signature.signedXml.sha256, originalIssueDate: original.issueDate,
    reasonCode: command.reasonCode, reason: command.reason, issuer: original.issuer, buyer: original.buyer, currency: original.currency,
    lines, totals: resultTotals })) as FiscalCreditNoteSnapshot;
}
/** Boundary validation against authoritative historical facts, not today's catalogue. */
export function assertFiscalCreditNoteSnapshot(raw: FiscalCreditNoteSnapshot, original: FiscalSignedDocument,
  history: readonly FiscalCreditNoteSnapshot[]): void {
  if (!raw || !Array.isArray(raw.lines)) return fail("CREDIT_NOTE_SNAPSHOT_INVALID");
  const expected = prepareFiscalCreditNote(original, { operationId: raw.operationId, idempotencyKey: raw.idempotencyKey,
    reasonCode: raw.reasonCode, reason: raw.reason, selections: raw.reasonCode === "07" ?
      raw.lines.map(line => ({ originalLineId: line.lineId, quantity: line.quantity })) : [] }, history);
  if (fiscalConfigurationCanonicalJson(raw) !== fiscalConfigurationCanonicalJson(expected)) return fail("CREDIT_NOTE_SNAPSHOT_MISMATCH");
}

/** Financial intention, not proof of refund. Caller registers actual movements
 * with stable operation IDs. Stock requires separate physical-return facts.
 */
export function planCreditNoteSettlement(input: { adjustmentCents: number; outstandingDebtCents: number;
  refundablePaidCents: number; refundRequestedCents: number; fiscalDuplicateOnly: boolean }):
  { debtReductionCents: number; refundCents: number; refundDueCents: number } {
  if ([input.adjustmentCents, input.outstandingDebtCents, input.refundablePaidCents, input.refundRequestedCents].some(v => !cents(v))) return fail("CREDIT_NOTE_SETTLEMENT_INVALID");
  if (input.fiscalDuplicateOnly) {
    if (input.refundRequestedCents) return fail("CREDIT_NOTE_DUPLICATE_REFUND_FORBIDDEN");
    return { debtReductionCents: 0, refundCents: 0, refundDueCents: 0 };
  }
  const debtReductionCents = Math.min(input.adjustmentCents, input.outstandingDebtCents);
  const refundDue = input.adjustmentCents - debtReductionCents;
  if (refundDue > input.refundablePaidCents || input.refundRequestedCents > refundDue) return fail("CREDIT_NOTE_REFUND_EXCEEDED");
  return { debtReductionCents, refundCents: input.refundRequestedCents, refundDueCents: refundDue - input.refundRequestedCents };
}
