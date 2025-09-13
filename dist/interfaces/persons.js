"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoRelacionProveedor = exports.CategoriaCliente = exports.DiaSemana = exports.CargosPersonal = void 0;
var CargosPersonal;
(function (CargosPersonal) {
    CargosPersonal["SECRETARIO"] = "SECRETARIO";
    CargosPersonal["ADMINISTRATIVO"] = "ADMINISTRATIVO";
    CargosPersonal["REPONEDOR"] = "REPONEDOR";
    CargosPersonal["CAJERO"] = "CAJERO";
    CargosPersonal["VENDEDOR"] = "VENDEDOR";
})(CargosPersonal || (exports.CargosPersonal = CargosPersonal = {}));
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
 * Categorías de cliente
 */
var CategoriaCliente;
(function (CategoriaCliente) {
    CategoriaCliente["REGULAR"] = "regular";
    CategoriaCliente["VIP"] = "vip";
    CategoriaCliente["MAYORISTA"] = "mayorista";
    CategoriaCliente["CORPORATIVO"] = "corporativo";
})(CategoriaCliente || (exports.CategoriaCliente = CategoriaCliente = {}));
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
