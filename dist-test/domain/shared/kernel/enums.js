"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoPagoEnum = exports.MonedaEnum = exports.MedioPagoEfectivoEnum = exports.MedioPagoDigitalEnum = exports.MetodoPagoEnum = exports.TipoActualizacionEnum = exports.EstadoStockEnum = exports.CondicionPagoVenta = exports.VentaState = exports.PedidoEntregaModalidadEnum = exports.ProcedenciaVenta = exports.PedidoProcedenciaEnum = exports.ProcedenciaComercialEnum = exports.PedidoPrioridadEnum = exports.PedidoEntregaState = exports.PedidoState = void 0;
exports.normalizarProcedenciaComercial = normalizarProcedenciaComercial;
exports.esProcedenciaComercial = esProcedenciaComercial;
var PedidoState;
(function (PedidoState) {
    PedidoState["ABIERTO"] = "ABIERTO";
    PedidoState["PARCIALMENTE_ATENDIDO"] = "PARCIALMENTE_ATENDIDO";
    PedidoState["ATENDIDO"] = "ATENDIDO";
    PedidoState["CONVERTIDO"] = "CONVERTIDO";
    PedidoState["CANCELADO"] = "CANCELADO";
    PedidoState["VENCIDO"] = "VENCIDO";
})(PedidoState || (exports.PedidoState = PedidoState = {}));
var PedidoEntregaState;
(function (PedidoEntregaState) {
    PedidoEntregaState["PENDIENTE"] = "PENDIENTE";
    PedidoEntregaState["EN_PREPARACION"] = "EN_PREPARACION";
    PedidoEntregaState["LISTO_PARA_RECOJO"] = "LISTO_PARA_RECOJO";
    PedidoEntregaState["DESPACHADO"] = "DESPACHADO";
    PedidoEntregaState["EN_RUTA"] = "EN_RUTA";
    PedidoEntregaState["ENTREGADO"] = "ENTREGADO";
    PedidoEntregaState["NO_ENTREGADO"] = "NO_ENTREGADO";
    PedidoEntregaState["CANCELADO"] = "CANCELADO";
})(PedidoEntregaState || (exports.PedidoEntregaState = PedidoEntregaState = {}));
var PedidoPrioridadEnum;
(function (PedidoPrioridadEnum) {
    PedidoPrioridadEnum["NORMAL"] = "NORMAL";
    PedidoPrioridadEnum["ALTA"] = "ALTA";
    PedidoPrioridadEnum["URGENTE"] = "URGENTE";
})(PedidoPrioridadEnum || (exports.PedidoPrioridadEnum = PedidoPrioridadEnum = {}));
/**
 * Canal comercial compartido por Pedido y Venta.
 *
 * Los valores persistibles canónicos son uppercase. Los miembros titlecase se
 * conservan solo para compatibilidad de código con versiones anteriores y
 * apuntan a esos mismos valores; no constituyen otro catálogo.
 */
var ProcedenciaComercialEnum;
(function (ProcedenciaComercialEnum) {
    ProcedenciaComercialEnum["TIENDA"] = "TIENDA";
    ProcedenciaComercialEnum["WEB"] = "WEB";
    ProcedenciaComercialEnum["WHATSAPP"] = "WHATSAPP";
    ProcedenciaComercialEnum["INSTAGRAM"] = "INSTAGRAM";
    ProcedenciaComercialEnum["FACEBOOK"] = "FACEBOOK";
    ProcedenciaComercialEnum["OTRO"] = "OTRO";
    /** @deprecated Usar `TIENDA`. */
    ProcedenciaComercialEnum["Tienda"] = "TIENDA";
    /** @deprecated Usar `WEB`. */
    ProcedenciaComercialEnum["Web"] = "WEB";
    /** @deprecated Usar `WHATSAPP`. */
    ProcedenciaComercialEnum["WhatsApp"] = "WHATSAPP";
    /** @deprecated Usar `INSTAGRAM`. */
    ProcedenciaComercialEnum["Instagram"] = "INSTAGRAM";
    /** @deprecated Usar `FACEBOOK`. */
    ProcedenciaComercialEnum["Facebook"] = "FACEBOOK";
})(ProcedenciaComercialEnum || (exports.ProcedenciaVenta = exports.PedidoProcedenciaEnum = exports.ProcedenciaComercialEnum = ProcedenciaComercialEnum = {}));
/**
 * Normaliza valores canónicos y serializaciones históricas sin inventar una
 * procedencia para valores desconocidos.
 */
