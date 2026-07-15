import {
  PedidoEntregaModalidadEnum,
  PedidoEntregaState,
} from "../../shared/kernel/enums";

export interface PedidoEntregaSeguimiento {
  id: string;
  estado: PedidoEntregaState;
  fecha: Date;
  responsableId?: string;
  observaciones?: string;
}

export interface PedidoEntrega {
  id: string;
  type: "pedido_entrega";
  pedidoId: string;
  estado: PedidoEntregaState;
  modalidad: PedidoEntregaModalidadEnum;
  responsableId?: string;
  fechaProgramada?: Date;
  fechaSalida?: Date;
  fechaEntrega?: Date;
  observaciones?: string;
  historial: PedidoEntregaSeguimiento[];
  createdAt: Date;
  updatedAt: Date;
}
