/**
 * Utilidades genéricas para transformación de nomenclaturas
 * Independiente de cualquier base de datos o sistema específico
 */
/**
 * Convierte una cadena de camelCase a snake_case
 * @param str Cadena en camelCase
 * @returns Cadena en snake_case
 */
export declare function camelToSnakeCase(str: string): string;
/**
 * Convierte una cadena de snake_case a camelCase
 * @param str Cadena en snake_case
 * @returns Cadena en camelCase
 */
export declare function snakeToCamelCase(str: string): string;
/**
 * Convierte un objeto con propiedades camelCase a snake_case
 * @param obj Objeto con propiedades en camelCase
 * @returns Objeto con propiedades en snake_case
 */
export declare function objectToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any>;
/**
 * Convierte un objeto con propiedades snake_case a camelCase
 * @param obj Objeto con propiedades en snake_case
 * @returns Objeto con propiedades en camelCase
 */
export declare function objectToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any>;
/**
 * Convierte un array de objetos camelCase a snake_case
 * @param array Array de objetos con propiedades en camelCase
 * @returns Array de objetos con propiedades en snake_case
 */
export declare function arrayToSnakeCase<T extends Record<string, any>>(array: T[]): Record<string, any>[];
/**
 * Convierte un array de objetos snake_case a camelCase
 * @param array Array de objetos con propiedades en snake_case
 * @returns Array de objetos con propiedades en camelCase
 */
export declare function arrayToCamelCase<T extends Record<string, any>>(array: T[]): Record<string, any>[];
/**
 * Tipo genérico para transformar las claves de un objeto de camelCase a snake_case
 */
export type ToSnakeCase<T> = {
    [K in keyof T as K extends string ? CamelToSnake<K> : K]: T[K];
};
/**
 * Tipo genérico para transformar las claves de un objeto de snake_case a camelCase
 */
export type ToCamelCase<T> = {
    [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};
/**
 * Tipo auxiliar para convertir una cadena camelCase a snake_case a nivel de tipos
 */
type CamelToSnake<S extends string> = S extends `${infer T}${infer U}` ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}` : S;
/**
 * Tipo auxiliar para convertir una cadena snake_case a camelCase a nivel de tipos
 */
type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}` ? `${T}${Capitalize<SnakeToCamel<U>>}` : S;
/**
 * Clase utilitaria para transformaciones de nomenclatura
 * Proporciona métodos estáticos para conversiones comunes
 */
export declare class NamingConverter {
    /**
     * Convierte propiedades de un objeto usando un mapeo personalizado
     * @param obj Objeto a transformar
     * @param mapping Mapeo de claves (clave_original -> clave_destino)
     * @returns Objeto con claves transformadas
     */
    static transformKeys<T extends Record<string, any>>(obj: T, mapping: Record<string, string>): Record<string, any>;
    /**
     * Crea un mapeo automático de camelCase a snake_case para las claves de un objeto
     * @param obj Objeto de referencia
     * @returns Mapeo de claves
     */
    static createCamelToSnakeMapping<T extends Record<string, any>>(obj: T): Record<string, string>;
    /**
     * Crea un mapeo automático de snake_case a camelCase para las claves de un objeto
     * @param obj Objeto de referencia
     * @returns Mapeo de claves
     */
    static createSnakeToCamelMapping<T extends Record<string, any>>(obj: T): Record<string, string>;
}
/**
 * Función de utilidad para crear transformadores personalizados
 * @param fromFormat Formato de origen ('camel' | 'snake')
 * @param toFormat Formato de destino ('camel' | 'snake')
 * @returns Función transformadora
 */
export declare function createTransformer(fromFormat: 'camel' | 'snake', toFormat: 'camel' | 'snake'): typeof objectToSnakeCase;
export {};
