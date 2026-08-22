"use strict";
// Este contexto controla: Dónde está el stock, Cuánto stock hay
// Movimientos,Transferencias,Lotes,Kardex
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoRecepcionMercaderiaEnum = exports.TipoAlmacenEnum = void 0;
var TipoAlmacenEnum;
(function (TipoAlmacenEnum) {
    TipoAlmacenEnum["CENTRAL"] = "CENTRAL";
    TipoAlmacenEnum["TIENDA"] = "TIENDA";
    TipoAlmacenEnum["TRANSITO"] = "TRANSITO";
    TipoAlmacenEnum["MOSTRADOR"] = "MOSTRADOR";
})(TipoAlmacenEnum || (exports.TipoAlmacenEnum = TipoAlmacenEnum = {}));
var EstadoRecepcionMercaderiaEnum;
(function (EstadoRecepcionMercaderiaEnum) {
    EstadoRecepcionMercaderiaEnum["BORRADOR"] = "BORRADOR";
    EstadoRecepcionMercaderiaEnum["CONFIRMADA"] = "CONFIRMADA";
    EstadoRecepcionMercaderiaEnum["ANULADA"] = "ANULADA";
})(EstadoRecepcionMercaderiaEnum || (exports.EstadoRecepcionMercaderiaEnum = EstadoRecepcionMercaderiaEnum = {}));
