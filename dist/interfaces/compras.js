"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoTransferenciaEnum = exports.EstadoPagoEnum = exports.TipoDocumentoCompraEnum = exports.EstadoCompraEnum = exports.OrigenDocumentoEnum = exports.EstadoMovimientoEnum = exports.TipoMovimientoInventarioEnum = exports.TipoAlmacenEnum = void 0;
var TipoAlmacenEnum;
(function (TipoAlmacenEnum) {
    TipoAlmacenEnum["CENTRAL"] = "CENTRAL";
    TipoAlmacenEnum["TIENDA"] = "TIENDA";
    TipoAlmacenEnum["TRANSITO"] = "TRANSITO";
    TipoAlmacenEnum["MOSTRADOR"] = "MOSTRADOR";
})(TipoAlmacenEnum || (exports.TipoAlmacenEnum = TipoAlmacenEnum = {}));
var TipoMovimientoInventarioEnum;
(function (TipoMovimientoInventarioEnum) {
    TipoMovimientoInventarioEnum["ENTRADA"] = "ENTRADA";
    TipoMovimientoInventarioEnum["SALIDA"] = "SALIDA";
    TipoMovimientoInventarioEnum["AJUSTE"] = "AJUSTE";
    TipoMovimientoInventarioEnum["TRANSFERENCIA"] = "TRANSFERENCIA";
})(TipoMovimientoInventarioEnum || (exports.TipoMovimientoInventarioEnum = TipoMovimientoInventarioEnum = {}));
var EstadoMovimientoEnum;
(function (EstadoMovimientoEnum) {
    EstadoMovimientoEnum["PENDIENTE"] = "PENDIENTE";
    EstadoMovimientoEnum["APLICADO"] = "APLICADO";
    EstadoMovimientoEnum["ANULADO"] = "ANULADO";
})(EstadoMovimientoEnum || (exports.EstadoMovimientoEnum = EstadoMovimientoEnum = {}));
var OrigenDocumentoEnum;
(function (OrigenDocumentoEnum) {
    OrigenDocumentoEnum["COMPRA"] = "COMPRA";
    OrigenDocumentoEnum["VENTA"] = "VENTA";
    OrigenDocumentoEnum["AJUSTE"] = "AJUSTE";
    OrigenDocumentoEnum["TRANSFERENCIA"] = "TRANSFERENCIA";
    OrigenDocumentoEnum["PRODUCCION"] = "PRODUCCION";
    OrigenDocumentoEnum["MERMA"] = "MERMA";
    OrigenDocumentoEnum["DEVOLUCION"] = "DEVOLUCION";
    OrigenDocumentoEnum["INVENTARIO_FISICO"] = "INVENTARIO_FISICO";
})(OrigenDocumentoEnum || (exports.OrigenDocumentoEnum = OrigenDocumentoEnum = {}));
var EstadoCompraEnum;
(function (EstadoCompraEnum) {
    EstadoCompraEnum["BORRADOR"] = "BORRADOR";
    EstadoCompraEnum["CONFIRMADO"] = "CONFIRMADO";
    EstadoCompraEnum["ANULADO"] = "ANULADO";
    EstadoCompraEnum["CONTABILIZADO"] = "CONTABILIZADO";
})(EstadoCompraEnum || (exports.EstadoCompraEnum = EstadoCompraEnum = {}));
var TipoDocumentoCompraEnum;
(function (TipoDocumentoCompraEnum) {
    TipoDocumentoCompraEnum["FACTURA"] = "FACTURA";
    TipoDocumentoCompraEnum["BOLETA"] = "BOLETA";
    TipoDocumentoCompraEnum["NOTA_CREDITO"] = "NOTA_CREDITO";
    TipoDocumentoCompraEnum["GUIA_REMISION"] = "GUIA_REMISION";
    TipoDocumentoCompraEnum["OTRO"] = "OTRO";
})(TipoDocumentoCompraEnum || (exports.TipoDocumentoCompraEnum = TipoDocumentoCompraEnum = {}));
var EstadoPagoEnum;
(function (EstadoPagoEnum) {
    EstadoPagoEnum["PENDIENTE"] = "PENDIENTE";
    EstadoPagoEnum["PAGADO_PARCIAL"] = "PAGADO_PARCIAL";
    EstadoPagoEnum["PAGADO"] = "PAGADO";
})(EstadoPagoEnum || (exports.EstadoPagoEnum = EstadoPagoEnum = {}));
var EstadoTransferenciaEnum;
(function (EstadoTransferenciaEnum) {
    EstadoTransferenciaEnum["PENDIENTE"] = "PENDIENTE";
    EstadoTransferenciaEnum["EN_TRANSITO"] = "EN_TRANSITO";
    EstadoTransferenciaEnum["RECIBIDO"] = "RECIBIDO";
    EstadoTransferenciaEnum["ANULADO"] = "ANULADO";
})(EstadoTransferenciaEnum || (exports.EstadoTransferenciaEnum = EstadoTransferenciaEnum = {}));
