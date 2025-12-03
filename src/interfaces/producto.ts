import { EstadoStockEnum } from "@/utils/enums";

export type ImageSizes = {
  base: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
};

export enum TipoEmpaqueEnum {
  Lata = "lata",
  Bolsa = "bolsa",
  Caja = "caja",
  Botella = "botella",
  Paquete = "paquete",
  Frasco = "frasco",
  Saco = "saco",
  TetraPack = "tetrapack",
  SinEmpaque = "sin_empaque",
}

export enum UnidadMedidaEnum {
  Unidad = "unidad",
  Gramo = "g",
  Kilogramo = "kg",
  Mililitro = "ml",
  Litro = "l",
  Libra = "lb",
  Onza = "oz",
}

export enum TipoVentaEnum {
  Unidad = "unidad", // precio por 1 unidad
  Peso = "peso", // precio por kg, g, lb (según unidadMedida)
  Volumen = "volumen", // precio por litro o ml (según unidadMedida)
  Paquete = "paquete", // precio por paquete
  Docena = "docena", // precio por 12 unidades
  SixPack = "sixpack", // precio por 6 unidades
  Caja = "caja", // precio por caja cerrada
}

export interface IProducto {
  id: string;
  idPrimario: string;
  mayoreo: boolean;
  cantidadParaDescuento: number;
  descuentoXCantidad: number;
  nombre: string;
  precio: number;
  status: boolean;
  url: ImageSizes;
  categorieId: string;
  esPrimario: boolean;
  fraccionable: boolean;
  titulo: string;
  consideraciones: string;
  caracteristicas: string;
  descripcion: string;
  peso: number;
  createdAt: Date;
  updatedAt: Date;
  stock: EstadoStockEnum;
  precioCompra: number;

  tipoVenta: TipoVentaEnum;
  // modificacion
  unidadMedida: string;
  tipoEmpaque: TipoEmpaqueEnum;
}

export interface Categoria {
  id: string;
  nombre: string;
  tag: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
  subcategorias: string[];
  imagen: ImageSizes;
}

export interface BeneficiosProducto {
  id: string;
  title: string;
  descripcion: string;
  productoId: string;
}

export interface UsosCulinariosProducto {
  id: string;
  title: string;
  descripcion: string;
  productoId: string;
}

export interface Receta {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  url: string;
  productos?: IProducto[];
}

export interface RecetasProducto {
  id: string;
  recetaId: string;
  productoId: string;
}

export interface ProductosSubCategoria {
  id: string;
  productoId: string;
  subcategoriaId: string;
}
