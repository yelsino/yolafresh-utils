import { IProducto, ImageSizes } from "@/interfaces/producto";
import { OrderState } from "./enums";
import { TipoVentaEnum } from "../interfaces/producto";
import { Carrito, Lista, Pedido } from "@/interfaces/pedido";



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
  return {
    id: pedido.id,
    fechaEntrega: new Date(pedido.fechaEntrega),
    estado: pedido.estado as OrderState, // 
    datosPedido: pedido.datosPedido as Carrito,
    numeroPedido: pedido.numeroPedido,
    porcentajeDescuento: pedido.porcentajeDescuento,
    subTotal: pedido.subTotal,
    total: pedido.total,
    codigo: pedido.codigo,
    costoEnvio: pedido.costoEnvio,
    usuarioId: pedido.usuarioId,
    creacion: pedido.creacion,
    actualizacion: pedido.actualizacion
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