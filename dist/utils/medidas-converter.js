"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedidasConverter = void 0;
const producto_1 = require("../interfaces/producto");
/**
 * Converter centralizado para todas las conversiones de medidas
 * Adaptado para UnidadMedidaEnum
 */
class MedidasConverter {
    /**
     * Obtiene la abreviación de una medida según las opciones especificadas
     */
    static getAbreviacion(unidad, options = {}) {
        const config = this.MEDIDAS_CONFIG[unidad];
        if (!config) {
            return unidad; // Fallback
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
     */
    static getDisplayName(unidad) {
        const config = this.MEDIDAS_CONFIG[unidad];
        if (!config) {
            return unidad;
        }
        return config.display;
    }
    /**
     * Convierte una fracción numérica a su representación textual
     */
    static getFraccion(valor) {
        return this.FRACTION_MAP[valor] || null;
    }
}
exports.MedidasConverter = MedidasConverter;
/**
 * Configuración unificada de todas las medidas
 */
MedidasConverter.MEDIDAS_CONFIG = {
    [producto_1.UnidadMedidaEnum.Kilogramo]: {
        singular: 'kg',
        plural: 'kg',
        display: 'kilogramo',
        abarrotes: 'kg',
        alternativa: 'kg'
    },
    [producto_1.UnidadMedidaEnum.Unidad]: {
        singular: 'und',
        plural: 'unds',
        display: 'unidad',
        abarrotes: 'und',
        alternativa: 'und'
    },
    [producto_1.UnidadMedidaEnum.Saco]: {
        singular: 'saco',
        plural: 'sacos',
        display: 'saco',
        abarrotes: 'saco',
        alternativa: 'saco'
    },
    [producto_1.UnidadMedidaEnum.Arroba]: {
        singular: 'arrb',
        plural: 'arrbs',
        display: 'arroba',
        abarrotes: '12 kg',
        alternativa: '12 kg'
    },
    [producto_1.UnidadMedidaEnum.Galon]: {
        singular: 'gal',
        plural: 'gal',
        display: 'galón',
        abarrotes: 'gal',
        alternativa: 'gal'
    },
    [producto_1.UnidadMedidaEnum.Bolsa]: {
        singular: 'bols',
        plural: 'bols',
        display: 'bolsa',
        abarrotes: 'bols',
        alternativa: 'bols'
    },
    [producto_1.UnidadMedidaEnum.Gramo]: {
        singular: 'gr',
        plural: 'grs',
        display: 'gramo',
        abarrotes: 'unidad',
        alternativa: 'gr'
    },
    [producto_1.UnidadMedidaEnum.Mililitro]: {
        singular: 'ml',
        plural: 'mls',
        display: 'mililitro',
        abarrotes: 'unidad',
        alternativa: 'ml'
    },
    [producto_1.UnidadMedidaEnum.Litro]: {
        singular: 'litr',
        plural: 'lts',
        display: 'litro',
        abarrotes: 'lt',
        alternativa: 'lt'
    },
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
