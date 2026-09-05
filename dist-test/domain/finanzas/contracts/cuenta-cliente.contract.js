"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIPO_DOCUMENTO_EJECUCION_COBRO_CLIENTE = exports.EJECUCION_COBRO_CLIENTE_PLAN_CANONICALIZATION_VERSION = exports.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION = void 0;
exports.esImputacionCuentaClienteManifestV1 = esImputacionCuentaClienteManifestV1;
exports.esCustodiaEsperadaCobroClienteCompleta = esCustodiaEsperadaCobroClienteCompleta;
exports.esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente = esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente;
exports.canonicalizarCreditosPlanEjecucionCobroCliente = canonicalizarCreditosPlanEjecucionCobroCliente;
exports.agruparEvidenciaCreditosEjecucionCobroCliente = agruparEvidenciaCreditosEjecucionCobroCliente;
exports.coincidenCreditosPlanConEvidenciaEjecucionCobroCliente = coincidenCreditosPlanConEvidenciaEjecucionCobroCliente;
exports.canonicalizarCustodiaEsperadaCobroCliente = canonicalizarCustodiaEsperadaCobroCliente;
exports.canonicalizarPlanEjecucionCobroCliente = canonicalizarPlanEjecucionCobroCliente;
exports.serializarPlanEjecucionCobroClienteCanonico = serializarPlanEjecucionCobroClienteCanonico;
exports.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION = 1;
/** Version del algoritmo canonico usado antes de calcular `planHash`. */
exports.EJECUCION_COBRO_CLIENTE_PLAN_CANONICALIZATION_VERSION = 1;
const esIdentificadorOpacoNoVacio = (value) => typeof value === "string" && value.length > 0;
/**
 * Verifica unicamente los discriminantes y relaciones adicionales del
 * manifest version 1 sobre una imputacion base ya parseada. No recorta ni
 * interpreta identificadores opacos.
 */
function esImputacionCuentaClienteManifestV1(imputacion) {
    if (imputacion.ejecucionCobroManifestVersion !== 1 ||
        !esIdentificadorOpacoNoVacio(imputacion.ejecucionCobroId)) {
        return false;
    }
    if (imputacion.tipoComponenteEjecucionCobro === "SALDO_FAVOR") {
        return true;
    }
    return (imputacion.tipoComponenteEjecucionCobro === "DINERO_NUEVO" &&
        esIdentificadorOpacoNoVacio(imputacion.cobroId));
}
exports.TIPO_DOCUMENTO_EJECUCION_COBRO_CLIENTE = "ejecucion_cobro_cliente";
/**
 * Comprueba que la ruta de custodia tenga todos sus identificadores
 * contractuales. No interpreta ni normaliza esos valores opacos.
 */
function esCustodiaEsperadaCobroClienteCompleta(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const custodia = value;
    return (esIdentificadorOpacoNoVacio(custodia.custodioOrigenId) &&
        esIdentificadorOpacoNoVacio(custodia.custodioDestinoId) &&
        esIdentificadorOpacoNoVacio(custodia.turnoCajaOrigenId) &&
        esIdentificadorOpacoNoVacio(custodia.turnoCajaDestinoId) &&
        (custodia.cajaOrigenId === undefined ||
            esIdentificadorOpacoNoVacio(custodia.cajaOrigenId)) &&
        (custodia.cajaDestinoId === undefined ||
            esIdentificadorOpacoNoVacio(custodia.cajaDestinoId)));
}
/**
 * Regla fail-closed de custodia por rol de recepcion. Un CAJERO ya recibe en
 * la custodia operativa de caja y no debe inventar una transferencia; todo
 * rol no-CAJERO necesita una ruta completa y explicita.
 */
function esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente(componente, rolRecepcion) {
    return rolRecepcion === "CAJERO"
        ? componente.custodiaEsperada === undefined
        : esCustodiaEsperadaCobroClienteCompleta(componente.custodiaEsperada);
}
const compararTextoOrdinal = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const normalizarMontoACentimos = (value) => {
    if (!Number.isFinite(value)) {
        throw new TypeError("plan_ejecucion_cobro_monto_no_finito");
    }
    const centimos = Math.round(value * 100);
    if (!Number.isSafeInteger(centimos)) {
        throw new RangeError("plan_ejecucion_cobro_monto_fuera_de_rango");
    }
    const monto = centimos / 100;
    return Object.is(monto, -0) ? 0 : monto;
};
/** Ordena creditos por identidad opaca y normaliza sus montos a centimos. */
function canonicalizarCreditosPlanEjecucionCobroCliente(creditos) {
    return creditos
        .map((credito) => ({
        movimientoDestinoId: credito.movimientoDestinoId,
        montoAplicadoEsperado: normalizarMontoACentimos(credito.montoAplicadoEsperado),
    }))
        .sort((left, right) => {
        const porId = compararTextoOrdinal(left.movimientoDestinoId, right.movimientoDestinoId);
        return porId !== 0
            ? porId
            : left.montoAplicadoEsperado - right.montoAplicadoEsperado;
    });
}
/**
 * Agrupa evidencia de imputaciones por el credito destino contractual.
 *
 * Un credito del plan puede consumir varias fuentes de saldo a favor y, por
 * tanto, materializar varias imputaciones para el mismo movimiento destino.
 * Esta funcion suma esas filas en centimos sin interpretar el identificador.
 */
