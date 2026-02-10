import { Personal, TipoEmpaqueEnum, UnidadMedidaEnum } from "@/interfaces";

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

  createdAt: Date;
  updatedAt: Date;
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

  fechaMovimiento: string; // Fecha en que ocurre el movimiento

  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoInventarioItem {
  productoId: string;

  cantidad: number;

  costoUnitario?: number;
  costoPromedioCalculado?: number;

  costoPromedioAnterior?: number;
  costoPromedioNuevo?: number;

  lote?: string;
  fechaVencimiento?: string;

  ubicacionInterna?: string; // pasillo, rack, estante
}

export enum EstadoCompraEnum {
  BORRADOR = "BORRADOR",
  CONFIRMADO = "CONFIRMADO",
  ANULADO = "ANULADO",
}

export enum TipoDocumentoCompraEnum {
  FACTURA = "FACTURA",
  BOLETA = "BOLETA",
  NOTA_CREDITO = "NOTA_CREDITO",
  GUIA_REMISION = "GUIA_REMISION",
  OTRO = "OTRO",
  SIN_ASIGNAR = "SIN_ASIGNAR",
}

export enum EstadoPagoEnum {
  PENDIENTE = "PENDIENTE",
  PAGADO_PARCIAL = "PAGADO_PARCIAL",
  PAGADO = "PAGADO",
}
export interface CompraEgresoRef {
  egresoId: string;
  montoAplicado: number; // permite prorrateo parcial
}

export interface ICompra {
  id: string;
  eventoCompraId?: string; // 🔑 trazabilidad
  proveedorId: string;
  proveedorNombre?: string;
  proveedorRuc?: string;

  tipoDocumento: TipoDocumentoCompraEnum;
  // Documento externo (proveedor)
  serieDocumento?: string;
  numeroDocumento?: string;

  // Correlativo del sistema (se asigna al cerrar)
  correlativo?: string;

  almacenDestinoId: string;

  fechaDocumento: string; // Fecha de emisión del documento (factura/boleta)
  fechaRegistro: string; // Fecha de registro en el sistema

  items: CompraItem[];

  subtotal: number;
  impuestos?: number;
  descuentos?: number;
  gastosAdicionales?: CompraEgresoRef[]; // flete, transporte, etc.

  moneda: "PEN" | "USD";
  tipoCambio?: number;

  total: number;

  condicionPago?: "CONTADO" | "CREDITO";
  estadoPago: EstadoPagoEnum;
  fechaVencimientoPago?: string;

  estado: EstadoCompraEnum;

  createdAt: Date;
  updatedAt: Date;
}

export interface CompraItem {
  id: string;
  productoId: string;
  cantidad: number;
  unidadMedida?: UnidadMedidaEnum;
  envoltorio?: TipoEmpaqueEnum;
  factorConversion?: number; // 1 si es la unidad base

  costoUnitario: number; // Costo del proveedor
  costoTotal?: number;

  impuestoUnitario?: number;
  impuestoTotal?: number;

  afectaInventario?: boolean;

  lote?: string;
  fechaVencimiento?: string;
}

export enum EstadoEventoCompraEnum {
  EN_REGISTRO = "EN_REGISTRO",
  CONFIRMADO = "CONFIRMADO",
  CERRADO = "CERRADO",
  CANCELADO = "CANCELADO",
}
export interface EventoCompra {
  id: string;

  responsableId: string;
  responsableNombre?: string;

  origen: string; // lima
  destino?: string; // satipo
  montoAsignado?: number;
  estado: EstadoEventoCompraEnum;

  createdAt: Date;
  updatedAt: Date;
}

// EventoCompraProveedor es irrelevante y se puede eliminar sin perder información.
// export interface EventoCompraProveedor {
//   id: string;
//   eventoCompraId: string;
//   proveedorId: string;
// }

export interface EventoCompraItem {
  id: string;
  eventoCompraId: string;
  proveedorId: string;
  compraItemId: string;
  createdAt: Date;
  updatedAt: Date;
}

// no es un documento, es una linea del kardex
export interface KardexLinea {
  fechaMovimiento: string; // Fecha en que ocurrió el movimiento
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

export interface StockProductoAlmacen {
  productoId: string;
  almacenId: string;

  stockActual: number;
  stockReservado?: number;
  stockDisponible: number;

  costoPromedioActual: number; // Costo promedio ponderado actual

  minimo?: number;
  maximo?: number;
  puntoReorden?: number;
  ultimoMovimiento?: string;

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

  fechaSolicitud: string; // Fecha en que se creó la solicitud
  fechaRecepcion?: string;

  createdAt: Date;
  updatedAt: Date;
}
export interface TransferenciaItem {
  productoId: string;
  cantidad: number;
}

export enum EstadoRecepcionMercaderiaEnum {
  BORRADOR = "BORRADOR",
  CONFIRMADA = "CONFIRMADA",
  ANULADA = "ANULADA",
}

export interface RecepcionMercaderia {
  id: string;
  type: "recepcion_mercaderia";

  eventoCompraId?: string;
  almacenDestinoId: string;

  fechaRecepcion: string;

  vehiculo?: string;
  guiaTransportista?: string;

  estado: EstadoRecepcionMercaderiaEnum;

  items: RecepcionMercaderiaItem[];

  usuarioId: string;
  observaciones?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface RecepcionMercaderiaItem {
  productoId: string;
  cantidadRecibida: number;

  lote?: string;
  fechaVencimiento?: string;

  compraItemId?: string;
  compraId?: string;
  proveedorId?: string;
}

export interface AsignacionRecepcionCompra {
  id: string;
  recepcionMercaderiaId: string;
  compraId: string;
  compraItemId: string;
  productoId: string;
  cantidadAsignada: number;
  createdAt: Date;
}
