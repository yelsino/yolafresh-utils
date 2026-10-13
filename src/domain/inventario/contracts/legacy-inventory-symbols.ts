/**
 * Alias de API para consumidores que todavía compilan contra los nombres
 * publicados en 2026. No representan un segundo modelo ni alteran el JSON.
 * Retirarlos solo después de actualizar todos los paquetes consumidores.
 */
export {
  INVENTORY_SCHEMA_VERSION as INVENTORY_V2_SCHEMA_VERSION,
  UnidadBaseInventario as UnidadBaseInventarioV2,
} from "./inventory-quantity.contract";
export type {
  InventorySchemaVersion as InventoryV2SchemaVersion,
} from "./inventory-quantity.contract";

export {
  MOVIMIENTO_INVENTARIO_TYPE as MOVIMIENTO_INVENTARIO_V2_TYPE,
  TipoMovimientoInventario as TipoMovimientoInventarioV2,
  OrigenMovimientoInventario as OrigenMovimientoInventarioV2,
} from "./movimiento-inventario.contract";
export type {
  ReferenciaOrigenMovimientoInventario as ReferenciaOrigenMovimientoInventarioV2,
  MovimientoInventarioLinea as MovimientoInventarioV2Linea,
  MovimientoInventario as MovimientoInventarioV2,
} from "./movimiento-inventario.contract";

export {
  TRANSFERENCIA_INVENTARIO_TYPE as TRANSFERENCIA_INVENTARIO_V2_TYPE,
  EstadoTransferenciaInventario as EstadoTransferenciaInventarioV2,
} from "./transferencia-inventario.contract";
export type {
  AccionTransferenciaInventarioSnapshot as AccionTransferenciaInventarioV2Snapshot,
  AccionVersionadaTransferenciaInventarioSnapshot as AccionVersionadaTransferenciaInventarioV2Snapshot,
  CancelacionTransferenciaInventarioSnapshot as CancelacionTransferenciaInventarioV2Snapshot,
  TransferenciaInventarioLineaBase as TransferenciaInventarioV2LineaBase,
  TransferenciaInventarioLineaPresentacion as TransferenciaInventarioV2LineaPresentacion,
  TransferenciaInventarioLinea as TransferenciaInventarioV2Linea,
  RecepcionTransferenciaInventarioLinea as RecepcionTransferenciaInventarioV2Linea,
  RecepcionTransferenciaInventarioSnapshot as RecepcionTransferenciaInventarioV2Snapshot,
  CierreDiferenciaTransferenciaInventarioLinea as CierreDiferenciaTransferenciaInventarioV2Linea,
  CierreDiferenciaTransferenciaInventarioSnapshot as CierreDiferenciaTransferenciaInventarioV2Snapshot,
  TransferenciaInventario as TransferenciaInventarioV2,
} from "./transferencia-inventario.contract";
