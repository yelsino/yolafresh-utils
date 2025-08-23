"use strict";
// Este archivo es generado automáticamente
// No modificar manualmente
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Exportaciones por categoría
__exportStar(require("./interfaces"), exports);
__exportStar(require("./data"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./class"), exports);
__exportStar(require("./store"), exports);
// También puedes exportar directamente los módulos más utilizados aquí si lo deseas
// Por ejemplo:
// export { Producto, UpdateProducto } from './interfaces/producto';
// export { formatearFecha } from './utils/textos';
