import { generarUlid } from "@/domain/shared/utils/dates";
import { EstadoEventoCompraEnum, EventoCompra, CompraItem, EventoCompraItem } from "@/domain/shared/interfaces";


export class EventoCompraFactory {
  private static generarId(prefijo: string): string {
    return generarUlid(prefijo);
  }

  static crearEvento(data: {
    id?: string;
    responsableId: string;
    responsableNombreSnapshot?: string;
    origen: string;
    destino?: string;
    montoAsignado?: number;
    estado?: EstadoEventoCompraEnum;
    createdAt?: number;
    updatedAt?: number;
  }): EventoCompra {
    const ahora = Date.now();
    return {
      id: data.id ?? this.generarId("evt"),
      responsableId: data.responsableId,
      responsableNombreSnapshot: data.responsableNombreSnapshot,
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
    updatedAt?: number;
  }): EventoCompra {
    return {
      ...data.evento,
      ...data.updates,
      updatedAt: data.updatedAt ?? Date.now(),
    };
  }

  static agregarItem(data: {
    evento: EventoCompra;
    items: CompraItem[];
    relaciones: EventoCompraItem[];
    item: CompraItem;
    proveedorId: string;
    relacionId?: string;
    now?: number;
  }): { items: CompraItem[]; relaciones: EventoCompraItem[] } {
    const ahora = data.now ?? Date.now();
    const itemIdRepetido = data.items.some((item) => item.id === data.item.id);
    const itemNuevo = itemIdRepetido
      ? { ...data.item, id: this.generarId("ci") }
      : { ...data.item };
    const relacion: EventoCompraItem = {
      id: data.relacionId ?? this.generarId("eci"),
      eventoCompraId: data.evento.id,
      proveedorId: data.proveedorId,
      compraItemId: itemNuevo.id,
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
  }): EventoCompraItem[] {
    let encontrado = false;
    const relaciones = data.relaciones.map((rel) => {
      if (rel.compraItemId !== data.compraItemId) return rel;
      encontrado = true;
      return {
        ...rel,
        proveedorId: data.proveedorId,
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
    const item = data.items.find((it) => it.id === data.itemId);
    const items = data.items.filter((it) => it.id !== data.itemId);
    const relaciones = item
      ? data.relaciones.filter((rel) => rel.compraItemId !== item.id)
      : data.relaciones;
    if (items.length === data.items.length)
      throw new Error("CompraItem no encontrado");
    return { items, relaciones };
  }
}
