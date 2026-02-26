import { UnixMillis } from "@/domain/shared/utils/dates";
import { EstadoPagoEnum } from "@/domain/shared/utils/enums";
export { EstadoPagoEnum };

export enum EstadoCompraEnum {
  BORRADOR = "BORRADOR",
  CONFIRMADO = "CONFIRMADO",
  CERRADO = "CERRADO",
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



export enum EstadoEventoCompraEnum {
  EN_REGISTRO = "EN_REGISTRO",
  CONFIRMADO = "CONFIRMADO",
  CERRADO = "CERRADO",
  CANCELADO = "CANCELADO",
}

export interface ICompra {
  id: string;

  eventoCompraId: string;

  proveedorId: string;
  proveedorNombreSnapshot?: string;
  proveedorRucSnapshot?: string;

  tipoDocumento: TipoDocumentoCompraEnum;

  serieDocumento?: string;
  numeroDocumento?: string;

  correlativoInterno?: string;

  fechaDocumento: UnixMillis;
  fechaRegistro: UnixMillis;

  moneda: "PEN" | "USD";
  tipoCambio?: number;

  subtotal: number;
  impuestos?: number;
  descuentos?: number;
  total: number;

  gastosAdicionales?: CompraEgresoRef[];

  condicionPago?: "CONTADO" | "CREDITO";
  estadoPago: EstadoPagoEnum;
  fechaVencimientoPago?: UnixMillis;

  estado: EstadoCompraEnum;

  items: CompraItem[];

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export interface CompraItem {
  id: string;

  compraId: string;

  presentacionId: string;

  cantidad: number;

  costoUnitario: number;
  costoTotal: number;

  afectaInventario: boolean; 
}

export interface CompraEgresoRef {
  egresoId: string;
  montoAplicado: number;
}

export interface EventoCompra {
  id: string;

  responsableId: string;
  responsableNombreSnapshot?: string;

  origen: string;
  destino?: string;

  montoAsignado?: number;

  estado: EstadoEventoCompraEnum;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export interface EventoCompraItem {
  id: string;

  eventoCompraId: string;
  compraId: string;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}
