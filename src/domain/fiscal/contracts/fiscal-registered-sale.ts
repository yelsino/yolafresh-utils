import type { IVentaSnapshot } from "../../ventas/contracts/venta-snapshot.contract";
import type { FiscalV1RegisteredCashEvidence, FiscalV1RegisteredCashSaleSource, FiscalV1RegisteredSaleSource } from "./modulo-fiscal-v1-evidencia.contract";
import { fiscalV1CanonicalSha256 } from "./modulo-fiscal-v1";
import { validarVentaCobro } from "../../ventas/contracts/venta-cobro.contract";
import { assertFiscalCashPaymentRounding } from "./cash-payment-rounding.contract";
import { calculateSaleLineGrossCents } from "../../ventas/contracts/sale-line-money";

/** Fiscal source projection. Excludes storage envelopes, images and mutable client data.
 * CouchDB callers map opaque `_id` to `id` at the adapter boundary. */
export function fiscalV1RegisteredSaleSource(snapshot: Pick<IVentaSnapshot,
  "id" | "ventaId" | "moneda" | "total" | "items">): FiscalV1RegisteredSaleSource {
  return { kind: "REGISTERED_SALE", snapshotId: snapshot.id,
    snapshotSha256: fiscalV1CanonicalSha256({ snapshotId: snapshot.id, saleId: snapshot.ventaId,
      currency: snapshot.moneda, total: snapshot.total,
      lines: snapshot.items.map(item => ({ lineId: item.id, presentationId: item.presentacionId,
        description: item.nombre, quantity: item.cantidadVendida,
        unitPrice: item.precioUnitario, total: item.total })) }) };
}

/** Separate versioned cash projection. The historical credit projection above
 * remains byte-for-byte unchanged. Missing optional facts remain explicit nulls;
 * no discount, manual override, payment or rounding is inferred. */
export function fiscalV1RegisteredCashSaleSource(snapshot: Pick<IVentaSnapshot,
  "id" | "ventaId" | "createdAt" | "moneda" | "subtotal" | "descuentoTotal" | "descuentoVenta" |
  "impuesto" | "montoRedondeo" | "redondeoPago" | "total" | "cobro" | "items" | "fiscalDocumentSelection">,
  evidence: FiscalV1RegisteredCashEvidence): FiscalV1RegisteredCashSaleSource {
  if (!snapshot || !Number.isSafeInteger(snapshot.createdAt) || snapshot.createdAt < 0 ||
      typeof snapshot.id !== "string" || !snapshot.id.trim() || typeof snapshot.ventaId !== "string" || !snapshot.ventaId.trim())
    throw new Error("FISCAL_V1_REGISTERED_CASH_SOURCE_INVALID");
  if (evidence.saleId !== snapshot.ventaId || evidence.netAmountCents !== Math.round(snapshot.total * 100))
    throw new Error("FISCAL_V1_REGISTERED_CASH_SOURCE_INVALID");
  return { kind: "REGISTERED_CASH_SALE", snapshotId: snapshot.id,
    cashEvidenceSha256: fiscalV1RegisteredCashEvidenceSha256(evidence),
    snapshotSha256: fiscalV1CanonicalSha256({ schemaVersion: 1, snapshotId: snapshot.id, saleId: snapshot.ventaId,
      createdAt: snapshot.createdAt, currency: snapshot.moneda ?? null, subtotal: snapshot.subtotal,
      discountTotal: snapshot.descuentoTotal ?? null, saleDiscount: snapshot.descuentoVenta ?? null,
      tax: snapshot.impuesto, roundingAmount: snapshot.montoRedondeo ?? null,
      paymentRounding: snapshot.redondeoPago ?? null, total: snapshot.total, cashCollection: snapshot.cobro ?? null,
      documentSelection: snapshot.fiscalDocumentSelection ?? null,
      lines: snapshot.items.map(item => ({ lineId: item.id, presentationId: item.presentacionId,
        description: item.nombre, quantity: item.cantidadVendida, unitPrice: item.precioUnitario,
        grossTotal: item.total, manualGross: item.montoModificado ?? null, discount: item.descuento ?? null })) }) };
}

