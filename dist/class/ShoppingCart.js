"use strict";
/**
 * Entidad ShoppingCart - Encapsula toda la lógica de una venta en curso
 * Reutilizable para cualquier sistema POS
 * Simplificada: usa solo CarItem con congelación automática al guardar
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShoppingCart = exports.ProcedenciaVenta = void 0;
const utils_1 = require("../utils");
const fiscales_1 = require("../utils/fiscales");
var ProcedenciaVenta;
(function (ProcedenciaVenta) {
    ProcedenciaVenta["Tienda"] = "Tienda";
    ProcedenciaVenta["Web"] = "Web";
    ProcedenciaVenta["WhatsApp"] = "WhatsApp";
    ProcedenciaVenta["Instagram"] = "Instagram";
    ProcedenciaVenta["Facebook"] = "Facebook";
})(ProcedenciaVenta || (exports.ProcedenciaVenta = ProcedenciaVenta = {}));
/**
 * Clase ShoppingCart - Maneja toda la lógica de una venta en curso
 * Simplificada: trabaja solo con CarItem, congela al guardar
 */
class ShoppingCart {
    constructor(id, configuracionFiscal, nombre) {
        var _a, _b, _c;
        this._items = [];
        this.id = id || `venta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.fechaCreacion = new Date();
        this.nombre = nombre || `Carrito-${Date.now()}`;
        // Configuración fiscal por defecto (puede ser sobrescrita)
        this._configuracionFiscal = {
            tasaImpuesto: (_a = configuracionFiscal === null || configuracionFiscal === void 0 ? void 0 : configuracionFiscal.tasaImpuesto) !== null && _a !== void 0 ? _a : 0, // Por defecto SIN impuesto
            aplicaImpuesto: (_b = configuracionFiscal === null || configuracionFiscal === void 0 ? void 0 : configuracionFiscal.aplicaImpuesto) !== null && _b !== void 0 ? _b : false, // Por defecto NO aplica
            nombreImpuesto: (_c = configuracionFiscal === null || configuracionFiscal === void 0 ? void 0 : configuracionFiscal.nombreImpuesto) !== null && _c !== void 0 ? _c : 'Impuesto',
            ...configuracionFiscal
        };
    }
    // **MÉTODOS DE CONFIGURACIÓN FISCAL**
    /**
     * Configurar impuesto (IGV, IVA, etc.)
     */
    configurarImpuesto(configuracion) {
        this._configuracionFiscal = {
            ...this._configuracionFiscal,
            ...configuracion
        };
    }
    /**
     * Habilitar impuesto con tasa específica
     */
    habilitarImpuesto(tasa, nombre = 'IGV') {
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
    deshabilitarImpuesto() {
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
    agregarProducto(carItem, opciones = {}) {
        var _a;
        const { replaceCompletely = false, itemId, fromSelection = false } = opciones;
        // Generar ID único para el nuevo ítem
        const nuevoItemId = carItem.id || `${carItem.product.id}-${Date.now()}`;
        // Buscar ítem existente SOLO por itemId para evitar colisiones por productId
        let itemExistente = undefined;
        if (replaceCompletely && itemId) {
            itemExistente = this._items.find(item => item.id === itemId);
        }
        // Verificar si el producto es pesable considerando overrides en el item
        const esPesable = this.esProductoPesable(((_a = carItem.tipoVenta) !== null && _a !== void 0 ? _a : carItem.product.tipoVenta));
        // Procesar según el caso
        if (itemExistente && replaceCompletely && !fromSelection) {
            this.actualizarItemExistente(itemExistente, carItem, esPesable);
        }
        else {
            this.agregarNuevoItem(carItem, nuevoItemId, esPesable);
        }
    }
    /**
     * Actualizar un ítem existente
     */
    actualizarItemExistente(itemExistente, carItem, esPesable) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const unit = Number((_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : carItem.product.precio) || 0;
        // Compatibilidad legacy: si es pesable y no hay peso, pero quantity es decimal, interpretarlo como peso
        const legacyPeso = esPesable && (carItem.peso == null) && typeof carItem.quantity === 'number' && !Number.isInteger(carItem.quantity)
            ? Number(carItem.quantity)
            : undefined;
        const prepared = {
            ...itemExistente,
            id: itemExistente.id,
            product: carItem.product,
            // No normalizar quantity para pesables (preservar decimales). No pesables: entero >= 1
            quantity: esPesable
                ? (typeof carItem.quantity === 'number' ? carItem.quantity : ((_b = itemExistente.quantity) !== null && _b !== void 0 ? _b : 1))
                : Number((_d = (_c = carItem.quantity) !== null && _c !== void 0 ? _c : itemExistente.quantity) !== null && _d !== void 0 ? _d : 1),
            precioUnitario: unit,
            montoModificado: !!carItem.montoModificado,
            // tipoVenta preferentemente del item, sino del producto
            tipoVenta: ((_e = carItem.tipoVenta) !== null && _e !== void 0 ? _e : carItem.product.tipoVenta),
            // Peso solo para pesables; usar peso proporcionado o legacy
            peso: esPesable ? Number((_j = (_h = (_g = (_f = carItem.peso) !== null && _f !== void 0 ? _f : legacyPeso) !== null && _g !== void 0 ? _g : itemExistente.peso) !== null && _h !== void 0 ? _h : itemExistente.quantity) !== null && _j !== void 0 ? _j : 0) : undefined,
            descuento: (_k = carItem.descuento) !== null && _k !== void 0 ? _k : itemExistente.descuento
        };
        // Calcular total respetando overrides
        prepared.montoTotal = (prepared.montoModificado && carItem.montoTotal != null)
            ? carItem.montoTotal
            : this.calcularTotalLinea(prepared);
        const index = this._items.findIndex(item => item.id === itemExistente.id);
        if (index !== -1) {
            this._items[index] = prepared;
        }
    }
    /**
     * Agregar nuevo ítem
     */
    agregarNuevoItem(carItem, itemId, esPesable) {
        var _a, _b, _c, _d, _e, _f;
        const unit = Number((_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : carItem.product.precio) || 0;
        // Compatibilidad legacy: si es pesable y no hay peso, pero quantity es decimal, interpretarlo como peso
        const legacyPeso = esPesable && (carItem.peso == null) && typeof carItem.quantity === 'number' && !Number.isInteger(carItem.quantity)
            ? Number(carItem.quantity)
            : undefined;
        const prepared = {
            id: itemId,
            product: carItem.product,
            quantity: esPesable
                ? (typeof carItem.quantity === 'number' ? carItem.quantity : 1)
                : Number((_b = carItem.quantity) !== null && _b !== void 0 ? _b : 1),
            precioUnitario: unit,
            montoModificado: !!carItem.montoModificado,
            tipoVenta: ((_c = carItem.tipoVenta) !== null && _c !== void 0 ? _c : carItem.product.tipoVenta),
            peso: esPesable ? Number((_f = (_e = (_d = carItem.peso) !== null && _d !== void 0 ? _d : legacyPeso) !== null && _e !== void 0 ? _e : carItem.quantity) !== null && _f !== void 0 ? _f : 0) : undefined,
            descuento: carItem.descuento
        };
        prepared.montoTotal = (prepared.montoModificado && carItem.montoTotal != null)
            ? carItem.montoTotal
            : this.calcularTotalLinea(prepared);
        this._items.push(prepared);
    }
    /**
     * Calcular monto total de un ítem
     */
    calcularTotalLinea(carItem) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // Respetar overrides manuales
        if (carItem.montoModificado && carItem.montoTotal != null) {
            return Number(carItem.montoTotal);
        }
        const unit = Number((_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : ((_c = (_b = carItem.product) === null || _b === void 0 ? void 0 : _b.precio) !== null && _c !== void 0 ? _c : 0)) || 0;
        const esPesable = this.esProductoPesable(((_d = carItem.tipoVenta) !== null && _d !== void 0 ? _d : (_e = carItem.product) === null || _e === void 0 ? void 0 : _e.tipoVenta));
        const peso = esPesable ? Number((_g = (_f = carItem.peso) !== null && _f !== void 0 ? _f : carItem.quantity) !== null && _g !== void 0 ? _g : 0) : undefined;
        const qty = esPesable ? 0 : Math.max(0, Number((_h = carItem.quantity) !== null && _h !== void 0 ? _h : 0));
        const base = esPesable ? unit * (peso || 0) : unit * qty;
        return Math.round(base * 100) / 100;
    }
    /**
     * Verificar si un producto es pesable
     */
    esProductoPesable(tipoVenta) {
        const tiposPesables = [
            utils_1.TipoVentaEnum.Kilogramo,
            utils_1.TipoVentaEnum.Litro,
        ];
        return tiposPesables.includes(tipoVenta);
    }
    // **MÉTODOS DE MANIPULACIÓN DE ITEMS**
    /**
     * Incrementar cantidad de un producto
     */
    incrementarCantidad(id, stepKg = 0.1) {
        var _a, _b, _c, _d;
        // Buscar primero por itemId y luego por productId para compatibilidad
        let index = this._items.findIndex(item => item.id === id);
        if (index === -1) {
            index = this._items.findIndex(item => item.product.id === id);
        }
        if (index === -1)
            return false;
        const item = this._items[index];
        const esPesable = this.esProductoPesable(((_a = item.tipoVenta) !== null && _a !== void 0 ? _a : item.product.tipoVenta));
        const updated = { ...item };
        if (esPesable) {
            const currentPeso = Number((_c = (_b = item.peso) !== null && _b !== void 0 ? _b : item.quantity) !== null && _c !== void 0 ? _c : 0);
            const newPeso = currentPeso + stepKg;
            updated.peso = newPeso;
        }
        else {
            const currentQty = Number((_d = item.quantity) !== null && _d !== void 0 ? _d : 0);
            updated.quantity = currentQty + 1;
        }
        updated.montoTotal = item.montoModificado ? (item.montoTotal || 0) : this.calcularTotalLinea(updated);
        this._items[index] = updated;
        return true;
    }
    /**
     * Decrementar cantidad de un producto
     */
    decrementarCantidad(id, stepKg = 0.1) {
        var _a, _b, _c, _d;
        // Buscar primero por itemId y luego por productId para compatibilidad
        let index = this._items.findIndex(item => item.id === id);
        if (index === -1) {
            index = this._items.findIndex(item => item.product.id === id);
        }
        if (index === -1)
            return false;
        const item = this._items[index];
        const esPesable = this.esProductoPesable(((_a = item.tipoVenta) !== null && _a !== void 0 ? _a : item.product.tipoVenta));
        if (esPesable) {
            const currentPeso = Number((_c = (_b = item.peso) !== null && _b !== void 0 ? _b : item.quantity) !== null && _c !== void 0 ? _c : 0);
            const newPeso = currentPeso - stepKg;
            if (newPeso <= 0) {
                this._items.splice(index, 1);
                return true;
            }
            const updated = { ...item, peso: newPeso };
            updated.montoTotal = item.montoModificado ? (item.montoTotal || 0) : this.calcularTotalLinea(updated);
            this._items[index] = updated;
            return true;
        }
        else {
            const currentQty = Number((_d = item.quantity) !== null && _d !== void 0 ? _d : 0);
            const newQty = currentQty - 1;
            if (newQty <= 0) {
                this._items.splice(index, 1);
                return true;
            }
            const updated = { ...item, quantity: newQty };
            updated.montoTotal = item.montoModificado ? (item.montoTotal || 0) : this.calcularTotalLinea(updated);
            this._items[index] = updated;
            return true;
        }
    }
    /**
     * Eliminar un ítem por ID
     */
    eliminarItem(itemId) {
        const index = this._items.findIndex(item => item.id === itemId);
        if (index === -1)
            return false;
        this._items.splice(index, 1);
        return true;
    }
    /**
     * Aplicar descuento a un ítem específico
     */
    aplicarDescuento(itemId, descuento) {
        const index = this._items.findIndex(item => item.id === itemId);
        if (index === -1)
            return false;
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
    recalcularMontoItem(item, nuevaCantidad) {
        if (item.montoModificado) {
            return item.montoTotal || 0; // No recalcular si fue modificado manualmente
        }
        const precioUnitario = item.precioUnitario || item.product.precio;
        const esPesable = this.esProductoPesable(item.tipoVenta || item.product.tipoVenta);
        let montoSinRedondear;
        if (esPesable) {
            const nuevoPeso = item.peso ? (item.peso / item.quantity) * nuevaCantidad : nuevaCantidad;
            montoSinRedondear = precioUnitario * nuevoPeso;
        }
        else {
            montoSinRedondear = precioUnitario * nuevaCantidad;
        }
        return Math.round(montoSinRedondear * 100) / 100;
    }
    /**
     * Limpiar toda la venta
     */
    limpiar() {
        this._items = [];
        this._notas = undefined;
    }
    // **MÉTODOS DE CÁLCULO**
    /**
     * Calcular subtotal (suma de todos los montos)
     */
    get subtotal() {
        return this._items.reduce((sum, item) => sum + (item.montoTotal || 0), 0);
    }
    /**
     * Calcular descuento total
     */
    get descuentoTotal() {
        return this._items.reduce((sum, item) => {
            const descuento = item.descuento || 0;
            return sum + descuento;
        }, 0);
    }
    /**
     * Calcular impuesto
     */
    get impuesto() {
        if (!this._configuracionFiscal.aplicaImpuesto) {
            return 0;
        }
        const baseImponible = this.subtotal - this.descuentoTotal;
        return Math.round(baseImponible * (this._configuracionFiscal.tasaImpuesto || 0) * 100) / 100;
    }
    /**
     * Calcular total final
     */
    get total() {
        return Math.round((this.subtotal - this.descuentoTotal + this.impuesto) * 100) / 100;
    }
    /**
     * Calcular cambio a devolver
     */
    calcularCambio(dineroRecibido) {
        return Math.max(0, Math.round((dineroRecibido - this.total) * 100) / 100);
    }
    // **GETTERS Y SETTERS**
    get items() {
        return [...this._items];
    }
    get cantidadItems() {
        return this._items.length;
    }
    get cantidadTotal() {
        return this._items.reduce((sum, item) => sum + item.quantity, 0);
    }
    get estaVacia() {
        return this._items.length === 0;
    }
    get notas() {
        return this._notas;
    }
    set notas(value) {
        this._notas = value;
    }
    get tasaImpuesto() {
        return this._configuracionFiscal.tasaImpuesto || 0;
    }
    set tasaImpuesto(tasa) {
        this._configuracionFiscal.tasaImpuesto = Math.max(0, Math.min(1, tasa)); // Entre 0 y 1
    }
    // **GETTERS Y SETTERS DE TRAZABILIDAD**
    get cliente() {
        return this._cliente;
    }
    set cliente(value) {
        this._cliente = value;
    }
    get personal() {
        return this._personal;
    }
    set personal(value) {
        this._personal = value;
    }
    get clienteColor() {
        return this._clienteColor;
    }
    set clienteColor(value) {
        this._clienteColor = value;
    }
    // **GETTERS DE COMPATIBILIDAD (para IDs)**
    get clienteId() {
        var _a;
        return (_a = this._cliente) === null || _a === void 0 ? void 0 : _a.id;
    }
    get personalId() {
        var _a;
        return (_a = this._personal) === null || _a === void 0 ? void 0 : _a.id;
    }
    /**
     * Configurar información de trazabilidad
     */
    configurarTrazabilidad(datos) {
        this._cliente = datos.cliente;
        this._personal = datos.personal;
        this._clienteColor = datos.clienteColor;
    }
    /**
     * Configurar información de trazabilidad por IDs (método de compatibilidad)
     * @deprecated Usar configurarTrazabilidad con objetos completos
     */
    configurarTrazabilidadPorIds(datos) {
        var _a, _b;
        // Este método mantiene compatibilidad pero se recomienda usar objetos completos
        if (datos.clienteId && ((_a = this._cliente) === null || _a === void 0 ? void 0 : _a.id) !== datos.clienteId) {
            console.warn('Se está configurando clienteId sin objeto Cliente completo');
        }
        if (datos.personalId && ((_b = this._personal) === null || _b === void 0 ? void 0 : _b.id) !== datos.personalId) {
            console.warn('Se está configurando personalId sin objeto Personal completo');
        }
        this._clienteColor = datos.clienteColor;
    }
    // **GETTERS Y SETTERS DE DATOS DE PAGO**
    get metodoPago() {
        return this._metodoPago;
    }
    set metodoPago(value) {
        this._metodoPago = value;
    }
    get dineroRecibido() {
        return this._dineroRecibido;
    }
    set dineroRecibido(value) {
        this._dineroRecibido = value;
    }
    get procedencia() {
        return this._procedencia;
    }
    set procedencia(value) {
        this._procedencia = value;
    }
    get esPedido() {
        return this._esPedido;
    }
    set esPedido(value) {
        this._esPedido = value;
    }
    get finanzaId() {
        return this._finanzaId;
    }
    set finanzaId(value) {
        this._finanzaId = value;
    }
    /**
     * Configurar datos de pago
     */
    configurarPago(datos) {
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
    marcarComoPedido(configuracion) {
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
    convertirAVentaNormal() {
        this._esPedido = false;
    }
    /**
     * Verificar si la venta es un pedido
     */
    get esUnPedido() {
        return this._esPedido === true;
    }
    /**
     * Verificar si algún item individual es un pedido
     */
    get tieneItemsPedido() {
        return this._items.some(item => item.esPedido === true);
    }
    /**
     * Obtener solo los items que son pedidos
     */
    get itemsPedido() {
        return this._items.filter(item => item.esPedido === true);
    }
    /**
     * Obtener solo los items que NO son pedidos
     */
    get itemsVentaNormal() {
        return this._items.filter(item => item.esPedido !== true);
    }
    /**
     * Marcar un item específico como pedido
     */
    marcarItemComoPedido(itemId, esPedido = true) {
        const index = this._items.findIndex(item => item.id === itemId);
        if (index === -1)
            return false;
        this._items[index] = {
            ...this._items[index],
            esPedido
        };
        return true;
    }
    /**
     * Calcular totales separados entre pedidos y venta normal
     */
    get totalesSeparados() {
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
    get configuracionFiscal() {
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
    buscarPorProducto(productId) {
        return this._items.find(item => item.product.id === productId);
    }
    /**
     * Buscar ítem por ID único
     */
    buscarPorId(itemId) {
        return this._items.find(item => item.id === itemId);
    }
    /**
     * Validar si la venta puede procesarse
     */
    puedeProcesarse() {
        return !this.estaVacia && this.total > 0;
    }
    // **MÉTODOS DE PERSISTENCIA**
    /**
     * Serializar para persistencia en base de datos
     * CONGELA los CarItems tal como están (datos inmutables)
     */
    toJSON() {
        var _a, _b;
        // Devolver la misma estructura del carrito, preservando datos tal cual
        const carrito = {
            id: this.id,
            fechaCreacion: this.fechaCreacion, // mantener Date para estructura interna
            nombre: this.nombre,
            // Items congelados tal como están (copias superficiales)
            items: this._items.map(item => {
                const { descripcion, titulo, ...productSnapshot } = item.product;
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
            clienteId: (_a = this._cliente) === null || _a === void 0 ? void 0 : _a.id,
            personalId: (_b = this._personal) === null || _b === void 0 ? void 0 : _b.id,
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
    static fromJSON(data) {
        var _a;
        // Preferir objeto de configuración fiscal completo; fallback a campos legacy
        const configuracionFiscal = (_a = data.configuracionFiscal) !== null && _a !== void 0 ? _a : {
            tasaImpuesto: data.tasaImpuesto,
            aplicaImpuesto: data.aplicaImpuesto,
            nombreImpuesto: data.nombreImpuesto
        };
        const venta = new ShoppingCart(data.id, configuracionFiscal, data.nombre);
        // Ítems ya vienen como CarItems congelados; preservar tal cual
        venta._items = data.items || [];
        venta._notas = data.notas;
        // Trazabilidad: aceptar objetos completos o fallback por ID
        venta._cliente = data.cliente;
        venta._personal = data.personal;
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
    getItemsAsCarItems() {
        return [...this._items];
    }
    // **MÉTODOS FACTORY ESTÁTICOS**
    /**
     * Crear ShoppingCart para Perú (IGV 18%)
     */
    static paraPeru(id, nombre) {
        return new ShoppingCart(id, fiscales_1.CONFIGURACIONES_FISCALES.PERU, nombre);
    }
    /**
     * Crear ShoppingCart para México (IVA 16%)
     */
    static paraMexico(id, nombre) {
        return new ShoppingCart(id, fiscales_1.CONFIGURACIONES_FISCALES.MEXICO, nombre);
    }
    /**
     * Crear ShoppingCart para Colombia (IVA 19%)
     */
    static paraColombia(id, nombre) {
        return new ShoppingCart(id, fiscales_1.CONFIGURACIONES_FISCALES.COLOMBIA, nombre);
    }
    /**
     * Crear ShoppingCart para Argentina (IVA 21%)
     */
    static paraArgentina(id, nombre) {
        return new ShoppingCart(id, fiscales_1.CONFIGURACIONES_FISCALES.ARGENTINA, nombre);
    }
    /**
     * Crear ShoppingCart para España (IVA 21%)
     */
    static paraEspana(id, nombre) {
        return new ShoppingCart(id, fiscales_1.CONFIGURACIONES_FISCALES.ESPANA, nombre);
    }
    /**
     * Crear ShoppingCart sin impuestos
     */
    static sinImpuestos(id, nombre) {
        return new ShoppingCart(id, fiscales_1.CONFIGURACIONES_FISCALES.SIN_IMPUESTOS, nombre);
    }
    /**
     * Crear ShoppingCart con configuración personalizada
     */
    static conConfiguracion(configuracion, id, nombre) {
        return new ShoppingCart(id, configuracion, nombre);
    }
    /**
     * Crear ShoppingCart para cualquier país disponible
     */
    static paraPais(pais, id, nombre) {
        const config = fiscales_1.CONFIGURACIONES_FISCALES[pais];
        if (typeof config === 'function') {
            throw new Error(`Use ShoppingCart.personalizado() para configuraciones personalizadas`);
        }
        return new ShoppingCart(id, config, nombre);
    }
    /**
     * Crear ShoppingCart con tasa personalizada
     */
    static personalizado(tasaImpuesto, nombreImpuesto = 'Impuesto', id, nombre) {
        const config = fiscales_1.CONFIGURACIONES_FISCALES.PERSONALIZADO(tasaImpuesto, nombreImpuesto);
        return new ShoppingCart(id, config, nombre);
    }
}
exports.ShoppingCart = ShoppingCart;
