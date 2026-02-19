/**
 * Entidad ShoppingCart - Encapsula toda la lógica de una venta en curso
 * Reutilizable para cualquier sistema POS
 * Simplificada: usa solo CarItem con congelación automática al guardar
 */

import { IProducto, MetodoPago, TipoVentaEnum } from "@/interfaces";
import { Cliente } from "@/interfaces/persons";
import { IUsuario } from "@/interfaces/usuario";
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
  product: IProducto;
  
  /** 
   * Cantidad en la unidad base del producto
   * - Si el producto es por unidad → 3
   * - Si es por kg → 1.75
   * - Si es por litro → 0.5
   * @description Representa la cantidad física real (unidades o peso)
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
   * @description Cuando es true, el precio unitario se ajusta para coincidir con el total
   */
  montoModificado?: boolean;
  
  /** 
   * Monto total a pagar por este ítem
   * @description Siempre debe ser coherente con quantity y precioUnitario
   * @minimum 0
   */
  montoTotal?: number | null;
  
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
  /**
   * Indica si se debe agrupar con items existentes (sumar cantidad)
   * Default: true
   * Si es false, crea un nuevo item separado aunque sea el mismo producto
   */
  agrupar?: boolean;
}



export enum ProcedenciaVenta {
  Tienda = 'Tienda',
  Web = 'Web',
  WhatsApp = 'WhatsApp',
  Instagram = 'Instagram',
  Facebook = 'Facebook'
}



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
  createdAt: Date;
  updatedAt: Date;
  
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
  personal?: IUsuario;
  
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
  metodoPago?: MetodoPago;
  
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
  public readonly createdAt: Date;
  public readonly nombre: string;
  private _items: CarItem[] = [];
  private _notas?: string;
  public updatedAt: Date = new Date(); 
  private _configuracionFiscal: ConfiguracionFiscal;
  
  // === CAMPOS DE TRAZABILIDAD ===
  private _cliente?: Cliente;
  private _personal?: IUsuario;
  private _clienteColor?: string;
  
  // === DATOS DE PAGO ===
  private _metodoPago?: MetodoPago;
  private _dineroRecibido?: number;
  private _procedencia?: ProcedenciaVenta;
  private _esPedido?: boolean;
  private _finanzaId?: string;

  constructor(id?: string, configuracionFiscal?: ConfiguracionFiscal, nombre?: string, createdAt?: Date) {
    this.id = id || `venta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.createdAt = createdAt || new Date();
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
  /**
   * Agregar o actualizar un CarItem en la venta
   */
  agregarProducto(carItem: CarItem, opciones: OpcionesAgregarProducto = {}): void {
    const { replaceCompletely = false, itemId, fromSelection = false, agrupar = true } = opciones;

    // Generar ID único para el nuevo ítem si no existe
    const nuevoItemId = carItem.id || `${carItem.product.id}-${Date.now()}`;

    // Buscar ítem existente SOLO por itemId para evitar colisiones
    let itemExistente: CarItem | undefined = undefined;
    if (replaceCompletely && itemId) {
      itemExistente = this._items.find(item => item.id === itemId);
    } else if (!replaceCompletely && agrupar) {
      // Si no es reemplazo completo Y se permite agrupar, buscar si ya existe el mismo producto
      // Se usa el ID del producto para agrupar
      itemExistente = this._items.find(item => item.product.id === carItem.product.id);
    }

    // Procesar según el caso
    if (itemExistente) {
      this.actualizarItemExistente(itemExistente, carItem);
    } else {
      this.agregarNuevoItem(carItem, nuevoItemId);
    }
  }

  /**
   * Helper para agregar un producto como una línea separada.
   * Útil cuando el cliente quiere el mismo producto en bolsas distintas.
   */
  agregarProductoSeparado(carItem: CarItem): void {
    this.agregarProducto(carItem, { agrupar: false });
  }

  /**
   * Redondear monto monetario a 2 decimales con regla de 0.10 (Perú)
   */
  private redondearMoneda(monto: number): number {
    // Primero redondear a 2 decimales estándar para evitar errores de punto flotante
    const base = Math.round(monto * 100) / 100;
    
    // Obtener la parte decimal
    const decimales = Math.round((base % 1) * 100);
    const ultimoDigito = decimales % 10;
    
    // Si termina en 0 o 5, ya está redondeado
    if (ultimoDigito === 0) return base;
    
    // Lógica de redondeo al 0.10 más cercano (o 0.05 si prefieres esa granularidad)
    // Aquí implementamos al 0.10 más cercano que es común en POS físicos
    // Ojo: Si quieres mantener el 0.05 (18.45 -> 18.50 es implícito si redondeas al 0.10 superior o 0.05)
    
    // Para el caso específico que pides: 18.45 -> 18.50
    // Esto sugiere redondeo al 0.10 superior si termina en 5?
    // O simplemente redondeo estándar matemático al 0.10?
    // 18.44 -> 18.40
    // 18.46 -> 18.50
    // 18.45 -> 18.50 (Round half up)
    
    return Math.round(base * 10) / 10;
  }

  /**
   * Actualizar un ítem existente
   */
  private actualizarItemExistente(itemExistente: CarItem, carItem: CarItem): void {
    const unit = Number(carItem.precioUnitario ?? carItem.product.precioVenta) || 0;

    // Calcular nueva cantidad base
    const nuevaCantidad = Number(carItem.quantity ?? 0) + Number(itemExistente.quantity ?? 0);

    const prepared: CarItem = {
      ...itemExistente,
      id: itemExistente.id,
      // Actualizar info del producto si viene nueva, pero limpia
      product: this.cleanProduct(carItem.product || itemExistente.product), 
      
      quantity: nuevaCantidad,
      precioUnitario: unit,
      montoModificado: !!carItem.montoModificado,
      
      descuento: carItem.descuento ?? (itemExistente as any).descuento
    } as CarItem;

    // Calcular total y consistencia
    if (prepared.montoModificado && carItem.montoTotal != null) {
      // Si el monto fue forzado manualmente
      prepared.montoTotal = this.redondearMoneda(carItem.montoTotal);
      // Recalcular unitario implícito: Unitario = Total / Cantidad
      if (prepared.quantity > 0) {
        prepared.precioUnitario = prepared.montoTotal / prepared.quantity;
      }
    } else {
      // Cálculo estándar: Total = Unitario * Cantidad
      const montoCalculado = this.calcularTotalLinea(prepared);
      prepared.montoTotal = this.redondearMoneda(montoCalculado);
    }

    const index = this._items.findIndex(item => item.id === itemExistente.id);
    if (index !== -1) {
      this._items[index] = prepared;
    }
  }

  /**
   * Agregar nuevo ítem
   */
  private agregarNuevoItem(carItem: CarItem, itemId: string): void {
    const unit = Number(carItem.precioUnitario ?? carItem.product.precioVenta) || 0;

    const prepared: CarItem = {
      id: itemId,
      product: this.cleanProduct(carItem.product), // Limpiar producto al agregar
      quantity: Number(carItem.quantity ?? 1),
      precioUnitario: unit,
      montoModificado: !!carItem.montoModificado,
      descuento: carItem.descuento
    } as CarItem;

    if (prepared.montoModificado && carItem.montoTotal != null) {
      prepared.montoTotal = this.redondearMoneda(carItem.montoTotal);
      if (prepared.quantity > 0) {
        prepared.precioUnitario = prepared.montoTotal / prepared.quantity;
      }
    } else {
      const montoCalculado = this.calcularTotalLinea(prepared);
      prepared.montoTotal = this.redondearMoneda(montoCalculado);
    }

    // Actualizar el ítem pasado por referencia
    if (carItem !== prepared) {
        carItem.montoTotal = prepared.montoTotal;
        carItem.precioUnitario = prepared.precioUnitario;
    }

    this._items.push(prepared);
  }

  /**
   * Calcular monto total de un ítem
   */
  private calcularTotalLinea(carItem: CarItem): number {
    // Respetar overrides manuales
    if (carItem.montoModificado && carItem.montoTotal != null) {
      return this.redondearMoneda(Number(carItem.montoTotal));
    }

    const unit = carItem.precioUnitario ?? carItem.product.precioVenta;
    const qty = carItem.quantity ?? 0;
    
    // Cálculo directo: Precio * Cantidad (cantidad ya es kg o unidad)
    const base = unit * qty;
    
    return this.redondearMoneda(base);
  }


  // **MÉTODOS DE MANIPULACIÓN DE ITEMS**

  /**
   * Incrementar cantidad de un producto
   */
  incrementarCantidad(id: string, stepKg: number = 0.1): boolean {
    const index = this.buscarIndexPorId(id);
    if (index === -1) return false;

    const item = this._items[index];
    const itemTipoVenta = item.product.tipoVenta; // Usar siempre la definición del producto
    const esPesable = itemTipoVenta === TipoVentaEnum.Peso || itemTipoVenta === TipoVentaEnum.Volumen;

    let nuevaCantidad = item.quantity;

    if (esPesable) {
      // Si es pesable, sumar 0.1 (o stepKg)
      nuevaCantidad = (item.quantity ?? 0) + stepKg;
      // Redondear a 3 decimales para evitar floating point issues (ej. 1.200000001)
      nuevaCantidad = Math.round(nuevaCantidad * 1000) / 1000;
    } else {
      // Si es unidad, sumar 1
      nuevaCantidad = (item.quantity ?? 0) + 1;
    }

    this.actualizarCantidadItem(index, nuevaCantidad);
    return true;
  }

  /**
   * Decrementar cantidad de un producto
   */
  decrementarCantidad(id: string, stepKg: number = 0.1): boolean {
    const index = this.buscarIndexPorId(id);
    if (index === -1) return false;

    const item = this._items[index];
    const itemTipoVenta = item.product.tipoVenta;
    const esPesable = itemTipoVenta === TipoVentaEnum.Peso || itemTipoVenta === TipoVentaEnum.Volumen;

    let nuevaCantidad = item.quantity;
    let debeEliminar = false;

    if (esPesable) {
      nuevaCantidad = (item.quantity ?? 0) - stepKg;
      nuevaCantidad = Math.round(nuevaCantidad * 1000) / 1000;
      if (nuevaCantidad <= 0.001) debeEliminar = true; 
    } else {
      nuevaCantidad = (item.quantity ?? 0) - 1;
      if (nuevaCantidad < 1) debeEliminar = true;
    }

    if (debeEliminar) {
      this._items.splice(index, 1);
      return true;
    }

    this.actualizarCantidadItem(index, nuevaCantidad);
    return true;
  }

  // Helper privado para buscar index (dry)
  private buscarIndexPorId(id: string): number {
    let index = this._items.findIndex(item => item.id === id);
    if (index === -1) {
      index = this._items.findIndex(item => item.product.id === id);
    }
    return index;
  }

  // Helper privado para actualizar cantidad y recalcular
  private actualizarCantidadItem(index: number, nuevaCantidad: number): void {
    const item = this._items[index];
    const updated: CarItem = { ...item, quantity: nuevaCantidad };
    
    // Si tiene monto modificado, NO recalculamos el total, pero ajustamos el unitario para mantener coherencia
    // OJO: Decisión de diseño: ¿Si cambio cantidad manualmente, debo mantener el TOTAL fijo o el UNITARIO fijo?
    // Regla estándar: El Unitario es la verdad si no está modificado. 
    // Pero si montoModificado es true...
    
    if (updated.montoModificado) {
        // Opción A: Mantener TOTAL fijo => unitario cambia (Raro si aumento cantidad)
        // Opción B: Mantener UNITARIO (que fue derivado) fijo => total cambia.
        
        // En lógica de POS, si subo cantidad de 1 coca a 2 cocas, espero pagar el doble.
        // Así que usamos el precioUnitario actual (que puede ser custom) para recalcular el total.
        updated.montoTotal = this.redondearMoneda((updated.precioUnitario || 0) * nuevaCantidad);
        
        // Pero si quisiéramos mantener el total fijo y solo cambiar cantidad (ej: "te doy 2kg por el precio de 1kg")
        // eso sería otra operación. Asumiremos consistencia unitaria por defecto al cambiar cantidades con +/-.
    } else {
        updated.montoTotal = this.calcularTotalLinea(updated);
    }

    this._items[index] = updated;
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
    return this.redondearMoneda(baseImponible * (this._configuracionFiscal.tasaImpuesto || 0));
  }

  /**
   * Calcular total final
   */
  get total(): number {
    return this.redondearMoneda(this.subtotal - this.descuentoTotal + this.impuesto);
  }

  /**
   * Calcular cambio a devolver
   */
  calcularCambio(dineroRecibido: number): number {
    return Math.max(0, this.redondearMoneda(dineroRecibido - this.total));
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

  get personal(): IUsuario | undefined {
    return this._personal;
  }

  set personal(value: IUsuario | undefined) {
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
    personal?: IUsuario;
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

  get metodoPago(): MetodoPago | undefined {
    return this._metodoPago;
  }

  set metodoPago(value: MetodoPago | undefined) {
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
    metodoPago?: MetodoPago;
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
      ? this.redondearMoneda(subtotalPedidos * (this._configuracionFiscal.tasaImpuesto || 0))
      : 0;
    
    const impuestoVentaNormal = this._configuracionFiscal.aplicaImpuesto 
      ? this.redondearMoneda(subtotalVentaNormal * (this._configuracionFiscal.tasaImpuesto || 0))
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
      createdAt: this.createdAt, // mantener Date para estructura interna
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
      updatedAt: this.updatedAt,
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

    // Restaurar fecha original si existe en los datos
    const createdAt = data.createdAt ? new Date(data.createdAt) : undefined;

    const carrito = new ShoppingCart(data.id, configuracionFiscal, data.nombre, createdAt);
    carrito.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

    // MIGRACIÓN ON-THE-FLY y Limpieza de Items
    const itemsRaw = data.items || [];
    
    carrito._items = itemsRaw.map((item: any) => {
        // REGLA DE MIGRACIÓN: Si existe 'peso', pasarlo a 'quantity'
        if (item.peso !== undefined && item.peso !== null && typeof item.peso === 'number' && item.peso > 0) {
             // Solo si es un producto tipo peso según su definición original o inferida
             // Pero ante la duda, si tiene peso explícito, es la cantidad real
             item.quantity = item.peso;
        }

        // LIMPIEZA: Eliminar campos obsoletos del objeto en memoria
        delete item.peso;
        delete item.tipoVenta; // carItem ya no tiene tipoVenta

        // Asegurar consistencia numérica básica
        item.montoModificado = !!item.montoModificado;
        item.precioUnitario = Number(item.precioUnitario) || 0;
        item.quantity = Number(item.quantity) || 0;
        item.montoTotal = Number(item.montoTotal) || 0;

        return item as CarItem; // Ya cumple la interfaz nueva
    });

    carrito._notas = data.notas;

    // Trazabilidad
    carrito._cliente = data.cliente
    carrito._personal = data.personal
    carrito._clienteColor = data.clienteColor;

    // Datos de pago
    carrito._metodoPago = data.metodoPago;
    carrito._dineroRecibido = data.dineroRecibido;
    carrito._procedencia = data.procedencia;
    carrito._esPedido = data.esPedido;
    carrito._finanzaId = data.finanzaId;

    return carrito;
  }

  /**
   * Obtener todos los items como CarItems (ya son CarItems)
   */
  getItemsAsCarItems(): CarItem[] {
    return [...this._items];
  }

  // **MÉTODOS ESTÁTICOS DE CÁLCULO Y VISUADIZACIÓN**

  /**
   * Calcula la cantidad necesaria para llegar a un monto específico
   * @example "Dame 3 soles de papa" -> 3.00 / 1.50 = 2.00 kg
   */
  static calcularCantidadDesdeMonto(producto: IProducto, montoObjetivo: number): number {
     const precio = producto.precioVenta;
     if (!precio || precio <= 0) return 0;
     
     // Cantidad = Monto / Precio
     const cantidad = montoObjetivo / precio;
     
     // Redondear a 3 decimales para evitar floating point issues
     return Math.round(cantidad * 1000) / 1000;
  }

  /**
   * Calcula el contenido total real para procesos de inventario o despacho
   * @example quantity=0.5 (sacos), contenidoNeto=60 (kg) -> Retorna 30.00 (kg)
   * @example quantity=2 (unidades), contenidoNeto=1 (unidad) -> Retorna 2.00 (unidades)
   */
  static calcularContenidoTotal(item: CarItem): number {
     const cantidad = item.quantity;
     const contenidoNeto = item.product.contenidoNeto || 1;
     
     const totalContenido = cantidad * contenidoNeto;
     
     // Redondear a 3 decimales para consistencia numérica
     return Math.round(totalContenido * 1000) / 1000;
  }

  // **MÉTODOS PRIVADOS DE UTILIDAD**

  /**
   * Limpia el objeto producto para guardar solo lo necesario
   * @description Elimina propiedades no serializables o innecesarias para reducir tamaño
   */
  private cleanProduct(producto: IProducto): IProducto {
    // Crear una copia limpia del producto
    const {
      // Propiedades a excluir explícitamente si existen y son pesadas/innecesarias
      descripcion,
      caracteristicas,
      consideraciones,
      keywords,
      createdAt,
      updatedAt,
      // Mantener el resto
      ...productData
    } = producto as any;

    // Asegurar que las URLs sean strings o el objeto ImageSizes mínimo
    let urlLimpia = productData.url;
    
    return {
      ...productData,
      url: urlLimpia,
      // Asegurar campos mínimos requeridos si se perdieron
      id: producto.id,
      nombre: producto.nombre
    } as IProducto;
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