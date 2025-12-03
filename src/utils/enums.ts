
export enum OrderState {
  PENDIENTE = 'PENDIENTE',
  ATENDIENDO = 'ATENDIENDO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
  DESPACHADO = 'DESPACHADO',
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