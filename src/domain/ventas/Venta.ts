import { CarItem, ICarritoVenta, ProcedenciaVenta, CarritoVenta } from "./CarritoVenta";
import { AggregateRoot } from "@/domain/shared/base/AggregateRoot";
import { VentaConfirmada } from "./events/VentaConfirmada";
import { MetodoPago } from "@/domain/shared/interfaces/finanzas";
import { OrderState } from "@/domain/shared/utils/enums";

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
  
  createdAt?: Date;
  updatedAt?: Date;
  
  // === CARRITO COMPLETO (ÚNICA FUENTE) ===
  detalleVenta: ICarritoVenta; // ⭐ TODA la información aquí
  
  // === CÁLCULOS FINANCIEROS ===
  costoEnvio?: number;
  subtotal: number;
  impuesto: number;
  total: number;
  montoRedondeo?: number;
  
  // === INFORMACIÓN DE PAGO ===
  procedencia: ProcedenciaVenta;
  tipoPago?: MetodoPago;
  // IDs de trazabilidad
  clienteId?: string;
  vendedorId?: string;
  finanzaId?: string;
  
  // === CAMPOS DE TRAZABILIDAD ADICIONALES ===
  codigoVenta?: string;
  numeroVenta?: string;
  esPedido?: boolean;


  // "movimientoInventarioId": "string",
  
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
export class Venta extends AggregateRoot<string> implements IVenta {
  // === PROPIEDADES INMUTABLES ===
  public readonly nombre: string;
  public readonly type: string = 'venta';
  
  public estado: OrderState;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  
  public readonly detalleVenta: ICarritoVenta;
  
  public readonly subtotal: number;
  public readonly impuesto: number;
  public readonly total: number;
  public readonly montoRedondeo?: number;
  
  public readonly procedencia: ProcedenciaVenta;
  public readonly tipoPago?: MetodoPago;
  // IDs de trazabilidad
  public readonly clienteId?: string;
  public readonly vendedorId?: string;
  public readonly finanzaId?: string;
  
  // === CAMPOS DE TRAZABILIDAD ADICIONALES ===
  public readonly codigoVenta?: string;
  public readonly numeroVenta?: string;
  public readonly costoEnvio?: number;
  public readonly esPedido?: boolean;