function normalizarProcedenciaComercial(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const canonicalKey = value.trim().toUpperCase();
    if (!canonicalKey) {
        return undefined;
    }
    const candidate = ProcedenciaComercialEnum[canonicalKey];
    return candidate === canonicalKey
        ? candidate
        : undefined;
}
/** Retorna true únicamente para valores ya serializados en forma canónica. */
function esProcedenciaComercial(value) {
    return normalizarProcedenciaComercial(value) === value;
}
var PedidoEntregaModalidadEnum;
(function (PedidoEntregaModalidadEnum) {
    PedidoEntregaModalidadEnum["RECOJO"] = "RECOJO";
    PedidoEntregaModalidadEnum["DESPACHO"] = "DESPACHO";
})(PedidoEntregaModalidadEnum || (exports.PedidoEntregaModalidadEnum = PedidoEntregaModalidadEnum = {}));
var VentaState;
(function (VentaState) {
    VentaState["CONFIRMADA"] = "CONFIRMADA";
    VentaState["ANULADA"] = "ANULADA";
})(VentaState || (exports.VentaState = VentaState = {}));
var CondicionPagoVenta;
(function (CondicionPagoVenta) {
    CondicionPagoVenta["CONTADO"] = "CONTADO";
    CondicionPagoVenta["CREDITO"] = "CREDITO";
})(CondicionPagoVenta || (exports.CondicionPagoVenta = CondicionPagoVenta = {}));
var EstadoStockEnum;
(function (EstadoStockEnum) {
    EstadoStockEnum["STOCK_AGOTADO"] = "STOCK_AGOTADO";
    EstadoStockEnum["STOCK_BAJO"] = "STOCK_BAJO";
    EstadoStockEnum["STOCK_MEDIO"] = "STOCK_MEDIO";
    EstadoStockEnum["STOCK_ALTO"] = "STOCK_ALTO";
})(EstadoStockEnum || (exports.EstadoStockEnum = EstadoStockEnum = {}));
var TipoActualizacionEnum;
(function (TipoActualizacionEnum) {
    TipoActualizacionEnum["COMPRA_VENTA"] = "COMPRA_VENTA";
    TipoActualizacionEnum["DESCUENTO"] = "DESCUENTO";
    TipoActualizacionEnum["STOCK"] = "STOCK";
})(TipoActualizacionEnum || (exports.TipoActualizacionEnum = TipoActualizacionEnum = {}));
var MetodoPagoEnum;
(function (MetodoPagoEnum) {
    MetodoPagoEnum["DIGITAL"] = "DIGITAL";
    MetodoPagoEnum["EFECTIVO"] = "EFECTIVO";
    MetodoPagoEnum["TARJETA"] = "TARJETA";
    MetodoPagoEnum["OTRO"] = "OTRO";
})(MetodoPagoEnum || (exports.MetodoPagoEnum = MetodoPagoEnum = {}));
var MedioPagoDigitalEnum;
(function (MedioPagoDigitalEnum) {
    MedioPagoDigitalEnum["YAPE"] = "YAPE";
    MedioPagoDigitalEnum["PLIN"] = "PLIN";
    MedioPagoDigitalEnum["TUNKI"] = "TUNKI";
    MedioPagoDigitalEnum["OTRO"] = "OTRO";
})(MedioPagoDigitalEnum || (exports.MedioPagoDigitalEnum = MedioPagoDigitalEnum = {}));
var MedioPagoEfectivoEnum;
(function (MedioPagoEfectivoEnum) {
    MedioPagoEfectivoEnum["EFECTIVO"] = "EFECTIVO";
})(MedioPagoEfectivoEnum || (exports.MedioPagoEfectivoEnum = MedioPagoEfectivoEnum = {}));
var MonedaEnum;
(function (MonedaEnum) {
    MonedaEnum["PEN"] = "PEN";
    MonedaEnum["USD"] = "USD";
})(MonedaEnum || (exports.MonedaEnum = MonedaEnum = {}));
var EstadoPagoEnum;
(function (EstadoPagoEnum) {
    EstadoPagoEnum["PENDIENTE"] = "PENDIENTE";
    EstadoPagoEnum["PAGADO_PARCIAL"] = "PAGADO_PARCIAL";
    EstadoPagoEnum["PAGADO"] = "PAGADO";
    EstadoPagoEnum["ANULADO"] = "ANULADO";
})(EstadoPagoEnum || (exports.EstadoPagoEnum = EstadoPagoEnum = {}));
