import { Categoria } from "@/interfaces/producto";

export const getUrlProduct = (categorias: Categoria[], urlbase: string, categoriaId: string, productoId: string) => {
  const categoria = categorias.find((v) => v.id === categoriaId);
  if (!categoria) return `/tienda/vegetales`;
  return `${urlbase}/${categoria.nombre}/${productoId}`;
}
