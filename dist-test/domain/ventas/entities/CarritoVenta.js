"use strict";
/**
 * Entidad CarritoVenta - Encapsula toda la lógica de una venta en curso
 * Reutilizable para cualquier sistema POS
 * Simplificada: usa solo CarItem con congelación automática al guardar
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarritoVenta = exports.ProcedenciaVenta = void 0;
const fiscal_contract_1 = require("../../shared/kernel/fiscal.contract");
const dates_1 = require("../../shared/utils/dates");
const producto_contract_1 = require("../../inventario/contracts/producto.contract");
var ProcedenciaVenta;
(function (ProcedenciaVenta) {
    ProcedenciaVenta["Tienda"] = "Tienda";
    ProcedenciaVenta["Web"] = "Web";
    ProcedenciaVenta["WhatsApp"] = "WhatsApp";
    ProcedenciaVenta["Instagram"] = "Instagram";
    ProcedenciaVenta["Facebook"] = "Facebook";
})(ProcedenciaVenta || (exports.ProcedenciaVenta = ProcedenciaVenta = {}));
/**
 * Clase CarritoVenta - Maneja toda la lógica de una venta en curso
 * Simplificada: trabaja solo con CarItem, congela al guardar
 */
class CarritoVenta {
    constructor(id, configuracionFiscal, nombre, createdAt) {
        var _a, _b, _c;
        this._items = [];
        this.updatedAt = new Date();
        this.id = id || (0, dates_1.generarUlid)("venta");
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
    touch() {
        this.updatedAt = new Date();
    }
    static assertFiniteNumber(value, fieldName) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            throw new Error(`${fieldName} debe ser un número finito`);
        }
        return parsed;
    }
    static assertNonNegativeMoney(value, fieldName) {
        const parsed = CarritoVenta.assertFiniteNumber(value, fieldName);
        if (parsed < 0) {
            throw new Error(`${fieldName} no puede ser negativo`);
        }
        return parsed;
    }
    static assertPositiveQuantity(value, fieldName) {
        const parsed = CarritoVenta.assertFiniteNumber(value, fieldName);
        if (parsed <= 0) {
            throw new Error(`${fieldName} debe ser mayor a 0`);
        }
        return parsed;
    }
    normalizeInputItem(carItem) {
        var _a, _b, _c;
        const product = this.cleanProduct(carItem.product);
        if (!product.id) {
            throw new Error("CarItem.product.id es requerido");
        }
        const quantity = CarritoVenta.assertPositiveQuantity((_a = carItem.quantity) !== null && _a !== void 0 ? _a : 1, "CarItem.quantity");
        const precioBase = (_c = (_b = carItem.precioUnitario) !== null && _b !== void 0 ? _b : product.precioVenta) !== null && _c !== void 0 ? _c : 0;
        const precioUnitario = CarritoVenta.assertNonNegativeMoney(precioBase, "CarItem.precioUnitario");
        const montoModificado = Boolean(carItem.montoModificado);
        const montoTotal = carItem.montoTotal === undefined
            ? undefined
            : CarritoVenta.assertNonNegativeMoney(carItem.montoTotal, "CarItem.montoTotal");
        const descuento = carItem.descuento === undefined
            ? undefined
            : CarritoVenta.assertNonNegativeMoney(carItem.descuento, "CarItem.descuento");
        return {
            product,
            quantity,
            precioUnitario,
            montoTotal,
            montoModificado,
            descuento,
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
        this.touch();
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
        this.touch();
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
        this.touch();
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
        const { replaceCompletely = false, itemId, fromSelection = false, agrupar = true } = opciones;
        const productId = (_a = carItem.product) === null || _a === void 0 ? void 0 : _a.id;
        if (!productId) {
            throw new Error("CarItem.product.id es requerido");
        }
        // Generar ID único para el nuevo ítem si no existe
        const nuevoItemId = carItem.id || `${productId}-${Date.now()}`;
        // Buscar ítem existente SOLO por itemId para evitar colisiones
        let itemExistente = undefined;
        if (replaceCompletely && itemId) {
            itemExistente = this._items.find(item => item.id === itemId);
        }
        else if (!replaceCompletely && agrupar) {
            // Si no es reemplazo completo Y se permite agrupar, buscar si ya existe el mismo producto
            // Se usa el ID del producto para agrupar
            itemExistente = this._items.find(item => { var _a; return ((_a = item.product) === null || _a === void 0 ? void 0 : _a.id) === productId; });
        }
        // Procesar según el caso
        if (itemExistente) {
            this.actualizarItemExistente(itemExistente, carItem);
        }
        else {
            this.agregarNuevoItem(carItem, nuevoItemId);
        }
        this.touch();
    }
    /**
     * Helper para agregar un producto como una línea separada.
     * Útil cuando el cliente quiere el mismo producto en bolsas distintas.
     */
    agregarProductoSeparado(carItem) {
        this.agregarProducto(carItem, { agrupar: false });
    }
    /**
     * Redondear monto monetario a 2 decimales.
     * Ajustes operativos de sencillo viven en `montoRedondeo`, no en el carrito.
     */
    redondearMoneda(monto) {
        return Math.round(monto * 100) / 100;
    }
    /**
     * Actualizar un ítem existente
     */
    actualizarItemExistente(itemExistente, carItem) {
        var _a, _b;
        const normalized = this.normalizeInputItem(carItem);
        // Calcular nueva cantidad base
        const nuevaCantidad = normalized.quantity + Number((_a = itemExistente.quantity) !== null && _a !== void 0 ? _a : 0);
        const prepared = {
            ...itemExistente,
            id: itemExistente.id,
            // Actualizar info del producto si viene nueva, pero limpia
            product: normalized.product || itemExistente.product,
            quantity: nuevaCantidad,
            precioUnitario: normalized.precioUnitario,
            montoModificado: normalized.montoModificado,
            descuento: (_b = normalized.descuento) !== null && _b !== void 0 ? _b : itemExistente.descuento
        };
        // Si el monto fue forzado manualmente, preservamos el total sin reinterpretar el precio unitario.
        if (prepared.montoModificado && normalized.montoTotal != null) {
            prepared.montoTotal = this.redondearMoneda(normalized.montoTotal);
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
        const normalized = this.normalizeInputItem(carItem);
        const prepared = {
            id: itemId,
            product: normalized.product,
            quantity: normalized.quantity,
            precioUnitario: normalized.precioUnitario,
            montoModificado: normalized.montoModificado,
            descuento: normalized.descuento
        };
        if (prepared.montoModificado && normalized.montoTotal != null) {
            prepared.montoTotal = this.redondearMoneda(normalized.montoTotal);
        }
        else {
            const montoCalculado = this.calcularTotalLinea(prepared);
            prepared.montoTotal = this.redondearMoneda(montoCalculado);
        }
        this._items.push(prepared);
    }
    /**
     * Calcular monto total de un ítem
     */
    calcularTotalLinea(carItem) {
        var _a, _b, _c;
        // Respetar overrides manuales
        if (carItem.montoModificado && carItem.montoTotal != null) {
            return this.redondearMoneda(Number(carItem.montoTotal));
        }
        const unit = Number((_b = (_a = carItem.precioUnitario) !== null && _a !== void 0 ? _a : carItem.product.precioVenta) !== null && _b !== void 0 ? _b : 0);
        const qty = (_c = carItem.quantity) !== null && _c !== void 0 ? _c : 0;
        // Cálculo directo: Precio * Cantidad (cantidad ya es kg o unidad)
        const base = unit * qty;
        return this.redondearMoneda(base);
    }
    // **MÉTODOS DE MANIPULACIÓN DE ITEMS**
    /**
     * Incrementar cantidad de un producto
     */
    incrementarCantidad(id, stepKg = 0.1) {
        var _a, _b, _c, _d;
        const index = this.buscarIndexPorId(id);
        if (index === -1)
            return false;
        const item = this._items[index];
        const itemTipoVenta = (_b = (_a = item.product) === null || _a === void 0 ? void 0 : _a.tipoVenta) !== null && _b !== void 0 ? _b : producto_contract_1.TipoVentaEnum.Unidad;
        const esPesable = itemTipoVenta === producto_contract_1.TipoVentaEnum.Peso || itemTipoVenta === producto_contract_1.TipoVentaEnum.Volumen;
        let nuevaCantidad = item.quantity;
        if (esPesable) {
            // Si es pesable, sumar 0.1 (o stepKg)
            nuevaCantidad = ((_c = item.quantity) !== null && _c !== void 0 ? _c : 0) + stepKg;
            // Redondear a 3 decimales para evitar floating point issues (ej. 1.200000001)
            nuevaCantidad = Math.round(nuevaCantidad * 1000) / 1000;
        }
        else {
            // Si es unidad, sumar 1
            nuevaCantidad = ((_d = item.quantity) !== null && _d !== void 0 ? _d : 0) + 1;
        }
        this.actualizarCantidadItem(index, nuevaCantidad);
        return true;
    }
    /**
     * Decrementar cantidad de un producto
     */
    decrementarCantidad(id, stepKg = 0.1) {
        var _a, _b, _c, _d;
        const index = this.buscarIndexPorId(id);
        if (index === -1)
            return false;
        const item = this._items[index];
        const itemTipoVenta = (_b = (_a = item.product) === null || _a === void 0 ? void 0 : _a.tipoVenta) !== null && _b !== void 0 ? _b : producto_contract_1.TipoVentaEnum.Unidad;
        const esPesable = itemTipoVenta === producto_contract_1.TipoVentaEnum.Peso || itemTipoVenta === producto_contract_1.TipoVentaEnum.Volumen;
        let nuevaCantidad = item.quantity;
        let debeEliminar = false;
        if (esPesable) {
            nuevaCantidad = ((_c = item.quantity) !== null && _c !== void 0 ? _c : 0) - stepKg;
            nuevaCantidad = Math.round(nuevaCantidad * 1000) / 1000;
            if (nuevaCantidad <= 0.001)
                debeEliminar = true;
        }
        else {
            nuevaCantidad = ((_d = item.quantity) !== null && _d !== void 0 ? _d : 0) - 1;
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
            index = this._items.findIndex(item => { var _a; return ((_a = item.product) === null || _a === void 0 ? void 0 : _a.id) === id; });
        }
        return index;
    }
    // Helper privado para actualizar cantidad y recalcular
    actualizarCantidadItem(index, nuevaCantidad) {
        const item = this._items[index];
        const updated = { ...item, quantity: nuevaCantidad };
        if (updated.montoModificado) {
            // Cambiar cantidad invalida override manual previo. Se vuelve a cálculo normal.
            updated.montoModificado = false;
        }
        updated.montoTotal = this.calcularTotalLinea(updated);
        this._items[index] = updated;
        this.touch();
    }
    /**
     * Eliminar un ítem por ID
     */
    eliminarItem(itemId) {
        const index = this._items.findIndex(item => item.id === itemId);
        if (index === -1)
            return false;
        this._items.splice(index, 1);
        this.touch();
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
            descuento: Math.max(0, CarritoVenta.assertNonNegativeMoney(descuento, "descuento"))
        };
        this.touch();
        return true;
    }
    /**
     * Limpiar toda la venta
     */
    limpiar() {
        this._items = [];
        this.touch();
    }
    // **MÉTODOS DE CÁLCULO**
    /**
     * Calcular subtotal (suma de todos los montos)
     */
    get subtotal() {
        return this.redondearMoneda(this._items.reduce((sum, item) => sum + (item.montoTotal || 0), 0));
    }
    /**
     * Calcular descuento total
     */
    get descuentoTotal() {
        return this.redondearMoneda(this._items.reduce((sum, item) => {
            const descuento = item.descuento || 0;
            return sum + descuento;
        }, 0));
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
    // **GETTERS Y SETTERS DE TRAZABILIDAD**
    get cliente() {
        return this._cliente;
    }
    set cliente(value) {
        this._cliente = value;
        this.touch();
    }
    get personal() {
        return this._personal;
    }
    set personal(value) {
        this._personal = value;
        this.touch();
    }
    /**
     * Configurar información de trazabilidad
     */
    configurarTrazabilidad(datos) {
        this._cliente = datos.cliente;
        this._personal = datos.personal;
        this.touch();
    }
    get procedencia() {
        return this._procedencia;
    }
    set procedencia(value) {
        this._procedencia = value;
        this.touch();
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
        return this._items.find(item => { var _a; return ((_a = item.product) === null || _a === void 0 ? void 0 : _a.id) === productId; });
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
        const carrito = {
            id: this.id,
            createdAt: this.createdAt,
            nombre: this.nombre,
            items: this._items.map(item => {
                const product = item.product;
                const { descripcion, titulo, ...productSnapshot } = product;
                return {
                    ...item,
                    product: productSnapshot
                };
            }),
            subtotal: this.subtotal,
            descuentoTotal: this.descuentoTotal,
            impuesto: this.impuesto,
            total: this.total,
            cantidadItems: this.cantidadItems,
            cantidadTotal: this.cantidadTotal,
            configuracionFiscal: { ...this._configuracionFiscal },
            cliente: this._cliente ? { ...this._cliente } : undefined,
            personal: this._personal ? { ...this._personal } : undefined,
            procedencia: this._procedencia,
            updatedAt: this.updatedAt,
        };
        return carrito;
    }
    toVentaSnapshot() {
        const getImagenSnapshot = (product) => {
            var _a, _b, _c;
            const img = product === null || product === void 0 ? void 0 : product.imagen;
            const small = (_c = (_b = (_a = img === null || img === void 0 ? void 0 : img.sizes) === null || _a === void 0 ? void 0 : _a.small) !== null && _b !== void 0 ? _b : img === null || img === void 0 ? void 0 : img.base) !== null && _c !== void 0 ? _c : undefined;
            const clean = typeof small === "string" ? small.trim() : undefined;
            return clean ? { sizes: { small: clean } } : undefined;
        };
        const cleanProductForVenta = (product) => {
            if (!product)
                return undefined;
            const id = product.id;
            if (!id)
                throw new Error("CarItem.product.id es requerido");
            return {
                id,
                type: product.type,
                productoBaseId: product.productoBaseId,
                nombre: product.nombre,
                sku: product.sku,
                codigoBarra: product.codigoBarra,
                tipoVenta: product.tipoVenta,
                contenidoNeto: product.contenidoNeto,
                unidadContenido: product.unidadContenido,
                tipoEmpaque: product.tipoEmpaque,
                fraccionable: product.fraccionable,
                imagen: getImagenSnapshot(product),
            };
        };
        const cleanClienteForVenta = (cliente) => {
            if (!cliente)
                return undefined;
            return {
                id: cliente.id,
                nombres: cliente.nombres,
                celular: cliente.celular,
                correo: cliente.correo,
                dni: cliente.dni,
                direccion: cliente.direccion,
            };
        };
        const cleanPersonalForVenta = (personal) => {
            if (!personal)
                return undefined;
            return {
                id: personal.id,
                username: personal.username,
                email: personal.email,
            };
        };
        const items = this._items.map((item) => {
            var _a, _b, _c, _d, _e, _f;
            const product = cleanProductForVenta(item.product);
            if (!product) {
                throw new Error(`CarItem.product es requerido (${item.id})`);
            }
            const quantity = Number((_a = item.quantity) !== null && _a !== void 0 ? _a : 0);
            const precioVenta = Number((_c = (_b = item.product) === null || _b === void 0 ? void 0 : _b.precioVenta) !== null && _c !== void 0 ? _c : 0);
            const precioUnitario = Number((_e = (_d = item.precioUnitario) !== null && _d !== void 0 ? _d : precioVenta) !== null && _e !== void 0 ? _e : 0);
            const montoTotal = Number((_f = item.montoTotal) !== null && _f !== void 0 ? _f : precioUnitario * quantity);
            const itemMetadata = item;
            return {
                id: item.id,
                product,
                quantity,
                precioUnitario,
                montoTotal,
                descuento: item.descuento,
                montoModificado: item.montoModificado,
                displayName: itemMetadata.displayName,
                productoBaseNombre: itemMetadata.productoBaseNombre,
            };
        });
        return {
            id: this.id,
            createdAt: this.createdAt.getTime(),
            updatedAt: this.updatedAt.getTime(),
            nombre: this.nombre,
            items,
            subtotal: this.subtotal,
            descuentoTotal: this.descuentoTotal,
            impuesto: this.impuesto,
            total: this.total,
            cantidadItems: this.cantidadItems,
            cantidadTotal: this.cantidadTotal,
            configuracionFiscal: { ...this._configuracionFiscal },
            cliente: cleanClienteForVenta(this._cliente),
            personal: cleanPersonalForVenta(this._personal),
            procedencia: this._procedencia,
        };
    }
    static fromJSON(data) {
        var _a, _b;
        const configuracionFiscal = (_a = data.configuracionFiscal) !== null && _a !== void 0 ? _a : {
            ...fiscal_contract_1.CONFIGURACIONES_FISCALES.SIN_IMPUESTOS,
        };
        const createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        const carrito = new CarritoVenta(data.id, configuracionFiscal, data.nombre, createdAt);
        carrito.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        carrito._items = ((_b = data.items) !== null && _b !== void 0 ? _b : []).map((item, index) => {
            var _a;
            const product = carrito.cleanProduct((_a = item.product) !== null && _a !== void 0 ? _a : {});
            if (!item.id) {
                throw new Error(`CarritoVenta.items[${index}].id es requerido`);
            }
            if (!product.id) {
                throw new Error(`CarritoVenta.items[${index}].product.id es requerido`);
            }
            return {
                id: item.id,
                product,
                quantity: CarritoVenta.assertPositiveQuantity(item.quantity, `CarritoVenta.items[${index}].quantity`),
                precioUnitario: item.precioUnitario !== undefined
                    ? CarritoVenta.assertNonNegativeMoney(item.precioUnitario, `CarritoVenta.items[${index}].precioUnitario`)
                    : undefined,
                montoModificado: Boolean(item.montoModificado),
                montoTotal: item.montoTotal !== undefined
                    ? CarritoVenta.assertNonNegativeMoney(item.montoTotal, `CarritoVenta.items[${index}].montoTotal`)
                    : undefined,
                descuento: item.descuento !== undefined
                    ? CarritoVenta.assertNonNegativeMoney(item.descuento, `CarritoVenta.items[${index}].descuento`)
                    : undefined,
            };
        });
        carrito._cliente = data.cliente;
        carrito._personal = data.personal;
        carrito._procedencia = data.procedencia;
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
        return {
            id: producto.id,
            type: producto.type,
            productoBaseId: producto.productoBaseId,
            nombre: producto.nombre,
            sku: producto.sku,
            codigoBarra: producto.codigoBarra,
            codigosAlternos: producto.codigosAlternos,
            precioVenta: producto.precioVenta,
            precioCompraReferencial: producto.precioCompraReferencial,
            tipoVenta: producto.tipoVenta,
            contenidoNeto: producto.contenidoNeto,
            unidadContenido: producto.unidadContenido,
            equivalenciaUnidadBase: producto.equivalenciaUnidadBase,
            fraccionable: producto.fraccionable,
            cantidadParaDescuento: producto.cantidadParaDescuento,
            descuentoXCantidad: producto.descuentoXCantidad,
            visibleEnPOS: producto.visibleEnPOS,
            visibleOnline: producto.visibleOnline,
            tipoEmpaque: producto.tipoEmpaque,
            imagen: producto.imagen,
            createdAt: producto.createdAt,
            updatedAt: producto.updatedAt,
        };
    }
    // **MÉTODOS FACTORY ESTÁTICOS**
    /**
     * Crear CarritoVenta para Perú (IGV 18%)
     */
    static paraPeru(id, nombre) {
        return new CarritoVenta(id, fiscal_contract_1.CONFIGURACIONES_FISCALES.PERU, nombre);
    }
    /**
     * Crear CarritoVenta para México (IVA 16%)
     */
    static paraMexico(id, nombre) {
        return new CarritoVenta(id, fiscal_contract_1.CONFIGURACIONES_FISCALES.MEXICO, nombre);
    }
    /**
     * Crear CarritoVenta para Colombia (IVA 19%)
     */
    static paraColombia(id, nombre) {
        return new CarritoVenta(id, fiscal_contract_1.CONFIGURACIONES_FISCALES.COLOMBIA, nombre);
    }
    /**
     * Crear CarritoVenta para Argentina (IVA 21%)
     */
    static paraArgentina(id, nombre) {
        return new CarritoVenta(id, fiscal_contract_1.CONFIGURACIONES_FISCALES.ARGENTINA, nombre);
    }
    /**
     * Crear CarritoVenta para España (IVA 21%)
     */
    static paraEspana(id, nombre) {
        return new CarritoVenta(id, fiscal_contract_1.CONFIGURACIONES_FISCALES.ESPANA, nombre);
    }
    /**
     * Crear CarritoVenta sin impuestos
     */
    static sinImpuestos(id, nombre) {
        return new CarritoVenta(id, fiscal_contract_1.CONFIGURACIONES_FISCALES.SIN_IMPUESTOS, nombre);
    }
    /**
     * Crear CarritoVenta con configuración personalizada
     */
    static conConfiguracion(configuracion, id, nombre) {
        return new CarritoVenta(id, configuracion, nombre);
    }
    /**
     * Crear CarritoVenta para cualquier país disponible
     */
    static paraPais(pais, id, nombre) {
        const config = fiscal_contract_1.CONFIGURACIONES_FISCALES[pais];
        if (typeof config === 'function') {
            throw new Error(`Use CarritoVenta.personalizado() para configuraciones personalizadas`);
        }
        return new CarritoVenta(id, config, nombre);
    }
    /**
     * Crear CarritoVenta con tasa personalizada
     */
    static personalizado(tasaImpuesto, nombreImpuesto = 'Impuesto', id, nombre) {
        const config = fiscal_contract_1.CONFIGURACIONES_FISCALES.PERSONALIZADO(tasaImpuesto, nombreImpuesto);
        return new CarritoVenta(id, config, nombre);
    }
}
exports.CarritoVenta = CarritoVenta;
