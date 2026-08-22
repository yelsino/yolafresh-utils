"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluarConversionPedidoRestaurante = evaluarConversionPedidoRestaurante;
exports.esProductoPedidoRestauranteSnapshotVersionado = esProductoPedidoRestauranteSnapshotVersionado;
exports.crearFirmaConversionPedidoRestaurante = crearFirmaConversionPedidoRestaurante;
const services_1 = require("../../inventario/services");
const UNIDADES_BASE_INVENTARIO = new Set([
    "unidad",
    "kilogramo",
    "litro",
    "metro",
]);
/**
 * Distingue datos legacy de una conversión versionada válida. Si la propiedad
 * existe pero está incompleta, no se degrada silenciosamente a legacy.
 */
function evaluarConversionPedidoRestaurante(snapshot) {
    const conversion = snapshot.conversionInventario;
    if (conversion === undefined) {
        return { estado: "LEGACY_SIN_CONVERSION", valida: true, errores: [] };
    }
    const validation = (0, services_1.validarConversionInventario)(conversion);
    const errores = [...validation.errores];
    if (!Number.isSafeInteger(conversion.versionConversion)) {
        errores.push("conversion.versionConversion debe ser un entero seguro positivo");
    }
    if (!UNIDADES_BASE_INVENTARIO.has(conversion.unidadBase)) {
        errores.push("conversion.unidadBase no pertenece al catálogo canónico");
    }
    if (conversion.productoBaseId !== snapshot.productoId) {
        errores.push("conversion.productoBaseId no coincide con snapshot.productoId");
    }
    if (conversion.presentacionId !== snapshot.presentacionId) {
        errores.push("conversion.presentacionId no coincide con snapshot.presentacionId");
    }
    if (snapshot.unidadComercial !== undefined &&
        (typeof conversion.unidadOperacion !== "string" ||
            conversion.unidadOperacion.trim() !== snapshot.unidadComercial.trim())) {
        errores.push("conversion.unidadOperacion no coincide con snapshot.unidadComercial");
    }
    if (errores.length > 0) {
        return { estado: "INVALIDA", valida: false, errores };
    }
    return { estado: "VERSIONADA", valida: true, errores: [], conversion };
}
function esProductoPedidoRestauranteSnapshotVersionado(snapshot) {
    return evaluarConversionPedidoRestaurante(snapshot).estado === "VERSIONADA";
}
/** Firma estable para impedir mezclar líneas con conversiones distintas. */
function crearFirmaConversionPedidoRestaurante(snapshot) {
    const evaluation = evaluarConversionPedidoRestaurante(snapshot);
    if (evaluation.estado === "LEGACY_SIN_CONVERSION") {
        return "LEGACY_SIN_CONVERSION";
    }
    if (evaluation.estado === "INVALIDA") {
        throw new Error(`RESTAURANT_ORDER_CONVERSION_INVALID:${evaluation.errores.join(";")}`);
    }
    const conversion = evaluation.conversion;
    return [
        conversion.productoBaseId,
        conversion.presentacionId,
        conversion.unidadOperacion,
        conversion.unidadBase,
        conversion.factorUnidadBase,
        conversion.precisionCantidadBase,
        conversion.versionConversion,
    ].join(":");
}
