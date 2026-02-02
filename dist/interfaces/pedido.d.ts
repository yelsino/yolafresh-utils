import { OrderState } from "../utils/enums";
import { IProducto } from "./producto";
import { IUsuario } from "./usuario";
export type Hora = {
    hora: string;
    minuto: string;
    periodo: 'AM' | 'PM';
};
export interface Carrito {
    usuario: IUsuario | null;
    direccion: Direccion | null;
    items: ItemCar[];
    cantidad: number;
    subTotal: number;
    envio: number;
    total: number;
    formaEntrega: 'tienda' | 'ubicación';
    horaEntrega: Hora;
    pedidoId: string;
}
export interface IntemList {
    nombre: string;
    cantidad: number;
    medida: string;
    productId: number;
}
export interface ItemCarDB {
    id: string;
    carritoId: string;
    productoId: string;
}
export interface ItemCar {
    producto: IProducto;
    cantidad: number;
    monto: number;
    detalle: string[];
}
export interface Direccion {
    id: string;
    nombre: string;
    coordenadas: string;
    referencia: string;
    latitud?: number;
    longitud?: number;
}
export interface Register {
    tipoRegistro: string;
    telefono: string;
    email: string;
    nombres: string;
    password: string;
}
export interface Pedido {
    id: string;
    fechaEntrega: Date;
    estado: OrderState;
    datosPedido: Carrito;
    numeroPedido: number;
    porcentajeDescuento: number;
    subTotal: number;
    total: number;
    codigo: string;
    costoEnvio: number;
    usuarioId: string;
    creacion?: Date;
    actualizacion?: Date;
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
    id: string;
    nombre: string;
    items: ItemLista[];
    total: number;
    creacion: Date;
    actualizacion: Date;
}
export interface UserCaracteristicProduct {
    productoId: string;
    caracteristics: string[];
}
export type SendEmail = 'ORDER_CREATED' | 'ORDER_EDITED' | 'ORDER_DISPATCHED' | 'ORDER_CANCELED' | 'REGISTER_EMAIL' | 'REGISTER_MOVILE';
