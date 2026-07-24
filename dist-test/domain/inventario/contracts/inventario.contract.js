"use strict";
// Este contexto controla: Dónde está el stock, Cuánto stock hay
// Movimientos,Transferencias,Lotes,Kardex
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoRecepcionMercaderiaEnum = exports.EstadoTransferenciaEnum = exports.OrigenDocumentoEnum = exports.EstadoMovimientoEnum = exports.TipoMovimientoInventarioEnum = exports.TipoAlmacenEnum = void 0;
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
var EstadoTransferenciaEnum;
(function (EstadoTransferenciaEnum) {
    EstadoTransferenciaEnum["PENDIENTE"] = "PENDIENTE";
    EstadoTransferenciaEnum["EN_TRANSITO"] = "EN_TRANSITO";
    EstadoTransferenciaEnum["RECIBIDO"] = "RECIBIDO";
    EstadoTransferenciaEnum["ANULADO"] = "ANULADO";
})(EstadoTransferenciaEnum || (exports.EstadoTransferenciaEnum = EstadoTransferenciaEnum = {}));
var EstadoRecepcionMercaderiaEnum;
(function (EstadoRecepcionMercaderiaEnum) {
    EstadoRecepcionMercaderiaEnum["BORRADOR"] = "BORRADOR";
    EstadoRecepcionMercaderiaEnum["CONFIRMADA"] = "CONFIRMADA";
    EstadoRecepcionMercaderiaEnum["ANULADA"] = "ANULADA";
})(EstadoRecepcionMercaderiaEnum || (exports.EstadoRecepcionMercaderiaEnum = EstadoRecepcionMercaderiaEnum = {}));
