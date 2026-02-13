import {
  AsignacionRecepcionCompra,
  CompraItem,
  EstadoMovimientoEnum,
  EventoCompra,
  ICompra,
  MovimientoInventario,
  MovimientoInventarioItem,
  OrigenDocumentoEnum,
  RecepcionMercaderia,
  TipoMovimientoInventarioEnum
} from "@/interfaces";

export class RecepcionProcessor {
  private static generarId(prefijo: string): string {
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  static procesar(data: {
    evento: EventoCompra;
    compras: ICompra[];
    recepcion: RecepcionMercaderia;
    asignacionesPrevias?: AsignacionRecepcionCompra[];
    now?: Date;
    idFactory?: () => string;
  }): {
    movimiento: MovimientoInventario;
    asignaciones: AsignacionRecepcionCompra[];
    eventoCompletamenteRecepcionado: boolean;
  } {
    if (data.recepcion.eventoCompraId !== data.evento.id) {
      throw new Error("La recepción no pertenece al evento");
    }

    const itemsPorId = new Map<string, { compraId: string; item: CompraItem }>();
    data.compras.forEach((compra) => {
      compra.items.forEach((item) => {
        itemsPorId.set(item.id, { compraId: compra.id, item });
      });
    });

    const ahora = data.now ?? new Date();
    const asignacionesNuevas: AsignacionRecepcionCompra[] = data.recepcion.items.map((item) => {
      if (!item.compraItemId || !item.compraId) {
        throw new Error("La recepción debe estar asignada a un CompraItem");
      }
      const encontrado = itemsPorId.get(item.compraItemId);
      if (!encontrado) throw new Error("CompraItem no encontrado para recepción");
      if (encontrado.compraId !== item.compraId) {
        throw new Error("La compra asociada no coincide con el CompraItem");
      }
      if (encontrado.item.productoId !== item.productoId) {
        throw new Error("El producto recibido no coincide con el CompraItem");
      }
      return {
        id: data.idFactory ? data.idFactory() : this.generarId("arc"),
        recepcionMercaderiaId: data.recepcion.id,
        compraId: item.compraId,
        compraItemId: item.compraItemId,
        productoId: item.productoId,
        cantidadAsignada: item.cantidadRecibida,
        createdAt: ahora,
        updatedAt: ahora
      };
    });

    const movimientoItems: MovimientoInventarioItem[] = data.recepcion.items.map((item) => {
      const encontrado = item.compraItemId ? itemsPorId.get(item.compraItemId) : undefined;
      return {
        productoId: item.productoId,
        cantidad: item.cantidadRecibida,
        costoUnitario: encontrado?.item.costoUnitario,
        lote: item.lote,
        fechaVencimiento: item.fechaVencimiento
      };
    });

    const estadoMovimiento =
      data.recepcion.estado === "CONFIRMADA"
        ? EstadoMovimientoEnum.APLICADO
        : data.recepcion.estado === "ANULADA"
        ? EstadoMovimientoEnum.ANULADO
        : EstadoMovimientoEnum.PENDIENTE;

    const movimiento: MovimientoInventario = {
      _id: data.idFactory ? data.idFactory() : this.generarId("mov"),
      type: "movimiento_inventario",
      tipo: TipoMovimientoInventarioEnum.ENTRADA,
      estado: estadoMovimiento,
      origenDocumento: OrigenDocumentoEnum.COMPRA,
      documentoReferenciaId: data.recepcion.id,
      almacenDestinoId: data.recepcion.almacenDestinoId,
      items: movimientoItems,
      usuarioId: data.recepcion.usuarioId,
      fechaMovimiento: data.recepcion.fechaRecepcion,
      createdAt: ahora,
      updatedAt: ahora
    };

    const asignacionesPrevias = data.asignacionesPrevias ?? [];
    const todasAsignaciones = [...asignacionesPrevias, ...asignacionesNuevas];
    const asignadoPorItem = new Map<string, number>();
    todasAsignaciones.forEach((asig) => {
      const actual = asignadoPorItem.get(asig.compraItemId) ?? 0;
      asignadoPorItem.set(asig.compraItemId, actual + asig.cantidadAsignada);
    });

    const eventoCompletamenteRecepcionado = data.compras.every((compra) =>
      compra.items.every((item) => {
        const asignado = asignadoPorItem.get(item.id) ?? 0;
        return asignado >= item.cantidad;
      })
    );

    return {
      movimiento,
      asignaciones: asignacionesNuevas,
      eventoCompletamenteRecepcionado
    };
  }
}
