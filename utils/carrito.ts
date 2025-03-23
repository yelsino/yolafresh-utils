import type { Direccion, Usuario } from "src/interfaces";
import { carrito } from "src/store/tienda";

export function actualizarCarrito(event: Event) {

  const target = event.target as HTMLInputElement | HTMLTextAreaElement;

  const dataCarrito = carrito.get()
  if (target.name === "nombres") {
    carrito.set({
      ...carrito.get(),
      usuario: { ...dataCarrito.usuario, nombres: target.value } as Usuario,
    });
  } else if (target.name === "referencia") {
    carrito.set({
      ...dataCarrito,
      direccion: {
        ...dataCarrito.direccion,
        referencia: target.value,
      } as Direccion,
    });
  } else if (target.name === "movil") {
    carrito.set({
      ...dataCarrito,
      usuario: { ...dataCarrito.usuario, celular: target.value } as Usuario,
    });
  }
}