import { Carrito, Lista, Pedido, Producto } from "@interfaces/index";
import type { OrderState, TipoVentaEnum } from "@utils/enums";

export function productodbToProducto(producto: any): Producto {
  return {
    id: producto.id,
    idPrimario: producto.idPrimario,
    mayoreo: producto.mayoreo,
    cantidadParaDescuento: producto.cantidadParaDescuento,
    descuentoXCantidad: producto.descuentoXCantidad,
    nombre: producto.nombre,
    precio: producto.precio,
    status: producto.status,
    url: producto.url,
    categorieId: producto.categorieId,
    esPrimario: producto.esPrimario,
    tipoVenta: producto.tipoVenta as TipoVentaEnum,
    fraccionable: producto.fraccionable,
    titulo: producto.titulo,
    descripcion: producto.descripcion,
    peso: producto.peso,
    creacion: producto.creacion ? new Date(producto.creacion) : undefined,
    consideraciones: producto.consideraciones,
    caracteristicas: producto.caracteristicas,
    actualizacion: producto.actualizacion ? new Date(producto.actualizacion) : undefined,
    stock: producto.stock || '0',
    precioCompra: producto.precioCompra || 0,
  };
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