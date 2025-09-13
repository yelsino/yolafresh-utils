"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedidasConverter = void 0;
const enums_1 = require("./enums");
/**
 * Converter centralizado para todas las conversiones de medidas
 * Sigue principios SOLID y elimina duplicación de código
 */
class MedidasConverter {
    /**
     * Obtiene la abreviación de una medida según las opciones especificadas
     * @param tipoVenta - Tipo de venta/medida
     * @param options - Opciones de formateo
     * @returns Abreviación formateada
     */
    static getAbreviacion(tipoVenta, options = {}) {
        const config = this.MEDIDAS_CONFIG[tipoVenta];
        if (!config) {
            throw new Error(`Tipo de venta no soportado: ${tipoVenta}`);
        }
        if (options.abarrotes) {
            return config.abarrotes;
        }
        if (options.alternativa) {
            return config.alternativa;
        }
        return options.plural ? config.plural : config.singular;
    }
    /**
     * Obtiene el nombre completo para mostrar
     * @param tipoVenta - Tipo de venta/medida
     * @returns Nombre completo
     */
    static getDisplayName(tipoVenta) {
        const config = this.MEDIDAS_CONFIG[tipoVenta];
        if (!config) {
            throw new Error(`Tipo de venta no soportado: ${tipoVenta}`);
        }
        return config.display;
    }
    /**
     * Convierte una fracción numérica a su representación textual
     * @param valor - Valor numérico (ej: 250, 500, 750, 1000)
     * @returns Representación fraccionaria (ej: '1/4', '1/2', '3/4', '1')
     */
    static getFraccion(valor) {
        return this.FRACTION_MAP[valor] || null;
    }
    /**
     * Verifica si un tipo de venta es válido
     * @param tipoVenta - Tipo de venta a verificar
     * @returns true si es válido
     */
    static esValido(tipoVenta) {
        return tipoVenta in this.MEDIDAS_CONFIG;
    }
    /**
     * Obtiene todos los tipos de venta disponibles
     * @returns Array con todos los tipos de venta
     */
    static getTiposDisponibles() {
        return Object.keys(this.MEDIDAS_CONFIG);
    }
    /**
     * Obtiene la configuración completa de una medida
     * @param tipoVenta - Tipo de venta
     * @returns Configuración completa o null si no existe
     */
    static getConfig(tipoVenta) {
        return this.MEDIDAS_CONFIG[tipoVenta] || null;
    }
    /**
     * Formatea una cantidad con su unidad de medida
     * @param cantidad - Cantidad numérica
     * @param tipoVenta - Tipo de venta/medida
     * @param options - Opciones de formateo
     * @returns Texto formateado (ej: "2.5 kg", "3 unds")
     */
    static formatearCantidad(cantidad, tipoVenta, options = {}) {
        const abreviacion = this.getAbreviacion(tipoVenta, {
            ...options,
            plural: cantidad !== 1
        });
        return `${cantidad} ${abreviacion}`;
    }
}
exports.MedidasConverter = MedidasConverter;
/**
 * Configuración unificada de todas las medidas
 * Fuente única de verdad para todas las conversiones
 */
MedidasConverter.MEDIDAS_CONFIG = {
    [enums_1.TipoVentaEnum.Kilogramo]: {
        singular: 'kg',
        plural: 'kg',
        display: 'kilogramo',
        abarrotes: 'kg',
        alternativa: 'kg'
    },
    [enums_1.TipoVentaEnum.Unidad]: {
        singular: 'und',
        plural: 'unds',
        display: 'unidad',
        abarrotes: 'und',
        alternativa: 'und'
    },
    [enums_1.TipoVentaEnum.Saco]: {
        singular: 'saco',
        plural: 'sacos',
        display: 'saco',
        abarrotes: 'saco',
        alternativa: 'saco'
    },
    [enums_1.TipoVentaEnum.Docena]: {
        singular: 'docn',
        plural: 'docns',
        display: 'docena',
        abarrotes: '12 und',
        alternativa: '12 und'
    },
    [enums_1.TipoVentaEnum.Arroba]: {
        singular: 'arrb',
        plural: 'arrbs',
        display: 'arroba',
        abarrotes: '12 kg',
        alternativa: '12 kg'
    },
    [enums_1.TipoVentaEnum.Caja]: {
        singular: 'caja',
        plural: 'cajas',
        display: 'caja',
        abarrotes: 'caja',
        alternativa: 'caja'
    },
    [enums_1.TipoVentaEnum.Balde]: {
        singular: 'blde',
        plural: 'bldes',
        display: 'balde',
        abarrotes: 'balde',
        alternativa: 'balde'
    },
    [enums_1.TipoVentaEnum.Bolsa]: {
        singular: 'bols',
        plural: 'bols',
        display: 'bolsa',
        abarrotes: 'bols',
        alternativa: 'bols'
    },
    [enums_1.TipoVentaEnum.Paquete]: {
        singular: 'pqte',
        plural: 'pqts',
        display: 'paquete',
        abarrotes: 'pqte',
        alternativa: 'pqte'
    },
    [enums_1.TipoVentaEnum.Gramo]: {
        singular: 'gr',
        plural: 'grs',
        display: 'gramo',
        abarrotes: 'unidad',
        alternativa: 'gr'
    },
    [enums_1.TipoVentaEnum.Mililitro]: {
        singular: 'ml',
        plural: 'mls',
        display: 'mililitro',
        abarrotes: 'unidad',
        alternativa: 'ml'
    },
    [enums_1.TipoVentaEnum.Litro]: {
        singular: 'litr',
        plural: 'lts',
        display: 'litro',
        abarrotes: 'lt',
        alternativa: 'lt'
    },
    [enums_1.TipoVentaEnum.SixPack]: {
        singular: 'sixp',
        plural: 'sixpack',
        display: 'sixpack',
        abarrotes: 'sixpack',
        alternativa: '6 und'
    },
    [enums_1.TipoVentaEnum.Atado]: {
        singular: 'atad',
        plural: 'atados',
        display: 'atado',
        abarrotes: 'atad',
        alternativa: 'atad'
    }
};
/**
 * Mapa de fracciones para formateo especial
 */
MedidasConverter.FRACTION_MAP = {
    250: '1/4',
    500: '1/2',
    750: '3/4',
    1000: '1'
};
// Nota: MedidaConfig y FormatMedidaOptions ya están exportados arriba
