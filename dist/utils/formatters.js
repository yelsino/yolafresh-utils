"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluralToAbbreviation = exports.singularToAbbreviationv2 = exports.singularToAbbreviation = void 0;
exports.formatearNumero = formatearNumero;
exports.formatSolesPeruanos = formatSolesPeruanos;
exports.roundAmount = roundAmount;
exports.capitalizarPrimeraLetra = capitalizarPrimeraLetra;
exports.convertToNumber = convertToNumber;
exports.abreviarNombreCliente = abreviarNombreCliente;
exports.formatNameProduct = formatNameProduct;
exports.normalizeUnit = normalizeUnit;
const enums_1 = require("./enums");
/**
 * Formatea un número a un formato específico
 * @param numero - Número a formatear
 * @returns Número formateado como string
 */
function formatearNumero(numero) {
    if (numero >= 1000) {
        return numero.toString();
    }
    else {
        return numero.toString().padStart(3, '0');
    }
}
/**
 * Mapeo de tipos de venta a sus abreviaciones en singular
 */
exports.singularToAbbreviation = {
    [enums_1.TipoVentaEnum.Kilogramo]: 'kg',
    [enums_1.TipoVentaEnum.Unidad]: 'und',
    [enums_1.TipoVentaEnum.Saco]: 'saco',
    [enums_1.TipoVentaEnum.Docena]: 'docn',
    [enums_1.TipoVentaEnum.Arroba]: 'arrb',
    [enums_1.TipoVentaEnum.Caja]: 'caja',
    [enums_1.TipoVentaEnum.Balde]: 'blde',
    [enums_1.TipoVentaEnum.Bolsa]: 'bols',
    [enums_1.TipoVentaEnum.Paquete]: 'pqte',
    [enums_1.TipoVentaEnum.Litro]: 'litr',
    [enums_1.TipoVentaEnum.Gramo]: 'gr',
    [enums_1.TipoVentaEnum.Mililitro]: 'ml',
    [enums_1.TipoVentaEnum.SixPack]: 'sixpack',
};
/**
 * Versión alternativa de mapeo de tipos de venta a sus abreviaciones
 */
exports.singularToAbbreviationv2 = {
    [enums_1.TipoVentaEnum.Kilogramo]: 'kg',
    [enums_1.TipoVentaEnum.Unidad]: 'und',
    [enums_1.TipoVentaEnum.Saco]: 'saco',
    [enums_1.TipoVentaEnum.Docena]: '12 und',
    [enums_1.TipoVentaEnum.Arroba]: '12 kg',
    [enums_1.TipoVentaEnum.Caja]: 'caja',
    [enums_1.TipoVentaEnum.Balde]: 'balde',
    [enums_1.TipoVentaEnum.Bolsa]: 'bols',
    [enums_1.TipoVentaEnum.Paquete]: 'pqte',
    [enums_1.TipoVentaEnum.Gramo]: 'gr',
    [enums_1.TipoVentaEnum.Mililitro]: 'ml',
    [enums_1.TipoVentaEnum.Litro]: 'lt',
    [enums_1.TipoVentaEnum.SixPack]: '6 und',
};
/**
 * Mapeo de tipos de venta a sus abreviaciones en plural
 */
exports.pluralToAbbreviation = {
    [enums_1.TipoVentaEnum.Kilogramo]: 'kg',
    [enums_1.TipoVentaEnum.Unidad]: 'unds',
    [enums_1.TipoVentaEnum.Saco]: 'sacos',
    [enums_1.TipoVentaEnum.Docena]: 'docns',
    [enums_1.TipoVentaEnum.Arroba]: 'arrbs',
    [enums_1.TipoVentaEnum.Caja]: 'cajas',
    [enums_1.TipoVentaEnum.Balde]: 'bldes',
    [enums_1.TipoVentaEnum.Bolsa]: 'bols',
    [enums_1.TipoVentaEnum.Paquete]: 'pqts',
    [enums_1.TipoVentaEnum.Gramo]: 'grs',
    [enums_1.TipoVentaEnum.Mililitro]: 'mls',
    [enums_1.TipoVentaEnum.Litro]: 'lts',
    [enums_1.TipoVentaEnum.SixPack]: 'sixpack',
};
/**
 * Formatea un monto a soles peruanos
 * @param amount - Monto a formatear
 * @param version - Versión del formato (opcional)
 * @returns Monto formateado en soles peruanos
 */
