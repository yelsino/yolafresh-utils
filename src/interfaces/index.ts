import { OrderState } from "@utils/enums";
import { TipoVentaEnum } from "@utils/enums";

export interface Producto {
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
  stock: string;
  precioCompra: number;
  precioVenta: number;
}

export interface UpdateProducto {
  id: string;
  productoId: string;
  tipoActualizacion: string;
  precioCompra: number;
  precioVenta: number;
  stock: string;
  creacion: Date;
  actualizacion: Date;
}

export interface User {
  email: string
}

export interface Usuario {
  id: string;
  email: string;
  rol: string;
  nombres: string;
  apellidos?: string;
  telefono?: string;
  correo?: string;
  celular: string;
  foto: string;
  tipoDocumento: string;
  document: string;
  idExterno: string;
}

export interface Categoria {
  id: string
  nombre: string
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
  productos?: Producto[]
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

export interface IntemList {
  nombre: string;
  cantidad: number;
  medida: string;
  productId: number;
}

export interface ItemCarDB {
  id: string
  carritoId: string
  productoId: string
}

export interface ItemCar {
  producto: Producto
  cantidad: number // peso
  monto: number
  detalle: string[]
}

export interface Direccion {
  id: string
  nombre: string
  coordenadas: string
  referencia: string;
  latitud?: number;
  longitud?: number;
}

// type FormaEntrega = 'tienda' | 'ubicación'
export type Hora = {
  hora: string,
  minuto: string,
  periodo: 'AM' | 'PM'
}

export interface Carrito {
  usuario: Usuario | null,
  direccion: Direccion | null,
  items: ItemCar[]
  cantidad: number
  subTotal: number
  envio: number
  total: number
  formaEntrega: 'tienda' | 'ubicación',
  horaEntrega: Hora,
  // estado: 'creacion' | 'actualizacion'
  pedidoId: string
}

export interface Register {
  tipoRegistro: string,
  telefono: string,
  email: string,
  nombres: string
  password: string
}

export interface Pedido {
  id: string;
  fechaEntrega: Date;
  estado: OrderState
  datosPedido: Carrito;
  numeroPedido: number;
  porcentajeDescuento: number;
  subTotal: number;
  total: number;
  codigo: string;
  costoEnvio: number;
  usuarioId: string;
  creacion?: Date;
  actualizacion?: Date
}

export type Tipo = "con_precio" | "sin_precio";

export interface ItemLista {
  id: string;
  nombre: string;
  imagen: string;
  cantidad: number;
  medida: string;
  precio: number;
  total: number;
  tipo: Tipo;
}

export interface Lista {
  id: string,
  nombre: string,
  items: ItemLista[],
  total: number,
  creacion: Date,
  actualizacion: Date,
}

export interface UserCaracteristicProduct {
  productoId: string,
  caracteristics: string[]
}

export type SendEmail =
  | 'ORDER_CREATED'
  | 'ORDER_EDITED'
  | 'ORDER_DISPATCHED'
  | 'ORDER_CANCELED'
  | 'REGISTER_EMAIL'
  | 'REGISTER_MOVILE'
