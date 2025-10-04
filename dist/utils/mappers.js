"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidodbToPedido = pedidodbToPedido;
exports.carritoSchematoCarrito = carritoSchematoCarrito;
exports.listaDbToLista = listaDbToLista;
function isValidProductImage(val) {
    if (typeof val !== 'object' || val === null)
        return false;
    const obj = val;
    const baseOk = typeof obj.base === 'string';
    const sizes = obj.sizes;
    const sizesOk = !!sizes && typeof sizes.small === 'string' && typeof sizes.medium === 'string' && typeof sizes.large === 'string';
    return baseOk && sizesOk;
}
function toProductImage(val) {
    if (typeof val === 'string') {
        return { base: val, sizes: { small: val, medium: val, large: val } };
    }
    if (isValidProductImage(val)) {
        return val;
    }
    return { base: '', sizes: { small: '', medium: '', large: '' } };
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
