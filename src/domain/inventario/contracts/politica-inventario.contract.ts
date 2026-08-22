import type { UnixMillis } from "../../shared/utils/dates";
import type {
  ActorInventarioSnapshot,
  InventoryV2SchemaVersion,
} from "./inventory-quantity-v2.contract";

export const POLITICA_INVENTARIO_TYPE = "politica_inventario" as const;

export enum ModoControlInventario {
  /** Saldos confiables; una insuficiencia bloquea la operación. */
  ESTRICTO = "ESTRICTO",
  /** Conserva ledger, advierte diferencias y permite continuar. */
  FLEXIBLE = "FLEXIBLE",
  /** El saldo es orientativo y nunca bloquea la operación comercial. */
  REFERENCIAL = "REFERENCIAL",
  /** El producto queda fuera del ledger físico. */
  SIN_CONTROL = "SIN_CONTROL",
}

export enum NivelPoliticaInventario {
  EMPRESA = "EMPRESA",
  ALMACEN = "ALMACEN",
  PRODUCTO = "PRODUCTO",
  PRODUCTO_ALMACEN = "PRODUCTO_ALMACEN",
}

/** Menor a mayor prioridad. */
export const PRECEDENCIA_POLITICA_INVENTARIO = Object.freeze([
  NivelPoliticaInventario.EMPRESA,
  NivelPoliticaInventario.ALMACEN,
  NivelPoliticaInventario.PRODUCTO,
  NivelPoliticaInventario.PRODUCTO_ALMACEN,
] as const);

export type AlcancePoliticaInventario =
  | {
      nivel: NivelPoliticaInventario.EMPRESA;
      empresaId: string;
    }
  | {
      nivel: NivelPoliticaInventario.ALMACEN;
      empresaId: string;
      almacenId: string;
    }
  | {
      nivel: NivelPoliticaInventario.PRODUCTO;
      empresaId: string;
      productoBaseId: string;
    }
  | {
      nivel: NivelPoliticaInventario.PRODUCTO_ALMACEN;
      empresaId: string;
      productoBaseId: string;
      almacenId: string;
    };

export interface ConfiguracionPoliticaInventario {
  modo?: ModoControlInventario;
  inventarioInicialRequerido?: boolean;
  conteoCiego?: boolean;
  frecuenciaConteoDias?: number;
  toleranciaCantidadBase?: number;
  toleranciaPorcentaje?: number;
  requiereAprobacionAjuste?: boolean;
  umbralAprobacionCantidadBase?: number;
  umbralAprobacionValor?: number;
  requiereEvidenciaMerma?: boolean;
}

export interface PoliticaInventario {
  id: string;
  type: typeof POLITICA_INVENTARIO_TYPE;
  schemaVersion: InventoryV2SchemaVersion;
  alcance: AlcancePoliticaInventario;
  configuracion: ConfiguracionPoliticaInventario;
  activa: boolean;
  /**
   * Control optimista de dominio. Crear exige 1; editar incrementa exactamente
   * uno. CouchDB `_rev` sigue siendo responsabilidad del adapter.
   */
  version: number;
  actor: ActorInventarioSnapshot;
  operationId: string;
  idempotencyKey: string;
  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export type AccionStockInsuficiente = "BLOQUEAR" | "ADVERTIR" | "PERMITIR";

/** Política materializada después de aplicar la precedencia completa. */
export interface PoliticaInventarioResuelta {
  modo: ModoControlInventario;
  registrarMovimientos: boolean;
  validarStockAntesDeVender: boolean;
  permitirStockNegativo: boolean;
  accionStockInsuficiente: AccionStockInsuficiente;

  inventarioInicialRequerido: boolean;
  conteoCiego: boolean;
  frecuenciaConteoDias?: number;
  toleranciaCantidadBase: number;
  toleranciaPorcentaje: number;
  requiereAprobacionAjuste: boolean;
  umbralAprobacionCantidadBase?: number;
  umbralAprobacionValor?: number;
  requiereEvidenciaMerma: boolean;

  /** IDs de políticas aplicadas, ordenadas de menor a mayor precedencia. */
  fuentesAplicadas: string[];
}

export interface ContextoResolucionPoliticaInventario {
  empresaId: string;
  almacenId: string;
  productoBaseId: string;
}
