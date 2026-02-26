import { Presentacion } from "@/domain/shared/interfaces/producto";
import { IUsuario } from "@/domain/shared/interfaces/usuario";

export type Hora = {
    hora: string,
    minuto: string,
    periodo: 'AM' | 'PM'
  }
  
export interface Carrito {
    usuario: IUsuario | null,
    items: CarItem[],
    cliente: any | null,
    sucursalId: string,
    fechaEntrega: string,
    horaEntrega: Hora,
    metodoPago: string,
    formaEntrega?: string,
    direccion?: string,
    total: number,
    id: string
}


export interface CarItem {
    id: string,
    producto: Presentacion,
    cantidad: number,
    precioUnitario: number,
    monto?: number,
    subtotal: number,
    notas?: string
}
