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
exports.RecurrenciaEntity = exports.VentaSnapshot = exports.VENTA_SNAPSHOT_TYPE = exports.Venta = exports.ProcedenciaVenta = exports.CarritoVenta = void 0;
// Surface raíz mínima oficial
__exportStar(require("./domain/shared/base"), exports);
__exportStar(require("./domain/shared/kernel"), exports);
__exportStar(require("./domain/shared/utils"), exports);
__exportStar(require("./domain/shared/value-objects"), exports);
var entities_1 = require("./domain/ventas/entities");
Object.defineProperty(exports, "CarritoVenta", { enumerable: true, get: function () { return entities_1.CarritoVenta; } });
Object.defineProperty(exports, "ProcedenciaVenta", { enumerable: true, get: function () { return entities_1.ProcedenciaVenta; } });
Object.defineProperty(exports, "Venta", { enumerable: true, get: function () { return entities_1.Venta; } });
Object.defineProperty(exports, "VENTA_SNAPSHOT_TYPE", { enumerable: true, get: function () { return entities_1.VENTA_SNAPSHOT_TYPE; } });
Object.defineProperty(exports, "VentaSnapshot", { enumerable: true, get: function () { return entities_1.VentaSnapshot; } });
var entities_2 = require("./domain/finanzas/entities");
Object.defineProperty(exports, "RecurrenciaEntity", { enumerable: true, get: function () { return entities_2.RecurrenciaEntity; } });
