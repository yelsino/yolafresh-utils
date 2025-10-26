"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Producto = void 0;
const enums_1 = require("../utils/enums");
const medidas_converter_1 = require("../utils/medidas-converter");
/**
 * Clase Producto reutilizable que encapsula todas las operaciones complejas
 * relacionadas con productos de comercio electrónico
 */
class Producto {
    /**
     * Constructor de la clase Producto
     */
    constructor(data = {}) {
        this.id = data.id || '';
        this.idPrimario = data.idPrimario || '';
        this.mayoreo = data.mayoreo || false;
        this.cantidadParaDescuento = data.cantidadParaDescuento || 0;
        this.descuentoXCantidad = data.descuentoXCantidad || 0;
        this.nombre = data.nombre || '';
        this.precio = data.precio || 0;
        this.status = data.status !== undefined ? data.status : true;
        this.url = Producto.toProductImage(data.url);
        this.categorieId = data.categorieId || '';
        this.esPrimario = data.esPrimario || false;
        this.tipoVenta = data.tipoVenta || enums_1.TipoVentaEnum.Unidad;
        this.fraccionable = data.fraccionable || false;
        this.titulo = data.titulo || '';
        this.consideraciones = data.consideraciones || '';
        this.caracteristicas = data.caracteristicas || '';
        this.descripcion = data.descripcion || '';
        this.peso = Producto.toPesoNumber(data.peso);
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.stock = data.stock || enums_1.EstadoStockEnum.STOCK_MEDIO;
        this.precioCompra = data.precioCompra || 0;
    }
    /**
     * Formatea la cantidad según el tipo de venta y configuraciones
     * Refactorizado para usar MedidasConverter y seguir principios SOLID
     */
    formatCantidad(params) {
        const { cantidad, tipoVenta, mayoreo = false, abreviado = false, categoriaId } = params;
        // Si es solo para mayoreo, devolver solo el número
        if (mayoreo) {
            if (tipoVenta === enums_1.TipoVentaEnum.Kilogramo && cantidad >= 1000) {
                const kilogramos = cantidad / 1000;
                return kilogramos.toFixed(3).replace(/\.?0+$/, '');
            }
            const fraccion = medidas_converter_1.MedidasConverter.getFraccion(cantidad);
            return fraccion || cantidad.toString();
        }
        // Determinar opciones de formateo
        const formatOptions = {
            abreviado,
            abarrotes: false, // Configuración genérica - sin dependencia a categorías específicas
            plural: cantidad !== 1
        };
        // Manejo especial para kilogramos
        if (tipoVenta === enums_1.TipoVentaEnum.Kilogramo) {
            if (cantidad < 1000) {
                // Verificar si es una fracción conocida
                const fraccion = medidas_converter_1.MedidasConverter.getFraccion(cantidad);
                if (fraccion) {
                    const unidad = medidas_converter_1.MedidasConverter.getAbreviacion(enums_1.TipoVentaEnum.Kilogramo, formatOptions);
                    return `${fraccion} ${unidad}`;
                }
                // Mostrar en gramos para cantidades menores a 1kg
                const unidad = medidas_converter_1.MedidasConverter.getAbreviacion(enums_1.TipoVentaEnum.Gramo, formatOptions);
                return `${cantidad} ${unidad}`;
            }
            else {
                // Convertir a kilogramos
                const kilogramos = cantidad / 1000;
                const unidad = medidas_converter_1.MedidasConverter.getAbreviacion(enums_1.TipoVentaEnum.Kilogramo, {
                    ...formatOptions,
                    plural: kilogramos !== 1
                });
                return `${kilogramos.toFixed(3).replace(/\.?0+$/, '')} ${unidad}`;
            }
        }
        // Manejo para otros tipos de venta
        if (cantidad >= 1000) {
            const unidades = cantidad / 1000;
            const unidad = medidas_converter_1.MedidasConverter.getAbreviacion(tipoVenta, {
                ...formatOptions,
                plural: unidades >= 2
            });
            return `${unidades.toFixed(3).replace(/\.?0+$/, '')} ${unidad}`;
        }
        // Verificar si es una fracción conocida
        const fraccion = medidas_converter_1.MedidasConverter.getFraccion(cantidad);
        if (fraccion) {
            const unidad = medidas_converter_1.MedidasConverter.getAbreviacion(tipoVenta, formatOptions);
            return `${fraccion} ${unidad}`;
        }
        // Formato estándar
        const unidad = medidas_converter_1.MedidasConverter.getAbreviacion(tipoVenta, formatOptions);
        return `${cantidad} ${unidad}`;
    }
    /**
     * Calcula el precio con descuento por cantidad si aplica
     */
    calcularPrecioConDescuento(cantidad) {
        if (this.cantidadParaDescuento > 0 && cantidad >= this.cantidadParaDescuento) {
            const descuento = (this.precio * this.descuentoXCantidad) / 100;
            return this.precio - descuento;
        }
        return this.precio;
    }
    /**
     * Calcula el margen de ganancia
     */
    calcularMargenGanancia() {
        if (this.precioCompra <= 0)
            return 0;
        return ((this.precio - this.precioCompra) / this.precioCompra) * 100;
    }
    /**
     * Verifica si el producto está disponible
     */
    estaDisponible() {
        return this.status && this.stock !== enums_1.EstadoStockEnum.STOCK_AGOTADO;
    }
    /**
     * Verifica si el producto tiene stock bajo
     */
    tieneStockBajo() {
        return this.stock === enums_1.EstadoStockEnum.STOCK_BAJO;
    }
    /**
     * Verifica si el producto está sin stock
     */
    estaSinStock() {
        return this.stock === enums_1.EstadoStockEnum.STOCK_AGOTADO;
    }
    // Método getImagenOptimizada eliminado - dependencia específica a Cloudinary removida
    /**
     * Convierte el producto a formato JSON
     */
    toJSON() {
        return {
            id: this.id,
            idPrimario: this.idPrimario,
            mayoreo: this.mayoreo,
            cantidadParaDescuento: this.cantidadParaDescuento,
            descuentoXCantidad: this.descuentoXCantidad,
            nombre: this.nombre,
            precio: this.precio,
            status: this.status,
            url: this.url,
            categorieId: this.categorieId,
            esPrimario: this.esPrimario,
            tipoVenta: this.tipoVenta,
            fraccionable: this.fraccionable,
            titulo: this.titulo,
            consideraciones: this.consideraciones,
            caracteristicas: this.caracteristicas,
            descripcion: this.descripcion,
            peso: this.peso,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            stock: this.stock,
            precioCompra: this.precioCompra,
        };
    }
    /**
     * Actualiza las propiedades del producto
     */
    actualizar(data) {
        Object.assign(this, data);
        this.updatedAt = new Date();
    }
    /**
     * Crea una instancia de Producto desde datos JSON
     */
    static fromJSON(data) {
        return new Producto(data);
    }
    /**
     * Crea múltiples instancias de Producto desde un array de datos
     */
    static fromJSONArray(dataArray) {
        return dataArray.map(data => Producto.fromJSON(data));
    }
    /**
     * Filtra una lista de productos según los criterios especificados
     */
    static filtrarProductos(productos, filtros) {
        let resultado = [...productos];
        // Filtrar por status
        if (filtros.status !== undefined) {
            resultado = resultado.filter(p => p.status === filtros.status);
        }
        // Filtrar por categoría
        if (filtros.categoria || filtros.categorieId) {
            const categoriaId = filtros.categoria || filtros.categorieId;
            resultado = resultado.filter(p => p.categorieId === categoriaId);
        }
        // Filtrar por nombre
        if (filtros.nombre) {
            const nombreLower = filtros.nombre.toLowerCase();
            resultado = resultado.filter(p => p.nombre.toLowerCase().includes(nombreLower) ||
                p.titulo.toLowerCase().includes(nombreLower) ||
                p.descripcion.toLowerCase().includes(nombreLower));
        }
        // Filtrar por rango de precios
        if (filtros.precioMin !== undefined) {
            resultado = resultado.filter(p => p.precio >= filtros.precioMin);
        }
        if (filtros.precioMax !== undefined) {
            resultado = resultado.filter(p => p.precio <= filtros.precioMax);
        }
        // Filtrar por fechas
        if (filtros.fechaInicio) {
            const fechaInicio = new Date(filtros.fechaInicio);
            resultado = resultado.filter(p => p.createdAt && p.createdAt >= fechaInicio);
        }
        if (filtros.fechaFin) {
            const fechaFin = new Date(filtros.fechaFin);
            resultado = resultado.filter(p => p.createdAt && p.createdAt <= fechaFin);
        }
        // Ordenar resultados
        if (filtros.sortBy) {
            resultado.sort((a, b) => {
                const aValue = a[filtros.sortBy];
                const bValue = b[filtros.sortBy];
                if (filtros.sortOrder === 'desc') {
                    return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
                }
                else {
                    return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                }
            });
        }
        return resultado;
    }
    /**
     * Busca productos por texto en múltiples campos
     */
    static buscarProductos(productos, texto) {
        if (!texto.trim())
            return productos;
        const textoLower = texto.toLowerCase();
        return productos.filter(p => p.nombre.toLowerCase().includes(textoLower) ||
            p.titulo.toLowerCase().includes(textoLower) ||
            p.descripcion.toLowerCase().includes(textoLower) ||
            p.caracteristicas.toLowerCase().includes(textoLower) ||
            p.consideraciones.toLowerCase().includes(textoLower));
    }
    /**
     * Agrupa productos por categoría
     */
    static agruparPorCategoria(productos) {
        return productos.reduce((grupos, producto) => {
            const categoriaId = producto.categorieId || 'sin_categoria';
            if (!grupos[categoriaId]) {
                grupos[categoriaId] = [];
            }
            grupos[categoriaId].push(producto);
            return grupos;
        }, {});
    }
    /**
     * Obtiene estadísticas de una lista de productos
     */
    static obtenerEstadisticas(productos) {
        const total = productos.length;
        const activos = productos.filter(p => p.status).length;
        const inactivos = total - activos;
        const conStock = productos.filter(p => p.stock !== enums_1.EstadoStockEnum.STOCK_AGOTADO).length;
        const sinStock = productos.filter(p => p.stock === enums_1.EstadoStockEnum.STOCK_AGOTADO).length;
        const stockBajo = productos.filter(p => p.stock === enums_1.EstadoStockEnum.STOCK_BAJO).length;
        const precios = productos.filter(p => p.precio > 0).map(p => p.precio);
        const precioPromedio = precios.length > 0 ? precios.reduce((a, b) => a + b, 0) / precios.length : 0;
        const precioMinimo = precios.length > 0 ? Math.min(...precios) : 0;
        const precioMaximo = precios.length > 0 ? Math.max(...precios) : 0;
        return {
            total,
            activos,
            inactivos,
            conStock,
            sinStock,
            stockBajo,
            precioPromedio,
            precioMinimo,
            precioMaximo
        };
    }
    /**
     * Valida los datos del producto
     */
    validar() {
        const errores = [];
        if (!this.nombre.trim()) {
            errores.push('El nombre es requerido');
        }
        if (this.precio < 0) {
            errores.push('El precio no puede ser negativo');
        }
        if (this.precioCompra < 0) {
            errores.push('El precio de compra no puede ser negativo');
        }
        if (this.cantidadParaDescuento < 0) {
            errores.push('La cantidad para descuento no puede ser negativa');
        }
        if (this.descuentoXCantidad < 0 || this.descuentoXCantidad > 100) {
            errores.push('El descuento por cantidad debe estar entre 0 y 100');
        }
        return {
            esValido: errores.length === 0,
            errores
        };
    }
    /**
     * Convierte las propiedades del producto a snake_case para bases de datos
     * que requieren esta nomenclatura (ej: PostgreSQL, MySQL)
     */
    toSnakeCase() {
        return {
            id: this.id,
            id_primario: this.idPrimario,
            mayoreo: this.mayoreo,
            cantidad_para_descuento: this.cantidadParaDescuento,
            descuento_x_cantidad: this.descuentoXCantidad,
            nombre: this.nombre,
            precio: this.precio,
            status: this.status,
            url: this.url,
            categorie_id: this.categorieId,
            es_primario: this.esPrimario,
            tipo_venta: this.tipoVenta,
            fraccionable: this.fraccionable,
            titulo: this.titulo,
            consideraciones: this.consideraciones,
            caracteristicas: this.caracteristicas,
            descripcion: this.descripcion,
            peso: this.peso,
            fecha_creacion: this.createdAt,
            fecha_actualizacion: this.updatedAt,
            stock: this.stock,
            precio_compra: this.precioCompra,
        };
    }
    /**
     * Convierte datos con nomenclatura snake_case a formato IProducto
     * @param data Objeto con propiedades en snake_case
     * @returns Objeto que implementa IProducto con propiedades en camelCase
     */
    static fromSnakeCase(data) {
        return {
            id: data.id,
            idPrimario: data.id_primario,
            mayoreo: data.mayoreo,
            cantidadParaDescuento: data.cantidad_para_descuento,
            descuentoXCantidad: data.descuento_x_cantidad,
            nombre: data.nombre,
            precio: data.precio,
            status: data.status,
            url: Producto.toProductImage(data.url),
            categorieId: data.categorie_id,
            esPrimario: data.es_primario,
            tipoVenta: data.tipo_venta,
            fraccionable: data.fraccionable,
            titulo: data.titulo,
            consideraciones: data.consideraciones,
            caracteristicas: data.caracteristicas,
            descripcion: data.descripcion,
            peso: Producto.toPesoNumber(data.peso),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            stock: data.stock,
            precioCompra: data.precio_compra,
        };
    }
    /**
     * Convierte un array de datos snake_case a objetos IProducto
     * @param dataArray Array de objetos con propiedades en snake_case
     * @returns Array de objetos que implementan IProducto
     */
    static fromSnakeCaseArray(dataArray) {
        return dataArray.map(data => Producto.fromSnakeCase(data));
    }
    /**
     * Utilidad genérica para convertir propiedades camelCase a snake_case
     * Útil para otras clases que necesiten esta funcionalidad
     */
    static camelToSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    /**
     * Utilidad genérica para convertir propiedades snake_case a camelCase
     * Útil para otras clases que necesiten esta funcionalidad
     */
    static snakeToCamelCase(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    /**
     * Convierte un objeto completo de camelCase a snake_case
     */
    static objectToSnakeCase(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const snakeKey = Producto.camelToSnakeCase(key);
            result[snakeKey] = value;
        }
        return result;
    }
    /**
     * Convierte un objeto completo de snake_case a camelCase
     */
    static objectToCamelCase(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const camelKey = Producto.snakeToCamelCase(key);
            result[camelKey] = value;
        }
        return result;
    }
    /**
     * Normaliza una entrada (string | ProductImage | undefined) a ProductImage
     * Mantiene compatibilidad con datos antiguos donde url era string
     */
    static toProductImage(val) {
        if (typeof val === 'string') {
            return { base: val, sizes: { small: val, medium: val, large: val } };
        }
        if (Producto.isValidProductImage(val)) {
            return val;
        }
        return { base: '', sizes: { small: '', medium: '', large: '' } };
    }
    static toPesoNumber(val) {
        if (typeof val === 'number')
            return val;
        if (typeof val === 'string') {
            const n = parseFloat(val.replace(',', '.'));
            return Number.isFinite(n) ? n : 0;
        }
        return 0;
    }
    static isValidProductImage(val) {
        if (typeof val !== 'object' || val === null)
            return false;
        const obj = val;
        const baseOk = typeof obj.base === 'string';
        const sizes = obj.sizes;
        const sizesOk = !!sizes && typeof sizes.small === 'string' && typeof sizes.medium === 'string' && typeof sizes.large === 'string';
        return baseOk && sizesOk;
    }
}
exports.Producto = Producto;
