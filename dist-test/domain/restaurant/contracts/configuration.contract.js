"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esModoOperacionEstacionRestaurante = exports.MODO_OPERACION_ESTACION_RESTAURANTE_PREDETERMINADO = exports.MODO_OPERACION_ESTACION_RESTAURANTE = void 0;
/**
 * Define como controla la aplicacion el trabajo de una estacion.
 *
 * - SEGUIMIENTO_DIGITAL: estados e interaccion por plato o comanda.
 * - COMANDA_FISICA_ASISTIDA: estados digitales solo por comanda completa.
 * - COMANDA_FISICA: la operacion ocurre fuera del KDS; la app es un visor.
 */
exports.MODO_OPERACION_ESTACION_RESTAURANTE = {
    SEGUIMIENTO_DIGITAL: "SEGUIMIENTO_DIGITAL",
    COMANDA_FISICA_ASISTIDA: "COMANDA_FISICA_ASISTIDA",
    COMANDA_FISICA: "COMANDA_FISICA",
};
exports.MODO_OPERACION_ESTACION_RESTAURANTE_PREDETERMINADO = exports.MODO_OPERACION_ESTACION_RESTAURANTE.SEGUIMIENTO_DIGITAL;
const esModoOperacionEstacionRestaurante = (value) => Object.values(exports.MODO_OPERACION_ESTACION_RESTAURANTE).includes(value);
exports.esModoOperacionEstacionRestaurante = esModoOperacionEstacionRestaurante;
