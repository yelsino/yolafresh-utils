"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.construirMovimientosTransferenciaInventarioV2 = exports.assertEvolucionTransferenciaInventarioV2 = exports.validarEvolucionTransferenciaInventarioV2 = exports.assertTransferenciaInventarioV2 = exports.validarTransferenciaInventarioV2 = exports.resumirTransferenciaInventarioV2 = exports.assertTransicionTransferenciaInventarioV2 = exports.puedeAgregarRecepcionTransferenciaInventarioV2 = exports.puedeTransicionarTransferenciaInventarioV2 = void 0;
exports.construirIdMovimientoTransferenciaInventarioV2 = construirIdMovimientoTransferenciaInventarioV2;
const inventory_quantity_v2_contract_1 = require("../contracts/inventory-quantity-v2.contract");
const movimiento_inventario_v2_contract_1 = require("../contracts/movimiento-inventario-v2.contract");
const transferencia_inventario_v2_contract_1 = require("../contracts/transferencia-inventario-v2.contract");
const inventory_v2_helpers_1 = require("./inventory-v2.helpers");
const textoNoVacio = (value) => typeof value === "string" && value.trim().length > 0;
const numeroFinito = (value) => typeof value === "number" && Number.isFinite(value);
const timestampValido = (value) => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const casiIguales = (left, right, precision) => Math.abs(left - right) <= Math.pow(10, -precision) + Number.EPSILON;
const normalizarCero = (value, precision) => casiIguales(value, 0, precision) ? 0 : value;
const validarActor = (actor, ruta, errores) => {
    if (!actor || !textoNoVacio(actor.usuarioId)) {
        errores.push(`${ruta}.actor.usuarioId es requerido`);
    }
    if ((actor === null || actor === void 0 ? void 0 : actor.usuarioNombre) !== undefined && !textoNoVacio(actor.usuarioNombre)) {
        errores.push(`${ruta}.actor.usuarioNombre no puede estar vacio`);
    }
    if ((actor === null || actor === void 0 ? void 0 : actor.dispositivoId) !== undefined && !textoNoVacio(actor.dispositivoId)) {
        errores.push(`${ruta}.actor.dispositivoId no puede estar vacio`);
    }
    if ((actor === null || actor === void 0 ? void 0 : actor.sesionId) !== undefined && !textoNoVacio(actor.sesionId)) {
        errores.push(`${ruta}.actor.sesionId no puede estar vacio`);
    }
};
const validarAccion = (accion, ruta, errores) => {
    if (!accion) {
        errores.push(`${ruta} es requerida`);
        return;
    }
    if (!textoNoVacio(accion.operationId)) {
        errores.push(`${ruta}.operationId es requerido`);
    }
    if (!textoNoVacio(accion.idempotencyKey)) {
        errores.push(`${ruta}.idempotencyKey es requerida`);
    }
    validarActor(accion.actor, ruta, errores);
    if (!timestampValido(accion.registradaAt)) {
        errores.push(`${ruta}.registradaAt es invalida`);
    }
};
const validarAccionVersionada = (accion, ruta, errores) => {
    validarAccion(accion, ruta, errores);
    if (!accion || !Number.isSafeInteger(accion.expectedVersion) || accion.expectedVersion < 1) {
        errores.push(`${ruta}.expectedVersion debe ser un entero positivo`);
    }
};
const validarEvidencias = (evidenciaIds, ruta, errores) => {
    if (evidenciaIds === undefined)
        return;
    if (!Array.isArray(evidenciaIds) ||
        evidenciaIds.some((evidenciaId) => !textoNoVacio(evidenciaId))) {
        errores.push(`${ruta} solo admite IDs no vacios`);
    }
};
const validarLinea = (linea, index, errores) => {
    const ruta = `transferencia.items[${index}]`;
    if (!textoNoVacio(linea.id))
        errores.push(`${ruta}.id es requerido`);
    if (!textoNoVacio(linea.productoBaseId)) {
        errores.push(`${ruta}.productoBaseId es requerido`);
    }
    if (linea.presentacionId !== undefined && !textoNoVacio(linea.presentacionId)) {
        errores.push(`${ruta}.presentacionId no puede estar vacio`);
    }
    if (!textoNoVacio(linea.unidadBase)) {
        errores.push(`${ruta}.unidadBase es requerida`);
    }
    const conversion = (0, inventory_v2_helpers_1.validarConversionInventario)(linea.conversionSnapshot);
    errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
    if (linea.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
        linea.conversionSnapshot.presentacionId !== linea.presentacionId ||
        linea.conversionSnapshot.unidadBase !== linea.unidadBase) {
        errores.push(`${ruta}.conversionSnapshot no corresponde a la linea`);
    }
    if (linea.presentacionId === undefined &&
        (linea.conversionSnapshot.factorUnidadBase !== 1 ||
            linea.conversionSnapshot.unidadOperacion !== linea.unidadBase)) {
        errores.push(`${ruta} sin presentacion exige captura directa con factor 1 y unidad base`);
    }
    if (!numeroFinito(linea.cantidadOperacion) || linea.cantidadOperacion <= 0) {
        errores.push(`${ruta}.cantidadOperacion debe ser mayor a 0`);
    }
    if (!numeroFinito(linea.cantidadBase) || linea.cantidadBase <= 0) {
        errores.push(`${ruta}.cantidadBase debe ser mayor a 0`);
    }
    if (conversion.valido &&
        numeroFinito(linea.cantidadOperacion) &&
        linea.cantidadOperacion > 0 &&
        numeroFinito(linea.cantidadBase)) {
        const esperada = (0, inventory_v2_helpers_1.convertirCantidadAUnidadBase)(linea.cantidadOperacion, linea.conversionSnapshot);
        if (!casiIguales(linea.cantidadBase, esperada, linea.conversionSnapshot.precisionCantidadBase)) {
            errores.push(`${ruta}.cantidadBase no coincide con la conversion`);
        }
    }
    if (linea.costoUnitarioBaseSnapshot !== undefined &&
        (!numeroFinito(linea.costoUnitarioBaseSnapshot) ||
            linea.costoUnitarioBaseSnapshot < 0)) {
        errores.push(`${ruta}.costoUnitarioBaseSnapshot no puede ser negativo`);
    }
};
const validarCantidadNoNegativa = (value, ruta, errores) => {
    if (!numeroFinito(value) || value < 0) {
        errores.push(`${ruta} debe ser un numero no negativo`);
    }
};
const validarLineaRecepcion = (linea, ruta, lineasPorId, errores) => {
    if (!textoNoVacio(linea.lineaTransferenciaId)) {
        errores.push(`${ruta}.lineaTransferenciaId es requerido`);
    }
    else if (!lineasPorId.has(linea.lineaTransferenciaId)) {
        errores.push(`${ruta}.lineaTransferenciaId no existe en el envio`);
    }
    validarCantidadNoNegativa(linea.cantidadBaseAceptada, `${ruta}.cantidadBaseAceptada`, errores);
    validarCantidadNoNegativa(linea.cantidadBaseRechazada, `${ruta}.cantidadBaseRechazada`, errores);
    validarCantidadNoNegativa(linea.cantidadBaseFaltante, `${ruta}.cantidadBaseFaltante`, errores);
    if (numeroFinito(linea.cantidadBaseAceptada) &&
        numeroFinito(linea.cantidadBaseRechazada) &&
        numeroFinito(linea.cantidadBaseFaltante) &&
        linea.cantidadBaseAceptada +
            linea.cantidadBaseRechazada +
            linea.cantidadBaseFaltante <=
            0) {
        errores.push(`${ruta} debe registrar alguna cantidad`);
    }
    if ((linea.cantidadBaseRechazada > 0 || linea.cantidadBaseFaltante > 0) &&
        !textoNoVacio(linea.motivoCodigo)) {
        errores.push(`${ruta}.motivoCodigo es requerido cuando existe diferencia`);
    }
    validarEvidencias(linea.evidenciaIds, `${ruta}.evidenciaIds`, errores);
};
const validarLineaCierre = (linea, ruta, lineasPorId, errores) => {
    if (!textoNoVacio(linea.lineaTransferenciaId)) {
        errores.push(`${ruta}.lineaTransferenciaId es requerido`);
    }
    else if (!lineasPorId.has(linea.lineaTransferenciaId)) {
        errores.push(`${ruta}.lineaTransferenciaId no existe en el envio`);
    }
    validarCantidadNoNegativa(linea.cantidadBaseRechazada, `${ruta}.cantidadBaseRechazada`, errores);
    validarCantidadNoNegativa(linea.cantidadBaseFaltante, `${ruta}.cantidadBaseFaltante`, errores);
    if (numeroFinito(linea.cantidadBaseRechazada) &&
        numeroFinito(linea.cantidadBaseFaltante) &&
        linea.cantidadBaseRechazada + linea.cantidadBaseFaltante <= 0) {
        errores.push(`${ruta} debe cerrar alguna cantidad`);
    }
    if (!textoNoVacio(linea.motivoCodigo)) {
        errores.push(`${ruta}.motivoCodigo es requerido`);
    }
    validarEvidencias(linea.evidenciaIds, `${ruta}.evidenciaIds`, errores);
};
const transicionesTransferencia = Object.freeze({
    [transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.BORRADOR]: Object.freeze([
        transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.ENVIADA,
        transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CANCELADA,
    ]),
    [transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.ENVIADA]: Object.freeze([
        transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA,
        transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.RECIBIDA,
        transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
    ]),
    [transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA]: Object.freeze([
        transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.RECIBIDA,
        transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
    ]),
    [transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.RECIBIDA]: Object.freeze([]),
    [transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA]: Object.freeze([]),
    [transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CANCELADA]: Object.freeze([]),
});
const puedeTransicionarTransferenciaInventarioV2 = (estadoActual, estadoDestino) => { var _a, _b; return (_b = (_a = transicionesTransferencia[estadoActual]) === null || _a === void 0 ? void 0 : _a.includes(estadoDestino)) !== null && _b !== void 0 ? _b : false; };
exports.puedeTransicionarTransferenciaInventarioV2 = puedeTransicionarTransferenciaInventarioV2;
const puedeAgregarRecepcionTransferenciaInventarioV2 = (estadoActual) => estadoActual === transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.ENVIADA ||
    estadoActual === transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA;
