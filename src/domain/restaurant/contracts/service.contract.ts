import type {
  DineroRestaurante,
  DocumentoRestaurante,
} from "./common.contract";
import type { ConversionUnidadInventarioSnapshot } from "../../inventario/contracts";
import type {
  ModificadorSeleccionadoRestaurante,
  RutaPreparacionProductoRestaurante,
} from "./menu.contract";

export type CanalServicioRestaurante =
  "SALON" | "BARRA" | "MOSTRADOR" | "RECOJO" | "DELIVERY" | "AUTOSERVICIO";

export type EstadoSesionRestaurante =
  | "PLANIFICADA"
  | "ABIERTA"
  | "EN_ATENCION"
  | "SOLICITA_CIERRE"
  | "CERRADA"
  | "CANCELADA"
  | "ABANDONADA";

/** Atencion continua; la mesa es opcional fuera del canal SALON. */
export interface SesionServicioRestaurante extends DocumentoRestaurante<"restaurant_sesiones_servicio"> {
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

/** Datos comerciales inmutables de una presentacion al crear la linea. */
export interface ProductoPedidoRestauranteSnapshotBase {
  productoId: string;
  presentacionId: string;
  nombre: string;
  unidadComercial?: string;
  imagenUrl?: string;
  precioBaseUnitario: DineroRestaurante;
  impuestoUnitario: DineroRestaurante;
}

/**
 * Conversión de inventario congelada por una línea creada con el contrato
 * versionado. La presentación y su versión son obligatorias: no se infieren al
 * leer posteriormente el catálogo.
 */
export type ConversionInventarioPedidoRestauranteSnapshot = Omit<
  ConversionUnidadInventarioSnapshot,
  "presentacionId" | "versionConversion"
> & {
  presentacionId: string;
  versionConversion: number;
};

/** Pedido histórico anterior a la captura de conversión de inventario. */
export interface ProductoPedidoRestauranteSnapshotLegacy extends ProductoPedidoRestauranteSnapshotBase {
  conversionInventario?: undefined;
}

/** Pedido nuevo con la conversión exacta usada al agregar la línea. */
export interface ProductoPedidoRestauranteSnapshotVersionado extends ProductoPedidoRestauranteSnapshotBase {
  conversionInventario: ConversionInventarioPedidoRestauranteSnapshot;
}

/**
 * Snapshot comercial inmutable. La ausencia de conversión identifica
 * explícitamente un documento legacy; nunca significa factor 1 implícito.
 */
export type ProductoPedidoRestauranteSnapshot =
  | ProductoPedidoRestauranteSnapshotLegacy
  | ProductoPedidoRestauranteSnapshotVersionado;

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
export interface PedidoRestaurante extends DocumentoRestaurante<"restaurant_pedidos"> {
  sesionServicioId: string;
  estado: EstadoPedidoRestaurante;
  numeroRondaActual: number;
  lineas: ItemPedidoRestaurante[];
}
