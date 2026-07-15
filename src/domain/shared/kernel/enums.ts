
export enum PedidoState {
  ABIERTO = 'ABIERTO',
  PARCIALMENTE_ATENDIDO = 'PARCIALMENTE_ATENDIDO',
  ATENDIDO = 'ATENDIDO',
  CONVERTIDO = 'CONVERTIDO',
  CANCELADO = 'CANCELADO',
  VENCIDO = 'VENCIDO',
}

export enum PedidoEntregaState {
  PENDIENTE = 'PENDIENTE',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTO_PARA_RECOJO = 'LISTO_PARA_RECOJO',
  DESPACHADO = 'DESPACHADO',
  EN_RUTA = 'EN_RUTA',
  ENTREGADO = 'ENTREGADO',
  NO_ENTREGADO = 'NO_ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export enum PedidoPrioridadEnum {
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

export enum PedidoProcedenciaEnum {
  TIENDA = 'TIENDA',
  WEB = 'WEB',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  OTRO = 'OTRO',
}

export enum PedidoEntregaModalidadEnum {
  RECOJO = 'RECOJO',
  DESPACHO = 'DESPACHO',
}

export enum VentaState {
  CONFIRMADA = 'CONFIRMADA',
  ANULADA = 'ANULADA',
}

export enum CondicionPagoVenta {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO',
}

export enum EstadoStockEnum {
  STOCK_AGOTADO = 'STOCK_AGOTADO',
  STOCK_BAJO = 'STOCK_BAJO',
  STOCK_MEDIO = 'STOCK_MEDIO',
  STOCK_ALTO = 'STOCK_ALTO',
}

export enum TipoActualizacionEnum {
  COMPRA_VENTA = 'COMPRA_VENTA',
  DESCUENTO = 'DESCUENTO',
  STOCK = 'STOCK',
}

export enum MetodoPagoEnum {
  DIGITAL = 'DIGITAL',
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  OTRO = 'OTRO',
}

export enum MedioPagoDigitalEnum {
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  TUNKI = 'TUNKI',
  OTRO = 'OTRO',
}

export enum MedioPagoEfectivoEnum {
  EFECTIVO = 'EFECTIVO',
}

export enum MonedaEnum {
  PEN = 'PEN',
  USD = 'USD',
}

export enum EstadoPagoEnum {
  PENDIENTE = 'PENDIENTE',
  PAGADO_PARCIAL = 'PAGADO_PARCIAL',
  PAGADO = 'PAGADO',
  ANULADO = 'ANULADO',
}
