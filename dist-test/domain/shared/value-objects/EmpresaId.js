"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresaId = void 0;
const ValueObject_1 = require("../../../domain/shared/base/ValueObject");
class EmpresaId extends ValueObject_1.ValueObject {
    constructor(value) {
        if (!value || value.trim() === '') {
            throw new Error("EmpresaId no puede estar vacío");
        }
        super(value);
    }
}
exports.EmpresaId = EmpresaId;
