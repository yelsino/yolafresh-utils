import type { UnixMillis } from "../../shared/utils/dates";

/**
 * Versión del esquema documental vigente de Inventario.
 *
 * Es independiente de la versión npm, del schema de snapshot y del schema SQLite.
 */
export const INVENTORY_SCHEMA_VERSION = 2 as const;

export type InventorySchemaVersion = typeof INVENTORY_SCHEMA_VERSION;

/**
 * Unidad canónica en la que Inventario conserva la existencia de un producto base.
 * Las presentaciones son unidades comerciales/de captura y nunca claves de stock.
 */
export const UnidadBaseInventario = Object.freeze({
  UNIDAD: "unidad",
  KILOGRAMO: "kilogramo",
  LITRO: "litro",
  METRO: "metro",
} as const);

export type UnidadBaseInventario =
  (typeof UnidadBaseInventario)[keyof typeof UnidadBaseInventario];

/** Campos comunes de la conversión congelada por un hecho físico. */
interface ConversionUnidadInventarioSnapshotComun {
  productoBaseId: string;
  /** Etiqueta capturada: unidad, kg, caja, saco, botella, etc. */
  unidadOperacion: string;
  unidadBase: UnidadBaseInventario;
  /** Unidades base contenidas en una unidad de operación. Debe ser mayor a cero. */
  factorUnidadBase: number;
  /** Escala decimal acordada para redondear la cantidad base (0..9). */
  precisionCantidadBase: number;
  capturadaAt: UnixMillis;
}

/**
 * Captura directa en la unidad base. No depende de una presentación de
 * catálogo y, por tanto, no inventa una versión de conversión.
 */
export interface ConversionUnidadBaseInventarioSnapshot
  extends ConversionUnidadInventarioSnapshotComun {
  origenConversion?: undefined;
  presentacionId?: undefined;
  versionConversion?: undefined;
}

/**
 * Conversión tomada de una presentación de catálogo. La versión es parte del
 * hecho físico: permite reconstruir exactamente la equivalencia que se usó.
 */
export interface ConversionPresentacionInventarioSnapshot
  extends ConversionUnidadInventarioSnapshotComun {
  origenConversion?: undefined;
  presentacionId: string;
  /** Entero seguro positivo de la equivalencia de catálogo congelada. */
  versionConversion: number;
}

/** Conversión física capturada en una compra sin presentación de catálogo. */
export interface ConversionEmpaqueCompraInventarioSnapshot
  extends ConversionUnidadInventarioSnapshotComun {
  origenConversion: "EMPAQUE_COMPRA";
  presentacionId?: undefined;
  versionConversion?: undefined;
}

/** Snapshot inmutable de la conversión usada por un hecho físico. */
export type ConversionUnidadInventarioSnapshot =
  | ConversionUnidadBaseInventarioSnapshot
  | ConversionPresentacionInventarioSnapshot
  | ConversionEmpaqueCompraInventarioSnapshot;

/** Cantidad comercial y su resultado normalizado, congelados juntos. */
export interface CantidadInventarioConvertida {
  cantidadOperacion: number;
  cantidadBase: number;
  conversion: ConversionUnidadInventarioSnapshot;
}

/** Actor mínimo para auditoría offline-first. */
export interface ActorInventarioSnapshot {
  usuarioId: string;
  usuarioNombre?: string;
  dispositivoId?: string;
  sesionId?: string;
}

export interface ResultadoValidacionInventario {
  valido: boolean;
  errores: string[];
}
