"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerCaracteristicas = exports.getUrlProduct = void 0;
const caracteristicas_1 = require("../data/caracteristicas");
const getUrlProduct = (categorias, urlbase, categoriaId, productoId) => {
    const categoria = categorias.find((v) => v.id === categoriaId);
    if (!categoria)
        return `/tienda/vegetales`;
    return `${urlbase}/${categoria.nombre}/${productoId}`;
};
exports.getUrlProduct = getUrlProduct;
const obtenerCaracteristicas = (productoConsideraciones) => {
    const dataCaractersiticas = caracteristicas_1.CARACTERISTICAS;
    const categorias = productoConsideraciones.split(",");
    let caracteristicas = [];
    for (const categoria of categorias) {
        const items = dataCaractersiticas[categoria];
        if (items) {
            caracteristicas = caracteristicas.concat(items);
        }
    }
    // Eliminar duplicados utilizando un Set
    return [...new Set(caracteristicas)];
};
exports.obtenerCaracteristicas = obtenerCaracteristicas;