function formatSolesPeruanos(amount, version) {
    // Redondear el monto a dos decimales
    const roundedAmount = Math.round(amount * 100) / 100;
    // Formatear el número con separadores de miles y dos decimales
    const formatter = new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    // Obtener el monto formateado
    let formattedAmount = formatter.format(roundedAmount);
    // Ajustar según la versión
    if (version === 'version2') {
        formattedAmount = formattedAmount.replace('PEN', 'S/');
    }
    else {
        formattedAmount = formattedAmount.replace('PEN', 'S/.');
    }
    return formattedAmount;
}
/**
 * Redondea un monto a dos decimales
 * @param amount - Monto a redondear
 * @returns Monto redondeado
 */
function roundAmount(amount) {
    return Math.round(amount * 100) / 100;
}
/**
 * Capitaliza la primera letra de un texto
 * @param texto - Texto a capitalizar
 * @returns Texto con la primera letra en mayúscula
 */
function capitalizarPrimeraLetra(texto) {
    if (!texto)
        return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}
/**
 * Convierte un texto a número
 * @param text - Texto a convertir
 * @returns Número convertido o 0 si no es válido
 */
function convertToNumber(text) {
    if (text === null || text === undefined) {
        return 0;
    }
    if (typeof text === 'number') {
        return text;
    }
    if (typeof text === 'string') {
        // Eliminar caracteres no numéricos excepto el punto decimal
        const cleanedText = text.replace(/[^\d.]/g, '');
        // Si no hay nada que convertir, devolver 0
        if (!cleanedText) {
            return 0;
        }
        // Intentar convertir a número
        const num = parseFloat(cleanedText);
        // Verificar si es un número válido
        if (isNaN(num)) {
            return 0;
        }
        return num;
    }
    return 0;
}
/**
 * Abrevia el nombre de un cliente
 * @param nombreCompleto - Nombre completo del cliente
 * @param maxCaracteres - Máximo de caracteres permitidos
 * @returns Nombre abreviado
 */
function abreviarNombreCliente(nombreCompleto, maxCaracteres = 20) {
    if (!nombreCompleto) {
        return '';
    }
    // Si el nombre ya es más corto que el máximo, devolverlo tal cual
    if (nombreCompleto.length <= maxCaracteres) {
        return nombreCompleto;
    }
    // Dividir el nombre en palabras
    const palabras = nombreCompleto.split(' ');
    // Si solo hay una palabra, truncarla
    if (palabras.length === 1) {
        return palabras[0].substring(0, maxCaracteres - 3) + '...';
    }
    // Obtener la primera palabra completa
    let resultado = palabras[0];
    // Añadir iniciales de las palabras restantes
    for (let i = 1; i < palabras.length; i++) {
        if (palabras[i].length > 0) {
            resultado += ' ' + palabras[i][0] + '.';
        }
    }
    // Si aún es demasiado largo, truncarlo
    if (resultado.length > maxCaracteres) {
        resultado = resultado.substring(0, maxCaracteres - 3) + '...';
    }
    return resultado;
}
/**
 * Formatea el nombre de un producto
 * @param texto - Nombre del producto
 * @returns Nombre formateado
 */
function formatNameProduct(texto) {
    if (!texto)
        return '';
    // Dividir el texto en palabras
    const palabras = texto.split(' ');
    // Capitalizar cada palabra
    const palabrasCapitalizadas = palabras.map(palabra => {
        if (palabra.length === 0)
            return '';
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    });
    // Unir las palabras capitalizadas
    return palabrasCapitalizadas.join(' ');
}
/**
 * Normaliza una unidad de medida
 * @param unit - Unidad a normalizar
 * @returns Unidad normalizada
 */
function normalizeUnit(unit) {
    if (!unit)
        return '';
    const unitLower = unit.toLowerCase().trim();
    // Mapeo de unidades comunes a su forma normalizada
    const unitMap = {
        'kg': 'kg',
        'kilo': 'kg',
        'kilos': 'kg',
        'kilogramo': 'kg',
        'kilogramos': 'kg',
        'g': 'g',
        'gr': 'g',
        'gramo': 'g',
        'gramos': 'g',
        'l': 'l',
        'lt': 'l',
        'litro': 'l',
        'litros': 'l',
        'ml': 'ml',
        'mililitro': 'ml',
        'mililitros': 'ml',
        'u': 'und',
        'un': 'und',
        'und': 'und',
        'unidad': 'und',
        'unidades': 'und'
    };
    return unitMap[unitLower] || unitLower;
}
