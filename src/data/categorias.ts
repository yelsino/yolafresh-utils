import { Categoria } from '../interfaces/producto';

export const CATEGORIAS: Categoria[] = [
  {
    id: "1",
    nombre: "verduras",
    tag: "verdura",
    descripcion: "verduras",
    icono: "verdura",
    color: "verdura",
    orden: 1,
    activa: true,
    fechaCreacion: "2021-01-01",
    subcategorias: [],
    imagen: "verdura"
  },
  {
    id: "2",
    nombre: "frutas",
    tag: "fruta",
    descripcion: "frutas",
    icono: "fruta",
    color: "fruta",
    orden: 2,
    activa: true,
    fechaCreacion: "2021-01-01",
    subcategorias: [],
    imagen: "fruta"
  },
  {
    id: "3",
    nombre: "tuberculos",
    tag: "tuberculo",
    descripcion: "tuberculos",
    icono: "tuberculo",
    color: "tuberculo",
    orden: 3,
    activa: true,
    fechaCreacion: "2021-01-01",
    subcategorias: [],
    imagen: "tuberculo"
  }
];
