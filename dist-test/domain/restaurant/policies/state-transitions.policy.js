"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esTareaPreparacionTerminalRestaurante = exports.estadoInicialTareaPreparacionRestaurante = exports.puedeTransicionarCuentaRestaurante = exports.puedeTransicionarTareaPreparacionRestaurante = exports.puedeTransicionarPedidoRestaurante = exports.puedeTransicionarSesionRestaurante = void 0;
const configuration_contract_1 = require("../contracts/configuration.contract");
const SESSION_TRANSITIONS = {
    PLANIFICADA: ["ABIERTA", "CANCELADA"],
    ABIERTA: ["EN_ATENCION", "SOLICITA_CIERRE", "CANCELADA", "ABANDONADA"],
    EN_ATENCION: ["SOLICITA_CIERRE", "CANCELADA", "ABANDONADA"],
    SOLICITA_CIERRE: ["EN_ATENCION", "CERRADA"],
    CERRADA: [],
    CANCELADA: [],
    ABANDONADA: [],
};
const ORDER_TRANSITIONS = {
    BORRADOR: ["ABIERTO", "CANCELADO"],
    ABIERTO: ["PARCIALMENTE_ENVIADO", "ENVIADO", "CANCELADO"],
    PARCIALMENTE_ENVIADO: ["ENVIADO", "COMPLETADO", "CANCELADO"],
    ENVIADO: ["COMPLETADO", "CANCELADO"],
    COMPLETADO: [],
    CANCELADO: [],
};
const PREPARATION_TRANSITIONS = {
    PENDIENTE: ["EN_COLA", "LISTA", "RETENIDA", "CANCELADA"],
    EN_COLA: ["EN_PREPARACION", "RETENIDA", "CANCELADA"],
    EN_PREPARACION: ["LISTA", "RETENIDA", "CANCELADA", "DESCARTADA"],
    RETENIDA: ["EN_COLA", "EN_PREPARACION", "CANCELADA"],
    LISTA: ["ENTREGADA", "DESCARTADA"],
    ENTREGADA: [],
    GESTION_EXTERNA: ["ENTREGADA"],
    CANCELADA: [],
    DESCARTADA: [],
};
const ACCOUNT_TRANSITIONS = {
    ABIERTA: ["PARCIALMENTE_PAGADA", "SALDADA", "ANULADA", "EN_DISPUTA"],
    PARCIALMENTE_PAGADA: ["SALDADA", "EN_DISPUTA"],
    SALDADA: ["CERRADA", "EN_DISPUTA"],
    CERRADA: [],
    ANULADA: [],
    EN_DISPUTA: ["ABIERTA", "PARCIALMENTE_PAGADA", "SALDADA"],
};
const puedeTransicionarSesionRestaurante = (from, to) => SESSION_TRANSITIONS[from].includes(to);
exports.puedeTransicionarSesionRestaurante = puedeTransicionarSesionRestaurante;
const puedeTransicionarPedidoRestaurante = (from, to) => ORDER_TRANSITIONS[from].includes(to);
exports.puedeTransicionarPedidoRestaurante = puedeTransicionarPedidoRestaurante;
const puedeTransicionarTareaPreparacionRestaurante = (from, to) => PREPARATION_TRANSITIONS[from].includes(to);
exports.puedeTransicionarTareaPreparacionRestaurante = puedeTransicionarTareaPreparacionRestaurante;
const puedeTransicionarCuentaRestaurante = (from, to) => ACCOUNT_TRANSITIONS[from].includes(to);
exports.puedeTransicionarCuentaRestaurante = puedeTransicionarCuentaRestaurante;
const estadoInicialTareaPreparacionRestaurante = (mode, stationOperationMode = configuration_contract_1.MODO_OPERACION_ESTACION_RESTAURANTE.SEGUIMIENTO_DIGITAL) => stationOperationMode === configuration_contract_1.MODO_OPERACION_ESTACION_RESTAURANTE.COMANDA_FISICA
    ? "GESTION_EXTERNA"
    : mode === "DESPACHO_DIRECTO"
        ? "LISTA"
        : "EN_COLA";
exports.estadoInicialTareaPreparacionRestaurante = estadoInicialTareaPreparacionRestaurante;
const esTareaPreparacionTerminalRestaurante = (task) => task.estado === "ENTREGADA" ||
    task.estado === "CANCELADA" ||
    task.estado === "DESCARTADA";
exports.esTareaPreparacionTerminalRestaurante = esTareaPreparacionTerminalRestaurante;
