import { OrderState } from "@/utils";
import { CarItem, ProcedenciaVenta, TipoPagoVenta } from "./ShoppingCart";




export interface ShoppingCartJSON {
  id: string;
  fechaCreacion: string;
  items: CarItem[];
  subtotal: number;
  impuesto: number;
  total: number;
  descuentoTotal: number;
  cantidadItems: number;
  cantidadTotal: number;
  notas?: string;
  tasaImpuesto: number;
}

/**
 * Interfaz para datos inmutables de una venta
 * 
 * NOTA: Los items están en detalleVenta.items (carrito congelado)
 * No hay redundancia de datos - una sola fuente de verdad
 */
export interface IVenta {
  // === IDENTIFICACIÓN ===
  id: string;
  nombre: string;
  type: string;
  
  // === ESTADO Y FECHAS ===
  estado: OrderState;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  
  // === CARRITO COMPLETO (ÚNICA FUENTE) ===
  detalleVenta: ShoppingCartJSON; // ⭐ TODA la información aquí
  
  // === CÁLCULOS FINANCIEROS ===
  subtotal: number;
  impuesto: number;
  total: number;
  descuentoTotal?: number;
  notas?: string;
  
  // === INFORMACIÓN DE PAGO ===
  procedencia: ProcedenciaVenta;
  tipoPago?: TipoPagoVenta;
  clienteColor?: string;
  clienteId?: string;
  vendedorId?: string;
  dineroRecibido?: number;
  cambio?: number;
}

/**
 * Clase Venta - Maneja toda la lógica de una venta finalizada
 * 
 * 🎯 Características:
 * - ❄️ Inmutable después de creación (para auditoría)
 * - 🛒 Carrito completo congelado en detalleVenta
 * - 🔍 Métodos para acceder a datos sin romper encapsulación
 * - 📊 Cálculos automáticos y validaciones
 */
export class Venta implements IVenta {
  // === PROPIEDADES INMUTABLES ===
  public readonly id: string;
  public readonly nombre: string;
  public readonly type: string = 'venta';
  
  public readonly estado: OrderState;
  public readonly fechaCreacion: Date;
  public readonly fechaActualizacion: Date;
  
  public readonly detalleVenta: ShoppingCartJSON;
  
  public readonly subtotal: number;
  public readonly impuesto: number;
  public readonly total: number;
  public readonly descuentoTotal?: number;
  public readonly notas?: string;
  
  public readonly procedencia: ProcedenciaVenta;
  public readonly tipoPago?: TipoPagoVenta;
  public readonly clienteColor?: string;
  public readonly clienteId?: string;
  public readonly vendedorId?: string;
  public readonly dineroRecibido?: number;
  public readonly cambio?: number;

  constructor(data: IVenta) {
    // Validaciones básicas
    if (!data.id || !data.nombre) {
      throw new Error('ID y nombre son requeridos para crear una venta');
    }
    
    if (!data.detalleVenta || !data.detalleVenta.items) {
      throw new Error('detalleVenta con items es requerido');
    }

    if (data.total <= 0) {
      throw new Error('El total de la venta debe ser mayor a 0');
    }

    // Asignar propiedades (inmutables)
    this.id = data.id;
    this.nombre = data.nombre;
    this.type = data.type || 'venta';
    this.estado = data.estado;
    this.fechaCreacion = new Date(data.fechaCreacion);
    this.fechaActualizacion = new Date(data.fechaActualizacion);
    
    // ⭐ Congelar el carrito para inmutabilidad
    this.detalleVenta = Object.freeze({ ...data.detalleVenta });
    
    this.subtotal = data.subtotal;
    this.impuesto = data.impuesto;
    this.total = data.total;
    this.descuentoTotal = data.descuentoTotal;
    this.notas = data.notas;
    
    this.procedencia = data.procedencia;
    this.tipoPago = data.tipoPago;
    this.clienteColor = data.clienteColor;
    this.clienteId = data.clienteId;
    this.vendedorId = data.vendedorId;
    this.dineroRecibido = data.dineroRecibido;
    this.cambio = data.cambio;

    // Congelar la instancia completa
    Object.freeze(this);
  }

  // === GETTERS PARA ACCESO A DATOS ===

  /**
   * Obtener items de la venta (desde carrito congelado)
   */
  get items(): readonly CarItem[] {
    return this.detalleVenta.items;
  }

  /**
   * Obtener cantidad total de items
   */
  get cantidadItems(): number {
    return this.detalleVenta.cantidadItems;
  }

  /**
   * Obtener cantidad total de productos
   */
  get cantidadTotal(): number {
    return this.detalleVenta.cantidadTotal;
  }

  /**
   * Verificar si es una venta procesada/finalizada
   */
  get estaProcesada(): boolean {
    return this.estado === OrderState.DESPACHADO;
  }

  /**
   * Verificar si es una lista pendiente
   */
  get esPendiente(): boolean {
    return this.estado === OrderState.PENDIENTE;
  }

