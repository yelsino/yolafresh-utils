import { TipoVentaEnum } from './enums';

/**
 * Configuración de medidas para cada tipo de venta
 */
interface MedidaConfig {
  /** Abreviación singular */
  singular: string;
  /** Abreviación plural */
  plural: string;
  /** Nombre completo para mostrar */
  display: string;
  /** Conversión para abarrotes (formato especial) */
  abarrotes: string;
  /** Versión alternativa de abreviación */
  alternativa: string;
}

/**
 * Opciones para formatear medidas
 */
export interface FormatMedidaOptions {
  /** Usar formato plural */
  plural?: boolean;
  /** Usar formato abreviado */
  abreviado?: boolean;
  /** Usar formato para abarrotes */
  abarrotes?: boolean;
  /** Usar versión alternativa */
  alternativa?: boolean;
}

/**
 * Converter centralizado para todas las conversiones de medidas
 * Sigue principios SOLID y elimina duplicación de código
 */
export class MedidasConverter {
  /**
   * Configuración unificada de todas las medidas
   * Fuente única de verdad para todas las conversiones
   */
  private static readonly MEDIDAS_CONFIG: Record<TipoVentaEnum, MedidaConfig> = {
    [TipoVentaEnum.Kilogramo]: {
      singular: 'kg',
      plural: 'kg',
      display: 'kilogramo',
      abarrotes: 'kg',
      alternativa: 'kg'
    },
    [TipoVentaEnum.Unidad]: {
      singular: 'und',
      plural: 'unds',
      display: 'unidad',
      abarrotes: 'und',
      alternativa: 'und'
    },
    [TipoVentaEnum.Saco]: {
      singular: 'saco',
      plural: 'sacos',
      display: 'saco',
      abarrotes: 'saco',
      alternativa: 'saco'
    },
    [TipoVentaEnum.Docena]: {
      singular: 'docn',
      plural: 'docns',
      display: 'docena',
      abarrotes: '12 und',
      alternativa: '12 und'
    },
    [TipoVentaEnum.Arroba]: {
      singular: 'arrb',
      plural: 'arrbs',
      display: 'arroba',
      abarrotes: '12 kg',
      alternativa: '12 kg'
    },
    [TipoVentaEnum.Caja]: {
      singular: 'caja',
      plural: 'cajas',
      display: 'caja',
      abarrotes: 'caja',
      alternativa: 'caja'
    },
    [TipoVentaEnum.Balde]: {
      singular: 'blde',
      plural: 'bldes',
      display: 'balde',
      abarrotes: 'balde',
      alternativa: 'balde'
    },
    [TipoVentaEnum.Bolsa]: {
      singular: 'bols',
      plural: 'bols',
      display: 'bolsa',
      abarrotes: 'bols',
      alternativa: 'bols'
    },
    [TipoVentaEnum.Paquete]: {
      singular: 'pqte',
      plural: 'pqts',
      display: 'paquete',
      abarrotes: 'pqte',
      alternativa: 'pqte'
    },
    [TipoVentaEnum.Gramo]: {
      singular: 'gr',
      plural: 'grs',
      display: 'gramo',
      abarrotes: 'unidad',
      alternativa: 'gr'
    },
    [TipoVentaEnum.Mililitro]: {
      singular: 'ml',
      plural: 'mls',
      display: 'mililitro',
      abarrotes: 'unidad',
      alternativa: 'ml'
    },
    [TipoVentaEnum.Litro]: {
      singular: 'litr',
      plural: 'lts',
      display: 'litro',
      abarrotes: 'lt',
      alternativa: 'lt'
    },
    [TipoVentaEnum.SixPack]: {
      singular: 'sixp',
      plural: 'sixpack',
      display: 'sixpack',
      abarrotes: 'sixpack',
      alternativa: '6 und'
    },
    [TipoVentaEnum.Atado]: {
      singular: 'atad',
      plural: 'atados',
      display: 'atado',
      abarrotes: 'atad',
      alternativa: 'atad'
    }
  };

  /**
   * Mapa de fracciones para formateo especial
   */
  private static readonly FRACTION_MAP: Record<number, string> = {
    250: '1/4',
    500: '1/2',
    750: '3/4',
    1000: '1'
  };

  /**
   * Obtiene la abreviación de una medida según las opciones especificadas
   * @param tipoVenta - Tipo de venta/medida
   * @param options - Opciones de formateo
   * @returns Abreviación formateada
   */
  static getAbreviacion(tipoVenta: TipoVentaEnum, options: FormatMedidaOptions = {}): string {
    const config = this.MEDIDAS_CONFIG[tipoVenta];
    if (!config) {
      throw new Error(`Tipo de venta no soportado: ${tipoVenta}`);
    }

    if (options.abarrotes) {
      return config.abarrotes;
    }

    if (options.alternativa) {
      return config.alternativa;
    }

    return options.plural ? config.plural : config.singular;
  }

  /**
   * Obtiene el nombre completo para mostrar
   * @param tipoVenta - Tipo de venta/medida
   * @returns Nombre completo
   */
  static getDisplayName(tipoVenta: TipoVentaEnum): string {
    const config = this.MEDIDAS_CONFIG[tipoVenta];
    if (!config) {
      throw new Error(`Tipo de venta no soportado: ${tipoVenta}`);
    }
    return config.display;
  }

  /**
   * Convierte una fracción numérica a su representación textual
   * @param valor - Valor numérico (ej: 250, 500, 750, 1000)
   * @returns Representación fraccionaria (ej: '1/4', '1/2', '3/4', '1')
   */
  static getFraccion(valor: number): string | null {
    return this.FRACTION_MAP[valor] || null;
  }

  /**
   * Verifica si un tipo de venta es válido
   * @param tipoVenta - Tipo de venta a verificar
   * @returns true si es válido
   */
  static esValido(tipoVenta: TipoVentaEnum): boolean {
    return tipoVenta in this.MEDIDAS_CONFIG;
  }

  /**
   * Obtiene todos los tipos de venta disponibles
   * @returns Array con todos los tipos de venta
   */
  static getTiposDisponibles(): TipoVentaEnum[] {
    return Object.keys(this.MEDIDAS_CONFIG) as TipoVentaEnum[];
  }

  /**
   * Obtiene la configuración completa de una medida
   * @param tipoVenta - Tipo de venta
   * @returns Configuración completa o null si no existe
   */
  static getConfig(tipoVenta: TipoVentaEnum): MedidaConfig | null {
    return this.MEDIDAS_CONFIG[tipoVenta] || null;
  }

  /**
   * Formatea una cantidad con su unidad de medida
   * @param cantidad - Cantidad numérica
   * @param tipoVenta - Tipo de venta/medida
   * @param options - Opciones de formateo
   * @returns Texto formateado (ej: "2.5 kg", "3 unds")
   */
  static formatearCantidad(
    cantidad: number,
    tipoVenta: TipoVentaEnum,
    options: FormatMedidaOptions = {}
  ): string {
    const abreviacion = this.getAbreviacion(tipoVenta, {
      ...options,
      plural: cantidad !== 1
    });
    
    return `${cantidad} ${abreviacion}`;
  }
}

// Nota: MedidaConfig y FormatMedidaOptions ya están exportados arriba