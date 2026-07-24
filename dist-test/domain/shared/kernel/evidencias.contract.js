"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatoArchivoEnum = exports.TipoEvidenciaEnum = void 0;
var TipoEvidenciaEnum;
(function (TipoEvidenciaEnum) {
    TipoEvidenciaEnum["FACTURA"] = "FACTURA";
    TipoEvidenciaEnum["BOLETA"] = "BOLETA";
    TipoEvidenciaEnum["NOTA_CREDITO"] = "NOTA_CREDITO";
    TipoEvidenciaEnum["GUIA_REMISION"] = "GUIA_REMISION";
    TipoEvidenciaEnum["VOUCHER_PAGO"] = "VOUCHER_PAGO";
    TipoEvidenciaEnum["RECIBO"] = "RECIBO";
    TipoEvidenciaEnum["FOTO_MERCADERIA"] = "FOTO_MERCADERIA";
    TipoEvidenciaEnum["ACTA_RECEPCION"] = "ACTA_RECEPCION";
    TipoEvidenciaEnum["ACTA_MERMA"] = "ACTA_MERMA";
    TipoEvidenciaEnum["OTRO"] = "OTRO";
})(TipoEvidenciaEnum || (exports.TipoEvidenciaEnum = TipoEvidenciaEnum = {}));
var FormatoArchivoEnum;
(function (FormatoArchivoEnum) {
    FormatoArchivoEnum["PDF"] = "PDF";
    FormatoArchivoEnum["XML"] = "XML";
    FormatoArchivoEnum["JPG"] = "JPG";
    FormatoArchivoEnum["PNG"] = "PNG";
    FormatoArchivoEnum["WEBP"] = "WEBP";
})(FormatoArchivoEnum || (exports.FormatoArchivoEnum = FormatoArchivoEnum = {}));
