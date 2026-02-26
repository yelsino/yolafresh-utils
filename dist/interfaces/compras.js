"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoEventoCompraEnum = exports.EstadoPagoEnum = exports.TipoDocumentoCompraEnum = exports.EstadoCompraEnum = void 0;
var EstadoCompraEnum;
(function (EstadoCompraEnum) {
    EstadoCompraEnum["BORRADOR"] = "BORRADOR";
    EstadoCompraEnum["CONFIRMADO"] = "CONFIRMADO";
    EstadoCompraEnum["CERRADO"] = "CERRADO";
    EstadoCompraEnum["ANULADO"] = "ANULADO";
})(EstadoCompraEnum || (exports.EstadoCompraEnum = EstadoCompraEnum = {}));
var TipoDocumentoCompraEnum;
(function (TipoDocumentoCompraEnum) {
    TipoDocumentoCompraEnum["FACTURA"] = "FACTURA";
    TipoDocumentoCompraEnum["BOLETA"] = "BOLETA";
    TipoDocumentoCompraEnum["NOTA_CREDITO"] = "NOTA_CREDITO";
    TipoDocumentoCompraEnum["GUIA_REMISION"] = "GUIA_REMISION";
    TipoDocumentoCompraEnum["OTRO"] = "OTRO";
    TipoDocumentoCompraEnum["SIN_ASIGNAR"] = "SIN_ASIGNAR";
})(TipoDocumentoCompraEnum || (exports.TipoDocumentoCompraEnum = TipoDocumentoCompraEnum = {}));
var EstadoPagoEnum;
(function (EstadoPagoEnum) {
    EstadoPagoEnum["PENDIENTE"] = "PENDIENTE";
    EstadoPagoEnum["PAGADO_PARCIAL"] = "PAGADO_PARCIAL";
    EstadoPagoEnum["PAGADO"] = "PAGADO";
})(EstadoPagoEnum || (exports.EstadoPagoEnum = EstadoPagoEnum = {}));
var EstadoEventoCompraEnum;
(function (EstadoEventoCompraEnum) {
    EstadoEventoCompraEnum["EN_REGISTRO"] = "EN_REGISTRO";
    EstadoEventoCompraEnum["CONFIRMADO"] = "CONFIRMADO";
    EstadoEventoCompraEnum["CERRADO"] = "CERRADO";
    EstadoEventoCompraEnum["CANCELADO"] = "CANCELADO";
})(EstadoEventoCompraEnum || (exports.EstadoEventoCompraEnum = EstadoEventoCompraEnum = {}));
