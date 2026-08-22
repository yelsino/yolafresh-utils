import { UnixMillis } from "../../shared/utils/dates";
import { EstadoPagoEnum } from "../../shared/kernel/enums";
import {
  TipoEmpaqueEnum,
  type UnidadBaseInterna,
} from "../../inventario/contracts/producto.contract";
import type { MetodoPago } from "../../finanzas/contracts/finanzas.contract";

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
  LIQUIDACION_COMPRA = "LIQUIDACION_COMPRA",
  OTRO = "OTRO",
  SIN_ASIGNAR = "SIN_ASIGNAR",
}

export enum TipoFlujoCompraEnum {
  GESTIONADA = "GESTIONADA",
  DIRECTA = "DIRECTA",
}

export enum EstadoDocumentarioCompraEnum {
  PENDIENTE = "PENDIENTE",
  COMPLETO = "COMPLETO",
  OBSERVADO = "OBSERVADO",
  ANULADO = "ANULADO",
}

export type IdentidadContraparteCompra = {
  tipoDocumento: "RUC" | "DNI" | "CE" | "OTRO";
  numeroDocumento: string;
  nombreORazonSocial: string;
  domicilio?: string;
  lugarOperacion?: string;
};



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
  contraparteSnapshot?: IdentidadContraparteCompra;

  tipoFlujoCompra?: TipoFlujoCompraEnum;
  operationId?: string;

  tipoDocumento: TipoDocumentoCompraEnum;
  estadoDocumentario?: EstadoDocumentarioCompraEnum;

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

export interface CompraItemBase {
  id: string;
  compraId: string;

  nombreItem: string;

  cantidad: number;

  costoUnitario: number;
  costoTotal: number;

  impuestoUnitario?: number;
  impuestoTotal?: number;
  productoEmpaque?:TipoEmpaqueEnum;

  lote?: string;
  fechaVencimiento?: string;
}

export interface CompraItemInventariable extends CompraItemBase {
  afectaInventario: true;
  presentacionId: string;
  productoBaseId: string;
  factorUnidadBase: number;
  unidadBaseInventario: UnidadBaseInterna;
  /** Entero seguro positivo de la conversión congelada al capturar el item. */
  versionConversion: number;
}

export interface CompraItemNoInventariable extends CompraItemBase {
  afectaInventario: false;
  presentacionId?: string;
  productoBaseId?: string;
  factorUnidadBase?: number;
  unidadBaseInventario?: UnidadBaseInterna;
  versionConversion?: number;
}

/**
 * Una línea que afecta stock congela obligatoriamente la identidad y conversión
 * física completas: presentación, producto base, factor, unidad base y versión.
 * Servicios/gastos (`afectaInventario=false`) pueden omitir esos campos sin
 * inventar una identidad física.
 */
export type CompraItem = CompraItemInventariable | CompraItemNoInventariable;

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
  tipoFlujoCompra?: TipoFlujoCompraEnum;
  operationId?: string;
  
  estado: EstadoEventoCompraEnum;
  correlativoInterno?: string;

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export type SituacionPagoCompraDirecta = "PAGADO" | "PARCIAL" | "PENDIENTE";

export interface RegistrarCompraDirectaCommand {
  operationId: string;
  eventoId: string;
  compraId: string;
  recepcionId: string;
  proveedorId: string;
  responsableId: string;
  responsableNombreSnapshot?: string;
  almacenDestinoId: string;
  origen: string;
  fechaOperacion: UnixMillis;
  moneda: "PEN" | "USD";
  items: CompraItem[];
  situacionPago: SituacionPagoCompraDirecta;
  montoPagado: number;
  metodoPago?: MetodoPago;
  cajaId?: string;
  turnoCajaId?: string;
  cuentaFinancieraId?: string;
  fechaVencimientoPago?: UnixMillis;
  tipoDocumento: TipoDocumentoCompraEnum;
  estadoDocumentario: EstadoDocumentarioCompraEnum;
  serieDocumento?: string;
  numeroDocumento?: string;
  contraparteSnapshot?: IdentidadContraparteCompra;
  evidenciaIds?: string[];
  observaciones?: string;
}

export interface RegistrarCompraDirectaResult {
  operationId: string;
  eventoId: string;
  compraId: string;
  recepcionId: string;
  movimientoInventarioId?: string;
  egresoId?: string;
  movimientoCajaId?: string;
  cuentaProveedorId?: string;
  financialCommandId: string;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
}

// SIRVE PARA RELACIONAR UN ITEM DE COMPRA CON UN EVENTO DE COMPRA
export interface EventoCompraItem {
  id: string;
  eventoCompraId: string;
  proveedorId: string;
  // compraItemId: string;
  productoCompra: Partial<CompraItem>;
}


