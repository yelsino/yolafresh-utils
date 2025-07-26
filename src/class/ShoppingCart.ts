/**
 * Entidad ShoppingCart - Encapsula toda la lógica de una venta en curso
 * Reutilizable para cualquier sistema POS
 * Simplificada: usa solo CarItem con congelación automática al guardar
 */

import { Producto } from "@/interfaces";
import { TipoVentaEnum } from "@/utils";
import { ConfiguracionFiscal, CONFIGURACIONES_FISCALES } from "@/utils/fiscales";

export interface CarItem {
  id: string; // ID único para cada ítem del carrito
  product: Producto;
  quantity: number;
  precioUnitario?: number; // Precio unitario configurado
  montoModificado?: boolean; // Si el monto fue modificado manualmente
  montoTotal?: number | null; // Monto total a pagar
  tipoVenta?: TipoVentaEnum; // Tipo de venta (kg, unidad, etc.)
  peso?: number; // Peso para productos pesables
  descuento?: number; // Descuento aplicado al ítem
}

/**
 * Configuración para agregar productos
 */
export interface OpcionesAgregarProducto {
  replaceCompletely?: boolean;
  itemId?: string;
  fromSelection?: boolean;
}

/**
 * Resumen de la venta
 */
export interface ResumenVenta {
  cantidadItems: number;
  cantidadTotal: number;
  subtotal: number;
  descuentoTotal: number;
  impuesto: number;
  total: number;
}

export enum ProcedenciaVenta {
  Tienda = 'Tienda',
  Web = 'Web',
  WhatsApp = 'WhatsApp',
  Instagram = 'Instagram',
  Facebook = 'Facebook'
}

/**
 * Tipos de pago disponibles
 */
export type TipoPagoVenta = 'Efectivo' | 'Digital' | 'Tarjeta';

/**
 * Datos para el procesamiento de pago
 */
export interface DatosPago {
  metodoPago: TipoPagoVenta;
  dineroRecibido?: number;
  procedencia: ProcedenciaVenta;
  clienteColor?: string;
  clienteId?: string;
  vendedorId?: string;
  notas?: string;
}

/**
 * Clase ShoppingCart - Maneja toda la lógica de una venta en curso
 * Simplificada: trabaja solo con CarItem, congela al guardar
 */
export class ShoppingCart {
  public readonly id: string;
  public readonly fechaCreacion: Date;
  private _items: CarItem[] = [];
  private _notas?: string;
  private _configuracionFiscal: ConfiguracionFiscal;

