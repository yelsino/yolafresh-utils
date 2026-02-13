import {
  CompraItem,
  EventoCompra,
  EventoCompraItem,
  EstadoEventoCompraEnum,
} from "@/interfaces";

export class EventoCompraBuilder {
  private static generarId(prefijo: string): string {
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  static crearEvento(data: {
    id?: string;
    responsableId: string;
    responsableNombre?: string;
    origen: string;
    destino?: string;
    montoAsignado?: number;
    estado?: EstadoEventoCompraEnum;
    createdAt?: Date;
    updatedAt?: Date;
  }): EventoCompra {
    const ahora = new Date();
    return {
      id: data.id ?? this.generarId("evt"),
      responsableId: data.responsableId,
      responsableNombre: data.responsableNombre,
      origen: data.origen,
      destino: data.destino,
      montoAsignado: data.montoAsignado,
      estado: data.estado ?? EstadoEventoCompraEnum.EN_REGISTRO,
      createdAt: data.createdAt ?? ahora,
      updatedAt: data.updatedAt ?? ahora,
    };
  }

  static actualizarEvento(data: {
    evento: EventoCompra;
    updates: Partial<Omit<EventoCompra, "id" | "createdAt">>;
    updatedAt?: Date;
  }): EventoCompra {
    return {
      ...data.evento,
      ...data.updates,
      updatedAt: data.updatedAt ?? new Date(),
    };
  }

  static agregarItem(data: {
    evento: EventoCompra;
    items: CompraItem[];
    relaciones: EventoCompraItem[];
    item: CompraItem;
    proveedorId: string;
    relacionId?: string;
    now?: Date;
  }): { items: CompraItem[]; relaciones: EventoCompraItem[] } {
    const ahora = data.now ?? new Date();
    const itemIdRepetido = data.items.some((item) => item.id === data.item.id);
    const itemNuevo = itemIdRepetido
      ? { ...data.item, id: this.generarId("ci") }
      : { ...data.item };
    const relacion: EventoCompraItem = {
      id: data.relacionId ?? this.generarId("eci"),
      eventoCompraId: data.evento.id,
      proveedorId: data.proveedorId,
      compraItemId: itemNuevo.id,
      createdAt: ahora,
      updatedAt: ahora,
    };
    return {
      items: [...data.items, itemNuevo],
      relaciones: [...data.relaciones, relacion],
    };
  }

  static actualizarItem(data: {
    items: CompraItem[];
    itemId: string;
    updates: Partial<CompraItem>;
  }): CompraItem[] {
    let encontrado = false;
    const items = data.items.map((item) => {
      if (item.id !== data.itemId) return item;
      encontrado = true;
      return { ...item, ...data.updates };
    });
    if (!encontrado) throw new Error("CompraItem no encontrado");
    return items;
  }

  static actualizarProveedorItem(data: {
    relaciones: EventoCompraItem[];
    compraItemId: string;
    proveedorId: string;
    updatedAt?: Date;
  }): EventoCompraItem[] {
    let encontrado = false;
    const relaciones = data.relaciones.map((rel) => {
      if (rel.compraItemId !== data.compraItemId) return rel;
      encontrado = true;
      return {
        ...rel,
        proveedorId: data.proveedorId,
        updatedAt: data.updatedAt ?? new Date(),
      };
    });
    if (!encontrado) throw new Error("Relación de proveedor no encontrada");
    return relaciones;
  }

  static removerItem(data: {
    items: CompraItem[];
    relaciones: EventoCompraItem[];
    itemId: string;
  }): { items: CompraItem[]; relaciones: EventoCompraItem[] } {
    const items = data.items.filter((item) => item.id !== data.itemId);
    const relaciones = data.relaciones.filter(
      (rel) => rel.compraItemId !== data.itemId,
    );
    if (items.length === data.items.length)
      throw new Error("CompraItem no encontrado");
    return { items, relaciones };
  }
}
