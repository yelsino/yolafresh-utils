"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarCarrito = actualizarCarrito;
const tienda_1 = require("src/store/tienda");
function actualizarCarrito(event) {
    const target = event.target;
    const dataCarrito = tienda_1.carrito.get();
    if (target.name === "nombres") {
        tienda_1.carrito.set({
            ...tienda_1.carrito.get(),
            usuario: { ...dataCarrito.usuario, nombres: target.value },
        });
    }
    else if (target.name === "referencia") {
        tienda_1.carrito.set({
            ...dataCarrito,
            direccion: {
                ...dataCarrito.direccion,
                referencia: target.value,
            },
        });
    }
    else if (target.name === "movil") {
        tienda_1.carrito.set({
            ...dataCarrito,
            usuario: { ...dataCarrito.usuario, celular: target.value },
        });
    }
}
