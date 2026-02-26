import { UnidadMedidaEnum } from '../interfaces/producto';

/**
 * Configuración de medidas para cada unidad de medida
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
 * Adaptado para UnidadMedidaEnum
 */
export class MedidasConverter {
  /**
   * Configuración unificada de todas las medidas
   */
  private static readonly MEDIDAS_CONFIG: Partial<Record<UnidadMedidaEnum, MedidaConfig>> = {
    [UnidadMedidaEnum.Kilogramo]: {
      singular: 'kg',
      plural: 'kg',
      display: 'kilogramo',
      abarrotes: 'kg',
      alternativa: 'kg'
    },
    [UnidadMedidaEnum.Unidad]: {
      singular: 'und',
      plural: 'unds',
      display: 'unidad',
      abarrotes: 'und',
      alternativa: 'und'
    },
    [UnidadMedidaEnum.Saco]: {
      singular: 'saco',
      plural: 'sacos',
      display: 'saco',
      abarrotes: 'saco',
      alternativa: 'saco'
    },
    [UnidadMedidaEnum.Arroba]: {
      singular: 'arrb',
      plural: 'arrbs',
      display: 'arroba',
      abarrotes: '12 kg',
      alternativa: '12 kg'
    },
    [UnidadMedidaEnum.Galon]: { // Balde equivalent or similar? Assuming Galon for now or create Balde if needed. Old enum had Balde.
        singular: 'gal',
        plural: 'gal',
        display: 'galón',
        abarrotes: 'gal',
        alternativa: 'gal'
    },
    [UnidadMedidaEnum.Bolsa]: {
      singular: 'bols',
      plural: 'bols',
      display: 'bolsa',
      abarrotes: 'bols',
      alternativa: 'bols'
    },
    [UnidadMedidaEnum.Gramo]: {
      singular: 'gr',
      plural: 'grs',
      display: 'gramo',
      abarrotes: 'unidad',
      alternativa: 'gr'
    },
    [UnidadMedidaEnum.Mililitro]: {
      singular: 'ml',
      plural: 'mls',
      display: 'mililitro',
      abarrotes: 'unidad',
      alternativa: 'ml'
    },
    [UnidadMedidaEnum.Litro]: {
      singular: 'litr',
      plural: 'lts',
      display: 'litro',
      abarrotes: 'lt',
      alternativa: 'lt'
    },
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
   */
  static getAbreviacion(unidad: UnidadMedidaEnum, options: FormatMedidaOptions = {}): string {
    const config = this.MEDIDAS_CONFIG[unidad];
    if (!config) {
      return unidad; // Fallback
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
   */
  static getDisplayName(unidad: UnidadMedidaEnum): string {
    const config = this.MEDIDAS_CONFIG[unidad];
    if (!config) {
      return unidad;
    }
    return config.display;
  }

  /**
   * Convierte una fracción numérica a su representación textual
   */
  static getFraccion(valor: number): string | null {
    return this.FRACTION_MAP[valor] || null;
  }
}
