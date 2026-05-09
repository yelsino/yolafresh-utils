import { UnixMillis } from "@/utils";
import { MetodoPago, MetodoRegistro, TipoEgreso } from "./finanzas";

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

export interface RecurrenciaEgresoTemplate {
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

export interface RecurrenciaCargoClienteTemplate {
  clienteId: string;
  monto: number;
  moneda: "PEN" | "USD";
  descripcion?: string;
}

export type AccionRecurrencia =
  | { tipo: "EGRESO"; template: RecurrenciaEgresoTemplate }
  | { tipo: "CARGO_CLIENTE"; template: RecurrenciaCargoClienteTemplate };

export interface Recurrencia {
  id: string;
  nombre: string;
  estado: RecurrenciaEstado;
  regla: ReglaRecurrencia;
  accion: AccionRecurrencia;
  inicioAt: UnixMillis;
  finAt?: UnixMillis;
  siguienteEjecucionAt: UnixMillis;
  ultimaEjecucionAt?: UnixMillis;
  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export type EstadoEjecucionRecurrencia =
  | "PENDIENTE"
  | "EJECUTADA"
  | "FALLIDA"
  | "ANULADA";

export type TipoDocumentoRecurrenciaGenerado = "EGRESO" | "MOV_CUENTA_CLIENTE";

export interface DocumentoRecurrenciaGenerado {
  tipo: TipoDocumentoRecurrenciaGenerado;
  id: string;
}

export interface EjecucionRecurrencia {
  id: string;
  recurrenciaId: string;
  scheduledFor: UnixMillis;
  executedAt?: UnixMillis;
  estado: EstadoEjecucionRecurrencia;
  documentosGenerados: DocumentoRecurrenciaGenerado[];
  error?: string;
}
