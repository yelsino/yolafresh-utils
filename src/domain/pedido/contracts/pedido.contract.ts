import {
  PedidoPrioridadEnum,
  PedidoProcedenciaEnum,
  PedidoState,
} from "../../shared/kernel/enums";
import type {
  TipoVentaEnum,
  UnidadBaseInterna,
} from "../../inventario/contracts/producto.contract";

/**
 * Schema 3 congela, por linea, la decision de afectar inventario y la
 * conversion fisica usada al crear el pedido.
 */
export const PEDIDO_DOCUMENT_SCHEMA_VERSION = 3 as const;
export const PEDIDO_LEGACY_DOCUMENT_SCHEMA_VERSION = 2 as const;
export type PedidoDocumentSchemaVersion =
  | typeof PEDIDO_LEGACY_DOCUMENT_SCHEMA_VERSION
  | typeof PEDIDO_DOCUMENT_SCHEMA_VERSION;

export type PedidoChecklistEstado = "PENDIENTE" | "COMPLETADO";

export type PedidoChecklistAccion =
  | "ITEM_MARCADO"
  | "ITEM_DESMARCADO"
  | "CANTIDAD_ATENDIDA_ACTUALIZADA"
  | "CHECKLIST_INVALIDADO_POR_EDICION"
  | "CHECKLIST_CONFIRMADO"
  | "PEDIDO_ANULADO";

/**
 * Estado colaborativo actual de una linea. Conserva solo el ultimo actor para
 * presentacion; la historia completa vive en Pedido.checklist.historial.
 */
export interface PedidoItemChecklist {
  marcado: boolean;
  actualizadoPorId: string;
  actualizadoPorNombre?: string;
  dispositivoId?: string;
  actualizadoAt: Date;
  revision: number;
}

export interface PedidoChecklistEvento {
  id: string;
  /** Identificador idempotente emitido por el comando autoritativo. */
  operacionId?: string;
  /** Huella del comando usada para detectar reutilización incompatible. */
  comandoHash?: string;
  accion: PedidoChecklistAccion;
  itemId?: string;
  marcado?: boolean;
  cantidadAnterior?: number;
  cantidadAtendida?: number;
  usuarioId: string;
  usuarioNombre?: string;
  dispositivoId?: string;
  fecha: Date;
  motivo?: string;
}

export interface PedidoChecklist {
  estado: PedidoChecklistEstado;
  completado: boolean;
  version: number;
  actualizadoAt?: Date;
  confirmadoAt?: Date;
  confirmadoPorId?: string;
  confirmadoPorNombre?: string;
  confirmadoDesdeDispositivoId?: string;
  historial: PedidoChecklistEvento[];
}

export interface PedidoItemBase {
  id: string;
  presentacionId: string;
  nombre: string;
  cantidadSolicitada: number;
  cantidadAtendida: number;
  precioUnitario: number;
  subtotal: number;
  montoModificado?: boolean;
  unidadComercial?: string;
  imagenUrl?: string;
  checklist?: PedidoItemChecklist;
}

/** Linea schema 3 que debe descontar inventario al convertirse en venta. */
export interface PedidoItemInventariable extends PedidoItemBase {
  afectaInventario: true;
  /** Semantica comercial congelada para no reinterpretar cantidad o peso. */
  tipoVenta: TipoVentaEnum;
  productoBaseId: string;
  factorUnidadBase: number;
  unidadBaseInventario: UnidadBaseInterna;
  /** Entero seguro positivo de la conversion congelada al crear el pedido. */
  versionConversion: number;
}

/** Linea schema 3 explicitamente no inventariable (servicio u otro cargo). */
export interface PedidoItemNoInventariable extends PedidoItemBase {
  afectaInventario: false;
  tipoVenta: TipoVentaEnum;
  productoBaseId?: never;
  factorUnidadBase?: never;
  unidadBaseInventario?: never;
  versionConversion?: never;
}

/**
 * Borde de lectura para documentos anteriores a schema 3. Puede contener un
 * snapshot parcial, pero nunca debe usarse para afectar stock hasta una
 * revision y upgrade explicitos.
 */
export interface PedidoItemLegacy extends PedidoItemBase {
  afectaInventario?: undefined;
  tipoVenta?: TipoVentaEnum;
  productoBaseId?: string;
  factorUnidadBase?: number;
  unidadBaseInventario?: UnidadBaseInterna;
  versionConversion?: number;
}

export type PedidoItemVersionado =
  | PedidoItemInventariable
  | PedidoItemNoInventariable;

export type PedidoItem = PedidoItemVersionado | PedidoItemLegacy;

export interface Pedido {
  id: string;
  type: "pedido";
  schemaVersion?: PedidoDocumentSchemaVersion;
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
  checklist?: PedidoChecklist;
  subtotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
