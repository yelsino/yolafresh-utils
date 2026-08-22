"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const index_1 = require("../index");
const ahora = 1787256000000;
const buildLegacy = (cambios = {}) => ({
    id: "presentacion_arroz_5kg",
    type: "presentacion",
    productoBaseId: "producto_arroz",
    nombre: "Bolsa de arroz 5 kg",
    precioVenta: 24.9,
    tipoVenta: index_1.TipoVentaEnum.Unidad,
    contenidoNeto: 5,
    unidadContenido: index_1.UnidadMedidaEnum.Kilogramo,
    equivalenciaUnidadBase: 5,
    unidadBaseInventario: "kilogramo",
    fraccionable: false,
    visibleEnPOS: true,
    visibleOnline: true,
    createdAt: ahora,
    updatedAt: ahora,
    ...cambios,
});
const buildPresentacion = (cambios = {}) => ({
    ...buildLegacy(),
    versionConversion: 3,
    ...cambios,
});
(0, node_test_1.default)("normaliza solo la ausencia legacy a la versión inicial", () => {
    const normalizada = (0, index_1.normalizarPresentacionLegacy)(buildLegacy());
    strict_1.default.equal(normalizada.versionConversion, index_1.VERSION_CONVERSION_PRESENTACION_INICIAL);
    strict_1.default.equal((0, index_1.normalizarPresentacionLegacy)(buildLegacy({ versionConversion: 7 })).versionConversion, 7);
    strict_1.default.equal((0, index_1.crearVersionConversionPresentacion)(), 1);
});
(0, node_test_1.default)("rechaza una versión legacy presente pero inválida", () => {
    for (const invalida of [null, 0, -1, 1.5, Number.NaN, "1"]) {
        strict_1.default.equal((0, index_1.esVersionConversionPresentacionValida)(invalida), false);
        strict_1.default.throws(() => (0, index_1.normalizarPresentacionLegacy)(buildLegacy({ versionConversion: invalida })), /entero positivo seguro/);
    }
});
(0, node_test_1.default)("creación inicia en 1 y cambios cosméticos conservan la versión", () => {
    const actual = buildPresentacion();
    const cosmetica = buildPresentacion({
        nombre: "Arroz extra 5 kg",
        precioVenta: 26.5,
        visibleEnPOS: false,
    });
    strict_1.default.equal((0, index_1.calcularVersionConversionPresentacion)(undefined, cosmetica), 1);
    strict_1.default.equal((0, index_1.esMismaConversionSemanticaPresentacion)(actual, cosmetica), true);
    strict_1.default.equal((0, index_1.calcularVersionConversionPresentacion)(actual, cosmetica), 3);
    strict_1.default.equal((0, index_1.aplicarVersionConversionPresentacion)(actual, cosmetica).versionConversion, 3);
});
(0, node_test_1.default)("cada cambio semántico incrementa exactamente una versión", () => {
    const actual = buildPresentacion();
    const cambios = [
        buildPresentacion({ equivalenciaUnidadBase: 6 }),
        buildPresentacion({ productoBaseId: "producto_arroz_integral" }),
        buildPresentacion({ unidadBaseInventario: "unidad" }),
    ];
    for (const candidata of cambios) {
        strict_1.default.equal((0, index_1.esMismaConversionSemanticaPresentacion)(actual, candidata), false);
        strict_1.default.equal((0, index_1.calcularVersionConversionPresentacion)(actual, candidata), 4);
        strict_1.default.equal((0, index_1.aplicarVersionConversionPresentacion)(actual, candidata).versionConversion, 4);
    }
});
(0, node_test_1.default)("cambio de unidad base del producto padre incrementa cada hija", () => {
    const actual = buildPresentacion();
    strict_1.default.equal((0, index_1.incrementarVersionConversionPresentacion)(actual), 4);
    strict_1.default.equal((0, index_1.incrementarVersionConversionPresentacion)(3), 4);
    strict_1.default.throws(() => (0, index_1.incrementarVersionConversionPresentacion)(0), /entero positivo seguro/);
    strict_1.default.throws(() => (0, index_1.incrementarVersionConversionPresentacion)(Number.MAX_SAFE_INTEGER), /entero positivo seguro/);
});
(0, node_test_1.default)("acepta únicamente la versión esperada para cada transición", () => {
    const actual = buildPresentacion();
    const cosmetica = buildPresentacion({ nombre: "Nombre nuevo" });
    const conversion = buildPresentacion({
        equivalenciaUnidadBase: 6,
        versionConversion: 4,
    });
    strict_1.default.deepEqual((0, index_1.validarTransicionVersionConversionPresentacion)(actual, cosmetica), {
        valido: true,
        errores: [],
        cambioSemantico: false,
        versionEsperada: 3,
    });
    strict_1.default.deepEqual((0, index_1.validarTransicionVersionConversionPresentacion)(actual, conversion), {
        valido: true,
        errores: [],
        cambioSemantico: true,
        versionEsperada: 4,
    });
});
(0, node_test_1.default)("rechaza versión inválida, regresión, salto y versión cosmética alterada", () => {
    const actual = buildPresentacion();
    const casos = [
        {
            candidata: { ...buildPresentacion(), versionConversion: 0 },
            error: /entero positivo seguro/,
        },
        {
            candidata: buildPresentacion({ versionConversion: 2 }),
            error: /no puede retroceder/,
        },
        {
            candidata: buildPresentacion({
                equivalenciaUnidadBase: 6,
                versionConversion: 3,
            }),
            error: /incrementar exactamente en uno/,
        },
        {
            candidata: buildPresentacion({
                equivalenciaUnidadBase: 6,
                versionConversion: 5,
            }),
            error: /incrementar exactamente en uno/,
        },
        {
            candidata: buildPresentacion({ versionConversion: 4 }),
            error: /conservarse sin cambio semántico/,
        },
    ];
    for (const caso of casos) {
        const resultado = (0, index_1.validarTransicionVersionConversionPresentacion)(actual, caso.candidata);
        strict_1.default.equal(resultado.valido, false);
        strict_1.default.match(resultado.errores.join("; "), caso.error);
    }
});
