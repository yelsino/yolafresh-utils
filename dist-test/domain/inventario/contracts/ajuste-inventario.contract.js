"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotivoMermaInventario = exports.OrigenAjusteInventario = exports.EstadoAprobacionInventario = exports.MERMA_INVENTARIO_TYPE = exports.AJUSTE_INVENTARIO_TYPE = void 0;
exports.AJUSTE_INVENTARIO_TYPE = "ajuste_inventario";
exports.MERMA_INVENTARIO_TYPE = "merma_inventario";
var EstadoAprobacionInventario;
(function (EstadoAprobacionInventario) {
    EstadoAprobacionInventario["BORRADOR"] = "BORRADOR";
    EstadoAprobacionInventario["PENDIENTE_APROBACION"] = "PENDIENTE_APROBACION";
    EstadoAprobacionInventario["APROBADO"] = "APROBADO";
    EstadoAprobacionInventario["RECHAZADO"] = "RECHAZADO";
    EstadoAprobacionInventario["APLICADO"] = "APLICADO";
    EstadoAprobacionInventario["CANCELADO"] = "CANCELADO";
})(EstadoAprobacionInventario || (exports.EstadoAprobacionInventario = EstadoAprobacionInventario = {}));
var OrigenAjusteInventario;
(function (OrigenAjusteInventario) {
    OrigenAjusteInventario["APERTURA"] = "APERTURA";
    OrigenAjusteInventario["CONTEO"] = "CONTEO";
    OrigenAjusteInventario["MANUAL"] = "MANUAL";
    OrigenAjusteInventario["MIGRACION"] = "MIGRACION";
    OrigenAjusteInventario["CORRECCION_RECEPCION"] = "CORRECCION_RECEPCION";
    OrigenAjusteInventario["CORRECCION_VENTA"] = "CORRECCION_VENTA";
})(OrigenAjusteInventario || (exports.OrigenAjusteInventario = OrigenAjusteInventario = {}));
var MotivoMermaInventario;
(function (MotivoMermaInventario) {
    MotivoMermaInventario["VENCIMIENTO"] = "VENCIMIENTO";
    MotivoMermaInventario["DETERIORO"] = "DETERIORO";
    MotivoMermaInventario["ROTURA"] = "ROTURA";
    MotivoMermaInventario["ROBO"] = "ROBO";
    MotivoMermaInventario["DESHIDRATACION"] = "DESHIDRATACION";
    MotivoMermaInventario["EVAPORACION"] = "EVAPORACION";
    MotivoMermaInventario["RECORTE_PRODUCCION"] = "RECORTE_PRODUCCION";
    MotivoMermaInventario["PERDIDA_DESCONOCIDA"] = "PERDIDA_DESCONOCIDA";
    MotivoMermaInventario["OTRO"] = "OTRO";
})(MotivoMermaInventario || (exports.MotivoMermaInventario = MotivoMermaInventario = {}));
