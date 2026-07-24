"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoDocumentoComercialEnum = exports.TipoDocumentoComercialEnum = void 0;
var TipoDocumentoComercialEnum;
(function (TipoDocumentoComercialEnum) {
    TipoDocumentoComercialEnum["FACTURA_VENTA"] = "FACTURA_VENTA";
    TipoDocumentoComercialEnum["BOLETA_VENTA"] = "BOLETA_VENTA";
    TipoDocumentoComercialEnum["NOTA_CREDITO_VENTA"] = "NOTA_CREDITO_VENTA";
    TipoDocumentoComercialEnum["FACTURA_COMPRA"] = "FACTURA_COMPRA";
    TipoDocumentoComercialEnum["BOLETA_COMPRA"] = "BOLETA_COMPRA";
    TipoDocumentoComercialEnum["NOTA_CREDITO_COMPRA"] = "NOTA_CREDITO_COMPRA";
    TipoDocumentoComercialEnum["GUIA_REMISION"] = "GUIA_REMISION";
})(TipoDocumentoComercialEnum || (exports.TipoDocumentoComercialEnum = TipoDocumentoComercialEnum = {}));
var EstadoDocumentoComercialEnum;
(function (EstadoDocumentoComercialEnum) {
    EstadoDocumentoComercialEnum["BORRADOR"] = "BORRADOR";
    EstadoDocumentoComercialEnum["EMITIDO"] = "EMITIDO";
    EstadoDocumentoComercialEnum["ENVIADO"] = "ENVIADO";
    EstadoDocumentoComercialEnum["ACEPTADO"] = "ACEPTADO";
    EstadoDocumentoComercialEnum["RECHAZADO"] = "RECHAZADO";
    EstadoDocumentoComercialEnum["ANULADO"] = "ANULADO";
    EstadoDocumentoComercialEnum["OBSERVADO"] = "OBSERVADO"; // Con inconsistencias
})(EstadoDocumentoComercialEnum || (exports.EstadoDocumentoComercialEnum = EstadoDocumentoComercialEnum = {}));
