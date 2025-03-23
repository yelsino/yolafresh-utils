"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCategory = searchCategory;
const categorias_1 = require("../data/categorias");
function searchCategory(clave, valor) {
    return categorias_1.CATEGORIAS.find(item => item[clave] === valor);
}
