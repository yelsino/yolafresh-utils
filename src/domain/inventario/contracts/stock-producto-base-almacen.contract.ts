import type { UnixMillis } from "../../shared/utils/dates";
import type {
  InventoryV2SchemaVersion,
  UnidadBaseInventarioV2,
} from "./inventory-quantity-v2.contract";

export const STOCK_PRODUCTO_BASE_ALMACEN_TYPE =
  "stock_producto_base_almacen" as const;

/**
 * Proyección reconstruible del ledger V2.
 *
 * La clave lógica es exclusivamente `productoBaseId + almacenId`. La presentación
 * usada para comprar o vender no crea otro saldo físico.
 */
export interface StockProductoBaseAlmacen {
  id: string;
  type: typeof STOCK_PRODUCTO_BASE_ALMACEN_TYPE;
  schemaVersion: InventoryV2SchemaVersion;

  productoBaseId: string;
  almacenId: string;
  unidadBase: UnidadBaseInventarioV2;

  cantidadFisicaBase: number;
  cantidadReservadaBase: number;

  costoPromedioUnidadBase?: number;
  monedaCosto?: "PEN" | "USD" | (string & {});
  valorInventario?: number;

  ultimoMovimientoInventarioId?: string;
  /** Versión monotónica local de la proyección, no `_rev` de CouchDB. */
  revisionProyeccion: number;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}
