import type { ISODateOnly, UnixMillis } from "../../shared/utils/dates";
import type {
  ActorInventarioSnapshot,
  ConversionPresentacionInventarioSnapshot,
  ConversionUnidadBaseInventarioSnapshot,
  InventoryV2SchemaVersion,
  UnidadBaseInventarioV2,
} from "./inventory-quantity-v2.contract";

export const TRANSFERENCIA_INVENTARIO_V2_TYPE =
  "transferencia_inventario_v2" as const;

export enum EstadoTransferenciaInventarioV2 {
  BORRADOR = "BORRADOR",
  ENVIADA = "ENVIADA",
  PARCIALMENTE_RECIBIDA = "PARCIALMENTE_RECIBIDA",
  RECIBIDA = "RECIBIDA",
  CERRADA_CON_DIFERENCIA = "CERRADA_CON_DIFERENCIA",
  CANCELADA = "CANCELADA",
}

/** Recibo durable e idempotente de una accion local. */
export interface AccionTransferenciaInventarioV2Snapshot {
  operationId: string;
  idempotencyKey: string;
  actor: ActorInventarioSnapshot;
  registradaAt: UnixMillis;
}

/**
 * Toda accion posterior a la creacion declara la version que observo. El
 * adapter debe comparar este valor junto con `_rev`/CAS antes de persistir.
 */
export interface AccionVersionadaTransferenciaInventarioV2Snapshot
  extends AccionTransferenciaInventarioV2Snapshot {
  expectedVersion: number;
}

export interface CancelacionTransferenciaInventarioV2Snapshot
  extends AccionVersionadaTransferenciaInventarioV2Snapshot {
  motivoCodigo: string;
  motivoDetalle?: string;
}

/** Campos comunes de una cantidad normalizada al crear el borrador. */
interface TransferenciaInventarioV2LineaComun {
  /** Identidad estable de linea, usada tambien al derivar movimientos. */
  id: string;
  productoBaseId: string;
  unidadBase: UnidadBaseInventarioV2;

  cantidadOperacion: number;
  cantidadBase: number;

  lote?: string;
  fechaVencimiento?: ISODateOnly;
  costoUnitarioBaseSnapshot?: number;
  monedaCosto?: "PEN" | "USD" | (string & {});
}

/** Línea capturada directamente en unidad base, sin presentación de catálogo. */
export interface TransferenciaInventarioV2LineaBase
  extends TransferenciaInventarioV2LineaComun {
  presentacionId?: undefined;
  conversionSnapshot: ConversionUnidadBaseInventarioSnapshot;
}

/** Línea capturada mediante una presentación y su versión de conversión. */
export interface TransferenciaInventarioV2LineaPresentacion
  extends TransferenciaInventarioV2LineaComun {
  presentacionId: string;
  conversionSnapshot: ConversionPresentacionInventarioSnapshot;
}

/** Cantidad enviada, normalizada y congelada cuando se crea el borrador. */
export type TransferenciaInventarioV2Linea =
  | TransferenciaInventarioV2LineaBase
  | TransferenciaInventarioV2LineaPresentacion;

/**
 * Resultado terminal de una linea dentro de una recepcion. La parte que no se
 * declara aqui permanece en transito; `faltante` no significa "aun pendiente".
 */
export interface RecepcionTransferenciaInventarioV2Linea {
  lineaTransferenciaId: string;
  cantidadBaseAceptada: number;
  cantidadBaseRechazada: number;
  cantidadBaseFaltante: number;
  motivoCodigo?: string;
  motivoDetalle?: string;
  evidenciaIds?: string[];
}

/**
 * Una recepcion fisica append-only. Debe aceptar alguna cantidad y genera
 * exactamente un movimiento de entrada determinista.
 */
export interface RecepcionTransferenciaInventarioV2Snapshot
  extends AccionVersionadaTransferenciaInventarioV2Snapshot {
  id: string;
  items: RecepcionTransferenciaInventarioV2Linea[];
  movimientoEntradaId: string;
}

export interface CierreDiferenciaTransferenciaInventarioV2Linea {
  lineaTransferenciaId: string;
  cantidadBaseRechazada: number;
  cantidadBaseFaltante: number;
  motivoCodigo: string;
  motivoDetalle?: string;
  evidenciaIds?: string[];
}

/**
 * Permite cerrar como diferencia un remanente que nunca llego a producir una
 * recepcion fisica (por ejemplo, una transferencia totalmente extraviada).
 */
export interface CierreDiferenciaTransferenciaInventarioV2Snapshot
  extends AccionVersionadaTransferenciaInventarioV2Snapshot {
  items: CierreDiferenciaTransferenciaInventarioV2Linea[];
}

/**
 * Orden durable de traslado entre dos almacenes.
 *
 * - `ENVIADA` exige una unica salida total aplicada en origen.
 * - cada elemento de `recepciones` genera una entrada independiente solo por
 *   la cantidad aceptada;
 * - rechazado/faltante son cantidades terminales y nunca incrementan destino;
 * - `CANCELADA` solo es valida desde `BORRADOR`.
 */
export interface TransferenciaInventarioV2 {
  id: string;
  type: typeof TRANSFERENCIA_INVENTARIO_V2_TYPE;
  schemaVersion: InventoryV2SchemaVersion;
  /** Version de agregado para CAS; creacion = 1, cada accion suma exactamente 1. */
  version: number;
  estado: EstadoTransferenciaInventarioV2;

  empresaId: string;
  almacenOrigenId: string;
  almacenDestinoId: string;
  numeroTransferencia?: string;
  motivoCodigo?: string;
  motivoDetalle?: string;
  observaciones?: string;
  evidenciaIds?: string[];

  items: TransferenciaInventarioV2Linea[];
  /** Une raiz, salida y entradas sin convertirlas en un unico hecho fisico. */
  correlationId: string;
  creacion: AccionTransferenciaInventarioV2Snapshot;
  envio?: AccionVersionadaTransferenciaInventarioV2Snapshot;
  recepciones: RecepcionTransferenciaInventarioV2Snapshot[];
  cierreDiferencia?: CierreDiferenciaTransferenciaInventarioV2Snapshot;
  cancelacion?: CancelacionTransferenciaInventarioV2Snapshot;

  movimientoSalidaId?: string;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}
