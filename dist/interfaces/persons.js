"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoRelacionProveedor = exports.DiaSemana = exports.CategoriaCliente = exports.CargosPersonal = void 0;
var CargosPersonal;
(function (CargosPersonal) {
    CargosPersonal["SECRETARIO"] = "SECRETARIO";
    CargosPersonal["ADMINISTRATIVO"] = "ADMINISTRATIVO";
    CargosPersonal["REPONEDOR"] = "REPONEDOR";
    CargosPersonal["CAJERO"] = "CAJERO";
    CargosPersonal["VENDEDOR"] = "VENDEDOR";
})(CargosPersonal || (exports.CargosPersonal = CargosPersonal = {}));
var CategoriaCliente;
(function (CategoriaCliente) {
    CategoriaCliente["REGULAR"] = "REGULAR";
    CategoriaCliente["PREMIUM"] = "PREMIUM";
    CategoriaCliente["VIP"] = "VIP";
    CategoriaCliente["MAYORISTA"] = "MAYORISTA";
    CategoriaCliente["CORPORATIVO"] = "CORPORATIVO";
})(CategoriaCliente || (exports.CategoriaCliente = CategoriaCliente = {}));
/**
 * Días de la semana
 */
var DiaSemana;
(function (DiaSemana) {
    DiaSemana["LUNES"] = "lunes";
    DiaSemana["MARTES"] = "martes";
    DiaSemana["MIERCOLES"] = "miercoles";
    DiaSemana["JUEVES"] = "jueves";
    DiaSemana["VIERNES"] = "viernes";
    DiaSemana["SABADO"] = "sabado";
    DiaSemana["DOMINGO"] = "domingo";
})(DiaSemana || (exports.DiaSemana = DiaSemana = {}));
/**
 * Estado de la relación comercial con el proveedor
 */
var EstadoRelacionProveedor;
(function (EstadoRelacionProveedor) {
    EstadoRelacionProveedor["ACTIVO"] = "activo";
    EstadoRelacionProveedor["INACTIVO"] = "inactivo";
    EstadoRelacionProveedor["SUSPENDIDO"] = "suspendido";
    EstadoRelacionProveedor["EN_EVALUACION"] = "en_evaluacion";
    EstadoRelacionProveedor["BLOQUEADO"] = "bloqueado";
})(EstadoRelacionProveedor || (exports.EstadoRelacionProveedor = EstadoRelacionProveedor = {}));
