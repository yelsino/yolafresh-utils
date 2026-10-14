import type { ISODateOnly, UnixMillis } from "../../shared/utils/dates";
import type {
  ActorInventarioSnapshot,
  ConversionUnidadInventarioSnapshot,
  InventorySchemaVersion,
  UnidadBaseInventario,
} from "./inventory-quantity.contract";
/** Tipo documental canónico del ledger único de inventario. */
export const MOVIMIENTO_INVENTARIO_TYPE = "movimiento_inventario" as const;

export enum TipoMovimientoInventario {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
  AJUSTE = "AJUSTE",
  TRANSFERENCIA_ENTRADA = "TRANSFERENCIA_ENTRADA",
  TRANSFERENCIA_SALIDA = "TRANSFERENCIA_SALIDA",
}

export enum OrigenMovimientoInventario {
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

export interface ReferenciaOrigenMovimientoInventario {
  tipo: OrigenMovimientoInventario;
  documentoId: string;
  lineaId?: string;
}

export interface MovimientoInventarioLinea {
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
  unidadBase: UnidadBaseInventario;

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
export interface MovimientoInventario {
  id: string;
  type: typeof MOVIMIENTO_INVENTARIO_TYPE;
  schemaVersion: InventorySchemaVersion;
  estado: "APLICADO";

  tipo: TipoMovimientoInventario;
  almacenId: string;
  origen: ReferenciaOrigenMovimientoInventario;
  items: MovimientoInventarioLinea[];

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
