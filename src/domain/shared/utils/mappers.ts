import { ImageSizes } from "@/interfaces/producto";
import { PedidoState } from "./enums";
import type { Pedido } from "@/interfaces/pedido";
import type { Carrito, Lista } from "@/interfaces/pedido.legacy";



function isValidProductImage(val: unknown): val is ImageSizes {
  if (typeof val !== 'object' || val === null) return false;
  const obj = val as Record<string, unknown>;
  const baseOk = typeof obj.base === 'string';
  const sizes = obj.sizes as Record<string, unknown> | undefined;
  const sizesOk = !!sizes && typeof sizes.small === 'string' && typeof sizes.medium === 'string' && typeof sizes.large === 'string';
  return baseOk && sizesOk;
}

function toProductImage(val: ImageSizes | string | undefined): ImageSizes {
  if (typeof val === 'string') {
    return { base: val, sizes: { small: val, medium: val, large: val } };
  }
  if (isValidProductImage(val)) {
    return val;
  }
  return { base: '', sizes: { small: '', medium: '', large: '' } };
}

export function pedidodbToPedido(pedido: any): Pedido {
  const carrito = (pedido.datosPedido || {}) as Carrito;
  const items = Array.isArray(carrito.items)
    ? carrito.items.map((item, index) => {
        const presentacionId = String(item?.producto?.id || "").trim();
        const cantidadSolicitada = Number(item?.cantidad || 0);
        const monto = Number(item?.monto || 0);
        const precioUnitario =
          cantidadSolicitada > 0 ? monto / cantidadSolicitada : 0;

        return {
          id: `${pedido.id || "pedido"}-item-${index + 1}`,
          presentacionId,
          cantidadSolicitada,
          cantidadAtendida: 0,
          cantidadCancelada: 0,
          precioUnitario,
        };
      })
    : [];

  return {
    id: pedido.id,
    type: "pedido",
    estado: pedido.estado as PedidoState,
    clienteId: carrito.usuario?.id,
    creadoPorId: pedido.usuarioId,
    items,
    subtotal: pedido.subTotal,
    total: pedido.total,
    createdAt: pedido.creacion ? new Date(pedido.creacion) : new Date(),
    updatedAt: pedido.actualizacion ? new Date(pedido.actualizacion) : new Date(),
  };
}

export function carritoSchematoCarrito(carrito: any): Carrito {
  return {
    usuario: carrito.usuario || null,
    direccion: carrito.direccion || null,
    items: carrito.items || [],
    cantidad: carrito.cantidad || 0,
    subTotal: carrito.subTotal || 0,
    envio: carrito.envio || 0,
    total: carrito.total || 0,
    formaEntrega: carrito.formaEntrega || 'tienda',
    horaEntrega: carrito.horaEntrega || { hora: '', minuto: '', periodo: 'AM' },
    pedidoId: carrito.pedidoId
  };
}

export function listaDbToLista(lista: any): Lista {
  // console.log(lista);

  return {
    actualizacion: lista.actualizacion,
    creacion: lista.creacion,
    id: lista.id,
    items: lista.items,
    nombre: lista.nombre,
    total: lista.total,
  }
}
