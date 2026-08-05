import type { DocumentoRestaurante, MonedaRestaurante } from "./common.contract";

export type EstadoRecursoRestaurante =
  | "ACTIVO"
  | "BLOQUEADO"
  | "FUERA_SERVICIO";

export interface LocalRestaurante
  extends DocumentoRestaurante<"restaurant_locales"> {
  nombre: string;
  codigo?: string;
  direccion?: string;
  zonaHoraria: string;
  moneda: MonedaRestaurante;
  activo: boolean;
}

/** Salon, terraza, patio o piso que agrupa mesas. */
export interface SalonRestaurante
  extends DocumentoRestaurante<"restaurant_salones"> {
  nombre: string;
  codigo?: string;
  orden: number;
  activo: boolean;
}

export interface ZonaServicioRestaurante
  extends DocumentoRestaurante<"restaurant_zonas_servicio"> {
  salonId: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

/** Recurso fisico y guardia de ocupacion del servicio. */
export interface MesaRestaurante
  extends DocumentoRestaurante<"restaurant_mesas"> {
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
  | "COCINA"
  | "BARRA"
  | "POSTRES"
  | "EMPAQUE"
  | "EXPO"
  | "OTRA";

export interface EstacionPreparacionRestaurante
  extends DocumentoRestaurante<"restaurant_estaciones_preparacion"> {
  nombre: string;
  codigo: string;
  tipoEstacion: TipoEstacionPreparacion;
  impresoraIds: string[];
  orden: number;
  activa: boolean;
}
