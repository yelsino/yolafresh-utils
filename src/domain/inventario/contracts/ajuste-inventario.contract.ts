import type { UnixMillis } from "../../shared/utils/dates";
import type {
  ActorInventarioSnapshot,
  ConversionUnidadInventarioSnapshot,
  InventoryV2SchemaVersion,
  UnidadBaseInventarioV2,
} from "./inventory-quantity-v2.contract";

export const AJUSTE_INVENTARIO_TYPE = "ajuste_inventario" as const;
export const MERMA_INVENTARIO_TYPE = "merma_inventario" as const;

export enum EstadoAprobacionInventario {
  BORRADOR = "BORRADOR",
  PENDIENTE_APROBACION = "PENDIENTE_APROBACION",
  APROBADO = "APROBADO",
  RECHAZADO = "RECHAZADO",
  APLICADO = "APLICADO",
  CANCELADO = "CANCELADO",
}

export enum OrigenAjusteInventario {
  APERTURA = "APERTURA",
  CONTEO = "CONTEO",
  MANUAL = "MANUAL",
  MIGRACION = "MIGRACION",
  CORRECCION_RECEPCION = "CORRECCION_RECEPCION",
  CORRECCION_VENTA = "CORRECCION_VENTA",
}

export interface AprobacionInventarioSnapshot {
  solicitadoPor: ActorInventarioSnapshot;
  solicitadoAt: UnixMillis;
  aprobadoPor?: ActorInventarioSnapshot;
  aprobadoAt?: UnixMillis;
  rechazadoPor?: ActorInventarioSnapshot;
  rechazadoAt?: UnixMillis;
  comentario?: string;
  autoAprobado?: boolean;
}

export interface AjusteInventarioLinea {
  id: string;
  productoBaseId: string;
  almacenId: string;
  unidadBase: UnidadBaseInventarioV2;
  conversionSnapshot: ConversionUnidadInventarioSnapshot;
  cantidadTeoricaBase: number;
  cantidadObjetivoBase: number;
  cantidadBaseDelta: number;
  motivoCodigo: string;
  motivoDetalle?: string;
  lote?: string;
}

export interface AjusteInventario {
  id: string;
  type: typeof AJUSTE_INVENTARIO_TYPE;
  schemaVersion: InventoryV2SchemaVersion;
  estado: EstadoAprobacionInventario;
  origen: OrigenAjusteInventario;
  empresaId: string;
  almacenId: string;
  conteoInventarioId?: string;
  lineas: AjusteInventarioLinea[];
  operationId: string;
  idempotencyKey: string;
  aprobacion: AprobacionInventarioSnapshot;
  evidenciaIds?: string[];
  movimientoInventarioId?: string;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export enum MotivoMermaInventario {
  VENCIMIENTO = "VENCIMIENTO",
  DETERIORO = "DETERIORO",
  ROTURA = "ROTURA",
  ROBO = "ROBO",
  DESHIDRATACION = "DESHIDRATACION",
  EVAPORACION = "EVAPORACION",
  RECORTE_PRODUCCION = "RECORTE_PRODUCCION",
  PERDIDA_DESCONOCIDA = "PERDIDA_DESCONOCIDA",
  OTRO = "OTRO",
}

export interface MermaInventarioLinea {
  id: string;
  productoBaseId: string;
  almacenId: string;
  unidadBase: UnidadBaseInventarioV2;
  cantidadOperacion: number;
  cantidadBase: number;
  conversionSnapshot: ConversionUnidadInventarioSnapshot;
  motivo: MotivoMermaInventario;
  motivoDetalle?: string;
  lote?: string;
  costoUnitarioBaseSnapshot?: number;
}

/** Recibo append-only de una accion del ciclo de merma. */
export interface AccionMermaInventarioSnapshot {
  operationId: string;
  idempotencyKey: string;
  actor: ActorInventarioSnapshot;
  registradaAt: UnixMillis;
}

export interface AccionVersionadaMermaInventarioSnapshot
  extends AccionMermaInventarioSnapshot {
  expectedVersion: number;
  comentario?: string;
}

/** Ciclo auditado completo de una merma. */
export interface FlujoAuditadoMermaInventario {
  creacion: AccionMermaInventarioSnapshot;
  solicitud?: AccionVersionadaMermaInventarioSnapshot;
  aprobacion?: AccionVersionadaMermaInventarioSnapshot;
  rechazo?: AccionVersionadaMermaInventarioSnapshot;
  aplicacion?: AccionVersionadaMermaInventarioSnapshot;
  cancelacion?: AccionVersionadaMermaInventarioSnapshot;
}

/** Merma conocida; al aplicarse genera una salida. No es un egreso de caja. */
export interface MermaInventario {
  id: string;
  type: typeof MERMA_INVENTARIO_TYPE;
  schemaVersion: InventoryV2SchemaVersion;
  estado: EstadoAprobacionInventario;
  empresaId: string;
  almacenId: string;
  lineas: MermaInventarioLinea[];
  /** Identidad idempotente de la acción vigente. */
  operationId: string;
  idempotencyKey: string;
  aprobacion: AprobacionInventarioSnapshot;
  /** Control CAS de dominio. */
  version: number;
  /** Recibos append-only por transición. */
  flujo: FlujoAuditadoMermaInventario;
  evidenciaIds?: string[];
  movimientoInventarioId?: string;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}
