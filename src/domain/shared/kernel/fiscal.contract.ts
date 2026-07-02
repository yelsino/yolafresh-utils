export interface ConfiguracionFiscal {
  tasaImpuesto?: number;
  aplicaImpuesto?: boolean;
  nombreImpuesto?: string;
}

export const CONFIGURACIONES_FISCALES = {
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

  ESPANA: {
    tasaImpuesto: 0.21,
    aplicaImpuesto: true,
    nombreImpuesto: 'IVA'
  } as ConfiguracionFiscal,

  USA_CALIFORNIA: {
    tasaImpuesto: 0.0725,
    aplicaImpuesto: true,
    nombreImpuesto: 'Sales Tax'
  } as ConfiguracionFiscal,

  SIN_IMPUESTOS: {
    tasaImpuesto: 0,
    aplicaImpuesto: false,
    nombreImpuesto: 'Sin Impuesto'
  } as ConfiguracionFiscal,

  PERSONALIZADO: (tasa: number, nombre: string = 'Impuesto') => ({
    tasaImpuesto: Math.max(0, Math.min(1, tasa)),
    aplicaImpuesto: tasa > 0,
    nombreImpuesto: nombre
  } as ConfiguracionFiscal)
};

export class FiscalUtils {
  static calcularImpuesto(baseImponible: number, configuracion: ConfiguracionFiscal): number {
    if (!configuracion.aplicaImpuesto || !configuracion.tasaImpuesto) {
      return 0;
    }
    return Math.round(baseImponible * configuracion.tasaImpuesto * 100) / 100;
  }

  static calcularTotalConImpuesto(subtotal: number, configuracion: ConfiguracionFiscal): number {
    const impuesto = this.calcularImpuesto(subtotal, configuracion);
    return Math.round((subtotal + impuesto) * 100) / 100;
  }

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
}

export class ConfiguracionFiscalFactory {
  static paraPais(pais: keyof typeof CONFIGURACIONES_FISCALES): ConfiguracionFiscal {
    const config = CONFIGURACIONES_FISCALES[pais];
    if (!config) {
      throw new Error(`Configuración fiscal no encontrada para: ${pais}`);
    }
    return { ...config };
  }

  static personalizada(tasa: number, nombre: string = 'Impuesto'): ConfiguracionFiscal {
    return CONFIGURACIONES_FISCALES.PERSONALIZADO(tasa, nombre);
  }

  static sinImpuestos(): ConfiguracionFiscal {
    return { ...CONFIGURACIONES_FISCALES.SIN_IMPUESTOS };
  }

  static paisesDisponibles(): string[] {
    return Object.keys(CONFIGURACIONES_FISCALES).filter(key => key !== 'PERSONALIZADO');
  }
}
