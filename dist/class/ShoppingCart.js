"use strict";
/**
 * Entidad ShoppingCart - Encapsula toda la lógica de una venta en curso
 * Reutilizable para cualquier sistema POS
 * Simplificada: usa solo CarItem con congelación automática al guardar
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShoppingCart = exports.ProcedenciaVenta = void 0;
const interfaces_1 = require("@/interfaces");
const fiscales_1 = require("@/utils/fiscales");
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
        var _a;
        const { replaceCompletely = false, itemId, fromSelection = false } = opciones;
        // Generar ID único para el nuevo ítem si no existe
        const nuevoItemId = carItem.id || `${carItem.product.id}-${Date.now()}`;
        // Buscar ítem existente SOLO por itemId para evitar colisiones
        let itemExistente = undefined;
        if (replaceCompletely && itemId) {
            itemExistente = this._items.find(item => item.id === itemId);
        }
        else if (!replaceCompletely) {
            // Si no es reemplazo completo, buscar si ya existe el mismo producto
            // Se usa el ID del producto para agrupar
            itemExistente = this._items.find(item => item.product.id === carItem.product.id);
        }
        // Determinar si es pesable basado directamente en el tipo de venta del producto
        // Si carItem tiene tipoVenta definido, se usa ese, sino el del producto
        const tipoVenta = (_a = carItem.tipoVenta) !== null && _a !== void 0 ? _a : carItem.product.tipoVenta;
        const esPesable = tipoVenta === interfaces_1.TipoVentaEnum.Peso || tipoVenta === interfaces_1.TipoVentaEnum.Volumen;
        // Procesar según el caso
        if (itemExistente) {
            this.actualizarItemExistente(itemExistente, carItem, esPesable);
        }
        else {
            this.agregarNuevoItem(carItem, nuevoItemId, esPesable);
        }
    }
    /**
     * Redondear monto monetario a 2 decimales con regla de 0.10 (Perú)
     * @example 18.45 -> 18.50, 18.42 -> 18.40
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
    actualizarItemExistente(itemExistente, carItem, esPesable) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const unit = Number((_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : carItem.product.precioVenta) || 0;
        const prepared = {
            ...itemExistente,
            id: itemExistente.id,
            // Actualizar info del producto si viene nueva, pero limpia
            product: this.cleanProduct(carItem.product || itemExistente.product),
            // Cálculo de cantidad
            quantity: esPesable
                ? (typeof carItem.quantity === 'number' ? carItem.quantity + (itemExistente.quantity || 0) : ((_b = itemExistente.quantity) !== null && _b !== void 0 ? _b : 1))
                : Number((_c = carItem.quantity) !== null && _c !== void 0 ? _c : 0) + Number((_d = itemExistente.quantity) !== null && _d !== void 0 ? _d : 0),
            precioUnitario: unit,
            montoModificado: !!carItem.montoModificado,
            // El tipo de venta se hereda del producto o del item nuevo
            tipoVenta: (_e = carItem.tipoVenta) !== null && _e !== void 0 ? _e : carItem.product.tipoVenta,
            // Peso solo para pesables: se suma si existe
            peso: esPesable ? Number((_f = carItem.peso) !== null && _f !== void 0 ? _f : 0) + Number((_g = itemExistente.peso) !== null && _g !== void 0 ? _g : 0) : undefined,
            descuento: (_h = carItem.descuento) !== null && _h !== void 0 ? _h : itemExistente.descuento
        };
        // Calcular total respetando overrides y asegurando redondeo
        const montoCalculado = (prepared.montoModificado && carItem.montoTotal != null)
            ? carItem.montoTotal
            : this.calcularTotalLinea(prepared);
        prepared.montoTotal = this.redondearMoneda(montoCalculado);
        // Actualizar el ítem pasado por referencia para que el llamador tenga los datos actualizados
        if (carItem !== prepared) {
            carItem.montoTotal = prepared.montoTotal;
            // Opcional: actualizar otros campos calculados si es necesario para el frontend
        }
        const index = this._items.findIndex(item => item.id === itemExistente.id);
        if (index !== -1) {
            this._items[index] = prepared;
        }
    }
    /**
     * Agregar nuevo ítem
     */
    agregarNuevoItem(carItem, itemId, esPesable) {
        var _a, _b, _c, _d, _e;
        const unit = Number((_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : carItem.product.precioVenta) || 0;
        const prepared = {
            id: itemId,
            product: this.cleanProduct(carItem.product), // Limpiar producto al agregar
            quantity: esPesable
                ? (typeof carItem.quantity === 'number' ? carItem.quantity : 1)
                : Number((_b = carItem.quantity) !== null && _b !== void 0 ? _b : 1),
            precioUnitario: unit,
            montoModificado: !!carItem.montoModificado,
            tipoVenta: (_c = carItem.tipoVenta) !== null && _c !== void 0 ? _c : carItem.product.tipoVenta,
            peso: esPesable ? Number((_e = (_d = carItem.peso) !== null && _d !== void 0 ? _d : carItem.quantity) !== null && _e !== void 0 ? _e : 0) : undefined,
            descuento: carItem.descuento
        };
        const montoCalculado = (prepared.montoModificado && carItem.montoTotal != null)
            ? carItem.montoTotal
            : this.calcularTotalLinea(prepared);
        prepared.montoTotal = this.redondearMoneda(montoCalculado);
        // Actualizar el ítem pasado por referencia para que el llamador tenga los datos actualizados
        if (carItem !== prepared) {
            carItem.montoTotal = prepared.montoTotal;
        }
        this._items.push(prepared);
    }
    /**
     * Calcular monto total de un ítem
     */
    calcularTotalLinea(carItem) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // Respetar overrides manuales
        if (carItem.montoModificado && carItem.montoTotal != null) {
            return this.redondearMoneda(Number(carItem.montoTotal));
        }
        const unit = Number((_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : ((_c = (_b = carItem.product) === null || _b === void 0 ? void 0 : _b.precioVenta) !== null && _c !== void 0 ? _c : 0)) || 0;
        const tipoVenta = ((_d = carItem.tipoVenta) !== null && _d !== void 0 ? _d : (_e = carItem.product) === null || _e === void 0 ? void 0 : _e.tipoVenta);
        const esPesable = tipoVenta === interfaces_1.TipoVentaEnum.Peso || tipoVenta === interfaces_1.TipoVentaEnum.Volumen;
        const peso = esPesable ? Number((_g = (_f = carItem.peso) !== null && _f !== void 0 ? _f : carItem.quantity) !== null && _g !== void 0 ? _g : 0) : undefined;
        const qty = esPesable ? 0 : Math.max(0, Number((_h = carItem.quantity) !== null && _h !== void 0 ? _h : 0));
        const base = esPesable ? unit * (peso || 0) : unit * qty;
        // Redondear también el cálculo base
        return this.redondearMoneda(base);
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
        const tipoVenta = (_a = item.tipoVenta) !== null && _a !== void 0 ? _a : item.product.tipoVenta;
        const esPesable = tipoVenta === interfaces_1.TipoVentaEnum.Peso || tipoVenta === interfaces_1.TipoVentaEnum.Volumen;
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
        const tipoVenta = (_a = item.tipoVenta) !== null && _a !== void 0 ? _a : item.product.tipoVenta;
        const esPesable = tipoVenta === interfaces_1.TipoVentaEnum.Peso || tipoVenta === interfaces_1.TipoVentaEnum.Volumen;
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
        const precioUnitario = item.precioUnitario || item.product.precioVenta;
        const tipoVenta = item.tipoVenta || item.product.tipoVenta;
        const esPesable = tipoVenta === interfaces_1.TipoVentaEnum.Peso || tipoVenta === interfaces_1.TipoVentaEnum.Volumen;
        let montoSinRedondear;
        if (esPesable) {
            const nuevoPeso = item.peso ? (item.peso / item.quantity) * nuevaCantidad : nuevaCantidad;
            montoSinRedondear = precioUnitario * nuevoPeso;
        }
        else {
            montoSinRedondear = precioUnitario * nuevaCantidad;
        }
        return this.redondearMoneda(montoSinRedondear);
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
        // Ítems ya vienen como CarItems congelados; preservar tal cual
        carrito._items = data.items || [];
        carrito._notas = data.notas;
        // Trazabilidad: aceptar objetos completos o fallback por ID
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
