import type { DineroRestaurante, TrazaOperacionRestaurante } from "./common.contract";
import type { ModificadorSeleccionadoRestaurante } from "./menu.contract";
import type { CanalServicioRestaurante } from "./service.contract";

export interface ComandoRestauranteBase<TNombre extends string, TPayload> {
  nombre: TNombre;
  aggregateId: string;
  expectedVersion: number;
  dependsOnOperationIds?: string[];
  trace: TrazaOperacionRestaurante;
  payload: TPayload;
}

/** Protocolo semantico durable del flujo operativo gastronomico. */
export type ComandoRestaurante =
  | ComandoRestauranteBase<
      "OPEN_SERVICE_SESSION",
      {
        localId: string;
        canal: CanalServicioRestaurante;
        mesaId?: string;
        expectedMesaVersion?: number;
        alias?: string;
        cantidadComensales: number;
        responsableId: string;
        pedidoId: string;
        cuentaConsumoId: string;
      }
    >
  | ComandoRestauranteBase<
      "TRANSFER_SERVICE_SESSION",
      {
        mesaOrigenId: string;
        expectedMesaOrigenVersion: number;
        mesaDestinoId: string;
        expectedMesaDestinoVersion: number;
        responsableId?: string;
        motivo?: string;
      }
    >
  | ComandoRestauranteBase<
      "ABANDON_SERVICE_SESSION",
      {
        mesaId: string;
        expectedMesaVersion: number;
        pedidoId: string;
        expectedPedidoVersion: number;
        cuentaConsumoId: string;
        expectedCuentaVersion: number;
        motivo: string;
      }
    >
  | ComandoRestauranteBase<
      "RELEASE_COMPLETED_TABLE",
      {
        mesaId: string;
        expectedMesaVersion: number;
        sesionServicioId: string;
        expectedSessionVersion: number;
        pedidoId: string;
        expectedPedidoVersion: number;
        cuentaConsumoId: string;
        expectedAccountVersion: number;
      }
    >
  | ComandoRestauranteBase<
      "ADD_ORDER_LINE",
      {
        lineId: string;
        productoRestauranteId: string;
        cantidad: number;
        modificadores: ModificadorSeleccionadoRestaurante[];
        instrucciones?: string;
        asiento?: number;
        curso?: number;
      }
    >
  | ComandoRestauranteBase<
      "UPDATE_UNSENT_ORDER_LINE",
      {
        lineId: string;
        cantidad: number;
        modificadores: ModificadorSeleccionadoRestaurante[];
        instrucciones?: string;
        asiento?: number;
        curso?: number;
      }
    >
  | ComandoRestauranteBase<
      "REMOVE_UNSENT_ORDER_LINE",
      { lineId: string; motivo?: string }
    >
  | ComandoRestauranteBase<
      "SEND_ORDER_ROUND",
      {
        ronda: number;
        lineQuantities: Array<{
          pedidoLineaId: string;
          cantidad: number;
        }>;
      }
    >
  | ComandoRestauranteBase<
      | "START_PREPARATION"
      | "QUEUE_PREPARATION"
      | "MARK_PREPARATION_READY"
      | "MARK_PREPARATION_DELIVERED"
      | "HOLD_PREPARATION",
      { responsableId?: string; motivo?: string }
    >
  | ComandoRestauranteBase<
      "CANCEL_PREPARATION" | "REFIRE_PREPARATION",
      { cantidad: number; motivo: string; autorizadaPor?: string }
    >
  | ComandoRestauranteBase<
      "APPLY_ACCOUNT_PAYMENT",
      { allocationId: string; pagoId: string; monto: DineroRestaurante }
    >
  | ComandoRestauranteBase<
      "CLOSE_CONSUMPTION_ACCOUNT",
      { ventaId: string }
    >;

export type NombreComandoRestaurante = ComandoRestaurante["nombre"];
export type PayloadComandoRestaurante<TNombre extends NombreComandoRestaurante> =
  Extract<ComandoRestaurante, { nombre: TNombre }>["payload"];