/** Public financial facts only, independent of Couch envelopes and traversal order. */
export function fiscalV1RegisteredCashEvidenceSha256(evidence: FiscalV1RegisteredCashEvidence): string {
  const fail = (): never => { throw new Error("FISCAL_V1_REGISTERED_CASH_EVIDENCE_INVALID"); };
  const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
  if (!evidence || evidence.schemaVersion !== 1 || ![evidence.tenantId, evidence.saleId, evidence.cajaId].every(text) ||
      evidence.currency !== "PEN" || !Number.isSafeInteger(evidence.netAmountCents) || evidence.netAmountCents <= 0 ||
      !Array.isArray(evidence.movements) || !evidence.movements.length) fail();
  const ids = new Set<string>();
  let net = 0;
  for (const row of evidence.movements) {
    if (!row || !text(row.movementId) || ids.has(row.movementId) || !Number.isSafeInteger(row.createdAtMs) ||
        row.createdAtMs < 0 || row.createdAtMs > 8_640_000_000_000_000 ||
        !["INGRESO", "EGRESO"].includes(row.type) || row.subtype !== "VENTA" || row.referenceType !== "VENTA" ||
        row.referenceId !== evidence.saleId || row.cajaId !== evidence.cajaId || row.currency !== "PEN" ||
        row.method !== "EFECTIVO" || row.state !== "ACTIVO" || !Number.isSafeInteger(row.amountCents) || row.amountCents <= 0) fail();
    ids.add(row.movementId);
    net += row.type === "INGRESO" ? row.amountCents : -row.amountCents;
    if (!Number.isSafeInteger(net)) fail();
  }
  if (net !== evidence.netAmountCents) fail();
  return fiscalV1CanonicalSha256({ schemaVersion: evidence.schemaVersion, tenantId: evidence.tenantId,
    saleId: evidence.saleId, cajaId: evidence.cajaId, currency: evidence.currency, netAmountCents: evidence.netAmountCents,
    movements: [...evidence.movements].sort((a, b) => a.movementId < b.movementId ? -1 : a.movementId > b.movementId ? 1 : 0)
      .map(row => ({ movementId: row.movementId, createdAtMs: row.createdAtMs, type: row.type, subtype: row.subtype,
        referenceType: row.referenceType, referenceId: row.referenceId, cajaId: row.cajaId, currency: row.currency,
        method: row.method, state: row.state, amountCents: row.amountCents })) });
}

/** Initial registered-cash admission lane. Does not reconstruct a sale, discount
 * or change from arithmetic differences. The server separately verifies the
 * original cash movement and the authenticated caja authorization. */
export function assertFiscalV1RegisteredCashSaleSnapshot(snapshot: IVentaSnapshot): void {
  const fail = (): never => { throw new Error("FISCAL_V1_REGISTERED_CASH_SNAPSHOT_INVALID"); };
  const cents = (value: number): number => {
    const scaled = value * 100, rounded = Math.round(scaled);
    if (!Number.isFinite(value) || !Number.isSafeInteger(rounded) || Math.abs(scaled - rounded) > 0.000001) fail();
    return rounded;
  };
  if (!snapshot || snapshot.type !== "venta_snapshot" || snapshot.moneda !== "PEN" ||
      !Number.isSafeInteger(snapshot.createdAt) || snapshot.createdAt < 0 ||
      !Array.isArray(snapshot.items) || snapshot.items.length === 0 ||
      cents(snapshot.descuentoTotal ?? 0) !== 0 || snapshot.descuentoVenta !== undefined ||
      cents(snapshot.impuesto) !== 0 || snapshot.fiscalDocumentSelection && snapshot.fiscalDocumentSelection.seleccion !== "NINGUNO") fail();
  const ids = new Set<string>();
  let gross = 0;
  for (const item of snapshot.items) {
    const quantity = Math.round(item.cantidadVendida * 1000), unit = cents(item.precioUnitario), amount = cents(item.total);
    if (!item.id || ids.has(item.id) || !item.presentacionId || !item.nombre ||
        !Number.isSafeInteger(quantity) || quantity <= 0 || unit <= 0 || amount <= 0 ||
        Math.abs(item.cantidadVendida * 1000 - quantity) > 0.000001 || cents(item.descuento ?? 0) !== 0 ||
        item.montoModificado !== undefined && typeof item.montoModificado !== "boolean" ||
        item.montoModificado !== true && Number(calculateSaleLineGrossCents({ quantityMilli: quantity, unitPriceCents: unit })) !== amount) fail();
    ids.add(item.id);
    gross += amount;
    if (!Number.isSafeInteger(gross)) fail();
  }
  if (gross !== cents(snapshot.subtotal) || gross + cents(snapshot.montoRedondeo ?? 0) !== cents(snapshot.total)) fail();
  const rounding = snapshot.redondeoPago;
  if (rounding) {
    try { assertFiscalCashPaymentRounding({ schemaVersion: rounding.schemaVersion, amountCents: cents(rounding.monto),
      policyId: rounding.politicaId, policyVersion: rounding.politicaVersion, currency: rounding.moneda,
      stepCents: cents(rounding.paso), direction: rounding.direccion, application: rounding.aplicacion }, gross, cents(snapshot.total)); }
    catch { fail(); }
    if (cents(rounding.monto) !== cents(snapshot.montoRedondeo ?? 0)) fail();
  } else if (cents(snapshot.montoRedondeo ?? 0) !== 0) fail();
  const cash = snapshot.cobro;
  if (!validarVentaCobro(cash, snapshot.total).valida || !cash || cash.pagosDigitales.length !== 0 ||
      cash.devoluciones.some(row => row.metodoPago !== "EFECTIVO") ||
      cents(cash.efectivoAplicado) !== cents(snapshot.total) || cents(cash.vueltoPendiente) !== 0) fail();
}
