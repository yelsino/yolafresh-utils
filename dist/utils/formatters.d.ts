import { TipoVentaEnum } from "./enums";
/**
 * Formatea un número a un formato específico
 * @param numero - Número a formatear
 * @returns Número formateado como string
 */
export declare function formatearNumero(numero: number): string;
/**
 * Mapeo de tipos de venta a sus abreviaciones en singular
 */
export declare const singularToAbbreviation: {
    [key in TipoVentaEnum]: string;
};
/**
 * Versión alternativa de mapeo de tipos de venta a sus abreviaciones
 */
export declare const singularToAbbreviationv2: {
    [key in TipoVentaEnum]: string;
};
/**
 * Mapeo de tipos de venta a sus abreviaciones en plural
 */
export declare const pluralToAbbreviation: {
    [key in TipoVentaEnum]: string;
};
/**
 * Formatea un monto a soles peruanos
 * @param amount - Monto a formatear
 * @param version - Versión del formato (opcional)
 * @returns Monto formateado en soles peruanos
 */
export declare function formatSolesPeruanos(amount: number, version?: 'version1' | 'version2'): string;
/**
 * Redondea un monto a dos decimales
 * @param amount - Monto a redondear
 * @returns Monto redondeado
 */
export declare function roundAmount(amount: number): number;
/**
 * Capitaliza la primera letra de un texto
 * @param texto - Texto a capitalizar
 * @returns Texto con la primera letra en mayúscula
 */
export declare function capitalizarPrimeraLetra(texto: string): string;
/**
 * Convierte un texto a número
 * @param text - Texto a convertir
 * @returns Número convertido o 0 si no es válido
 */
export declare function convertToNumber(text: any): number;
/**
 * Abrevia el nombre de un cliente
 * @param nombreCompleto - Nombre completo del cliente
 * @param maxCaracteres - Máximo de caracteres permitidos
 * @returns Nombre abreviado
 */
export declare function abreviarNombreCliente(nombreCompleto: string, maxCaracteres?: number): string;
/**
 * Formatea el nombre de un producto
 * @param texto - Nombre del producto
 * @returns Nombre formateado
 */
export declare function formatNameProduct(texto: string): string;
/**
 * Normaliza una unidad de medida
 * @param unit - Unidad a normalizar
 * @returns Unidad normalizada
 */
export declare function normalizeUnit(unit: string): string;
