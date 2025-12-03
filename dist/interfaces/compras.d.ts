import { TipoVentaEnum } from "./producto";
type EstadoCompra = 'pendiente' | 'completado' | 'cancelado';
export declare enum Procedencia {
    LOCAL = "LOCAL",
    SATIPO = "SATIPO",
    TARMA = "TARMA",
    LIMA = "LIMA"
}
export interface ListaCompras {
    id: string;
    nombre: string;
    usuarioId: string;
    totalCosto: number;
    estado: EstadoCompra;
    procedencia: string;
    creacion: Date;
    actualizacion: Date;
}
export interface RegistroCompra {
    id: string;
    listaId: string;
    productoId: string;
    cantidad: number;
    pack: string;
    unidadXpack: number;
    medida: TipoVentaEnum;
    total: number;
    costoMayoreo: number;
    costoMinoreo: number;
    margen: number;
    precioFinal: number;
}
export {};