  constructor(data: IVenta) {
    super(data.id);
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
    this.nombre = data.nombre;
    this.type = data.type || 'venta';
    this.estado = data.estado;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    
    // ⭐ Congelar el carrito para inmutabilidad
    // Crear instancia nativa para usar sus métodos
    const carritoInstance = CarritoVenta.fromJSON(data.detalleVenta);
    this.detalleVenta = Object.freeze(carritoInstance.toJSON());
    
    this.subtotal = data.subtotal;
    this.impuesto = data.impuesto;
    this.total = data.total;
    this.montoRedondeo = data.montoRedondeo ?? 0;
    
    this.procedencia = data.procedencia;
    this.tipoPago = data.tipoPago;
    // IDs de trazabilidad
    this.clienteId = data.clienteId;
    this.vendedorId = data.vendedorId;
    this.finanzaId = data.finanzaId;
    
    // Campos de trazabilidad adicionales
    this.codigoVenta = data.codigoVenta;
    this.numeroVenta = data.numeroVenta;
    this.costoEnvio = data.costoEnvio;
    this.esPedido = data.esPedido;

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
   * Verificar si la venta es un pedido
   */
  get esUnPedido(): boolean {
    return this.esPedido === true || this.detalleVenta.esPedido === true;
  }

  /**
   * Verificar si tiene items marcados como pedido
   */
  get tieneItemsPedido(): boolean {
    return this.items.some(item => item.esPedido === true);
  }

  /**
   * Obtener solo los items que son pedidos
   */
  get itemsPedido(): readonly CarItem[] {
    return this.items.filter(item => item.esPedido === true);
  }

  /**
   * Obtener solo los items que NO son pedidos  
   */
  get itemsVentaNormal(): readonly CarItem[] {
    return this.items.filter(item => item.esPedido !== true);
  }

  /**
   * Verificar si tiene finanza asociada
   */
  get tieneFinanzaAsociada(): boolean {
    return this.finanzaId !== undefined && this.finanzaId !== null && this.finanzaId.trim() !== '';
  }

  /**
   * Verificar si requiere finanza (es pedido pero no tiene finanza)
   */
  get requiereFinanza(): boolean {
    return this.esUnPedido && !this.tieneFinanzaAsociada;
  }

  /**
   * Obtener resumen de la venta
   */
  get resumen(): {
    cantidadItems: number;
    cantidadTotal: number;
    subtotal: number;
    impuesto: number;
    total: number;
  } {
    return {
      cantidadItems: this.cantidadItems,
      cantidadTotal: this.cantidadTotal,
      subtotal: this.subtotal,
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

  // === COMPORTAMIENTOS DE DOMINIO ===

  /**
   * Confirma la venta y dispara el evento de dominio correspondiente.
   */
  confirmar() {
    if (this.items.length === 0) {
      throw new Error("No se puede confirmar venta vacía");
    }

    this.estado = OrderState.DESPACHADO; // Simulando "CONFIRMADA"

    this.addDomainEvent(
      new VentaConfirmada(this.id, this.total)
    );
  }

  // === MÉTODOS DE SERIALIZACIÓN ===


  /**
   * Convertir a JSON para APIs externas
   */
  toJSON(): IVenta {
    return {
      id: this.id,
      nombre: this.nombre,
      type: this.type,
      estado: this.estado,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      detalleVenta: this.detalleVenta,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
      montoRedondeo: this.montoRedondeo,
      procedencia: this.procedencia,
      tipoPago: this.tipoPago,
      // IDs de compatibilidad
      clienteId: this.clienteId,
      vendedorId: this.vendedorId,
      finanzaId: this.finanzaId,
      // Campos de trazabilidad adicionales
      codigoVenta: this.codigoVenta,
      numeroVenta: this.numeroVenta,
      costoEnvio: this.costoEnvio,
      esPedido: this.esPedido
    };
  }

  // === MÉTODOS ESTÁTICOS ===

  /**
   * Crear Venta desde ICarritoVenta (para procesar pago)
   */
  static fromCarritoVenta(
    carritoJSON: ICarritoVenta,
    id: string,
    options?: { nombre?: string; montoRedondeo?: number }
  ): Venta {
    const ahora = new Date();
    
    // Si se proporciona configuestra fiscal, recalcular el impuesto
    let impuestoFinal = carritoJSON.impuesto;
    let totalCalculado = carritoJSON.total;
    const montoRedondeo = options?.montoRedondeo ?? 0;
    
    if (carritoJSON.configuracionFiscal) {
      const { tasaImpuesto, aplicaImpuesto } = carritoJSON.configuracionFiscal;
      
      if (aplicaImpuesto && tasaImpuesto !== undefined) {
        const baseImponible = carritoJSON.subtotal;
        impuestoFinal = Math.round(baseImponible * tasaImpuesto * 100) / 100;
        totalCalculado = Math.round((carritoJSON.subtotal + impuestoFinal) * 100) / 100;
      } else if (!aplicaImpuesto) {
        impuestoFinal = 0;
        totalCalculado = Math.round(carritoJSON.subtotal * 100) / 100;
      }
    }
    const totalFinal = Math.round((totalCalculado + montoRedondeo) * 100) / 100;
    
    return new Venta({
      id: id,
      nombre: options?.nombre ?? carritoJSON.nombre ?? 'Venta',
      type: 'venta',
      estado: OrderState.DESPACHADO,
      createdAt: ahora,
      updatedAt: ahora,
      detalleVenta: {
        ...carritoJSON,
        // 🔧 FIX: Preservar objetos completos del cliente y personal
        cliente: carritoJSON.cliente,
        personal: carritoJSON.personal,
        clienteId: carritoJSON.clienteId,
        personalId: carritoJSON.personalId,
        // Actualizar con los valores finales
        impuesto: impuestoFinal,
        total: totalFinal
      },
      subtotal: carritoJSON.subtotal,
      impuesto: impuestoFinal,
      total: totalFinal,
      montoRedondeo,
      procedencia: carritoJSON.procedencia || ProcedenciaVenta.Tienda,
      tipoPago: carritoJSON.metodoPago,
      // 🔧 FIX: IDs de trazabilidad corregidos
      clienteId: carritoJSON.clienteId,
      vendedorId: carritoJSON.personalId, // ✅ Correcto: personalId del carrito
      finanzaId: undefined, // finanzaId se asigna posteriormente si es necesario
      // Campos de trazabilidad adicionales
      codigoVenta: "",
      numeroVenta: "",
      costoEnvio: 0,
      esPedido: carritoJSON.esPedido
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
    
    // Validaciones opcionales para campos de trazabilidad
    if (data.costoEnvio !== undefined && data.costoEnvio < 0) {
      errores.push('El costo de envío no puede ser negativo');
    }

    // Validaciones específicas para pedidos
    if (data.esPedido === true) {
      if (!data.clienteId && !data.detalleVenta?.clienteId && !data.detalleVenta?.cliente) {
        errores.push('Un pedido debe tener un cliente asociado');
      }
    }

    // Validaciones específicas para finanzas
    if (data.finanzaId !== undefined && data.finanzaId !== null) {
      if (typeof data.finanzaId !== 'string' || data.finanzaId.trim() === '') {
        errores.push('finanzaId debe ser un string no vacío');
      }
    }
    
    return {
      valida: errores.length === 0,
      errores
    };
  }
  /**
   * Calcula el subtotal de un ítem
   */
  calcularSubtotalItem(item: ItemVenta): number {
    const precioUnitario = Number(item.precioUnitario ?? item.product.precioVenta ?? 0);
    const cantidad = item.quantity ?? 0;
    return precioUnitario * cantidad;
  }

  /**
   * Calcula el total de un ítem (subtotal - descuento)
   */
  calcularTotalItem(item: ItemVenta): number {
    return this.calcularSubtotalItem(item) - (item.descuento || 0);
  }

  /**
   * Calcula el subtotal de la venta dinámicamente
   */
  calcularSubtotal(): number {
    return this.items.reduce((sum, item) => sum + this.calcularSubtotalItem(item as ItemVenta), 0);
  }

  /**
   * Calcula el total de la venta dinámicamente
   */
  calcularTotal(): number {
    return this.calcularSubtotal() + this.impuesto;
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
