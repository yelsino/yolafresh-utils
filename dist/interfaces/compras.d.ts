import { TipoEmpaqueEnum, UnidadMedidaEnum } from "../interfaces";
export declare enum TipoAlmacenEnum {
    CENTRAL = "CENTRAL",
    TIENDA = "TIENDA",
    TRANSITO = "TRANSITO",
    MOSTRADOR = "MOSTRADOR"
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
    unidadCapacidad?: string;
    responsableId?: string;
    activo: boolean;
    permitirLotes: boolean;
    permitirNegativos: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum TipoMovimientoInventarioEnum {
    ENTRADA = "ENTRADA",
    SALIDA = "SALIDA",
    AJUSTE = "AJUSTE",
    TRANSFERENCIA = "TRANSFERENCIA"
}
export declare enum EstadoMovimientoEnum {
    PENDIENTE = "PENDIENTE",
    APLICADO = "APLICADO",
    ANULADO = "ANULADO"
}
export declare enum OrigenDocumentoEnum {
    COMPRA = "COMPRA",
    VENTA = "VENTA",
    AJUSTE = "AJUSTE",
    TRANSFERENCIA = "TRANSFERENCIA",
    PRODUCCION = "PRODUCCION",
    MERMA = "MERMA",
    DEVOLUCION = "DEVOLUCION",
    INVENTARIO_FISICO = "INVENTARIO_FISICO"
}
export interface MovimientoInventario {
    _id: string;
    type: "movimiento_inventario";
    numeroMovimiento?: string;
    tipo: TipoMovimientoInventarioEnum;
    estado: EstadoMovimientoEnum;
    origenDocumento: OrigenDocumentoEnum;
    documentoReferenciaId?: string;
    serieDocumentoReferencia?: string;
    motivo?: string;
    almacenOrigenId?: string;
    almacenDestinoId?: string;
    items: MovimientoInventarioItem[];
    esAutomatico?: boolean;
    notas?: string;
    usuarioId: string;
    usuarioNombre?: string;
    fechaMovimiento: string;
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
    ubicacionInterna?: string;
}
export declare enum EstadoCompraEnum {
    BORRADOR = "BORRADOR",
    CONFIRMADO = "CONFIRMADO",
    ANULADO = "ANULADO",
    CONTABILIZADO = "CONTABILIZADO"
}
export declare enum TipoDocumentoCompraEnum {
    FACTURA = "FACTURA",
    BOLETA = "BOLETA",
    NOTA_CREDITO = "NOTA_CREDITO",
    GUIA_REMISION = "GUIA_REMISION",
    OTRO = "OTRO",
    SIN_ASIGNAR = "SIN_ASIGNAR"
}
export declare enum EstadoPagoEnum {
    PENDIENTE = "PENDIENTE",
    PAGADO_PARCIAL = "PAGADO_PARCIAL",
    PAGADO = "PAGADO"
}
export interface CompraEgresoRef {
    egresoId: string;
    montoAplicado: number;
}
export interface ICompra {
    id: string;
    eventoCompraId?: string;
    proveedorId: string;
    proveedorNombre?: string;
    proveedorRuc?: string;
    tipoDocumento: TipoDocumentoCompraEnum;
    serieDocumento?: string;
    numeroDocumento?: string;
    correlativo?: string;
    almacenDestinoId: string;
    fechaDocumento: string;
    fechaRegistro: string;
    items: CompraItem[];
    subtotal: number;
    impuestos?: number;
    descuentos?: number;
    gastosAdicionales?: CompraEgresoRef[];
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
    factorConversion?: number;
    costoUnitario: number;
    costoTotal?: number;
    impuestoUnitario?: number;
    impuestoTotal?: number;
    afectaInventario?: boolean;
    lote?: string;
    fechaVencimiento?: string;
}
export declare enum EstadoEventoCompraEnum {
    EN_REGISTRO = "EN_REGISTRO",// Pedido editable //rojo
    COMPRAS_GENERADAS = "COMPRAS_GENERADAS",// Compras BORRADOR creadas // verde
    FINALIZADO = "FINALIZADO",// Pedido bloqueado (solo lectura) // blanco
    CANCELADO = "CANCELADO"
}
export interface EventoCompra {
    id: string;
    responsableId: string;
    responsableNombre?: string;
    origen: string;
    destino?: string;
    montoAsignado?: number;
    comprasGeneradas?: string[];
    estado: EstadoEventoCompraEnum;
    createdAt: Date;
    updatedAt: Date;
}
export interface EventoCompraItem {
    id: string;
    eventoCompraId: string;
    proveedorId: string;
    compraItemId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface KardexLinea {
    fechaMovimiento: string;
    documento: string;
    tipo: "ENTRADA" | "SALIDA";
    cantidadEntrada: number;
    cantidadSalida: number;
    costoUnitario: number;
    costoTotal: number;
    stockFinal: number;
    costoPromedioFinal: number;
    saldoCostoTotal: number;
}
export interface StockProductoAlmacen {
    productoId: string;
    almacenId: string;
    stockActual: number;
    stockReservado?: number;
    stockDisponible: number;
    costoPromedioActual: number;
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
export declare enum EstadoTransferenciaEnum {
    PENDIENTE = "PENDIENTE",
    EN_TRANSITO = "EN_TRANSITO",
    RECIBIDO = "RECIBIDO",
    ANULADO = "ANULADO"
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
    fechaSolicitud: string;
    fechaRecepcion?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TransferenciaItem {
    productoId: string;
    cantidad: number;
}
