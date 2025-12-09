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
  descripcion?: string;

  tipo: TipoAlmacenEnum;

  ubicacionFisica?: string;
  geoLat?: number;
  geoLon?: number;

  responsableId?: string;

  activo: boolean;

  createdAt: string;
  updatedAt: string;
}

export enum TipoMovimientoInventarioEnum {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
  AJUSTE = "AJUSTE",
  TRANSFERENCIA = "TRANSFERENCIA",
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
export interface MovimientoInventario {
  _id: string;
  type: "movimiento_inventario";

  tipo: TipoMovimientoInventarioEnum;

  origenDocumento: OrigenDocumentoEnum;

  motivo?: string; // "Rotura", "Donación", "Ajuste manual", etc.

  documentoReferenciaId?: string;

  almacenOrigenId?: string;
  almacenDestinoId?: string;

  items: MovimientoInventarioItem[];

  notas?: string;

  usuarioId: string;
  usuarioNombre?: string;

  fecha: string;

  createdAt: string;
  updatedAt: string;
}

export interface MovimientoInventarioItem {
  productoId: string;

  cantidad: number;

  costoUnitario?: number;
  costoPromedioCalculado?: number;

  lote?: string;
  fechaVencimiento?: string;

  ubicacionInterna?: string; // pasillo, rack, estante
}

export interface MovimientoInventarioItem {
  productoId: string;

  cantidad: number;

  costoUnitario?: number;
  costoPromedioCalculado?: number;

  lote?: string;
  fechaVencimiento?: string;

  ubicacionInterna?: string; // pasillo, rack, estante
}

export enum EstadoCompraEnum {
  BORRADOR = "BORRADOR",
  CONFIRMADO = "CONFIRMADO",
  ANULADO = "ANULADO",
  CONTABILIZADO = "CONTABILIZADO",
}
export interface Compra {
  _id: string;
  type: "compra";

  proveedorId: string;
  numeroDocumento?: string;

  almacenDestinoId: string;

  fecha: string;

  items: CompraItem[];

  impuestos?: number;
  descuentos?: number;
  gastosAdicionales?: number; // flete, transporte, etc.

  moneda?: "PEN" | "USD";
  tipoCambio?: number;

  total: number;

  estado: EstadoCompraEnum;

  createdAt: string;
  updatedAt: string;
}

export interface CompraItem {
  productoId: string;

  cantidad: number;

  costoUnitario: number;
  costoTotal?: number;

  lote?: string;
  fechaVencimiento?: string;
}

// no es un documento, es una linea del kardex
export interface KardexLinea {
  fecha: string;
  documento: string;
  tipo: "ENTRADA" | "SALIDA";

  cantidadEntrada: number;
  cantidadSalida: number;

  costoUnitario: number;
  costoTotal: number;

  stockFinal: number;
}

export interface StockProductoAlmacen {
  productoId: string;
  almacenId: string;

  stockActual: number;
  stockReservado?: number;
  stockDisponible: number;

  lotes?: StockLote[];
}

export interface StockLote {
  lote: string;
  fechaVencimiento?: string;
  cantidad: number;
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

  almacenOrigenId: string;
  almacenDestinoId: string;

  motivo?: string;

  items: TransferenciaItem[];

  estado: EstadoTransferenciaEnum;

  usuarioId: string;
  usuarioRecepcionId?: string;

  fechaEnvio: string;
  fechaRecepcion?: string;

  createdAt: string;
  updatedAt: string;
}

export interface TransferenciaItem {
  productoId: string;
  cantidad: number;
}