function agruparEvidenciaCreditosEjecucionCobroCliente(creditos) {
    var _a;
    const centimosPorDestino = new Map();
    for (const credito of creditos) {
        if (typeof credito.movimientoDestinoId !== "string" ||
            credito.movimientoDestinoId.length === 0) {
            throw new TypeError("evidencia_ejecucion_cobro_destino_invalido");
        }
        const monto = normalizarMontoACentimos(credito.montoAplicadoEsperado);
        const centimos = Math.round(monto * 100);
        if (centimos <= 0) {
            throw new RangeError("evidencia_ejecucion_cobro_monto_invalido");
        }
        const acumulado = ((_a = centimosPorDestino.get(credito.movimientoDestinoId)) !== null && _a !== void 0 ? _a : 0) + centimos;
        if (!Number.isSafeInteger(acumulado)) {
            throw new RangeError("evidencia_ejecucion_cobro_monto_fuera_de_rango");
        }
        centimosPorDestino.set(credito.movimientoDestinoId, acumulado);
    }
    return [...centimosPorDestino.entries()]
        .map(([movimientoDestinoId, centimos]) => ({
        movimientoDestinoId,
        montoAplicadoEsperado: centimos / 100,
    }))
        .sort((left, right) => compararTextoOrdinal(left.movimientoDestinoId, right.movimientoDestinoId));
}
/**
 * Compara el plan (un destino por credito) con evidencia que puede contener
 * varias imputaciones por destino. Los IDs se comparan literalmente.
 */
function coincidenCreditosPlanConEvidenciaEjecucionCobroCliente(creditosPlan, evidencia) {
    try {
        const plan = canonicalizarCreditosPlanEjecucionCobroCliente([
            ...creditosPlan,
        ]);
        if (plan.length === 0 ||
            new Set(plan.map((credito) => credito.movimientoDestinoId)).size !==
                plan.length ||
            plan.some((credito) => credito.movimientoDestinoId.length === 0 ||
                credito.montoAplicadoEsperado <= 0)) {
            return false;
        }
        const evidenciaAgrupada = agruparEvidenciaCreditosEjecucionCobroCliente(evidencia);
        return JSON.stringify(plan) === JSON.stringify(evidenciaAgrupada);
    }
    catch (_a) {
        return false;
    }
}
/** Copia la ruta de custodia sin alterar ninguno de sus identificadores. */
function canonicalizarCustodiaEsperadaCobroCliente(custodia) {
    return {
        custodioOrigenId: custodia.custodioOrigenId,
        custodioDestinoId: custodia.custodioDestinoId,
        turnoCajaOrigenId: custodia.turnoCajaOrigenId,
        turnoCajaDestinoId: custodia.turnoCajaDestinoId,
        ...(custodia.cajaOrigenId === undefined
            ? {}
            : { cajaOrigenId: custodia.cajaOrigenId }),
        ...(custodia.cajaDestinoId === undefined
            ? {}
            : { cajaDestinoId: custodia.cajaDestinoId }),
    };
}
/**
 * Devuelve una copia canonica del plan para hashing e igualdad tecnica.
 *
 * Los arreglos se ordenan solo para serializacion: el comparador ordinal de
 * ECMAScript no interpreta IDs ni claves. Los montos se expresan en centimos
 * para evitar diferencias accidentales de representacion entre runtimes.
 */
function canonicalizarPlanEjecucionCobroCliente(plan) {
    const componentes = plan.componentes
        .map((componente) => {
        const creditos = canonicalizarCreditosPlanEjecucionCobroCliente(componente.creditos);
        const base = {
            claveIdempotencia: componente.claveIdempotencia,
            montoAplicadoEsperado: normalizarMontoACentimos(componente.montoAplicadoEsperado),
            creditos,
        };
        return componente.tipo === "SALDO_FAVOR"
            ? { tipo: "SALDO_FAVOR", ...base }
            : {
                tipo: "DINERO_NUEVO",
                ...base,
                metodoPago: componente.metodoPago,
                montoRecibidoEsperado: normalizarMontoACentimos(componente.montoRecibidoEsperado),
                ...(componente.custodiaEsperada === undefined
                    ? {}
                    : {
                        custodiaEsperada: canonicalizarCustodiaEsperadaCobroCliente(componente.custodiaEsperada),
                    }),
            };
    })
        .sort((left, right) => {
        const porClave = compararTextoOrdinal(left.claveIdempotencia, right.claveIdempotencia);
        if (porClave !== 0)
            return porClave;
        return compararTextoOrdinal(left.tipo, right.tipo);
    });
    return {
        montoAplicadoEsperado: normalizarMontoACentimos(plan.montoAplicadoEsperado),
        componentes,
    };
}
const canonicalizarValorJson = (value) => {
    if (Array.isArray(value))
        return value.map(canonicalizarValorJson);
    if (value && typeof value === "object") {
        const result = {};
        for (const [key, item] of Object.entries(value)
            .filter(([, item]) => item !== undefined)
            .sort(([left], [right]) => compararTextoOrdinal(left, right))) {
            result[key] = canonicalizarValorJson(item);
        }
        return result;
    }
    return value;
};
/**
 * Serializacion JSON determinista que debe ser la entrada exacta de SHA-256.
 */
function serializarPlanEjecucionCobroClienteCanonico(plan) {
    return JSON.stringify(canonicalizarValorJson(canonicalizarPlanEjecucionCobroCliente(plan)));
}
