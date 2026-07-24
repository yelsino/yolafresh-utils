"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsientoContable = exports.LineaAsiento = exports.AsientoId = void 0;
const AggregateRoot_1 = require("../../shared/base/AggregateRoot");
const ValueObject_1 = require("../../shared/base/ValueObject");
class AsientoId extends ValueObject_1.ValueObject {
}
exports.AsientoId = AsientoId;
class LineaAsiento {
    constructor(cuentaId, debe = 0, haber = 0, concepto) {
        this.cuentaId = cuentaId;
        this.debe = debe;
        this.haber = haber;
        this.concepto = concepto;
        if (this.debe < 0 || this.haber < 0) {
            throw new Error("Los montos no pueden ser negativos");
        }
        if (this.debe > 0 && this.haber > 0) {
            throw new Error("Una línea no puede tener debe y haber simultáneamente en un sistema puro, usar múltiples líneas si se requiere");
        }
    }
}
exports.LineaAsiento = LineaAsiento;
class AsientoContable extends AggregateRoot_1.AggregateRoot {
    constructor(id, fecha, conceptoGeneral, periodoId // Referencia al periodo fiscal
    ) {
        super(id);
        this.fecha = fecha;
        this.conceptoGeneral = conceptoGeneral;
        this.periodoId = periodoId;
        this.lineas = [];
        this.estado = 'BORRADOR';
    }
    agregarLinea(linea) {
        if (this.estado === 'CONFIRMADO') {
            throw new Error("No se pueden agregar líneas a un asiento confirmado.");
        }
        this.lineas.push(linea);
    }
    cuadra() {
        const totalDebe = this.lineas.reduce((sum, linea) => sum + linea.debe, 0);
        const totalHaber = this.lineas.reduce((sum, linea) => sum + linea.haber, 0);
        // Para evitar problemas de punto flotante en JS al sumar dinero
        return Math.abs(totalDebe - totalHaber) < 0.001;
    }
    registrar(periodo) {
        if (this.estado === 'CONFIRMADO') {
            throw new Error("El asiento ya está confirmado.");
        }
        if (!periodo.estaAbierto()) {
            throw new Error("No se puede registrar un asiento en un periodo fiscal cerrado.");
        }
        if (!this.cuadra()) {
            throw new Error("El asiento no cuadra. Total Debe y Total Haber deben ser iguales.");
        }
        this.estado = 'CONFIRMADO';
        // Aquí se podrían despachar eventos de dominio adicionales
    }
    getLineas() {
        return this.lineas;
    }
}
exports.AsientoContable = AsientoContable;
