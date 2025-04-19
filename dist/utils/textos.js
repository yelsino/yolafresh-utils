"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertionMedidasAbarrotes = exports.normalizeUnit = exports.singularToAbbreviationv2 = exports.singularToAbbreviation = void 0;
exports.formatearNumero = formatearNumero;
exports.formatCantidad = formatCantidad;
exports.getCantidadNumerica = getCantidadNumerica;
exports.abreviarTipoVenta = abreviarTipoVenta;
exports.formatSolesPeruanos = formatSolesPeruanos;
exports.formatearFecha = formatearFecha;
exports.formatNameProduct = formatNameProduct;
exports.transformCloudinaryUrl = transformCloudinaryUrl;
exports.capitalizarPrimeraLetra = capitalizarPrimeraLetra;
exports.convertToNumber = convertToNumber;
exports.abreviarNombreCliente = abreviarNombreCliente;
exports.convertirPesoProducto = convertirPesoProducto;
exports.formatMedidaAbarrotes = formatMedidaAbarrotes;
const enums_1 = require("./enums");
function formatearNumero(numero) {
    if (numero >= 1000) {
        return numero.toString();
    }
    else {
        return numero.toString().padStart(3, '0');
    }
}
// 
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
    [enums_1.TipoVentaEnum.Atado]: 'atd',
};
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
    [enums_1.TipoVentaEnum.Atado]: 'atd',
};
const pluralToAbbreviation = {
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
    [enums_1.TipoVentaEnum.Atado]: 'atados',
};
function formatCantidad({ cantidad, tipoVenta, mayoreo = false, abreviado = false, categoriaId, }) {
    console.log(cantidad, tipoVenta, mayoreo, abreviado);
    const fractionMap = {
        250: '1/4',
        500: '1/2',
        750: '3/4',
        1000: '1'
    };
    // const convertionMedidasAbarrotes: { [key in TipoVentaEnum]: string } = {
    //   [TipoVentaEnum.Kilogramo]: 'kg',
    //   [TipoVentaEnum.Unidad]: 'und',
    //   [TipoVentaEnum.Saco]: 'saco',
    //   [TipoVentaEnum.Docena]: '12 und',
    //   [TipoVentaEnum.Arroba]: '12 kg',
    //   [TipoVentaEnum.Caja]: 'caja',
    //   [TipoVentaEnum.Balde]: 'balde',
    //   [TipoVentaEnum.Bolsa]: 'bols',
    //   [TipoVentaEnum.Paquete]: 'pqte',
    //   [TipoVentaEnum.Gramo]: 'unidad',
    //   [TipoVentaEnum.Mililitro]: 'unidad',
    //   [TipoVentaEnum.Litro]: 'lt',
    //   [TipoVentaEnum.SixPack]: 'sixpack',
    // };
    const formatearCantidadFraccionaria = (cantidad, tipoVenta) => {
        if (cantidad >= 1000) {
            const unidades = cantidad / 1000;
            const plural = categoriaId === "5" && tipoVenta
                ? exports.convertionMedidasAbarrotes[tipoVenta]
                : unidades >= 2 && tipoVenta
                    ? abreviado
                        ? pluralToAbbreviation[tipoVenta]
                        : tipoVenta
                    : abreviado
                        ? exports.singularToAbbreviation[tipoVenta]
                        : tipoVenta;
            // Formatear a dos decimales, eliminando ceros innecesarios al final
            return mayoreo
                ? `${unidades}`
                : `${unidades.toFixed(3).replace(/\.?0+$/, '')} ${plural}`;
        }
        else {
            const fraccion = fractionMap[cantidad];
            if (fraccion) {
                const unidad = categoriaId === "5" && tipoVenta
                    ? exports.convertionMedidasAbarrotes[tipoVenta]
                    : abreviado
                        ? exports.singularToAbbreviation[tipoVenta]
                        : tipoVenta;
                return mayoreo ? `${fraccion}` : `${fraccion} ${unidad}`;
            }
            const unidad = categoriaId === "5" && tipoVenta
                ? exports.convertionMedidasAbarrotes[tipoVenta]
                : abreviado
                    ? exports.singularToAbbreviation[tipoVenta]
                    : tipoVenta;
            return mayoreo ? `${cantidad}` : `${cantidad} ${unidad}`;
        }
    };
    if (tipoVenta === enums_1.TipoVentaEnum.Kilogramo) {
        if (cantidad < 1000) {
            const fraccion = fractionMap[cantidad];
            if (fraccion) {
                const unidad = categoriaId === "5"
                    ? exports.convertionMedidasAbarrotes[enums_1.TipoVentaEnum.Kilogramo]
                    : abreviado
                        ? exports.singularToAbbreviation[enums_1.TipoVentaEnum.Kilogramo]
                        : 'kg';
                return mayoreo ? `${fraccion}` : `${fraccion} ${unidad}`;
            }
            const unidad = categoriaId === "5"
                ? exports.convertionMedidasAbarrotes[enums_1.TipoVentaEnum.Gramo]
                : 'gr';
            return mayoreo ? `${cantidad}` : `${cantidad} ${unidad}`;
        }
        else {
            const kilogramos = cantidad / 1000;
            const unidad = categoriaId === "5"
                ? exports.convertionMedidasAbarrotes[enums_1.TipoVentaEnum.Kilogramo]
                : kilogramos === 1
                    ? abreviado
                        ? exports.singularToAbbreviation[enums_1.TipoVentaEnum.Kilogramo]
                        : 'kilogramo'
                    : abreviado
                        ? exports.singularToAbbreviation[enums_1.TipoVentaEnum.Kilogramo]
                        : 'kilogramos';
            // Formatear a dos decimales, eliminando ceros innecesarios al final
            return mayoreo
                ? `${kilogramos}`
                : `${kilogramos.toFixed(3).replace(/\.?0+$/, '')} ${unidad}`;
        }
    }
    return formatearCantidadFraccionaria(cantidad, tipoVenta);
}
function getCantidadNumerica({ cantidad }) {
    return cantidad >= 1000 ? cantidad / 1000 : cantidad;
}
function abreviarTipoVenta(texto, version) {
    // Seleccionar el mapa de abreviaciones según la versión
    const singularMap = version === 'version2' ? exports.singularToAbbreviationv2 : exports.singularToAbbreviation;
    const palabras = texto.split(' ');
    return palabras
        .map((palabra) => {
        const palabraLower = palabra.toLowerCase();
        // Revisa si la palabra coincide con un tipo de venta en singular
        for (const tipoVenta in enums_1.TipoVentaEnum) {
            if (palabraLower === enums_1.TipoVentaEnum[tipoVenta]) {
                return singularMap[enums_1.TipoVentaEnum[tipoVenta]];
            }
        }
        // Revisa si la palabra coincide con un tipo de venta en plural
        for (const tipoVenta in enums_1.TipoVentaEnum) {
            const plural = pluralToAbbreviation[enums_1.TipoVentaEnum[tipoVenta]].slice(0, -1) + 's';
            if (palabraLower === plural) {
                return pluralToAbbreviation[enums_1.TipoVentaEnum[tipoVenta]];
            }
        }
        // Si no hay coincidencia, retorna la palabra tal cual
        return palabra;
    })
        .join(' ');
}
function formatSolesPeruanos(amount, version) {
    const locales = 'es-PE'; // Locale para Perú
    // si quieres el redondeo
    const roundedAmount = roundAmount(amount);
    const options = {
        style: 'currency',
        currency: 'PEN', // Moneda peruana
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    };
    const formatter = new Intl.NumberFormat(locales, options);
    if (!version)
        return formatter.format(roundedAmount);
    const versionFormat = formatter.format(roundedAmount).replace(/^S\/\s?/, '');
    switch (version) {
        case 'version1':
            return `${versionFormat} PEN`;
        case 'version2':
            return `${versionFormat}`;
        default:
            return "";
    }
    // Formato estándar con "S/"
}
function roundAmount(amount) {
    const integerPart = Math.floor(amount);
    const decimalPart = amount - integerPart;
    // Redondear el decimal según las reglas
    let roundedDecimal;
    if (decimalPart < 0.05) {
        roundedDecimal = 0.00; // Redondear hacia abajo
    }
    else if (decimalPart >= 0.05 && decimalPart < 0.10) {
        roundedDecimal = 0.10; // Redondear hacia arriba al siguiente 0.10
    }
    else {
        roundedDecimal = Math.round(decimalPart * 10) / 10; // Redondear decimal al siguiente 0.10
    }
    return integerPart + roundedDecimal;
}
function formatearFecha(fecha) {
    console.log("FECHAS: ", fecha);
    if (!fecha)
        return "";
    // Si fecha es una cadena, conviértela a Date
    const formatDate = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const opciones = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    return formatDate.toLocaleDateString('es-PE', opciones);
}
function formatNameProduct(texto) {
    // 1. Convertir todo el texto a minúsculas
    let resultado = texto.toLowerCase();
    // 2. Reemplazar tildes
    const tildes = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'ni' };
    resultado = resultado.replace(/[áéíóúñ]/g, (match) => tildes[match]);
    // 3. Reemplazar espacios por guiones si hay más de una palabra
    resultado = resultado.split(' ').join('-');
    return resultado;
}
function transformCloudinaryUrl(url, width = 120, height = null, mode = "fill", background = "transparent" // Color de fondo configurable
) {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) {
        return url; // Retorna la URL original si no es válida
    }
    // Configura el parámetro del fondo
    const backgroundParam = mode === "pad" && background ? `,b_${background}` : "";
    // Inserta los parámetros de transformación
    const transformation = `c_${mode},w_${width}${height ? `,h_${height}` : ""},g_center${backgroundParam}/`;
    // Crea la nueva URL transformada
    return (url.slice(0, uploadIndex + 8) +
        transformation +
        url.slice(uploadIndex + 8));
}
const normalizeUnit = (unit) => {
    const unitNormalized = unit.toLowerCase();
    if (["kilo", "kilos", "kg", "kilogramo", "kilogramos"].includes(unitNormalized)) {
        return "kg";
    }
    else if (["gramo", "gramos", "g"].includes(unitNormalized)) {
        return "g";
    }
    else if (["unidad", "unidades"].includes(unitNormalized)) {
        return "unidad";
    }
    else if (["saco", "sacos"].includes(unitNormalized)) {
        return "saco";
    }
    else if (["docena", "docenas"].includes(unitNormalized)) {
        return "docena";
    }
    else if (["arroba", "arrobas"].includes(unitNormalized)) {
        return "arroba";
    }
    else if (["caja", "cajas"].includes(unitNormalized)) {
        return "caja";
    }
    else if (["balde", "baldes"].includes(unitNormalized)) {
        return "balde";
    }
    else if (["bolsa", "bolsas"].includes(unitNormalized)) {
        return "bolsa";
    }
    else if (["paquete", "paquetes"].includes(unitNormalized)) {
        return "paquete";
    }
    return unit; // Si no se encuentra, devolver la original
};
exports.normalizeUnit = normalizeUnit;
function capitalizarPrimeraLetra(texto) {
    if (!texto)
        return texto; // Maneja el caso de texto vacío o null
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}
function convertToNumber(text) {
    const numberMap = {
        "cero": 0, "uno": 1, "una": 1, "un": 1, "dos": 2, "tres": 3, "cuatro": 4,
        "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,
        "once": 11, "doce": 12, "trece": 13, "catorce": 14, "quince": 15,
        "dieciséis": 16, "dieciseis": 16, "diecisiete": 17, "dieciocho": 18,
        "diecinueve": 19, "veinte": 20, "veintiuno": 21, "veintidós": 22, "veintitrés": 23,
        "veinticuatro": 24, "veinticinco": 25, "veintiséis": 26, "veintisiete": 27,
        "veintiocho": 28, "veintinueve": 29, "treinta": 30, "cuarenta": 40,
        "cincuenta": 50, "sesenta": 60, "setenta": 70, "ochenta": 80, "noventa": 90,
        "cien": 100
    };
    text = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (numberMap[text] !== undefined) {
        return numberMap[text];
    }
    else if (!isNaN(text)) {
        return parseInt(text, 10);
    }
    else if (text.startsWith("veinti")) {
        const unit = text.slice(6);
        return 20 + convertToNumber(unit);
    }
    else if (text.includes("y")) {
        const parts = text.split("y");
        return convertToNumber(parts[0].trim()) + convertToNumber(parts[1].trim());
    }
    else {
        return 0;
    }
}
function abreviarNombreCliente(nombreCompleto, maxCaracteres = 20) {
    // Retornar sin cambios si no supera el límite
    if (nombreCompleto.length <= maxCaracteres) {
        return nombreCompleto;
    }
    const palabras = nombreCompleto.trim().split(/\s+/);
    let resultado = palabras[0]; // Primer nombre siempre completo
    for (let i = 1; i < palabras.length; i++) {
        const palabra = palabras[i];
        const conPalabraCompleta = resultado + " " + palabra;
        const palabraAbreviada = palabra[0] + "."; // Versión abreviada
        if (conPalabraCompleta.length <= maxCaracteres) {
            // Si cabe completa, agregarla
            resultado = conPalabraCompleta;
        }
        else {
            // Si no cabe completa, probar con la abreviada
            const conPalabraAbreviada = resultado + " " + palabraAbreviada;
            if (conPalabraAbreviada.length <= maxCaracteres) {
                resultado = conPalabraAbreviada;
            }
            else {
                // Si ni abreviada cabe, no agregar esta palabra
                break;
            }
        }
    }
    return resultado;
}
function convertirPesoProducto(peso) {
    // Si el peso es entero, regresa el peso sin convertir
    if (Number.isInteger(peso))
        return peso;
    // De lo contrario, convierte el peso a gramos multiplicando por 1000
    return peso * 1000;
}
// export function formatMedidaAbarrotes(peso: number, tipoVenta: string): string {
//   const formatos: Record<string, { factor: number; unidad: string }> = {
//     gramos: { factor: 1000, unidad: 'gr' },
//     kilogramos: { factor: 1, unidad: 'kg' },
//     mililitros: { factor: 1000, unidad: 'ml' },
//     litros: { factor: 1, unidad: 'l' },
//     unidad: { factor: 1, unidad: 'unds' },
//   };
//   const formato = formatos[tipoVenta.toLowerCase()];
//   if (!formato) {
//     return `${peso} ${tipoVenta}`;
//   }
//   const pesoFormateado = peso * formato.factor;
//   return `${pesoFormateado}${formato.unidad}`;
// }
exports.convertionMedidasAbarrotes = {
    [enums_1.TipoVentaEnum.Kilogramo]: 'kg',
    [enums_1.TipoVentaEnum.Unidad]: 'und',
    [enums_1.TipoVentaEnum.Saco]: 'saco',
    [enums_1.TipoVentaEnum.Docena]: '12 und',
    [enums_1.TipoVentaEnum.Arroba]: '12 kg',
    [enums_1.TipoVentaEnum.Caja]: 'caja',
    [enums_1.TipoVentaEnum.Balde]: 'balde',
    [enums_1.TipoVentaEnum.Bolsa]: 'bols',
    [enums_1.TipoVentaEnum.Paquete]: 'pqte',
    [enums_1.TipoVentaEnum.Gramo]: 'unidad',
    [enums_1.TipoVentaEnum.Mililitro]: 'unidad',
    [enums_1.TipoVentaEnum.Litro]: 'lt',
    [enums_1.TipoVentaEnum.SixPack]: 'sixpack',
    [enums_1.TipoVentaEnum.Atado]: 'atd',
};
function formatMedidaAbarrotes(tipoVenta, categoriaId) {
    // Si no es la categoría específica (ej: categoríaId = 5) o es Kilogramo, devolvemos sólo el tipo en minúsculas
    if (categoriaId !== "5" || tipoVenta === enums_1.TipoVentaEnum.Kilogramo) {
        return tipoVenta.toLowerCase();
    }
    const conversion = exports.convertionMedidasAbarrotes[tipoVenta];
    if (!conversion) {
        // Si no existe conversión, devolvemos el tipo original en minúsculas
        return tipoVenta.toLowerCase();
    }
    // Verificar si la conversión inicia con un número (ej: "12 und", "6 und", "12 kg")
    // Ya que no tenemos 'cantidad', no multiplicamos nada.
    // Simplemente devolvemos la unidad (el texto después del número).
    const match = conversion.match(/^(\d+)\s*(.*)$/);
    if (match) {
        const unit = match[2].trim();
        // Devolvemos únicamente la unidad sin cantidad (ni multiplicación)
        return unit;
    }
    // Si no hay número, sólo devolver la abreviación
    return conversion;
}
