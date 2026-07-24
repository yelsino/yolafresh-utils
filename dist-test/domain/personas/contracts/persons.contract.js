"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoRelacionProveedor = exports.DiaSemana = exports.CategoriaCliente = exports.CargosPersonal = void 0;
var CargosPersonal;
(function (CargosPersonal) {
    CargosPersonal["ADMINISTRADOR"] = "ADMINISTRADOR";
    CargosPersonal["SUPERVISOR"] = "SUPERVISOR";
    CargosPersonal["OPERADOR_ATENCION_COMERCIAL"] = "OPERADOR_ATENCION_COMERCIAL";
    CargosPersonal["ASISTENTE_OPERACIONES_COMERCIALES"] = "ASISTENTE_OPERACIONES_COMERCIALES";
    CargosPersonal["ENCARGADO_COMPRAS"] = "ENCARGADO_COMPRAS";
    CargosPersonal["ENCARGADO_INVENTARIO"] = "ENCARGADO_INVENTARIO";
    CargosPersonal["ENCARGADO_ALMACEN"] = "ENCARGADO_ALMACEN";
    CargosPersonal["DESPACHADOR"] = "DESPACHADOR";
    CargosPersonal["AUXILIAR_ADMINISTRATIVO"] = "AUXILIAR_ADMINISTRATIVO";
    CargosPersonal["CONTADOR"] = "CONTADOR";
    CargosPersonal["AUDITOR"] = "AUDITOR";
    CargosPersonal["SOPORTE_TECNICO"] = "SOPORTE_TECNICO";
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
    EstadoRelacionProveedor["ACTIVO"] = "ACTIVO";
    EstadoRelacionProveedor["BLOQUEADO"] = "BLOQUEADO";
    EstadoRelacionProveedor["SUSPENDIDO"] = "SUSPENDIDO";
    EstadoRelacionProveedor["INACTIVO"] = "INACTIVO";
})(EstadoRelacionProveedor || (exports.EstadoRelacionProveedor = EstadoRelacionProveedor = {}));
