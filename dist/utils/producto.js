"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUrlProduct = void 0;
const getUrlProduct = (categorias, urlbase, categoriaId, productoId) => {
    const categoria = categorias.find((v) => v.id === categoriaId);
    if (!categoria)
        return `/tienda/vegetales`;
    return `${urlbase}/${categoria.nombre}/${productoId}`;
};
exports.getUrlProduct = getUrlProduct;
