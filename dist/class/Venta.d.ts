import { OrderState } from "@/utils";
import { CarItem, IShoppingCart, ProcedenciaVenta, TipoPagoVenta } from "./ShoppingCart";
/**
 * Interfaz para datos inmutables de una venta
 *
 * NOTA: Los items están en detalleVenta.items (carrito congelado)
 * No hay redundancia de datos - una sola fuente de verdad
 */
export interface IVenta {
    id: string;
    nombre: string;
    type: string;
    estado: OrderState;
    fechaCreacion?: Date;
    fechaActualizacion?: Date;
    detalleVenta: IShoppingCart;
    costoEnvio?: number;
    subtotal: number;
    impuesto: number;
    total: number;
    procedencia: ProcedenciaVenta;
    tipoPago?: TipoPagoVenta;
    clienteId?: string;
    vendedorId?: string;
    finanzaId?: string;
    codigoVenta?: string;
    numeroVenta?: string;
    esPedido?: boolean;
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
export declare class Venta implements IVenta {
    readonly id: string;
    readonly nombre: string;
    readonly type: string;
    readonly estado: OrderState;
    readonly fechaCreacion: Date;
    readonly fechaActualizacion: Date;
    readonly detalleVenta: IShoppingCart;
    readonly subtotal: number;
    readonly impuesto: number;
    readonly total: number;
    readonly procedencia: ProcedenciaVenta;
    readonly tipoPago?: TipoPagoVenta;
    readonly clienteId?: string;
    readonly vendedorId?: string;
    readonly finanzaId?: string;
    readonly codigoVenta?: string;
    readonly numeroVenta?: string;
    readonly costoEnvio?: number;
    readonly esPedido?: boolean;
    constructor(data: IVenta);
    /**
     * Obtener items de la venta (desde carrito congelado)
     */
    get items(): readonly CarItem[];
    /**
     * Obtener cantidad total de items
     */
    get cantidadItems(): number;
    /**
     * Obtener cantidad total de productos
     */
    get cantidadTotal(): number;
    /**
     * Verificar si es una venta procesada/finalizada
     */
    get estaProcesada(): boolean;
    /**
     * Verificar si es una lista pendiente
     */
    get esPendiente(): boolean;
    /**
     * Verificar si la venta es un pedido
     */
    get esUnPedido(): boolean;
    /**
     * Verificar si tiene items marcados como pedido
     */
    get tieneItemsPedido(): boolean;
    /**
     * Obtener solo los items que son pedidos
     */
    get itemsPedido(): readonly CarItem[];
    /**
     * Obtener solo los items que NO son pedidos
     */
    get itemsVentaNormal(): readonly CarItem[];
    /**
     * Verificar si tiene finanza asociada
     */
    get tieneFinanzaAsociada(): boolean;
    /**
     * Verificar si requiere finanza (es pedido pero no tiene finanza)
     */
    get requiereFinanza(): boolean;
    /**
     * Obtener resumen de la venta
     */
    get resumen(): {
        cantidadItems: number;
        cantidadTotal: number;
        subtotal: number;
        impuesto: number;
        total: number;
    };
    /**
     * Buscar item por ID de producto
     */
    buscarItemPorProducto(productId: string): CarItem | undefined;
    /**
     * Buscar item por ID único del item
     */
    buscarItemPorId(itemId: string): CarItem | undefined;
    /**
     * Obtener productos únicos (sin repetir)
     */
    get productosUnicos(): Array<{
        id: string;
        nombre: string;
        cantidadTotal: number;
        montoTotal: number;
    }>;
    /**
     * Convertir a objeto plano para guardar en DB
     */
    toPouchDB(): any;
    /**
     * Convertir a JSON para APIs externas
     */
    toJSON(): IVenta;
    /**
     * Crear Venta desde datos de PouchDB
     */
    static fromPouchDB(doc: any): Venta;
    /**
     * Crear Venta desde IShoppingCart (para procesar pago)
     */
    static fromShoppingCart(carritoJSON: IShoppingCart, id: string, options?: {
        nombre?: string;
    }): Venta;
    /**
     * Validar estructura de datos de venta
     */
    static validar(data: Partial<IVenta>): {
        valida: boolean;
        errores: string[];
    };
}
/**
 * Helper para obtener items de una venta (compatibilidad con código existente)
 * @deprecated Usar venta.items directamente
 */
export declare function getVentaItems(venta: IVenta): CarItem[];
/**
 * Helper para obtener resumen de items
 * @deprecated Usar venta.productosUnicos directamente
 */
export declare function getVentaItemsResumen(venta: IVenta): Array<{
    id: string;
    nombre: string;
    cantidad: number;
    total: number;
}>;
/**
 * Interfaz para ítems de venta con métodos de cálculo
 */
export interface ItemVenta extends CarItem {
    descuento?: number;
}
/**
 * Clase utilitaria para cálculos de venta
 */
export declare class VentaCalculator {
    /**
     * Calcula el subtotal de un ítem
     */
    static calcularSubtotalItem(item: ItemVenta): number;
    /**
     * Calcula el total de un ítem (subtotal - descuento)
     */
    static calcularTotalItem(item: ItemVenta): number;
    /**
     * Calcula el subtotal de una venta (suma de subtotales)
     */
    static calcularSubtotalVenta(items: ItemVenta[]): number;
    /**
     * Calcula el total de una venta
     */
    static calcularTotalVenta(items: ItemVenta[], impuesto?: number): number;
}
