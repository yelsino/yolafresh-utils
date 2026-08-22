import type {
  DocumentoRestaurante,
  MonedaRestaurante,
} from "./common.contract";

export type EstadoRecursoRestaurante =
  "ACTIVO" | "BLOQUEADO" | "FUERA_SERVICIO";

export interface LocalRestaurante extends DocumentoRestaurante<"restaurant_locales"> {
  nombre: string;
  codigo?: string;
  direccion?: string;
  zonaHoraria: string;
  moneda: MonedaRestaurante;
  activo: boolean;
}

/** Salon, terraza, patio o piso que agrupa mesas. */
export interface SalonRestaurante extends DocumentoRestaurante<"restaurant_salones"> {
  nombre: string;
  codigo?: string;
  orden: number;
  activo: boolean;
}

export interface ZonaServicioRestaurante extends DocumentoRestaurante<"restaurant_zonas_servicio"> {
  salonId: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

/** Recurso fisico y guardia de ocupacion del servicio. */
export interface MesaRestaurante extends DocumentoRestaurante<"restaurant_mesas"> {
  salonId: string;
  zonaServicioId?: string;
  codigo: string;
  nombre: string;
  capacidad: number;
  estadoOperativo: EstadoRecursoRestaurante;
  sesionActivaId?: string;
  posicion?: {
    x: number;
    y: number;
    ancho?: number;
    alto?: number;
    rotacion?: number;
    forma?: "CUADRADA" | "RECTANGULAR" | "REDONDA";
  };
}

export type TipoEstacionPreparacion =
  "COCINA" | "BARRA" | "POSTRES" | "EMPAQUE" | "EXPO" | "OTRA";

/**
 * Define como controla la aplicacion el trabajo de una estacion.
 *
 * - SEGUIMIENTO_DIGITAL: estados e interaccion por plato o comanda.
 * - COMANDA_FISICA_ASISTIDA: estados digitales solo por comanda completa.
 * - COMANDA_FISICA: la operacion ocurre fuera del KDS; la app es un visor.
 */
export const MODO_OPERACION_ESTACION_RESTAURANTE = {
  SEGUIMIENTO_DIGITAL: "SEGUIMIENTO_DIGITAL",
  COMANDA_FISICA_ASISTIDA: "COMANDA_FISICA_ASISTIDA",
  COMANDA_FISICA: "COMANDA_FISICA",
} as const;

export type ModoOperacionEstacionRestaurante =
  (typeof MODO_OPERACION_ESTACION_RESTAURANTE)[keyof typeof MODO_OPERACION_ESTACION_RESTAURANTE];

export const MODO_OPERACION_ESTACION_RESTAURANTE_PREDETERMINADO =
  MODO_OPERACION_ESTACION_RESTAURANTE.SEGUIMIENTO_DIGITAL;

export const esModoOperacionEstacionRestaurante = (
  value: unknown,
): value is ModoOperacionEstacionRestaurante =>
  Object.values(MODO_OPERACION_ESTACION_RESTAURANTE).includes(
    value as ModoOperacionEstacionRestaurante,
  );

export interface EstacionPreparacionRestaurante extends DocumentoRestaurante<"restaurant_estaciones_preparacion"> {
  nombre: string;
  codigo: string;
  tipoEstacion: TipoEstacionPreparacion;
  /** Ausente en documentos legacy equivale a SEGUIMIENTO_DIGITAL. */
  modoOperacion?: ModoOperacionEstacionRestaurante;
  impresoraIds: string[];
  orden: number;
  activa: boolean;
}
