"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluarCobroRestaurante = evaluarCobroRestaurante;
exports.evaluarAbandonoSesionRestaurante = evaluarAbandonoSesionRestaurante;
exports.evaluarLiberacionMesaCompletadaRestaurante = evaluarLiberacionMesaCompletadaRestaurante;
exports.evaluarCierreRestaurante = evaluarCierreRestaurante;
const state_transitions_policy_1 = require("./state-transitions.policy");
function evaluarCobroRestaurante(pedido, cuenta) {
    var _a;
    const active = pedido.lineas.filter((line) => !line.anuladaAt);
    const sent = active.reduce((total, line) => total + line.cantidadEnviada, 0);
    if (sent <= 0) {
        return { permitido: false, motivo: "PEDIDO_SIN_PRODUCTOS_ENVIADOS", message: "Envia al menos una ronda antes de cobrar." };
    }
    if (active.some((line) => line.cantidadEnviada < line.cantidad)) {
        return { permitido: false, motivo: "LINEAS_PENDIENTES_DE_ENVIO", message: "Hay productos sin enviar. Envialos o retiralos del pedido." };
    }
    const sentByLine = new Map(active.map((line) => [line.id, line.cantidadEnviada]));
    const chargedByLine = new Map();
    for (const charge of cuenta.cargos) {
        chargedByLine.set(charge.pedidoLineaId, ((_a = chargedByLine.get(charge.pedidoLineaId)) !== null && _a !== void 0 ? _a : 0) + charge.cantidad);
    }
    if ([...sentByLine].some(([lineId, quantity]) => chargedByLine.get(lineId) !== quantity)) {
        return { permitido: false, motivo: "CARGOS_INCONSISTENTES", message: "La cuenta no coincide con las rondas enviadas." };
    }
    if (cuenta.estado !== "ABIERTA" && cuenta.estado !== "PARCIALMENTE_PAGADA") {
        return { permitido: false, motivo: "CUENTA_NO_COBRABLE", message: "La cuenta ya no admite pagos." };
    }
    return { permitido: true };
}
/**
 * Abandonar libera una mesa sin venta únicamente cuando todavía no existe
 * consumo enviado ni efecto económico. El borrador pendiente sí puede
 * cancelarse como parte de la misma operación auditable.
 */
function evaluarAbandonoSesionRestaurante(input) {
    const { sesion, pedido, cuenta, comandas, tareas } = input;
    if (!sesion.mesaId || !["ABIERTA", "EN_ATENCION"].includes(sesion.estado)) {
        return {
            permitido: false,
            motivo: "SESION_NO_ABANDONABLE",
            message: "La atención ya no puede abandonarse desde esta mesa.",
        };
    }
    if (cuenta.estado !== "ABIERTA") {
        return {
            permitido: false,
            motivo: "CUENTA_NO_ANULABLE",
            message: "La cuenta ya cambió de estado y debe resolverse desde Caja.",
        };
    }
    if (cuenta.asignacionesPagoIds.length > 0 ||
        cuenta.ventaIds.length > 0 ||
        cuenta.totales.pagado.minorUnits !== 0) {
        return {
            permitido: false,
            motivo: "CUENTA_CON_PAGOS_O_VENTA",
            message: "La atención tiene pagos o una venta y no puede liberarse como abandono.",
        };
    }
    if (cuenta.cargos.length > 0 ||
        cuenta.totales.total.minorUnits !== 0 ||
        cuenta.totales.saldo.minorUnits !== 0) {
        return {
            permitido: false,
            motivo: "CUENTA_CON_CARGOS",
            message: "La cuenta tiene consumos cargados; primero deben anularse con trazabilidad.",
        };
    }
    if (pedido.lineas.some((line) => line.cantidadEnviada > 0)) {
        return {
            permitido: false,
            motivo: "LINEAS_ENVIADAS",
            message: "Ya existen productos enviados. Resuelve sus comandas antes de liberar la mesa.",
        };
    }
    if (comandas.length > 0) {
        return {
            permitido: false,
            motivo: "COMANDAS_EXISTENTES",
            message: "La atención ya generó comandas y no puede descartarse como una mesa vacía.",
        };
    }
    if (tareas.length > 0) {
        return {
            permitido: false,
            motivo: "PREPARACION_EXISTENTE",
            message: "La atención tiene tareas de preparación que deben resolverse primero.",
        };
    }
    return {
        permitido: true,
        lineasPendientes: pedido.lineas.filter((line) => !line.anuladaAt && line.cantidad > line.cantidadEnviada).length,
    };
}
/**
 * Repara exclusivamente el vinculo de ocupacion de una mesa cuyo servicio ya
 * termino comercial y operacionalmente. No completa pagos ni entregas, y no
 * permite usar la reparacion para saltar una transicion pendiente.
 */
