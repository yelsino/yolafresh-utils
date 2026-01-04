export enum TipoEvidenciaEnum {
  FACTURA = "FACTURA",
  BOLETA = "BOLETA",
  NOTA_CREDITO = "NOTA_CREDITO",
  GUIA_REMISION = "GUIA_REMISION",

  VOUCHER_PAGO = "VOUCHER_PAGO",
  RECIBO = "RECIBO",

  FOTO_MERCADERIA = "FOTO_MERCADERIA",
  ACTA_RECEPCION = "ACTA_RECEPCION",
  ACTA_MERMA = "ACTA_MERMA",

  OTRO = "OTRO",
}

export enum FormatoArchivoEnum {
  PDF = "PDF",
  XML = "XML",
  JPG = "JPG",
  PNG = "PNG",
  WEBP = "WEBP",
}

export interface Evidencia {
  _id: string;
  type: "evidencia";

  tipo: TipoEvidenciaEnum;
  formato: FormatoArchivoEnum;

  nombreArchivo: string;
  url: string; // local, s3, cloudinary, etc

  // 🔗 Relación flexible
  entidadReferencia: 
    | "COMPRA"
    | "PAGO"
    | "MOVIMIENTO_INVENTARIO"
    | "TRANSFERENCIA"
    | "EVENTO_COMPRA";

  referenciaId: string;

  metadata?: {
    serie?: string;
    numero?: string;
    monto?: number;
    moneda?: string;
    banco?: string;
  };

  subidoPorUsuarioId: string;
  fechaDocumento?: string; // fecha del comprobante
  fechaSubida: string;

  esValido?: boolean;
  observaciones?: string;

  createdAt: Date;
  updatedAt: Date;
}
