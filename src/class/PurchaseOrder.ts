import { 
  Compra, 
  CompraItem, 
  EstadoCompraEnum,
  EstadoPagoEnum,
  TipoDocumentoCompraEnum
} from "./Compra";

/**
 * Clase PurchaseOrder (Gestor de creación de Compra)
 * 
 * Actúa como un "carrito" para compras:
 * - Permite agregar/quitar/modificar items
 * - Calcula totales dinámicamente
 * - Genera el objeto final Compra
 */
export class PurchaseOrder {
  private _id: string;
  private _proveedorId: string = "";
  private _proveedorNombre?: string;
  private _proveedorRuc?: string;
  
  private _tipoDocumento: TipoDocumentoCompraEnum = TipoDocumentoCompraEnum.FACTURA;
  private _serieDocumento?: string;
  private _numeroDocumento?: string;
  private _numeroDocumentoInterno?: string;
  
  private _almacenDestinoId: string = "";
  
  private _fechaDocumento: string;
  private _fechaRegistro: string;
  
  private _items: CompraItem[] = [];
  
  private _impuestos: number = 0;
  private _descuentos: number = 0;
  private _gastosAdicionales: number = 0;
  
  private _moneda: "PEN" | "USD" = "PEN";
  private _tipoCambio?: number;
  
  private _condicionPago?: "CONTADO" | "CREDITO";
  private _estadoPago: EstadoPagoEnum = EstadoPagoEnum.PENDIENTE;
  private _fechaVencimientoPago?: string;
  
  private _estado: EstadoCompraEnum = EstadoCompraEnum.BORRADOR;
  
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(initialData?: Partial<Compra>) {
    this._id = initialData?._id || this.generarIdTemporal();
    this._fechaDocumento = initialData?.fechaDocumento || new Date().toISOString();
    this._fechaRegistro = initialData?.fechaRegistro || new Date().toISOString();
    this._createdAt = initialData?.createdAt || new Date();
    this._updatedAt = initialData?.updatedAt || new Date();
    
    if (initialData) {
      this._proveedorId = initialData.proveedorId || "";
      this._proveedorNombre = initialData.proveedorNombre;
      this._proveedorRuc = initialData.proveedorRuc;
      
      this._tipoDocumento = initialData.tipoDocumento || TipoDocumentoCompraEnum.FACTURA;
      this._serieDocumento = initialData.serieDocumento;
      this._numeroDocumento = initialData.numeroDocumento;
      this._numeroDocumentoInterno = initialData.numeroDocumentoInterno;
      
      this._almacenDestinoId = initialData.almacenDestinoId || "";
      
      this._items = initialData.items ? initialData.items.map(i => ({...i})) : [];
      this._impuestos = initialData.impuestos || 0;
      this._descuentos = initialData.descuentos || 0;
      this._gastosAdicionales = initialData.gastosAdicionales || 0;
      
      this._moneda = initialData.moneda || "PEN";
      this._tipoCambio = initialData.tipoCambio;
      
      this._condicionPago = initialData.condicionPago;
      this._estadoPago = initialData.estadoPago || EstadoPagoEnum.PENDIENTE;
      this._fechaVencimientoPago = initialData.fechaVencimientoPago;
      
      this._estado = initialData.estado || EstadoCompraEnum.BORRADOR;
    }
  }

