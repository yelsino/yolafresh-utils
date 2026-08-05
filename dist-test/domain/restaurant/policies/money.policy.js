"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dineroRestaurante = dineroRestaurante;
exports.sumarDineroRestaurante = sumarDineroRestaurante;
exports.restarDineroRestaurante = restarDineroRestaurante;
exports.calcularTotalesCuentaRestaurante = calcularTotalesCuentaRestaurante;
exports.sumarListaDineroRestaurante = sumarListaDineroRestaurante;
function dineroRestaurante(minorUnits, currency = "PEN") {
    if (!Number.isSafeInteger(minorUnits)) {
        throw new Error("DineroRestaurante.minorUnits debe ser un entero seguro");
    }
    return Object.freeze({ currency, minorUnits });
}
function sumarDineroRestaurante(left, right) {
    assertSameCurrency(left, right);
    return dineroRestaurante(left.minorUnits + right.minorUnits, left.currency);
}
function restarDineroRestaurante(left, right) {
    assertSameCurrency(left, right);
    return dineroRestaurante(left.minorUnits - right.minorUnits, left.currency);
}
function calcularTotalesCuentaRestaurante(input) {
    var _a, _b, _c, _d;
    const zero = dineroRestaurante(0, input.currency);
    const servicio = (_a = input.servicio) !== null && _a !== void 0 ? _a : zero;
    const propina = (_b = input.propina) !== null && _b !== void 0 ? _b : zero;
    const redondeo = (_c = input.redondeo) !== null && _c !== void 0 ? _c : zero;
    const subtotal = sumarListaDineroRestaurante(input.cargos.map((charge) => charge.subtotal), input.currency);
    const descuento = sumarListaDineroRestaurante(input.cargos.map((charge) => charge.descuento), input.currency);
    const impuesto = sumarListaDineroRestaurante(input.cargos.map((charge) => charge.impuesto), input.currency);
    const cargoTotal = sumarListaDineroRestaurante(input.cargos.map((charge) => charge.total), input.currency);
    const total = [servicio, propina, redondeo].reduce(sumarDineroRestaurante, cargoTotal);
    const pagado = sumarListaDineroRestaurante((_d = input.pagos) !== null && _d !== void 0 ? _d : [], input.currency);
    const saldo = restarDineroRestaurante(total, pagado);
    if (saldo.minorUnits < 0) {
        throw new Error("Los pagos aplicados no pueden exceder el total de la cuenta");
    }
    return {
        subtotal,
        descuento,
        impuesto,
        servicio,
        propina,
        redondeo,
        total,
        pagado,
        saldo,
    };
}
function sumarListaDineroRestaurante(values, currency) {
    return values.reduce(sumarDineroRestaurante, dineroRestaurante(0, currency));
}
function assertSameCurrency(left, right) {
    if (left.currency !== right.currency) {
        throw new Error("No se puede operar dinero de monedas diferentes");
    }
}
