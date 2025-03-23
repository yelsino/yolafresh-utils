import { Categoria } from "../data/categorias";
type ClaveValida = "id" | "nombre" | "tag";
export declare function searchCategory(clave: ClaveValida, valor: string): Categoria | undefined;
export {};
