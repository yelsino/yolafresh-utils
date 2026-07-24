"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanCuenta = exports.PeriodoFiscal = exports.CuentaId = exports.PeriodoFiscalId = void 0;
const ValueObject_1 = require("../../shared/base/ValueObject");
const Entity_1 = require("../../shared/base/Entity");
class PeriodoFiscalId extends ValueObject_1.ValueObject {
}
exports.PeriodoFiscalId = PeriodoFiscalId;
class CuentaId extends ValueObject_1.ValueObject {
}
exports.CuentaId = CuentaId;
class PeriodoFiscal extends Entity_1.Entity {
    constructor(id, anio, mes, estado = 'ABIERTO') {
        super(id);
        this.anio = anio;
        this.mes = mes;
        this.estado = estado;
    }
    estaAbierto() {
        return this.estado === 'ABIERTO';
    }
    cerrar() {
        if (this.estado === 'CERRADO') {
            throw new Error("El periodo ya está cerrado");
        }
        this.estado = 'CERRADO';
    }
}
exports.PeriodoFiscal = PeriodoFiscal;
class PlanCuenta extends Entity_1.Entity {
    constructor(id, codigo, nombre, tipo) {
        super(id);
        this.codigo = codigo;
        this.nombre = nombre;
        this.tipo = tipo;
    }
}
exports.PlanCuenta = PlanCuenta;