  /**
   * Obtener resumen de la venta
   */
  get resumen(): {
    cantidadItems: number;
    cantidadTotal: number;
    subtotal: number;
    descuentoTotal: number;
    impuesto: number;
    total: number;
  } {
    return {
      cantidadItems: this.cantidadItems,
      cantidadTotal: this.cantidadTotal,
      subtotal: this.subtotal,
      descuentoTotal: this.descuentoTotal || 0,
      impuesto: this.impuesto,
      total: this.total
    };
  }

  // === MÉTODOS DE BÚSQUEDA ===

  /**
   * Buscar item por ID de producto
   */
  buscarItemPorProducto(productId: string): CarItem | undefined {
    return this.items.find(item => item.product.id === productId);
  }

  /**
   * Buscar item por ID único del item
   */
  buscarItemPorId(itemId: string): CarItem | undefined {
    return this.items.find(item => item.id === itemId);
  }

  /**
   * Obtener productos únicos (sin repetir)
   */
  get productosUnicos(): Array<{ id: string; nombre: string; cantidadTotal: number; montoTotal: number }> {
    const productosMap = new Map();
    
    this.items.forEach(item => {
      const productId = item.product.id;
      if (productosMap.has(productId)) {
        const existing = productosMap.get(productId);
        existing.cantidadTotal += item.quantity;
        existing.montoTotal += item.montoTotal || 0;
      } else {
        productosMap.set(productId, {
          id: productId,
          nombre: item.product.nombre,
          cantidadTotal: item.quantity,
          montoTotal: item.montoTotal || 0
        });
      }
    });
    
    return Array.from(productosMap.values());
  }

  // === MÉTODOS DE SERIALIZACIÓN ===

  /**
   * Convertir a objeto plano para guardar en DB
   */
  toPouchDB(): any {
    return {
      _id: this.id,
      type: this.type,
      nombre: this.nombre,
      estado: this.estado,
      fechaCreacion: this.fechaCreacion.toISOString(),
      fechaActualizacion: this.fechaActualizacion.toISOString(),
      detalleVenta: this.detalleVenta,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
      descuentoTotal: this.descuentoTotal,
      notas: this.notas,
      procedencia: this.procedencia,
      tipoPago: this.tipoPago,
      clienteColor: this.clienteColor,
      clienteId: this.clienteId,
      vendedorId: this.vendedorId,
      dineroRecibido: this.dineroRecibido,
      cambio: this.cambio
    };
  }

  /**
   * Convertir a JSON para APIs externas
   */
  toJSON(): IVenta {
    return {
      id: this.id,
      nombre: this.nombre,
      type: this.type,
      estado: this.estado,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion,
      detalleVenta: this.detalleVenta,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
      descuentoTotal: this.descuentoTotal,
      notas: this.notas,
      procedencia: this.procedencia,
      tipoPago: this.tipoPago,
      clienteColor: this.clienteColor,
      clienteId: this.clienteId,
      vendedorId: this.vendedorId,
      dineroRecibido: this.dineroRecibido,
      cambio: this.cambio
    };
  }

  // === MÉTODOS ESTÁTICOS ===

  /**
   * Crear Venta desde datos de PouchDB
   */
  static fromPouchDB(doc: any): Venta {
    return new Venta({
      id: doc._id,
      nombre: doc.nombre,
      type: doc.type || 'venta',
      estado: doc.estado,
      fechaCreacion: new Date(doc.fechaCreacion),
      fechaActualizacion: new Date(doc.fechaActualizacion),
      detalleVenta: doc.detalleVenta,
      subtotal: doc.subtotal,
      impuesto: doc.impuesto,
      total: doc.total,
      descuentoTotal: doc.descuentoTotal,
      notas: doc.notas,
      procedencia: doc.procedencia,
      tipoPago: doc.tipoPago,
      clienteColor: doc.clienteColor,
      clienteId: doc.clienteId,
      vendedorId: doc.vendedorId,
      dineroRecibido: doc.dineroRecibido,
      cambio: doc.cambio
    });
  }

