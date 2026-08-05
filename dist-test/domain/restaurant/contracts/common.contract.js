"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esTipoDocumentoRestaurante = exports.normalizarTipoDocumentoRestaurante = exports.TIPO_COMANDO_RESTAURANTE = exports.VERSION_ESQUEMA_RESTAURANTE = exports.TIPOS_DOCUMENTO_RESTAURANTE = exports.TIPO_DOCUMENTO_RESTAURANTE = void 0;
/**
 * Lenguaje persistente canonico del bounded context Restaurante.
 * Cada valor coincide exactamente con su tabla SQLite y con `type` en CouchDB.
 */
exports.TIPO_DOCUMENTO_RESTAURANTE = {
    LOCALES: "restaurant_locales",
    SALONES: "restaurant_salones",
    ZONAS_SERVICIO: "restaurant_zonas_servicio",
    MESAS: "restaurant_mesas",
    ESTACIONES_PREPARACION: "restaurant_estaciones_preparacion",
    PRODUCTOS: "restaurant_productos",
    SESIONES_SERVICIO: "restaurant_sesiones_servicio",
    PEDIDOS: "restaurant_pedidos",
    COMANDAS: "restaurant_comandas",
    TAREAS_PREPARACION: "restaurant_tareas_preparacion",
    CUENTAS_CONSUMO: "restaurant_cuentas_consumo",
    ASIGNACIONES_PAGO: "restaurant_asignaciones_pago",
};
exports.TIPOS_DOCUMENTO_RESTAURANTE = Object.freeze(Object.values(exports.TIPO_DOCUMENTO_RESTAURANTE));
exports.VERSION_ESQUEMA_RESTAURANTE = 2;
exports.TIPO_COMANDO_RESTAURANTE = "restaurant_comandos";
const TIPOS_DOCUMENTO_RESTAURANTE_SET = new Set(exports.TIPOS_DOCUMENTO_RESTAURANTE);
const normalizarTipoDocumentoRestaurante = (value) => typeof value === "string" && TIPOS_DOCUMENTO_RESTAURANTE_SET.has(value)
    ? value
    : null;
exports.normalizarTipoDocumentoRestaurante = normalizarTipoDocumentoRestaurante;
const esTipoDocumentoRestaurante = (value) => (0, exports.normalizarTipoDocumentoRestaurante)(value) !== null;
exports.esTipoDocumentoRestaurante = esTipoDocumentoRestaurante;
