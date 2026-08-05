import type { DineroRestaurante, DocumentoRestaurante } from "./common.contract";

export interface OpcionModificadorRestaurante {
  id: string;
  nombre: string;
  precioExtra: DineroRestaurante;
  activa: boolean;
  predeterminada: boolean;
  orden: number;
}

export interface GrupoModificadorRestaurante {
  id: string;
  nombre: string;
  minimoSelecciones: number;
  maximoSelecciones: number;
  permiteRepeticion: boolean;
  orden: number;
  opciones: OpcionModificadorRestaurante[];
}

export type DisponibilidadProductoRestaurante =
  | "DISPONIBLE"
  | "AGOTADO"
  | "INACTIVO";

/**
 * PREPARAR requiere intervencion de la estacion.
 * DESPACHO_DIRECTO nace listo, pero aun requiere entrega al salon.
 */
export type ModoPreparacionRestaurante =
  | "PREPARAR"
  | "DESPACHO_DIRECTO";

export interface RutaPreparacionProductoRestaurante {
  estacionPreparacionId: string;
  modo: ModoPreparacionRestaurante;
  orden: number;
}

/** Extension gastronomica de una Presentacion comercial existente. */
export interface ProductoRestaurante
  extends DocumentoRestaurante<"restaurant_productos"> {
  presentacionId: string;
  nombreMenu?: string;
  descripcionMenu?: string;
  imagenMenuUrl?: string;
  precioMenu?: DineroRestaurante;
  rutasPreparacion: RutaPreparacionProductoRestaurante[];
  gruposModificadores: GrupoModificadorRestaurante[];
  disponibilidad: DisponibilidadProductoRestaurante;
  tiempoPreparacionMinutos?: number;
  cursoSugerido?: number;
  orden: number;
}

/** Snapshot exacto de una eleccion; una configuracion diferente forma otra linea. */
export interface ModificadorSeleccionadoRestaurante {
  grupoId: string;
  opcionId: string;
  grupoNombre: string;
  opcionNombre: string;
  cantidad: number;
  precioExtraUnitario: DineroRestaurante;
}
