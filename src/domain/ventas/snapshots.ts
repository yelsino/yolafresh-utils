import { MetodoPago } from "@/domain/shared/interfaces/finanzas";
import { TipoVentaEnum, UnidadMedidaEnum } from "@/domain/shared/interfaces/producto";
import { ProcedenciaVenta } from "./CarritoVenta";

export interface VentaImageSnapshot {
  sizes: {
    small: string;
  };
}

export interface VentaProductSnapshot {
  id: string;
  type?: string;
  productoBaseId?: string;
  nombre?: string;
  sku?: string;
  codigoBarra?: string;
  tipoVenta?: TipoVentaEnum;
  contenidoNeto?: number;
  unidadContenido?: UnidadMedidaEnum;
  tipoEmpaque?: string;
  fraccionable?: boolean;
  imagen?: VentaImageSnapshot;
}

export interface VentaClienteSnapshot {
  id: string;
  nombres?: string;
  celular?: string;
  correo?: string;
  dni?: string;
  direccion?: string;
}

export interface VentaPersonalSnapshot {
  id: string;
  username?: string;
  email?: string;
}

export interface VentaItemSnapshot {
  id: string;
  product?: VentaProductSnapshot;
  quantity: number;
  precioUnitario?: number;
  montoModificado?: boolean;
  montoTotal?: number;
  descuento?: number;
  esPedido?: boolean;
  displayName?: string;
  productoBaseNombre?: string;
}

export interface VentaDetalleSnapshot {
  id: string;
  createdAt: number;
  updatedAt: number;
  nombre: string;
  items: VentaItemSnapshot[];
  subtotal: number;
  descuentoTotal: number;
  impuesto: number;
  total: number;
  cantidadItems: number;
  cantidadTotal: number;
  notas?: string;
  configuracionFiscal?: {
    tasaImpuesto?: number;
    aplicaImpuesto?: boolean;
    nombreImpuesto?: string;
  };
  tasaImpuesto: number;
  cliente?: VentaClienteSnapshot;
  personal?: VentaPersonalSnapshot;
  clienteColor?: string;
  clienteId?: string;
  personalId?: string;
  metodoPago?: MetodoPago;
  dineroRecibido?: number;
  procedencia?: ProcedenciaVenta;
  esPedido?: boolean;
  finanzaId?: string;
}

export interface VentaPersistenceSnapshot {
  id: string;
  nombre: string;
  type: string;
  estado: string;
  createdAt: number;
  updatedAt: number;
  detalleVenta: VentaDetalleSnapshot;
  costoEnvio?: number;
  subtotal: number;
  impuesto: number;
  total: number;
  montoRedondeo?: number;
  procedencia: string;
  tipoPago?: string;
  clienteId?: string;
  vendedorId?: string;
  finanzaId?: string;
  codigoVenta?: string;
  numeroVenta?: string;
  esPedido?: boolean;
}

// Snapshot ultra-minimo para Couch/Pouch (sync). Diseñado para minimizar tamaño.
export interface VentaCouchMinimalItemSnapshot {
  presentacionId: string;
  productoBaseId?: string;
  quantity: number;
  precioUnitario?: number;
  montoTotal?: number;
  montoModificado?: boolean;
  descuento?: number;
  esPedido?: boolean;
}

export interface VentaCouchMinimalDetalleSnapshot {
  items: VentaCouchMinimalItemSnapshot[];
  subtotal: number;
  impuesto: number;
  total: number;
  descuentoTotal: number;
  cantidadItems: number;
  cantidadTotal: number;
  tasaImpuesto: number;
  notas?: string;
  metodoPago?: MetodoPago;
  dineroRecibido?: number;
  procedencia?: ProcedenciaVenta;
  esPedido?: boolean;
  finanzaId?: string;
  clienteId?: string;
  personalId?: string;
}

export interface VentaCouchMinimalSnapshot {
  id: string;
  nombre: string;
  type: string;
  estado: string;
  createdAt: number;
  updatedAt: number;
  detalleVenta: VentaCouchMinimalDetalleSnapshot;
  costoEnvio?: number;
  subtotal: number;
  impuesto: number;
  total: number;
  montoRedondeo?: number;
  procedencia: string;
  tipoPago?: string;
  clienteId?: string;
  vendedorId?: string;
  finanzaId?: string;
  codigoVenta?: string;
  numeroVenta?: string;
  esPedido?: boolean;
}
