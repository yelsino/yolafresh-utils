import type {
  DineroRestaurante,
  DocumentoRestaurante,
  TrazaOperacionRestaurante,
} from "./common.contract";

export type EstadoCuentaConsumoRestaurante =
  | "ABIERTA"
  | "PARCIALMENTE_PAGADA"
  | "SALDADA"
  | "CERRADA"
  | "ANULADA"
  | "EN_DISPUTA";

export interface CargoCuentaRestaurante {
  id: string;
  pedidoId: string;
  pedidoLineaId: string;
  nombre: string;
  cantidad: number;
  subtotal: DineroRestaurante;
  descuento: DineroRestaurante;
  impuesto: DineroRestaurante;
  total: DineroRestaurante;
  createdAt: number;
  compensadoPorCargoId?: string;
}

export interface TotalesCuentaRestaurante {
  subtotal: DineroRestaurante;
  descuento: DineroRestaurante;
  impuesto: DineroRestaurante;
  servicio: DineroRestaurante;
  propina: DineroRestaurante;
  redondeo: DineroRestaurante;
  total: DineroRestaurante;
  pagado: DineroRestaurante;
  saldo: DineroRestaurante;
}

export interface CuentaConsumoRestaurante
  extends DocumentoRestaurante<"restaurant_cuentas_consumo"> {
  sesionServicioId: string;
  estado: EstadoCuentaConsumoRestaurante;
  cargos: CargoCuentaRestaurante[];
  asignacionesPagoIds: string[];
  totales: TotalesCuentaRestaurante;
  ventaIds: string[];
  precuentaEmitidaAt?: number;
  cerradaAt?: number;
  operacionCierreId?: string;
}

export type EstadoAsignacionPagoRestaurante = "APLICADA" | "REVERSADA";

/** Traza Cuenta -> Pago -> Caja -> Venta sin duplicar el pago compartido. */
export interface AsignacionPagoRestaurante
  extends DocumentoRestaurante<"restaurant_asignaciones_pago"> {
  cuentaConsumoId: string;
  pagoId: string;
  monto: DineroRestaurante;
  estado: EstadoAsignacionPagoRestaurante;
  trace: TrazaOperacionRestaurante;
  revertidaPorAsignacionId?: string;
}
