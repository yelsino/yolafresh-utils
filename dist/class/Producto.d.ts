import { EstadoStockEnum, TipoVentaEnum } from '../utils/enums';
import { IProducto } from '../interfaces/producto';
/**
 * Parámetros para formatear cantidades
 */
export interface FormatCantidadParams {
    cantidad: number;
    tipoVenta: TipoVentaEnum;
    mayoreo?: boolean;
    abreviado?: boolean;
    categoriaId?: string;
}
/**
 * Opciones para filtrar productos
 */
export interface ProductoFilters {
    sortBy?: string;
    sortOrder?: string;
    status?: boolean;
    categoria?: string;
    categorieId?: string;
    nombre?: string;
    precioMin?: number;
    precioMax?: number;
    fechaInicio?: string;
    fechaFin?: string;
}
/**
 * Clase Producto reutilizable que encapsula todas las operaciones complejas
 * relacionadas con productos de comercio electrónico
 */
export declare class Producto implements IProducto {
    id: string;
    idPrimario: string;
    mayoreo: boolean;
    cantidadParaDescuento: number;
    descuentoXCantidad: number;
    nombre: string;
    precio: number;
    status: boolean;
    url: string;
    categorieId: string;
    esPrimario: boolean;
    tipoVenta: TipoVentaEnum;
    fraccionable: boolean;
    titulo: string;
    consideraciones: string;
    caracteristicas: string;
    descripcion: string;
    peso: string;
    createdAt?: Date;
    updatedAt?: Date;
    stock: EstadoStockEnum;
    precioCompra: number;
    /**
     * Constructor de la clase Producto
     */
    constructor(data?: Partial<IProducto>);
    /**
     * Formatea la cantidad según el tipo de venta y configuraciones
     * Refactorizado para usar MedidasConverter y seguir principios SOLID
     */
    formatCantidad(params: FormatCantidadParams): string;
    /**
     * Calcula el precio con descuento por cantidad si aplica
     */
    calcularPrecioConDescuento(cantidad: number): number;
    /**
     * Calcula el margen de ganancia
     */
    calcularMargenGanancia(): number;
    /**
     * Verifica si el producto está disponible
     */
    estaDisponible(): boolean;
    /**
     * Verifica si el producto tiene stock bajo
     */
    tieneStockBajo(): boolean;
    /**
     * Verifica si el producto está sin stock
     */
    estaSinStock(): boolean;
    /**
     * Convierte el producto a formato JSON
     */
    toJSON(): IProducto;
    /**
     * Actualiza las propiedades del producto
     */
    actualizar(data: Partial<IProducto>): void;
    /**
     * Crea una instancia de Producto desde datos JSON
     */
    static fromJSON(data: IProducto): Producto;
    /**
     * Crea múltiples instancias de Producto desde un array de datos
     */
    static fromJSONArray(dataArray: IProducto[]): Producto[];
    /**
     * Filtra una lista de productos según los criterios especificados
     */
    static filtrarProductos(productos: Producto[], filtros: ProductoFilters): Producto[];
    /**
     * Busca productos por texto en múltiples campos
     */
    static buscarProductos(productos: Producto[], texto: string): Producto[];
    /**
     * Agrupa productos por categoría
     */
    static agruparPorCategoria(productos: Producto[]): {
        [categoriaId: string]: Producto[];
    };
    /**
     * Obtiene estadísticas de una lista de productos
     */
    static obtenerEstadisticas(productos: Producto[]): {
        total: number;
        activos: number;
        inactivos: number;
        conStock: number;
        sinStock: number;
        stockBajo: number;
        precioPromedio: number;
        precioMinimo: number;
        precioMaximo: number;
    };
    /**
     * Valida los datos del producto
     */
    validar(): {
        esValido: boolean;
        errores: string[];
    };
    /**
     * Convierte las propiedades del producto a snake_case para bases de datos
     * que requieren esta nomenclatura (ej: PostgreSQL, MySQL)
     */
    toSnakeCase(): Record<string, any>;
    /**
     * Convierte datos con nomenclatura snake_case a formato IProducto
     * @param data Objeto con propiedades en snake_case
     * @returns Objeto que implementa IProducto con propiedades en camelCase
     */
    static fromSnakeCase(data: Record<string, any>): IProducto;
    /**
     * Convierte un array de datos snake_case a objetos IProducto
     * @param dataArray Array de objetos con propiedades en snake_case
     * @returns Array de objetos que implementan IProducto
     */
    static fromSnakeCaseArray(dataArray: Record<string, any>[]): IProducto[];
    /**
     * Utilidad genérica para convertir propiedades camelCase a snake_case
     * Útil para otras clases que necesiten esta funcionalidad
     */
    static camelToSnakeCase(str: string): string;
    /**
     * Utilidad genérica para convertir propiedades snake_case a camelCase
     * Útil para otras clases que necesiten esta funcionalidad
     */
    static snakeToCamelCase(str: string): string;
    /**
     * Convierte un objeto completo de camelCase a snake_case
     */
    static objectToSnakeCase(obj: Record<string, any>): Record<string, any>;
    /**
     * Convierte un objeto completo de snake_case a camelCase
     */
    static objectToCamelCase(obj: Record<string, any>): Record<string, any>;
}
