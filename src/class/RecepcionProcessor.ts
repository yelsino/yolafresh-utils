import {
  Almacen,
  AsignacionRecepcionCompra,
  CompraItem,
  EstadoCompraEnum,
  EstadoEventoCompraEnum,
  EstadoMovimientoEnum,
  EventoCompra,
  EstadoRecepcionMercaderiaEnum,
  ICompra,
  MovimientoInventario,
  MovimientoInventarioItem,
  OrigenDocumentoEnum,
  RecepcionMercaderia,
  TipoMovimientoInventarioEnum,
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
    almacenes?: Almacen[];
    now?: Date;
    idFactory?: () => string;
  }): {
    movimiento: MovimientoInventario;
    asignaciones: AsignacionRecepcionCompra[];
    eventoCompletamenteRecepcionado: boolean;
    comprasCompletamenteRecepcionadasIds: string[];
  } {
    if (data.recepcion.eventoCompraId !== data.evento.id) {
      throw new Error("La recepción no pertenece al evento");
    }

    // if (data.recepcion.estado !== EstadoRecepcionMercaderiaEnum.CONFIRMADA) {
    //   throw new Error("La recepción debe estar CONFIRMADA para procesar");
    // }

    if (!data.recepcion.items.length) {
      throw new Error("La recepción debe contener al menos un item");
    }

    if (data.almacenes) {
      const almacenDestino = data.almacenes.find(
        (almacen) => almacen._id === data.recepcion.almacenDestinoId,
      );
      if (!almacenDestino) {
        throw new Error("El almacén destino no existe");
      }
      if (!almacenDestino.activo) {
        throw new Error("El almacén destino no está activo");
      }
    }

    if (data.evento.estado !== EstadoEventoCompraEnum.CONFIRMADO) {
      throw new Error("El evento debe estar CONFIRMADO para recepcionar");
    }

    data.compras.forEach((compra) => {
      if (compra.eventoCompraId !== data.evento.id) {
        throw new Error("Hay compras que no pertenecen al evento");
      }
      if (compra.estado === EstadoCompraEnum.ANULADO) {
        throw new Error("No se puede recepcionar una compra ANULADA");
      }
    });

    const comprasPorId = new Map<string, ICompra>();
    data.compras.forEach((compra) => comprasPorId.set(compra.id, compra));

    const itemsPorId = new Map<
      string,
      { compraId: string; item: CompraItem }
    >();
    data.compras.forEach((compra) => {
      compra.items.forEach((item) => {
        itemsPorId.set(item.id, { compraId: compra.id, item });
      });
    });

    const ahora = data.now ?? new Date();
    const asignacionesPrevias = data.asignacionesPrevias ?? [];
    const asignadoPorItem = new Map<string, number>();
    asignacionesPrevias.forEach((asig) => {
      const actual = asignadoPorItem.get(asig.compraItemId) ?? 0;
      asignadoPorItem.set(asig.compraItemId, actual + asig.cantidadAsignada);
    });

    const asignacionesNuevas: AsignacionRecepcionCompra[] =
      data.recepcion.items.map((item) => {
        if (!item.compraItemId || !item.compraId) {
          throw new Error("La recepción debe estar asignada a un CompraItem");
        }
        if (item.cantidadRecibida <= 0) {
          throw new Error("La cantidad recibida debe ser mayor a 0");
        }
        const compra = comprasPorId.get(item.compraId);
        if (!compra) {
          throw new Error("La compra asociada a la recepción no existe");
        }
        const encontrado = itemsPorId.get(item.compraItemId);
        if (!encontrado)
          throw new Error("CompraItem no encontrado para recepción");
        if (encontrado.compraId !== item.compraId) {
          throw new Error("La compra asociada no coincide con el CompraItem");
        }
        if (encontrado.item.productoId !== item.productoId) {
          throw new Error("El producto recibido no coincide con el CompraItem");
        }
        if (encontrado.item.afectaInventario === false) {
          throw new Error(
            "No se puede recepcionar un item que no afecta inventario",
          );
        }

        const yaAsignado = asignadoPorItem.get(item.compraItemId) ?? 0;
        const cantidadComprada = encontrado.item.cantidad;
        if (yaAsignado + item.cantidadRecibida > cantidadComprada) {
          throw new Error("Se está recibiendo más de lo comprado");
        }
        asignadoPorItem.set(
          item.compraItemId,
          yaAsignado + item.cantidadRecibida,
        );

        return {
          id: data.idFactory ? data.idFactory() : this.generarId("arc"),
          recepcionMercaderiaId: data.recepcion.id,
          compraId: item.compraId,
          compraItemId: item.compraItemId,
          productoId: item.productoId,
          cantidadAsignada: item.cantidadRecibida,
          createdAt: ahora,
          updatedAt: ahora,
        };
      });

    const movimientoItems: MovimientoInventarioItem[] =
      data.recepcion.items.flatMap((item) => {
        const encontrado = item.compraItemId
          ? itemsPorId.get(item.compraItemId)
          : undefined;
        if (encontrado?.item.afectaInventario === false) return [];
        return [
          {
            productoId: item.productoId,
            cantidad: item.cantidadRecibida,
            costoUnitario: encontrado?.item.costoUnitario,
            lote: item.lote,
            fechaVencimiento: item.fechaVencimiento,
          },
        ];
      });

    const movimiento: MovimientoInventario = {
      _id: data.idFactory ? data.idFactory() : this.generarId("mov"),
      type: "movimiento_inventario",
      tipo: TipoMovimientoInventarioEnum.ENTRADA,
      estado: EstadoMovimientoEnum.APLICADO,
      origenDocumento: OrigenDocumentoEnum.COMPRA,
      documentoReferenciaId: data.recepcion.id,
      almacenDestinoId: data.recepcion.almacenDestinoId,
      items: movimientoItems,
      usuarioId: data.recepcion.usuarioId,
      fechaMovimiento: data.recepcion.fechaRecepcion,
      createdAt: ahora,
      updatedAt: ahora,
    };

    const compraCompletamenteRecepcionada = (compra: ICompra): boolean =>
      compra.items.every((item) => {
        if (item.afectaInventario === false) return true;
        const asignado = asignadoPorItem.get(item.id) ?? 0;
        return asignado >= item.cantidad;
      });

    const comprasCompletamenteRecepcionadasIds = data.compras
      .filter(compraCompletamenteRecepcionada)
      .map((compra) => compra.id);

    const eventoCompletamenteRecepcionado = data.compras.every(
      compraCompletamenteRecepcionada,
    );

    return {
      movimiento,
      asignaciones: asignacionesNuevas,
      eventoCompletamenteRecepcionado,
      comprasCompletamenteRecepcionadasIds,
    };
  }
}
