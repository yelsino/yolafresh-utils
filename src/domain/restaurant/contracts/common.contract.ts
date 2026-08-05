/** Monedas habilitadas para la operacion gastronomica. */
export type MonedaRestaurante = "PEN" | "USD";

/** Dinero serializable en unidades minimas; nunca se persisten montos float. */
export interface DineroRestaurante {
  currency: MonedaRestaurante;
  minorUnits: number;
}

export interface ActorRestaurante {
  actorId: string;
  deviceId: string;
}

export interface AuditoriaRestaurante {
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  deviceId: string;
}

/**
 * Lenguaje persistente canonico del bounded context Restaurante.
 * Cada valor coincide exactamente con su tabla SQLite y con `type` en CouchDB.
 */
export const TIPO_DOCUMENTO_RESTAURANTE = {
  LOCALES: "restaurant_locales",
  SALONES: "restaurant_salones",
  ZONAS_SERVICIO: "restaurant_zonas_servicio",
  MESAS: "restaurant_mesas",
  ESTACIONES_PREPARACION: "restaurant_estaciones_preparacion",
  PRODUCTOS: "restaurant_productos",
  SESIONES_SERVICIO: "restaurant_sesiones_servicio",
  PEDIDOS: "restaurant_pedidos",
  COMANDAS: "restaurant_comandas",
  TAREAS_PREPARACION: "restaurant_tareas_preparacion",
  CUENTAS_CONSUMO: "restaurant_cuentas_consumo",
  ASIGNACIONES_PAGO: "restaurant_asignaciones_pago",
} as const;

export type TipoDocumentoRestaurante =
  (typeof TIPO_DOCUMENTO_RESTAURANTE)[keyof typeof TIPO_DOCUMENTO_RESTAURANTE];

export const TIPOS_DOCUMENTO_RESTAURANTE = Object.freeze(
  Object.values(TIPO_DOCUMENTO_RESTAURANTE),
) as readonly TipoDocumentoRestaurante[];

export const VERSION_ESQUEMA_RESTAURANTE = 2;
export const TIPO_COMANDO_RESTAURANTE = "restaurant_comandos" as const;

const TIPOS_DOCUMENTO_RESTAURANTE_SET = new Set<string>(
  TIPOS_DOCUMENTO_RESTAURANTE,
);

export const normalizarTipoDocumentoRestaurante = (
  value: unknown,
): TipoDocumentoRestaurante | null =>
  typeof value === "string" && TIPOS_DOCUMENTO_RESTAURANTE_SET.has(value)
    ? (value as TipoDocumentoRestaurante)
    : null;

export const esTipoDocumentoRestaurante = (
  value: unknown,
): value is TipoDocumentoRestaurante =>
  normalizarTipoDocumentoRestaurante(value) !== null;

/** Documento de dominio sincronizable con concurrencia optimista. */
export interface DocumentoRestaurante<TType extends TipoDocumentoRestaurante>
  extends AuditoriaRestaurante {
  id: string;
  type: TType;
  schemaVersion: number;
  /** Sede/local operativo; nunca es un id temporal del dispositivo. */
  localId: string;
  /** Aumenta una vez por cada comando aceptado sobre el agregado. */
  version: number;
}

export type EstadoSincronizacionRestaurante =
  | "PENDING"
  | "SYNCED"
  | "CONFLICT"
  | "REJECTED";

/** `operationId` es la clave de idempotencia de la operacion. */
export interface TrazaOperacionRestaurante {
  operationId: string;
  correlationId: string;
  causationId?: string;
  actorId: string;
  deviceId: string;
  occurredAt: number;
}

export type CodigoConflictoRestaurante =
  | "VERSION_DESACTUALIZADA"
  | "MESA_YA_OCUPADA"
  | "SESION_CERRADA"
  | "ITEM_YA_ENVIADO"
  | "CANTIDAD_YA_ENVIADA"
  | "TRANSICION_INVALIDA"
  | "CUENTA_YA_CERRADA"
  | "PAGO_YA_APLICADO";

export type ResultadoComandoRestaurante<T = unknown> =
  | {
      estado: "APLICADO" | "YA_APLICADO";
      operationId: string;
      aggregateId: string;
      version: number;
      data?: T;
    }
  | {
      estado: "CONFLICTO";
      operationId: string;
      aggregateId: string;
      codigo: CodigoConflictoRestaurante;
      expectedVersion: number;
      actualVersion: number;
      message: string;
    }
  | {
      estado: "RECHAZADO";
      operationId: string;
      aggregateId: string;
      codigo: string;
      message: string;
      retryable: boolean;
    };
