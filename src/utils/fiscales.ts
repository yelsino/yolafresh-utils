/**
 * Configuraciones fiscales predefinidas para diferentes países
 * Facilita la reutilización en múltiples proyectos
 */

export interface ConfiguracionFiscal {
  tasaImpuesto?: number; // Tasa de impuesto (ej: 0.18 para 18%)
  aplicaImpuesto?: boolean; // Si se aplica impuesto o no
  nombreImpuesto?: string; // Nombre del impuesto (IGV, IVA, etc.)
}

/**
 * Configuraciones fiscales por país
 */
export const CONFIGURACIONES_FISCALES = {
  // **LATINOAMÉRICA**
  PERU: {
    tasaImpuesto: 0.18,
    aplicaImpuesto: true,
    nombreImpuesto: 'IGV'
  } as ConfiguracionFiscal,

  MEXICO: {
    tasaImpuesto: 0.16,
    aplicaImpuesto: true,
    nombreImpuesto: 'IVA'
  } as ConfiguracionFiscal,

  COLOMBIA: {
    tasaImpuesto: 0.19,
    aplicaImpuesto: true,
    nombreImpuesto: 'IVA'
  } as ConfiguracionFiscal,

  ARGENTINA: {
    tasaImpuesto: 0.21,
    aplicaImpuesto: true,
    nombreImpuesto: 'IVA'
  } as ConfiguracionFiscal,

  CHILE: {
    tasaImpuesto: 0.19,
    aplicaImpuesto: true,
    nombreImpuesto: 'IVA'
  } as ConfiguracionFiscal,

  ECUADOR: {
    tasaImpuesto: 0.12,
    aplicaImpuesto: true,
    nombreImpuesto: 'IVA'
  } as ConfiguracionFiscal,

  // **EUROPA**
  ESPAÑA: {
    tasaImpuesto: 0.21,
    aplicaImpuesto: true,
    nombreImpuesto: 'IVA'
  } as ConfiguracionFiscal,

  // **NORTEAMÉRICA**
  USA_CALIFORNIA: {
    tasaImpuesto: 0.0725, // Promedio de California
    aplicaImpuesto: true,
    nombreImpuesto: 'Sales Tax'
  } as ConfiguracionFiscal,

  // **SIN IMPUESTOS**
  SIN_IMPUESTOS: {
    tasaImpuesto: 0,
    aplicaImpuesto: false,
    nombreImpuesto: 'Sin Impuesto'
  } as ConfiguracionFiscal,

  // **PERSONALIZABLE**
  PERSONALIZADO: (tasa: number, nombre: string = 'Impuesto') => ({
    tasaImpuesto: Math.max(0, Math.min(1, tasa)),
    aplicaImpuesto: tasa > 0,
    nombreImpuesto: nombre
  } as ConfiguracionFiscal)
};

/**
 * Utilidades para trabajar con configuraciones fiscales
 */
export class FiscalUtils {
  /**
   * Calcular impuesto sobre una base imponible
   */
  static calcularImpuesto(baseImponible: number, configuracion: ConfiguracionFiscal): number {
    if (!configuracion.aplicaImpuesto || !configuracion.tasaImpuesto) {
      return 0;
    }
    return Math.round(baseImponible * configuracion.tasaImpuesto * 100) / 100;
  }

  /**
   * Calcular total con impuesto
   */
  static calcularTotalConImpuesto(subtotal: number, configuracion: ConfiguracionFiscal): number {
    const impuesto = this.calcularImpuesto(subtotal, configuracion);
    return Math.round((subtotal + impuesto) * 100) / 100;
  }

  /**
   * Validar configuración fiscal
   */
  static validarConfiguracion(configuracion: ConfiguracionFiscal): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (configuracion.aplicaImpuesto) {
      if (configuracion.tasaImpuesto === undefined || configuracion.tasaImpuesto === null) {
        errores.push('Tasa de impuesto es requerida cuando aplicaImpuesto es true');
      } else if (configuracion.tasaImpuesto < 0 || configuracion.tasaImpuesto > 1) {
        errores.push('Tasa de impuesto debe estar entre 0 y 1');
      }

      if (!configuracion.nombreImpuesto?.trim()) {
        errores.push('Nombre de impuesto es requerido cuando aplicaImpuesto es true');
      }
    }

    return {
      valida: errores.length === 0,
      errores
    };
  }

  /**
   * Formatear porcentaje de impuesto para mostrar
   */
  static formatearPorcentaje(configuracion: ConfiguracionFiscal): string {
    if (!configuracion.aplicaImpuesto || !configuracion.tasaImpuesto) {
      return 'Sin impuesto';
    }
    const porcentaje = (configuracion.tasaImpuesto * 100).toFixed(2);
    return `${configuracion.nombreImpuesto} ${porcentaje}%`;
  }
}

/**
 * Factory para crear configuraciones fiscales comunes
 */
export class ConfiguracionFiscalFactory {
  /**
   * Crear configuración para un país específico
   */
  static paraPais(pais: keyof typeof CONFIGURACIONES_FISCALES): ConfiguracionFiscal {
    const config = CONFIGURACIONES_FISCALES[pais];
    if (!config) {
      throw new Error(`Configuración fiscal no encontrada para: ${pais}`);
    }
    return { ...config };
  }

  /**
   * Crear configuración personalizada
   */
  static personalizada(tasa: number, nombre: string = 'Impuesto'): ConfiguracionFiscal {
    return CONFIGURACIONES_FISCALES.PERSONALIZADO(tasa, nombre);
  }

  /**
   * Crear configuración sin impuestos
   */
  static sinImpuestos(): ConfiguracionFiscal {
    return { ...CONFIGURACIONES_FISCALES.SIN_IMPUESTOS };
  }

  /**
   * Listar países disponibles
   */
  static paisesDisponibles(): string[] {
    return Object.keys(CONFIGURACIONES_FISCALES).filter(key => key !== 'PERSONALIZADO');
  }
} 