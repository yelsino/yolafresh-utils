"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VentaCalculator = exports.Venta = void 0;
exports.getVentaItems = getVentaItems;
exports.getVentaItemsResumen = getVentaItemsResumen;
const utils_1 = require("../utils");
const ShoppingCart_1 = require("./ShoppingCart");
/**
 * Clase Venta - Maneja toda la lógica de una venta finalizada
 *
 * 🎯 Características:
 * - ❄️ Inmutable después de creación (para auditoría)
 * - 🛒 Carrito completo congelado en detalleVenta
 * - 🔍 Métodos para acceder a datos sin romper encapsulación
 * - 📊 Cálculos automáticos y validaciones
 */
class Venta {
    constructor(data) {
        this.type = 'venta';
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
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        // ⭐ Congelar el carrito para inmutabilidad
        // Crear instancia de ShoppingCart para usar sus métodos nativos
        const shoppingCartInstance = ShoppingCart_1.ShoppingCart.fromJSON(data.detalleVenta);
        this.detalleVenta = Object.freeze(shoppingCartInstance.toJSON());
        this.subtotal = data.subtotal;
        this.impuesto = data.impuesto;
        this.total = data.total;
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
    get items() {
        return this.detalleVenta.items;
    }
    /**
     * Obtener cantidad total de items
     */
    get cantidadItems() {
        return this.detalleVenta.cantidadItems;
    }
    /**
     * Obtener cantidad total de productos
     */
    get cantidadTotal() {
        return this.detalleVenta.cantidadTotal;
    }
    /**
     * Verificar si es una venta procesada/finalizada
     */
    get estaProcesada() {
        return this.estado === utils_1.OrderState.DESPACHADO;
    }
    /**
     * Verificar si es una lista pendiente
     */
    get esPendiente() {
        return this.estado === utils_1.OrderState.PENDIENTE;
    }
    /**
     * Verificar si la venta es un pedido
     */
    get esUnPedido() {
        return this.esPedido === true || this.detalleVenta.esPedido === true;
    }
    /**
     * Verificar si tiene items marcados como pedido
     */
    get tieneItemsPedido() {
        return this.items.some(item => item.esPedido === true);
    }
    /**
     * Obtener solo los items que son pedidos
     */
    get itemsPedido() {
        return this.items.filter(item => item.esPedido === true);
    }
    /**
     * Obtener solo los items que NO son pedidos
     */
    get itemsVentaNormal() {
        return this.items.filter(item => item.esPedido !== true);
    }
    /**
     * Verificar si tiene finanza asociada
     */
    get tieneFinanzaAsociada() {
        return this.finanzaId !== undefined && this.finanzaId !== null && this.finanzaId.trim() !== '';
    }
    /**
     * Verificar si requiere finanza (es pedido pero no tiene finanza)
     */
    get requiereFinanza() {
        return this.esUnPedido && !this.tieneFinanzaAsociada;
    }
    /**
     * Obtener resumen de la venta
     */
    get resumen() {
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
    buscarItemPorProducto(productId) {
        return this.items.find(item => item.product.id === productId);
    }
    /**
     * Buscar item por ID único del item
     */
    buscarItemPorId(itemId) {
        return this.items.find(item => item.id === itemId);
    }
    /**
     * Obtener productos únicos (sin repetir)
     */
    get productosUnicos() {
        const productosMap = new Map();
        this.items.forEach(item => {
            const productId = item.product.id;
            if (productosMap.has(productId)) {
                const existing = productosMap.get(productId);
                existing.cantidadTotal += item.quantity;
                existing.montoTotal += item.montoTotal || 0;
            }
            else {
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
    toPouchDB() {
        return {
            _id: this.id,
            type: this.type,
            nombre: this.nombre,
            estado: this.estado,
            fechaCreacion: this.createdAt.toISOString(),
            fechaActualizacion: this.updatedAt.toISOString(),
            detalleVenta: this.detalleVenta,
            subtotal: this.subtotal,
            impuesto: this.impuesto,
            total: this.total,
            procedencia: this.procedencia,
            tipoPago: this.tipoPago,
            // IDs de trazabilidad
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
    /**
     * Convertir a JSON para APIs externas
     */
    toJSON() {
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
     * Crear Venta desde datos de PouchDB
     */
    static fromPouchDB(doc) {
        return new Venta({
            id: doc._id,
            nombre: doc.nombre,
            type: doc.type || 'venta',
            estado: doc.estado,
            createdAt: doc.fechaCreacion ? new Date(doc.fechaCreacion) : new Date(),
            updatedAt: doc.fechaActualizacion ? new Date(doc.fechaActualizacion) : new Date(),
            detalleVenta: doc.detalleVenta,
            subtotal: doc.subtotal,
            impuesto: doc.impuesto,
            total: doc.total,
            procedencia: doc.procedencia,
            tipoPago: doc.tipoPago,
            // IDs de trazabilidad
            clienteId: doc.clienteId,
            vendedorId: doc.vendedorId,
            finanzaId: doc.finanzaId,
            // Campos de trazabilidad adicionales
            codigoVenta: doc.codigoVenta,
            numeroVenta: doc.numeroVenta,
            costoEnvio: doc.costoEnvio,
            esPedido: doc.esPedido
        });
    }
    /**
     * Crear Venta desde IShoppingCart (para procesar pago)
     */
    static fromShoppingCart(carritoJSON, id, options) {
        var _a, _b;
        const ahora = new Date();
        // Si se proporciona configuestra fiscal, recalcular el impuesto
        let impuestoFinal = carritoJSON.impuesto;
        let totalFinal = carritoJSON.total;
        if (carritoJSON.configuracionFiscal) {
            const { tasaImpuesto, aplicaImpuesto } = carritoJSON.configuracionFiscal;
            if (aplicaImpuesto && tasaImpuesto !== undefined) {
                const baseImponible = carritoJSON.subtotal;
                impuestoFinal = Math.round(baseImponible * tasaImpuesto * 100) / 100;
                totalFinal = Math.round((carritoJSON.subtotal + impuestoFinal) * 100) / 100;
            }
            else if (!aplicaImpuesto) {
                impuestoFinal = 0;
                totalFinal = Math.round(carritoJSON.subtotal * 100) / 100;
            }
        }
        return new Venta({
            id: id,
            nombre: (_b = (_a = options === null || options === void 0 ? void 0 : options.nombre) !== null && _a !== void 0 ? _a : carritoJSON.nombre) !== null && _b !== void 0 ? _b : 'Venta',
            type: 'venta',
            estado: utils_1.OrderState.DESPACHADO,
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
            procedencia: carritoJSON.procedencia || ShoppingCart_1.ProcedenciaVenta.Tienda,
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
    static validar(data) {
        var _a, _b, _c, _d;
        const errores = [];
        if (!data.id)
            errores.push('ID es requerido');
        if (!data.nombre)
            errores.push('Nombre es requerido');
        if (!data.detalleVenta)
            errores.push('detalleVenta es requerido');
        if (!((_b = (_a = data.detalleVenta) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length))
            errores.push('La venta debe tener al menos un item');
        if ((data.total || 0) <= 0)
            errores.push('El total debe ser mayor a 0');
        if (!data.procedencia)
            errores.push('Procedencia es requerida');
        // Validaciones opcionales para campos de trazabilidad
        if (data.costoEnvio !== undefined && data.costoEnvio < 0) {
            errores.push('El costo de envío no puede ser negativo');
        }
        // Validaciones específicas para pedidos
        if (data.esPedido === true) {
            if (!data.clienteId && !((_c = data.detalleVenta) === null || _c === void 0 ? void 0 : _c.clienteId) && !((_d = data.detalleVenta) === null || _d === void 0 ? void 0 : _d.cliente)) {
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
}
exports.Venta = Venta;
/**
 * Helper para obtener items de una venta (compatibilidad con código existente)
 * @deprecated Usar venta.items directamente
 */
function getVentaItems(venta) {
    var _a;
    return ((_a = venta.detalleVenta) === null || _a === void 0 ? void 0 : _a.items) || [];
}
/**
 * Helper para obtener resumen de items
 * @deprecated Usar venta.productosUnicos directamente
 */
function getVentaItemsResumen(venta) {
    const items = getVentaItems(venta);
    return items.map(item => ({
        id: item.id,
        nombre: item.product.nombre,
        cantidad: item.quantity,
        total: item.montoTotal || 0
    }));
}
/**
 * Clase utilitaria para cálculos de venta
 */
class VentaCalculator {
    /**
     * Calcula el subtotal de un ítem
     */
    static calcularSubtotalItem(item) {
        const precioUnitario = item.precioUnitario || item.product.precio;
        return precioUnitario * item.quantity;
    }
    /**
     * Calcula el total de un ítem (subtotal - descuento)
     */
    static calcularTotalItem(item) {
        const subtotal = this.calcularSubtotalItem(item);
        return subtotal - (item.descuento || 0);
    }
    /**
     * Calcula el subtotal de una venta (suma de subtotales)
     */
    static calcularSubtotalVenta(items) {
        return items.reduce((sum, item) => sum + this.calcularSubtotalItem(item), 0);
    }
    /**
     * Calcula el total de una venta
     */
    static calcularTotalVenta(items, impuesto = 0) {
        const subtotal = this.calcularSubtotalVenta(items);
        return subtotal + impuesto;
    }
}
exports.VentaCalculator = VentaCalculator;
