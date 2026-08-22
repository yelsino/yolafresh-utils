"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.construirMovimientoAplicacionMermaInventarioV2 = exports.validarEvolucionMermaInventario = exports.puedeTransicionarMermaInventario = exports.validarMermaInventarioConPolitica = exports.validarMermaInventario = exports.construirIdMovimientoMermaInventarioV2 = exports.validarAjusteInventario = exports.puedeTransicionarConteoInventario = exports.validarConteoInventarioLinea = exports.validarConteoInventario = exports.validarMovimientoInventarioV2 = exports.validarEvolucionPoliticaInventario = exports.validarCreacionPoliticaInventario = exports.validarPoliticaInventario = exports.resolverPoliticaInventario = exports.calcularStockDisponibleBase = exports.construirIdStockProductoBaseAlmacen = exports.calcularDiferenciaConteo = exports.convertirCantidadAUnidadBase = exports.validarConversionInventario = exports.redondearCantidadInventario = void 0;
const ajuste_inventario_contract_1 = require("../contracts/ajuste-inventario.contract");
const conteo_inventario_contract_1 = require("../contracts/conteo-inventario.contract");
const inventory_quantity_v2_contract_1 = require("../contracts/inventory-quantity-v2.contract");
const movimiento_inventario_v2_contract_1 = require("../contracts/movimiento-inventario-v2.contract");
const politica_inventario_contract_1 = require("../contracts/politica-inventario.contract");
const conteo_inventario_contract_2 = require("../contracts/conteo-inventario.contract");
const ajuste_inventario_contract_2 = require("../contracts/ajuste-inventario.contract");
const esTextoNoVacio = (value) => typeof value === "string" && value.trim().length > 0;
const esNumeroFinito = (value) => typeof value === "number" && Number.isFinite(value);
const resultado = (errores) => ({
    valido: errores.length === 0,
    errores,
});
const casiIguales = (left, right, precision) => Math.abs(left - right) <= Math.pow(10, -precision) + Number.EPSILON;
const redondearCantidadInventario = (cantidad, precisionCantidadBase) => {
    if (!esNumeroFinito(cantidad)) {
        throw new Error("cantidad_inventario_no_finita");
    }
    if (!Number.isInteger(precisionCantidadBase) ||
        precisionCantidadBase < 0 ||
        precisionCantidadBase > 9) {
        throw new Error("precision_cantidad_base_invalida");
    }
    const factor = Math.pow(10, precisionCantidadBase);
    return Math.round((cantidad + Number.EPSILON) * factor) / factor;
};
exports.redondearCantidadInventario = redondearCantidadInventario;
const validarConversionInventario = (conversion) => {
    const errores = [];
    const usaPresentacion = conversion.presentacionId !== undefined;
    if (!esTextoNoVacio(conversion.productoBaseId)) {
        errores.push("conversion.productoBaseId es requerido");
    }
    if (usaPresentacion && !esTextoNoVacio(conversion.presentacionId)) {
        errores.push("conversion.presentacionId no puede estar vacío");
    }
    if (!esTextoNoVacio(conversion.unidadOperacion)) {
        errores.push("conversion.unidadOperacion es requerida");
    }
    if (!esTextoNoVacio(conversion.unidadBase)) {
        errores.push("conversion.unidadBase es requerida");
    }
    if (!esNumeroFinito(conversion.factorUnidadBase) ||
        conversion.factorUnidadBase <= 0) {
        errores.push("conversion.factorUnidadBase debe ser mayor a 0");
    }
    if (!Number.isInteger(conversion.precisionCantidadBase) ||
        conversion.precisionCantidadBase < 0 ||
        conversion.precisionCantidadBase > 9) {
        errores.push("conversion.precisionCantidadBase debe estar entre 0 y 9");
    }
    if (usaPresentacion) {
        if (!Number.isSafeInteger(conversion.versionConversion) ||
            Number(conversion.versionConversion) < 1) {
            errores.push("conversion.versionConversion es requerida para una presentación y debe ser un entero seguro positivo");
        }
    }
    else {
        if (conversion.versionConversion !== undefined) {
            errores.push("conversion.versionConversion no aplica sin presentacionId");
        }
        if (conversion.factorUnidadBase !== 1 ||
            conversion.unidadOperacion !== conversion.unidadBase) {
            errores.push("conversion sin presentacionId exige captura directa en unidad base con factor 1");
        }
    }
    if (!esNumeroFinito(conversion.capturadaAt) || conversion.capturadaAt < 0) {
        errores.push("conversion.capturadaAt es inválida");
    }
    return resultado(errores);
};
exports.validarConversionInventario = validarConversionInventario;
const convertirCantidadAUnidadBase = (cantidadOperacion, conversion) => {
    const validacion = (0, exports.validarConversionInventario)(conversion);
    if (!validacion.valido) {
        throw new Error(validacion.errores.join("; "));
    }
    if (!esNumeroFinito(cantidadOperacion) || cantidadOperacion < 0) {
        throw new Error("cantidad_operacion_invalida");
    }
    return (0, exports.redondearCantidadInventario)(cantidadOperacion * conversion.factorUnidadBase, conversion.precisionCantidadBase);
};
exports.convertirCantidadAUnidadBase = convertirCantidadAUnidadBase;
const calcularDiferenciaConteo = (cantidadContadaBase, cantidadTeoricaBase, precisionCantidadBase = 6) => (0, exports.redondearCantidadInventario)(cantidadContadaBase - cantidadTeoricaBase, precisionCantidadBase);
exports.calcularDiferenciaConteo = calcularDiferenciaConteo;
const construirIdStockProductoBaseAlmacen = (productoBaseId, almacenId) => {
    const producto = productoBaseId.trim();
    const almacen = almacenId.trim();
    if (!producto || !almacen) {
        throw new Error("clave_stock_base_almacen_incompleta");
    }
    return `stock_producto_base_almacen:${encodeURIComponent(producto)}:${encodeURIComponent(almacen)}`;
};
exports.construirIdStockProductoBaseAlmacen = construirIdStockProductoBaseAlmacen;
const calcularStockDisponibleBase = (stock) => stock.cantidadFisicaBase - stock.cantidadReservadaBase;
exports.calcularStockDisponibleBase = calcularStockDisponibleBase;
const configuracionPredeterminada = {
    modo: politica_inventario_contract_1.ModoControlInventario.FLEXIBLE,
    inventarioInicialRequerido: false,
    conteoCiego: true,
    toleranciaCantidadBase: 0,
    toleranciaPorcentaje: 0,
    requiereAprobacionAjuste: true,
    requiereEvidenciaMerma: false,
};
const semanticaModo = {
    [politica_inventario_contract_1.ModoControlInventario.ESTRICTO]: {
        registrarMovimientos: true,
        validarStockAntesDeVender: true,
        permitirStockNegativo: false,
        accionStockInsuficiente: "BLOQUEAR",
    },
    [politica_inventario_contract_1.ModoControlInventario.FLEXIBLE]: {
        registrarMovimientos: true,
        validarStockAntesDeVender: true,
        permitirStockNegativo: true,
        accionStockInsuficiente: "ADVERTIR",
    },
    [politica_inventario_contract_1.ModoControlInventario.REFERENCIAL]: {
        registrarMovimientos: true,
        validarStockAntesDeVender: false,
        permitirStockNegativo: true,
        accionStockInsuficiente: "PERMITIR",
    },
    [politica_inventario_contract_1.ModoControlInventario.SIN_CONTROL]: {
        registrarMovimientos: false,
        validarStockAntesDeVender: false,
        permitirStockNegativo: true,
        accionStockInsuficiente: "PERMITIR",
    },
};
const coincideAlcance = (politica, contexto) => {
    const { alcance } = politica;
    if (alcance.empresaId !== contexto.empresaId)
        return false;
    switch (alcance.nivel) {
        case politica_inventario_contract_1.NivelPoliticaInventario.EMPRESA:
            return true;
        case politica_inventario_contract_1.NivelPoliticaInventario.ALMACEN:
            return alcance.almacenId === contexto.almacenId;
        case politica_inventario_contract_1.NivelPoliticaInventario.PRODUCTO:
            return alcance.productoBaseId === contexto.productoBaseId;
        case politica_inventario_contract_1.NivelPoliticaInventario.PRODUCTO_ALMACEN:
            return (alcance.almacenId === contexto.almacenId &&
                alcance.productoBaseId === contexto.productoBaseId);
        default:
            return false;
    }
};
const elegirPoliticaMasReciente = (candidatas) => [...candidatas].sort((left, right) => right.version - left.version ||
    right.updatedAt - left.updatedAt ||
    right.id.localeCompare(left.id))[0];
