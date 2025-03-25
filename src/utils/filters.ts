import { CATEGORIAS } from "@/data/categorias";

type ClaveValida = "id" | "nombre" | "tag";
export function searchCategory(clave: ClaveValida, valor: string) {
    return CATEGORIAS.find(item => item[clave] === valor);
}
