import { MetodoPago, TipoEgreso } from "./finanzas";

export type Moneda = "PEN" | "USD";

export type TipoMovimientoFinanciero =
  | "INGRESO"
  | "EGRESO"
  | "CAMBIO"
  | "ANULACION"
  | "AJUSTE";

export type ReferenciaTipoMovimientoFinanciero =
  | "VENTA"
  | "COMPRA"
  | "PAGO"
  | "DEVOLUCION"
  | "AJUSTE";

export interface MovimientoFinanciero {
  id: string;
  tipo: TipoMovimientoFinanciero;
  monto: number;
  moneda: Moneda;
  metodoPago: MetodoPago;
  referenciaTipo: ReferenciaTipoMovimientoFinanciero;
  referenciaId?: string;
  cajaId?: string;
  turnoId?: string;
  saldoPosterior: number;
  creadoPorId: string;
  createdAt: Date;
}

export type EstadoCierreCaja = "CUADRADO" | "DESCUADRE";

export interface CierreCaja {
  id: string;
  cajaId: string;
  turnoId: string;
  fecha: Date;
  saldoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoEsperado: number;
  saldoContado: number;
  diferencia: number;
  estado: EstadoCierreCaja;
  cerradoPorId: string;
  createdAt: Date;
}

export interface ConciliacionBancaria {
  id: string;
  cuentaBancariaId: string;
  fecha: Date;
  saldoBanco: number;
  saldoSistema: number;
  diferencia: number;
  conciliadoPorId: string;
  createdAt: Date;
}

export interface CentroCosto {
  id: string;
  nombre: string;
  activo: boolean;
}

export type PeriodoPresupuesto = "DIARIO" | "SEMANAL" | "MENSUAL";

export interface Presupuesto {
  id: string;
  tipoEgreso: TipoEgreso;
  montoMaximo: number;
  periodo: PeriodoPresupuesto;
  activo: boolean;
}

export type AuditAccion = "CREADO" | "ACTUALIZADO" | "ANULADO" | "ELIMINADO";

export interface AuditLogCambio {
  campo: string;
  anterior: unknown;
  nuevo: unknown;
}

export interface AuditLog {
  id: string;
  entidad: string;
  entidadId: string;
  accion: AuditAccion;
  usuarioId: string;
  fecha: Date;
  cambios?: AuditLogCambio[];
}