/**
 * Materializa una política de forma determinista. Solo una política activa por
 * nivel participa: gana mayor `version`, luego `updatedAt` y finalmente `id`.
 */
const resolverPoliticaInventario = (politicas, contexto) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const aplicadas = politica_inventario_contract_1.PRECEDENCIA_POLITICA_INVENTARIO.map((nivel) => elegirPoliticaMasReciente(politicas.filter((politica) => politica.activa &&
        politica.alcance.nivel === nivel &&
        coincideAlcance(politica, contexto)))).filter((politica) => Boolean(politica));
    const configuracion = aplicadas.reduce((acumulada, politica) => ({
        ...acumulada,
        ...politica.configuracion,
    }), { ...configuracionPredeterminada });
    const modo = (_a = configuracion.modo) !== null && _a !== void 0 ? _a : politica_inventario_contract_1.ModoControlInventario.FLEXIBLE;
    return {
        modo,
        ...semanticaModo[modo],
        inventarioInicialRequerido: (_b = configuracion.inventarioInicialRequerido) !== null && _b !== void 0 ? _b : false,
        conteoCiego: (_c = configuracion.conteoCiego) !== null && _c !== void 0 ? _c : true,
        frecuenciaConteoDias: configuracion.frecuenciaConteoDias,
        toleranciaCantidadBase: (_d = configuracion.toleranciaCantidadBase) !== null && _d !== void 0 ? _d : 0,
        toleranciaPorcentaje: (_e = configuracion.toleranciaPorcentaje) !== null && _e !== void 0 ? _e : 0,
        requiereAprobacionAjuste: (_f = configuracion.requiereAprobacionAjuste) !== null && _f !== void 0 ? _f : true,
        umbralAprobacionCantidadBase: configuracion.umbralAprobacionCantidadBase,
        umbralAprobacionValor: configuracion.umbralAprobacionValor,
        requiereEvidenciaMerma: (_g = configuracion.requiereEvidenciaMerma) !== null && _g !== void 0 ? _g : false,
        fuentesAplicadas: aplicadas.map((politica) => politica.id),
    };
};
exports.resolverPoliticaInventario = resolverPoliticaInventario;
const validarPoliticaInventario = (politica) => {
    var _a, _b, _c;
    const errores = [];
    if (!esTextoNoVacio(politica.id))
        errores.push("politica.id es requerido");
    if (politica.type !== politica_inventario_contract_1.POLITICA_INVENTARIO_TYPE) {
        errores.push("politica.type es inválido");
    }
    if (politica.schemaVersion !== inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION) {
        errores.push("politica.schemaVersion debe ser 2");
    }
    if (!Object.values(politica_inventario_contract_1.NivelPoliticaInventario).includes(politica.alcance.nivel)) {
        errores.push("politica.alcance.nivel es invalido");
    }
    if (!esTextoNoVacio(politica.alcance.empresaId)) {
        errores.push("politica.alcance.empresaId es requerido");
    }
    if ((politica.alcance.nivel === politica_inventario_contract_1.NivelPoliticaInventario.ALMACEN ||
        politica.alcance.nivel === politica_inventario_contract_1.NivelPoliticaInventario.PRODUCTO_ALMACEN) &&
        !esTextoNoVacio(politica.alcance.almacenId)) {
        errores.push("politica.alcance.almacenId es requerido");
    }
    if ((politica.alcance.nivel === politica_inventario_contract_1.NivelPoliticaInventario.PRODUCTO ||
        politica.alcance.nivel === politica_inventario_contract_1.NivelPoliticaInventario.PRODUCTO_ALMACEN) &&
        !esTextoNoVacio(politica.alcance.productoBaseId)) {
        errores.push("politica.alcance.productoBaseId es requerido");
    }
    if (!Number.isInteger(politica.version) || politica.version < 1) {
        errores.push("politica.version debe ser un entero positivo");
    }
    if (typeof politica.activa !== "boolean") {
        errores.push("politica.activa debe ser booleana");
    }
    if (!politica.actor || !esTextoNoVacio(politica.actor.usuarioId)) {
        errores.push("politica.actor.usuarioId es requerido");
    }
    if (((_a = politica.actor) === null || _a === void 0 ? void 0 : _a.usuarioNombre) !== undefined &&
        !esTextoNoVacio(politica.actor.usuarioNombre)) {
        errores.push("politica.actor.usuarioNombre no puede estar vacio");
    }
    if (((_b = politica.actor) === null || _b === void 0 ? void 0 : _b.dispositivoId) !== undefined &&
        !esTextoNoVacio(politica.actor.dispositivoId)) {
        errores.push("politica.actor.dispositivoId no puede estar vacio");
    }
    if (((_c = politica.actor) === null || _c === void 0 ? void 0 : _c.sesionId) !== undefined &&
        !esTextoNoVacio(politica.actor.sesionId)) {
        errores.push("politica.actor.sesionId no puede estar vacio");
    }
    if (!esTextoNoVacio(politica.operationId)) {
        errores.push("politica.operationId es requerido");
    }
    if (!esTextoNoVacio(politica.idempotencyKey)) {
        errores.push("politica.idempotencyKey es requerido");
    }
    if (!Number.isSafeInteger(politica.createdAt) ||
        politica.createdAt <= 0) {
        errores.push("politica.createdAt es invalido");
    }
    if (!Number.isSafeInteger(politica.updatedAt) ||
        politica.updatedAt <= 0) {
        errores.push("politica.updatedAt es invalido");
    }
    if (politica.updatedAt < politica.createdAt) {
        errores.push("politica.updatedAt no puede ser anterior a createdAt");
    }
    const cfg = politica.configuracion;
    if (cfg.modo !== undefined && !Object.values(politica_inventario_contract_1.ModoControlInventario).includes(cfg.modo)) {
        errores.push("politica.configuracion.modo es invalido");
    }
    for (const [campo, value] of [
        ["inventarioInicialRequerido", cfg.inventarioInicialRequerido],
        ["conteoCiego", cfg.conteoCiego],
        ["requiereAprobacionAjuste", cfg.requiereAprobacionAjuste],
        ["requiereEvidenciaMerma", cfg.requiereEvidenciaMerma],
    ]) {
        if (value !== undefined && typeof value !== "boolean") {
            errores.push(`politica.configuracion.${campo} debe ser booleano`);
        }
    }
    for (const [campo, value] of [
        ["toleranciaCantidadBase", cfg.toleranciaCantidadBase],
        ["toleranciaPorcentaje", cfg.toleranciaPorcentaje],
        ["umbralAprobacionCantidadBase", cfg.umbralAprobacionCantidadBase],
        ["umbralAprobacionValor", cfg.umbralAprobacionValor],
    ]) {
        if (value !== undefined && (!esNumeroFinito(value) || value < 0)) {
            errores.push(`politica.configuracion.${campo} no puede ser negativo`);
        }
    }
    if (cfg.frecuenciaConteoDias !== undefined &&
        (!Number.isSafeInteger(cfg.frecuenciaConteoDias) ||
            cfg.frecuenciaConteoDias < 1)) {
        errores.push("politica.configuracion.frecuenciaConteoDias debe ser un entero positivo");
    }
    if (cfg.toleranciaPorcentaje !== undefined &&
        cfg.toleranciaPorcentaje > 100) {
        errores.push("politica.configuracion.toleranciaPorcentaje no puede exceder 100");
    }
    return resultado(errores);
};
exports.validarPoliticaInventario = validarPoliticaInventario;
const serializarPoliticaEstable = (value) => {
    if (Array.isArray(value)) {
        return `[${value.map((item) => serializarPoliticaEstable(item)).join(",")}]`;
    }
    if (value && typeof value === "object") {
        return `{${Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => `${JSON.stringify(key)}:${serializarPoliticaEstable(item)}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
};
const validarCreacionPoliticaInventario = (politica) => {
    const validacion = (0, exports.validarPoliticaInventario)(politica);
    const errores = [...validacion.errores];
    if (politica.version !== 1) {
        errores.push("la creacion de politica exige version 1");
    }
    return resultado(errores);
};
exports.validarCreacionPoliticaInventario = validarCreacionPoliticaInventario;
/**
 * Valida CAS de dominio para una politica. Un replay estructuralmente identico
 * es idempotente; una edicion real conserva alcance/createdAt e incrementa una
 * sola version con nuevas claves de operacion.
 */
const validarEvolucionPoliticaInventario = (actual, candidata) => {
    const errores = [
        ...(0, exports.validarPoliticaInventario)(actual).errores.map((error) => `actual.${error}`),
        ...(0, exports.validarPoliticaInventario)(candidata).errores.map((error) => `candidata.${error}`),
    ];
    if (errores.length > 0)
        return resultado(errores);
    const actualSerializada = serializarPoliticaEstable(actual);
    const candidataSerializada = serializarPoliticaEstable(candidata);
    if (actualSerializada === candidataSerializada)
        return resultado([]);
    if (actual.id !== candidata.id)
        errores.push("politica.id es inmutable");
    if (actual.type !== candidata.type)
        errores.push("politica.type es inmutable");
    if (actual.schemaVersion !== candidata.schemaVersion) {
        errores.push("politica.schemaVersion es inmutable");
    }
    if (serializarPoliticaEstable(actual.alcance) !==
        serializarPoliticaEstable(candidata.alcance)) {
        errores.push("politica.alcance es inmutable; cree otra politica");
    }
    if (actual.createdAt !== candidata.createdAt) {
        errores.push("politica.createdAt es inmutable");
    }
    if (candidata.version !== actual.version + 1) {
        errores.push("politica.version debe incrementar exactamente en uno");
    }
    if (candidata.updatedAt < actual.updatedAt) {
        errores.push("politica.updatedAt no puede retroceder");
    }
    if (candidata.operationId === actual.operationId) {
        errores.push("una edicion exige un operationId nuevo");
    }
    if (candidata.idempotencyKey === actual.idempotencyKey) {
        errores.push("una edicion exige una idempotencyKey nueva");
    }
    return resultado(errores);
};
exports.validarEvolucionPoliticaInventario = validarEvolucionPoliticaInventario;
const signoEsperadoMovimiento = (tipo) => {
    switch (tipo) {
        case movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.ENTRADA:
        case movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.TRANSFERENCIA_ENTRADA:
            return 1;
        case movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.SALIDA:
        case movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.TRANSFERENCIA_SALIDA:
            return -1;
        case movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.AJUSTE:
            return 0;
    }
};
const validarMovimientoInventarioV2 = (movimiento) => {
    const errores = [];
    if (!esTextoNoVacio(movimiento.id))
        errores.push("movimiento.id es requerido");
    if (movimiento.type !== movimiento_inventario_v2_contract_1.MOVIMIENTO_INVENTARIO_V2_TYPE) {
        errores.push("movimiento.type es inválido");
    }
    if (movimiento.schemaVersion !== inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION) {
        errores.push("movimiento.schemaVersion debe ser 2");
    }
    if (!esTextoNoVacio(movimiento.almacenId)) {
        errores.push("movimiento.almacenId es requerido");
    }
    if (!esTextoNoVacio(movimiento.operationId)) {
        errores.push("movimiento.operationId es requerido");
    }
    if (!esTextoNoVacio(movimiento.idempotencyKey)) {
        errores.push("movimiento.idempotencyKey es requerido");
    }
    if (!esTextoNoVacio(movimiento.correlationId)) {
        errores.push("movimiento.correlationId es requerido");
    }
    if (!esTextoNoVacio(movimiento.origen.documentoId)) {
        errores.push("movimiento.origen.documentoId es requerido");
    }
    if (!Array.isArray(movimiento.items) || movimiento.items.length === 0) {
        errores.push("movimiento.items requiere al menos una línea");
        return resultado(errores);
    }
    const ids = new Set();
    const signoEsperado = signoEsperadoMovimiento(movimiento.tipo);
    movimiento.items.forEach((linea, index) => {
        const ruta = `movimiento.items[${index}]`;
        if (!esTextoNoVacio(linea.id))
            errores.push(`${ruta}.id es requerido`);
        else if (ids.has(linea.id))
            errores.push(`${ruta}.id está duplicado`);
        else
            ids.add(linea.id);
        if (!esTextoNoVacio(linea.productoBaseId)) {
            errores.push(`${ruta}.productoBaseId es requerido`);
        }
        if (linea.almacenId !== movimiento.almacenId) {
            errores.push(`${ruta}.almacenId no coincide con la cabecera`);
        }
        if (!esNumeroFinito(linea.cantidadOperacion) || linea.cantidadOperacion <= 0) {
            errores.push(`${ruta}.cantidadOperacion debe ser mayor a 0`);
        }
        if (!esNumeroFinito(linea.cantidadBaseDelta) || linea.cantidadBaseDelta === 0) {
            errores.push(`${ruta}.cantidadBaseDelta debe ser no cero`);
        }
        const conversion = (0, exports.validarConversionInventario)(linea.conversionSnapshot);
        errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
        if (linea.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
            linea.conversionSnapshot.unidadBase !== linea.unidadBase) {
            errores.push(`${ruta}.conversionSnapshot no corresponde a la línea`);
        }
        if (esNumeroFinito(linea.cantidadOperacion) &&
            linea.cantidadOperacion > 0 &&
            conversion.valido &&
            esNumeroFinito(linea.cantidadBaseDelta)) {
            const esperada = (0, exports.convertirCantidadAUnidadBase)(linea.cantidadOperacion, linea.conversionSnapshot);
            if (!casiIguales(Math.abs(linea.cantidadBaseDelta), esperada, linea.conversionSnapshot.precisionCantidadBase)) {
                errores.push(`${ruta}.cantidadBaseDelta no coincide con la conversión`);
            }
        }
        if (signoEsperado !== 0 &&
            esNumeroFinito(linea.cantidadBaseDelta) &&
            Math.sign(linea.cantidadBaseDelta) !== signoEsperado) {
            errores.push(`${ruta}.cantidadBaseDelta tiene signo incompatible`);
        }
    });
    return resultado(errores);
};
exports.validarMovimientoInventarioV2 = validarMovimientoInventarioV2;
const validarConteoInventario = (conteo) => {
    const errores = [];
    if (!esTextoNoVacio(conteo.id))
        errores.push("conteo.id es requerido");
    if (conteo.type !== conteo_inventario_contract_2.CONTEO_INVENTARIO_TYPE) {
        errores.push("conteo.type es inválido");
    }
    if (conteo.schemaVersion !== inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION) {
        errores.push("conteo.schemaVersion debe ser 2");
    }
    if (!esTextoNoVacio(conteo.empresaId)) {
        errores.push("conteo.empresaId es requerido");
    }
    if (!esTextoNoVacio(conteo.almacenId)) {
        errores.push("conteo.almacenId es requerido");
    }
    const totales = conteo.totales;
    const valores = [
        totales.lineasEsperadas,
        totales.lineasPendientes,
        totales.lineasContadas,
        totales.lineasReconteo,
        totales.lineasValidadas,
        totales.lineasConDiferencia,
    ];
    if (valores.some((value) => !Number.isInteger(value) || value < 0)) {
        errores.push("conteo.totales solo admite enteros no negativos");
    }
    if (totales.lineasPendientes +
        totales.lineasContadas +
        totales.lineasReconteo +
        totales.lineasValidadas !==
        totales.lineasEsperadas) {
        errores.push("conteo.totales no concilia con lineasEsperadas");
    }
    if (totales.lineasConDiferencia > totales.lineasEsperadas) {
        errores.push("conteo.totales.lineasConDiferencia excede lineasEsperadas");
    }
    if ((conteo.estado === conteo_inventario_contract_1.EstadoConteoInventario.APROBADO ||
        conteo.estado === conteo_inventario_contract_1.EstadoConteoInventario.APLICADO) &&
        (!conteo.aprobadoPor || !esNumeroFinito(conteo.aprobadoAt))) {
        errores.push("conteo aprobado requiere actor y fecha de aprobación");
    }
    if ((conteo.estado === conteo_inventario_contract_1.EstadoConteoInventario.APROBADO ||
        conteo.estado === conteo_inventario_contract_1.EstadoConteoInventario.APLICADO) &&
        (totales.lineasValidadas !== totales.lineasEsperadas ||
            totales.lineasPendientes !== 0 ||
            totales.lineasContadas !== 0 ||
            totales.lineasReconteo !== 0)) {
        errores.push("conteo aprobado requiere todas sus líneas validadas");
    }
    if (conteo.estado === conteo_inventario_contract_1.EstadoConteoInventario.APLICADO) {
        const tieneAjuste = esTextoNoVacio(conteo.ajusteInventarioId);
        const tieneMovimiento = esTextoNoVacio(conteo.movimientoInventarioId);
        if (totales.lineasConDiferencia > 0 &&
            (!tieneAjuste || !tieneMovimiento)) {
            errores.push("conteo aplicado con diferencias requiere ajuste y movimiento resultante");
        }
        if (totales.lineasConDiferencia === 0 &&
            (tieneAjuste || tieneMovimiento)) {
            errores.push("conteo aplicado sin diferencias no debe generar ajuste ni movimiento cero");
        }
    }
    if (conteo.estado === conteo_inventario_contract_1.EstadoConteoInventario.CANCELADO &&
        (!conteo.canceladoPor ||
            !esNumeroFinito(conteo.canceladoAt) ||
            !esTextoNoVacio(conteo.motivoCancelacion))) {
        errores.push("conteo cancelado requiere actor, fecha y motivo");
    }
    return resultado(errores);
};
exports.validarConteoInventario = validarConteoInventario;
const validarConteoInventarioLinea = (linea) => {
    var _a;
    const errores = [];
    if (!esTextoNoVacio(linea.id))
        errores.push("linea.id es requerido");
    if (linea.type !== conteo_inventario_contract_2.CONTEO_INVENTARIO_LINEA_TYPE) {
        errores.push("linea.type es inválido");
    }
    if (linea.schemaVersion !== inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION) {
        errores.push("linea.schemaVersion debe ser 2");
    }
    if (!esTextoNoVacio(linea.conteoId)) {
        errores.push("linea.conteoId es requerido");
    }
    if (!esTextoNoVacio(linea.productoBaseId)) {
        errores.push("linea.productoBaseId es requerido");
    }
    if (!esTextoNoVacio(linea.almacenId)) {
        errores.push("linea.almacenId es requerido");
    }
    if (!Number.isInteger(linea.versionProyeccionAlCorte) || linea.versionProyeccionAlCorte < 0) {
        errores.push("linea.versionProyeccionAlCorte debe ser entero no negativo");
    }
    if (!esNumeroFinito(linea.cantidadTeoricaBaseAlCorte)) {
        errores.push("linea.cantidadTeoricaBaseAlCorte debe ser finita");
    }
    const ids = new Set();
    const rondas = new Set();
    linea.capturas.forEach((captura, index) => {
        const ruta = `linea.capturas[${index}]`;
        if (!esTextoNoVacio(captura.id))
            errores.push(`${ruta}.id es requerido`);
        else if (ids.has(captura.id))
            errores.push(`${ruta}.id está duplicado`);
        else
            ids.add(captura.id);
        if (!Number.isInteger(captura.ronda) || captura.ronda < 1) {
            errores.push(`${ruta}.ronda debe ser entero positivo`);
        }
        else if (rondas.has(captura.ronda)) {
            errores.push(`${ruta}.ronda está duplicada`);
        }
        else
            rondas.add(captura.ronda);
        if (!esNumeroFinito(captura.cantidadOperacion) || captura.cantidadOperacion < 0) {
            errores.push(`${ruta}.cantidadOperacion no puede ser negativa`);
        }
        if (!esNumeroFinito(captura.cantidadBase) || captura.cantidadBase < 0) {
            errores.push(`${ruta}.cantidadBase no puede ser negativa`);
        }
        const conversion = (0, exports.validarConversionInventario)(captura.conversionSnapshot);
        errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
        if (captura.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
            captura.conversionSnapshot.unidadBase !== linea.unidadBase) {
            errores.push(`${ruta}.conversionSnapshot no corresponde a la línea`);
        }
        if (conversion.valido &&
            esNumeroFinito(captura.cantidadOperacion) &&
            captura.cantidadOperacion >= 0 &&
            esNumeroFinito(captura.cantidadBase)) {
            const esperada = (0, exports.convertirCantidadAUnidadBase)(captura.cantidadOperacion, captura.conversionSnapshot);
            if (!casiIguales(captura.cantidadBase, esperada, captura.conversionSnapshot.precisionCantidadBase)) {
                errores.push(`${ruta}.cantidadBase no coincide con la conversión`);
            }
        }
    });
    const capturaVigente = linea.capturas.find((captura) => captura.id === linea.capturaVigenteId);
    if (linea.capturaVigenteId && !capturaVigente) {
        errores.push("linea.capturaVigenteId no existe en capturas");
    }
    if (linea.estado !== conteo_inventario_contract_1.EstadoLineaConteoInventario.PENDIENTE &&
        !capturaVigente) {
        errores.push("linea no pendiente requiere una captura vigente");
    }
    if (capturaVigente && esNumeroFinito(linea.cantidadTeoricaBaseAlCorte)) {
        if (linea.cantidadContadaBase === undefined ||
            !casiIguales(linea.cantidadContadaBase, capturaVigente.cantidadBase, capturaVigente.conversionSnapshot.precisionCantidadBase)) {
            errores.push("linea.cantidadContadaBase no coincide con la captura vigente");
        }
        const diferencia = (0, exports.calcularDiferenciaConteo)(capturaVigente.cantidadBase, linea.cantidadTeoricaBaseAlCorte, capturaVigente.conversionSnapshot.precisionCantidadBase);
        if (linea.diferenciaBase === undefined ||
            !casiIguales(linea.diferenciaBase, diferencia, capturaVigente.conversionSnapshot.precisionCantidadBase)) {
            errores.push("linea.diferenciaBase no coincide con el conteo");
        }
    }
    if (linea.estado === conteo_inventario_contract_1.EstadoLineaConteoInventario.VALIDADA) {
        if (!linea.revisadaPor || !esTextoNoVacio(linea.revisadaPor.usuarioId)) {
            errores.push("linea validada requiere actor revisor");
        }
        if (!esNumeroFinito(linea.revisadaAt)) {
            errores.push("linea validada requiere fecha de revisión");
        }
        if (esNumeroFinito(linea.diferenciaBase) &&
            !casiIguales(linea.diferenciaBase, 0, (_a = capturaVigente === null || capturaVigente === void 0 ? void 0 : capturaVigente.conversionSnapshot.precisionCantidadBase) !== null && _a !== void 0 ? _a : 9) &&
            !esTextoNoVacio(linea.motivoDiferenciaCodigo)) {
            errores.push("linea validada con diferencia requiere código de motivo");
        }
    }
    return resultado(errores);
};
exports.validarConteoInventarioLinea = validarConteoInventarioLinea;
const transicionesConteo = {
    [conteo_inventario_contract_1.EstadoConteoInventario.BORRADOR]: [
        conteo_inventario_contract_1.EstadoConteoInventario.EN_CURSO,
        conteo_inventario_contract_1.EstadoConteoInventario.CANCELADO,
    ],
    [conteo_inventario_contract_1.EstadoConteoInventario.EN_CURSO]: [
        conteo_inventario_contract_1.EstadoConteoInventario.EN_REVISION,
        conteo_inventario_contract_1.EstadoConteoInventario.CANCELADO,
    ],
    [conteo_inventario_contract_1.EstadoConteoInventario.EN_REVISION]: [
        conteo_inventario_contract_1.EstadoConteoInventario.EN_CURSO,
        conteo_inventario_contract_1.EstadoConteoInventario.APROBADO,
        conteo_inventario_contract_1.EstadoConteoInventario.CANCELADO,
    ],
    [conteo_inventario_contract_1.EstadoConteoInventario.APROBADO]: [
        conteo_inventario_contract_1.EstadoConteoInventario.APLICADO,
        conteo_inventario_contract_1.EstadoConteoInventario.CANCELADO,
    ],
    [conteo_inventario_contract_1.EstadoConteoInventario.APLICADO]: [],
    [conteo_inventario_contract_1.EstadoConteoInventario.CANCELADO]: [],
};
const puedeTransicionarConteoInventario = (estadoActual, estadoDestino) => transicionesConteo[estadoActual].includes(estadoDestino);
exports.puedeTransicionarConteoInventario = puedeTransicionarConteoInventario;
const validarAprobacion = (documento, errores) => {
    var _a;
    if (!((_a = documento.aprobacion) === null || _a === void 0 ? void 0 : _a.solicitadoPor) || !esNumeroFinito(documento.aprobacion.solicitadoAt)) {
        errores.push("aprobacion requiere solicitante y fecha");
    }
    if ((documento.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.APROBADO ||
        documento.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.APLICADO) &&
        (!documento.aprobacion.aprobadoPor ||
            !esNumeroFinito(documento.aprobacion.aprobadoAt))) {
        errores.push("documento aprobado requiere actor y fecha de aprobación");
    }
    if (documento.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.RECHAZADO &&
        (!documento.aprobacion.rechazadoPor ||
            !esNumeroFinito(documento.aprobacion.rechazadoAt))) {
        errores.push("documento rechazado requiere actor y fecha de rechazo");
    }
    if (documento.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.APLICADO &&
        !esTextoNoVacio(documento.movimientoInventarioId)) {
        errores.push("documento aplicado requiere movimiento resultante");
    }
};
const validarAjusteInventario = (ajuste) => {
    const errores = [];
    if (!esTextoNoVacio(ajuste.id))
        errores.push("ajuste.id es requerido");
    if (ajuste.type !== ajuste_inventario_contract_2.AJUSTE_INVENTARIO_TYPE) {
        errores.push("ajuste.type es inválido");
    }
    if (ajuste.schemaVersion !== inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION) {
        errores.push("ajuste.schemaVersion debe ser 2");
    }
    if (!esTextoNoVacio(ajuste.operationId)) {
        errores.push("ajuste.operationId es requerido");
    }
    if (!esTextoNoVacio(ajuste.idempotencyKey)) {
        errores.push("ajuste.idempotencyKey es requerido");
    }
    if (!Array.isArray(ajuste.lineas) || ajuste.lineas.length === 0) {
        errores.push("ajuste.lineas requiere al menos una línea");
    }
    else {
        ajuste.lineas.forEach((linea, index) => {
            const ruta = `ajuste.lineas[${index}]`;
            if (linea.almacenId !== ajuste.almacenId) {
                errores.push(`${ruta}.almacenId no coincide con la cabecera`);
            }
            if (linea.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
                linea.conversionSnapshot.unidadBase !== linea.unidadBase) {
                errores.push(`${ruta}.conversionSnapshot no corresponde a la línea`);
            }
            const conversion = (0, exports.validarConversionInventario)(linea.conversionSnapshot);
            errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
            if (!esNumeroFinito(linea.cantidadTeoricaBase)) {
                errores.push(`${ruta}.cantidadTeoricaBase debe ser finita`);
            }
            if (!esNumeroFinito(linea.cantidadObjetivoBase)) {
                errores.push(`${ruta}.cantidadObjetivoBase debe ser finita`);
            }
            const cantidadesValidas = esNumeroFinito(linea.cantidadTeoricaBase) &&
                esNumeroFinito(linea.cantidadObjetivoBase);
            const esperada = cantidadesValidas
                ? (0, exports.calcularDiferenciaConteo)(linea.cantidadObjetivoBase, linea.cantidadTeoricaBase, linea.conversionSnapshot.precisionCantidadBase)
                : undefined;
            if (!esNumeroFinito(linea.cantidadBaseDelta) ||
                (esperada !== undefined &&
                    !casiIguales(linea.cantidadBaseDelta, esperada, linea.conversionSnapshot.precisionCantidadBase))) {
                errores.push(`${ruta}.cantidadBaseDelta no concilia con el objetivo`);
            }
            if (!esTextoNoVacio(linea.motivoCodigo)) {
                errores.push(`${ruta}.motivoCodigo es requerido`);
            }
        });
    }
    validarAprobacion(ajuste, errores);
    return resultado(errores);
};
exports.validarAjusteInventario = validarAjusteInventario;
const validarActorMerma = (actor, ruta, errores) => {
    if (!actor || !esTextoNoVacio(actor.usuarioId)) {
        errores.push(`${ruta}.actor.usuarioId es requerido`);
    }
    if ((actor === null || actor === void 0 ? void 0 : actor.usuarioNombre) !== undefined && !esTextoNoVacio(actor.usuarioNombre)) {
        errores.push(`${ruta}.actor.usuarioNombre no puede estar vacio`);
    }
    if ((actor === null || actor === void 0 ? void 0 : actor.dispositivoId) !== undefined && !esTextoNoVacio(actor.dispositivoId)) {
        errores.push(`${ruta}.actor.dispositivoId no puede estar vacio`);
    }
    if ((actor === null || actor === void 0 ? void 0 : actor.sesionId) !== undefined && !esTextoNoVacio(actor.sesionId)) {
        errores.push(`${ruta}.actor.sesionId no puede estar vacio`);
    }
};
const validarAccionMerma = (accion, ruta, errores) => {
    if (!accion) {
        errores.push(`${ruta} es requerida`);
        return;
    }
    if (!esTextoNoVacio(accion.operationId)) {
        errores.push(`${ruta}.operationId es requerido`);
    }
    if (!esTextoNoVacio(accion.idempotencyKey)) {
        errores.push(`${ruta}.idempotencyKey es requerido`);
    }
    validarActorMerma(accion.actor, ruta, errores);
    if (!Number.isSafeInteger(accion.registradaAt) || accion.registradaAt <= 0) {
        errores.push(`${ruta}.registradaAt es invalida`);
    }
};
const validarAccionVersionadaMerma = (accion, ruta, expectedVersion, errores) => {
    validarAccionMerma(accion, ruta, errores);
    if ((accion === null || accion === void 0 ? void 0 : accion.expectedVersion) !== expectedVersion) {
        errores.push(`${ruta}.expectedVersion debe ser ${expectedVersion}`);
    }
};
const mismoActorMerma = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const construirIdMovimientoMermaInventarioV2 = (mermaId) => {
    const id = mermaId.trim();
    if (!id)
        throw new Error("merma_id_requerido");
    return `movimiento_inventario_v2:merma:${encodeURIComponent(id)}:salida`;
};
exports.construirIdMovimientoMermaInventarioV2 = construirIdMovimientoMermaInventarioV2;
const validarMermaInventario = (merma) => {
    const errores = [];
    if (!esTextoNoVacio(merma.id))
        errores.push("merma.id es requerido");
    if (merma.type !== ajuste_inventario_contract_2.MERMA_INVENTARIO_TYPE) {
        errores.push("merma.type es inválido");
    }
    if (merma.schemaVersion !== inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION) {
        errores.push("merma.schemaVersion debe ser 2");
    }
    if (!esTextoNoVacio(merma.operationId)) {
        errores.push("merma.operationId es requerido");
    }
    if (!esTextoNoVacio(merma.idempotencyKey)) {
        errores.push("merma.idempotencyKey es requerido");
    }
    if (!esTextoNoVacio(merma.empresaId)) {
        errores.push("merma.empresaId es requerido");
    }
    if (!esTextoNoVacio(merma.almacenId)) {
        errores.push("merma.almacenId es requerido");
    }
    if (merma.evidenciaIds !== undefined &&
        (!Array.isArray(merma.evidenciaIds) ||
            merma.evidenciaIds.some((id) => !esTextoNoVacio(id)))) {
        errores.push("merma.evidenciaIds solo admite IDs no vacios");
    }
    if (!Array.isArray(merma.lineas) || merma.lineas.length === 0) {
        errores.push("merma.lineas requiere al menos una línea");
    }
    else {
        const ids = new Set();
        merma.lineas.forEach((linea, index) => {
            const ruta = `merma.lineas[${index}]`;
            if (!esTextoNoVacio(linea.id))
                errores.push(`${ruta}.id es requerido`);
            else if (ids.has(linea.id))
                errores.push(`${ruta}.id esta duplicado`);
            else
                ids.add(linea.id);
            if (!esTextoNoVacio(linea.productoBaseId)) {
                errores.push(`${ruta}.productoBaseId es requerido`);
            }
            if (linea.almacenId !== merma.almacenId) {
                errores.push(`${ruta}.almacenId no coincide con la cabecera`);
            }
            const conversion = (0, exports.validarConversionInventario)(linea.conversionSnapshot);
            errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
            if (linea.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
                linea.conversionSnapshot.unidadBase !== linea.unidadBase) {
                errores.push(`${ruta}.conversionSnapshot no corresponde a la línea`);
            }
            if (!esNumeroFinito(linea.cantidadOperacion) || linea.cantidadOperacion <= 0) {
                errores.push(`${ruta}.cantidadOperacion debe ser mayor a 0`);
            }
            if (!esNumeroFinito(linea.cantidadBase) || linea.cantidadBase <= 0) {
                errores.push(`${ruta}.cantidadBase debe ser mayor a 0`);
            }
            if (conversion.valido &&
                esNumeroFinito(linea.cantidadOperacion) &&
                linea.cantidadOperacion > 0 &&
                esNumeroFinito(linea.cantidadBase)) {
                const esperada = (0, exports.convertirCantidadAUnidadBase)(linea.cantidadOperacion, linea.conversionSnapshot);
                if (!casiIguales(linea.cantidadBase, esperada, linea.conversionSnapshot.precisionCantidadBase)) {
                    errores.push(`${ruta}.cantidadBase no coincide con la conversión`);
                }
            }
            if (linea.motivo === ajuste_inventario_contract_1.MotivoMermaInventario.OTRO &&
                !esTextoNoVacio(linea.motivoDetalle)) {
                errores.push(`${ruta}.motivoDetalle es requerido para OTRO`);
            }
            if (!Object.values(ajuste_inventario_contract_1.MotivoMermaInventario).includes(linea.motivo)) {
                errores.push(`${ruta}.motivo es invalido`);
            }
            if (linea.costoUnitarioBaseSnapshot !== undefined &&
                (!esNumeroFinito(linea.costoUnitarioBaseSnapshot) ||
                    linea.costoUnitarioBaseSnapshot < 0)) {
                errores.push(`${ruta}.costoUnitarioBaseSnapshot no puede ser negativo`);
            }
        });
    }
    validarAprobacion(merma, errores);
    const tieneVersion = merma.version !== undefined;
    const tieneFlujo = merma.flujo !== undefined;
    if (tieneVersion !== tieneFlujo) {
        errores.push("merma.version y merma.flujo deben coexistir");
    }
    if (tieneVersion && tieneFlujo) {
        const flujo = merma.flujo;
        if (!Number.isSafeInteger(merma.version) || merma.version < 1) {
            errores.push("merma.version debe ser un entero positivo");
        }
        validarAccionMerma(flujo.creacion, "merma.flujo.creacion", errores);
        if (flujo.solicitud) {
            validarAccionVersionadaMerma(flujo.solicitud, "merma.flujo.solicitud", 1, errores);
        }
        if (flujo.aprobacion) {
            validarAccionVersionadaMerma(flujo.aprobacion, "merma.flujo.aprobacion", 2, errores);
        }
        if (flujo.rechazo) {
            validarAccionVersionadaMerma(flujo.rechazo, "merma.flujo.rechazo", 2, errores);
            if (!esTextoNoVacio(flujo.rechazo.comentario)) {
                errores.push("merma.flujo.rechazo.comentario es requerido");
            }
        }
        if (flujo.aplicacion) {
            validarAccionVersionadaMerma(flujo.aplicacion, "merma.flujo.aplicacion", 3, errores);
        }
        if (flujo.cancelacion) {
            const expectedVersion = flujo.solicitud ? 2 : 1;
            validarAccionVersionadaMerma(flujo.cancelacion, "merma.flujo.cancelacion", expectedVersion, errores);
            if (!esTextoNoVacio(flujo.cancelacion.comentario)) {
                errores.push("merma.flujo.cancelacion.comentario es requerido");
            }
        }
        const acciones = [
            flujo.creacion,
            flujo.solicitud,
            flujo.aprobacion,
            flujo.rechazo,
            flujo.aplicacion,
            flujo.cancelacion,
        ].filter((accion) => Boolean(accion));
        const operationIds = new Set();
        const idempotencyKeys = new Set();
        let fechaAnterior = merma.createdAt;
        for (const accion of acciones) {
            if (operationIds.has(accion.operationId)) {
                errores.push("cada accion de merma exige operationId diferente");
            }
            if (idempotencyKeys.has(accion.idempotencyKey)) {
                errores.push("cada accion de merma exige idempotencyKey diferente");
            }
            operationIds.add(accion.operationId);
            idempotencyKeys.add(accion.idempotencyKey);
            if (accion.registradaAt < fechaAnterior) {
                errores.push("las acciones de merma deben conservar orden temporal");
            }
            fechaAnterior = accion.registradaAt;
        }
        if (merma.updatedAt < fechaAnterior) {
            errores.push("merma.updatedAt no puede ser anterior a una accion");
        }
        const accionVigente = merma.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.BORRADOR
            ? flujo.creacion
            : merma.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.PENDIENTE_APROBACION
                ? flujo.solicitud
                : merma.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.APROBADO
                    ? flujo.aprobacion
                    : merma.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.RECHAZADO
                        ? flujo.rechazo
                        : merma.estado === ajuste_inventario_contract_1.EstadoAprobacionInventario.APLICADO
                            ? flujo.aplicacion
                            : flujo.cancelacion;
        if (accionVigente &&
            (merma.operationId !== accionVigente.operationId ||
                merma.idempotencyKey !== accionVigente.idempotencyKey)) {
            errores.push("merma operationId/idempotencyKey deben reflejar la accion vigente");
        }
        if (flujo.solicitud) {
            if (!mismoActorMerma(flujo.solicitud.actor, merma.aprobacion.solicitadoPor) || flujo.solicitud.registradaAt !== merma.aprobacion.solicitadoAt) {
                errores.push("merma.aprobacion no concilia con flujo.solicitud");
            }
        }
        if (flujo.aprobacion) {
            if (!mismoActorMerma(flujo.aprobacion.actor, merma.aprobacion.aprobadoPor) || flujo.aprobacion.registradaAt !== merma.aprobacion.aprobadoAt) {
                errores.push("merma.aprobacion no concilia con flujo.aprobacion");
            }
        }
        if (flujo.rechazo) {
            if (!mismoActorMerma(flujo.rechazo.actor, merma.aprobacion.rechazadoPor) ||
                flujo.rechazo.registradaAt !== merma.aprobacion.rechazadoAt) {
                errores.push("merma.aprobacion no concilia con flujo.rechazo");
            }
        }
        const movimientoEsperado = esTextoNoVacio(merma.id)
            ? (0, exports.construirIdMovimientoMermaInventarioV2)(merma.id)
            : undefined;
        switch (merma.estado) {
            case ajuste_inventario_contract_1.EstadoAprobacionInventario.BORRADOR:
                if (merma.version !== 1 ||
                    flujo.solicitud ||
                    flujo.aprobacion ||
                    flujo.rechazo ||
                    flujo.aplicacion ||
                    flujo.cancelacion ||
                    merma.movimientoInventarioId) {
                    errores.push("merma BORRADOR auditada solo admite creacion/version 1");
                }
                break;
            case ajuste_inventario_contract_1.EstadoAprobacionInventario.PENDIENTE_APROBACION:
                if (merma.version !== 2 ||
                    !flujo.solicitud ||
                    flujo.aprobacion ||
                    flujo.rechazo ||
                    flujo.aplicacion ||
                    flujo.cancelacion ||
                    merma.movimientoInventarioId) {
                    errores.push("merma PENDIENTE_APROBACION exige solicitud/version 2");
                }
                break;
            case ajuste_inventario_contract_1.EstadoAprobacionInventario.APROBADO:
                if (merma.version !== 3 ||
                    !flujo.solicitud ||
                    !flujo.aprobacion ||
                    flujo.rechazo ||
                    flujo.aplicacion ||
                    flujo.cancelacion ||
                    merma.movimientoInventarioId) {
                    errores.push("merma APROBADO exige aprobacion/version 3 y aun no mueve stock");
                }
                break;
            case ajuste_inventario_contract_1.EstadoAprobacionInventario.RECHAZADO:
                if (merma.version !== 3 ||
                    !flujo.solicitud ||
                    flujo.aprobacion ||
                    !flujo.rechazo ||
                    flujo.aplicacion ||
                    flujo.cancelacion ||
                    merma.movimientoInventarioId) {
                    errores.push("merma RECHAZADO exige rechazo/version 3 y no mueve stock");
                }
                break;
            case ajuste_inventario_contract_1.EstadoAprobacionInventario.APLICADO:
                if (merma.version !== 4 ||
                    !flujo.solicitud ||
                    !flujo.aprobacion ||
                    flujo.rechazo ||
                    !flujo.aplicacion ||
                    flujo.cancelacion ||
                    merma.movimientoInventarioId !== movimientoEsperado) {
                    errores.push("merma APLICADO exige aprobacion, aplicacion/version 4 y movimiento determinista");
                }
                break;
            case ajuste_inventario_contract_1.EstadoAprobacionInventario.CANCELADO: {
                const versionEsperada = flujo.solicitud ? 3 : 2;
                if (merma.version !== versionEsperada ||
                    flujo.aprobacion ||
                    flujo.rechazo ||
                    flujo.aplicacion ||
                    !flujo.cancelacion ||
                    merma.movimientoInventarioId) {
                    errores.push("merma CANCELADO exige cancelacion antes de decidir/aplicar");
                }
                break;
            }
        }
    }
    if (!Number.isSafeInteger(merma.createdAt) || merma.createdAt <= 0) {
        errores.push("merma.createdAt es invalido");
    }
    if (!Number.isSafeInteger(merma.updatedAt) || merma.updatedAt <= 0) {
        errores.push("merma.updatedAt es invalido");
    }
    if (merma.updatedAt < merma.createdAt) {
        errores.push("merma.updatedAt no puede ser anterior a createdAt");
    }
    return resultado(errores);
};
exports.validarMermaInventario = validarMermaInventario;
const validarMermaInventarioConPolitica = (merma, politica) => {
    const errores = [...(0, exports.validarMermaInventario)(merma).errores];
    if (politica.requiereEvidenciaMerma &&
        (!Array.isArray(merma.evidenciaIds) || merma.evidenciaIds.length === 0)) {
        errores.push("la politica exige evidencia para registrar la merma");
    }
    return resultado(errores);
};
exports.validarMermaInventarioConPolitica = validarMermaInventarioConPolitica;
const serializarMermaEstable = (value) => {
    if (Array.isArray(value)) {
        return `[${value.map((item) => serializarMermaEstable(item)).join(",")}]`;
    }
    if (value && typeof value === "object") {
        return `{${Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => `${JSON.stringify(key)}:${serializarMermaEstable(item)}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
};
const transicionesMerma = {
    [ajuste_inventario_contract_1.EstadoAprobacionInventario.BORRADOR]: [
        ajuste_inventario_contract_1.EstadoAprobacionInventario.PENDIENTE_APROBACION,
        ajuste_inventario_contract_1.EstadoAprobacionInventario.CANCELADO,
    ],
    [ajuste_inventario_contract_1.EstadoAprobacionInventario.PENDIENTE_APROBACION]: [
        ajuste_inventario_contract_1.EstadoAprobacionInventario.APROBADO,
        ajuste_inventario_contract_1.EstadoAprobacionInventario.RECHAZADO,
        ajuste_inventario_contract_1.EstadoAprobacionInventario.CANCELADO,
    ],
    [ajuste_inventario_contract_1.EstadoAprobacionInventario.APROBADO]: [
        ajuste_inventario_contract_1.EstadoAprobacionInventario.APLICADO,
    ],
    [ajuste_inventario_contract_1.EstadoAprobacionInventario.RECHAZADO]: [],
    [ajuste_inventario_contract_1.EstadoAprobacionInventario.APLICADO]: [],
    [ajuste_inventario_contract_1.EstadoAprobacionInventario.CANCELADO]: [],
};
const puedeTransicionarMermaInventario = (estadoActual, estadoDestino) => { var _a, _b; return (_b = (_a = transicionesMerma[estadoActual]) === null || _a === void 0 ? void 0 : _a.includes(estadoDestino)) !== null && _b !== void 0 ? _b : false; };
exports.puedeTransicionarMermaInventario = puedeTransicionarMermaInventario;
const validarEvolucionMermaInventario = (actual, candidata) => {
    const errores = [
        ...(0, exports.validarMermaInventario)(actual).errores.map((error) => `actual.${error}`),
        ...(0, exports.validarMermaInventario)(candidata).errores.map((error) => `candidata.${error}`),
    ];
    if (errores.length > 0)
        return resultado(errores);
    if (!actual.flujo || actual.version === undefined || !candidata.flujo || candidata.version === undefined) {
        errores.push("una evolucion nueva exige flujo auditado y version");
        return resultado(errores);
    }
    if (serializarMermaEstable(actual) === serializarMermaEstable(candidata)) {
        return resultado([]);
    }
    if (actual.version === candidata.version) {
        errores.push("la misma version de merma solo admite un replay identico");
        return resultado(errores);
    }
    if (candidata.version !== actual.version + 1) {
        errores.push("merma.version debe incrementar exactamente en uno");
    }
    if (!(0, exports.puedeTransicionarMermaInventario)(actual.estado, candidata.estado)) {
        errores.push(`transicion de merma no permitida: ${actual.estado} -> ${candidata.estado}`);
    }
    for (const campo of [
        "id",
        "type",
        "schemaVersion",
        "empresaId",
        "almacenId",
        "lineas",
        "evidenciaIds",
        "createdAt",
    ]) {
        if (serializarMermaEstable(actual[campo]) !==
            serializarMermaEstable(candidata[campo])) {
            errores.push(`merma.${campo} es inmutable despues de crear`);
        }
    }
    for (const campo of [
        "creacion",
        "solicitud",
        "aprobacion",
        "rechazo",
        "aplicacion",
        "cancelacion",
    ]) {
        if (actual.flujo[campo] !== undefined &&
            serializarMermaEstable(actual.flujo[campo]) !==
                serializarMermaEstable(candidata.flujo[campo])) {
            errores.push(`merma.flujo.${campo} es append-only`);
        }
    }
    const agregadas = [
        "solicitud",
        "aprobacion",
        "rechazo",
        "aplicacion",
        "cancelacion",
    ].filter((campo) => {
        var _a, _b;
        return ((_a = actual.flujo) === null || _a === void 0 ? void 0 : _a[campo]) === undefined &&
            ((_b = candidata.flujo) === null || _b === void 0 ? void 0 : _b[campo]) !== undefined;
    });
    if (agregadas.length !== 1) {
        errores.push("cada evolucion de merma debe anexar exactamente una accion");
    }
    else {
        const accion = candidata.flujo[agregadas[0]];
        if (accion.expectedVersion !== actual.version) {
            errores.push("la accion de merma tiene expectedVersion obsoleta");
        }
    }
    if (candidata.updatedAt < actual.updatedAt) {
        errores.push("merma.updatedAt no puede retroceder");
    }
    return resultado(errores);
};
exports.validarEvolucionMermaInventario = validarEvolucionMermaInventario;
/**
 * Construye la unica salida posible al aplicar una merma previamente aprobada.
 * El adapter persiste candidata + movimiento + proyeccion atomica y deduplica
 * por ID/idempotencyKey.
 */
const construirMovimientoAplicacionMermaInventarioV2 = (actualAprobada, candidataAplicada) => {
    var _a;
    const evolucion = (0, exports.validarEvolucionMermaInventario)(actualAprobada, candidataAplicada);
    if (!evolucion.valido ||
        actualAprobada.estado !== ajuste_inventario_contract_1.EstadoAprobacionInventario.APROBADO ||
        candidataAplicada.estado !== ajuste_inventario_contract_1.EstadoAprobacionInventario.APLICADO ||
        !((_a = candidataAplicada.flujo) === null || _a === void 0 ? void 0 : _a.aplicacion) ||
        !candidataAplicada.flujo.aprobacion ||
        !candidataAplicada.movimientoInventarioId) {
        throw new Error(evolucion.valido
            ? "la salida de merma exige transicion APROBADO -> APLICADO"
            : evolucion.errores.join("; "));
    }
    const aplicacion = candidataAplicada.flujo.aplicacion;
    const items = candidataAplicada.lineas.map((linea) => ({
        id: `${linea.id}:salida`,
        productoBaseId: linea.productoBaseId,
        almacenId: candidataAplicada.almacenId,
        cantidadOperacion: linea.cantidadOperacion,
        conversionSnapshot: linea.conversionSnapshot,
        cantidadBaseDelta: -linea.cantidadBase,
        unidadBase: linea.unidadBase,
        costoUnitarioBase: linea.costoUnitarioBaseSnapshot,
        lote: linea.lote,
    }));
    return {
        id: candidataAplicada.movimientoInventarioId,
        type: movimiento_inventario_v2_contract_1.MOVIMIENTO_INVENTARIO_V2_TYPE,
        schemaVersion: inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION,
        estado: "APLICADO",
        tipo: movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.SALIDA,
        almacenId: candidataAplicada.almacenId,
        origen: {
            tipo: movimiento_inventario_v2_contract_1.OrigenMovimientoInventarioV2.MERMA,
            documentoId: candidataAplicada.id,
        },
        items,
        operationId: aplicacion.operationId,
        idempotencyKey: `${aplicacion.idempotencyKey}:movimiento_salida`,
        correlationId: candidataAplicada.id,
        causationId: candidataAplicada.flujo.aprobacion.operationId,
        motivoCodigo: "MERMA_APROBADA",
        evidenciaIds: candidataAplicada.evidenciaIds,
        actor: aplicacion.actor,
        fechaEfectiva: aplicacion.registradaAt,
        registradoAt: aplicacion.registradaAt,
    };
};
exports.construirMovimientoAplicacionMermaInventarioV2 = construirMovimientoAplicacionMermaInventarioV2;
