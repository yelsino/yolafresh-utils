import { PedidoState } from "@/domain/shared/utils/enums";

  
  
export interface PedidoItem {
    id: string;
    presentacionId: string;
    cantidadSolicitada: number;
    cantidadAtendida: number;
    cantidadCancelada: number;
    precioUnitario: number;
  }

export interface Pedido {
    id: string;
    type: "pedido";
    estado: PedidoState;
    clienteId?: string;
    creadoPorId: string;
    items: PedidoItem[];
    subtotal: number;
    total: number;
    createdAt: Date;
    updatedAt: Date;
  }
