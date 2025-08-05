/**
 * Yola Fresh Utils - Sistema POS Reutilizable
 * 
 * @description Librería completa para sistemas de punto de venta
 * con soporte para múltiples países y configuraciones fiscales
 * 
 * @author Tu Nombre
 * @version 1.0.0
 * @license MIT
 * 
 * @example
 * ```typescript
 * import { ShoppingCart, CONFIGURACIONES_FISCALES } from 'yola-fresh-utils';
 * 
 * // Crear carrito para Perú
 * const carrito = ShoppingCart.paraPeru('cart-001', 'Mesa 5');
 * 
 * // Agregar productos
 * carrito.agregarProducto({
 *   id: 'item-001',
 *   product: { id: 'prod-001', nombre: 'Manzana', precio: 5.50 },
 *   quantity: 2
 * });
 * 
 * console.log(carrito.total); // Total con IGV incluido
 * ```
 */

// Re-export all types for better discoverability
export * from './src/class/ShoppingCart';
export * from './src/class/Venta';
export * from './src/interfaces';
export * from './src/utils';
export * from './src/data';

// Provide global type definitions for common patterns
declare global {
  /**
   * Configuraciones fiscales globales disponibles
   */
  namespace YolaFresh {
    /**
     * Países soportados con configuración fiscal predefinida
     */
    type PaisesSoportados = 'PERU' | 'MEXICO' | 'COLOMBIA' | 'ARGENTINA' | 'ESPANA';
    
    /**
     * Tipos de sistemas POS soportados
     */
    type SistemasPOS = 'restaurant' | 'retail' | 'ecommerce' | 'servicios';
    
    /**
     * Configuración rápida para diferentes tipos de negocio
     */
    interface ConfiguracionNegocio {
      pais: PaisesSoportados;
      tipoSistema: SistemasPOS;
      aplicaImpuestos: boolean;
      manejaInventario: boolean;
      requireClientes: boolean;
    }
  }
}

/**
 * Helpers globales para configuración rápida
 */
declare module 'yola-fresh-utils' {
  /**
   * Configuración rápida para diferentes tipos de negocio
   * 
   * @example
   * ```typescript
   * import { configuracionRapida } from 'yola-fresh-utils';
   * 
   * const config = configuracionRapida.restaurant.peru();
   * const carrito = new ShoppingCart('cart-001', config.fiscal);
   * ```
   */
  export const configuracionRapida: {
    restaurant: {
      peru(): YolaFresh.ConfiguracionNegocio;
      mexico(): YolaFresh.ConfiguracionNegocio;
      sinImpuestos(): YolaFresh.ConfiguracionNegocio;
    };
    retail: {
      peru(): YolaFresh.ConfiguracionNegocio;
      mexico(): YolaFresh.ConfiguracionNegocio;
      colombia(): YolaFresh.ConfiguracionNegocio;
    };
    ecommerce: {
      multiPais(): YolaFresh.ConfiguracionNegocio;
    };
  };
}