  /**
   * Crear Venta desde ShoppingCart (para procesar pago)
   */
  static fromShoppingCart(
    carritoJSON: ShoppingCartJSON,
    datosPago: {
      nombre: string;
      procedencia: ProcedenciaVenta;
      tipoPago?: TipoPagoVenta;
      clienteColor?: string;
      clienteId?: string;
      vendedorId?: string;
      dineroRecibido?: number;
      notas?: string;
      // Nueva opción para sobrescribir configuración fiscal
      configuracionFiscal?: {
        tasaImpuesto?: number;
        aplicaImpuesto?: boolean;
        nombreImpuesto?: string;
      };
    }
  ): Venta {
    const ahora = new Date();
    
    // Si se proporciona configuración fiscal, recalcular el impuesto
    let impuestoFinal = carritoJSON.impuesto;
    let totalFinal = carritoJSON.total;
    
    if (datosPago.configuracionFiscal) {
      const { tasaImpuesto, aplicaImpuesto } = datosPago.configuracionFiscal;
      
      if (aplicaImpuesto && tasaImpuesto !== undefined) {
        const baseImponible = carritoJSON.subtotal - (carritoJSON.descuentoTotal || 0);
        impuestoFinal = Math.round(baseImponible * tasaImpuesto * 100) / 100;
        totalFinal = Math.round((carritoJSON.subtotal - (carritoJSON.descuentoTotal || 0) + impuestoFinal) * 100) / 100;
      } else if (!aplicaImpuesto) {
        impuestoFinal = 0;
        totalFinal = Math.round((carritoJSON.subtotal - (carritoJSON.descuentoTotal || 0)) * 100) / 100;
      }
    }
    
    const cambio = datosPago.dineroRecibido ? datosPago.dineroRecibido - totalFinal : undefined;
    
    return new Venta({
      id: `venta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      nombre: datosPago.nombre,
      type: 'venta',
      estado: OrderState.DESPACHADO,
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
      detalleVenta: {
        ...carritoJSON,
        // Actualizar con los valores finales
        impuesto: impuestoFinal,
        total: totalFinal
      },
      subtotal: carritoJSON.subtotal,
      impuesto: impuestoFinal,
      total: totalFinal,
      descuentoTotal: carritoJSON.descuentoTotal,
      notas: datosPago.notas,
      procedencia: datosPago.procedencia,
      tipoPago: datosPago.tipoPago,
      clienteColor: datosPago.clienteColor,
      clienteId: datosPago.clienteId,
      vendedorId: datosPago.vendedorId,
      dineroRecibido: datosPago.dineroRecibido,
      cambio: cambio
    });
  }

  /**
   * Validar estructura de datos de venta
   */
  static validar(data: Partial<IVenta>): { valida: boolean; errores: string[] } {
    const errores: string[] = [];
    
    if (!data.id) errores.push('ID es requerido');
    if (!data.nombre) errores.push('Nombre es requerido');
    if (!data.detalleVenta) errores.push('detalleVenta es requerido');
    if (!data.detalleVenta?.items?.length) errores.push('La venta debe tener al menos un item');
    if ((data.total || 0) <= 0) errores.push('El total debe ser mayor a 0');
    if (!data.procedencia) errores.push('Procedencia es requerida');
    
    return {
      valida: errores.length === 0,
      errores
    };
  }
}

/**
 * Helper para obtener items de una venta (compatibilidad con código existente)
 * @deprecated Usar venta.items directamente
 */
export function getVentaItems(venta: IVenta): CarItem[] {
  return venta.detalleVenta?.items || [];
}

/**
 * Helper para obtener resumen de items
 * @deprecated Usar venta.productosUnicos directamente
 */
export function getVentaItemsResumen(venta: IVenta): Array<{id: string, nombre: string, cantidad: number, total: number}> {
  const items = getVentaItems(venta);
  return items.map(item => ({
    id: item.id,
    nombre: item.product.nombre,
    cantidad: item.quantity,
    total: item.montoTotal || 0
  }));
}

/**
 * Interfaz para ítems de venta con métodos de cálculo
 */
export interface ItemVenta extends CarItem {
  descuento?: number; // Descuento aplicado al ítem
}

/**
 * Clase utilitaria para cálculos de venta
 */
export class VentaCalculator {
  /**
   * Calcula el subtotal de un ítem
   */
  static calcularSubtotalItem(item: ItemVenta): number {
    const precioUnitario = item.precioUnitario || item.product.precio;
    return precioUnitario * item.quantity;
  }

  /**
   * Calcula el total de un ítem (subtotal - descuento)
   */
  static calcularTotalItem(item: ItemVenta): number {
    const subtotal = this.calcularSubtotalItem(item);
    return subtotal - (item.descuento || 0);
  }

  /**
   * Calcula el subtotal de una venta (suma de subtotales)
   */
  static calcularSubtotalVenta(items: ItemVenta[]): number {
    return items.reduce((sum, item) => sum + this.calcularSubtotalItem(item), 0);
  }

  /**
   * Calcula el total de descuentos de una venta
   */
  static calcularDescuentoTotal(items: ItemVenta[]): number {
    return items.reduce((sum, item) => sum + (item.descuento || 0), 0);
  }

  /**
   * Calcula el total de una venta
   */
  static calcularTotalVenta(items: ItemVenta[], impuesto: number = 0): number {
    const subtotal = this.calcularSubtotalVenta(items);
    const descuento = this.calcularDescuentoTotal(items);
    return subtotal - descuento + impuesto;
  }

  /**
   * Calcula el cambio a devolver
   */
  static calcularCambio(total: number, dineroRecibido: number): number {
    return Math.max(0, dineroRecibido - total);
  }
}

