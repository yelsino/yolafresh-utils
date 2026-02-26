import { EstadoCompraEnum, EstadoPagoEnum, TipoDocumentoCompraEnum } from "@/interfaces";
import { DateUtils } from "@/utils";
import type { CompraEgresoRef, CompraItem, ICompra } from "@/interfaces";

/**
 * Clase Compra - Entidad de Dominio
 *
 * Representa una compra finalizada e inmutable.
 * Esta clase representa el documento persistido en la base de datos.
 */

export class Compra implements ICompra {
  public readonly id: string;
  public readonly type: "compra" = "compra";

  public readonly eventoCompraId: string;

  public readonly proveedorId: string;
  public readonly proveedorNombreSnapshot?: string;
  public readonly proveedorRucSnapshot?: string;

  public readonly tipoDocumento: TipoDocumentoCompraEnum;
  public readonly serieDocumento?: string;
  public readonly numeroDocumento?: string;
  public readonly correlativoInterno?: string;

  public readonly fechaDocumento: number;
  public readonly fechaRegistro: number;

  public readonly items: CompraItem[];

  public readonly subtotal: number;
  public readonly impuestos?: number;
  public readonly descuentos?: number;
  public readonly gastosAdicionales?: CompraEgresoRef[];

  public readonly moneda: "PEN" | "USD";
  public readonly tipoCambio?: number;

  public readonly total: number;

  public readonly condicionPago?: "CONTADO" | "CREDITO";
  public readonly estadoPago: EstadoPagoEnum;
  public readonly fechaVencimientoPago?: number;

  public readonly estado: EstadoCompraEnum;

  public readonly createdAt: number;
  public readonly updatedAt: number;

  constructor(data: ICompra) {
    if (!data.id) throw new Error("El ID de la compra es requerido");
    if (!data.eventoCompraId)
      throw new Error("El eventoCompraId es requerido para crear una compra");
    if (!data.proveedorId) throw new Error("El proveedor es requerido");
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
  public get estaPagada(): boolean {
    return this.estadoPago === EstadoPagoEnum.PAGADO;
  }

  /**
   * Verifica si la compra está pendiente de pago
   */
  public get estaPendientePago(): boolean {
    return (
      this.estadoPago === EstadoPagoEnum.PENDIENTE ||
      this.estadoPago === EstadoPagoEnum.PAGADO_PARCIAL
    );
  }

  /**
   * Verifica si la compra ha sido anulada
   */
  public get estaAnulada(): boolean {
    return this.estado === EstadoCompraEnum.ANULADO;
  }

  /**
   * Verifica si la compra ha sido confirmada/procesada
   */
  public get estaConfirmada(): boolean {
    return this.estado === EstadoCompraEnum.CONFIRMADO;
  }

  /**
   * Retorna una representación plana del objeto (para JSON/DB)
   */
  public toJSON(): ICompra {
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

  public static fromJSON(data: ICompra): Compra {
    return new Compra(data);
  }

  public confirmar(now?: number): Compra {
    if (this.estado !== EstadoCompraEnum.BORRADOR) {
      throw new Error("Solo se puede confirmar una compra en estado BORRADOR");
    }
    if (this.estaAnulada) throw new Error("No se puede confirmar una compra ANULADA");
    return this.withChanges({
      estado: EstadoCompraEnum.CONFIRMADO,
      updatedAt: now ?? DateUtils.nowUnix(),
    });
  }

  public cerrar(now?: number): Compra {
    if (this.estado !== EstadoCompraEnum.CONFIRMADO) {
      throw new Error("Solo se puede cerrar una compra en estado CONFIRMADO");
    }
    if (this.estaAnulada) throw new Error("No se puede cerrar una compra ANULADA");
    return this.withChanges({
      estado: EstadoCompraEnum.CERRADO,
      updatedAt: now ?? DateUtils.nowUnix(),
    });
  }

  public anular(now?: number): Compra {
    if (this.estado === EstadoCompraEnum.CERRADO) {
      throw new Error("No se puede anular una compra CERRADA");
    }
    return this.withChanges({
      estado: EstadoCompraEnum.ANULADO,
      updatedAt: now ?? DateUtils.nowUnix(),
    });
  }

  public marcarComoPagada(now?: number): Compra {
    if (this.estaAnulada) throw new Error("No se puede pagar una compra ANULADA");
    return this.withChanges({
      estadoPago: EstadoPagoEnum.PAGADO,
      updatedAt: now ?? DateUtils.nowUnix(),
    });
  }

  public registrarPago(data: { monto: number; now?: number }): Compra {
    if (this.estaAnulada) throw new Error("No se puede pagar una compra ANULADA");
    if (data.monto <= 0) throw new Error("El monto de pago debe ser mayor a 0");
    const estadoPago =
      data.monto >= this.total ? EstadoPagoEnum.PAGADO : EstadoPagoEnum.PAGADO_PARCIAL;
    return this.withChanges({
      estadoPago,
      updatedAt: data.now ?? DateUtils.nowUnix(),
    });
  }

  private withChanges(changes: Partial<ICompra> & { updatedAt: number }): Compra {
    const next: ICompra = {
      ...this.toJSON(),
      ...changes,
      items: this.items.map((i) => ({ ...i })),
    };
    return new Compra(next);
  }

  private validarIntegridad(): void {
    if (!Number.isFinite(this.subtotal) || this.subtotal < 0) {
      throw new Error("Subtotal inválido");
    }
    const impuestos = this.impuestos ?? 0;
    const descuentos = this.descuentos ?? 0;
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

    const redondear = (valor: number): number => Math.round(valor * 100) / 100;
    const totalItems = redondear(
      this.items.reduce((sum, item) => {
        if (!item.id) throw new Error("CompraItem sin id");
        if (!item.presentacionId) throw new Error("CompraItem sin presentacionId");
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
      }, 0),
    );

    if (redondear(this.subtotal) !== totalItems) {
      throw new Error("Subtotal inconsistente con items");
    }

    const totalGastos = redondear(
      (this.gastosAdicionales ?? []).reduce((sum, g) => sum + g.montoAplicado, 0),
    );
    const esperadoTotal = redondear(
      redondear(this.subtotal) + redondear(impuestos) + totalGastos - redondear(descuentos),
    );
    if (redondear(this.total) !== esperadoTotal) {
      throw new Error("Total inconsistente con subtotal/impuestos/descuentos/gastos");
    }
  }
}
