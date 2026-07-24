"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Venta = void 0;
const CarritoVenta_1 = require("./CarritoVenta");
const AggregateRoot_1 = require("../../shared/base/AggregateRoot");
const VentaConfirmada_1 = require("../events/VentaConfirmada");
const enums_1 = require("../../shared/kernel/enums");
const VentaSnapshot_1 = require("./VentaSnapshot");
class Venta extends AggregateRoot_1.AggregateRoot {
    static roundMoney(value) {
        return Math.round(value * 100) / 100;
    }
    static mapCarItemToSnapshotItem(item) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const presentacionId = String(((_a = item.product) === null || _a === void 0 ? void 0 : _a.id) || "").trim();
        if (!presentacionId) {
            throw new Error("CarItem.product.id es requerido para crear VentaSnapshotItem");
        }
        const cantidadVendida = Number((_b = item.quantity) !== null && _b !== void 0 ? _b : 0);
        const precioUnitario = Number((_e = (_c = item.precioUnitario) !== null && _c !== void 0 ? _c : (_d = item.product) === null || _d === void 0 ? void 0 : _d.precioVenta) !== null && _e !== void 0 ? _e : 0);
        const descuento = typeof item.descuento === "number"
            ? Venta.roundMoney(Number(item.descuento))
            : undefined;
        const totalBruto = typeof item.montoTotal === "number" && Number.isFinite(item.montoTotal)
            ? item.montoTotal
            : precioUnitario * cantidadVendida;
        return {
            id: item.id,
            presentacionId,
            nombre: String(((_f = item.product) === null || _f === void 0 ? void 0 : _f.nombre) || presentacionId).trim(),
            cantidadVendida,
            precioUnitario: Venta.roundMoney(precioUnitario),
            total: Venta.roundMoney(totalBruto),
            imagenUrl: (_j = (_h = (_g = item.product) === null || _g === void 0 ? void 0 : _g.imagen) === null || _h === void 0 ? void 0 : _h.sizes) === null || _j === void 0 ? void 0 : _j.small,
            unidadComercial: (_k = item.product) === null || _k === void 0 ? void 0 : _k.unidadContenido,
            montoModificado: typeof item.montoModificado === "boolean"
                ? item.montoModificado
                : undefined,
            descuento,
        };
    }
    constructor(data) {
        var _a, _b, _c;
        super(data.id);
        if (!data.id || !data.nombre) {
            throw new Error("ID y nombre son requeridos para crear una venta");
        }
        this.nombre = data.nombre;
        this.type = data.type || "venta";
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.items = Number(data.items);
        this.snapshotItems = data.snapshotItems
            ? Object.freeze(data.snapshotItems.map((item) => ({ ...item })))
            : undefined;
        this.estado = data.estado;
        this.condicionPago = data.condicionPago;
        this.pedidoId =
            typeof data.pedidoId === "string" && data.pedidoId.trim() !== ""
                ? data.pedidoId
                : undefined;
        this.subtotal = Venta.roundMoney(Number((_a = data.subtotal) !== null && _a !== void 0 ? _a : 0));
        this.impuesto = Venta.roundMoney(Number((_b = data.impuesto) !== null && _b !== void 0 ? _b : 0));
        this.total = Venta.roundMoney(Number((_c = data.total) !== null && _c !== void 0 ? _c : 0));
        this.montoRedondeo =
            data.montoRedondeo === undefined ? undefined : Number(data.montoRedondeo);
        this.procedencia = data.procedencia;
        this.clienteId = data.clienteId;
        this.vendedorId = data.vendedorId;
        this.codigoVenta = data.codigoVenta;
        this.numeroVenta = data.numeroVenta;
        this.costoEnvio = data.costoEnvio;
        const validation = Venta.validar(data);
        if (!validation.valida) {
            throw new Error(validation.errores.join("; "));
        }
        if (this.snapshotItems && this.snapshotItems.length !== this.items) {
            throw new Error("Venta.items debe coincidir con la cantidad de VentaSnapshot.items");
        }
    }
    get cantidadItems() {
        return this.items;
    }
    get estaProcesada() {
        return this.estado === enums_1.VentaState.CONFIRMADA;
    }
    get esUnPedido() {
        return Boolean(this.pedidoId);
    }
    get resumen() {
        return {
            cantidadItems: this.cantidadItems,
            subtotal: this.subtotal,
            impuesto: this.impuesto,
            total: this.total,
        };
    }
    confirmar() {
        if (this.items <= 0) {
            throw new Error("No se puede confirmar venta sin items");
        }
        this.estado = enums_1.VentaState.CONFIRMADA;
        this.updatedAt = new Date();
        this.addDomainEvent(new VentaConfirmada_1.VentaConfirmada(this.id, this.total));
    }
    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            type: this.type,
            estado: this.estado,
            condicionPago: this.condicionPago,
            items: this.items,
            pedidoId: this.pedidoId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            subtotal: this.subtotal,
            impuesto: this.impuesto,
            total: this.total,
            montoRedondeo: this.montoRedondeo,
            procedencia: this.procedencia,
            clienteId: this.clienteId,
            vendedorId: this.vendedorId,
            codigoVenta: this.codigoVenta,
            numeroVenta: this.numeroVenta,
            costoEnvio: this.costoEnvio,
        };
    }
    toVentaSnapshot(context = {}) {
        var _a;
        return VentaSnapshot_1.VentaSnapshot.fromVenta(this, {
            ...context,
            items: (_a = context.items) !== null && _a !== void 0 ? _a : this.cloneTransientSnapshotItems(),
        }).toJSON();
    }
    tryToVentaSnapshot(context = {}) {
        var _a, _b;
        const result = VentaSnapshot_1.VentaSnapshot.tryFromVenta(this, {
            ...context,
            items: (_a = context.items) !== null && _a !== void 0 ? _a : this.cloneTransientSnapshotItems(),
        });
        if (!result.snapshot) {
            return {
                error: (_b = result.error) !== null && _b !== void 0 ? _b : new Error("No se pudo construir VentaSnapshot"),
            };
        }
        return { snapshot: result.snapshot.toJSON() };
    }
    static fromCarritoVenta(carritoJSON, id, options) {
        var _a, _b, _c, _d, _e, _f;
        const ahora = new Date();
        const montoRedondeo = (_a = options === null || options === void 0 ? void 0 : options.montoRedondeo) !== null && _a !== void 0 ? _a : 0;
        const carritoInstance = CarritoVenta_1.CarritoVenta.fromJSON(carritoJSON);
        const detalle = carritoInstance.toJSON();
        const totalFinal = Venta.roundMoney(detalle.total + montoRedondeo);
        const snapshotItems = detalle.items.map((item) => Venta.mapCarItemToSnapshotItem(item));
        return new Venta({
            id,
            nombre: (_c = (_b = options === null || options === void 0 ? void 0 : options.nombre) !== null && _b !== void 0 ? _b : carritoJSON.nombre) !== null && _c !== void 0 ? _c : "Venta",
            type: "venta",
            estado: enums_1.VentaState.CONFIRMADA,
            condicionPago: (_d = options === null || options === void 0 ? void 0 : options.condicionPago) !== null && _d !== void 0 ? _d : enums_1.CondicionPagoVenta.CONTADO,
            createdAt: ahora,
            updatedAt: ahora,
            items: snapshotItems.length,
            snapshotItems,
            pedidoId: options === null || options === void 0 ? void 0 : options.pedidoId,
            subtotal: detalle.subtotal,
            impuesto: detalle.impuesto,
            total: totalFinal,
            montoRedondeo,
            procedencia: carritoJSON.procedencia || CarritoVenta_1.ProcedenciaVenta.Tienda,
            clienteId: (_e = carritoInstance.cliente) === null || _e === void 0 ? void 0 : _e.id,
            vendedorId: (_f = carritoInstance.personal) === null || _f === void 0 ? void 0 : _f.id,
            codigoVenta: "",
            numeroVenta: "",
            costoEnvio: 0,
        });
    }
    static validar(data) {
        const errores = [];
        if (!data.id)
            errores.push("ID es requerido");
        if (!data.nombre)
            errores.push("Nombre es requerido");
        if (!data.procedencia)
            errores.push("Procedencia es requerida");
        if (!data.condicionPago)
            errores.push("CondicionPago es requerida");
        if (typeof data.items !== "number" ||
            !Number.isInteger(data.items) ||
            data.items <= 0) {
            errores.push("Venta.items debe ser un entero mayor a 0");
        }
        if ((data.total || 0) <= 0) {
            errores.push("El total debe ser mayor a 0");
        }
        if (data.estado !== undefined &&
            !Object.values(enums_1.VentaState).includes(data.estado)) {
            errores.push("Estado de venta inválido");
        }
        if (data.condicionPago !== undefined &&
            !Object.values(enums_1.CondicionPagoVenta).includes(data.condicionPago)) {
            errores.push("CondicionPago de venta inválida");
        }
        if ((data.subtotal || 0) < 0) {
            errores.push("El subtotal no puede ser negativo");
        }
        if ((data.impuesto || 0) < 0) {
            errores.push("El impuesto no puede ser negativo");
        }
        if (data.montoRedondeo !== undefined &&
            !Number.isFinite(data.montoRedondeo)) {
            errores.push("montoRedondeo debe ser un número finito");
        }
        if (data.costoEnvio !== undefined && data.costoEnvio < 0) {
            errores.push("El costo de envío no puede ser negativo");
        }
        return {
            valida: errores.length === 0,
            errores,
        };
    }
    cloneTransientSnapshotItems() {
        var _a;
        return (_a = this.snapshotItems) === null || _a === void 0 ? void 0 : _a.map((item) => ({ ...item }));
    }
}
exports.Venta = Venta;
