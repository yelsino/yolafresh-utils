"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarWhatsAppLink = generarWhatsAppLink;
exports.generarCodigoAmigable = generarCodigoAmigable;
const textos_1 = require("./textos");
const time_1 = require("./time");
function generarWhatsAppLink(carrito) {
    var _a, _b, _c;
    const baseUrl = "https://wa.me/51944844745?text=";
    const listaDeCompras = carrito.items
        .map((item, index) => {
        const nombreProducto = (0, textos_1.capitalizarPrimeraLetra)(item.producto.nombre);
        const cantidad = (0, textos_1.formatCantidad)({ cantidad: item.cantidad, tipoVenta: item.producto.tipoVenta, mayoreo: item.producto.mayoreo, abreviado: true, categoriaId: item.producto.categorieId });
        // const cantidad = formatCantidad(item.cantidad, item.producto.tipoVenta, item.producto.mayoreo, true);
        const monto = (0, textos_1.formatSolesPeruanos)(item.monto);
        return `${index + 1}. *${nombreProducto}:*  ${cantidad} - ${monto}`;
    })
        .join("\n");
    const fechaEntrega = (0, textos_1.formatearFecha)(new Date());
    const horaEntrega = (0, time_1.formatearHora)(carrito.horaEntrega);
    // Verificar si la forma de entrega es "tienda"
    const direccionORecojo = carrito.formaEntrega === "tienda"
        ? `*Recojo de Pedido:* _Recoger en tienda_`
        : `*Dirección de Envío:* _${(_a = carrito === null || carrito === void 0 ? void 0 : carrito.direccion) === null || _a === void 0 ? void 0 : _a.nombre}_`;
    const mensaje = `*Lista de Compras de Vegetales*\n\n${listaDeCompras}\n\n` +
        `*Monto Total: ${(0, textos_1.formatSolesPeruanos)(carrito.total, 'version1')}*\n\n` +
        `*Solicitante:* _${(0, textos_1.capitalizarPrimeraLetra)((_c = (_b = carrito === null || carrito === void 0 ? void 0 : carrito.usuario) === null || _b === void 0 ? void 0 : _b.nombres) !== null && _c !== void 0 ? _c : "")}_\n` +
        `*Fecha:* _${fechaEntrega}_\n` +
        `${direccionORecojo}\n` +
        `*Hora de Entrega:* _${horaEntrega}_\n\n` +
        `*Código de Pedido:* ${"`A0KGF`"}\n` +
        `*Número de Pedido:* ${"`0001`"}\n\n` +
        `> Nota: Este mensaje confirma su ticket de pedido.\n` +
        `> Nota: Su ticket podria ser actualizado.`;
    return baseUrl + encodeURIComponent(mensaje);
}
// letras y números que puedan confundirse entre sí, como "O" y "0", "I" y "1", o "S" y "5".
function generarCodigoAmigable() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluye caracteres confusos
    let codigo = '';
    for (let i = 0; i < 4; i++) {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        codigo += caracteres[indiceAleatorio];
    }
    return codigo.toUpperCase();
}
