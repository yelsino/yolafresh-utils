"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VentaSnapshot = exports.VENTA_INVENTORY_PLAN_VERSION = exports.VENTA_INVENTORY_PLAN_SCHEMA = exports.VENTA_SNAPSHOT_TYPE = void 0;
exports.validarVentaInventoryPlan = validarVentaInventoryPlan;
exports.buildVentaSnapshotId = buildVentaSnapshotId;
exports.mapVentaSnapshotActor = mapVentaSnapshotActor;
exports.isVentaSnapshotImmutableState = isVentaSnapshotImmutableState;
const enums_1 = require("../../shared/kernel/enums");
exports.VENTA_SNAPSHOT_TYPE = "venta_snapshot";
exports.VENTA_INVENTORY_PLAN_SCHEMA = "venta_inventory_plan_v2";
exports.VENTA_INVENTORY_PLAN_VERSION = 1;
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
const normalizedIds = (values) => Array.isArray(values)
    ? values
        .map((value) => safeTrim(typeof value === "string" ? value : undefined))
        .filter((value) => Boolean(value))
    : [];
function validarVentaInventoryPlan(plan, items, almacenOrigenId) {
    const errores = [];
    if (!plan || typeof plan !== "object") {
        return {
            valida: false,
            errores: ["VentaSnapshot.planInventarioV2 es requerido"],
        };
    }
    if (plan.schema !== exports.VENTA_INVENTORY_PLAN_SCHEMA) {
        errores.push(`VentaSnapshot.planInventarioV2.schema debe ser '${exports.VENTA_INVENTORY_PLAN_SCHEMA}'`);
    }
    if (plan.version !== exports.VENTA_INVENTORY_PLAN_VERSION) {
        errores.push(`VentaSnapshot.planInventarioV2.version debe ser ${exports.VENTA_INVENTORY_PLAN_VERSION}`);
    }
    if (!Number.isInteger(plan.resueltoAt) || Number(plan.resueltoAt) <= 0) {
        errores.push("VentaSnapshot.planInventarioV2.resueltoAt debe ser un timestamp positivo");
    }
    const planAlmacenId = safeTrim(plan.almacenId);
    const snapshotAlmacenId = safeTrim(almacenOrigenId);
    if (!planAlmacenId) {
        errores.push("VentaSnapshot.planInventarioV2.almacenId es requerido");
    }
    if (!snapshotAlmacenId) {
        errores.push("VentaSnapshot.almacenOrigenId es requerido cuando existe planInventarioV2");
    }
    else if (planAlmacenId && planAlmacenId !== snapshotAlmacenId) {
        errores.push("VentaSnapshot.planInventarioV2.almacenId debe coincidir con almacenOrigenId");
    }
    const actor = plan.actor;
    if (!actor || typeof actor !== "object") {
        errores.push("VentaSnapshot.planInventarioV2.actor es requerido");
    }
    else {
        if (!safeTrim(actor.usuarioId)) {
            errores.push("VentaSnapshot.planInventarioV2.actor.usuarioId es requerido");
        }
        for (const [field, value] of [
            ["usuarioNombre", actor.usuarioNombre],
            ["dispositivoId", actor.dispositivoId],
            ["sesionId", actor.sesionId],
        ]) {
            if (value !== undefined && !safeTrim(value)) {
                errores.push(`VentaSnapshot.planInventarioV2.actor.${field} no puede estar vacío`);
            }
        }
    }
    if (!Array.isArray(plan.registrarMovimientoItemIds)) {
        errores.push("VentaSnapshot.planInventarioV2.registrarMovimientoItemIds debe ser un arreglo");
    }
    if (!Array.isArray(plan.omitidosPorPoliticaItemIds)) {
        errores.push("VentaSnapshot.planInventarioV2.omitidosPorPoliticaItemIds debe ser un arreglo");
    }
    const registrarIds = normalizedIds(plan.registrarMovimientoItemIds);
    const omitidosIds = normalizedIds(plan.omitidosPorPoliticaItemIds);
    const itemIds = items.map((item) => safeTrim(item.id));
    if (itemIds.some((itemId) => !itemId)) {
        errores.push("VentaSnapshot.planInventarioV2 no puede particionar items sin id");
    }
    const uniqueItemIds = new Set(itemIds.filter((id) => Boolean(id)));
    if (uniqueItemIds.size !== itemIds.length) {
        errores.push("VentaSnapshot.planInventarioV2 requiere ids de item únicos");
    }
    if (new Set(registrarIds).size !== registrarIds.length) {
        errores.push("VentaSnapshot.planInventarioV2.registrarMovimientoItemIds contiene duplicados");
    }
    if (new Set(omitidosIds).size !== omitidosIds.length) {
        errores.push("VentaSnapshot.planInventarioV2.omitidosPorPoliticaItemIds contiene duplicados");
    }
    const registrarSet = new Set(registrarIds);
    const omitidosSet = new Set(omitidosIds);
    registrarIds.forEach((id) => {
        if (omitidosSet.has(id)) {
            errores.push(`VentaSnapshot.planInventarioV2 contiene el item '${id}' en ambas particiones`);
        }
    });
    [...registrarIds, ...omitidosIds].forEach((id) => {
        if (!uniqueItemIds.has(id)) {
            errores.push(`VentaSnapshot.planInventarioV2 referencia el item inexistente '${id}'`);
        }
    });
    uniqueItemIds.forEach((id) => {
        if (!registrarSet.has(id) && !omitidosSet.has(id)) {
            errores.push(`VentaSnapshot.planInventarioV2 no clasificó el item '${id}'`);
        }
    });
    items.forEach((item, index) => {
        const itemId = safeTrim(item.id);
        if (item.afectaInventario === false) {
            if (itemId && registrarSet.has(itemId)) {
                errores.push(`VentaSnapshot.items[${index}] no inventariable no puede registrar movimiento`);
            }
            if (item.productoBaseId !== undefined ||
                item.unidadBase !== undefined ||
                item.factorConversionBase !== undefined ||
                item.cantidadBase !== undefined ||
                item.versionConversion !== undefined) {
                errores.push(`VentaSnapshot.items[${index}] no inventariable no debe contener conversión física`);
            }
            return;
        }
        if (!itemId || !registrarSet.has(itemId))
            return;
        if (!safeTrim(item.productoBaseId)) {
            errores.push(`VentaSnapshot.items[${index}].productoBaseId es requerido por planInventarioV2`);
        }
        const factorConversionBase = Number(item.factorConversionBase);
        const cantidadBase = Number(item.cantidadBase);
        const versionConversion = item.versionConversion;
        if (!safeTrim(item.unidadBase)) {
            errores.push(`VentaSnapshot.items[${index}].unidadBase es requerida para movimiento planificado`);
        }
        if (!Number.isFinite(factorConversionBase) ||
            factorConversionBase <= 0) {
            errores.push(`VentaSnapshot.items[${index}].factorConversionBase es requerido para movimiento planificado`);
        }
        if (!Number.isFinite(cantidadBase) || cantidadBase <= 0) {
            errores.push(`VentaSnapshot.items[${index}].cantidadBase es requerida para movimiento planificado`);
        }
        if (!Number.isSafeInteger(versionConversion) ||
            Number(versionConversion) < 1) {
            errores.push(`VentaSnapshot.items[${index}].versionConversion es requerida para movimiento planificado y debe ser entero seguro positivo`);
        }
    });
    return { valida: errores.length === 0, errores };
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        this.id = data.id;
        this.type = (_a = data.type) !== null && _a !== void 0 ? _a : exports.VENTA_SNAPSHOT_TYPE;
        this.ventaId = data.ventaId;
        this.createdAt = normalizeDate(data.createdAt);
        this.items = Object.freeze(data.items.map((item) => {
            var _a, _b, _c, _d;
            return ({
                ...item,
                afectaInventario: typeof item.afectaInventario === "boolean"
                    ? item.afectaInventario
                    : undefined,
                nombre: (_a = safeTrim(item.nombre)) !== null && _a !== void 0 ? _a : item.presentacionId,
                productoBaseId: safeTrim(item.productoBaseId),
                imagenUrl: safeTrim(item.imagenUrl),
                unidadComercial: safeTrim(item.unidadComercial),
                cantidadVendida: Number((_b = item.cantidadVendida) !== null && _b !== void 0 ? _b : 0),
                unidadBase: safeTrim(item.unidadBase),
                factorConversionBase: typeof item.factorConversionBase === "number"
                    ? Number(item.factorConversionBase)
                    : undefined,
                cantidadBase: typeof item.cantidadBase === "number"
                    ? Number(item.cantidadBase)
                    : undefined,
                versionConversion: typeof item.versionConversion === "number"
                    ? Number(item.versionConversion)
                    : undefined,
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
        this.procedencia = (0, enums_1.normalizarProcedenciaComercial)(data.procedencia);
        this.cliente = data.cliente ? { ...data.cliente } : undefined;
        this.vendedor = data.vendedor ? { ...data.vendedor } : undefined;
        this.almacenOrigenId = safeTrim(data.almacenOrigenId);
        this.planInventarioV2 = data.planInventarioV2
            ? Object.freeze({
                schema: data.planInventarioV2.schema,
                version: data.planInventarioV2.version,
                resueltoAt: Number(data.planInventarioV2.resueltoAt),
                almacenId: (_g = safeTrim(data.planInventarioV2.almacenId)) !== null && _g !== void 0 ? _g : "",
                actor: Object.freeze({
                    usuarioId: (_j = safeTrim((_h = data.planInventarioV2.actor) === null || _h === void 0 ? void 0 : _h.usuarioId)) !== null && _j !== void 0 ? _j : "",
                    ...(safeTrim((_k = data.planInventarioV2.actor) === null || _k === void 0 ? void 0 : _k.usuarioNombre)
                        ? { usuarioNombre: safeTrim((_l = data.planInventarioV2.actor) === null || _l === void 0 ? void 0 : _l.usuarioNombre) }
                        : {}),
                    ...(safeTrim((_m = data.planInventarioV2.actor) === null || _m === void 0 ? void 0 : _m.dispositivoId)
                        ? { dispositivoId: safeTrim((_o = data.planInventarioV2.actor) === null || _o === void 0 ? void 0 : _o.dispositivoId) }
                        : {}),
                    ...(safeTrim((_p = data.planInventarioV2.actor) === null || _p === void 0 ? void 0 : _p.sesionId)
                        ? { sesionId: safeTrim((_q = data.planInventarioV2.actor) === null || _q === void 0 ? void 0 : _q.sesionId) }
                        : {}),
                }),
                registrarMovimientoItemIds: Object.freeze(normalizedIds(data.planInventarioV2.registrarMovimientoItemIds)),
                omitidosPorPoliticaItemIds: Object.freeze(normalizedIds(data.planInventarioV2.omitidosPorPoliticaItemIds)),
            })
            : undefined;
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
            almacenOrigenId: this.almacenOrigenId,
            planInventarioV2: this.planInventarioV2
                ? {
                    ...this.planInventarioV2,
                    actor: { ...this.planInventarioV2.actor },
                    registrarMovimientoItemIds: [
                        ...this.planInventarioV2.registrarMovimientoItemIds,
                    ],
                    omitidosPorPoliticaItemIds: [
                        ...this.planInventarioV2.omitidosPorPoliticaItemIds,
                    ],
                }
                : undefined,
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
            almacenOrigenId: safeTrim(context.almacenOrigenId),
            planInventarioV2: context.planInventarioV2,
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
            var _a, _b, _c, _d, _e;
            if (!safeTrim(item.id)) {
                errores.push(`VentaSnapshot.items[${index}].id es requerido`);
            }
            if (!safeTrim(item.presentacionId)) {
                errores.push(`VentaSnapshot.items[${index}].presentacionId es requerido`);
            }
            if (!safeTrim(item.nombre)) {
                errores.push(`VentaSnapshot.items[${index}].nombre es requerido`);
            }
            if (item.afectaInventario !== undefined &&
                typeof item.afectaInventario !== "boolean") {
                errores.push(`VentaSnapshot.items[${index}].afectaInventario debe ser booleano`);
            }
            if (item.afectaInventario === false &&
                (item.productoBaseId !== undefined ||
                    item.unidadBase !== undefined ||
                    item.factorConversionBase !== undefined ||
                    item.cantidadBase !== undefined ||
                    item.versionConversion !== undefined)) {
                errores.push(`VentaSnapshot.items[${index}] no inventariable no debe contener conversión física`);
            }
            if (Number((_a = item.cantidadVendida) !== null && _a !== void 0 ? _a : 0) <= 0) {
                errores.push(`VentaSnapshot.items[${index}].cantidadVendida debe ser mayor a 0`);
            }
            if (item.factorConversionBase !== undefined &&
                (!Number.isFinite(item.factorConversionBase) ||
                    item.factorConversionBase <= 0)) {
                errores.push(`VentaSnapshot.items[${index}].factorConversionBase debe ser mayor a 0`);
            }
            if (item.cantidadBase !== undefined &&
                (!Number.isFinite(item.cantidadBase) || item.cantidadBase <= 0)) {
                errores.push(`VentaSnapshot.items[${index}].cantidadBase debe ser mayor a 0`);
            }
            if (item.versionConversion !== undefined &&
                (!Number.isSafeInteger(item.versionConversion) ||
                    item.versionConversion < 1)) {
                errores.push(`VentaSnapshot.items[${index}].versionConversion debe ser entero seguro positivo`);
            }
            if (item.factorConversionBase !== undefined &&
                item.cantidadBase !== undefined) {
                const cantidadBaseEsperada = Math.round(Number((_b = item.cantidadVendida) !== null && _b !== void 0 ? _b : 0) *
                    item.factorConversionBase *
                    1000000) / 1000000;
                if (Math.abs(cantidadBaseEsperada - item.cantidadBase) > 0.000001) {
                    errores.push(`VentaSnapshot.items[${index}].cantidadBase es inconsistente con cantidadVendida y factorConversionBase`);
                }
            }
            if (Number((_c = item.precioUnitario) !== null && _c !== void 0 ? _c : 0) < 0) {
                errores.push(`VentaSnapshot.items[${index}].precioUnitario no puede ser negativo`);
            }
            if (Number((_d = item.total) !== null && _d !== void 0 ? _d : 0) < 0) {
                errores.push(`VentaSnapshot.items[${index}].total no puede ser negativo`);
            }
            if (Number((_e = item.descuento) !== null && _e !== void 0 ? _e : 0) < 0) {
                errores.push(`VentaSnapshot.items[${index}].descuento no puede ser negativo`);
            }
            if (item.montoModificado !== undefined &&
                typeof item.montoModificado !== "boolean") {
                errores.push(`VentaSnapshot.items[${index}].montoModificado debe ser booleano`);
            }
        });
        if (data.planInventarioV2 !== undefined) {
            errores.push(...validarVentaInventoryPlan(data.planInventarioV2, (_l = data.items) !== null && _l !== void 0 ? _l : [], data.almacenOrigenId).errores);
        }
        return {
            valida: errores.length === 0,
            errores,
        };
    }
}
exports.VentaSnapshot = VentaSnapshot;
