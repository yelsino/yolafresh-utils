"use strict";
/**
 * Configuraciones fiscales predefinidas para diferentes países
 * Facilita la reutilización en múltiples proyectos
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracionFiscalFactory = exports.FiscalUtils = exports.CONFIGURACIONES_FISCALES = void 0;
/**
 * Configuraciones fiscales por país
 */
exports.CONFIGURACIONES_FISCALES = {
    // **LATINOAMÉRICA**
    PERU: {
        tasaImpuesto: 0.18,
        aplicaImpuesto: true,
        nombreImpuesto: 'IGV'
    },
    MEXICO: {
        tasaImpuesto: 0.16,
        aplicaImpuesto: true,
        nombreImpuesto: 'IVA'
    },
    COLOMBIA: {
        tasaImpuesto: 0.19,
        aplicaImpuesto: true,
        nombreImpuesto: 'IVA'
    },
    ARGENTINA: {
        tasaImpuesto: 0.21,
        aplicaImpuesto: true,
        nombreImpuesto: 'IVA'
    },
    CHILE: {
        tasaImpuesto: 0.19,
        aplicaImpuesto: true,
        nombreImpuesto: 'IVA'
    },
    ECUADOR: {
        tasaImpuesto: 0.12,
        aplicaImpuesto: true,
        nombreImpuesto: 'IVA'
    },
    // **EUROPA**
    ESPANA: {
        tasaImpuesto: 0.21,
        aplicaImpuesto: true,
        nombreImpuesto: 'IVA'
    },
    // **NORTEAMÉRICA**
    USA_CALIFORNIA: {
        tasaImpuesto: 0.0725, // Promedio de California
        aplicaImpuesto: true,
        nombreImpuesto: 'Sales Tax'
    },
    // **SIN IMPUESTOS**
    SIN_IMPUESTOS: {
        tasaImpuesto: 0,
        aplicaImpuesto: false,
        nombreImpuesto: 'Sin Impuesto'
    },
    // **PERSONALIZABLE**
    PERSONALIZADO: (tasa, nombre = 'Impuesto') => ({
        tasaImpuesto: Math.max(0, Math.min(1, tasa)),
        aplicaImpuesto: tasa > 0,
        nombreImpuesto: nombre
    })
};
/**
 * Utilidades para trabajar con configuraciones fiscales
 */
class FiscalUtils {
    /**
     * Calcular impuesto sobre una base imponible
     */
    static calcularImpuesto(baseImponible, configuracion) {
        if (!configuracion.aplicaImpuesto || !configuracion.tasaImpuesto) {
            return 0;
        }
        return Math.round(baseImponible * configuracion.tasaImpuesto * 100) / 100;
    }
    /**
     * Calcular total con impuesto
     */
    static calcularTotalConImpuesto(subtotal, configuracion) {
        const impuesto = this.calcularImpuesto(subtotal, configuracion);
        return Math.round((subtotal + impuesto) * 100) / 100;
    }
    /**
     * Validar configuración fiscal
     */
    static validarConfiguracion(configuracion) {
        var _a;
        const errores = [];
        if (configuracion.aplicaImpuesto) {
            if (configuracion.tasaImpuesto === undefined || configuracion.tasaImpuesto === null) {
                errores.push('Tasa de impuesto es requerida cuando aplicaImpuesto es true');
            }
            else if (configuracion.tasaImpuesto < 0 || configuracion.tasaImpuesto > 1) {
                errores.push('Tasa de impuesto debe estar entre 0 y 1');
            }
            if (!((_a = configuracion.nombreImpuesto) === null || _a === void 0 ? void 0 : _a.trim())) {
                errores.push('Nombre de impuesto es requerido cuando aplicaImpuesto es true');
            }
        }
        return {
            valida: errores.length === 0,
            errores
        };
    }
    /**
     * Formatear porcentaje de impuesto para mostrar
     */
    static formatearPorcentaje(configuracion) {
        if (!configuracion.aplicaImpuesto || !configuracion.tasaImpuesto) {
            return 'Sin impuesto';
        }
        const porcentaje = (configuracion.tasaImpuesto * 100).toFixed(2);
        return `${configuracion.nombreImpuesto} ${porcentaje}%`;
    }
}
exports.FiscalUtils = FiscalUtils;
/**
 * Factory para crear configuraciones fiscales comunes
 */
class ConfiguracionFiscalFactory {
    /**
     * Crear configuración para un país específico
     */
    static paraPais(pais) {
        const config = exports.CONFIGURACIONES_FISCALES[pais];
        if (!config) {
            throw new Error(`Configuración fiscal no encontrada para: ${pais}`);
        }
        return { ...config };
    }
    /**
     * Crear configuración personalizada
     */
    static personalizada(tasa, nombre = 'Impuesto') {
        return exports.CONFIGURACIONES_FISCALES.PERSONALIZADO(tasa, nombre);
    }
    /**
     * Crear configuración sin impuestos
     */
    static sinImpuestos() {
        return { ...exports.CONFIGURACIONES_FISCALES.SIN_IMPUESTOS };
    }
    /**
     * Listar países disponibles
     */
    static paisesDisponibles() {
        return Object.keys(exports.CONFIGURACIONES_FISCALES).filter(key => key !== 'PERSONALIZADO');
    }
}
exports.ConfiguracionFiscalFactory = ConfiguracionFiscalFactory;
