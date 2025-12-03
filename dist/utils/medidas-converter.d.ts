import { UnidadMedidaEnum } from '../interfaces/producto';
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
export declare class MedidasConverter {
    /**
     * Configuración unificada de todas las medidas
     */
    private static readonly MEDIDAS_CONFIG;
    /**
     * Mapa de fracciones para formateo especial
     */
    private static readonly FRACTION_MAP;
    /**
     * Obtiene la abreviación de una medida según las opciones especificadas
     */
    static getAbreviacion(unidad: UnidadMedidaEnum, options?: FormatMedidaOptions): string;
    /**
     * Obtiene el nombre completo para mostrar
     */
    static getDisplayName(unidad: UnidadMedidaEnum): string;
    /**
     * Convierte una fracción numérica a su representación textual
     */
    static getFraccion(valor: number): string | null;
}
