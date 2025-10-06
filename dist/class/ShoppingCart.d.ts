/**
 * Entidad ShoppingCart - Encapsula toda la lógica de una venta en curso
 * Reutilizable para cualquier sistema POS
 * Simplificada: usa solo CarItem con congelación automática al guardar
 */
import { IProducto, MetodoPago } from "@/interfaces";
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
    product: IProducto;
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
export declare enum ProcedenciaVenta {
    Tienda = "Tienda",
    Web = "Web",
    WhatsApp = "WhatsApp",
    Instagram = "Instagram",
    Facebook = "Facebook"
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
export declare class ShoppingCart implements IShoppingCart {
    readonly id: string;
    readonly createdAt: Date;
    readonly nombre: string;
    private _items;
    private _notas?;
    updatedAt: Date;
    private _configuracionFiscal;
    private _cliente?;
    private _personal?;
    private _clienteColor?;
    private _metodoPago?;
    private _dineroRecibido?;
    private _procedencia?;
    private _esPedido?;
    private _finanzaId?;
    constructor(id?: string, configuracionFiscal?: ConfiguracionFiscal, nombre?: string, createdAt?: Date);
    /**
     * Configurar impuesto (IGV, IVA, etc.)
     */
    configurarImpuesto(configuracion: ConfiguracionFiscal): void;
    /**
     * Habilitar impuesto con tasa específica
     */
    habilitarImpuesto(tasa: number, nombre?: string): void;
    /**
     * Deshabilitar impuesto
     */
    deshabilitarImpuesto(): void;
    /**
     * Agregar o actualizar un CarItem en la venta
     */
    agregarProducto(carItem: CarItem, opciones?: OpcionesAgregarProducto): void;
    /**
     * Actualizar un ítem existente
     */
    private actualizarItemExistente;
    /**
     * Agregar nuevo ítem
     */
    private agregarNuevoItem;
    /**
     * Calcular monto total de un ítem
     */
    private calcularTotalLinea;
    /**
     * Verificar si un producto es pesable
     */
    private esProductoPesable;
    /**
     * Incrementar cantidad de un producto
     */
    incrementarCantidad(id: string, stepKg?: number): boolean;
    /**
     * Decrementar cantidad de un producto
     */
    decrementarCantidad(id: string, stepKg?: number): boolean;
    /**
     * Eliminar un ítem por ID
     */
    eliminarItem(itemId: string): boolean;
    /**
     * Aplicar descuento a un ítem específico
     */
    aplicarDescuento(itemId: string, descuento: number): boolean;
    /**
     * Recalcular monto de un ítem con nueva cantidad
     */
    private recalcularMontoItem;
    /**
     * Limpiar toda la venta
     */
    limpiar(): void;
    /**
     * Calcular subtotal (suma de todos los montos)
     */
    get subtotal(): number;
    /**
     * Calcular descuento total
     */
    get descuentoTotal(): number;
    /**
     * Calcular impuesto
     */
    get impuesto(): number;
    /**
     * Calcular total final
     */
    get total(): number;
    /**
     * Calcular cambio a devolver
     */
    calcularCambio(dineroRecibido: number): number;
    get items(): CarItem[];
    get cantidadItems(): number;
    get cantidadTotal(): number;
    get estaVacia(): boolean;
    get notas(): string | undefined;
    set notas(value: string | undefined);
    get tasaImpuesto(): number;
    set tasaImpuesto(tasa: number);
    get cliente(): Cliente | undefined;
    set cliente(value: Cliente | undefined);
    get personal(): Personal | undefined;
    set personal(value: Personal | undefined);
    get clienteColor(): string | undefined;
    set clienteColor(value: string | undefined);
    get clienteId(): string | undefined;
    get personalId(): string | undefined;
    /**
     * Configurar información de trazabilidad
     */
    configurarTrazabilidad(datos: {
        cliente?: Cliente;
        personal?: Personal;
        clienteColor?: string;
    }): void;
    /**
     * Configurar información de trazabilidad por IDs (método de compatibilidad)
     * @deprecated Usar configurarTrazabilidad con objetos completos
     */
    configurarTrazabilidadPorIds(datos: {
        clienteId?: string;
        personalId?: string;
        clienteColor?: string;
    }): void;
    get metodoPago(): MetodoPago | undefined;
    set metodoPago(value: MetodoPago | undefined);
    get dineroRecibido(): number | undefined;
    set dineroRecibido(value: number | undefined);
    get procedencia(): ProcedenciaVenta | undefined;
    set procedencia(value: ProcedenciaVenta | undefined);
    get esPedido(): boolean | undefined;
    set esPedido(value: boolean | undefined);
    get finanzaId(): string | undefined;
    set finanzaId(value: string | undefined);
    /**
     * Configurar datos de pago
     */
    configurarPago(datos: {
        metodoPago?: MetodoPago;
        dineroRecibido?: number;
        procedencia?: ProcedenciaVenta;
        esPedido?: boolean;
        finanzaId?: string;
    }): void;
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
    }): void;
    /**
     * Desmarcar como pedido y convertir a venta normal
     */
    convertirAVentaNormal(): void;
    /**
     * Verificar si la venta es un pedido
     */
    get esUnPedido(): boolean;
    /**
     * Verificar si algún item individual es un pedido
     */
    get tieneItemsPedido(): boolean;
    /**
     * Obtener solo los items que son pedidos
     */
    get itemsPedido(): CarItem[];
    /**
     * Obtener solo los items que NO son pedidos
     */
    get itemsVentaNormal(): CarItem[];
    /**
     * Marcar un item específico como pedido
     */
    marcarItemComoPedido(itemId: string, esPedido?: boolean): boolean;
    /**
     * Calcular totales separados entre pedidos y venta normal
     */
    get totalesSeparados(): {
        pedidos: {
            subtotal: number;
            impuesto: number;
            total: number;
            items: number;
        };
        ventaNormal: {
            subtotal: number;
            impuesto: number;
            total: number;
            items: number;
        };
    };
    /**
     * Obtener configuración fiscal actual
     */
    get configuracionFiscal(): ConfiguracionFiscal;
    /**
     * Obtener resumen completo de la venta
     */
    get resumen(): {
        cantidadItems: number;
        cantidadTotal: number;
        subtotal: number;
        descuentoTotal: number;
        impuesto: number;
        total: number;
    };
    /**
     * Buscar ítem por ID de producto
     */
    buscarPorProducto(productId: string): CarItem | undefined;
    /**
     * Buscar ítem por ID único
     */
    buscarPorId(itemId: string): CarItem | undefined;
    /**
     * Validar si la venta puede procesarse
     */
    puedeProcesarse(): boolean;
    /**
     * Serializar para persistencia en base de datos
     * CONGELA los CarItems tal como están (datos inmutables)
     */
    toJSON(): IShoppingCart;
    /**
     * Crear instancia desde JSON (para cargar desde base de datos)
     */
    static fromJSON(data: any): ShoppingCart;
    /**
     * Obtener todos los items como CarItems (ya son CarItems)
     */
    getItemsAsCarItems(): CarItem[];
    /**
     * Crear ShoppingCart para Perú (IGV 18%)
     */
    static paraPeru(id?: string, nombre?: string): ShoppingCart;
    /**
     * Crear ShoppingCart para México (IVA 16%)
     */
    static paraMexico(id?: string, nombre?: string): ShoppingCart;
    /**
     * Crear ShoppingCart para Colombia (IVA 19%)
     */
    static paraColombia(id?: string, nombre?: string): ShoppingCart;
    /**
     * Crear ShoppingCart para Argentina (IVA 21%)
     */
    static paraArgentina(id?: string, nombre?: string): ShoppingCart;
    /**
     * Crear ShoppingCart para España (IVA 21%)
     */
    static paraEspana(id?: string, nombre?: string): ShoppingCart;
    /**
     * Crear ShoppingCart sin impuestos
     */
    static sinImpuestos(id?: string, nombre?: string): ShoppingCart;
    /**
     * Crear ShoppingCart con configuración personalizada
     */
    static conConfiguracion(configuracion: ConfiguracionFiscal, id?: string, nombre?: string): ShoppingCart;
    /**
     * Crear ShoppingCart para cualquier país disponible
     */
    static paraPais(pais: keyof typeof CONFIGURACIONES_FISCALES, id?: string, nombre?: string): ShoppingCart;
    /**
     * Crear ShoppingCart con tasa personalizada
     */
    static personalizado(tasaImpuesto: number, nombreImpuesto?: string, id?: string, nombre?: string): ShoppingCart;
}
