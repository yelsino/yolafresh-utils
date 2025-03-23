import { CARACTERISTICAS } from "@data/caracteristicas";
import { Categoria } from "@interfaces/index";

export const getUrlProduct = (categorias: Categoria[], urlbase: string, categoriaId: string, productoId: string) => {
  const categoria = categorias.find((v) => v.id === categoriaId);
  if (!categoria) return `/tienda/vegetales`;
  return `${urlbase}/${categoria.nombre}/${productoId}`;
}

export const obtenerCaracteristicas = (productoConsideraciones: string): string[] => {
  const dataCaractersiticas: any = CARACTERISTICAS;
  const categorias = productoConsideraciones.split(",");
  let caracteristicas: string[] = [];

  for (const categoria of categorias) {
    const items = dataCaractersiticas[categoria];
    if (items) {
      caracteristicas = caracteristicas.concat(items);
    }
  }

  // Eliminar duplicados utilizando un Set
  return [...new Set(caracteristicas)];
};