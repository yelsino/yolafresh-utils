/**
 * Configuraciones fiscales predefinidas para diferentes países
 * Facilita la reutilización en múltiples proyectos
 */
export interface ConfiguracionFiscal {
    tasaImpuesto?: number;
    aplicaImpuesto?: boolean;
    nombreImpuesto?: string;
}
/**
 * Configuraciones fiscales por país
 */
export declare const CONFIGURACIONES_FISCALES: {
    PERU: ConfiguracionFiscal;
    MEXICO: ConfiguracionFiscal;
    COLOMBIA: ConfiguracionFiscal;
    ARGENTINA: ConfiguracionFiscal;
    CHILE: ConfiguracionFiscal;
    ECUADOR: ConfiguracionFiscal;
    ESPANA: ConfiguracionFiscal;
    USA_CALIFORNIA: ConfiguracionFiscal;
    SIN_IMPUESTOS: ConfiguracionFiscal;
    PERSONALIZADO: (tasa: number, nombre?: string) => ConfiguracionFiscal;
};
/**
 * Utilidades para trabajar con configuraciones fiscales
 */
export declare class FiscalUtils {
    /**
     * Calcular impuesto sobre una base imponible
     */
    static calcularImpuesto(baseImponible: number, configuracion: ConfiguracionFiscal): number;
    /**
     * Calcular total con impuesto
     */
    static calcularTotalConImpuesto(subtotal: number, configuracion: ConfiguracionFiscal): number;
    /**
     * Validar configuración fiscal
     */
    static validarConfiguracion(configuracion: ConfiguracionFiscal): {
        valida: boolean;
        errores: string[];
    };
    /**
     * Formatear porcentaje de impuesto para mostrar
     */
    static formatearPorcentaje(configuracion: ConfiguracionFiscal): string;
}
/**
 * Factory para crear configuraciones fiscales comunes
 */
export declare class ConfiguracionFiscalFactory {
    /**
     * Crear configuración para un país específico
     */
    static paraPais(pais: keyof typeof CONFIGURACIONES_FISCALES): ConfiguracionFiscal;
    /**
     * Crear configuración personalizada
     */
    static personalizada(tasa: number, nombre?: string): ConfiguracionFiscal;
    /**
     * Crear configuración sin impuestos
     */
    static sinImpuestos(): ConfiguracionFiscal;
    /**
     * Listar países disponibles
     */
    static paisesDisponibles(): string[];
}
