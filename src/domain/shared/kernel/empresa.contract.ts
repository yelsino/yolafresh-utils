import type { ISODateString } from "../utils/dates";
import type { CompatibleProductImage } from "./media.contract";

export type PaisEmpresa =
  | "PERU"
  | "MEXICO"
  | "COLOMBIA"
  | "ARGENTINA"
  | "CHILE"
  | "ECUADOR"
  | "ESPANA"
  | "USA"
  | (string & {});

export type MonedaEmpresa = "PEN" | "USD";

/** Régimen declarado por el emisor; no se infiere del porcentaje comercial de IGV. */
export type RegimenTributarioEmpresa = "NRUS" | "RER" | "RMT" | "REGIMEN_GENERAL";

/**
 * Declaración fechada del régimen en YolaFresh. No modifica el régimen ante SUNAT.
 * El inicio siguiente delimita su fin; una corrección conserva la declaración original.
 */
export type FiscalCompanyTaxRegimeDecision = Readonly<{
  decisionId: string;
  regimenTributario: RegimenTributarioEmpresa;
  effectiveFrom: string;
  recordedAtMs: number;
  recordedBy: string;
}> & (Readonly<{ supersedesDecisionId?: never; reason?: string }> |
  Readonly<{ supersedesDecisionId: string; reason: string }>);

/** Destino fiscal de las nuevas emisiones; no depende del nombre del tenant. */
export type EntornoEmisionFiscal = "DEMO" | "PRODUCCION";

/** Lee el entorno explícito. La ausencia no habilita ni elige un entorno. */
export function readFiscalEmissionEnvironment(config: unknown): EntornoEmisionFiscal | null {
  if (!config || typeof config !== "object" || Array.isArray(config) || !("fiscal" in config)) return null;
  const fiscal = config.fiscal;
  if (!fiscal || typeof fiscal !== "object" || Array.isArray(fiscal) || !("entornoEmision" in fiscal)) return null;
  return fiscal.entornoEmision === "DEMO" || fiscal.entornoEmision === "PRODUCCION"
    ? fiscal.entornoEmision : null;
}

/** Lee únicamente la habilitación declarada por la empresa; no concede permisos de emisión. */
export function isFiscalCompanyEnabled(config: unknown): boolean {
  if (!config || typeof config !== "object" || Array.isArray(config) || !("fiscal" in config)) return false;
  const fiscal = config.fiscal;
  if (!fiscal || typeof fiscal !== "object" || Array.isArray(fiscal)) return false;
  return (fiscal as Partial<ConfigEmpresa["fiscal"]>).facturacionElectronicaEnabled === true;
}

/** Política de ajuste del efectivo que nunca incrementa el importe al cliente. */
export interface PoliticaRedondeoPago {
  id: string;
  version: number;
  habilitado: boolean;
  moneda: MonedaEmpresa;
  aplicacion: "EFECTIVO_TOTAL";
  direccion: "A_FAVOR_CLIENTE";
  paso: number;
}

/** Límites del descuento global aplicado antes de resolver el cobro. */
export interface PoliticaDescuentoVenta {
  version: number;
  habilitado: boolean;
  requiereMotivo: true;
  porcentajeMaximo: number;
  montoMaximo?: number;
  porcentajeDesdeAprobacion?: number;
  montoDesdeAprobacion?: number;
}

export type VerticalNegocio =
  | "RETAIL"
  | "GASTRONOMIA"
  | "SERVICIOS"
  | "DISTRIBUCION"
  | "PRODUCCION"
  | "SALUD";

export type CapacidadNegocio =
  | "VENTA_MOSTRADOR"
  | "PEDIDOS"
  | "COMPRAS"
  | "INVENTARIO"
  | "CAJA"
  | "CREDITO_CLIENTE"
  | "MESAS"
  | "CUENTA_ABIERTA"
  | "COMANDAS"
  | "DELIVERY"
  | "RESERVAS"
  | "RECETAS"
  | "PRODUCCION"
  | "RUTAS_REPARTO"
  | "CITAS"
  | "ORDEN_SERVICIO"
  | "LOTES_VENCIMIENTO";

export interface PerfilNegocioConfigEmpresa {
  /**
   * Familia operativa principal del negocio.
   * No reemplaza la identidad legal/comercial de la empresa.
   */
  vertical: VerticalNegocio;

  /**
   * Capacidades activas para la empresa.
   * Si no se envía, los consumers pueden asumir defaults por vertical.
   */
  capacidades?: CapacidadNegocio[];

  /**
   * Permite congelar cambios estructurales tras onboarding o migración.
   */
  bloqueado?: boolean;

  /**
   * Versiona presets o evoluciones del perfil sin romper el contrato base.
   */
  version?: number;
}

export interface ConfigEmpresa {
  id: string; // "config_empresa"
  type: "config_empresa";
  empresa: {
    razonSocial: string;
    nombreComercial?: string;
    slogan?: string;
    descripcion?: string;
    ruc?: string;
    pais?: PaisEmpresa;
    direccion?: string;
    telefono?: string;
    email?: string;
    logoUrl?: CompatibleProductImage;
  };

  /**
   * Perfil operativo opcional y aditivo.
   * Mantiene compatibilidad con empresas creadas antes de esta ampliación.
   */
  perfilNegocio?: PerfilNegocioConfigEmpresa;

  fiscal: {
    /** Referencia canónica al perfil de decisiones del emisor. No contiene reglas por producto. */
    taxProfileDocumentId?: string;
    /** Código de establecimiento fiscal, configurado explícitamente por la empresa. */
    codigoEstablecimiento?: string;
    moneda: MonedaEmpresa;
    simboloMoneda: string;
    porcentajeIGV: number;
    incluyeIGVEnPrecios: boolean;
    regimenTributario?: RegimenTributarioEmpresa;
    /**
     * Calendario canónico cuando existe. El escalar anterior solo conserva compatibilidad;
     * no se usa como fallback para una fecha fuera de este calendario.
     */
    regimenTributarioVigencias?: readonly FiscalCompanyTaxRegimeDecision[];
    /** Habilitación del vector fiscal por empresa. Ausente o false permanece apagado. */
    facturacionElectronicaEnabled?: boolean;
    /** Domicilio fiscal contrastado por el administrador con SUNAT para el emisor actual. */
    domicilioFiscalVerificado?: string;
    /** Obligatorio para emitir; puede faltar cuando la facturación está deshabilitada. */
    entornoEmision?: EntornoEmisionFiscal;
    redondeoPago?: PoliticaRedondeoPago;
    descuentoVenta?: PoliticaDescuentoVenta;
  };

  tickets: {
    mostrarLogo: boolean;
    mostrarRuc: boolean;
    mostrarDireccion: boolean;
    mensajePie?: string;
    anchoTicket: 58 | 80;
    cortarAutomaticamente: boolean;
  };

  impresion: {
    nombreImpresora?: string;
    tipoConexion: "USB" | "RED" | "SERIE";
    autoImprimirVenta: boolean;
  };

  inventario: {
    permitirStockNegativo: boolean;
    validarStockAntesDeVender: boolean;
    /**
     * Almacén operativo predeterminado cuando existen varios almacenes activos.
     *
     * La ausencia es válida y obliga a seleccionar explícitamente el almacén.
     * Cuando solo existe un almacén activo, este se resuelve por derivación y no
     * es necesario persistir su identificador aquí.
     */
    almacenPredeterminadoId?: string;
  };

  sistema: {
    zonaHoraria: string;
    formatoFecha: string;
  };

  updatedAt: ISODateString;
}
