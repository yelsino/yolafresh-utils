"use strict";
/**
 * Clase Compra - Entidad de Dominio
 *
 * Representa una compra finalizada e inmutable.
 * Esta clase representa el documento persistido en la base de datos.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compra = void 0;
const compra_contract_1 = require("../contracts/compra.contract");
const enums_1 = require("../../shared/kernel/enums");
const dates_1 = require("../../shared/utils/dates");
class Compra {
    constructor(data) {
        this.type = "compra";
        if (!data.id)
            throw new Error("El ID de la compra es requerido");
        if (!data.eventoCompraId)
            throw new Error("El eventoCompraId es requerido para crear una compra");
        if (!data.proveedorId)
            throw new Error("El proveedor es requerido");
        if (!data.items || data.items.length === 0)
            throw new Error("La compra debe tener items");
        this.id = data.id;
        this.eventoCompraId = data.eventoCompraId;
        this.proveedorId = data.proveedorId;
        this.proveedorNombreSnapshot = data.proveedorNombreSnapshot;
        this.proveedorRucSnapshot = data.proveedorRucSnapshot;
        this.tipoDocumento = data.tipoDocumento;
        this.serieDocumento = data.serieDocumento;
        this.numeroDocumento = data.numeroDocumento;
        this.correlativoInterno = data.correlativoInterno;
        this.fechaDocumento = data.fechaDocumento;
        this.fechaRegistro = data.fechaRegistro;
        this.items = data.items.map((item) => ({ ...item }));
        this.subtotal = data.subtotal;
        this.impuestos = data.impuestos;
        this.descuentos = data.descuentos;
        this.gastosAdicionales = data.gastosAdicionales;
        this.moneda = data.moneda;
        this.tipoCambio = data.tipoCambio;
        this.total = data.total;
        this.condicionPago = data.condicionPago;
        this.estadoPago = data.estadoPago;
        this.fechaVencimientoPago = data.fechaVencimientoPago;
        this.estado = data.estado;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.validarIntegridad();
    }
    /**
     * Verifica si la compra está pagada totalmente
     */
    get estaPagada() {
        return this.estadoPago === enums_1.EstadoPagoEnum.PAGADO;
    }
    /**
     * Verifica si la compra está pendiente de pago
     */
    get estaPendientePago() {
        return (this.estadoPago === enums_1.EstadoPagoEnum.PENDIENTE ||
            this.estadoPago === enums_1.EstadoPagoEnum.PAGADO_PARCIAL);
    }
    /**
     * Verifica si la compra ha sido anulada
     */
    get estaAnulada() {
        return this.estado === compra_contract_1.EstadoCompraEnum.ANULADO;
    }
    /**
     * Verifica si la compra ha sido confirmada/procesada
     */
    get estaConfirmada() {
        return this.estado === compra_contract_1.EstadoCompraEnum.CONFIRMADO;
    }
    /**
     * Retorna una representación plana del objeto (para JSON/DB)
     */
    toJSON() {
        return {
            id: this.id,
            eventoCompraId: this.eventoCompraId,
            proveedorId: this.proveedorId,
            proveedorNombreSnapshot: this.proveedorNombreSnapshot,
            proveedorRucSnapshot: this.proveedorRucSnapshot,
            tipoDocumento: this.tipoDocumento,
            serieDocumento: this.serieDocumento,
            numeroDocumento: this.numeroDocumento,
            correlativoInterno: this.correlativoInterno,
            fechaDocumento: this.fechaDocumento,
            fechaRegistro: this.fechaRegistro,
            items: this.items,
            subtotal: this.subtotal,
            impuestos: this.impuestos,
            descuentos: this.descuentos,
            gastosAdicionales: this.gastosAdicionales,
            moneda: this.moneda,
            tipoCambio: this.tipoCambio,
            total: this.total,
            condicionPago: this.condicionPago,
            estadoPago: this.estadoPago,
            fechaVencimientoPago: this.fechaVencimientoPago,
            estado: this.estado,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
    static fromJSON(data) {
        return new Compra(data);
    }
    confirmar(now) {
        if (this.estado !== compra_contract_1.EstadoCompraEnum.BORRADOR) {
            throw new Error("Solo se puede confirmar una compra en estado BORRADOR");
        }
        if (this.estaAnulada)
            throw new Error("No se puede confirmar una compra ANULADA");
        return this.withChanges({
            estado: compra_contract_1.EstadoCompraEnum.CONFIRMADO,
            updatedAt: now !== null && now !== void 0 ? now : dates_1.DateUtils.nowUnix(),
        });
    }
    cerrar(now) {
        if (this.estado !== compra_contract_1.EstadoCompraEnum.CONFIRMADO) {
            throw new Error("Solo se puede cerrar una compra en estado CONFIRMADO");
        }
        if (this.estaAnulada)
            throw new Error("No se puede cerrar una compra ANULADA");
        return this.withChanges({
            estado: compra_contract_1.EstadoCompraEnum.CERRADO,
            updatedAt: now !== null && now !== void 0 ? now : dates_1.DateUtils.nowUnix(),
        });
    }
    anular(now) {
        if (this.estado === compra_contract_1.EstadoCompraEnum.CERRADO) {
            throw new Error("No se puede anular una compra CERRADA");
        }
        return this.withChanges({
            estado: compra_contract_1.EstadoCompraEnum.ANULADO,
            updatedAt: now !== null && now !== void 0 ? now : dates_1.DateUtils.nowUnix(),
        });
    }
    marcarComoPagada(now) {
        if (this.estaAnulada)
            throw new Error("No se puede pagar una compra ANULADA");
        return this.withChanges({
            estadoPago: enums_1.EstadoPagoEnum.PAGADO,
            updatedAt: now !== null && now !== void 0 ? now : dates_1.DateUtils.nowUnix(),
        });
    }
    registrarPago(data) {
        var _a;
        if (this.estaAnulada)
            throw new Error("No se puede pagar una compra ANULADA");
        if (data.monto <= 0)
            throw new Error("El monto de pago debe ser mayor a 0");
        const estadoPago = data.monto >= this.total ? enums_1.EstadoPagoEnum.PAGADO : enums_1.EstadoPagoEnum.PAGADO_PARCIAL;
        return this.withChanges({
            estadoPago,
            updatedAt: (_a = data.now) !== null && _a !== void 0 ? _a : dates_1.DateUtils.nowUnix(),
        });
    }
    withChanges(changes) {
        const next = {
            ...this.toJSON(),
            ...changes,
            items: this.items.map((i) => ({ ...i })),
        };
        return new Compra(next);
    }
    validarIntegridad() {
        var _a, _b, _c;
        if (!Number.isFinite(this.subtotal) || this.subtotal < 0) {
            throw new Error("Subtotal inválido");
        }
        const impuestos = (_a = this.impuestos) !== null && _a !== void 0 ? _a : 0;
        const descuentos = (_b = this.descuentos) !== null && _b !== void 0 ? _b : 0;
        if (!Number.isFinite(impuestos) || impuestos < 0) {
            throw new Error("Impuestos inválidos");
        }
        if (!Number.isFinite(descuentos) || descuentos < 0) {
            throw new Error("Descuentos inválidos");
        }
        if (!Number.isFinite(this.total) || this.total < 0) {
            throw new Error("Total inválido");
        }
        if (!Number.isFinite(this.fechaDocumento)) {
            throw new Error("fechaDocumento inválida");
        }
        if (!Number.isFinite(this.fechaRegistro)) {
            throw new Error("fechaRegistro inválida");
        }
        if (this.condicionPago === "CREDITO" && !this.fechaVencimientoPago) {
            throw new Error("Fecha de vencimiento requerida para crédito");
        }
        if (this.condicionPago === "CONTADO" && this.fechaVencimientoPago != null) {
            throw new Error("Fecha de vencimiento no aplica para contado");
        }
        const redondear = (valor) => Math.round(valor * 100) / 100;
        const totalItems = redondear(this.items.reduce((sum, item) => {
            if (!item.id)
                throw new Error("CompraItem sin id");
            if (!item.nombreItem || item.nombreItem.trim() === "") {
                throw new Error("CompraItem sin nombreItem");
            }
            if (!item.presentacionId)
                throw new Error("CompraItem sin presentacionId");
            if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) {
                throw new Error("Cantidad inválida en CompraItem");
            }
            if (!Number.isFinite(item.costoUnitario) || item.costoUnitario < 0) {
                throw new Error("CostoUnitario inválido en CompraItem");
            }
            if (!Number.isFinite(item.costoTotal) || item.costoTotal < 0) {
                throw new Error("CostoTotal inválido en CompraItem");
            }
            const esperado = redondear(item.cantidad * item.costoUnitario);
            if (redondear(item.costoTotal) !== esperado) {
                throw new Error("CostoTotal inconsistente en CompraItem");
            }
            return sum + item.costoTotal;
        }, 0));
        if (redondear(this.subtotal) !== totalItems) {
            throw new Error("Subtotal inconsistente con items");
        }
        const totalGastos = redondear(((_c = this.gastosAdicionales) !== null && _c !== void 0 ? _c : []).reduce((sum, g) => sum + g.montoAplicado, 0));
        const esperadoTotal = redondear(redondear(this.subtotal) + redondear(impuestos) + totalGastos - redondear(descuentos));
        if (redondear(this.total) !== esperadoTotal) {
            throw new Error("Total inconsistente con subtotal/impuestos/descuentos/gastos");
        }
    }
}
exports.Compra = Compra;