  constructor(id?: string, configuracionFiscal?: ConfiguracionFiscal) {
    this.id = id || `venta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.fechaCreacion = new Date();
    
    // Configuración fiscal por defecto (puede ser sobrescrita)
    this._configuracionFiscal = {
      tasaImpuesto: configuracionFiscal?.tasaImpuesto ?? 0, // Por defecto SIN impuesto
      aplicaImpuesto: configuracionFiscal?.aplicaImpuesto ?? false, // Por defecto NO aplica
      nombreImpuesto: configuracionFiscal?.nombreImpuesto ?? 'Impuesto',
      ...configuracionFiscal
    };
  }

  // **MÉTODOS DE CONFIGURACIÓN FISCAL**

  /**
   * Configurar impuesto (IGV, IVA, etc.)
   */
  configurarImpuesto(configuracion: ConfiguracionFiscal): void {
    this._configuracionFiscal = {
      ...this._configuracionFiscal,
      ...configuracion
    };
  }

  /**
   * Habilitar impuesto con tasa específica
   */
  habilitarImpuesto(tasa: number, nombre: string = 'IGV'): void {
    this._configuracionFiscal = {
      ...this._configuracionFiscal,
      tasaImpuesto: Math.max(0, Math.min(1, tasa)), // Entre 0 y 1
      aplicaImpuesto: true,
      nombreImpuesto: nombre
    };
  }

  /**
   * Deshabilitar impuesto
   */
  deshabilitarImpuesto(): void {
    this._configuracionFiscal = {
      ...this._configuracionFiscal,
      tasaImpuesto: 0,
      aplicaImpuesto: false
    };
  }

  // **MÉTODOS PRINCIPALES DE GESTIÓN**

  /**
   * Agregar o actualizar un CarItem en la venta
   */
  agregarProducto(carItem: CarItem, opciones: OpcionesAgregarProducto = {}): void {
    const { replaceCompletely = false, itemId, fromSelection = false } = opciones;

    // Generar ID único para el nuevo ítem
    const nuevoItemId = carItem.id || `${carItem.product.id}-${Date.now()}`;

    // Buscar ítem existente si estamos en modo edición
    let itemExistente: CarItem | undefined = undefined;
    if (replaceCompletely) {
      if (itemId) {
        itemExistente = this._items.find(item => item.id === itemId);
      } else {
        itemExistente = this._items.find(item => item.product.id === carItem.product.id);
      }
    }

    // Verificar si el producto es pesable
    const esPesable = this.esProductoPesable(carItem.product.tipoVenta as TipoVentaEnum);

    // Procesar según el caso
    if (itemExistente && replaceCompletely && !fromSelection) {
      this.actualizarItemExistente(itemExistente, carItem, esPesable);
    } else {
      this.agregarNuevoItem(carItem, nuevoItemId, esPesable);
    }
  }

  /**
   * Actualizar un ítem existente
   */
  private actualizarItemExistente(itemExistente: CarItem, carItem: CarItem, esPesable: boolean): void {
    const precioUnitario = carItem.precioUnitario || carItem.product.precio;
    const peso = esPesable ? (carItem.peso || carItem.quantity) : undefined;
    const montoTotal = this.calcularMontoTotal(carItem, precioUnitario, esPesable, peso);

    const index = this._items.findIndex(item => item.id === itemExistente.id);
    if (index !== -1) {
      this._items[index] = {
        ...itemExistente,
        product: carItem.product,  // Mantener producto completo
        quantity: carItem.quantity,
        precioUnitario,
        montoModificado: carItem.montoModificado || false,
        montoTotal,
        tipoVenta: carItem.tipoVenta || (carItem.product.tipoVenta as TipoVentaEnum),
        peso,
      };
    }
  }

  /**
   * Agregar nuevo ítem
   */
  private agregarNuevoItem(carItem: CarItem, itemId: string, esPesable: boolean): void {
    const cantidad = Math.max(carItem.quantity, 1);
    const precioUnitario = carItem.precioUnitario || carItem.product.precio;
    const peso = esPesable ? (carItem.peso || cantidad) : undefined;
    const montoTotal = this.calcularMontoTotal(carItem, precioUnitario, esPesable, peso);

    const nuevoItem: CarItem = {
      id: itemId,
      product: carItem.product,  // Producto completo
      quantity: cantidad,
      precioUnitario,
      montoModificado: carItem.montoModificado || false,
      montoTotal,
      tipoVenta: carItem.tipoVenta || (carItem.product.tipoVenta as TipoVentaEnum),
      peso,
    };

    this._items.push(nuevoItem);
  }

  /**
   * Calcular monto total de un ítem
   */
  private calcularMontoTotal(
    carItem: CarItem,
    precioUnitario: number,
    esPesable: boolean,
    peso?: number
  ): number {
    // Si el monto fue modificado manualmente
    if (carItem.montoModificado && carItem.montoTotal !== null && carItem.montoTotal !== undefined) {
      return carItem.montoTotal;
    }

    // Calcular según tipo de producto
    let montoSinRedondear: number;
    if (esPesable) {
      montoSinRedondear = precioUnitario * (peso || carItem.quantity);
    } else {
      montoSinRedondear = precioUnitario * carItem.quantity;
    }

    // Redondear a dos decimales
    return Math.round(montoSinRedondear * 100) / 100;
  }

  /**
   * Verificar si un producto es pesable
   */
  private esProductoPesable(tipoVenta: TipoVentaEnum): boolean {
    const tiposPesables = [
      TipoVentaEnum.Kilogramo,
      TipoVentaEnum.Litro,
    ];
    return tiposPesables.includes(tipoVenta);
  }

  // **MÉTODOS DE MANIPULACIÓN DE ITEMS**

  /**
   * Incrementar cantidad de un producto
   */
  incrementarCantidad(productId: string): boolean {
    const index = this._items.findIndex(item => item.product.id === productId);
    if (index === -1) return false;

    const item = this._items[index];
    this._items[index] = {
      ...item,
      quantity: item.quantity + 1,
      montoTotal: this.recalcularMontoItem(item, item.quantity + 1)
    };
    return true;
  }

  /**
   * Decrementar cantidad de un producto
   */
  decrementarCantidad(productId: string): boolean {
    const index = this._items.findIndex(item => item.product.id === productId);
    if (index === -1) return false;

    const item = this._items[index];
    if (item.quantity > 1) {
      this._items[index] = {
        ...item,
        quantity: item.quantity - 1,
        montoTotal: this.recalcularMontoItem(item, item.quantity - 1)
      };
      return true;
    } else {
      // Si la cantidad es 1, eliminar el ítem
      this._items.splice(index, 1);
      return true;
    }
  }

  /**
   * Eliminar un ítem por ID
   */
  eliminarItem(itemId: string): boolean {
    const index = this._items.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    this._items.splice(index, 1);
    return true;
  }

  /**
   * Aplicar descuento a un ítem específico
   */
  aplicarDescuento(itemId: string, descuento: number): boolean {
    const index = this._items.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    // Agregar descuento como propiedad al CarItem
    const item = this._items[index];
    this._items[index] = {
      ...item,
      descuento: Math.max(0, descuento)
    };
    
    return true;
  }

  /**
   * Recalcular monto de un ítem con nueva cantidad
   */
  private recalcularMontoItem(item: CarItem, nuevaCantidad: number): number {
    if (item.montoModificado) {
      return item.montoTotal || 0; // No recalcular si fue modificado manualmente
    }

    const precioUnitario = item.precioUnitario || item.product.precio;
    const esPesable = this.esProductoPesable(item.tipoVenta || item.product.tipoVenta as TipoVentaEnum);
    let montoSinRedondear: number;

    if (esPesable) {
      const nuevoPeso = item.peso ? (item.peso / item.quantity) * nuevaCantidad : nuevaCantidad;
      montoSinRedondear = precioUnitario * nuevoPeso;
    } else {
      montoSinRedondear = precioUnitario * nuevaCantidad;
    }

    return Math.round(montoSinRedondear * 100) / 100;
  }

  /**
   * Limpiar toda la venta
   */
  limpiar(): void {
    this._items = [];
    this._notas = undefined;
  }

  // **MÉTODOS DE CÁLCULO**

  /**
   * Calcular subtotal (suma de todos los montos)
   */
  get subtotal(): number {
    return this._items.reduce((sum, item) => sum + (item.montoTotal || 0), 0);
  }

  /**
   * Calcular descuento total
   */
  get descuentoTotal(): number {
    return this._items.reduce((sum, item) => {
      const descuento = item.descuento || 0;
      return sum + descuento;
    }, 0);
  }

  /**
   * Calcular impuesto
   */
  get impuesto(): number {
    if (!this._configuracionFiscal.aplicaImpuesto) {
      return 0;
    }
    const baseImponible = this.subtotal - this.descuentoTotal;
    return Math.round(baseImponible * (this._configuracionFiscal.tasaImpuesto || 0) * 100) / 100;
  }

  /**
   * Calcular total final
   */
  get total(): number {
    return Math.round((this.subtotal - this.descuentoTotal + this.impuesto) * 100) / 100;
  }

  /**
   * Calcular cambio a devolver
   */
  calcularCambio(dineroRecibido: number): number {
    return Math.max(0, Math.round((dineroRecibido - this.total) * 100) / 100);
  }

  // **GETTERS Y SETTERS**

  get items(): readonly CarItem[] {
    return Object.freeze([...this._items]);
  }

  get cantidadItems(): number {
    return this._items.length;
  }

  get cantidadTotal(): number {
    return this._items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get estaVacia(): boolean {
    return this._items.length === 0;
  }

  get notas(): string | undefined {
    return this._notas;
  }

  set notas(value: string | undefined) {
    this._notas = value;
  }

  get tasaImpuesto(): number {
    return this._configuracionFiscal.tasaImpuesto || 0;
  }

  set tasaImpuesto(tasa: number) {
    this._configuracionFiscal.tasaImpuesto = Math.max(0, Math.min(1, tasa)); // Entre 0 y 1
  }

  /**
   * Obtener configuración fiscal actual
   */
  get configuracionFiscal(): ConfiguracionFiscal {
    return { ...this._configuracionFiscal };
  }

  /**
   * Obtener resumen completo de la venta
   */
  get resumen(): ResumenVenta {
    return {
      cantidadItems: this.cantidadItems,
      cantidadTotal: this.cantidadTotal,
      subtotal: this.subtotal,
      descuentoTotal: this.descuentoTotal,
      impuesto: this.impuesto,
      total: this.total
    };
  }

  // **MÉTODOS DE UTILIDAD**

  /**
   * Buscar ítem por ID de producto
   */
  buscarPorProducto(productId: string): CarItem | undefined {
    return this._items.find(item => item.product.id === productId);
  }

  /**
   * Buscar ítem por ID único
   */
  buscarPorId(itemId: string): CarItem | undefined {
    return this._items.find(item => item.id === itemId);
  }

  /**
   * Validar si la venta puede procesarse
   */
  puedeProcesamse(): boolean {
    return !this.estaVacia && this.total > 0;
  }

  // **MÉTODOS DE PERSISTENCIA**

  /**
   * Serializar para persistencia en base de datos
   * CONGELA los CarItems tal como están (datos inmutables)
   */
  toJSON() {
    return {
      id: this.id,
      fechaCreacion: this.fechaCreacion.toISOString(),
      // Congelar los CarItems tal como están
      items: this._items.map(item => ({
        ...item,
        // Congelar el producto completo tal como estaba
        product: { ...item.product }
      })),
      notas: this._notas,
      tasaImpuesto: this._configuracionFiscal.tasaImpuesto,
      aplicaImpuesto: this._configuracionFiscal.aplicaImpuesto,
      nombreImpuesto: this._configuracionFiscal.nombreImpuesto,
      ...this.resumen
    };
  }

  /**
   * Crear instancia desde JSON (para cargar desde base de datos)
   */
  static fromJSON(data: any): ShoppingCart {
    const venta = new ShoppingCart(data.id, {
      tasaImpuesto: data.tasaImpuesto,
      aplicaImpuesto: data.aplicaImpuesto,
      nombreImpuesto: data.nombreImpuesto
    });
    
    // Los items ya vienen como CarItems congelados
    venta._items = data.items || [];
    venta._notas = data.notas;
    return venta;
  }

  /**
   * Obtener todos los items como CarItems (ya son CarItems)
   */
  getItemsAsCarItems(): CarItem[] {
    return [...this._items];
  }

  // **MÉTODOS FACTORY ESTÁTICOS**

  /**
   * Crear ShoppingCart para Perú (IGV 18%)
   */
  static paraPeru(id?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.PERU);
  }

  /**
   * Crear ShoppingCart para México (IVA 16%)
   */
  static paraMexico(id?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.MEXICO);
  }

  /**
   * Crear ShoppingCart para Colombia (IVA 19%)
   */
  static paraColombia(id?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.COLOMBIA);
  }

  /**
   * Crear ShoppingCart para Argentina (IVA 21%)
   */
  static paraArgentina(id?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.ARGENTINA);
  }

  /**
   * Crear ShoppingCart para España (IVA 21%)
   */
  static paraEspana(id?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.ESPANA);
  }

  /**
   * Crear ShoppingCart sin impuestos
   */
  static sinImpuestos(id?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.SIN_IMPUESTOS);
  }

  /**
   * Crear ShoppingCart con configuración personalizada
   */
  static conConfiguracion(configuracion: ConfiguracionFiscal, id?: string): ShoppingCart {
    return new ShoppingCart(id, configuracion);
  }

  /**
   * Crear ShoppingCart para cualquier país disponible
   */
  static paraPais(pais: keyof typeof CONFIGURACIONES_FISCALES, id?: string): ShoppingCart {
    const config = CONFIGURACIONES_FISCALES[pais];
    if (typeof config === 'function') {
      throw new Error(`Use ShoppingCart.personalizado() para configuraciones personalizadas`);
    }
    return new ShoppingCart(id, config);
  }

  /**
   * Crear ShoppingCart con tasa personalizada
   */
  static personalizado(tasaImpuesto: number, nombreImpuesto: string = 'Impuesto', id?: string): ShoppingCart {
    const config = CONFIGURACIONES_FISCALES.PERSONALIZADO(tasaImpuesto, nombreImpuesto);
    return new ShoppingCart(id, config);
  }
}