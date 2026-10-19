import { strict as assert } from "node:assert";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { assertCreditNoteCommercialOperation, assertCreditNoteCommercialRequest,
  creditNoteRefundDueCents, creditNotePhysicalReturnPending,
  type CreditNoteCommercialOperation } from "../../ventas/contracts";

const operation = (): CreditNoteCommercialOperation => ({
  type: "devolucion_venta", schemaVersion: 1, commercialOperationId: "opaque return", fiscalOperationId: "fiscal opaque",
  tenantId: "test tenant", originalDocumentId: "original", creditNoteDocumentId: "note", saleId: "sale", saleSnapshotId: "snapshot",
  currency: "PEN", createdBy: "actor", createdAt: 1, updatedAt: 1, adjustmentCents: 1000,
  returnLines: [{ originalLineId: "opaque/line", quantity: "2", stockExpected: true }],
  moneyFacts: { clientId: "client", accountId: "account", saleDebtMovementId: "debit", outstandingDebtCents: 300,
    refundablePaidCents: 500, appliedCustomerBalanceCents: 200, unverifiedCents: 0 },
  debtReductionCents: 300, customerBalanceRestoreCents: 200, debtIdempotencyKey: "opaque key", debt: "DONE", batches: [], status: "PENDING",
});
const receiptBatch = (requestId: string, quantity: string, offset: string) => ({
  request: { requestId, receipts: [{ originalLineId: "opaque/line", quantity, condition: "SELLABLE" as const, warehouseId: "w" }], refund: null },
  requestFingerprint: "fp", actorId: "actor", createdAt: 1,
  stockIdentities: [{ movementId: `${offset}a`, movementLineId: `${offset}b`, movementOperationId: `${offset}c`, idempotencyKey: `${offset}d` }],
  stock: "DONE" as const, refund: "DONE" as const,
});
test("debt and restored customer balance are not cash refunds", () => {
  const op = operation(); assertCreditNoteCommercialOperation(op);
  assert.equal(creditNoteRefundDueCents(op), 500); assert.equal(creditNotePhysicalReturnPending(op), true);
});
test("split physical receipts are exact and cumulative across requests", () => {
  const op = { ...operation(), batches: [receiptBatch("one", "0.75", "a"), receiptBatch("two", "1.25", "b")] };
  assertCreditNoteCommercialOperation(op); assert.equal(creditNotePhysicalReturnPending(op), false);
  assert.throws(() => assertCreditNoteCommercialOperation({ ...op, batches: [...op.batches, receiptBatch("three", "0.0000000001", "c")] }), /QUANTITY_EXCEEDED/);
});
test("reservations consume cash entitlement even before an acknowledgement", () => {
  const refund = { request: { requestId: "refund", receipts: [], refund: { amountCents: 500, method: "EFECTIVO" as const,
    cashBoxId: "box", cashShiftId: "shift", confirmedAt: 1 } }, requestFingerprint: "fp", actorId: "actor", createdAt: 1,
    refundMovementId: "cashdoc", stockIdentities: [], stock: "DONE" as const, refund: "PENDING" as const };
  const op = { ...operation(), batches: [refund] }; assertCreditNoteCommercialOperation(op);
  assert.equal(creditNoteRefundDueCents(op), 500);
  assert.throws(() => assertCreditNoteCommercialOperation({ ...op, batches: [refund, { ...refund,
    request: { ...refund.request, requestId: "second" }, refundMovementId: "other" }] }), /REFUND_EXCEEDED/);
});
test("completion requires physical receipt as well as settled cash", () => {
  const op = { ...operation(), adjustmentCents: 500, status: "COMPLETED" };
  assert.throws(() => assertCreditNoteCommercialOperation(op), /COMPLETION_INVALID/);
  assertCreditNoteCommercialOperation({ ...op, batches: [receiptBatch("received", "2", "z")] });
});
test("damaged receipt needs explicit disposal and digital refund needs evidence", () => {
  assert.throws(() => assertCreditNoteCommercialRequest({ requestId: "x", receipts: [{ originalLineId: "line", quantity: "1", condition: "DAMAGED" }], refund: null }), /DISPOSITION/);
  assertCreditNoteCommercialRequest({ requestId: "x", receipts: [{ originalLineId: "line", quantity: "1", condition: "DAMAGED", disposition: "DISCARDED" }], refund: null });
  assert.throws(() => assertCreditNoteCommercialRequest({ requestId: "x", receipts: [], refund: { amountCents: 1, method: "DIGITAL", cashBoxId: "box", cashShiftId: "shift", confirmedAt: 1 } }), /CONFIRMATION/);
});

test("commercial contracts load without fiscal runtime and preserve the compatibility export", () => {
  const child = spawnSync(process.execPath, ["-e", `
    const assert = require('node:assert/strict');
    const path = require('node:path');
    const commercial = require(process.argv[1]);
    assert.equal(typeof commercial.assertCreditNoteCommercialOperation, 'function');
    assert.deepEqual(Object.keys(require.cache).filter(file => file.includes(path.sep + 'fiscal' + path.sep)), []);
    const compatible = require(process.argv[2]);
    assert.equal(compatible.assertCreditNoteCommercialOperation, commercial.assertCreditNoteCommercialOperation);
  `, require.resolve("../../ventas/contracts"), require.resolve("../contracts/credit-note-commercial.contract")], { encoding: "utf8" });
  assert.equal(child.status, 0, child.stderr);
});
