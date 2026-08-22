"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoCapturaConteoInventario = exports.EstadoLineaConteoInventario = exports.EstadoConteoInventario = exports.TipoConteoInventario = exports.CONTEO_INVENTARIO_LINEA_TYPE = exports.CONTEO_INVENTARIO_TYPE = void 0;
exports.CONTEO_INVENTARIO_TYPE = "conteo_inventario";
exports.CONTEO_INVENTARIO_LINEA_TYPE = "conteo_inventario_linea";
var TipoConteoInventario;
(function (TipoConteoInventario) {
    /** Baseline físico al iniciar Inventario V2 o un negocio nuevo. */
    TipoConteoInventario["APERTURA"] = "APERTURA";
    TipoConteoInventario["GENERAL"] = "GENERAL";
    TipoConteoInventario["CICLICO"] = "CICLICO";
    TipoConteoInventario["AD_HOC"] = "AD_HOC";
})(TipoConteoInventario || (exports.TipoConteoInventario = TipoConteoInventario = {}));
var EstadoConteoInventario;
(function (EstadoConteoInventario) {
    EstadoConteoInventario["BORRADOR"] = "BORRADOR";
    EstadoConteoInventario["EN_CURSO"] = "EN_CURSO";
    EstadoConteoInventario["EN_REVISION"] = "EN_REVISION";
    EstadoConteoInventario["APROBADO"] = "APROBADO";
    EstadoConteoInventario["APLICADO"] = "APLICADO";
    EstadoConteoInventario["CANCELADO"] = "CANCELADO";
})(EstadoConteoInventario || (exports.EstadoConteoInventario = EstadoConteoInventario = {}));
var EstadoLineaConteoInventario;
(function (EstadoLineaConteoInventario) {
    EstadoLineaConteoInventario["PENDIENTE"] = "PENDIENTE";
    EstadoLineaConteoInventario["CONTADA"] = "CONTADA";
    EstadoLineaConteoInventario["REQUIERE_RECONTEO"] = "REQUIERE_RECONTEO";
    EstadoLineaConteoInventario["VALIDADA"] = "VALIDADA";
})(EstadoLineaConteoInventario || (exports.EstadoLineaConteoInventario = EstadoLineaConteoInventario = {}));
var TipoCapturaConteoInventario;
(function (TipoCapturaConteoInventario) {
    TipoCapturaConteoInventario["CONTEO"] = "CONTEO";
    TipoCapturaConteoInventario["RECONTEO"] = "RECONTEO";
})(TipoCapturaConteoInventario || (exports.TipoCapturaConteoInventario = TipoCapturaConteoInventario = {}));
