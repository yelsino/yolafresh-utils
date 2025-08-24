/**
 * Entidad ShoppingCart - Encapsula toda la lógica de una venta en curso
 * Reutilizable para cualquier sistema POS
 * Simplificada: usa solo CarItem con congelación automática al guardar
 */

import { Producto } from "@/interfaces";
import { Cliente, Personal } from "@/interfaces/persons";
import { TipoVentaEnum } from "@/utils";
import { ConfiguracionFiscal, CONFIGURACIONES_FISCALES } from "@/utils/fiscales";

/**
 * Representa un ítem individual en el carrito de compras
 * 
 * @description Contiene toda la información necesaria para un producto
 * en el carrito, incluyendo cantidad, precios y configuraciones especiales
 * 
 * @example
 * ```typescript
 * const item: CarItem = {
 *   id: 'item-001',
 *   product: { id: 'prod-001', nombre: 'Manzana', precio: 5.50 },
 *   quantity: 2.5,
 *   peso: 2.5, // Para productos pesables
 *   tipoVenta: TipoVentaEnum.Kilogramo
 * };
 * ```
 */
export interface CarItem {
  /** 
   * Identificador único para cada ítem del carrito
   * @description Se genera automáticamente para diferenciar items del mismo producto
   */
  id: string;
  
  /** 
   * Información completa del producto
   * @description Contiene todos los datos del producto (nombre, precio, etc.)
   */
  product: Producto;
  
  /** 
   * Cantidad del producto
   * @description Para productos pesables, representa el peso
   * @minimum 0.001
   */
  quantity: number;
  
  /** 
   * Precio unitario configurado (opcional)
   * @description Si se proporciona, sobrescribe el precio del producto
   * @minimum 0
   */
  precioUnitario?: number;
  
  /** 
   * Indica si el monto fue modificado manualmente
   * @description Cuando es true, el montoTotal no se recalcula automáticamente
   */
  montoModificado?: boolean;
  
  /** 
   * Monto total a pagar por este ítem
   * @description Se calcula automáticamente o se puede establecer manualmente
   * @minimum 0
   */
  montoTotal?: number | null;
  
  /** 
   * Tipo de venta del producto (opcional)
   * @description Determina cómo se vende: por unidad, kilogramo, litro, etc.
   */
  tipoVenta?: TipoVentaEnum;
  
  /** 
   * Peso para productos pesables (opcional)
   * @description Solo se usa cuando el producto se vende por peso
   * @minimum 0
   */
  peso?: number;
  
  /** 
   * Descuento aplicado al ítem (opcional)
   * @description Monto a descontar del total del ítem
   * @minimum 0
   */
  descuento?: number;

  /** 
   * Indica si la venta es un pedido
   * @description Cuando es true, la venta se considera un pedido, el app debe crear una finanza de credito, la venta se marca como pendiente de pago
   */
  esPedido?: boolean;

  
}

/**
 * Configuración para agregar productos
 */
export interface OpcionesAgregarProducto {
  replaceCompletely?: boolean;
  itemId?: string;
  fromSelection?: boolean;
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
 * Interfaz principal del carrito de compras
 * 
 * @description Define la estructura completa de un carrito de compras,
 * incluyendo items, cálculos, trazabilidad y configuración fiscal
 * 
 * @example
 * ```typescript
 * const carrito: IShoppingCart = {
 *   id: 'cart-001',
 *   fechaCreacion: new Date(),
 *   nombre: 'Venta Mostrador',
 *   items: [item1, item2],
 *   subtotal: 100.00,
 *   impuesto: 18.00,
 *   total: 118.00,
 *   descuentoTotal: 0,
 *   cantidadItems: 2,
 *   cantidadTotal: 5,
 *   tasaImpuesto: 0.18
 * };
 * ```
 */
export interface IShoppingCart {
  /** 
   * Identificador único del carrito
   * @description Se genera automáticamente al crear el carrito
   */
  id: string;
  
  /** 
   * Fecha y hora de creación del carrito
   * @description Se establece automáticamente al instanciar
   */
  fechaCreacion: Date;
  
