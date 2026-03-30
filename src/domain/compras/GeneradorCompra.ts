
import { generarUlid } from "@/domain/shared/utils/dates";
import { Compra } from "./Compra";
import { EventoCompra, CompraItem, TipoDocumentoCompraEnum, EstadoCompraEnum, CompraEgresoRef } from "../shared/interfaces";
import { EstadoPagoEnum } from "../shared/utils";

export class GeneradorCompra {
  private static generarId(prefijo: string): string {
    return generarUlid(prefijo);
  }

  private static redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  static generarCompras(data: {
    evento: EventoCompra;
    items: CompraItem[];
    proveedorPorCompraId: Record<
      string,
      {
        proveedorId: string;
        proveedorNombreSnapshot?: string;
        proveedorRucSnapshot?: string;
      }
    >;
    now?: number;
    idFactory?: () => string;
    tipoDocumento?: TipoDocumentoCompraEnum;
    serieDocumento?: string;
    numeroDocumento?: string;
    correlativoInterno?: string;
    fechaDocumento?: number;
    fechaRegistro?: number;
    moneda?: "PEN" | "USD";
    tipoCambio?: number;
    condicionPago?: "CONTADO" | "CREDITO";
    estadoPago?: EstadoPagoEnum;
    fechaVencimientoPago?: number;
    estado?: EstadoCompraEnum;
    impuestos?: number;
    descuentos?: number;
    gastosAdicionales?: CompraEgresoRef[];
  }): Compra[] {
    const itemsPorCompraId = new Map<string, CompraItem[]>();
    data.items.forEach((item) => {
      if (!item.nombreItem || item.nombreItem.trim() === "") {
        throw new Error("nombreItem es requerido en CompraItem");
      }
      const lista = itemsPorCompraId.get(item.compraId) ?? [];
      lista.push({ ...item, nombreItem: item.nombreItem.trim() });
      itemsPorCompraId.set(item.compraId, lista);
    });

    const ahora = data.now ?? Date.now();
    const fechaDocumento = data.fechaDocumento ?? ahora;
    const fechaRegistro = data.fechaRegistro ?? ahora;
    const tipoDocumento = data.tipoDocumento ?? TipoDocumentoCompraEnum.FACTURA;
    const moneda = data.moneda ?? "PEN";
    const estado = data.estado ?? EstadoCompraEnum.BORRADOR;
    const estadoPago = data.estadoPago ?? EstadoPagoEnum.PENDIENTE;
    const impuestos = data.impuestos ?? 0;
    const descuentos = data.descuentos ?? 0;
    const gastosAdicionales = data.gastosAdicionales ?? [];
    const totalGastos = gastosAdicionales.reduce(
      (sum, gasto) => sum + gasto.montoAplicado,
      0
    );

    return Array.from(itemsPorCompraId.entries()).map(([compraId, items]) => {
      const itemsConTotales = items.map((item) => {
        const costoTotal = this.redondear(item.cantidad * item.costoUnitario);
        return { ...item, costoTotal };
      });

      const subtotal = this.redondear(
        itemsConTotales.reduce((sum, item) => sum + item.costoTotal, 0),
      );
      const total = this.redondear(subtotal + impuestos + totalGastos - descuentos);

      const proveedorMeta = data.proveedorPorCompraId[compraId];
      if (!proveedorMeta) {
        throw new Error("Proveedor no encontrado para compraId");
      }

      return new Compra({
        id: compraId || (data.idFactory ? data.idFactory() : this.generarId("comp")),
        eventoCompraId: data.evento.id,
        proveedorId: proveedorMeta.proveedorId,
        proveedorNombreSnapshot: proveedorMeta.proveedorNombreSnapshot,
        proveedorRucSnapshot: proveedorMeta.proveedorRucSnapshot,
        tipoDocumento,
        serieDocumento: data.serieDocumento,
        numeroDocumento: data.numeroDocumento,
        correlativoInterno: data.correlativoInterno,
        fechaDocumento,
        fechaRegistro,
        items: itemsConTotales,
        subtotal,
        impuestos,
        descuentos,
        gastosAdicionales,
        moneda,
        tipoCambio: data.tipoCambio,
        total,
        condicionPago: data.condicionPago,
        estadoPago,
        fechaVencimientoPago: data.fechaVencimientoPago,
        estado,
        createdAt: ahora,
        updatedAt: ahora,
      });
    });
  }
}
