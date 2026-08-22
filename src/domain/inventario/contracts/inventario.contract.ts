// Este contexto controla: Dónde está el stock, Cuánto stock hay
// Movimientos,Transferencias,Lotes,Kardex

import { UnixMillis, ISODateOnly, ISODateString } from "../../shared/utils/dates";


export enum TipoAlmacenEnum {
  CENTRAL = "CENTRAL",
  TIENDA = "TIENDA",
  TRANSITO = "TRANSITO",
  MOSTRADOR = "MOSTRADOR",
}
export interface Almacen {
  _id: string;
  type: "almacen";

  nombre: string;
  codigo?: string;
  descripcion?: string;

  tipo: TipoAlmacenEnum;

  ubicacionFisica?: string;
  geoLat?: number;
  geoLon?: number;

  capacidad?: number;
  unidadCapacidad?: string; // m3, kg, pallets

  responsableId?: string;

  activo: boolean;
  permitirLotes: boolean;
  permitirNegativos: boolean;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export interface RecepcionMercaderia {
  id: string;
  type: "recepcion_mercaderia";

  eventoCompraId: string;
  almacenDestinoId: string;

  fechaRecepcion: ISODateString;

  vehiculo?: string;
  guiaTransportista?: string;

  estado: EstadoRecepcionMercaderiaEnum;

  items: RecepcionMercaderiaItem[];

  usuarioId: string;
  observaciones?: string;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export enum EstadoRecepcionMercaderiaEnum {
  BORRADOR = "BORRADOR",
  CONFIRMADA = "CONFIRMADA",
  ANULADA = "ANULADA",
}

export interface RecepcionMercaderiaItem {
  presentacionId: string;
  cantidadRecibida: number;

  lote?: string;
  fechaVencimiento?: ISODateOnly;

  compraItemId?: string;
  compraId?: string;
  proveedorId?: string;
}

export interface AsignacionRecepcionCompra {
  id: string;
  recepcionMercaderiaId: string;
  compraId: string;
  compraItemId: string;
  presentacionId: string;
  cantidadAsignada: number;
  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}
