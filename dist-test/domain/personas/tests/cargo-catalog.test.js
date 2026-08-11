"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const contracts_1 = require("../contracts");
const rbac_catalogs_contract_1 = require("../contracts/rbac-catalogs.contract");
const roles_contract_1 = require("../contracts/roles.contract");
const CARGOS_GASTRONOMICOS = [
    contracts_1.CargosPersonal.ANFITRION,
    contracts_1.CargosPersonal.MOZO_MESERO,
    contracts_1.CargosPersonal.CAPITAN_SALON,
    contracts_1.CargosPersonal.COCINERO,
    contracts_1.CargosPersonal.JEFE_COCINA,
    contracts_1.CargosPersonal.BARTENDER_ENCARGADO_BARRA,
];
(0, node_test_1.default)("el catálogo define exactamente todos los cargos publicados", () => {
    strict_1.default.deepEqual([...contracts_1.CATALOGO_CARGOS_PERSONAL.map((item) => item.key)].sort(), [...Object.values(contracts_1.CargosPersonal)].sort());
    strict_1.default.equal(new Set(contracts_1.CATALOGO_CARGOS_PERSONAL.map((item) => item.key)).size, contracts_1.CATALOGO_CARGOS_PERSONAL.length);
});
(0, node_test_1.default)("retail y empresas legacy ocultan cargos gastronómicos", () => {
    const retail = (0, contracts_1.listarCargosPersonalDisponibles)({
        vertical: "RETAIL",
        capacidades: ["VENTA_MOSTRADOR", "CAJA"],
    });
    const legacy = (0, contracts_1.listarCargosPersonalDisponibles)(null);
    for (const cargo of CARGOS_GASTRONOMICOS) {
        strict_1.default.equal(retail.some((item) => item.key === cargo), false);
        strict_1.default.equal(legacy.some((item) => item.key === cargo), false);
    }
    strict_1.default.equal(retail.some((item) => item.key === contracts_1.CargosPersonal.REPARTIDOR), false);
});
(0, node_test_1.default)("cargos gastronomicos sugieren roles gastronomicos y no roles Retail", () => {
    strict_1.default.deepEqual(rbac_catalogs_contract_1.CARGOS_ROLES_SUGERIDOS[contracts_1.CargosPersonal.MOZO_MESERO], [
        roles_contract_1.RolesPredefinidos.GASTRONOMIA_MESERO,
    ]);
    strict_1.default.deepEqual(rbac_catalogs_contract_1.CARGOS_ROLES_SUGERIDOS[contracts_1.CargosPersonal.COCINERO], [
        roles_contract_1.RolesPredefinidos.GASTRONOMIA_COCINERO,
    ]);
    strict_1.default.deepEqual(rbac_catalogs_contract_1.CARGOS_ROLES_SUGERIDOS[contracts_1.CargosPersonal.BARTENDER_ENCARGADO_BARRA], [roles_contract_1.RolesPredefinidos.GASTRONOMIA_BARRA]);
    strict_1.default.deepEqual(rbac_catalogs_contract_1.CARGOS_ROLES_SUGERIDOS[contracts_1.CargosPersonal.REPARTIDOR], []);
});
(0, node_test_1.default)("gastronomía expone salón, cocina y barra, pero no reparto sin capacidad", () => {
    const cargos = (0, contracts_1.listarCargosPersonalDisponibles)({
        vertical: "GASTRONOMIA",
        capacidades: ["PEDIDOS", "MESAS", "COMANDAS", "CAJA"],
    });
    for (const cargo of CARGOS_GASTRONOMICOS) {
        strict_1.default.equal(cargos.some((item) => item.key === cargo), true);
    }
    strict_1.default.equal(cargos.some((item) => item.key === contracts_1.CargosPersonal.REPARTIDOR), false);
});
(0, node_test_1.default)("repartidor depende de delivery o rutas de reparto en cualquier vertical", () => {
    strict_1.default.equal((0, contracts_1.esCargoPersonalDisponible)(contracts_1.CargosPersonal.REPARTIDOR, {
        vertical: "RETAIL",
        capacidades: ["DELIVERY"],
    }), true);
    strict_1.default.equal((0, contracts_1.esCargoPersonalDisponible)(contracts_1.CargosPersonal.REPARTIDOR, {
        vertical: "GASTRONOMIA",
        capacidades: ["RUTAS_REPARTO"],
    }), true);
    strict_1.default.equal((0, contracts_1.esCargoPersonalDisponible)(contracts_1.CargosPersonal.REPARTIDOR, {
        vertical: "GASTRONOMIA",
        capacidades: ["MESAS", "COMANDAS"],
    }), false);
});
