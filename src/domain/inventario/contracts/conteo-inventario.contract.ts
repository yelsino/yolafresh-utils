import type { UnixMillis } from "../../shared/utils/dates";
import type {
  ActorInventarioSnapshot,
  ConversionUnidadInventarioSnapshot,
  InventoryV2SchemaVersion,
  UnidadBaseInventarioV2,
} from "./inventory-quantity-v2.contract";

export const CONTEO_INVENTARIO_TYPE = "conteo_inventario" as const;
export const CONTEO_INVENTARIO_LINEA_TYPE =
  "conteo_inventario_linea" as const;

export enum TipoConteoInventario {
  /** Baseline físico al iniciar Inventario V2 o un negocio nuevo. */
  APERTURA = "APERTURA",
  GENERAL = "GENERAL",
  CICLICO = "CICLICO",
  AD_HOC = "AD_HOC",
}

export enum EstadoConteoInventario {
  BORRADOR = "BORRADOR",
  EN_CURSO = "EN_CURSO",
  EN_REVISION = "EN_REVISION",
  APROBADO = "APROBADO",
  APLICADO = "APLICADO",
  CANCELADO = "CANCELADO",
}

export enum EstadoLineaConteoInventario {
  PENDIENTE = "PENDIENTE",
  CONTADA = "CONTADA",
  REQUIERE_RECONTEO = "REQUIERE_RECONTEO",
  VALIDADA = "VALIDADA",
}

export enum TipoCapturaConteoInventario {
  CONTEO = "CONTEO",
  RECONTEO = "RECONTEO",
}

export interface AlcanceConteoInventario {
  productoBaseIds?: string[];
  categoriaIds?: string[];
  ubicacionesInternas?: string[];
  incluirInactivos?: boolean;
}

/** Cada captura representa un conteo completo de la línea para una ronda. */
export interface CapturaConteoInventario {
  id: string;
  tipo: TipoCapturaConteoInventario;
  ronda: number;
  cantidadOperacion: number;
  cantidadBase: number;
  conversionSnapshot: ConversionUnidadInventarioSnapshot;
  actor: ActorInventarioSnapshot;
  capturadaAt: UnixMillis;
  observacion?: string;
}

export interface ConteoInventarioLinea {
  id: string;
  type: typeof CONTEO_INVENTARIO_LINEA_TYPE;
  schemaVersion: InventoryV2SchemaVersion;
  conteoId: string;
  productoBaseId: string;
  almacenId: string;
  unidadBase: UnidadBaseInventarioV2;
  lote?: string;

  cantidadTeoricaBaseAlCorte: number;
  versionProyeccionAlCorte: number;
  ultimoMovimientoIdAlCorte?: string;

  capturas: CapturaConteoInventario[];
  capturaVigenteId?: string;
  cantidadContadaBase?: number;
  diferenciaBase?: number;
  estado: EstadoLineaConteoInventario;
  /** Código estable para explicar toda diferencia validada (MERMA, ROTURA, ERROR_REGISTRO, etc.). */
  motivoDiferenciaCodigo?: string;
  /** Contexto humano adicional; nunca sustituye al código de motivo. */
  motivoDiferenciaDetalle?: string;
  revisadaPor?: ActorInventarioSnapshot;
  revisadaAt?: UnixMillis;
  observacionRevision?: string;
  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export interface TotalesConteoInventario {
  lineasEsperadas: number;
  lineasPendientes: number;
  lineasContadas: number;
  lineasReconteo: number;
  lineasValidadas: number;
  /** Subconjunto de líneas cuya diferencia base es distinta de cero. */
  lineasConDiferencia: number;
}

/**
 * Cabecera auditable y liviana de conteo. Sus líneas son raíces separadas para
 * soportar conteos grandes y conflictos offline por producto. El stock no se
 * sobrescribe al aprobarla: si existen diferencias, `APLICADO` exige un Ajuste y
 * un movimiento determinista; sin diferencias cierra sin movimiento cero.
 */
export interface ConteoInventario {
  id: string;
  type: typeof CONTEO_INVENTARIO_TYPE;
  schemaVersion: InventoryV2SchemaVersion;

  tipoConteo: TipoConteoInventario;
  estado: EstadoConteoInventario;
  empresaId: string;
  almacenId: string;
  alcance: AlcanceConteoInventario;
  conteoCiego: boolean;
  fechaCorte: UnixMillis;
  totales: TotalesConteoInventario;

  creadoPor: ActorInventarioSnapshot;
  iniciadoAt?: UnixMillis;
  enviadoRevisionAt?: UnixMillis;
  aprobadoPor?: ActorInventarioSnapshot;
  aprobadoAt?: UnixMillis;
  canceladoPor?: ActorInventarioSnapshot;
  canceladoAt?: UnixMillis;
  motivoCancelacion?: string;

  ajusteInventarioId?: string;
  movimientoInventarioId?: string;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}
