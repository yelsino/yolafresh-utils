import { UnixMillis } from "../../shared/utils/dates";
import { MetodoPago, MetodoRegistro, TipoEgreso } from "./finanzas.contract";

export type RecurrenciaEstado = "ACTIVA" | "PAUSADA" | "ANULADA";
export type RecurrenciaFrecuencia = "DIARIA" | "SEMANAL" | "MENSUAL" | "ANUAL";

export interface RecurrenciaHorarioUTC {
  hora: number;
  minuto: number;
}

export interface ReglaRecurrencia {
  frecuencia: RecurrenciaFrecuencia;
  intervalo?: number;
  diasSemana?: number[];
  diaMes?: number;
  mes?: number;
  horarioUTC: RecurrenciaHorarioUTC;
}

export interface RecurrenciaCrearEgresoPayload {
  monto: number;
  tipoEgreso: TipoEgreso;
  centroCostoId?: string;
  quienRegistroId: string;
  quienHizoGastoId: string;
  metodoRegistro: MetodoRegistro;
  detalle?: string;
  observaciones?: string;
  metodoPago: MetodoPago;
  prorrateable?: boolean;
}

export interface RecurrenciaCrearCargoClientePayload {
  clienteId: string;
  monto: number;
  moneda: "PEN" | "USD";
  descripcion?: string;
}

export interface RecurrenciaAccionPayloadMap {
  CREAR_EGRESO: RecurrenciaCrearEgresoPayload;
  CREAR_CARGO_CLIENTE: RecurrenciaCrearCargoClientePayload;
  CREAR_MERMA: unknown;
  CREAR_COMPRA: unknown;
  CREAR_RECORDATORIO: unknown;
  ENVIAR_WHATSAPP: unknown;
  GENERAR_REPORTE: unknown;
  CREAR_VENTA: unknown;
}

export type TipoAccionRecurrencia = keyof RecurrenciaAccionPayloadMap | (string & {});

export type PayloadAccionRecurrencia<TAction extends TipoAccionRecurrencia> =
  TAction extends keyof RecurrenciaAccionPayloadMap
    ? RecurrenciaAccionPayloadMap[TAction]
    : unknown;

export interface Recurrencia {
  id: string;
  type: "recurrencia";
  nombre: string;
  estado: RecurrenciaEstado;
  regla: ReglaRecurrencia;
  accion: TipoAccionRecurrencia;
  payload: unknown;
  inicioAt: UnixMillis;
  finAt?: UnixMillis;
  siguienteEjecucionAt: UnixMillis;
  ultimaEjecucionAt?: UnixMillis;
  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export type EstadoEjecucionRecurrencia = "DESPACHADA" | "COMPLETADA" | "FALLIDA" | "ANULADA";

export interface EjecucionRecurrencia {
  id: string;
  type: "recurrencia_ejecucion";
  recurrenciaId: string;
  scheduledFor: UnixMillis;
  accion: TipoAccionRecurrencia;
  payload: unknown;
  estado: EstadoEjecucionRecurrencia;
  dispatchedAt?: UnixMillis;
  completedAt?: UnixMillis;
  error?: string;
}

export type RecurrenciaTyped<TAction extends TipoAccionRecurrencia> = Omit<
  Recurrencia,
  "accion" | "payload"
> & {
  accion: TAction;
  payload: PayloadAccionRecurrencia<TAction>;
};

export type RecurrenciaDispatch = Pick<
  EjecucionRecurrencia,
  "id" | "type" | "recurrenciaId" | "scheduledFor" | "accion" | "payload"
>;

export type RecurrenciaActionHandlerResultado =
  | { estado: "COMPLETADA"; descripcion?: string }
  | { estado: "FALLIDA"; error: string };

export type RecurrenciaActionHandler<TAction extends TipoAccionRecurrencia> = (
  params: {
    dispatch: RecurrenciaDispatch;
    recurrencia: RecurrenciaTyped<TAction>;
    payload: PayloadAccionRecurrencia<TAction>;
  },
) => RecurrenciaActionHandlerResultado | Promise<RecurrenciaActionHandlerResultado>;
