import type { DineroRestaurante, DocumentoRestaurante } from "./common.contract";
import type {
  ModificadorSeleccionadoRestaurante,
  RutaPreparacionProductoRestaurante,
} from "./menu.contract";

export type CanalServicioRestaurante =
  | "SALON"
  | "BARRA"
  | "MOSTRADOR"
  | "RECOJO"
  | "DELIVERY"
  | "AUTOSERVICIO";

export type EstadoSesionRestaurante =
  | "PLANIFICADA"
  | "ABIERTA"
  | "EN_ATENCION"
  | "SOLICITA_CIERRE"
  | "CERRADA"
  | "CANCELADA"
  | "ABANDONADA";

/** Atencion continua; la mesa es opcional fuera del canal SALON. */
export interface SesionServicioRestaurante
  extends DocumentoRestaurante<"restaurant_sesiones_servicio"> {
  canal: CanalServicioRestaurante;
  estado: EstadoSesionRestaurante;
  mesaId?: string;
  reservaId?: string;
  entregaId?: string;
  alias?: string;
  cantidadComensales: number;
  responsableId: string;
  pedidoId: string;
  cuentaConsumoId: string;
  abiertaAt: number;
  cierreSolicitadoAt?: number;
  cerradaAt?: number;
}

export type EstadoPedidoRestaurante =
  | "BORRADOR"
  | "ABIERTO"
  | "PARCIALMENTE_ENVIADO"
  | "ENVIADO"
  | "COMPLETADO"
  | "CANCELADO";

/** Snapshot comercial inmutable de una presentacion al crear la linea. */
export interface ProductoPedidoRestauranteSnapshot {
  productoId: string;
  presentacionId: string;
  nombre: string;
  unidadComercial?: string;
  imagenUrl?: string;
  precioBaseUnitario: DineroRestaurante;
  impuestoUnitario: DineroRestaurante;
}

export interface ItemPedidoRestaurante {
  id: string;
  productoRestauranteId: string;
  snapshot: ProductoPedidoRestauranteSnapshot;
  cantidad: number;
  cantidadEnviada: number;
  modificadores: ModificadorSeleccionadoRestaurante[];
  instrucciones?: string;
  asiento?: number;
  curso?: number;
  /** Snapshot de ruteo: cambios posteriores del menu no mueven esta linea. */
  rutasPreparacion: RutaPreparacionProductoRestaurante[];
  totalLinea: DineroRestaurante;
  creadaAt: number;
  creadaPor: string;
  anuladaAt?: number;
  anuladaPor?: string;
  motivoAnulacion?: string;
}

/** Intencion editable; lo enviado se corrige con una comanda compensatoria. */
export interface PedidoRestaurante
  extends DocumentoRestaurante<"restaurant_pedidos"> {
  sesionServicioId: string;
  estado: EstadoPedidoRestaurante;
  numeroRondaActual: number;
  lineas: ItemPedidoRestaurante[];
}
