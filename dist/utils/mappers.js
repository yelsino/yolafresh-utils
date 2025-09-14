"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productodbToProducto = productodbToProducto;
exports.pedidodbToPedido = pedidodbToPedido;
exports.carritoSchematoCarrito = carritoSchematoCarrito;
exports.listaDbToLista = listaDbToLista;
function productodbToProducto(producto) {
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
        tipoVenta: producto.tipoVenta,
        fraccionable: producto.fraccionable,
        titulo: producto.titulo,
        descripcion: producto.descripcion,
        peso: producto.peso,
        createdAt: producto.createdAt ? new Date(producto.createdAt) : undefined,
        consideraciones: producto.consideraciones,
        caracteristicas: producto.caracteristicas,
        updatedAt: producto.updatedAt ? new Date(producto.updatedAt) : undefined,
        precioCompra: producto.precioCompra,
        stock: producto.stock
    };
}
function pedidodbToPedido(pedido) {
    return {
        id: pedido.id,
        fechaEntrega: new Date(pedido.fechaEntrega),
        estado: pedido.estado, // 
        datosPedido: pedido.datosPedido,
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
function carritoSchematoCarrito(carrito) {
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
function listaDbToLista(lista) {
    // console.log(lista);
    return {
        actualizacion: lista.actualizacion,
        creacion: lista.creacion,
        id: lista.id,
        items: lista.items,
        nombre: lista.nombre,
        total: lista.total,
    };
}
