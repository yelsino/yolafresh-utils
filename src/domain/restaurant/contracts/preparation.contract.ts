import type {
  DocumentoRestaurante,
  TrazaOperacionRestaurante,
} from "./common.contract";
import type { ModoOperacionEstacionRestaurante } from "./configuration.contract";
import type { ModoPreparacionRestaurante } from "./menu.contract";
import type { CanalServicioRestaurante } from "./service.contract";

export type TipoComandaRestaurante =
  "ENVIO" | "CANCELACION" | "CORRECCION" | "REFIRE";

export interface ReferenciaServicioComandaRestaurante {
  canal: CanalServicioRestaurante;
  mesaId?: string;
  mesaCodigo?: string;
  mesaNombre?: string;
  alias?: string;
  responsableId?: string;
}

export interface ItemComandaRestaurante {
  id: string;
  pedidoLineaId: string;
  estacionPreparacionId: string;
  modoPreparacion: ModoPreparacionRestaurante;
  cantidad: number;
  nombre: string;
  modificadores: string[];
  instrucciones?: string;
  asiento?: number;
  curso?: number;
}

/** Hecho inmutable enviado a Cocina, Barra u otra estacion. */
export interface ComandaRestaurante extends DocumentoRestaurante<"restaurant_comandas"> {
  pedidoId: string;
  sesionServicioId: string;
  secuencia: number;
  ronda: number;
  curso?: number;
  tipoEnvio: TipoComandaRestaurante;
  lineas: ItemComandaRestaurante[];
  referenciaServicio?: ReferenciaServicioComandaRestaurante;
  trace: TrazaOperacionRestaurante;
  compensaComandaId?: string;
}

export type EstadoTareaPreparacionRestaurante =
  | "PENDIENTE"
  | "EN_COLA"
  | "EN_PREPARACION"
  | "RETENIDA"
  | "LISTA"
  | "ENTREGADA"
  | "GESTION_EXTERNA"
  | "CANCELADA"
  | "DESCARTADA";

/** Trabajo mutable de una estacion para un item de comanda. */
export interface TareaPreparacionRestaurante extends DocumentoRestaurante<"restaurant_tareas_preparacion"> {
  comandaId: string;
  comandaItemId: string;
  pedidoId: string;
  pedidoLineaId: string;
  sesionServicioId: string;
  estacionPreparacionId: string;
  modoPreparacion: ModoPreparacionRestaurante;
  /** Snapshot del modo de la estacion al aceptar la comanda. */
  modoOperacionEstacion?: ModoOperacionEstacionRestaurante;
  /**
   * GESTION_EXTERNA omite el seguimiento de preparacion en Cocina, pero
   * conserva pendiente la confirmacion de entrega de Salon.
   */
  estado: EstadoTareaPreparacionRestaurante;
  cantidad: number;
  asiento?: number;
  curso?: number;
  prioridad: number;
  iniciadaAt?: number;
  listaAt?: number;
  entregadaAt?: number;
  responsableId?: string;
  motivo?: string;
}
