"use strict";
/**
 * Utilidades genéricas para transformación de nomenclaturas
 * Independiente de cualquier base de datos o sistema específico
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NamingConverter = void 0;
exports.camelToSnakeCase = camelToSnakeCase;
exports.snakeToCamelCase = snakeToCamelCase;
exports.objectToSnakeCase = objectToSnakeCase;
exports.objectToCamelCase = objectToCamelCase;
exports.arrayToSnakeCase = arrayToSnakeCase;
exports.arrayToCamelCase = arrayToCamelCase;
exports.createTransformer = createTransformer;
/**
 * Convierte una cadena de camelCase a snake_case
 * @param str Cadena en camelCase
 * @returns Cadena en snake_case
 */
function camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
/**
 * Convierte una cadena de snake_case a camelCase
 * @param str Cadena en snake_case
 * @returns Cadena en camelCase
 */
function snakeToCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
/**
 * Convierte un objeto con propiedades camelCase a snake_case
 * @param obj Objeto con propiedades en camelCase
 * @returns Objeto con propiedades en snake_case
 */
function objectToSnakeCase(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = camelToSnakeCase(key);
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            result[snakeKey] = objectToSnakeCase(value);
        }
        else {
            result[snakeKey] = value;
        }
    }
    return result;
}
/**
 * Convierte un objeto con propiedades snake_case a camelCase
 * @param obj Objeto con propiedades en snake_case
 * @returns Objeto con propiedades en camelCase
 */
function objectToCamelCase(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = snakeToCamelCase(key);
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            result[camelKey] = objectToCamelCase(value);
        }
        else {
            result[camelKey] = value;
        }
    }
    return result;
}
/**
 * Convierte un array de objetos camelCase a snake_case
 * @param array Array de objetos con propiedades en camelCase
 * @returns Array de objetos con propiedades en snake_case
 */
function arrayToSnakeCase(array) {
    return array.map(obj => objectToSnakeCase(obj));
}
/**
 * Convierte un array de objetos snake_case a camelCase
 * @param array Array de objetos con propiedades en snake_case
 * @returns Array de objetos con propiedades en camelCase
 */
function arrayToCamelCase(array) {
    return array.map(obj => objectToCamelCase(obj));
}
/**
 * Clase utilitaria para transformaciones de nomenclatura
 * Proporciona métodos estáticos para conversiones comunes
 */
class NamingConverter {
    /**
     * Convierte propiedades de un objeto usando un mapeo personalizado
     * @param obj Objeto a transformar
     * @param mapping Mapeo de claves (clave_original -> clave_destino)
     * @returns Objeto con claves transformadas
     */
    static transformKeys(obj, mapping) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const newKey = mapping[key] || key;
            result[newKey] = value;
        }
        return result;
    }
    /**
     * Crea un mapeo automático de camelCase a snake_case para las claves de un objeto
     * @param obj Objeto de referencia
     * @returns Mapeo de claves
     */
    static createCamelToSnakeMapping(obj) {
        const mapping = {};
        for (const key of Object.keys(obj)) {
            mapping[key] = camelToSnakeCase(key);
        }
        return mapping;
    }
    /**
     * Crea un mapeo automático de snake_case a camelCase para las claves de un objeto
     * @param obj Objeto de referencia
     * @returns Mapeo de claves
     */
    static createSnakeToCamelMapping(obj) {
        const mapping = {};
        for (const key of Object.keys(obj)) {
            mapping[key] = snakeToCamelCase(key);
        }
        return mapping;
    }
}
exports.NamingConverter = NamingConverter;
/**
 * Función de utilidad para crear transformadores personalizados
 * @param fromFormat Formato de origen ('camel' | 'snake')
 * @param toFormat Formato de destino ('camel' | 'snake')
 * @returns Función transformadora
 */
function createTransformer(fromFormat, toFormat) {
    if (fromFormat === toFormat) {
        return (obj) => obj;
    }
    if (fromFormat === 'camel' && toFormat === 'snake') {
        return objectToSnakeCase;
    }
    if (fromFormat === 'snake' && toFormat === 'camel') {
        return objectToCamelCase;
    }
    throw new Error(`Transformación no soportada: ${fromFormat} -> ${toFormat}`);
}
