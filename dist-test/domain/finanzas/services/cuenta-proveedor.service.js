"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planificarImputacionesCuentaProveedorFifo = exports.reconstruirResumenCuentaProveedor = exports.normalizarMontoCuentaProveedor = exports.deCentimosCuentaProveedor = exports.aCentimosCuentaProveedor = void 0;
const CENTIMOS_POR_UNIDAD = 100;
const aCentimosCuentaProveedor = (monto) => {
    if (!Number.isFinite(monto)) {
        throw new Error("monto_cuenta_proveedor_invalido");
    }
    return Math.round(monto * CENTIMOS_POR_UNIDAD);
};
exports.aCentimosCuentaProveedor = aCentimosCuentaProveedor;
const deCentimosCuentaProveedor = (centimos) => Number((centimos / CENTIMOS_POR_UNIDAD).toFixed(2));
exports.deCentimosCuentaProveedor = deCentimosCuentaProveedor;
const normalizarMontoCuentaProveedor = (monto) => {
    const centimos = (0, exports.aCentimosCuentaProveedor)(monto);
    if (centimos <= 0) {
        throw new Error("monto_cuenta_proveedor_debe_ser_positivo");
    }
    return (0, exports.deCentimosCuentaProveedor)(centimos);
};
exports.normalizarMontoCuentaProveedor = normalizarMontoCuentaProveedor;
const ordenarPorFechaEId = (items) => [...items].sort((left, right) => {
    const byDate = left.createdAt.getTime() - right.createdAt.getTime();
    return byDate !== 0 ? byDate : left.id.localeCompare(right.id);
});
const exigirLibroCompatible = (args) => {
    for (const movimiento of args.movimientos) {
        if (movimiento.cuentaId !== args.cuenta.id ||
            movimiento.proveedorId !== args.cuenta.proveedorId) {
            throw new Error("movimiento_cuenta_proveedor_fuera_de_cuenta");
        }
        if (movimiento.moneda !== args.cuenta.moneda) {
            throw new Error("moneda_cuenta_proveedor_incompatible");
        }
        (0, exports.normalizarMontoCuentaProveedor)(movimiento.monto);
    }
    for (const imputacion of args.imputaciones) {
        if (imputacion.cuentaId !== args.cuenta.id ||
            imputacion.proveedorId !== args.cuenta.proveedorId) {
            throw new Error("imputacion_cuenta_proveedor_fuera_de_cuenta");
        }
        if (imputacion.moneda !== args.cuenta.moneda) {
            throw new Error("moneda_imputacion_cuenta_proveedor_incompatible");
        }
        (0, exports.normalizarMontoCuentaProveedor)(imputacion.monto);
    }
};
const resolverMovimientosReversados = (movimientos) => {
    const porId = new Map(movimientos.map((item) => [item.id, item]));
    const reversaPorOriginal = new Map();
    const excluidos = new Set();
    for (const movimiento of movimientos) {
        const originalId = String(movimiento.reversaDeMovimientoId || "").trim();
        if (movimiento.tipo !== "REVERSA") {
            if (originalId) {
                throw new Error("movimiento_cuenta_proveedor_no_reversa_con_referencia");
            }
            continue;
        }
        if (!originalId) {
            throw new Error("reversa_movimiento_cuenta_proveedor_sin_original");
        }
        const original = porId.get(originalId);
        if (!original || original.tipo === "REVERSA") {
            throw new Error("reversa_movimiento_cuenta_proveedor_original_invalido");
        }
        if (movimiento.direccion === original.direccion ||
            (0, exports.aCentimosCuentaProveedor)(movimiento.monto) !==
                (0, exports.aCentimosCuentaProveedor)(original.monto)) {
            throw new Error("reversa_movimiento_cuenta_proveedor_incompatible");
        }
        if (reversaPorOriginal.has(originalId)) {
            throw new Error("movimiento_cuenta_proveedor_ya_reversado");
        }
        reversaPorOriginal.set(originalId, movimiento.id);
        excluidos.add(originalId);
        excluidos.add(movimiento.id);
    }
    return excluidos;
};
const acumularImputaciones = (imputaciones, movimientosActivos) => {
    var _a, _b, _c, _d;
    const aplicacionesPorId = new Map();
    const reversadoPorAplicacionId = new Map();
    for (const imputacion of ordenarPorFechaEId(imputaciones)) {
        const monto = (0, exports.aCentimosCuentaProveedor)(imputacion.monto);
        if (imputacion.tipo === "APLICACION") {
            if (imputacion.reversaDeImputacionId) {
                throw new Error("aplicacion_cuenta_proveedor_no_puede_referenciar_reversa");
            }
            aplicacionesPorId.set(imputacion.id, imputacion);
            continue;
        }
        const originalId = String(imputacion.reversaDeImputacionId || "").trim();
        const original = aplicacionesPorId.get(originalId);
        if (!original) {
            throw new Error("reversa_imputacion_cuenta_proveedor_sin_original");
        }
        if (original.movimientoOrigenId !== imputacion.movimientoOrigenId ||
            original.movimientoDestinoId !== imputacion.movimientoDestinoId) {
            throw new Error("reversa_imputacion_cuenta_proveedor_incompatible");
        }
        const alreadyReversed = (_a = reversadoPorAplicacionId.get(originalId)) !== null && _a !== void 0 ? _a : 0;
        if (alreadyReversed + monto > (0, exports.aCentimosCuentaProveedor)(original.monto)) {
            throw new Error("reversa_imputacion_cuenta_proveedor_excede_original");
        }
        reversadoPorAplicacionId.set(originalId, alreadyReversed + monto);
    }
    const porOrigen = new Map();
    const porDestino = new Map();
    let cantidadActiva = 0;
    for (const [id, aplicacion] of aplicacionesPorId) {
        if (movimientosActivos &&
            (!movimientosActivos.has(aplicacion.movimientoOrigenId) ||
                !movimientosActivos.has(aplicacion.movimientoDestinoId))) {
            continue;
        }
        const neto = (0, exports.aCentimosCuentaProveedor)(aplicacion.monto) -
            ((_b = reversadoPorAplicacionId.get(id)) !== null && _b !== void 0 ? _b : 0);
        if (neto <= 0)
            continue;
        porOrigen.set(aplicacion.movimientoOrigenId, ((_c = porOrigen.get(aplicacion.movimientoOrigenId)) !== null && _c !== void 0 ? _c : 0) + neto);
        porDestino.set(aplicacion.movimientoDestinoId, ((_d = porDestino.get(aplicacion.movimientoDestinoId)) !== null && _d !== void 0 ? _d : 0) + neto);
        cantidadActiva += 1;
    }
    return { porOrigen, porDestino, cantidadActiva };
};
const reconstruirResumenCuentaProveedor = (args) => {
    var _a, _b, _c, _d;
    exigirLibroCompatible(args);
    const movimientos = ordenarPorFechaEId(args.movimientos.filter((item) => item.estado === "CONTABILIZADO"));
    const movimientosReversados = resolverMovimientosReversados(movimientos);
    const movimientosActivos = movimientos.filter((item) => !movimientosReversados.has(item.id));
    const movimientoPorId = new Map(movimientosActivos.map((item) => [item.id, item]));
    const acumulado = acumularImputaciones(args.imputaciones, new Set(movimientoPorId.keys()));
    let saldoPorPagarCentimos = 0;
    let saldoDebitoNoAplicadoCentimos = 0;
    for (const [movimientoId, aplicado] of acumulado.porOrigen) {
        const movimiento = movimientoPorId.get(movimientoId);
        if (!movimiento || movimiento.direccion !== "DEBITO") {
            throw new Error("origen_imputacion_cuenta_proveedor_no_es_debito");
        }
        if (aplicado > (0, exports.aCentimosCuentaProveedor)(movimiento.monto)) {
            throw new Error("imputacion_cuenta_proveedor_excede_origen");
        }
    }
    for (const [movimientoId, aplicado] of acumulado.porDestino) {
        const movimiento = movimientoPorId.get(movimientoId);
        if (!movimiento || movimiento.direccion !== "CREDITO") {
            throw new Error("destino_imputacion_cuenta_proveedor_no_es_credito");
        }
        if (aplicado > (0, exports.aCentimosCuentaProveedor)(movimiento.monto)) {
            throw new Error("imputacion_cuenta_proveedor_excede_destino");
        }
    }
    for (const movimiento of movimientosActivos) {
        const monto = (0, exports.aCentimosCuentaProveedor)(movimiento.monto);
        if (movimiento.direccion === "CREDITO") {
            saldoPorPagarCentimos +=
                monto - ((_a = acumulado.porDestino.get(movimiento.id)) !== null && _a !== void 0 ? _a : 0);
        }
        else {
            saldoDebitoNoAplicadoCentimos +=
                monto - ((_b = acumulado.porOrigen.get(movimiento.id)) !== null && _b !== void 0 ? _b : 0);
        }
    }
    const reconstruidaAt = (_c = args.reconstruidaAt) !== null && _c !== void 0 ? _c : new Date();
    const ultimoMovimiento = movimientos[movimientos.length - 1];
    const saldoDebitoNoAplicado = (0, exports.deCentimosCuentaProveedor)(saldoDebitoNoAplicadoCentimos);
    return {
        id: args.cuenta.id,
        cuentaId: args.cuenta.id,
        proveedorId: args.cuenta.proveedorId,
        saldoPorPagar: (0, exports.deCentimosCuentaProveedor)(saldoPorPagarCentimos),
        saldoFavorNegocio: saldoDebitoNoAplicado,
        saldoDebitoNoAplicado,
        moneda: args.cuenta.moneda,
        ultimoMovimientoId: ultimoMovimiento === null || ultimoMovimiento === void 0 ? void 0 : ultimoMovimiento.id,
        ultimoMovimientoAt: ultimoMovimiento === null || ultimoMovimiento === void 0 ? void 0 : ultimoMovimiento.occurredAt,
        cantidadMovimientosFuente: movimientos.length,
        cantidadImputacionesFuente: acumulado.cantidadActiva,
        version: (_d = args.version) !== null && _d !== void 0 ? _d : 1,
        reconstruidaAt,
        updatedAt: reconstruidaAt,
    };
};
exports.reconstruirResumenCuentaProveedor = reconstruirResumenCuentaProveedor;
const planificarImputacionesCuentaProveedorFifo = (args) => {
    var _a, _b;
    if (args.movimientoOrigen.cuentaId !== args.cuenta.id ||
        args.movimientoOrigen.direccion !== "DEBITO" ||
        args.movimientoOrigen.estado !== "CONTABILIZADO") {
        throw new Error("origen_imputacion_cuenta_proveedor_invalido");
    }
    exigirLibroCompatible({
        cuenta: args.cuenta,
        movimientos: args.movimientos,
        imputaciones: args.imputaciones,
    });
    const movimientosContabilizados = args.movimientos.filter((item) => item.estado === "CONTABILIZADO");
    const movimientosReversados = resolverMovimientosReversados(movimientosContabilizados);
    if (movimientosReversados.has(args.movimientoOrigen.id)) {
        throw new Error("origen_imputacion_cuenta_proveedor_reversado");
    }
    const movimientosActivos = movimientosContabilizados.filter((item) => !movimientosReversados.has(item.id));
    const acumulado = acumularImputaciones(args.imputaciones, new Set(movimientosActivos.map((item) => item.id)));
    const disponibleOrigen = (0, exports.aCentimosCuentaProveedor)(args.movimientoOrigen.monto) -
        ((_a = acumulado.porOrigen.get(args.movimientoOrigen.id)) !== null && _a !== void 0 ? _a : 0);
    let restante = Math.min(disponibleOrigen, args.montoMaximo === undefined
        ? disponibleOrigen
        : (0, exports.aCentimosCuentaProveedor)((0, exports.normalizarMontoCuentaProveedor)(args.montoMaximo)));
    if (restante <= 0)
        return [];
    const obligaciones = ordenarPorFechaEId(movimientosActivos.filter((item) => item.estado === "CONTABILIZADO" && item.direccion === "CREDITO"));
    const resultado = [];
    for (const obligacion of obligaciones) {
        if (restante <= 0)
            break;
        const pendiente = (0, exports.aCentimosCuentaProveedor)(obligacion.monto) -
            ((_b = acumulado.porDestino.get(obligacion.id)) !== null && _b !== void 0 ? _b : 0);
        if (pendiente <= 0)
            continue;
        const aplicado = Math.min(restante, pendiente);
        resultado.push({
            id: args.idFactory(resultado.length),
            cuentaId: args.cuenta.id,
            proveedorId: args.cuenta.proveedorId,
            tipo: "APLICACION",
            movimientoOrigenId: args.movimientoOrigen.id,
            movimientoDestinoId: obligacion.id,
            monto: (0, exports.deCentimosCuentaProveedor)(aplicado),
            moneda: args.cuenta.moneda,
            estrategia: "FIFO",
            createdAt: args.createdAt,
        });
        restante -= aplicado;
    }
    return resultado;
};
exports.planificarImputacionesCuentaProveedorFifo = planificarImputacionesCuentaProveedorFifo;
