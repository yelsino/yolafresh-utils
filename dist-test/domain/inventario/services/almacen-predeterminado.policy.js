"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolverAlmacenPredeterminado = void 0;
const normalizeId = (value) => String(value !== null && value !== void 0 ? value : "").trim();
/**
 * Resuelve un almacén sobre el conjunto que el operador puede utilizar.
 *
 * No decide por nombre, tipo ni orden. Con varios almacenes solo devuelve uno
 * cuando la configuración de empresa apunta a un almacén activo disponible.
 */
const resolverAlmacenPredeterminado = (almacenes, almacenPredeterminadoId) => {
    var _a;
    const disponiblesPorId = new Map();
    for (const almacen of almacenes) {
        const id = normalizeId(almacen === null || almacen === void 0 ? void 0 : almacen._id);
        if (!id || (almacen === null || almacen === void 0 ? void 0 : almacen.activo) !== true)
            continue;
        disponiblesPorId.set(id, almacen);
    }
    const disponibles = [...disponiblesPorId.values()];
    const configuredId = normalizeId(almacenPredeterminadoId);
    if (disponibles.length === 0) {
        return {
            almacen: null,
            almacenId: null,
            origen: "SIN_ALMACENES",
            requiereSeleccion: false,
            configuracionInvalida: Boolean(configuredId),
            totalDisponibles: 0,
        };
    }
    if (disponibles.length === 1) {
        const almacen = disponibles[0];
        return {
            almacen,
            almacenId: normalizeId(almacen._id),
            origen: "UNICO_DISPONIBLE",
            requiereSeleccion: false,
            configuracionInvalida: Boolean(configuredId) && configuredId !== normalizeId(almacen._id),
            totalDisponibles: 1,
        };
    }
    const configured = configuredId
        ? (_a = disponiblesPorId.get(configuredId)) !== null && _a !== void 0 ? _a : null
        : null;
    if (configured) {
        return {
            almacen: configured,
            almacenId: configuredId,
            origen: "CONFIGURADO",
            requiereSeleccion: false,
            configuracionInvalida: false,
            totalDisponibles: disponibles.length,
        };
    }
    return {
        almacen: null,
        almacenId: null,
        origen: "SELECCION_REQUERIDA",
        requiereSeleccion: true,
        configuracionInvalida: Boolean(configuredId),
        totalDisponibles: disponibles.length,
    };
};
exports.resolverAlmacenPredeterminado = resolverAlmacenPredeterminado;
