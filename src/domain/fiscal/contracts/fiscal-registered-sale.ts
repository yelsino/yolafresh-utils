import type { IVentaSnapshot } from "../../ventas/contracts/venta-snapshot.contract";
import type { FiscalV1RegisteredSaleSource } from "./modulo-fiscal-v1-evidencia.contract";
import { fiscalV1CanonicalSha256 } from "./modulo-fiscal-v1";

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
