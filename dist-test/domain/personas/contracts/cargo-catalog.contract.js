"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esCargoPersonalDisponible = exports.obtenerDefinicionCargoPersonal = exports.listarCargosPersonalDisponibles = exports.CATALOGO_CARGOS_PERSONAL = void 0;
const persons_contract_1 = require("./persons.contract");
const SOLO_GASTRONOMIA = ["GASTRONOMIA"];
const CAPACIDADES_REPARTO = [
    "DELIVERY",
    "RUTAS_REPARTO",
];
exports.CATALOGO_CARGOS_PERSONAL = Object.freeze([
    { key: persons_contract_1.CargosPersonal.ADMINISTRADOR, label: "Administrador" },
    { key: persons_contract_1.CargosPersonal.SUPERVISOR, label: "Supervisor" },
    {
        key: persons_contract_1.CargosPersonal.OPERADOR_ATENCION_COMERCIAL,
        label: "Operador atención comercial",
    },
    {
        key: persons_contract_1.CargosPersonal.ASISTENTE_OPERACIONES_COMERCIALES,
        label: "Asistente operaciones comerciales",
    },
    { key: persons_contract_1.CargosPersonal.ENCARGADO_COMPRAS, label: "Encargado compras" },
    {
        key: persons_contract_1.CargosPersonal.ENCARGADO_INVENTARIO,
        label: "Encargado inventario",
    },
    { key: persons_contract_1.CargosPersonal.ENCARGADO_ALMACEN, label: "Encargado almacén" },
    { key: persons_contract_1.CargosPersonal.DESPACHADOR, label: "Despachador" },
    {
        key: persons_contract_1.CargosPersonal.AUXILIAR_ADMINISTRATIVO,
        label: "Auxiliar administrativo",
    },
    { key: persons_contract_1.CargosPersonal.CONTADOR, label: "Contador" },
    { key: persons_contract_1.CargosPersonal.AUDITOR, label: "Auditor" },
    { key: persons_contract_1.CargosPersonal.SOPORTE_TECNICO, label: "Soporte técnico" },
    { key: persons_contract_1.CargosPersonal.SECRETARIO, label: "Secretario" },
    { key: persons_contract_1.CargosPersonal.ADMINISTRATIVO, label: "Administrativo" },
    { key: persons_contract_1.CargosPersonal.REPONEDOR, label: "Reponedor" },
    { key: persons_contract_1.CargosPersonal.CAJERO, label: "Cajero" },
    { key: persons_contract_1.CargosPersonal.VENDEDOR, label: "Vendedor" },
    {
        key: persons_contract_1.CargosPersonal.ANFITRION,
        label: "Anfitrión",
        verticales: SOLO_GASTRONOMIA,
    },
    {
        key: persons_contract_1.CargosPersonal.MOZO_MESERO,
        label: "Mozo / mesero",
        verticales: SOLO_GASTRONOMIA,
    },
    {
        key: persons_contract_1.CargosPersonal.CAPITAN_SALON,
        label: "Capitán de salón",
        verticales: SOLO_GASTRONOMIA,
    },
    {
        key: persons_contract_1.CargosPersonal.COCINERO,
        label: "Cocinero",
        verticales: SOLO_GASTRONOMIA,
    },
    {
        key: persons_contract_1.CargosPersonal.JEFE_COCINA,
        label: "Jefe de cocina",
        verticales: SOLO_GASTRONOMIA,
    },
    {
        key: persons_contract_1.CargosPersonal.BARTENDER_ENCARGADO_BARRA,
        label: "Bartender / encargado de barra",
        verticales: SOLO_GASTRONOMIA,
    },
    {
        key: persons_contract_1.CargosPersonal.REPARTIDOR,
        label: "Repartidor",
        requiereAlgunaCapacidad: CAPACIDADES_REPARTO,
    },
]);
const CATALOGO_POR_CARGO = new Map(exports.CATALOGO_CARGOS_PERSONAL.map((definition) => [definition.key, definition]));
const cumpleDisponibilidad = (definition, perfil) => {
    var _a, _b, _c;
    // Una empresa sin perfil es una instalación legacy compatible con Retail.
    const vertical = (_a = perfil === null || perfil === void 0 ? void 0 : perfil.vertical) !== null && _a !== void 0 ? _a : "RETAIL";
    if (definition.verticales && !definition.verticales.includes(vertical)) {
        return false;
    }
    if ((_b = definition.requiereAlgunaCapacidad) === null || _b === void 0 ? void 0 : _b.length) {
        const capacidades = new Set((_c = perfil === null || perfil === void 0 ? void 0 : perfil.capacidades) !== null && _c !== void 0 ? _c : []);
        return definition.requiereAlgunaCapacidad.some((capacidad) => capacidades.has(capacidad));
    }
    return true;
};
const listarCargosPersonalDisponibles = (perfil) => exports.CATALOGO_CARGOS_PERSONAL.filter((definition) => cumpleDisponibilidad(definition, perfil));
exports.listarCargosPersonalDisponibles = listarCargosPersonalDisponibles;
const obtenerDefinicionCargoPersonal = (cargo) => CATALOGO_POR_CARGO.get(cargo);
exports.obtenerDefinicionCargoPersonal = obtenerDefinicionCargoPersonal;
const esCargoPersonalDisponible = (cargo, perfil) => {
    const definition = (0, exports.obtenerDefinicionCargoPersonal)(cargo);
    return definition ? cumpleDisponibilidad(definition, perfil) : false;
};
exports.esCargoPersonalDisponible = esCargoPersonalDisponible;
