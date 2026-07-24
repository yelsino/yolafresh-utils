"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SucursalId = void 0;
const ValueObject_1 = require("../../../domain/shared/base/ValueObject");
class SucursalId extends ValueObject_1.ValueObject {
    constructor(value) {
        if (!value || value.trim() === '') {
            throw new Error("SucursalId no puede estar vacío");
        }
        super(value);
    }
}
exports.SucursalId = SucursalId;
