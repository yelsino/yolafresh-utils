"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrigenMovimientoInventarioV2 = exports.TipoMovimientoInventarioV2 = exports.MOVIMIENTO_INVENTARIO_V2_TYPE = void 0;
exports.MOVIMIENTO_INVENTARIO_V2_TYPE = "movimiento_inventario_v2";
var TipoMovimientoInventarioV2;
(function (TipoMovimientoInventarioV2) {
    TipoMovimientoInventarioV2["ENTRADA"] = "ENTRADA";
    TipoMovimientoInventarioV2["SALIDA"] = "SALIDA";
    TipoMovimientoInventarioV2["AJUSTE"] = "AJUSTE";
    TipoMovimientoInventarioV2["TRANSFERENCIA_ENTRADA"] = "TRANSFERENCIA_ENTRADA";
    TipoMovimientoInventarioV2["TRANSFERENCIA_SALIDA"] = "TRANSFERENCIA_SALIDA";
})(TipoMovimientoInventarioV2 || (exports.TipoMovimientoInventarioV2 = TipoMovimientoInventarioV2 = {}));
var OrigenMovimientoInventarioV2;
(function (OrigenMovimientoInventarioV2) {
    OrigenMovimientoInventarioV2["COMPRA"] = "COMPRA";
    OrigenMovimientoInventarioV2["VENTA"] = "VENTA";
    OrigenMovimientoInventarioV2["CONTEO"] = "CONTEO";
    OrigenMovimientoInventarioV2["AJUSTE"] = "AJUSTE";
    OrigenMovimientoInventarioV2["MERMA"] = "MERMA";
    OrigenMovimientoInventarioV2["TRANSFERENCIA"] = "TRANSFERENCIA";
    OrigenMovimientoInventarioV2["DEVOLUCION_CLIENTE"] = "DEVOLUCION_CLIENTE";
    OrigenMovimientoInventarioV2["DEVOLUCION_PROVEEDOR"] = "DEVOLUCION_PROVEEDOR";
    OrigenMovimientoInventarioV2["PRODUCCION"] = "PRODUCCION";
    OrigenMovimientoInventarioV2["APERTURA"] = "APERTURA";
    OrigenMovimientoInventarioV2["MIGRACION"] = "MIGRACION";
})(OrigenMovimientoInventarioV2 || (exports.OrigenMovimientoInventarioV2 = OrigenMovimientoInventarioV2 = {}));
