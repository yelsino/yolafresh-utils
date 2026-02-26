import type { ISODateString } from "@/utils";
import { ImageSizes } from "./producto";



export interface ConfigEmpresa {
  id: string; // "config_empresa"
  type: "config_empresa";
  empresa: {
    razonSocial: string;
    nombreComercial?: string;
    slogan?: string;
    descripcion?: string;
    ruc?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    logoUrl?: ImageSizes;
  };

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
