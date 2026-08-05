"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const index_1 = require("../index");
(0, node_test_1.default)("surface restaurant exporta un solo contrato canonico", () => {
    const exportedTypesCompile = [];
    strict_1.default.equal(exportedTypesCompile.length, 0);
    strict_1.default.equal((0, index_1.dineroRestaurante)(100).minorUnits, 100);
    strict_1.default.equal((0, index_1.puedeTransicionarSesionRestaurante)("ABIERTA", "EN_ATENCION"), true);
});
