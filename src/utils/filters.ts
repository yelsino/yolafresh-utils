import { CATEGORIAS, Categoria } from "@data/categorias";

type ClaveValida = "id" | "nombre" | "tag";
export function searchCategory(clave: ClaveValida, valor: string): Categoria | undefined {
    return CATEGORIAS.find(item => item[clave] === valor);
}