  /** 
   * Nombre descriptivo del carrito
   * @description Ayuda a identificar el propósito del carrito
   * @example "Mesa 5", "Venta Mostrador", "Pedido Web #123"
   */
  nombre: string;
  
  /** 
   * Lista de productos en el carrito
   * @description Array de todos los items agregados al carrito
   */
  items: CarItem[];
  
  /** 
   * Subtotal sin impuestos ni descuentos
   * @description Suma de todos los montos de los items
   * @minimum 0
   */
  subtotal: number;
  
  /** 
   * Monto total de impuestos
   * @description Se calcula automáticamente según la configuración fiscal
   * @minimum 0
   */
  impuesto: number;
  
  /** 
   * Total final a pagar
   * @description Subtotal + impuestos - descuentos
   * @minimum 0
   */
  total: number;
  
  /** 
   * Total de descuentos aplicados
   * @description Suma de todos los descuentos de los items
   * @minimum 0
   */
  descuentoTotal: number;
  
  /** 
   * Cantidad de items únicos en el carrito
   * @description Número de elementos diferentes en el array items
   * @minimum 0
   */
  cantidadItems: number;
  
  /** 
   * Cantidad total de productos
   * @description Suma de las cantidades de todos los items
   * @minimum 0
   */
  cantidadTotal: number;
  
  /** 
   * Notas adicionales del carrito (opcional)
   * @description Comentarios o instrucciones especiales
   */
  notas?: string;
  
  /** 
   * Tasa de impuesto aplicada
   * @description Valor entre 0 y 1 (ej: 0.18 para 18%)
   * @minimum 0
   * @maximum 1
   */
  tasaImpuesto: number;
  
  // === CAMPOS DE TRAZABILIDAD ===
  
  /** 
   * Información completa del cliente (opcional)
   * @description Objeto completo con todos los datos del cliente
   */
  cliente?: Cliente;
  
  /** 
   * Información completa del personal (opcional)
   * @description Datos del empleado que maneja la venta
   */
  personal?: Personal;
  
  /** 
   * Color identificativo del cliente (opcional)
   * @description Color hexadecimal para identificación visual
   * @example "#FF5733", "#00FF00"
   */
  clienteColor?: string;
  
  // === DATOS DE PAGO ===
  
  /** 
   * Método de pago seleccionado (opcional)
   * @description Forma en que se realizará el pago
   */
  metodoPago?: TipoPagoVenta;
  
  /** 
   * Dinero recibido del cliente (opcional)
   * @description Monto entregado por el cliente
   * @minimum 0
   */
  dineroRecibido?: number;
  
  /** 
   * Procedencia de la venta (opcional)
   * @description Canal o lugar donde se originó la venta
   */
  procedencia?: ProcedenciaVenta;
  
    /**
   * Configuración fiscal aplicada (opcional)
   * @description Settings de impuestos y cálculos fiscales
   */
  configuracionFiscal?: ConfiguracionFiscal;

  /** 
   * Indica si toda la venta es un pedido
   * @description Cuando es true, toda la venta se considera un pedido, 
   * el app debe crear una finanza de crédito, la venta se marca como pendiente de pago
   */
  esPedido?: boolean;

  /** 
   * ID de la finanza asociada (opcional)
   * @description Vincula el carrito con una finanza específica para pedidos o ventas a crédito
   */
  finanzaId?: string;
  
  // === IDS DE COMPATIBILIDAD ===
  
  /** 
   * ID del cliente (solo lectura)
   * @description Se obtiene automáticamente del objeto cliente
   * @readonly
   */
  readonly clienteId?: string;
  
  /** 
   * ID del personal (solo lectura)
   * @description Se obtiene automáticamente del objeto personal
   * @readonly
   */
  readonly personalId?: string;
}
/**
 * Clase ShoppingCart - Maneja toda la lógica de una venta en curso
 * Simplificada: trabaja solo con CarItem, congela al guardar
 */

export class ShoppingCart implements IShoppingCart {
  public readonly id: string;
  public readonly fechaCreacion: Date;
  public readonly nombre: string;
  private _items: CarItem[] = [];
  private _notas?: string;
  private _configuracionFiscal: ConfiguracionFiscal;
  
