import type { UnixMillis } from "../../shared/utils/dates";
import type {
  InventorySchemaVersion,
  UnidadBaseInventario,
} from "./inventory-quantity.contract";

export const STOCK_PRODUCTO_BASE_ALMACEN_TYPE =
  "stock_producto_base_almacen" as const;

/**
 * Proyección reconstruible del ledger.
 *
 * La clave lógica es exclusivamente `productoBaseId + almacenId`. La presentación
 * usada para comprar o vender no crea otro saldo físico.
 */
export interface StockProductoBaseAlmacen {
  id: string;
  type: typeof STOCK_PRODUCTO_BASE_ALMACEN_TYPE;
  schemaVersion: InventorySchemaVersion;

  productoBaseId: string;
  almacenId: string;
  unidadBase: UnidadBaseInventario;

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
