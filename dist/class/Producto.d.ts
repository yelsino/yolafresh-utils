import { IProducto, ImageSizes, TipoEmpaqueEnum, TipoVentaEnum, UnidadMedidaEnum } from '../interfaces/producto';
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
 * Clase Producto - Implementación de la nueva estructura IProducto
 */
export declare class Producto implements IProducto {
    id: string;
    sku?: string;
    codigosAlternos?: string[];
    codigoBarra?: string;
    idPrimario: string;
    esPrimario: boolean;
    factorConversion?: number;
    mayoreo: boolean;
    cantidadParaDescuento: number;
    descuentoXCantidad: number;
    nombre: string;
    titulo: string;
    descripcion: string;
    consideraciones: string;
    caracteristicas: string;
    status: boolean;
    url: ImageSizes;
    marca?: string;
    keywords?: string[];
    visibleEnPOS?: boolean;
    visibleOnline?: boolean;
    categorieId: string;
    subcategorieId?: string;
    contenidoNeto: number;
    unidadContenido: UnidadMedidaEnum;
    unidadMedida: UnidadMedidaEnum;
    tipoVenta: TipoVentaEnum;
    tipoEmpaque: TipoEmpaqueEnum;
    fraccionable: boolean;
    stock?: number;
    precioVenta: number;
    precioCompra: number;
    aplicaIGV?: boolean;
    porcentajeIGV?: number;
    createdAt: Date;
    updatedAt: Date;
    constructor(data?: Partial<IProducto>);
    /**
     * Normaliza una entrada (string | ImageSizes | undefined) a ImageSizes
     */
    private static toProductImage;
    /**
     * Calcula el precio con descuento por cantidad si aplica
     */
    calcularPrecioConDescuento(cantidad: number): number;
    /**
     * Calcula el margen de ganancia
     */
    calcularMargenGanancia(): number;
    /**
     * Verifica si el producto tiene stock bajo
     */
    tieneStockBajo(limite?: number): boolean;
    /**
     * Verifica si el producto está sin stock
     */
    estaSinStock(): boolean;
    /**
     * Convierte a JSON
     */
    toJSON(): IProducto;
    static fromJSON(data: IProducto): Producto;
    static fromJSONArray(dataArray: IProducto[]): Producto[];
    /**
     * Busca productos por texto
     */
    static buscarProductos(productos: Producto[], texto: string): Producto[];
    /**
     * Agrupa productos por categoría
     */
    static agruparPorCategoria(productos: Producto[]): {
        [categoriaId: string]: Producto[];
    };
    /**
     * Convierte snake_case a camelCase (IProducto)
     */
    static fromSnakeCase(data: any): IProducto;
    /**
     * Convierte a snake_case
     */
    toSnakeCase(): any;
}
