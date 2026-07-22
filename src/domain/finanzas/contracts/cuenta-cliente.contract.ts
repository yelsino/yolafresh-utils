import { MetodoPago } from "./finanzas.contract";

export type MonedaCuentaCliente = "PEN" | "USD";

export type EstadoCuentaCliente = "ACTIVA" | "SUSPENDIDA" | "CERRADA";

export type EstadoMovimientoCuentaCliente =
  | "CONFIRMADO"
  | "ANULADO"
  | "RECHAZADO"
  | "CONTABILIZADO"
  | "REVERTIDO";

export type EstadoImputacionCuentaCliente = "APLICADA" | "REVERTIDA";

export type RolRecepcionCobroCliente = "CAJERO" | "VENDEDOR" | "SISTEMA";

export interface CuentaCliente {
  id: string;
  clienteId: string;
  estado: EstadoCuentaCliente;
  moneda?: MonedaCuentaCliente;
  aperturaAt?: Date;
  cierreAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type TipoMovimientoCuentaCliente =
  | "DEPOSITO"
  | "COBRO"
  | "VENTA"
  | "DEVOLUCION"
  | "REVERSA"
  | "AJUSTE";

export type DireccionMovimientoCuentaCliente = "CREDITO" | "DEBITO";

export type OrigenMovimientoCuentaCliente =
  | "RECIBO_COBRO"
  | "COBRO"
  | "DEPOSITO"
  | "VENTA"
  | "PEDIDO"
  | "DEVOLUCION"
  | "REVERSA"
  | "RECURRENCIA"
  | "TRANSFERENCIA_CUSTODIA"
  | "MIGRACION"
  | "MANUAL"
  | "AJUSTE_MANUAL"
  | "EXTERNO";

export interface MovimientoCuentaCliente {
  id: string;
  cuentaId: string;
  clienteId?: string;
  tipo: TipoMovimientoCuentaCliente;
  direccion: DireccionMovimientoCuentaCliente;
  monto: number;
  moneda: MonedaCuentaCliente;
  tipoOrigen: OrigenMovimientoCuentaCliente;
  origenId: string;
  estado?: EstadoMovimientoCuentaCliente;
  descripcion?: string;
  recepcionCobroId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  custodioId?: string;
  idempotencyKey?: string;
  creadoPorId?: string;
  reversaDeMovimientoId?: string;
  occurredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ImputacionCuentaCliente {
  id: string;
  cuentaId?: string;
  clienteId?: string;
  movimientoOrigenId: string;
  movimientoDestinoId: string;
  monto: number;
  moneda: MonedaCuentaCliente;
  estado?: EstadoImputacionCuentaCliente;
  estrategia?: "FIFO";
  createdAt: Date;
}

export type EstadoRecepcionCobroCliente =
  | "CREADO"
  | "RECIBIDO"
  | "EN_TRANSFERENCIA_CUSTODIA"
  | "LIQUIDADO"
  | "RECHAZADO"
  | "ANULADO";

export interface RecepcionCobroCliente {
  id: string;
  codigoConstancia?: string;
  clienteId: string;
  cuentaId?: string;
  monto: number;
  moneda: MonedaCuentaCliente;
  metodoPago: MetodoPago;
  creadoPorId: string;
  recibidoPorUsuarioId?: string;
  recibidoPorRol?: RolRecepcionCobroCliente;
  custodioId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  tipoOrigen?: OrigenMovimientoCuentaCliente;
  origenId?: string;
  estado: EstadoRecepcionCobroCliente;
  idempotencyKey: string;
  occurredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type EstadoTransferenciaCustodiaCobro =
  | "CREADA"
  | "RECIBIDA"
  | "PENDIENTE"
  | "ACEPTADA"
  | "RECHAZADA"
  | "ANULADA";

export interface TransferenciaCustodiaCobro {
  id: string;
  recepcionCobroId: string;
  custodioOrigenId: string;
  custodioDestinoId: string;
  turnoCajaOrigenId: string;
  turnoCajaDestinoId: string;
  cajaOrigenId?: string;
  cajaDestinoId?: string;
  estado: EstadoTransferenciaCustodiaCobro;
  idempotencyKey?: string;
  recibidaPorId?: string;
  rechazadaPorId?: string;
  anuladaPorId?: string;
  motivoRechazo?: string;
  motivoAnulacion?: string;
  solicitadaAt?: Date;
  aceptadaAt?: Date;
  createdAt: Date;
  resueltaAt?: Date;
}

export interface ResumenCuentaCliente {
  id?: string;
  cuentaId: string;
  clienteId?: string;
  saldoFavor: number;
  saldoPorCobrar: number;
  saldoCreditoNoAplicado?: number;
  moneda: MonedaCuentaCliente;
  ultimoAsientoId?: string;
  ultimoAsientoAt?: Date;
  cantidadAsientosFuente?: number;
  cantidadImputacionesFuente?: number;
  version?: number;
  reconstruidaAt?: Date;
  createdAt?: Date;
  updatedAt: Date;
}
