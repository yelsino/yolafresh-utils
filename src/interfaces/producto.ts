import { EstadoStockEnum, TipoActualizacionEnum, TipoVentaEnum } from "@/utils/enums";

export interface IProducto {
    id: string;
    idPrimario: string;
    mayoreo: boolean;
    cantidadParaDescuento: number;
    descuentoXCantidad: number;
    nombre: string;
    precio: number;
    status: boolean;
    url: string;
    categorieId: string;
    esPrimario: boolean
    tipoVenta: TipoVentaEnum;
    fraccionable: boolean;
    titulo: string;
    consideraciones: string;
    caracteristicas: string;
    descripcion: string
    peso: string;
    creacion?: Date;
    actualizacion?: Date;
    stock: EstadoStockEnum;
    precioCompra: number;
  }
  


  export interface Categoria {
    id: string;
    nombre: string;
    tag?: string;
    [key: string]: any;
  }


  
export interface BeneficiosProducto {
    id: string,
    title: string,
    descripcion: string,
    productoId: string
  }
  
  export interface UsosCulinariosProducto {
    id: string
    title: string
    descripcion: string
    productoId: string
  }
  
  export interface Receta {
    id: string
    nombre: string
    descripcion: string
    imagen: string
    url: string
    productos?: IProducto[]
  }
  
  export interface RecetasProducto {
    id: string
    recetaId: string
    productoId: string
  }
  
  export interface ProductosSubCategoria {
    id: string
    productoId: string
    subcategoriaId: string
  }

  