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
    moneda: "PEN" | "USD";
    simboloMoneda: string;
    porcentajeIGV: number;
    incluyeIGVEnPrecios: boolean;
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
  };

  sistema: {
    zonaHoraria: string;
    formatoFecha: string;
  };

  updatedAt: ISODateString;
}
