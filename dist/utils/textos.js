"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singularToAbbreviationv2 = exports.singularToAbbreviation = exports.abbreviations = void 0;
exports.formatearNumero = formatearNumero;
exports.formatCantidad = formatCantidad;
exports.getCantidadNumerica = getCantidadNumerica;
exports.formatSolesPeruanos = formatSolesPeruanos;
exports.capitalizarPrimeraLetra = capitalizarPrimeraLetra;
exports.formatearFecha = formatearFecha;
const producto_1 = require("../interfaces/producto");
function formatearNumero(numero) {
    if (numero >= 1000) {
        return numero.toString();
    }
    else {
        return numero.toString().padStart(3, '0');
    }
}
exports.abbreviations = {
    [producto_1.UnidadMedidaEnum.Unidad]: 'und',
    [producto_1.UnidadMedidaEnum.Gramo]: 'g',
    [producto_1.UnidadMedidaEnum.Kilogramo]: 'kg',
    [producto_1.UnidadMedidaEnum.Mililitro]: 'ml',
    [producto_1.UnidadMedidaEnum.Litro]: 'l',
    [producto_1.UnidadMedidaEnum.Libra]: 'lb',
    [producto_1.UnidadMedidaEnum.Onza]: 'oz',
    [producto_1.UnidadMedidaEnum.Arroba]: 'arr',
    [producto_1.UnidadMedidaEnum.Quintal]: 'qq',
    [producto_1.UnidadMedidaEnum.Tonelada]: 't',
    [producto_1.UnidadMedidaEnum.Metro]: 'm',
    [producto_1.UnidadMedidaEnum.Centimetro]: 'cm',
    [producto_1.UnidadMedidaEnum.Galon]: 'gal',
    [producto_1.UnidadMedidaEnum.Saco]: 'saco',
    [producto_1.UnidadMedidaEnum.Bolsa]: 'bolsa',
    [producto_1.UnidadMedidaEnum.Porcion]: 'porción',
};
// Compatibilidad con código antiguo que use estos mapas
exports.singularToAbbreviation = exports.abbreviations;
exports.singularToAbbreviationv2 = exports.abbreviations;
function formatCantidad({ cantidad, tipoVenta, unidadMedida, mayoreo = false, abreviado = false, categoriaId, }) {
    // Si tenemos unidadMedida, usémosla
    if (unidadMedida) {
        const unitStr = exports.abbreviations[unidadMedida] || unidadMedida;
        if (mayoreo)
            return `${cantidad}`;
        return `${cantidad} ${unitStr}`;
    }
    // Fallback para lógica antigua si unidadMedida no está presente (aunque debería)
    if (tipoVenta === producto_1.TipoVentaEnum.Peso) {
        return `${cantidad} kg`;
    }
    if (tipoVenta === producto_1.TipoVentaEnum.Volumen) {
        return `${cantidad} l`;
    }
    return `${cantidad} und`;
}
function getCantidadNumerica({ cantidad }) {
    // Asumimos que la cantidad ya viene en la unidad base correcta en el nuevo sistema
    return cantidad;
}
// Mapa para convertir valores decimales a fracciones simbólicas para version3
const decimalToSymbolicFraction = {
    0.25: '¼',
    0.5: '½',
    0.75: '¾',
};
function formatSolesPeruanos(monto, version = 'version1') {
    if (monto === null || monto === undefined)
        return 'S/ 0.00';
    // Redondear a 2 decimales
    const montoRedondeado = Math.round(monto * 100) / 100;
    if (version === 'version1') {
        return `S/ ${montoRedondeado.toFixed(2)}`;
    }
    else if (version === 'version2') {
        return `S/. ${montoRedondeado.toFixed(2)}`;
    }
    else {
        // version3: lógica de fracciones si aplica (ej: 0.50 -> 1/2)
        // Aquí simplificado
        return `S/ ${montoRedondeado.toFixed(2)}`;
    }
}
function capitalizarPrimeraLetra(texto) {
    if (!texto)
        return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}
function formatearFecha(fecha) {
    if (!fecha)
        return '';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
