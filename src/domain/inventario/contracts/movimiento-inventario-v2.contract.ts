import type { ISODateOnly, UnixMillis } from "../../shared/utils/dates";
import type {
  ActorInventarioSnapshot,
  ConversionUnidadInventarioSnapshot,
  InventoryV2SchemaVersion,
  UnidadBaseInventarioV2,
} from "./inventory-quantity-v2.contract";
export const MOVIMIENTO_INVENTARIO_V2_TYPE =
  "movimiento_inventario_v2" as const;

export enum TipoMovimientoInventarioV2 {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
  AJUSTE = "AJUSTE",
  TRANSFERENCIA_ENTRADA = "TRANSFERENCIA_ENTRADA",
  TRANSFERENCIA_SALIDA = "TRANSFERENCIA_SALIDA",
}

export enum OrigenMovimientoInventarioV2 {
  COMPRA = "COMPRA",
  VENTA = "VENTA",
  CONTEO = "CONTEO",
  AJUSTE = "AJUSTE",
  MERMA = "MERMA",
  TRANSFERENCIA = "TRANSFERENCIA",
  DEVOLUCION_CLIENTE = "DEVOLUCION_CLIENTE",
  DEVOLUCION_PROVEEDOR = "DEVOLUCION_PROVEEDOR",
  PRODUCCION = "PRODUCCION",
  APERTURA = "APERTURA",
  MIGRACION = "MIGRACION",
}

export interface ReferenciaOrigenMovimientoInventarioV2 {
  tipo: OrigenMovimientoInventarioV2;
  documentoId: string;
  lineaId?: string;
}

export interface MovimientoInventarioV2Linea {
  id: string;
  productoBaseId: string;
  almacenId: string;

  /** Magnitud positiva expresada en la unidad comercial capturada. */
  cantidadOperacion: number;
  conversionSnapshot: ConversionUnidadInventarioSnapshot;

  /**
   * Delta firmado en unidad base. Entrada > 0, salida < 0. En un ajuste el signo
   * expresa la diferencia física encontrada.
   */
  cantidadBaseDelta: number;
  unidadBase: UnidadBaseInventarioV2;

  costoUnitarioBase?: number;
  monedaCosto?: "PEN" | "USD" | (string & {});

  lote?: string;
  fechaVencimiento?: ISODateOnly;
  ubicacionInterna?: string;

  /** Snapshots de auditoría; no son la autoridad ni se usan para sumar el ledger. */
  cantidadBaseAntesSnapshot?: number;
  cantidadBaseDespuesSnapshot?: number;
}

/**
 * Hecho físico aplicado e inmutable. Un error posterior se corrige mediante otro
 * movimiento que declare `reversaDeMovimientoId`; nunca editando este documento.
 */
export interface MovimientoInventarioV2 {
  id: string;
  type: typeof MOVIMIENTO_INVENTARIO_V2_TYPE;
  schemaVersion: InventoryV2SchemaVersion;
  estado: "APLICADO";

  tipo: TipoMovimientoInventarioV2;
  almacenId: string;
  origen: ReferenciaOrigenMovimientoInventarioV2;
  items: MovimientoInventarioV2Linea[];

  operationId: string;
  idempotencyKey: string;
  correlationId: string;
  causationId?: string;
  reversaDeMovimientoId?: string;

  motivoCodigo?: string;
  motivoDetalle?: string;
  evidenciaIds?: string[];

  actor: ActorInventarioSnapshot;
  fechaEfectiva: UnixMillis;
  registradoAt: UnixMillis;
}
