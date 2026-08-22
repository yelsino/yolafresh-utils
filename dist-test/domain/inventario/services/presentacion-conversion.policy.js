"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarTransicionVersionConversionPresentacion = exports.aplicarVersionConversionPresentacion = exports.calcularVersionConversionPresentacion = exports.esMismaConversionSemanticaPresentacion = exports.incrementarVersionConversionPresentacion = exports.crearVersionConversionPresentacion = exports.normalizarPresentacionLegacy = exports.esVersionConversionPresentacionValida = exports.VERSION_CONVERSION_PRESENTACION_INICIAL = void 0;
/** Primera versión de cualquier conversión comercial persistida. */
exports.VERSION_CONVERSION_PRESENTACION_INICIAL = 1;
/**
 * La versión se conserva como entero seguro para que `+ 1` sea determinista en
 * todos los consumidores JavaScript.
 */
const esVersionConversionPresentacionValida = (value) => Number.isSafeInteger(value) && Number(value) >= 1;
exports.esVersionConversionPresentacionValida = esVersionConversionPresentacionValida;
const assertVersionConversionPresentacionValida = (value, campo) => {
    if (!(0, exports.esVersionConversionPresentacionValida)(value)) {
        throw new Error(`${campo} debe ser un entero positivo seguro`);
    }
};
/**
 * Normaliza exclusivamente documentos legacy que todavía no tienen la versión.
 * Una ausencia real (`undefined`) inicia en 1; un valor presente pero inválido se
 * rechaza para no ocultar corrupción de datos.
 */
const normalizarPresentacionLegacy = (entrada) => {
    const versionConversion = entrada.versionConversion === undefined
        ? exports.VERSION_CONVERSION_PRESENTACION_INICIAL
        : entrada.versionConversion;
    assertVersionConversionPresentacionValida(versionConversion, "presentacion.versionConversion");
    return {
        ...entrada,
        versionConversion,
    };
};
exports.normalizarPresentacionLegacy = normalizarPresentacionLegacy;
/** Devuelve 1 para una presentación que todavía no existe. */
const crearVersionConversionPresentacion = () => exports.VERSION_CONVERSION_PRESENTACION_INICIAL;
exports.crearVersionConversionPresentacion = crearVersionConversionPresentacion;
/**
 * Incrementa explícitamente una conversión cuando la unidad base cambia en el
 * `ProductoBase` padre. Ese cambio ocurre entre documentos y no siempre puede
 * inferirse comparando dos presentaciones.
 */
const incrementarVersionConversionPresentacion = (actual) => {
    const versionActual = typeof actual === "number" ? actual : actual.versionConversion;
    assertVersionConversionPresentacionValida(versionActual, "presentacionActual.versionConversion");
    const siguiente = versionActual + 1;
    assertVersionConversionPresentacionValida(siguiente, "presentacionSiguiente.versionConversion");
    return siguiente;
};
exports.incrementarVersionConversionPresentacion = incrementarVersionConversionPresentacion;
/**
 * Compara únicamente los datos que cambian la conversión física a inventario.
 * Precio, nombre, imagen, códigos, visibilidad y demás campos son cosméticos para
 * esta política.
 */
const esMismaConversionSemanticaPresentacion = (actual, candidata) => actual.productoBaseId === candidata.productoBaseId &&
    actual.equivalenciaUnidadBase === candidata.equivalenciaUnidadBase &&
    actual.unidadBaseInventario === candidata.unidadBaseInventario;
exports.esMismaConversionSemanticaPresentacion = esMismaConversionSemanticaPresentacion;
/**
 * Calcula la única versión válida para una creación o actualización interna.
 * La versión propuesta por un cliente no participa en el cálculo.
 */
const calcularVersionConversionPresentacion = (actual, candidata) => {
    if (!actual)
        return (0, exports.crearVersionConversionPresentacion)();
    assertVersionConversionPresentacionValida(actual.versionConversion, "presentacionActual.versionConversion");
    if ((0, exports.esMismaConversionSemanticaPresentacion)(actual, candidata)) {
        return actual.versionConversion;
    }
    return (0, exports.incrementarVersionConversionPresentacion)(actual.versionConversion);
};
exports.calcularVersionConversionPresentacion = calcularVersionConversionPresentacion;
/**
 * Materializa una presentación canónica ignorando cualquier versión enviada en
 * la candidata y aplicando la versión calculada por el dominio.
 */
const aplicarVersionConversionPresentacion = (actual, candidata) => {
    const { versionConversion: _versionPropuesta, ...datosCandidatos } = candidata;
    return {
        ...datosCandidatos,
        versionConversion: (0, exports.calcularVersionConversionPresentacion)(actual, datosCandidatos),
    };
};
exports.aplicarVersionConversionPresentacion = aplicarVersionConversionPresentacion;
/**
 * Valida una transición recibida desde fuera del dominio. A diferencia del
 * calculador, esta función no corrige la candidata: rechaza valores inválidos,
 * regresiones, saltos y cambios de versión sin cambio semántico.
 */
const validarTransicionVersionConversionPresentacion = (actual, candidata) => {
    const errores = [];
    const cambioSemantico = !(0, exports.esMismaConversionSemanticaPresentacion)(actual, candidata);
    const versionActualValida = (0, exports.esVersionConversionPresentacionValida)(actual.versionConversion);
    const versionCandidataValida = (0, exports.esVersionConversionPresentacionValida)(candidata.versionConversion);
    if (!versionActualValida) {
        errores.push("presentacionActual.versionConversion debe ser un entero positivo seguro");
    }
    if (!versionCandidataValida) {
        errores.push("presentacionCandidata.versionConversion debe ser un entero positivo seguro");
    }
    if (!versionActualValida) {
        return { valido: false, errores, cambioSemantico };
    }
    const versionEsperada = cambioSemantico
        ? actual.versionConversion + 1
        : actual.versionConversion;
    if (!(0, exports.esVersionConversionPresentacionValida)(versionEsperada)) {
        errores.push("presentacion.versionConversion excede el entero seguro");
        return { valido: false, errores, cambioSemantico };
    }
    if (versionCandidataValida && candidata.versionConversion !== versionEsperada) {
        if (candidata.versionConversion < actual.versionConversion) {
            errores.push("presentacion.versionConversion no puede retroceder");
        }
        else if (cambioSemantico) {
            errores.push("presentacion.versionConversion debe incrementar exactamente en uno");
        }
        else {
            errores.push("presentacion.versionConversion debe conservarse sin cambio semántico");
        }
    }
    return {
        valido: errores.length === 0,
        errores,
        cambioSemantico,
        versionEsperada,
    };
};
exports.validarTransicionVersionConversionPresentacion = validarTransicionVersionConversionPresentacion;
