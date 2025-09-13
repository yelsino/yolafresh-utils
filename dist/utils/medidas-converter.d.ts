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
export declare class MedidasConverter {
    /**
     * Configuración unificada de todas las medidas
     * Fuente única de verdad para todas las conversiones
     */
    private static readonly MEDIDAS_CONFIG;
    /**
     * Mapa de fracciones para formateo especial
     */
    private static readonly FRACTION_MAP;
    /**
     * Obtiene la abreviación de una medida según las opciones especificadas
     * @param tipoVenta - Tipo de venta/medida
     * @param options - Opciones de formateo
     * @returns Abreviación formateada
     */
    static getAbreviacion(tipoVenta: TipoVentaEnum, options?: FormatMedidaOptions): string;
    /**
     * Obtiene el nombre completo para mostrar
     * @param tipoVenta - Tipo de venta/medida
     * @returns Nombre completo
     */
    static getDisplayName(tipoVenta: TipoVentaEnum): string;
    /**
     * Convierte una fracción numérica a su representación textual
     * @param valor - Valor numérico (ej: 250, 500, 750, 1000)
     * @returns Representación fraccionaria (ej: '1/4', '1/2', '3/4', '1')
     */
    static getFraccion(valor: number): string | null;
    /**
     * Verifica si un tipo de venta es válido
     * @param tipoVenta - Tipo de venta a verificar
     * @returns true si es válido
     */
    static esValido(tipoVenta: TipoVentaEnum): boolean;
    /**
     * Obtiene todos los tipos de venta disponibles
     * @returns Array con todos los tipos de venta
     */
    static getTiposDisponibles(): TipoVentaEnum[];
    /**
     * Obtiene la configuración completa de una medida
     * @param tipoVenta - Tipo de venta
     * @returns Configuración completa o null si no existe
     */
    static getConfig(tipoVenta: TipoVentaEnum): MedidaConfig | null;
    /**
     * Formatea una cantidad con su unidad de medida
     * @param cantidad - Cantidad numérica
     * @param tipoVenta - Tipo de venta/medida
     * @param options - Opciones de formateo
     * @returns Texto formateado (ej: "2.5 kg", "3 unds")
     */
    static formatearCantidad(cantidad: number, tipoVenta: TipoVentaEnum, options?: FormatMedidaOptions): string;
}
export {};
