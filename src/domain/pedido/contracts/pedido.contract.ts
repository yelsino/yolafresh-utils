import {
  PedidoPrioridadEnum,
  PedidoProcedenciaEnum,
  PedidoState,
} from "../../shared/kernel/enums";

export interface PedidoItem {
  id: string;
  presentacionId: string;
  cantidadSolicitada: number;
  cantidadAtendida: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  type: "pedido";
  codigoPedido: string;
  estado: PedidoState;
  prioridad: PedidoPrioridadEnum;
  procedencia?: PedidoProcedenciaEnum;
  clienteId?: string;
  responsableId?: string;
  creadoPorId: string;
  ventaId?: string;
  fechaPedido: Date;
  fechaProgramada?: Date;
  fechaVencimiento?: Date;
  observaciones?: string;
  items: PedidoItem[];
  subtotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