  // === CAMPOS DE TRAZABILIDAD ===
  private _cliente?: Cliente;
  private _personal?: Personal;
  private _clienteColor?: string;
  
  // === DATOS DE PAGO ===
  private _metodoPago?: TipoPagoVenta;
  private _dineroRecibido?: number;
  private _procedencia?: ProcedenciaVenta;
  private _esPedido?: boolean;
  private _finanzaId?: string;

  constructor(id?: string, configuracionFiscal?: ConfiguracionFiscal, nombre?: string) {
    this.id = id || `venta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.fechaCreacion = new Date();
    this.nombre = nombre || `Carrito-${Date.now()}`;
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

    // Buscar ítem existente SOLO por itemId para evitar colisiones por productId
    let itemExistente: CarItem | undefined = undefined;
    if (replaceCompletely && itemId) {
      itemExistente = this._items.find(item => item.id === itemId);
    }

    // Verificar si el producto es pesable considerando overrides en el item
    const esPesable = this.esProductoPesable((carItem.tipoVenta ?? carItem.product.tipoVenta) as TipoVentaEnum);

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
    const unit = Number(carItem.precioUnitario ?? carItem.product.precio) || 0;

    // Compatibilidad legacy: si es pesable y no hay peso, pero quantity es decimal, interpretarlo como peso
    const legacyPeso = esPesable && (carItem.peso == null) && typeof carItem.quantity === 'number' && !Number.isInteger(carItem.quantity)
      ? Number(carItem.quantity)
      : undefined;

    const prepared: CarItem = {
      ...itemExistente,
      id: itemExistente.id,
      product: carItem.product,
      // No normalizar quantity para pesables (preservar decimales). No pesables: entero >= 1
      quantity: esPesable
        ? (typeof carItem.quantity === 'number' ? carItem.quantity : (itemExistente.quantity ?? 1))
        : Number(carItem.quantity ?? itemExistente.quantity ?? 1),
      precioUnitario: unit,
      montoModificado: !!carItem.montoModificado,
      // tipoVenta preferentemente del item, sino del producto
      tipoVenta: (carItem.tipoVenta ?? (carItem.product.tipoVenta as TipoVentaEnum)),
      // Peso solo para pesables; usar peso proporcionado o legacy
      peso: esPesable ? Number(carItem.peso ?? legacyPeso ?? itemExistente.peso ?? itemExistente.quantity ?? 0) : undefined,
      descuento: carItem.descuento ?? (itemExistente as any).descuento
    } as CarItem;

    // Calcular total respetando overrides
    prepared.montoTotal = (prepared.montoModificado && carItem.montoTotal != null)
      ? carItem.montoTotal as number
      : this.calcularTotalLinea(prepared);

    const index = this._items.findIndex(item => item.id === itemExistente.id);
    if (index !== -1) {
      this._items[index] = prepared;
    }
  }

  /**
   * Agregar nuevo ítem
   */
  private agregarNuevoItem(carItem: CarItem, itemId: string, esPesable: boolean): void {
    const unit = Number(carItem.precioUnitario ?? carItem.product.precio) || 0;

    // Compatibilidad legacy: si es pesable y no hay peso, pero quantity es decimal, interpretarlo como peso
    const legacyPeso = esPesable && (carItem.peso == null) && typeof carItem.quantity === 'number' && !Number.isInteger(carItem.quantity)
      ? Number(carItem.quantity)
      : undefined;

    const prepared: CarItem = {
      id: itemId,
      product: carItem.product,
      quantity: esPesable
        ? (typeof carItem.quantity === 'number' ? carItem.quantity : 1)
        : Number(carItem.quantity ?? 1),
      precioUnitario: unit,
      montoModificado: !!carItem.montoModificado,
      tipoVenta: (carItem.tipoVenta ?? (carItem.product.tipoVenta as TipoVentaEnum)),
      peso: esPesable ? Number(carItem.peso ?? legacyPeso ?? carItem.quantity ?? 0) : undefined,
      descuento: carItem.descuento
    } as CarItem;

    prepared.montoTotal = (prepared.montoModificado && carItem.montoTotal != null)
      ? carItem.montoTotal as number
      : this.calcularTotalLinea(prepared);

    this._items.push(prepared);
  }

  /**
   * Calcular monto total de un ítem
   */
  private calcularTotalLinea(carItem: CarItem): number {
    // Respetar overrides manuales
    if (carItem.montoModificado && carItem.montoTotal != null) {
      return Number(carItem.montoTotal);
    }

    const unit = Number(carItem.precioUnitario ?? (carItem.product?.precio ?? 0)) || 0;
    const esPesable = this.esProductoPesable(((carItem.tipoVenta ?? carItem.product?.tipoVenta) as TipoVentaEnum));
    const peso = esPesable ? Number(carItem.peso ?? carItem.quantity ?? 0) : undefined;
    const qty = esPesable ? 0 : Math.max(0, Number(carItem.quantity ?? 0));
    const base = esPesable ? unit * (peso || 0) : unit * qty;
    return Math.round(base * 100) / 100;
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
  incrementarCantidad(id: string, stepKg: number = 0.1): boolean {
    // Buscar primero por itemId y luego por productId para compatibilidad
    let index = this._items.findIndex(item => item.id === id);
    if (index === -1) {
      index = this._items.findIndex(item => item.product.id === id);
    }
    if (index === -1) return false;

    const item = this._items[index];
    const esPesable = this.esProductoPesable((item.tipoVenta ?? item.product.tipoVenta) as TipoVentaEnum);

    const updated: CarItem = { ...item };
    if (esPesable) {
      const currentPeso = Number(item.peso ?? item.quantity ?? 0);
      const newPeso = currentPeso + stepKg;
      updated.peso = newPeso;
    } else {
      const currentQty = Number(item.quantity ?? 0);
      updated.quantity = currentQty + 1;
    }

    updated.montoTotal = item.montoModificado ? (item.montoTotal || 0) : this.calcularTotalLinea(updated);
    this._items[index] = updated;
    return true;
  }

  /**
   * Decrementar cantidad de un producto
   */
  decrementarCantidad(id: string, stepKg: number = 0.1): boolean {
    // Buscar primero por itemId y luego por productId para compatibilidad
    let index = this._items.findIndex(item => item.id === id);
    if (index === -1) {
      index = this._items.findIndex(item => item.product.id === id);
    }
    if (index === -1) return false;

    const item = this._items[index];
    const esPesable = this.esProductoPesable((item.tipoVenta ?? item.product.tipoVenta) as TipoVentaEnum);

    if (esPesable) {
      const currentPeso = Number(item.peso ?? item.quantity ?? 0);
      const newPeso = currentPeso - stepKg;
      if (newPeso <= 0) {
        this._items.splice(index, 1);
        return true;
      }
      const updated: CarItem = { ...item, peso: newPeso };
      updated.montoTotal = item.montoModificado ? (item.montoTotal || 0) : this.calcularTotalLinea(updated);
      this._items[index] = updated;
      return true;
    } else {
      const currentQty = Number(item.quantity ?? 0);
      const newQty = currentQty - 1;
      if (newQty <= 0) {
        this._items.splice(index, 1);
        return true;
      }
      const updated: CarItem = { ...item, quantity: newQty };
      updated.montoTotal = item.montoModificado ? (item.montoTotal || 0) : this.calcularTotalLinea(updated);
      this._items[index] = updated;
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

  get items(): CarItem[] {
    return [...this._items];
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

  // **GETTERS Y SETTERS DE TRAZABILIDAD**

  get cliente(): Cliente | undefined {
    return this._cliente;
  }

  set cliente(value: Cliente | undefined) {
    this._cliente = value;
  }

  get personal(): Personal | undefined {
    return this._personal;
  }

  set personal(value: Personal | undefined) {
    this._personal = value;
  }

  get clienteColor(): string | undefined {
    return this._clienteColor;
  }

  set clienteColor(value: string | undefined) {
    this._clienteColor = value;
  }

  // **GETTERS DE COMPATIBILIDAD (para IDs)**
  
  get clienteId(): string | undefined {
    return this._cliente?.id;
  }

  get personalId(): string | undefined {
    return this._personal?.id;
  }

  /**
   * Configurar información de trazabilidad
   */
  configurarTrazabilidad(datos: {
    cliente?: Cliente;
    personal?: Personal;
    clienteColor?: string;
  }): void {
    this._cliente = datos.cliente;
    this._personal = datos.personal;
    this._clienteColor = datos.clienteColor;
  }

  /**
   * Configurar información de trazabilidad por IDs (método de compatibilidad)
   * @deprecated Usar configurarTrazabilidad con objetos completos
   */
  configurarTrazabilidadPorIds(datos: {
    clienteId?: string;
    personalId?: string;
    clienteColor?: string;
  }): void {
    // Este método mantiene compatibilidad pero se recomienda usar objetos completos
    if (datos.clienteId && this._cliente?.id !== datos.clienteId) {
      console.warn('Se está configurando clienteId sin objeto Cliente completo');
    }
    if (datos.personalId && this._personal?.id !== datos.personalId) {
      console.warn('Se está configurando personalId sin objeto Personal completo');
    }
    this._clienteColor = datos.clienteColor;
  }

  // **GETTERS Y SETTERS DE DATOS DE PAGO**

  get metodoPago(): TipoPagoVenta | undefined {
    return this._metodoPago;
  }

  set metodoPago(value: TipoPagoVenta | undefined) {
    this._metodoPago = value;
  }

  get dineroRecibido(): number | undefined {
    return this._dineroRecibido;
  }

  set dineroRecibido(value: number | undefined) {
    this._dineroRecibido = value;
  }

  get procedencia(): ProcedenciaVenta | undefined {
    return this._procedencia;
  }

  set procedencia(value: ProcedenciaVenta | undefined) {
    this._procedencia = value;
  }

  get esPedido(): boolean | undefined {
    return this._esPedido;
  }

  set esPedido(value: boolean | undefined) {
    this._esPedido = value;
  }

  get finanzaId(): string | undefined {
    return this._finanzaId;
  }

  set finanzaId(value: string | undefined) {
    this._finanzaId = value;
  }

  /**
   * Configurar datos de pago
   */
  configurarPago(datos: {
    metodoPago?: TipoPagoVenta;
    dineroRecibido?: number;
    procedencia?: ProcedenciaVenta;
    esPedido?: boolean;
    finanzaId?: string;
  }): void {
    this._metodoPago = datos.metodoPago;
    this._dineroRecibido = datos.dineroRecibido;
    this._procedencia = datos.procedencia;
    this._esPedido = datos.esPedido;
    this._finanzaId = datos.finanzaId;
  }

  // **MÉTODOS ESPECÍFICOS PARA PEDIDOS**
  // 
  // Los pedidos permiten manejar ventas que requieren:
  // - Finanzas de crédito (pago pendiente)
  // - Gestión de clientes obligatoria
  // - Separación de items entre pedidos y venta normal
  // - Cálculos diferenciados para reporting
  //
  // Ejemplos de uso:
  // 
  // 1. Marcar todo el carrito como pedido:
  //    carrito.marcarComoPedido({ cliente, notas: "Entrega mañana" });
  //
  // 2. Marcar items específicos como pedido:
  //    carrito.marcarItemComoPedido("item-123", true);
  //
  // 3. Obtener totales separados:
  //    const { pedidos, ventaNormal } = carrito.totalesSeparados;
  //

  /**
   * Marcar la venta como pedido
   * @description Configura la venta como pedido, lo que implica que:
   * - Se debe crear una finanza de crédito
   * - La venta se marca como pendiente de pago
   * - Se puede configurar información adicional del pedido
   */
  marcarComoPedido(configuracion?: { 
    cliente?: Cliente; 
    fechaEntrega?: Date; 
    anticipo?: number;
    notas?: string;
  }): void {
    this._esPedido = true;
    
    if (configuracion) {
      if (configuracion.cliente) {
        this._cliente = configuracion.cliente;
      }
      if (configuracion.notas) {
        this._notas = configuracion.notas;
      }
      // Nota: fechaEntrega y anticipo se pueden manejar en campos adicionales 
      // o extender la interfaz según necesidades específicas
    }
  }



  /**
   * Desmarcar como pedido y convertir a venta normal
   */
  convertirAVentaNormal(): void {
    this._esPedido = false;
  }

  /**
   * Verificar si la venta es un pedido
   */
  get esUnPedido(): boolean {
    return this._esPedido === true;
  }

  /**
   * Verificar si algún item individual es un pedido
   */
  get tieneItemsPedido(): boolean {
    return this._items.some(item => item.esPedido === true);
  }

  /**
   * Obtener solo los items que son pedidos
   */
  get itemsPedido(): CarItem[] {
    return this._items.filter(item => item.esPedido === true);
  }

  /**
   * Obtener solo los items que NO son pedidos
   */
  get itemsVentaNormal(): CarItem[] {
    return this._items.filter(item => item.esPedido !== true);
  }

  /**
   * Marcar un item específico como pedido
   */
  marcarItemComoPedido(itemId: string, esPedido: boolean = true): boolean {
    const index = this._items.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    this._items[index] = {
      ...this._items[index],
      esPedido
    };
    
    return true;
  }

  /**
   * Calcular totales separados entre pedidos y venta normal
   */
  get totalesSeparados(): {
    pedidos: { subtotal: number; impuesto: number; total: number; items: number };
    ventaNormal: { subtotal: number; impuesto: number; total: number; items: number };
  } {
    const itemsPedido = this.itemsPedido;
    const itemsVentaNormal = this.itemsVentaNormal;
    
    const subtotalPedidos = itemsPedido.reduce((sum, item) => sum + (item.montoTotal || 0), 0);
    const subtotalVentaNormal = itemsVentaNormal.reduce((sum, item) => sum + (item.montoTotal || 0), 0);
    
    const impuestoPedidos = this._configuracionFiscal.aplicaImpuesto 
      ? Math.round(subtotalPedidos * (this._configuracionFiscal.tasaImpuesto || 0) * 100) / 100
      : 0;
    
    const impuestoVentaNormal = this._configuracionFiscal.aplicaImpuesto 
      ? Math.round(subtotalVentaNormal * (this._configuracionFiscal.tasaImpuesto || 0) * 100) / 100
      : 0;

    return {
      pedidos: {
        subtotal: subtotalPedidos,
        impuesto: impuestoPedidos,
        total: subtotalPedidos + impuestoPedidos,
        items: itemsPedido.length
      },
      ventaNormal: {
        subtotal: subtotalVentaNormal,
        impuesto: impuestoVentaNormal,
        total: subtotalVentaNormal + impuestoVentaNormal,
        items: itemsVentaNormal.length
      }
    };
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
  get resumen() {
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
  puedeProcesarse(): boolean {
    return !this.estaVacia && this.total > 0;
  }

  // **MÉTODOS DE PERSISTENCIA**

  /**
   * Serializar para persistencia en base de datos
   * CONGELA los CarItems tal como están (datos inmutables)
   */
  toJSON() {
    // Devolver la misma estructura del carrito, preservando datos tal cual
    const carrito: IShoppingCart = {
      id: this.id,
      fechaCreacion: this.fechaCreacion, // mantener Date para estructura interna
      nombre: this.nombre,
      // Items congelados tal como están (copias superficiales)
      items: this._items.map(item => {
        const { descripcion, titulo, ...productSnapshot } = item.product as any;
        return {
          ...item,
          // Serializar producto completo menos campos irrelevantes indicados
          product: productSnapshot
        };
      }),
      // Resumen actual (no recalcula cada ítem, usa valores presentes)
      subtotal: this.subtotal,
      descuentoTotal: this.descuentoTotal,
      impuesto: this.impuesto,
      total: this.total,
      cantidadItems: this.cantidadItems,
      cantidadTotal: this.cantidadTotal,
      // Notas
      notas: this._notas,
      // Configuración fiscal como objeto
      configuracionFiscal: { ...this._configuracionFiscal },
      // Compatibilidad legacy para consumidores existentes
      tasaImpuesto: this._configuracionFiscal.tasaImpuesto || 0,
      // Trazabilidad completa y IDs de compatibilidad
      cliente: this._cliente ? { ...this._cliente } : undefined,
      personal: this._personal ? { ...this._personal } : undefined,
      clienteColor: this._clienteColor,
      clienteId: this._cliente?.id,
      personalId: this._personal?.id,
      
      // Datos de pago
      metodoPago: this._metodoPago,
      dineroRecibido: this._dineroRecibido,
      procedencia: this._procedencia,
      esPedido: this._esPedido,
      finanzaId: this._finanzaId,
    };

    return carrito;
  }

  /**
   * Crear instancia desde JSON (para cargar desde base de datos)
   */
  static fromJSON(data: any): ShoppingCart {
    // Preferir objeto de configuración fiscal completo; fallback a campos legacy
    const configuracionFiscal = data.configuracionFiscal ?? {
      tasaImpuesto: data.tasaImpuesto,
      aplicaImpuesto: data.aplicaImpuesto,
      nombreImpuesto: data.nombreImpuesto
    };

    const venta = new ShoppingCart(data.id, configuracionFiscal, data.nombre);

    // Ítems ya vienen como CarItems congelados; preservar tal cual
    venta._items = data.items || [];
    venta._notas = data.notas;

    // Trazabilidad: aceptar objetos completos o fallback por ID
    venta._cliente = data.cliente
    venta._personal = data.personal
    venta._clienteColor = data.clienteColor;

    // Datos de pago
    venta._metodoPago = data.metodoPago;
    venta._dineroRecibido = data.dineroRecibido;
    venta._procedencia = data.procedencia;
    venta._esPedido = data.esPedido;
    venta._finanzaId = data.finanzaId;

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
  static paraPeru(id?: string, nombre?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.PERU, nombre);
  }

  /**
   * Crear ShoppingCart para México (IVA 16%)
   */
  static paraMexico(id?: string, nombre?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.MEXICO, nombre);
  }

  /**
   * Crear ShoppingCart para Colombia (IVA 19%)
   */
  static paraColombia(id?: string, nombre?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.COLOMBIA, nombre);
  }

  /**
   * Crear ShoppingCart para Argentina (IVA 21%)
   */
  static paraArgentina(id?: string, nombre?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.ARGENTINA, nombre);
  }

  /**
   * Crear ShoppingCart para España (IVA 21%)
   */
  static paraEspana(id?: string, nombre?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.ESPANA, nombre);
  }

  /**
   * Crear ShoppingCart sin impuestos
   */
  static sinImpuestos(id?: string, nombre?: string): ShoppingCart {
    return new ShoppingCart(id, CONFIGURACIONES_FISCALES.SIN_IMPUESTOS, nombre);
  }

  /**
   * Crear ShoppingCart con configuración personalizada
   */
  static conConfiguracion(configuracion: ConfiguracionFiscal, id?: string, nombre?: string): ShoppingCart {
    return new ShoppingCart(id, configuracion, nombre);
  }

  /**
   * Crear ShoppingCart para cualquier país disponible
   */
  static paraPais(pais: keyof typeof CONFIGURACIONES_FISCALES, id?: string, nombre?: string): ShoppingCart {
    const config = CONFIGURACIONES_FISCALES[pais];
    if (typeof config === 'function') {
      throw new Error(`Use ShoppingCart.personalizado() para configuraciones personalizadas`);
    }
    return new ShoppingCart(id, config, nombre);
  }

  /**
   * Crear ShoppingCart con tasa personalizada
   */
  static personalizado(tasaImpuesto: number, nombreImpuesto: string = 'Impuesto', id?: string, nombre?: string): ShoppingCart {
    const config = CONFIGURACIONES_FISCALES.PERSONALIZADO(tasaImpuesto, nombreImpuesto);
    return new ShoppingCart(id, config, nombre);
  }
}