function evaluarLiberacionMesaCompletadaRestaurante(input) {
    const { mesa, sesion, pedido, cuenta, comandas, tareas } = input;
    if (mesa.sesionActivaId !== sesion.id || sesion.mesaId !== mesa.id) {
        return {
            permitido: false,
            motivo: "MESA_NO_VINCULADA",
            message: "La mesa ya no pertenece a esta atencion.",
        };
    }
    if (sesion.estado !== "CERRADA") {
        return {
            permitido: false,
            motivo: "SESION_NO_CERRADA",
            message: "La atencion aun no esta cerrada.",
        };
    }
    if (pedido.estado !== "COMPLETADO") {
        return {
            permitido: false,
            motivo: "PEDIDO_NO_COMPLETADO",
            message: "El pedido aun no esta completado.",
        };
    }
    if (cuenta.estado !== "CERRADA") {
        return {
            permitido: false,
            motivo: "CUENTA_NO_CERRADA",
            message: "La cuenta aun no esta cerrada.",
        };
    }
    return evaluarCierreRestaurante({
        pedido,
        cuenta: { ...cuenta, estado: "SALDADA" },
        comandas,
        tareas,
    });
}
/**
 * Cerrar libera la mesa. Exige cuenta saldada y todas las tareas entregadas,
 * canceladas o descartadas. Registrar el pago no implica cerrar el servicio.
 */
function evaluarCierreRestaurante(input) {
    var _a, _b;
    const { pedido, cuenta, comandas, tareas } = input;
    const base = evaluarCobroRestaurante(pedido, {
        ...cuenta,
        estado: cuenta.estado === "SALDADA" ? "ABIERTA" : cuenta.estado,
    });
    if (!base.permitido && base.motivo !== "CUENTA_NO_COBRABLE")
        return base;
    if (cuenta.totales.saldo.minorUnits !== 0) {
        return { permitido: false, motivo: "CUENTA_CON_SALDO", message: "La cuenta aun tiene saldo pendiente." };
    }
    if (cuenta.estado !== "SALDADA") {
        return { permitido: false, motivo: "CUENTA_NO_SALDADA", message: "La cuenta debe estar saldada antes de cerrar." };
    }
    const tasksByDispatchLine = new Map(tareas.map((task) => [`${task.comandaId}:${task.comandaItemId}`, task]));
    const sentByOrderLine = new Map(pedido.lineas
        .filter((line) => !line.anuladaAt)
        .map((line) => [line.id, line.cantidadEnviada]));
    const dispatchedByOrderLine = new Map();
    for (const dispatch of comandas) {
        const dispatchQuantityByOrderLine = new Map();
        for (const line of dispatch.lineas) {
            dispatchQuantityByOrderLine.set(line.pedidoLineaId, Math.max((_a = dispatchQuantityByOrderLine.get(line.pedidoLineaId)) !== null && _a !== void 0 ? _a : 0, line.cantidad));
            if (!tasksByDispatchLine.has(`${dispatch.id}:${line.id}`)) {
                return { permitido: false, motivo: "TAREA_DE_COMANDA_FALTANTE", message: "Existe una comanda sin tarea operativa." };
            }
        }
        for (const [lineId, quantity] of dispatchQuantityByOrderLine) {
            dispatchedByOrderLine.set(lineId, ((_b = dispatchedByOrderLine.get(lineId)) !== null && _b !== void 0 ? _b : 0) + quantity);
        }
    }
    if ([...sentByOrderLine].some(([lineId, sentQuantity]) => { var _a; return ((_a = dispatchedByOrderLine.get(lineId)) !== null && _a !== void 0 ? _a : 0) < sentQuantity; })) {
        return { permitido: false, motivo: "TAREA_DE_COMANDA_FALTANTE", message: "Existe una ronda enviada sin comanda operativa." };
    }
    if (tareas.some((task) => !(0, state_transitions_policy_1.esTareaPreparacionTerminalRestaurante)(task))) {
        return { permitido: false, motivo: "PREPARACION_O_ENTREGA_PENDIENTE", message: "Aun hay productos en preparacion o pendientes de entrega." };
    }
    return { permitido: true };
}
