"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedioPagoEfectivoEnum = exports.MedioPagoDigitalEnum = exports.MetodoPagoEnum = exports.TipoActualizacionEnum = exports.EstadoStockEnum = exports.TipoVentaEnum = exports.OrderState = void 0;
var OrderState;
(function (OrderState) {
    OrderState["PENDIENTE"] = "PENDIENTE";
    OrderState["ATENDIENDO"] = "ATENDIENDO";
    OrderState["ENTREGADO"] = "ENTREGADO";
    OrderState["CANCELADO"] = "CANCELADO";
    OrderState["DESPACHADO"] = "DESPACHADO";
})(OrderState || (exports.OrderState = OrderState = {}));
var TipoVentaEnum;
(function (TipoVentaEnum) {
    TipoVentaEnum["Kilogramo"] = "kilogramo";
    TipoVentaEnum["Unidad"] = "unidad";
    TipoVentaEnum["Saco"] = "saco";
    TipoVentaEnum["Docena"] = "docena";
    TipoVentaEnum["Arroba"] = "arroba";
    TipoVentaEnum["Caja"] = "caja";
    TipoVentaEnum["Balde"] = "balde";
    TipoVentaEnum["Bolsa"] = "bolsa";
    TipoVentaEnum["Paquete"] = "paquete";
    TipoVentaEnum["Gramo"] = "gramo";
    TipoVentaEnum["Mililitro"] = "mililitro";
    TipoVentaEnum["Litro"] = "litro";
    TipoVentaEnum["SixPack"] = "sixpack";
    TipoVentaEnum["Atado"] = "atado";
})(TipoVentaEnum || (exports.TipoVentaEnum = TipoVentaEnum = {}));
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
