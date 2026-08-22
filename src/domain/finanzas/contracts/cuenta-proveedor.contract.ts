import type { MetodoPago } from "./finanzas.contract";

export const CUENTA_PROVEEDOR_DOCUMENT_SCHEMA_VERSION = 1 as const;

export const TIPOS_DOCUMENTO_CUENTA_PROVEEDOR = [
  "cuenta_proveedor",
  "movimiento_cuenta_proveedor",
  "imputacion_cuenta_proveedor",
  "desembolso_proveedor",
  "resumen_cuenta_proveedor",
  "operacion_cuenta_proveedor",
] as const;

export type TipoDocumentoCuentaProveedor =
  (typeof TIPOS_DOCUMENTO_CUENTA_PROVEEDOR)[number];

export type MonedaCuentaProveedor = "PEN" | "USD";
export type EstadoCuentaProveedor = "ACTIVA" | "SUSPENDIDA" | "CERRADA";

export interface CuentaProveedor {
  id: string;
  proveedorId: string;
  estado: EstadoCuentaProveedor;
  moneda: MonedaCuentaProveedor;
  aperturaAt: Date;
  cierreAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TipoMovimientoCuentaProveedor =
  | "COMPRA"
  | "PAGO"
  | "ADELANTO"
  | "NOTA_CREDITO"
  | "DEVOLUCION"
  | "AJUSTE"
  | "REVERSA";

/** Dirección observada desde los libros del negocio. */
export type DireccionMovimientoCuentaProveedor = "DEBITO" | "CREDITO";

export type OrigenMovimientoCuentaProveedor =
  | "COMPRA"
  | "COMPRA_DIRECTA"
  | "PAGO_PROVEEDOR"
  | "ADELANTO"
  | "NOTA_CREDITO"
  | "DEVOLUCION"
  | "AJUSTE"
  | "REVERSA"
  | "MIGRACION";

export type EstadoMovimientoCuentaProveedor =
  | "CONTABILIZADO"
  | "RECHAZADO";

export interface MovimientoCuentaProveedor {
  id: string;
  cuentaId: string;
  proveedorId: string;
  tipo: TipoMovimientoCuentaProveedor;
  direccion: DireccionMovimientoCuentaProveedor;
  monto: number;
  moneda: MonedaCuentaProveedor;
  tipoOrigen: OrigenMovimientoCuentaProveedor;
  origenId: string;
  estado: EstadoMovimientoCuentaProveedor;
  idempotencyKey: string;
  descripcion?: string;
  creadoPorId: string;
  desembolsoId?: string;
  reversaDeMovimientoId?: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type TipoImputacionCuentaProveedor = "APLICACION" | "REVERSA";
export type EstrategiaImputacionCuentaProveedor = "EXPLICITA" | "FIFO";

export interface ImputacionCuentaProveedor {
  id: string;
  cuentaId: string;
  proveedorId: string;
  tipo: TipoImputacionCuentaProveedor;
  movimientoOrigenId: string;
  movimientoDestinoId: string;
  monto: number;
  moneda: MonedaCuentaProveedor;
  estrategia: EstrategiaImputacionCuentaProveedor;
  reversaDeImputacionId?: string;
  createdAt: Date;
}

export type EstadoDesembolsoProveedor =
  | "CREADO"
  | "AUTORIZADO"
  | "EJECUTADO"
  | "RECHAZADO"
  | "ANULADO";

export type OrigenDesembolsoProveedor =
  | "COMPRA"
  | "COMPRA_DIRECTA"
  | "PAGO_PROVEEDOR"
  | "ADELANTO"
  | "AJUSTE";

export interface DesembolsoProveedor {
  id: string;
  proveedorId: string;
  cuentaId: string;
  monto: number;
  moneda: MonedaCuentaProveedor;
  metodoPago: MetodoPago;
  estado: EstadoDesembolsoProveedor;
  solicitadoPorId: string;
  autorizadoPorId?: string;
  ejecutadoPorId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  cuentaFinancieraId?: string;
  egresoId?: string;
  movimientoCajaId?: string;
  evidenciaIds?: string[];
  tipoOrigen: OrigenDesembolsoProveedor;
  origenId: string;
  idempotencyKey: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ResumenCuentaProveedor {
  id?: string;
  cuentaId: string;
  proveedorId: string;
  saldoPorPagar: number;
  saldoFavorNegocio: number;
  saldoDebitoNoAplicado: number;
  moneda: MonedaCuentaProveedor;
  ultimoMovimientoId?: string;
  ultimoMovimientoAt?: Date;
  cantidadMovimientosFuente: number;
  cantidadImputacionesFuente: number;
  version: number;
  reconstruidaAt: Date;
  updatedAt: Date;
}

export type TipoOperacionCuentaProveedor =
  | "REGISTRAR_OBLIGACION_COMPRA"
  | "REGISTRAR_COMPRA_Y_PAGO"
  | "REGISTRAR_PAGO_PROVEEDOR"
  | "REGISTRAR_ADELANTO_PROVEEDOR"
  | "APLICAR_CREDITO_A_COMPRAS"
  | "REGISTRAR_NOTA_CREDITO_PROVEEDOR"
  | "REVERSAR_MOVIMIENTO_PROVEEDOR";

export type EstadoOperacionCuentaProveedor =
  | "EN_PROGRESO"
  | "RECUPERACION_REQUERIDA"
  | "CONFIRMADA"
  | "RECHAZADA";

export interface DocumentosPlaneadosCuentaProveedor {
  cuentaId: string;
  movimientoIds: string[];
  imputacionIds: string[];
  desembolsoId?: string;
  resumenId: string;
}

export interface OperacionCuentaProveedor {
  id: string;
  operationType: TipoOperacionCuentaProveedor;
  cuentaId: string;
  proveedorId: string;
  moneda: MonedaCuentaProveedor;
  idempotencyKey: string;
  requestHash: string;
  estado: EstadoOperacionCuentaProveedor;
  pasoActual: string;
  actorId: string;
  deviceId?: string;
  businessRef?: string;
  documentosPlaneados: DocumentosPlaneadosCuentaProveedor;
  reasonCode?: string;
  reasonMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
}

export interface EstadoLibroCuentaProveedor {
  movimientos: MovimientoCuentaProveedor[];
  imputaciones: ImputacionCuentaProveedor[];
  resumen: ResumenCuentaProveedor;
}

export interface AplicacionSolicitadaCuentaProveedor {
  movimientoDestinoId: string;
  monto: number;
}

interface ComandoCuentaProveedorBase {
  operationType: TipoOperacionCuentaProveedor;
  proveedorId: string;
  moneda: MonedaCuentaProveedor;
  idempotencyKey: string;
  occurredAt: Date;
  businessRef?: string;
  deviceId?: string;
}

export type ComandoCuentaProveedor =
  | (ComandoCuentaProveedorBase & {
      operationType: "REGISTRAR_OBLIGACION_COMPRA";
      compraId: string;
      monto: number;
      compraDirecta?: boolean;
      descripcion?: string;
    })
  | (ComandoCuentaProveedorBase & {
      operationType: "REGISTRAR_COMPRA_Y_PAGO";
      compraId: string;
      montoCompra: number;
      montoPagado: number;
      metodoPago: MetodoPago;
      compraDirecta?: boolean;
      cajaId?: string;
      turnoCajaId?: string;
      cuentaFinancieraId?: string;
      egresoId?: string;
      movimientoCajaId?: string;
      evidenciaIds?: string[];
      descripcion?: string;
    })
  | (ComandoCuentaProveedorBase & {
      operationType: "REGISTRAR_PAGO_PROVEEDOR";
      pagoId: string;
      monto: number;
      metodoPago: MetodoPago;
      cajaId?: string;
      turnoCajaId?: string;
      cuentaFinancieraId?: string;
      egresoId?: string;
      movimientoCajaId?: string;
      evidenciaIds?: string[];
      aplicaciones?: AplicacionSolicitadaCuentaProveedor[];
      descripcion?: string;
    })
  | (ComandoCuentaProveedorBase & {
      operationType: "REGISTRAR_ADELANTO_PROVEEDOR";
      adelantoId: string;
      monto: number;
      metodoPago: MetodoPago;
      cajaId?: string;
      turnoCajaId?: string;
      cuentaFinancieraId?: string;
      egresoId?: string;
      movimientoCajaId?: string;
      evidenciaIds?: string[];
      descripcion?: string;
    })
  | (ComandoCuentaProveedorBase & {
      operationType: "APLICAR_CREDITO_A_COMPRAS";
      movimientoOrigenId: string;
      aplicaciones?: AplicacionSolicitadaCuentaProveedor[];
      montoMaximo?: number;
    })
  | (ComandoCuentaProveedorBase & {
      operationType: "REGISTRAR_NOTA_CREDITO_PROVEEDOR";
      notaCreditoId: string;
      monto: number;
      aplicaciones?: AplicacionSolicitadaCuentaProveedor[];
      descripcion?: string;
    })
  | (ComandoCuentaProveedorBase & {
      operationType: "REVERSAR_MOVIMIENTO_PROVEEDOR";
      movimientoId: string;
      motivo: string;
    });

export interface ResultadoOperacionCuentaProveedor {
  operacion: OperacionCuentaProveedor;
  cuenta: CuentaProveedor;
  resumen: ResumenCuentaProveedor;
  movimientos: MovimientoCuentaProveedor[];
  imputaciones: ImputacionCuentaProveedor[];
  desembolso?: DesembolsoProveedor;
}