  private generarIdTemporal(): string {
    return `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // === GESTIÓN DE ITEMS ===

  /**
   * Agrega un item a la orden
   * Si el producto ya existe (mismo ID, lote y vencimiento), suma la cantidad
   */
  public agregarItem(item: CompraItem): void {
    const index = this._items.findIndex(i => 
      i.productoId === item.productoId && 
      i.lote === item.lote && 
      i.fechaVencimiento === item.fechaVencimiento
    );

    if (index >= 0) {
      const existing = this._items[index];
      
      // Validación de consistencia de costo
      if (Math.abs(existing.costoUnitario - item.costoUnitario) > 0.01) {
        // Opción A: Actualizar al nuevo costo (estrategia actual)
        // Opción B: Lanzar error
        // Opción C: Promediar (complejo en esta etapa)
        // Decisión: Actualizar al último costo ingresado para todo el lote
        existing.costoUnitario = item.costoUnitario;
      }
      
      existing.cantidad += item.cantidad;
      
      // Actualizar otros campos si vienen
      if (item.unidadMedida) existing.unidadMedida = item.unidadMedida;
      if (item.factorConversion) existing.factorConversion = item.factorConversion;
      if (item.afectaInventario !== undefined) existing.afectaInventario = item.afectaInventario;
      
      this.recalcularItem(index);
    } else {
      const newItem = { ...item };
      
      // Defaults
      if (newItem.afectaInventario === undefined) newItem.afectaInventario = true;
      if (newItem.factorConversion === undefined) newItem.factorConversion = 1;
      
      // Cálculos iniciales
      this.calcularTotalesItem(newItem);
      
      this._items.push(newItem);
    }
    this._updatedAt = new Date();
    this.recalcularGlobales(); // Si hubiera lógica global automática
  }

  /**
   * Elimina un item por índice
   */
  public removerItem(index: number): void {
    if (index >= 0 && index < this._items.length) {
      this._items.splice(index, 1);
      this._updatedAt = new Date();
      this.recalcularGlobales();
    }
  }

  /**
   * Actualiza un item existente
   */
  public actualizarItem(index: number, updates: Partial<CompraItem>): void {
    if (index >= 0 && index < this._items.length) {
      this._items[index] = { ...this._items[index], ...updates };
      this.recalcularItem(index);
      this._updatedAt = new Date();
      this.recalcularGlobales();
    }
  }

  private recalcularItem(index: number): void {
    const item = this._items[index];
    this.calcularTotalesItem(item);
  }

  private calcularTotalesItem(item: CompraItem): void {
    // Validar redondeos
    item.costoUnitario = this.redondear(item.costoUnitario);
    
    // Costo Total
    item.costoTotal = this.redondear(item.cantidad * item.costoUnitario);
    
    // Cálculo de impuestos por ítem (si se aplicara lógica por ítem)
    // Por ahora asumimos que impuestoUnitario viene dado o es 0
    if (item.impuestoUnitario) {
      item.impuestoTotal = this.redondear(item.cantidad * item.impuestoUnitario);
    }
  }
  
  private recalcularGlobales(): void {
    // Aquí podríamos recalcular impuestos totales automáticamente si tuviéramos la tasa
    // Por ahora se mantiene manual o seteado desde fuera
  }
  
  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  // === GETTERS Y SETTERS ===

  get items(): CompraItem[] {
    return [...this._items];
  }

  get cantidadItems(): number {
    return this._items.length;
  }

  get subtotal(): number {
    return this._items.reduce((sum, item) => sum + (item.costoTotal || 0), 0);
  }

  get total(): number {
    return this.redondear(this.subtotal + this._impuestos + this._gastosAdicionales - this._descuentos);
  }

  // Setters para cabecera
  set proveedorId(id: string) { this._proveedorId = id; }
  get proveedorId(): string { return this._proveedorId; }

  set proveedorNombre(nombre: string | undefined) { this._proveedorNombre = nombre; }
  get proveedorNombre(): string | undefined { return this._proveedorNombre; }
  
  set proveedorRuc(ruc: string | undefined) { this._proveedorRuc = ruc; }
  get proveedorRuc(): string | undefined { return this._proveedorRuc; }

  set almacenDestinoId(id: string) { this._almacenDestinoId = id; }
  get almacenDestinoId(): string { return this._almacenDestinoId; }
  
  set tipoDocumento(tipo: TipoDocumentoCompraEnum) { this._tipoDocumento = tipo; }
  get tipoDocumento(): TipoDocumentoCompraEnum { return this._tipoDocumento; }

  set serieDocumento(serie: string | undefined) { this._serieDocumento = serie; }
  get serieDocumento(): string | undefined { return this._serieDocumento; }

  set numeroDocumento(doc: string | undefined) { this._numeroDocumento = doc; }
  get numeroDocumento(): string | undefined { return this._numeroDocumento; }
  
  set numeroDocumentoInterno(doc: string | undefined) { this._numeroDocumentoInterno = doc; }
  get numeroDocumentoInterno(): string | undefined { return this._numeroDocumentoInterno; }

  set fechaDocumento(fecha: string) { this._fechaDocumento = fecha; }
  get fechaDocumento(): string { return this._fechaDocumento; }
  
  set fechaRegistro(fecha: string) { this._fechaRegistro = fecha; }
  get fechaRegistro(): string { return this._fechaRegistro; }

  set impuestos(val: number) { this._impuestos = this.redondear(val); }
  get impuestos(): number { return this._impuestos; }

  set descuentos(val: number) { this._descuentos = this.redondear(val); }
  get descuentos(): number { return this._descuentos; }

  set gastosAdicionales(val: number) { this._gastosAdicionales = this.redondear(val); }
  get gastosAdicionales(): number { return this._gastosAdicionales; }

  set moneda(val: "PEN" | "USD") { this._moneda = val; }
  get moneda(): "PEN" | "USD" { return this._moneda; }

  set condicionPago(val: "CONTADO" | "CREDITO" | undefined) { this._condicionPago = val; }
  get condicionPago(): "CONTADO" | "CREDITO" | undefined { return this._condicionPago; }
  
  set estadoPago(val: EstadoPagoEnum) { this._estadoPago = val; }
  get estadoPago(): EstadoPagoEnum { return this._estadoPago; }

  set fechaVencimientoPago(val: string | undefined) { this._fechaVencimientoPago = val; }
  get fechaVencimientoPago(): string | undefined { return this._fechaVencimientoPago; }
  
  set estado(val: EstadoCompraEnum) { this._estado = val; }
  get estado(): EstadoCompraEnum { return this._estado; }

  // === GENERACIÓN FINAL ===

  /**
   * Genera el objeto Compra final para ser guardado
   * Valida que los datos mínimos estén presentes
   */
  public generarCompra(): Compra {
    if (!this._proveedorId) throw new Error("Debe seleccionar un proveedor");
    if (!this._almacenDestinoId) throw new Error("Debe seleccionar un almacén de destino");
    if (this._items.length === 0) throw new Error("La orden debe tener al menos un item");
    
    // Validación de totales
    if (this.total < 0) throw new Error("El total de la compra no puede ser negativo");

    return {
      _id: this._id.startsWith('tmp_') ? this._id : this._id,
      type: "compra",
      
      proveedorId: this._proveedorId,
      proveedorNombre: this._proveedorNombre,
      proveedorRuc: this._proveedorRuc,
      
      tipoDocumento: this._tipoDocumento,
      serieDocumento: this._serieDocumento,
      numeroDocumento: this._numeroDocumento,
      numeroDocumentoInterno: this._numeroDocumentoInterno,
      
      almacenDestinoId: this._almacenDestinoId,
      
      fechaDocumento: this._fechaDocumento,
      fechaRegistro: this._fechaRegistro,
      
      items: this._items,
      
      subtotal: this.subtotal,
      impuestos: this._impuestos,
      descuentos: this._descuentos,
      gastosAdicionales: this._gastosAdicionales,
      
      moneda: this._moneda,
      tipoCambio: this._tipoCambio,
      
      total: this.total,
      
      condicionPago: this._condicionPago,
      estadoPago: this._estadoPago,
      fechaVencimientoPago: this._fechaVencimientoPago,
      
      estado: this._estado,
      
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Carga una compra existente para edición (si es borrador)
   */
  public static desdeCompra(compra: Compra): PurchaseOrder {
    return new PurchaseOrder(compra);
  }
}
