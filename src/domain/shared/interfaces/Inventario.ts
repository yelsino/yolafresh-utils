// Este contexto controla: Dónde está el stock, Cuánto stock hay
// Movimientos,Transferencias,Lotes,Kardex

import { UnixMillis, ISODateOnly, ISODateString } from "@/utils";


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

export interface StockPresentacionAlmacen {
  presentacionId: string;
  almacenId: string;

  stockActual: number;
  stockReservado?: number;
  stockDisponible: number;

  costoPromedioActual: number; // Costo promedio ponderado actual
  valorInventario: number;

  minimo?: number;
  maximo?: number;
  puntoReorden?: number;
  ultimoMovimiento?: string;

}

export interface StockLoteAlmacen {
  _id: string

  presentacionId: string
  almacenId: string

  lote: string
  fechaVencimiento?: ISODateOnly

  cantidad: number
}

// 🔐 SOLO MovimientoInventario puede modificar el stock.
export interface MovimientoInventario {
  _id: string;
  type: "movimiento_inventario";

  numeroMovimiento?: string; // Correlativo interno

  tipo: TipoMovimientoInventarioEnum;
  estado: EstadoMovimientoEnum;

  origenDocumento: OrigenDocumentoEnum;

  documentoReferenciaId?: string;
  serieDocumentoReferencia?: string;

  motivo?: string; // "Rotura", "Donación", "Ajuste manual", etc.

  almacenOrigenId?: string;
  almacenDestinoId?: string;

  items: MovimientoInventarioItem[];

  esAutomatico?: boolean;

  notas?: string;

  usuarioId: string;
  usuarioNombre?: string;

  fechaMovimiento: ISODateString; // Fecha en que ocurre el movimiento

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export interface MovimientoInventarioItem {
  presentacionId: string;

  cantidad: number;

  costoUnitario?: number;
  costoPromedioCalculado?: number;

  costoPromedioAnterior?: number;
  costoPromedioNuevo?: number;

  lote?: string;
  almacenId?: string;
  fechaVencimiento?: ISODateOnly;

  ubicacionInterna?: string; // pasillo, rack, estante
}

export enum TipoMovimientoInventarioEnum {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
  AJUSTE = "AJUSTE",
  TRANSFERENCIA = "TRANSFERENCIA",
}

export enum EstadoMovimientoEnum {
  PENDIENTE = "PENDIENTE",
  APLICADO = "APLICADO",
  ANULADO = "ANULADO",
}

export enum OrigenDocumentoEnum {
  COMPRA = "COMPRA",
  VENTA = "VENTA",
  AJUSTE = "AJUSTE",
  TRANSFERENCIA = "TRANSFERENCIA",
  PRODUCCION = "PRODUCCION",
  MERMA = "MERMA",
  DEVOLUCION = "DEVOLUCION",
  INVENTARIO_FISICO = "INVENTARIO_FISICO",
}

export enum EstadoTransferenciaEnum {
  PENDIENTE = "PENDIENTE",
  EN_TRANSITO = "EN_TRANSITO",
  RECIBIDO = "RECIBIDO",
  ANULADO = "ANULADO",
}
export interface Transferencia {
  _id: string;
  type: "transferencia";

  numeroTransferencia?: string;

  almacenOrigenId: string;
  almacenDestinoId: string;

  motivo?: string;
  observaciones?: string;
  adjuntos?: string[];

  items: TransferenciaItem[];

  estado: EstadoTransferenciaEnum;

  usuarioId: string;
  usuarioSolicitaNombre?: string;
  usuarioRecepcionId?: string;
  usuarioRecibeNombre?: string;

  fechaSolicitud: ISODateString; // Fecha en que se creó la solicitud
  fechaRecepcion?: ISODateString;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}
export interface TransferenciaItem {
  presentacionId: string;
  cantidad: number;
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

// no es un documento, es una linea del kardex Debe generarse desde movimientos.
export interface KardexLinea {
  fechaMovimiento: ISODateString; // Fecha en que ocurrió el movimiento
  documento: string;
  tipo: "ENTRADA" | "SALIDA";

  cantidadEntrada: number;
  cantidadSalida: number;

  costoUnitario: number;
  costoTotal: number;

  stockFinal: number;
  costoPromedioFinal: number; // Costo promedio después del movimiento
  saldoCostoTotal: number; // Valorización total del inventario
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
