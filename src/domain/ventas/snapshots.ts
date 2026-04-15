import { MetodoPago } from "@/domain/shared/interfaces/finanzas";
import { Cliente } from "@/domain/shared/interfaces/persons";
import { IUsuario } from "@/domain/shared/interfaces/usuario";
import { TipoVentaEnum, UnidadMedidaEnum } from "@/domain/shared/interfaces/producto";
import { ProcedenciaVenta } from "./CarritoVenta";

export interface VentaProductSnapshot {
  id: string;
  nombre: string;
  tipoVenta: TipoVentaEnum;
  precioVenta: number;
  contenidoNeto?: number;
  unidadContenido?: UnidadMedidaEnum;
  imagenUrl?: string;
}

export interface VentaClienteSnapshot {
  id: string;
  nombres: string;
  celular: string;
  correo: string;
  dni: string;
  direccion: string;
}

export interface VentaCarItemSnapshot {
  id: string;
  product: VentaProductSnapshot;
  quantity: number;
  precioUnitario: number;
  montoTotal: number;
  descuento?: number;
  esPedido?: boolean;
  montoModificado?: boolean;
}

export interface VentaDetalleSnapshot {
  id: string;
  createdAt: number;
  updatedAt: number;
  nombre: string;
  items: VentaCarItemSnapshot[];
  subtotal: number;
  descuentoTotal: number;
  impuesto: number;
  total: number;
  cantidadItems: number;
  cantidadTotal: number;
  notas?: string;
  tasaImpuesto: number;
  cliente?: VentaClienteSnapshot;
  clienteId?: string;
  personalId?: string;
  metodoPago?: MetodoPago;
  dineroRecibido?: number;
  procedencia?: ProcedenciaVenta;
  esPedido?: boolean;
  finanzaId?: string;
  configuracionFiscal?: Record<string, unknown>;
  clienteRaw?: Cliente;
  personalRaw?: IUsuario;
  clienteColor?: string;
}
