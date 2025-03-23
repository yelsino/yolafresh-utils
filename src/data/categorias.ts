export interface Categoria {
  id: string;
  nombre: string;
  tag: string;
  [key: string]: any;
}

export const CATEGORIAS: Categoria[] = [
  {
    id: "1",
    nombre: "verduras",
    tag: "verdura"
  },
  {
    id: "2",
    nombre: "frutas",
    tag: "fruta"
  },
  {
    id: "3",
    nombre: "tuberculos",
    tag: "tuberculo"
  }
];
