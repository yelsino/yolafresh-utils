"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VentaConfirmada = void 0;
class VentaConfirmada {
    constructor(ventaId, total) {
        this.ventaId = ventaId;
        this.total = total;
        this.occurredOn = new Date();
    }
}
exports.VentaConfirmada = VentaConfirmada;
