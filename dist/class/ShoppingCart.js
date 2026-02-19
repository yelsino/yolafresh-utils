"use strict";
/**
 * Entidad ShoppingCart - Encapsula toda la lógica de una venta en curso
 * Reutilizable para cualquier sistema POS
 * Simplificada: usa solo CarItem con congelación automática al guardar
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShoppingCart = exports.ProcedenciaVenta = void 0;
const interfaces_1 = require("../interfaces");
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
    constructor(id, configuracionFiscal, nombre, createdAt) {
        var _a, _b, _c;
        this._items = [];
        this.updatedAt = new Date();
        this.id = id || `venta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.createdAt = createdAt || new Date();
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
    /**
     * Agregar o actualizar un CarItem en la venta
     */
    agregarProducto(carItem, opciones = {}) {
        const { replaceCompletely = false, itemId, fromSelection = false, agrupar = true } = opciones;
        // Generar ID único para el nuevo ítem si no existe
        const nuevoItemId = carItem.id || `${carItem.product.id}-${Date.now()}`;
        // Buscar ítem existente SOLO por itemId para evitar colisiones
        let itemExistente = undefined;
        if (replaceCompletely && itemId) {
            itemExistente = this._items.find(item => item.id === itemId);
        }
        else if (!replaceCompletely && agrupar) {
            // Si no es reemplazo completo Y se permite agrupar, buscar si ya existe el mismo producto
            // Se usa el ID del producto para agrupar
            itemExistente = this._items.find(item => item.product.id === carItem.product.id);
        }
        // Procesar según el caso
        if (itemExistente) {
            this.actualizarItemExistente(itemExistente, carItem);
        }
        else {
            this.agregarNuevoItem(carItem, nuevoItemId);
        }
    }
    /**
     * Helper para agregar un producto como una línea separada.
     * Útil cuando el cliente quiere el mismo producto en bolsas distintas.
     */
    agregarProductoSeparado(carItem) {
        this.agregarProducto(carItem, { agrupar: false });
    }
    /**
     * Redondear monto monetario a 2 decimales con regla de 0.10 (Perú)
     */
    redondearMoneda(monto) {
        // Primero redondear a 2 decimales estándar para evitar errores de punto flotante
        const base = Math.round(monto * 100) / 100;
        // Obtener la parte decimal
        const decimales = Math.round((base % 1) * 100);
        const ultimoDigito = decimales % 10;
        // Si termina en 0 o 5, ya está redondeado
        if (ultimoDigito === 0)
            return base;
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
    actualizarItemExistente(itemExistente, carItem) {
        var _a, _b, _c, _d;
        const unit = Number((_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : carItem.product.precioVenta) || 0;
        // Calcular nueva cantidad base
        const nuevaCantidad = Number((_b = carItem.quantity) !== null && _b !== void 0 ? _b : 0) + Number((_c = itemExistente.quantity) !== null && _c !== void 0 ? _c : 0);
        const prepared = {
            ...itemExistente,
            id: itemExistente.id,
            // Actualizar info del producto si viene nueva, pero limpia
            product: this.cleanProduct(carItem.product || itemExistente.product),
            quantity: nuevaCantidad,
            precioUnitario: unit,
            montoModificado: !!carItem.montoModificado,
            descuento: (_d = carItem.descuento) !== null && _d !== void 0 ? _d : itemExistente.descuento
        };
        // Calcular total y consistencia
        if (prepared.montoModificado && carItem.montoTotal != null) {
            // Si el monto fue forzado manualmente
            prepared.montoTotal = this.redondearMoneda(carItem.montoTotal);
            // Recalcular unitario implícito: Unitario = Total / Cantidad
            if (prepared.quantity > 0) {
                prepared.precioUnitario = prepared.montoTotal / prepared.quantity;
            }
        }
        else {
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
    agregarNuevoItem(carItem, itemId) {
        var _a, _b;
        const unit = Number((_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : carItem.product.precioVenta) || 0;
        const prepared = {
            id: itemId,
            product: this.cleanProduct(carItem.product), // Limpiar producto al agregar
            quantity: Number((_b = carItem.quantity) !== null && _b !== void 0 ? _b : 1),
            precioUnitario: unit,
            montoModificado: !!carItem.montoModificado,
            descuento: carItem.descuento
        };
        if (prepared.montoModificado && carItem.montoTotal != null) {
            prepared.montoTotal = this.redondearMoneda(carItem.montoTotal);
            if (prepared.quantity > 0) {
                prepared.precioUnitario = prepared.montoTotal / prepared.quantity;
            }
        }
        else {
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
    calcularTotalLinea(carItem) {
        var _a, _b;
        // Respetar overrides manuales
        if (carItem.montoModificado && carItem.montoTotal != null) {
            return this.redondearMoneda(Number(carItem.montoTotal));
        }
        const unit = (_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : carItem.product.precioVenta;
        const qty = (_b = carItem.quantity) !== null && _b !== void 0 ? _b : 0;
        // Cálculo directo: Precio * Cantidad (cantidad ya es kg o unidad)
        const base = unit * qty;
        return this.redondearMoneda(base);
    }
    // **MÉTODOS DE MANIPULACIÓN DE ITEMS**
    /**
     * Incrementar cantidad de un producto
     */
    incrementarCantidad(id, stepKg = 0.1) {
        var _a, _b;
        const index = this.buscarIndexPorId(id);
        if (index === -1)
            return false;
        const item = this._items[index];
        const itemTipoVenta = item.product.tipoVenta; // Usar siempre la definición del producto
        const esPesable = itemTipoVenta === interfaces_1.TipoVentaEnum.Peso || itemTipoVenta === interfaces_1.TipoVentaEnum.Volumen;
        let nuevaCantidad = item.quantity;
        if (esPesable) {
            // Si es pesable, sumar 0.1 (o stepKg)
            nuevaCantidad = ((_a = item.quantity) !== null && _a !== void 0 ? _a : 0) + stepKg;
            // Redondear a 3 decimales para evitar floating point issues (ej. 1.200000001)
            nuevaCantidad = Math.round(nuevaCantidad * 1000) / 1000;
        }
        else {
            // Si es unidad, sumar 1
            nuevaCantidad = ((_b = item.quantity) !== null && _b !== void 0 ? _b : 0) + 1;
        }
        this.actualizarCantidadItem(index, nuevaCantidad);
        return true;
    }
    /**
     * Decrementar cantidad de un producto
     */
    decrementarCantidad(id, stepKg = 0.1) {
        var _a, _b;
        const index = this.buscarIndexPorId(id);
        if (index === -1)
            return false;
        const item = this._items[index];
        const itemTipoVenta = item.product.tipoVenta;
        const esPesable = itemTipoVenta === interfaces_1.TipoVentaEnum.Peso || itemTipoVenta === interfaces_1.TipoVentaEnum.Volumen;
        let nuevaCantidad = item.quantity;
        let debeEliminar = false;
        if (esPesable) {
            nuevaCantidad = ((_a = item.quantity) !== null && _a !== void 0 ? _a : 0) - stepKg;
            nuevaCantidad = Math.round(nuevaCantidad * 1000) / 1000;
            if (nuevaCantidad <= 0.001)
                debeEliminar = true;
        }
        else {
            nuevaCantidad = ((_b = item.quantity) !== null && _b !== void 0 ? _b : 0) - 1;
            if (nuevaCantidad < 1)
                debeEliminar = true;
        }
        if (debeEliminar) {
            this._items.splice(index, 1);
            return true;
        }
        this.actualizarCantidadItem(index, nuevaCantidad);
        return true;
    }
    // Helper privado para buscar index (dry)
    buscarIndexPorId(id) {
        let index = this._items.findIndex(item => item.id === id);
        if (index === -1) {
            index = this._items.findIndex(item => item.product.id === id);
        }
        return index;
    }
    // Helper privado para actualizar cantidad y recalcular
    actualizarCantidadItem(index, nuevaCantidad) {
        const item = this._items[index];
        const updated = { ...item, quantity: nuevaCantidad };
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
        }
        else {
            updated.montoTotal = this.calcularTotalLinea(updated);
        }
        this._items[index] = updated;
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
        return this.redondearMoneda(baseImponible * (this._configuracionFiscal.tasaImpuesto || 0));
    }
    /**
     * Calcular total final
     */
    get total() {
        return this.redondearMoneda(this.subtotal - this.descuentoTotal + this.impuesto);
    }
    /**
     * Calcular cambio a devolver
     */
    calcularCambio(dineroRecibido) {
        return Math.max(0, this.redondearMoneda(dineroRecibido - this.total));
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
            createdAt: this.createdAt, // mantener Date para estructura interna
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
            updatedAt: this.updatedAt,
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
        // Restaurar fecha original si existe en los datos
        const createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        const carrito = new ShoppingCart(data.id, configuracionFiscal, data.nombre, createdAt);
        carrito.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        // MIGRACIÓN ON-THE-FLY y Limpieza de Items
        const itemsRaw = data.items || [];
        carrito._items = itemsRaw.map((item) => {
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
            return item; // Ya cumple la interfaz nueva
        });
        carrito._notas = data.notas;
        // Trazabilidad
        carrito._cliente = data.cliente;
        carrito._personal = data.personal;
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
    getItemsAsCarItems() {
        return [...this._items];
    }
    // **MÉTODOS ESTÁTICOS DE CÁLCULO Y VISUADIZACIÓN**
    /**
     * Calcula la cantidad necesaria para llegar a un monto específico
     * @example "Dame 3 soles de papa" -> 3.00 / 1.50 = 2.00 kg
     */
    static calcularCantidadDesdeMonto(producto, montoObjetivo) {
        const precio = producto.precioVenta;
        if (!precio || precio <= 0)
            return 0;
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
    static calcularContenidoTotal(item) {
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
    cleanProduct(producto) {
        // Crear una copia limpia del producto
        const { 
        // Propiedades a excluir explícitamente si existen y son pesadas/innecesarias
        descripcion, caracteristicas, consideraciones, keywords, createdAt, updatedAt, 
        // Mantener el resto
        ...productData } = producto;
        // Asegurar que las URLs sean strings o el objeto ImageSizes mínimo
        let urlLimpia = productData.url;
        return {
            ...productData,
            url: urlLimpia,
            // Asegurar campos mínimos requeridos si se perdieron
            id: producto.id,
            nombre: producto.nombre
        };
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
