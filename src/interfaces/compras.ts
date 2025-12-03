import { TipoVentaEnum } from "./producto";

type EstadoCompra = 'pendiente' | 'completado' | 'cancelado';
export enum Procedencia { LOCAL = 'LOCAL', SATIPO = 'SATIPO', TARMA = 'TARMA', LIMA = 'LIMA' };

export interface ListaCompras {
    id: string;
    nombre: string; // Nombre de la lista de compras
    usuarioId: string; // Quién hizo la compra
    totalCosto: number; // Suma total de compras en esta lista
    estado: EstadoCompra;
    procedencia: string; // Origen de la compra
    creacion: Date;
    actualizacion: Date;
  }
  
  export interface RegistroCompra {
    id: string;
    listaId: string; 
    productoId: string; // Producto comprado
    cantidad: number; // Cantidad comprada
    pack: string; // Tipo de envoltura (saco, caja, unidad)
    unidadXpack: number; // Unidades por envoltura (Ej: 60 kg en un saco)
    medida: TipoVentaEnum;
    total: number; // Total pagado por este producto
    costoMayoreo: number; // Costo por cada pack (Ej: costo del saco o caja)
    costoMinoreo: number; // Costo unitario (Ej: por kg o unidad)
    margen: number; // Margen de ganancia (%)
    precioFinal: number; // Precio de venta unitario
  }