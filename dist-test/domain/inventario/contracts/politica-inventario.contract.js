"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRECEDENCIA_POLITICA_INVENTARIO = exports.NivelPoliticaInventario = exports.ModoControlInventario = exports.POLITICA_INVENTARIO_TYPE = void 0;
exports.POLITICA_INVENTARIO_TYPE = "politica_inventario";
var ModoControlInventario;
(function (ModoControlInventario) {
    /** Saldos confiables; una insuficiencia bloquea la operación. */
    ModoControlInventario["ESTRICTO"] = "ESTRICTO";
    /** Conserva ledger, advierte diferencias y permite continuar. */
    ModoControlInventario["FLEXIBLE"] = "FLEXIBLE";
    /** El saldo es orientativo y nunca bloquea la operación comercial. */
    ModoControlInventario["REFERENCIAL"] = "REFERENCIAL";
    /** El producto queda fuera del ledger físico. */
    ModoControlInventario["SIN_CONTROL"] = "SIN_CONTROL";
})(ModoControlInventario || (exports.ModoControlInventario = ModoControlInventario = {}));
var NivelPoliticaInventario;
(function (NivelPoliticaInventario) {
    NivelPoliticaInventario["EMPRESA"] = "EMPRESA";
    NivelPoliticaInventario["ALMACEN"] = "ALMACEN";
    NivelPoliticaInventario["PRODUCTO"] = "PRODUCTO";
    NivelPoliticaInventario["PRODUCTO_ALMACEN"] = "PRODUCTO_ALMACEN";
})(NivelPoliticaInventario || (exports.NivelPoliticaInventario = NivelPoliticaInventario = {}));
/** Menor a mayor prioridad. */
exports.PRECEDENCIA_POLITICA_INVENTARIO = Object.freeze([
    NivelPoliticaInventario.EMPRESA,
    NivelPoliticaInventario.ALMACEN,
    NivelPoliticaInventario.PRODUCTO,
    NivelPoliticaInventario.PRODUCTO_ALMACEN,
]);
