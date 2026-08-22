"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnidadBaseInventarioV2 = exports.INVENTORY_V2_SCHEMA_VERSION = void 0;
/**
 * Versión del esquema documental Inventory V2.
 *
 * Es independiente de la versión npm, del schema de snapshot y del schema SQLite.
 */
exports.INVENTORY_V2_SCHEMA_VERSION = 2;
/**
 * Unidad canónica en la que Inventario conserva la existencia de un producto base.
 * Las presentaciones son unidades comerciales/de captura y nunca claves de stock V2.
 */
exports.UnidadBaseInventarioV2 = Object.freeze({
    UNIDAD: "unidad",
    KILOGRAMO: "kilogramo",
    LITRO: "litro",
    METRO: "metro",
});
