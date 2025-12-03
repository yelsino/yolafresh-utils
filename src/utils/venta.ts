import {  capitalizarPrimeraLetra, formatCantidad, formatearFecha, formatSolesPeruanos } from "./textos";

import { Carrito, Hora } from "../interfaces/pedido";
import { IUsuario } from "../interfaces/usuario";
import { Cliente, Personal } from "../interfaces/persons";

/**
 * Obtiene el nombre para mostrar de un usuario
 * Busca en las entidades asociadas para encontrar el nombre
 */
function obtenerNombreUsuario(usuario: IUsuario | null): string {
  if (!usuario || !usuario.entidades || usuario.entidades.length === 0) {
    return "Usuario";
  }

  // Buscar en las entidades una que tenga nombre
  for (const entidad of usuario.entidades) {
    if (entidad.tipoEntidad === "Cliente") {
      const cliente = entidad as Cliente;
      return cliente.nombres + (cliente.apellidos ? ` ${cliente.apellidos}` : '');
    } else if (entidad.tipoEntidad === "Personal") {
      const personal = entidad as Personal;
      return personal.nombres;
    }
  }

  // Fallback al username si no encontramos nombre en las entidades
  return usuario.username || "Usuario";
}


export function generarWhatsAppLink(carrito: Carrito): string {
  const baseUrl = "https://wa.me/51944844745?text=";

  const listaDeCompras = carrito.items
    .map((item, index) => {
      const nombreProducto = capitalizarPrimeraLetra(item.producto.nombre);
      const cantidad = formatCantidad({ 
        cantidad: item.cantidad, 
        tipoVenta: item.producto.tipoVenta, 
        unidadMedida: item.producto.unidadMedida,
        mayoreo: item.producto.mayoreo, 
        abreviado: true, 
        categoriaId: item.producto.categorieId 
      });
      // const cantidad = formatCantidad(item.cantidad, item.producto.tipoVenta, item.producto.mayoreo, true);
      const monto = formatSolesPeruanos(item.monto);
      return `${index + 1}. *${nombreProducto}:*  ${cantidad} - ${monto}`;
    })
    .join("\n");

  const fechaEntrega = formatearFecha(new Date());
  const horaEntrega = formatearHora(carrito.horaEntrega);

  // Verificar si la forma de entrega es "tienda"
  const direccionORecojo = carrito.formaEntrega === "tienda"
    ? `*Recojo de Pedido:* _Recoger en tienda_`
    : `*Dirección de Envío:* _${carrito?.direccion?.nombre}_`;

  const mensaje = `*Lista de Compras de Vegetales*\n\n${listaDeCompras}\n\n` +
    `*Monto Total: ${formatSolesPeruanos(carrito.total, 'version1')}*\n\n` +
    `*Solicitante:* _${capitalizarPrimeraLetra(obtenerNombreUsuario(carrito?.usuario))}_\n` +
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
export function generarCodigoAmigable(): string {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluye caracteres confusos
  let codigo = '';
  for (let i = 0; i < 4; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres[indiceAleatorio];
  }
  return codigo.toUpperCase();
}

export function formatearHora(horaObj: Hora): string {
  const { hora, minuto, periodo } = horaObj;

  // Asegurarse de que la hora siempre tenga dos dígitos
  const horaFormateada = hora.padStart(2, '0');

  // Asegurarse de que los minutos siempre tengan dos dígitos
  const minutoFormateado = minuto.padStart(2, '0');

  return `${horaFormateada}:${minutoFormateado} ${periodo}`;
}
