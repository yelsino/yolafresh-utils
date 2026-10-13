import type { ISODateOnly, UnixMillis } from "../../shared/utils/dates";
import type {
  ActorInventarioSnapshot,
  ConversionPresentacionInventarioSnapshot,
  ConversionUnidadBaseInventarioSnapshot,
  InventorySchemaVersion,
  UnidadBaseInventario,
} from "./inventory-quantity.contract";

/** El valor documental histórico se conserva para registros ya persistidos. */
export const TRANSFERENCIA_INVENTARIO_TYPE =
  "transferencia_inventario_v2" as const;

export enum EstadoTransferenciaInventario {
  BORRADOR = "BORRADOR",
  ENVIADA = "ENVIADA",
  PARCIALMENTE_RECIBIDA = "PARCIALMENTE_RECIBIDA",
  RECIBIDA = "RECIBIDA",
  CERRADA_CON_DIFERENCIA = "CERRADA_CON_DIFERENCIA",
  CANCELADA = "CANCELADA",
}

/** Recibo durable e idempotente de una accion local. */
export interface AccionTransferenciaInventarioSnapshot {
  operationId: string;
  idempotencyKey: string;
  actor: ActorInventarioSnapshot;
  registradaAt: UnixMillis;
}

/**
 * Toda accion posterior a la creacion declara la version que observo. El
 * adapter debe comparar este valor junto con `_rev`/CAS antes de persistir.
 */
export interface AccionVersionadaTransferenciaInventarioSnapshot
  extends AccionTransferenciaInventarioSnapshot {
  expectedVersion: number;
}

export interface CancelacionTransferenciaInventarioSnapshot
  extends AccionVersionadaTransferenciaInventarioSnapshot {
  motivoCodigo: string;
  motivoDetalle?: string;
}

/** Campos comunes de una cantidad normalizada al crear el borrador. */
interface TransferenciaInventarioLineaComun {
  /** Identidad estable de linea, usada tambien al derivar movimientos. */
  id: string;
  productoBaseId: string;
  unidadBase: UnidadBaseInventario;

  cantidadOperacion: number;
  cantidadBase: number;

  lote?: string;
  fechaVencimiento?: ISODateOnly;
  costoUnitarioBaseSnapshot?: number;
  monedaCosto?: "PEN" | "USD" | (string & {});
}

/** Línea capturada directamente en unidad base, sin presentación de catálogo. */
export interface TransferenciaInventarioLineaBase
  extends TransferenciaInventarioLineaComun {
  presentacionId?: undefined;
  conversionSnapshot: ConversionUnidadBaseInventarioSnapshot;
}

/** Línea capturada mediante una presentación y su versión de conversión. */
export interface TransferenciaInventarioLineaPresentacion
  extends TransferenciaInventarioLineaComun {
  presentacionId: string;
  conversionSnapshot: ConversionPresentacionInventarioSnapshot;
}

/** Cantidad enviada, normalizada y congelada cuando se crea el borrador. */
export type TransferenciaInventarioLinea =
  | TransferenciaInventarioLineaBase
  | TransferenciaInventarioLineaPresentacion;

/**
 * Resultado terminal de una linea dentro de una recepcion. La parte que no se
 * declara aqui permanece en transito; `faltante` no significa "aun pendiente".
 */
export interface RecepcionTransferenciaInventarioLinea {
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
export interface RecepcionTransferenciaInventarioSnapshot
  extends AccionVersionadaTransferenciaInventarioSnapshot {
  id: string;
  items: RecepcionTransferenciaInventarioLinea[];
  movimientoEntradaId: string;
}

export interface CierreDiferenciaTransferenciaInventarioLinea {
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
export interface CierreDiferenciaTransferenciaInventarioSnapshot
  extends AccionVersionadaTransferenciaInventarioSnapshot {
  items: CierreDiferenciaTransferenciaInventarioLinea[];
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
export interface TransferenciaInventario {
  id: string;
  type: typeof TRANSFERENCIA_INVENTARIO_TYPE;
  schemaVersion: InventorySchemaVersion;
  /** Version de agregado para CAS; creacion = 1, cada accion suma exactamente 1. */
  version: number;
  estado: EstadoTransferenciaInventario;

  empresaId: string;
  almacenOrigenId: string;
  almacenDestinoId: string;
  numeroTransferencia?: string;
  motivoCodigo?: string;
  motivoDetalle?: string;
  observaciones?: string;
  evidenciaIds?: string[];

  items: TransferenciaInventarioLinea[];
  /** Une raiz, salida y entradas sin convertirlas en un unico hecho fisico. */
  correlationId: string;
  creacion: AccionTransferenciaInventarioSnapshot;
  envio?: AccionVersionadaTransferenciaInventarioSnapshot;
  recepciones: RecepcionTransferenciaInventarioSnapshot[];
  cierreDiferencia?: CierreDiferenciaTransferenciaInventarioSnapshot;
  cancelacion?: CancelacionTransferenciaInventarioSnapshot;

  movimientoSalidaId?: string;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}
