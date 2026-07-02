import { ProcedenciaVenta } from "./CarritoVenta";

export interface VentaItemPersistenceSnapshot {
  id: string;
  presentacionId: string;
  cantidadVendida: number;
  precioUnitario: number;
  montoModificado?: boolean;
  montoTotal?: number;
  descuento?: number;
}

export interface VentaSnapshotBase {
  id: string;
  nombre: string;
  type: string;
  estado: string;
  pedidoId?: string;
  createdAt: number;
  updatedAt: number;
  items: VentaItemPersistenceSnapshot[];
  costoEnvio?: number;
  subtotal: number;
  impuesto: number;
  total: number;
  montoRedondeo?: number;
  procedencia: ProcedenciaVenta | string;
  clienteId?: string;
  vendedorId?: string;
  codigoVenta?: string;
  numeroVenta?: string;
}

export interface VentaPersistenceSnapshot extends VentaSnapshotBase {}

export interface VentaCouchMinimalSnapshot extends VentaSnapshotBase {}
