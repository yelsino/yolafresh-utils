"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VentaSnapshot = exports.VENTA_SNAPSHOT_TYPE = void 0;
exports.buildVentaSnapshotId = buildVentaSnapshotId;
exports.mapVentaSnapshotActor = mapVentaSnapshotActor;
exports.isVentaSnapshotImmutableState = isVentaSnapshotImmutableState;
const enums_1 = require("../../shared/kernel/enums");
exports.VENTA_SNAPSHOT_TYPE = "venta_snapshot";
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
function sumItemDiscounts(items) {
    return roundMoney((items !== null && items !== void 0 ? items : []).reduce((sum, item) => { var _a; return sum + Number((_a = item.descuento) !== null && _a !== void 0 ? _a : 0); }, 0));
}
function normalizeDate(value) {
    if (value instanceof Date) {
        return value.getTime();
    }
    return typeof value === "number" ? value : Date.now();
}
function safeTrim(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}
function buildActor(id, nombre) {
    var _a, _b;
    const cleanNombre = safeTrim(nombre);
    const cleanId = (_a = safeTrim(id !== null && id !== void 0 ? id : undefined)) !== null && _a !== void 0 ? _a : null;
    if (!cleanNombre && cleanId === null) {
        return undefined;
    }
    return {
        id: cleanId,
        nombre: (_b = cleanNombre !== null && cleanNombre !== void 0 ? cleanNombre : cleanId) !== null && _b !== void 0 ? _b : "sin_nombre_visible",
    };
}
function isCliente(source) {
    return Boolean(source &&
        typeof source === "object" &&
        "tipoEntidad" in source &&
        source.tipoEntidad === "Cliente");
}
function isUsuario(source) {
    return Boolean(source &&
        typeof source === "object" &&
        "username" in source &&
        "roles" in source &&
        "passwordHash" in source);
}
function buildVentaSnapshotId(ventaId) {
    const cleanVentaId = safeTrim(ventaId);
    if (!cleanVentaId) {
        throw new Error("ventaId es requerido para construir VentaSnapshot.id");
    }
    return `${cleanVentaId}:snapshot`;
}
function mapVentaSnapshotActor(source) {
    if (!source) {
        return undefined;
    }
    if (isCliente(source)) {
        const nombreCompleto = [source.nombres, source.apellidos].filter(Boolean).join(" ");
        return buildActor(source.id, nombreCompleto || source.pseudonimo);
    }
    if (isUsuario(source)) {
        return buildActor(source.id, source.username || source.email);
    }
    if ("nombre" in source) {
        return buildActor(typeof source.id === "string" ? source.id : undefined, source.nombre);
    }
    if ("nombres" in source) {
        const nombreCompleto = [source.nombres, source.apellidos].filter(Boolean).join(" ");
        return buildActor(typeof source.id === "string" ? source.id : undefined, nombreCompleto || source.nombres);
    }
    if ("username" in source) {
        return buildActor(typeof source.id === "string" ? source.id : undefined, source.username || source.email);
    }
    return undefined;
}
function isVentaSnapshotImmutableState(estado) {
    return estado === enums_1.VentaState.CONFIRMADA || estado === enums_1.VentaState.ANULADA;
}
class VentaSnapshot {
    constructor(data) {
        var _a, _b, _c, _d, _e, _f;
        this.id = data.id;
        this.type = (_a = data.type) !== null && _a !== void 0 ? _a : exports.VENTA_SNAPSHOT_TYPE;
        this.ventaId = data.ventaId;
        this.createdAt = normalizeDate(data.createdAt);
        this.items = Object.freeze(data.items.map((item) => {
            var _a, _b, _c, _d;
            return ({
                ...item,
                nombre: (_a = safeTrim(item.nombre)) !== null && _a !== void 0 ? _a : item.presentacionId,
                imagenUrl: safeTrim(item.imagenUrl),
                unidadComercial: safeTrim(item.unidadComercial),
                cantidadVendida: Number((_b = item.cantidadVendida) !== null && _b !== void 0 ? _b : 0),
                precioUnitario: roundMoney(Number((_c = item.precioUnitario) !== null && _c !== void 0 ? _c : 0)),
                total: roundMoney(Number((_d = item.total) !== null && _d !== void 0 ? _d : 0)),
                montoModificado: typeof item.montoModificado === "boolean" ? item.montoModificado : undefined,
                descuento: typeof item.descuento === "number"
                    ? roundMoney(Number(item.descuento))
                    : undefined,
            });
        }));
        this.subtotal = roundMoney(Number((_b = data.subtotal) !== null && _b !== void 0 ? _b : 0));
        this.descuentoTotal =
            data.descuentoTotal === undefined
                ? undefined
                : roundMoney(Number((_c = data.descuentoTotal) !== null && _c !== void 0 ? _c : 0));
        this.impuesto = roundMoney(Number((_d = data.impuesto) !== null && _d !== void 0 ? _d : 0));
        this.montoRedondeo =
            data.montoRedondeo === undefined
                ? undefined
                : roundMoney(Number((_e = data.montoRedondeo) !== null && _e !== void 0 ? _e : 0));
        this.total = roundMoney(Number((_f = data.total) !== null && _f !== void 0 ? _f : 0));
        this.codigoVenta = safeTrim(data.codigoVenta);
        this.procedencia = data.procedencia;
        this.cliente = data.cliente ? { ...data.cliente } : undefined;
        this.vendedor = data.vendedor ? { ...data.vendedor } : undefined;
        const validation = VentaSnapshot.validar(this.toJSON());
        if (!validation.valida) {
            throw new Error(validation.errores.join("; "));
        }
    }
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            ventaId: this.ventaId,
            createdAt: this.createdAt,
            items: this.items.map((item) => ({ ...item })),
            subtotal: this.subtotal,
            descuentoTotal: this.descuentoTotal,
            impuesto: this.impuesto,
            montoRedondeo: this.montoRedondeo,
            total: this.total,
            codigoVenta: this.codigoVenta,
            procedencia: this.procedencia,
            cliente: this.cliente ? { ...this.cliente } : undefined,
            vendedor: this.vendedor ? { ...this.vendedor } : undefined,
        };
    }
    static fromJSON(snapshot) {
        return new VentaSnapshot(snapshot);
    }
    static fromVenta(venta, context = {}) {
        var _a, _b, _c;
        const items = context.items;
        if (!items) {
            throw new Error("VentaSnapshotBuildContext.items es requerido porque Venta.items solo contiene el conteo");
        }
        if (items.length !== venta.items) {
            throw new Error("Venta.items debe coincidir con la cantidad de VentaSnapshot.items");
        }
        const descuentoTotal = sumItemDiscounts(items);
        return new VentaSnapshot({
            id: (_a = safeTrim(context.id)) !== null && _a !== void 0 ? _a : buildVentaSnapshotId(venta.id),
            ventaId: venta.id,
            createdAt: normalizeDate((_c = (_b = context.createdAt) !== null && _b !== void 0 ? _b : venta.createdAt) !== null && _c !== void 0 ? _c : Date.now()),
            items,
            subtotal: venta.subtotal,
            descuentoTotal,
            impuesto: venta.impuesto,
            montoRedondeo: typeof venta.montoRedondeo === "number"
                ? roundMoney(Number(venta.montoRedondeo))
                : undefined,
            total: venta.total,
            codigoVenta: venta.codigoVenta,
            procedencia: venta.procedencia,
            cliente: mapVentaSnapshotActor(context.cliente),
            vendedor: mapVentaSnapshotActor(context.vendedor),
        });
    }
    static tryFromVenta(venta, context = {}) {
        try {
            return { snapshot: VentaSnapshot.fromVenta(venta, context) };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }
    static validar(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const errores = [];
        if (!safeTrim(data.id)) {
            errores.push("VentaSnapshot.id es requerido");
        }
        if (data.type !== exports.VENTA_SNAPSHOT_TYPE) {
            errores.push(`VentaSnapshot.type debe ser '${exports.VENTA_SNAPSHOT_TYPE}'`);
        }
        if (!safeTrim(data.ventaId)) {
            errores.push("VentaSnapshot.ventaId es requerido");
        }
        if (!Array.isArray(data.items) || data.items.length === 0) {
            errores.push("VentaSnapshot.items debe tener al menos un elemento");
        }
        if (Number((_a = data.subtotal) !== null && _a !== void 0 ? _a : 0) < 0) {
            errores.push("VentaSnapshot.subtotal no puede ser negativo");
        }
        if (Number((_b = data.descuentoTotal) !== null && _b !== void 0 ? _b : sumItemDiscounts(data.items)) < 0) {
            errores.push("VentaSnapshot.descuentoTotal no puede ser negativo");
        }
        if (Number((_c = data.impuesto) !== null && _c !== void 0 ? _c : 0) < 0) {
            errores.push("VentaSnapshot.impuesto no puede ser negativo");
        }
        if (Number((_d = data.total) !== null && _d !== void 0 ? _d : 0) < 0) {
            errores.push("VentaSnapshot.total no puede ser negativo");
        }
        const descuentoTotal = roundMoney(Number((_e = data.descuentoTotal) !== null && _e !== void 0 ? _e : sumItemDiscounts(data.items)));
        const montoRedondeo = roundMoney(Number((_f = data.montoRedondeo) !== null && _f !== void 0 ? _f : 0));
        if (roundMoney(Number((_g = data.subtotal) !== null && _g !== void 0 ? _g : 0) - descuentoTotal + Number((_h = data.impuesto) !== null && _h !== void 0 ? _h : 0) + montoRedondeo) !==
            roundMoney(Number((_j = data.total) !== null && _j !== void 0 ? _j : 0))) {
            errores.push("VentaSnapshot.total debe ser consistente con subtotal - descuentoTotal + impuesto + montoRedondeo");
        }
        (_k = data.items) === null || _k === void 0 ? void 0 : _k.forEach((item, index) => {
            var _a, _b, _c, _d;
            if (!safeTrim(item.id)) {
                errores.push(`VentaSnapshot.items[${index}].id es requerido`);
            }
            if (!safeTrim(item.presentacionId)) {
                errores.push(`VentaSnapshot.items[${index}].presentacionId es requerido`);
            }
            if (!safeTrim(item.nombre)) {
                errores.push(`VentaSnapshot.items[${index}].nombre es requerido`);
            }
            if (Number((_a = item.cantidadVendida) !== null && _a !== void 0 ? _a : 0) <= 0) {
                errores.push(`VentaSnapshot.items[${index}].cantidadVendida debe ser mayor a 0`);
            }
            if (Number((_b = item.precioUnitario) !== null && _b !== void 0 ? _b : 0) < 0) {
                errores.push(`VentaSnapshot.items[${index}].precioUnitario no puede ser negativo`);
            }
            if (Number((_c = item.total) !== null && _c !== void 0 ? _c : 0) < 0) {
                errores.push(`VentaSnapshot.items[${index}].total no puede ser negativo`);
            }
            if (Number((_d = item.descuento) !== null && _d !== void 0 ? _d : 0) < 0) {
                errores.push(`VentaSnapshot.items[${index}].descuento no puede ser negativo`);
            }
            if (item.montoModificado !== undefined &&
                typeof item.montoModificado !== "boolean") {
                errores.push(`VentaSnapshot.items[${index}].montoModificado debe ser booleano`);
            }
        });
        return {
            valida: errores.length === 0,
            errores,
        };
    }
}
exports.VentaSnapshot = VentaSnapshot;
