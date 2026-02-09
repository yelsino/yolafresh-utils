import { EstadoStockEnum, TipoActualizacionEnum } from "@/utils";
export interface UpdateProducto {
    id: string;
    productoId: string;
    tipoActualizacion: TipoActualizacionEnum;
    precioCompra: number;
    precioVenta: number;
    stock: EstadoStockEnum;
    creacion: Date;
    actualizacion: Date;
}