exports.puedeAgregarRecepcionTransferenciaInventarioV2 = puedeAgregarRecepcionTransferenciaInventarioV2;
const assertTransicionTransferenciaInventarioV2 = (estadoActual, estadoDestino) => {
    if (!(0, exports.puedeTransicionarTransferenciaInventarioV2)(estadoActual, estadoDestino)) {
        throw new Error(`transicion_transferencia_inventario_v2_no_permitida:${estadoActual}:${estadoDestino}`);
    }
};
exports.assertTransicionTransferenciaInventarioV2 = assertTransicionTransferenciaInventarioV2;
const resumirTransferenciaInventarioV2 = (transferencia) => {
    var _a, _b, _c, _d, _e, _f;
    const porId = new Map();
    for (const linea of (_a = transferencia.items) !== null && _a !== void 0 ? _a : []) {
        porId.set(linea.id, {
            lineaTransferenciaId: linea.id,
            unidadBase: linea.unidadBase,
            cantidadBaseEnviada: linea.cantidadBase,
            cantidadBaseAceptada: 0,
            cantidadBaseRechazada: 0,
            cantidadBaseFaltante: 0,
            cantidadBaseEnTransito: linea.cantidadBase,
        });
    }
    for (const recepcion of (_b = transferencia.recepciones) !== null && _b !== void 0 ? _b : []) {
        for (const recibida of (_c = recepcion.items) !== null && _c !== void 0 ? _c : []) {
            const acumulado = porId.get(recibida.lineaTransferenciaId);
            if (!acumulado)
                continue;
            acumulado.cantidadBaseAceptada += recibida.cantidadBaseAceptada;
            acumulado.cantidadBaseRechazada += recibida.cantidadBaseRechazada;
            acumulado.cantidadBaseFaltante += recibida.cantidadBaseFaltante;
        }
    }
    for (const diferencia of (_e = (_d = transferencia.cierreDiferencia) === null || _d === void 0 ? void 0 : _d.items) !== null && _e !== void 0 ? _e : []) {
        const acumulado = porId.get(diferencia.lineaTransferenciaId);
        if (!acumulado)
            continue;
        acumulado.cantidadBaseRechazada += diferencia.cantidadBaseRechazada;
        acumulado.cantidadBaseFaltante += diferencia.cantidadBaseFaltante;
    }
    const lineas = [...porId.values()].map((linea) => {
        var _a;
        const original = transferencia.items.find((item) => item.id === linea.lineaTransferenciaId);
        const precision = (_a = original === null || original === void 0 ? void 0 : original.conversionSnapshot.precisionCantidadBase) !== null && _a !== void 0 ? _a : 6;
        return {
            ...linea,
            cantidadBaseEnTransito: normalizarCero(linea.cantidadBaseEnviada -
                linea.cantidadBaseAceptada -
                linea.cantidadBaseRechazada -
                linea.cantidadBaseFaltante, precision),
        };
    });
    const porUnidad = new Map();
    for (const linea of lineas) {
        const total = (_f = porUnidad.get(linea.unidadBase)) !== null && _f !== void 0 ? _f : {
            unidadBase: linea.unidadBase,
            cantidadBaseEnviada: 0,
            cantidadBaseAceptada: 0,
            cantidadBaseRechazada: 0,
            cantidadBaseFaltante: 0,
            cantidadBaseEnTransito: 0,
        };
        total.cantidadBaseEnviada += linea.cantidadBaseEnviada;
        total.cantidadBaseAceptada += linea.cantidadBaseAceptada;
        total.cantidadBaseRechazada += linea.cantidadBaseRechazada;
        total.cantidadBaseFaltante += linea.cantidadBaseFaltante;
        total.cantidadBaseEnTransito += linea.cantidadBaseEnTransito;
        porUnidad.set(linea.unidadBase, total);
    }
    return { lineas, totalesPorUnidadBase: [...porUnidad.values()] };
};
exports.resumirTransferenciaInventarioV2 = resumirTransferenciaInventarioV2;
const registrarClaveAccion = (accion, operationIds, idempotencyKeys, errores) => {
    if (!accion)
        return;
    if (operationIds.has(accion.operationId)) {
        errores.push("cada accion exige un operationId diferente");
    }
    if (idempotencyKeys.has(accion.idempotencyKey)) {
        errores.push("cada accion exige una idempotencyKey diferente");
    }
    operationIds.add(accion.operationId);
    idempotencyKeys.add(accion.idempotencyKey);
};
function construirIdMovimientoTransferenciaInventarioV2(transferenciaId, pierna, recepcionId) {
    const id = transferenciaId.trim();
    if (!id)
        throw new Error("transferencia_id_requerido");
    if (pierna === "SALIDA") {
        return `movimiento_inventario_v2:transferencia:${encodeURIComponent(id)}:salida`;
    }
    const recibo = recepcionId === null || recepcionId === void 0 ? void 0 : recepcionId.trim();
    if (!recibo)
        throw new Error("recepcion_id_requerido_para_entrada");
    return `movimiento_inventario_v2:transferencia:${encodeURIComponent(id)}:entrada:${encodeURIComponent(recibo)}`;
}
const validarTransferenciaInventarioV2 = (transferencia) => {
    var _a, _b, _c, _d, _e;
    const errores = [];
    if (!textoNoVacio(transferencia.id))
        errores.push("transferencia.id es requerido");
    if (transferencia.type !== transferencia_inventario_v2_contract_1.TRANSFERENCIA_INVENTARIO_V2_TYPE) {
        errores.push("transferencia.type es invalido");
    }
    if (transferencia.schemaVersion !== inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION) {
        errores.push("transferencia.schemaVersion debe ser 2");
    }
    if (!Number.isSafeInteger(transferencia.version) || transferencia.version < 1) {
        errores.push("transferencia.version debe ser un entero positivo");
    }
    if (!Object.values(transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2).includes(transferencia.estado)) {
        errores.push("transferencia.estado es invalido");
    }
    if (!textoNoVacio(transferencia.empresaId))
        errores.push("transferencia.empresaId es requerido");
    if (!textoNoVacio(transferencia.almacenOrigenId))
        errores.push("transferencia.almacenOrigenId es requerido");
    if (!textoNoVacio(transferencia.almacenDestinoId))
        errores.push("transferencia.almacenDestinoId es requerido");
    if (textoNoVacio(transferencia.almacenOrigenId) &&
        transferencia.almacenOrigenId === transferencia.almacenDestinoId) {
        errores.push("transferencia exige almacenes origen y destino diferentes");
    }
    if (!textoNoVacio(transferencia.correlationId))
        errores.push("transferencia.correlationId es requerido");
    validarEvidencias(transferencia.evidenciaIds, "transferencia.evidenciaIds", errores);
    const lineasPorId = new Map();
    if (!Array.isArray(transferencia.items) || transferencia.items.length === 0) {
        errores.push("transferencia.items requiere al menos una linea");
    }
    else {
        transferencia.items.forEach((linea, index) => {
            validarLinea(linea, index, errores);
            if (textoNoVacio(linea.id)) {
                if (lineasPorId.has(linea.id)) {
                    errores.push(`transferencia.items[${index}].id esta duplicado`);
                }
                lineasPorId.set(linea.id, linea);
            }
        });
    }
    validarAccion(transferencia.creacion, "transferencia.creacion", errores);
    if (transferencia.envio) {
        validarAccionVersionada(transferencia.envio, "transferencia.envio", errores);
        if (transferencia.envio.expectedVersion !== 1) {
            errores.push("transferencia.envio.expectedVersion debe ser 1");
        }
    }
    if (!Array.isArray(transferencia.recepciones)) {
        errores.push("transferencia.recepciones debe ser un arreglo");
    }
    const recepciones = Array.isArray(transferencia.recepciones)
        ? transferencia.recepciones
        : [];
    const recepcionIds = new Set();
    let ultimaFecha = (_b = (_a = transferencia.envio) === null || _a === void 0 ? void 0 : _a.registradaAt) !== null && _b !== void 0 ? _b : (_c = transferencia.creacion) === null || _c === void 0 ? void 0 : _c.registradaAt;
    recepciones.forEach((recepcion, recepcionIndex) => {
        const ruta = `transferencia.recepciones[${recepcionIndex}]`;
        validarAccionVersionada(recepcion, ruta, errores);
        if (!textoNoVacio(recepcion.id))
            errores.push(`${ruta}.id es requerido`);
        else if (recepcionIds.has(recepcion.id))
            errores.push(`${ruta}.id esta duplicado`);
        else
            recepcionIds.add(recepcion.id);
        const expectedVersion = 2 + recepcionIndex;
        if (recepcion.expectedVersion !== expectedVersion) {
            errores.push(`${ruta}.expectedVersion debe ser ${expectedVersion}`);
        }
        if (!transferencia.envio || recepcion.registradaAt < transferencia.envio.registradaAt) {
            errores.push(`${ruta} exige un envio anterior`);
        }
        if (timestampValido(ultimaFecha) && recepcion.registradaAt < ultimaFecha) {
            errores.push(`${ruta}.registradaAt debe conservar el orden de recepcion`);
        }
        ultimaFecha = recepcion.registradaAt;
        if (textoNoVacio(transferencia.id) &&
            textoNoVacio(recepcion.id) &&
            recepcion.movimientoEntradaId !==
                construirIdMovimientoTransferenciaInventarioV2(transferencia.id, "ENTRADA", recepcion.id)) {
            errores.push(`${ruta}.movimientoEntradaId no es determinista`);
        }
        if (!Array.isArray(recepcion.items) || recepcion.items.length === 0) {
            errores.push(`${ruta}.items requiere al menos una linea`);
            return;
        }
        const ids = new Set();
        let aceptadaTotal = 0;
        recepcion.items.forEach((linea, lineaIndex) => {
            const rutaLinea = `${ruta}.items[${lineaIndex}]`;
            validarLineaRecepcion(linea, rutaLinea, lineasPorId, errores);
            if (ids.has(linea.lineaTransferenciaId)) {
                errores.push(`${rutaLinea}.lineaTransferenciaId esta duplicado`);
            }
            ids.add(linea.lineaTransferenciaId);
            if (numeroFinito(linea.cantidadBaseAceptada)) {
                aceptadaTotal += linea.cantidadBaseAceptada;
            }
        });
        if (aceptadaTotal <= 0) {
            errores.push(`${ruta} debe aceptar stock para representar una recepcion fisica`);
        }
    });
    if (transferencia.cierreDiferencia) {
        const cierre = transferencia.cierreDiferencia;
        const ruta = "transferencia.cierreDiferencia";
        validarAccionVersionada(cierre, ruta, errores);
        const expectedVersion = 2 + recepciones.length;
        if (cierre.expectedVersion !== expectedVersion) {
            errores.push(`${ruta}.expectedVersion debe ser ${expectedVersion}`);
        }
        if (!transferencia.envio || cierre.registradaAt < transferencia.envio.registradaAt) {
            errores.push(`${ruta} exige un envio anterior`);
        }
        if (timestampValido(ultimaFecha) && cierre.registradaAt < ultimaFecha) {
            errores.push(`${ruta}.registradaAt no puede ser anterior al ultimo recibo`);
        }
        ultimaFecha = cierre.registradaAt;
        if (!Array.isArray(cierre.items) || cierre.items.length === 0) {
            errores.push(`${ruta}.items requiere al menos una linea`);
        }
        else {
            const ids = new Set();
            cierre.items.forEach((linea, index) => {
                const rutaLinea = `${ruta}.items[${index}]`;
                validarLineaCierre(linea, rutaLinea, lineasPorId, errores);
                if (ids.has(linea.lineaTransferenciaId)) {
                    errores.push(`${rutaLinea}.lineaTransferenciaId esta duplicado`);
                }
                ids.add(linea.lineaTransferenciaId);
            });
        }
    }
    if (transferencia.cancelacion) {
        validarAccionVersionada(transferencia.cancelacion, "transferencia.cancelacion", errores);
        if (transferencia.cancelacion.expectedVersion !== 1) {
            errores.push("transferencia.cancelacion.expectedVersion debe ser 1");
        }
        if (!textoNoVacio(transferencia.cancelacion.motivoCodigo)) {
            errores.push("transferencia.cancelacion.motivoCodigo es requerido");
        }
        if (timestampValido(transferencia.cancelacion.registradaAt) &&
            transferencia.updatedAt < transferencia.cancelacion.registradaAt) {
            errores.push("transferencia.updatedAt no puede ser anterior a cancelacion");
        }
    }
    const operationIds = new Set();
    const idempotencyKeys = new Set();
    registrarClaveAccion(transferencia.creacion, operationIds, idempotencyKeys, errores);
    registrarClaveAccion(transferencia.envio, operationIds, idempotencyKeys, errores);
    for (const recepcion of recepciones) {
        registrarClaveAccion(recepcion, operationIds, idempotencyKeys, errores);
    }
    registrarClaveAccion(transferencia.cierreDiferencia, operationIds, idempotencyKeys, errores);
    registrarClaveAccion(transferencia.cancelacion, operationIds, idempotencyKeys, errores);
    if (!timestampValido(transferencia.createdAt))
        errores.push("transferencia.createdAt es invalido");
    if (!timestampValido(transferencia.updatedAt))
        errores.push("transferencia.updatedAt es invalido");
    if (timestampValido(transferencia.createdAt) &&
        timestampValido(transferencia.updatedAt) &&
        transferencia.updatedAt < transferencia.createdAt) {
        errores.push("transferencia.updatedAt no puede ser anterior a createdAt");
    }
    if (timestampValido((_d = transferencia.creacion) === null || _d === void 0 ? void 0 : _d.registradaAt) &&
        timestampValido(transferencia.createdAt) &&
        transferencia.creacion.registradaAt > transferencia.createdAt) {
        errores.push("transferencia.creacion no puede ser posterior a createdAt");
    }
    if (transferencia.envio &&
        transferencia.envio.registradaAt < transferencia.creacion.registradaAt) {
        errores.push("transferencia.envio no puede ser anterior a creacion");
    }
    if (transferencia.cancelacion &&
        transferencia.cancelacion.registradaAt < transferencia.creacion.registradaAt) {
        errores.push("transferencia.cancelacion no puede ser anterior a creacion");
    }
    if (timestampValido(ultimaFecha) && transferencia.updatedAt < ultimaFecha) {
        errores.push("transferencia.updatedAt no puede ser anterior a una accion");
    }
    const salidaEsperada = textoNoVacio(transferencia.id)
        ? construirIdMovimientoTransferenciaInventarioV2(transferencia.id, "SALIDA")
        : undefined;
    if (transferencia.envio) {
        if (transferencia.movimientoSalidaId !== salidaEsperada) {
            errores.push("transferencia con envio exige movimientoSalidaId determinista");
        }
    }
    else if (transferencia.movimientoSalidaId !== undefined) {
        errores.push("transferencia sin envio no admite movimientoSalidaId");
    }
    const resumen = (0, exports.resumirTransferenciaInventarioV2)(transferencia);
    for (const linea of resumen.lineas) {
        const original = lineasPorId.get(linea.lineaTransferenciaId);
        const precision = (_e = original === null || original === void 0 ? void 0 : original.conversionSnapshot.precisionCantidadBase) !== null && _e !== void 0 ? _e : 6;
        if (linea.cantidadBaseEnTransito < -Math.pow(10, -precision)) {
            errores.push(`transferencia.linea ${linea.lineaTransferenciaId} excede la cantidad enviada`);
        }
    }
    const versionEsperada = transferencia.cancelacion
        ? 2
        : transferencia.envio
            ? 2 + recepciones.length + (transferencia.cierreDiferencia ? 1 : 0)
            : 1;
    if (transferencia.version !== versionEsperada) {
        errores.push(`transferencia.version debe ser ${versionEsperada} para sus acciones`);
    }
    const tieneDiferencia = resumen.lineas.some((linea) => linea.cantidadBaseRechazada > 0 || linea.cantidadBaseFaltante > 0);
    const sinTransito = resumen.lineas.every((linea) => linea.cantidadBaseEnTransito === 0);
    switch (transferencia.estado) {
        case transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.BORRADOR:
            if (transferencia.envio ||
                recepciones.length > 0 ||
                transferencia.cierreDiferencia ||
                transferencia.cancelacion ||
                transferencia.movimientoSalidaId) {
                errores.push("transferencia BORRADOR no admite efectos posteriores");
            }
            break;
        case transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.ENVIADA:
            if (!transferencia.envio || transferencia.movimientoSalidaId !== salidaEsperada) {
                errores.push("transferencia ENVIADA exige envio y salida determinista");
            }
            if (recepciones.length > 0 || transferencia.cierreDiferencia || transferencia.cancelacion) {
                errores.push("transferencia ENVIADA no admite recepciones, cierre ni cancelacion");
            }
            break;
        case transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA:
            if (!transferencia.envio || recepciones.length === 0 || transferencia.cancelacion) {
                errores.push("transferencia PARCIALMENTE_RECIBIDA exige envio y recepcion");
            }
            if (transferencia.cierreDiferencia || sinTransito) {
                errores.push("transferencia PARCIALMENTE_RECIBIDA exige cantidad aun en transito");
            }
            break;
        case transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.RECIBIDA:
            if (!transferencia.envio ||
                recepciones.length === 0 ||
                transferencia.cierreDiferencia ||
                transferencia.cancelacion ||
                !sinTransito ||
                tieneDiferencia) {
                errores.push("transferencia RECIBIDA exige recepcion total sin diferencias");
            }
            break;
        case transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA:
            if (!transferencia.envio ||
                transferencia.cancelacion ||
                !sinTransito ||
                !tieneDiferencia) {
                errores.push("transferencia CERRADA_CON_DIFERENCIA exige conciliar todo lo enviado y una diferencia");
            }
            break;
        case transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CANCELADA:
            if (!transferencia.cancelacion)
                errores.push("transferencia CANCELADA exige cancelacion");
            if (transferencia.envio ||
                recepciones.length > 0 ||
                transferencia.cierreDiferencia ||
                transferencia.movimientoSalidaId) {
                errores.push("solo un BORRADOR sin movimientos puede quedar CANCELADA");
            }
            break;
    }
    return { valido: errores.length === 0, errores };
};
exports.validarTransferenciaInventarioV2 = validarTransferenciaInventarioV2;
const assertTransferenciaInventarioV2 = (transferencia) => {
    const validacion = (0, exports.validarTransferenciaInventarioV2)(transferencia);
    if (!validacion.valido)
        throw new Error(validacion.errores.join("; "));
};
exports.assertTransferenciaInventarioV2 = assertTransferenciaInventarioV2;
const serializarEstable = (value) => {
    if (Array.isArray(value)) {
        return `[${value.map((item) => serializarEstable(item)).join(",")}]`;
    }
    if (value && typeof value === "object") {
        return `{${Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => `${JSON.stringify(key)}:${serializarEstable(item)}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
};
const mismos = (left, right) => serializarEstable(left) === serializarEstable(right);
/**
 * Valida la escritura contra la raiz vigente. Un replay byte-equivalente es
 * idempotente; cualquier cambio real debe sumar una version y una sola accion.
 */
const validarEvolucionTransferenciaInventarioV2 = (actual, candidata) => {
    const errores = [];
    const validaActual = (0, exports.validarTransferenciaInventarioV2)(actual);
    const validaCandidata = (0, exports.validarTransferenciaInventarioV2)(candidata);
    errores.push(...validaActual.errores.map((error) => `actual.${error}`), ...validaCandidata.errores.map((error) => `candidata.${error}`));
    if (errores.length > 0)
        return { valido: false, errores };
    if (mismos(actual, candidata))
        return { valido: true, errores: [] };
    if (actual.version === candidata.version) {
        return {
            valido: false,
            errores: ["la misma version solo admite un replay identico"],
        };
    }
    if (candidata.version !== actual.version + 1) {
        errores.push("la candidata debe incrementar version exactamente en uno");
    }
    for (const campo of [
        "id",
        "type",
        "schemaVersion",
        "empresaId",
        "almacenOrigenId",
        "almacenDestinoId",
        "numeroTransferencia",
        "motivoCodigo",
        "motivoDetalle",
        "observaciones",
        "evidenciaIds",
        "items",
        "correlationId",
        "creacion",
        "createdAt",
    ]) {
        if (!mismos(actual[campo], candidata[campo])) {
            errores.push(`transferencia.${campo} es inmutable despues de crear`);
        }
    }
    if (!mismos(actual.envio, candidata.envio) &&
        actual.envio !== undefined) {
        errores.push("transferencia.envio es append-only");
    }
    if (!mismos(actual.cancelacion, candidata.cancelacion) && actual.cancelacion) {
        errores.push("transferencia.cancelacion es append-only");
    }
    if (!mismos(actual.cierreDiferencia, candidata.cierreDiferencia) &&
        actual.cierreDiferencia) {
        errores.push("transferencia.cierreDiferencia es append-only");
    }
    if (candidata.recepciones.length < actual.recepciones.length ||
        !mismos(actual.recepciones, candidata.recepciones.slice(0, actual.recepciones.length))) {
        errores.push("transferencia.recepciones solo admite append");
    }
    const envioAgregado = !actual.envio && Boolean(candidata.envio);
    const cancelacionAgregada = !actual.cancelacion && Boolean(candidata.cancelacion);
    const cierreAgregado = !actual.cierreDiferencia && Boolean(candidata.cierreDiferencia);
    const recepcionesAgregadas = candidata.recepciones.length - actual.recepciones.length;
    const accionesAgregadas = Number(envioAgregado) +
        Number(cancelacionAgregada) +
        Number(cierreAgregado) +
        recepcionesAgregadas;
    if (accionesAgregadas !== 1 || recepcionesAgregadas > 1) {
        errores.push("cada evolucion debe anexar exactamente una accion");
    }
    const accionAgregada = envioAgregado
        ? candidata.envio
        : cancelacionAgregada
            ? candidata.cancelacion
            : cierreAgregado
                ? candidata.cierreDiferencia
                : recepcionesAgregadas === 1
                    ? candidata.recepciones[candidata.recepciones.length - 1]
                    : undefined;
    if ((accionAgregada === null || accionAgregada === void 0 ? void 0 : accionAgregada.expectedVersion) !== actual.version) {
        errores.push("la accion agregada tiene expectedVersion obsoleta");
    }
    if (candidata.updatedAt < actual.updatedAt) {
        errores.push("transferencia.updatedAt no puede retroceder");
    }
    return { valido: errores.length === 0, errores };
};
exports.validarEvolucionTransferenciaInventarioV2 = validarEvolucionTransferenciaInventarioV2;
const assertEvolucionTransferenciaInventarioV2 = (actual, candidata) => {
    const resultado = (0, exports.validarEvolucionTransferenciaInventarioV2)(actual, candidata);
    if (!resultado.valido)
        throw new Error(resultado.errores.join("; "));
};
exports.assertEvolucionTransferenciaInventarioV2 = assertEvolucionTransferenciaInventarioV2;
const construirLineaSalida = (linea, almacenId) => ({
    id: `${linea.id}:salida`,
    productoBaseId: linea.productoBaseId,
    almacenId,
    cantidadOperacion: linea.cantidadOperacion,
    conversionSnapshot: linea.conversionSnapshot,
    cantidadBaseDelta: -linea.cantidadBase,
    unidadBase: linea.unidadBase,
    costoUnitarioBase: linea.costoUnitarioBaseSnapshot,
    monedaCosto: linea.monedaCosto,
    lote: linea.lote,
    fechaVencimiento: linea.fechaVencimiento,
});
const construirConversionBaseRecepcion = (linea, recepcion) => ({
    productoBaseId: linea.productoBaseId,
    unidadOperacion: linea.unidadBase,
    unidadBase: linea.unidadBase,
    factorUnidadBase: 1,
    precisionCantidadBase: linea.conversionSnapshot.precisionCantidadBase,
    capturadaAt: recepcion.registradaAt,
});
const construirEntradaRecepcion = (transferencia, recepcion) => {
    const lineasPorId = new Map(transferencia.items.map((linea) => [linea.id, linea]));
    const items = recepcion.items
        .filter((linea) => linea.cantidadBaseAceptada > 0)
        .map((recibida) => {
        const linea = lineasPorId.get(recibida.lineaTransferenciaId);
        return {
            id: `${linea.id}:entrada:${encodeURIComponent(recepcion.id)}`,
            productoBaseId: linea.productoBaseId,
            almacenId: transferencia.almacenDestinoId,
            cantidadOperacion: recibida.cantidadBaseAceptada,
            conversionSnapshot: construirConversionBaseRecepcion(linea, recepcion),
            cantidadBaseDelta: recibida.cantidadBaseAceptada,
            unidadBase: linea.unidadBase,
            costoUnitarioBase: linea.costoUnitarioBaseSnapshot,
            monedaCosto: linea.monedaCosto,
            lote: linea.lote,
            fechaVencimiento: linea.fechaVencimiento,
        };
    });
    return {
        id: recepcion.movimientoEntradaId,
        type: movimiento_inventario_v2_contract_1.MOVIMIENTO_INVENTARIO_V2_TYPE,
        schemaVersion: inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION,
        estado: "APLICADO",
        tipo: movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.TRANSFERENCIA_ENTRADA,
        almacenId: transferencia.almacenDestinoId,
        origen: {
            tipo: movimiento_inventario_v2_contract_1.OrigenMovimientoInventarioV2.TRANSFERENCIA,
            documentoId: transferencia.id,
        },
        items,
        operationId: recepcion.operationId,
        idempotencyKey: `${recepcion.idempotencyKey}:movimiento_entrada`,
        correlationId: transferencia.correlationId,
        causationId: transferencia.envio.operationId,
        actor: recepcion.actor,
        fechaEfectiva: recepcion.registradaAt,
        registradoAt: recepcion.registradaAt,
    };
};
/**
 * Materializa una salida total y una entrada por cada recibo. IDs y claves son
 * deterministas, por lo que reintentar la misma raiz no duplica stock.
 */
const construirMovimientosTransferenciaInventarioV2 = (transferencia) => {
    (0, exports.assertTransferenciaInventarioV2)(transferencia);
    if (transferencia.estado === transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.BORRADOR ||
        transferencia.estado === transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CANCELADA) {
        return [];
    }
    const envio = transferencia.envio;
    const salida = {
        id: transferencia.movimientoSalidaId,
        type: movimiento_inventario_v2_contract_1.MOVIMIENTO_INVENTARIO_V2_TYPE,
        schemaVersion: inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION,
        estado: "APLICADO",
        tipo: movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.TRANSFERENCIA_SALIDA,
        almacenId: transferencia.almacenOrigenId,
        origen: {
            tipo: movimiento_inventario_v2_contract_1.OrigenMovimientoInventarioV2.TRANSFERENCIA,
            documentoId: transferencia.id,
        },
        items: transferencia.items.map((linea) => construirLineaSalida(linea, transferencia.almacenOrigenId)),
        operationId: envio.operationId,
        idempotencyKey: `${envio.idempotencyKey}:movimiento_salida`,
        correlationId: transferencia.correlationId,
        causationId: transferencia.creacion.operationId,
        actor: envio.actor,
        fechaEfectiva: envio.registradaAt,
        registradoAt: envio.registradaAt,
    };
    return [
        salida,
        ...transferencia.recepciones.map((recepcion) => construirEntradaRecepcion(transferencia, recepcion)),
    ];
};
exports.construirMovimientosTransferenciaInventarioV2 = construirMovimientosTransferenciaInventarioV2;
