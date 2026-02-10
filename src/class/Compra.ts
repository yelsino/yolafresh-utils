import { 
  ICompra, 
  EstadoCompraEnum, 
  TipoDocumentoCompraEnum, 
  EstadoPagoEnum, 
  CompraItem, 
  CompraEgresoRef
} from "@/interfaces";

/**
 * Clase Compra - Entidad de Dominio
 * 
 * Representa una compra finalizada e inmutable.
 * A diferencia de PurchaseOrder (que es un borrador/carrito),
 * esta clase representa el documento persistido en la base de datos.
 */


export class Compra implements ICompra {
  public readonly id: string;
  public readonly type: "compra" = "compra";

  public readonly proveedorId: string;
  
  public readonly tipoDocumento: TipoDocumentoCompraEnum;
  public readonly serieDocumento?: string;
  public readonly numeroDocumento?: string;
  public readonly numeroDocumentoInterno?: string;

  public readonly almacenDestinoId: string;

  public readonly fechaDocumento: string;
  public readonly fechaRegistro: string;

  public readonly items: CompraItem[];
  
  public readonly subtotal: number;
  public readonly impuestos?: number;
  public readonly descuentos?: number;
  public readonly gastosAdicionales?: CompraEgresoRef[];

  public readonly moneda: "PEN" | "USD";
  public readonly tipoCambio?: number;

  public readonly total: number;
  
  public readonly condicionPago?: "CONTADO" | "CREDITO";
  public readonly estadoPago: EstadoPagoEnum;
  public readonly fechaVencimientoPago?: string;

  public readonly estado: EstadoCompraEnum;

  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: ICompra) {
    // Validaciones de integridad
    if (!data.id) throw new Error("El ID de la compra es requerido");
    if (!data.proveedorId) throw new Error("El proveedor es requerido");
    if (!data.items || data.items.length === 0) throw new Error("La compra debe tener items");
    
    // Asignación de propiedades
    this.id = data.id;
    
    this.proveedorId = data.proveedorId;
    
    this.tipoDocumento = data.tipoDocumento;
    this.serieDocumento = data.serieDocumento;
    this.numeroDocumento = data.numeroDocumento;
    
    this.almacenDestinoId = data.almacenDestinoId;
    
    this.fechaDocumento = data.fechaDocumento;
    this.fechaRegistro = data.fechaRegistro;
    
    // Copia defensiva de items para garantizar inmutabilidad
    this.items = data.items.map(item => ({...item}));
    
    this.subtotal = data.subtotal;
    this.impuestos = data.impuestos;
    this.descuentos = data.descuentos;
    this.gastosAdicionales = data.gastosAdicionales;
    
    this.moneda = data.moneda;
    this.tipoCambio = data.tipoCambio;
    
    this.total = data.total;
    
    this.condicionPago = data.condicionPago;
    this.estadoPago = data.estadoPago;
    this.fechaVencimientoPago = data.fechaVencimientoPago;
    
    this.estado = data.estado;
    
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Verifica si la compra está pagada totalmente
   */
  public get estaPagada(): boolean {
    return this.estadoPago === EstadoPagoEnum.PAGADO;
  }

  /**
   * Verifica si la compra está pendiente de pago
   */
  public get estaPendientePago(): boolean {
    return this.estadoPago === EstadoPagoEnum.PENDIENTE || this.estadoPago === EstadoPagoEnum.PAGADO_PARCIAL;
  }

  /**
   * Verifica si la compra ha sido anulada
   */
  public get estaAnulada(): boolean {
    return this.estado === EstadoCompraEnum.ANULADO;
  }

  /**
   * Verifica si la compra ha sido confirmada/procesada
   */
  public get estaConfirmada(): boolean {
    return this.estado === EstadoCompraEnum.CONFIRMADO;
  }

  /**
   * Retorna una representación plana del objeto (para JSON/DB)
   */
  public toJSON(): ICompra {
    return {
      id: this.id,
      proveedorId: this.proveedorId,
      tipoDocumento: this.tipoDocumento,
      serieDocumento: this.serieDocumento,
      numeroDocumento: this.numeroDocumento,
      almacenDestinoId: this.almacenDestinoId,
      fechaDocumento: this.fechaDocumento,
      fechaRegistro: this.fechaRegistro,
      items: this.items,
      subtotal: this.subtotal,
      impuestos: this.impuestos,
      descuentos: this.descuentos,
      gastosAdicionales: this.gastosAdicionales,
      moneda: this.moneda,
      tipoCambio: this.tipoCambio,
      total: this.total,
      condicionPago: this.condicionPago,
      estadoPago: this.estadoPago,
      fechaVencimientoPago: this.fechaVencimientoPago,
      estado: this.estado,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Crea una instancia de Compra desde un objeto plano
   */
  public static fromJSON(data: any): Compra {
    // Asegurar que las fechas sean objetos Date si vienen como string
    const compraData: ICompra = {
      ...data,
      createdAt: typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt,
      updatedAt: typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt
    };
    return new Compra(compraData);
  }
}
