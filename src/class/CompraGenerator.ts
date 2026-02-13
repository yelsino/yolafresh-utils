import {
  CompraEgresoRef,
  CompraItem,
  EstadoCompraEnum,
  EstadoPagoEnum,
  EventoCompra,
  EventoCompraItem,
  ICompra,
  TipoDocumentoCompraEnum
} from "@/interfaces";

export class CompraGenerator {
  private static generarId(prefijo: string): string {
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private static redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  static generarCompras(data: {
    evento: EventoCompra;
    items: CompraItem[];
    relaciones: EventoCompraItem[];
    proveedorInfo?: Record<string, { proveedorNombre?: string; proveedorRuc?: string }>;
    now?: Date;
    idFactory?: () => string;
    tipoDocumento?: TipoDocumentoCompraEnum;
    serieDocumento?: string;
    numeroDocumento?: string;
    correlativo?: string;
    fechaDocumento?: string;
    fechaRegistro?: string;
    moneda?: "PEN" | "USD";
    tipoCambio?: number;
    condicionPago?: "CONTADO" | "CREDITO";
    estadoPago?: EstadoPagoEnum;
    fechaVencimientoPago?: string;
    estado?: EstadoCompraEnum;
    impuestos?: number;
    descuentos?: number;
    gastosAdicionales?: CompraEgresoRef[];
  }): ICompra[] {
    const itemsById = new Map<string, CompraItem>();
    data.items.forEach((item) => itemsById.set(item.id, item));

    const itemsPorProveedor = new Map<string, CompraItem[]>();
    data.relaciones.forEach((rel) => {
      const item = itemsById.get(rel.compraItemId);
      if (!item) throw new Error("CompraItem no encontrado para relación");
      const lista = itemsPorProveedor.get(rel.proveedorId) ?? [];
      lista.push({ ...item });
      itemsPorProveedor.set(rel.proveedorId, lista);
    });

    const ahora = data.now ?? new Date();
    const fechaDocumento = data.fechaDocumento ?? ahora.toISOString();
    const fechaRegistro = data.fechaRegistro ?? ahora.toISOString();
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

    return Array.from(itemsPorProveedor.entries()).map(([proveedorId, items]) => {
      const itemsConTotales = items.map((item) => {
        const costoTotal = item.costoTotal ?? this.redondear(item.cantidad * item.costoUnitario);
        return { ...item, costoTotal };
      });

      const subtotal = this.redondear(
        itemsConTotales.reduce((sum, item) => sum + (item.costoTotal ?? 0), 0)
      );
      const total = this.redondear(subtotal + impuestos + totalGastos - descuentos);

      const proveedorMeta = data.proveedorInfo?.[proveedorId];

      return {
        id: data.idFactory ? data.idFactory() : this.generarId("comp"),
        eventoCompraId: data.evento.id,
        proveedorId,
        proveedorNombre: proveedorMeta?.proveedorNombre,
        proveedorRuc: proveedorMeta?.proveedorRuc,
        tipoDocumento,
        serieDocumento: data.serieDocumento,
        numeroDocumento: data.numeroDocumento,
        correlativo: data.correlativo,
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
        updatedAt: ahora
      };
    });
  }
}
