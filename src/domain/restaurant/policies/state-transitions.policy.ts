import type { EstadoCuentaConsumoRestaurante } from "../contracts/account.contract";
import type {
  EstadoTareaPreparacionRestaurante,
  TareaPreparacionRestaurante,
} from "../contracts/preparation.contract";
import type {
  EstadoPedidoRestaurante,
  EstadoSesionRestaurante,
} from "../contracts/service.contract";
import type { ModoPreparacionRestaurante } from "../contracts/menu.contract";
import {
  MODO_OPERACION_ESTACION_RESTAURANTE,
  type ModoOperacionEstacionRestaurante,
} from "../contracts/configuration.contract";

const SESSION_TRANSITIONS: Record<
  EstadoSesionRestaurante,
  readonly EstadoSesionRestaurante[]
> = {
  PLANIFICADA: ["ABIERTA", "CANCELADA"],
  ABIERTA: ["EN_ATENCION", "SOLICITA_CIERRE", "CANCELADA", "ABANDONADA"],
  EN_ATENCION: ["SOLICITA_CIERRE", "CANCELADA", "ABANDONADA"],
  SOLICITA_CIERRE: ["EN_ATENCION", "CERRADA"],
  CERRADA: [],
  CANCELADA: [],
  ABANDONADA: [],
};

const ORDER_TRANSITIONS: Record<
  EstadoPedidoRestaurante,
  readonly EstadoPedidoRestaurante[]
> = {
  BORRADOR: ["ABIERTO", "CANCELADO"],
  ABIERTO: ["PARCIALMENTE_ENVIADO", "ENVIADO", "CANCELADO"],
  PARCIALMENTE_ENVIADO: ["ENVIADO", "COMPLETADO", "CANCELADO"],
  ENVIADO: ["COMPLETADO", "CANCELADO"],
  COMPLETADO: [],
  CANCELADO: [],
};

const PREPARATION_TRANSITIONS: Record<
  EstadoTareaPreparacionRestaurante,
  readonly EstadoTareaPreparacionRestaurante[]
> = {
  PENDIENTE: ["EN_COLA", "LISTA", "RETENIDA", "CANCELADA"],
  EN_COLA: ["EN_PREPARACION", "RETENIDA", "CANCELADA"],
  EN_PREPARACION: ["LISTA", "RETENIDA", "CANCELADA", "DESCARTADA"],
  RETENIDA: ["EN_COLA", "EN_PREPARACION", "CANCELADA"],
  LISTA: ["ENTREGADA", "DESCARTADA"],
  ENTREGADA: [],
  GESTION_EXTERNA: ["ENTREGADA"],
  CANCELADA: [],
  DESCARTADA: [],
};

const ACCOUNT_TRANSITIONS: Record<
  EstadoCuentaConsumoRestaurante,
  readonly EstadoCuentaConsumoRestaurante[]
> = {
  ABIERTA: ["PARCIALMENTE_PAGADA", "SALDADA", "ANULADA", "EN_DISPUTA"],
  PARCIALMENTE_PAGADA: ["SALDADA", "EN_DISPUTA"],
  SALDADA: ["CERRADA", "EN_DISPUTA"],
  CERRADA: [],
  ANULADA: [],
  EN_DISPUTA: ["ABIERTA", "PARCIALMENTE_PAGADA", "SALDADA"],
};

export const puedeTransicionarSesionRestaurante = (
  from: EstadoSesionRestaurante,
  to: EstadoSesionRestaurante,
): boolean => SESSION_TRANSITIONS[from].includes(to);

export const puedeTransicionarPedidoRestaurante = (
  from: EstadoPedidoRestaurante,
  to: EstadoPedidoRestaurante,
): boolean => ORDER_TRANSITIONS[from].includes(to);

export const puedeTransicionarTareaPreparacionRestaurante = (
  from: EstadoTareaPreparacionRestaurante,
  to: EstadoTareaPreparacionRestaurante,
): boolean => PREPARATION_TRANSITIONS[from].includes(to);

export const puedeTransicionarCuentaRestaurante = (
  from: EstadoCuentaConsumoRestaurante,
  to: EstadoCuentaConsumoRestaurante,
): boolean => ACCOUNT_TRANSITIONS[from].includes(to);

export const estadoInicialTareaPreparacionRestaurante = (
  mode: ModoPreparacionRestaurante,
  stationOperationMode: ModoOperacionEstacionRestaurante = MODO_OPERACION_ESTACION_RESTAURANTE.SEGUIMIENTO_DIGITAL,
): EstadoTareaPreparacionRestaurante =>
  stationOperationMode === MODO_OPERACION_ESTACION_RESTAURANTE.COMANDA_FISICA
    ? "GESTION_EXTERNA"
    : mode === "DESPACHO_DIRECTO"
      ? "LISTA"
      : "EN_COLA";

export const esTareaPreparacionTerminalRestaurante = (
  task: Pick<TareaPreparacionRestaurante, "estado">,
): boolean =>
  task.estado === "ENTREGADA" ||
  task.estado === "CANCELADA" ||
  task.estado === "DESCARTADA";
