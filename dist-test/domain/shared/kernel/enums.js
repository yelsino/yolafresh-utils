"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoPagoEnum = exports.MonedaEnum = exports.MedioPagoEfectivoEnum = exports.MedioPagoDigitalEnum = exports.MetodoPagoEnum = exports.TipoActualizacionEnum = exports.EstadoStockEnum = exports.CondicionPagoVenta = exports.VentaState = exports.PedidoEntregaModalidadEnum = exports.PedidoProcedenciaEnum = exports.PedidoPrioridadEnum = exports.PedidoEntregaState = exports.PedidoState = void 0;
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
var PedidoProcedenciaEnum;
(function (PedidoProcedenciaEnum) {
    PedidoProcedenciaEnum["TIENDA"] = "TIENDA";
    PedidoProcedenciaEnum["WEB"] = "WEB";
    PedidoProcedenciaEnum["WHATSAPP"] = "WHATSAPP";
    PedidoProcedenciaEnum["INSTAGRAM"] = "INSTAGRAM";
    PedidoProcedenciaEnum["FACEBOOK"] = "FACEBOOK";
    PedidoProcedenciaEnum["OTRO"] = "OTRO";
})(PedidoProcedenciaEnum || (exports.PedidoProcedenciaEnum = PedidoProcedenciaEnum = {}));
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
