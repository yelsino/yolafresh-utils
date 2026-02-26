import { UnixMillis } from "@/utils";


export enum TipoDocumentoComercialEnum {
  FACTURA_VENTA = "FACTURA_VENTA",
  BOLETA_VENTA = "BOLETA_VENTA",
  NOTA_CREDITO_VENTA = "NOTA_CREDITO_VENTA",

  FACTURA_COMPRA = "FACTURA_COMPRA",
  BOLETA_COMPRA = "BOLETA_COMPRA",
  NOTA_CREDITO_COMPRA = "NOTA_CREDITO_COMPRA",

  GUIA_REMISION = "GUIA_REMISION",
}

export enum EstadoDocumentoComercialEnum {
  BORRADOR = "BORRADOR",           // Editable, aún no confirmado
  EMITIDO = "EMITIDO",             // Confirmado internamente
  ENVIADO = "ENVIADO",             // Enviado a SUNAT (si aplica)
  ACEPTADO = "ACEPTADO",           // Aceptado por SUNAT
  RECHAZADO = "RECHAZADO",         // Rechazado por SUNAT
  ANULADO = "ANULADO",             // Anulado correctamente
  OBSERVADO = "OBSERVADO"          // Con inconsistencias
}


export interface DocumentoComercial {
  id: string;

  tipo: TipoDocumentoComercialEnum;

  serie: string;
  numero: string;

  fechaEmision: UnixMillis;

  moneda: "PEN" | "USD";
  total: number;

  estado: EstadoDocumentoComercialEnum;

  documentoRelacionadoId?: string;

  creadoDesdeModulo: "VENTA" | "COMPRA" | "TRANSFERENCIA";

  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}