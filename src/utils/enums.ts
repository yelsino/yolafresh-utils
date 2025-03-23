
export enum OrderState {
  PENDIENTE = 'PENDIENTE',
  ATENDIENDO = 'ATENDIENDO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
  DESPACHADO = 'DESPACHADO',
}

export enum TipoVentaEnum {
  Kilogramo = 'kilogramo',
  Unidad = 'unidad',
  Saco = 'saco',
  Docena = 'docena',
  Arroba = 'arroba',
  Caja = 'caja',
  Balde = 'balde',
  Bolsa = 'bolsa',
  Paquete = 'paquete',
  Gramo = 'gramo',
  Mililitro = 'mililitro',
  Litro = 'litro',
  SixPack = 'sixpack',
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

