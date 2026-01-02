export type ImageSizes = {
    base: string;
    sizes: {
        small: string;
        medium: string;
        large: string;
    };
};
export declare enum TipoEmpaqueEnum {
    Saco = "saco",
    Bolsa = "bolsa",
    Caja = "caja",
    Balde = "balde",
    Lata = "lata",
    BolsaVacio = "bolsa_vacio",
    Botella = "botella",
    Paquete = "paquete",
    Bandeja = "bandeja",
    Frasco = "frasco",
    Malla = "malla",
    Blister = "blister",
    TetraPack = "tetrapack",
    SixPack = "sixpack",
    Rollo = "rollo",
    Bidon = "bidon",
    Manojo = "manojo",
    Atado = "atado",
    SinEmpaque = "sin_empaque"
}
export declare enum UnidadMedidaEnum {
    Unidad = "unidad",
    Gramo = "gramo",
    Kilogramo = "kilogramo",
    Mililitro = "mililitro",
    Litro = "litro",
    Libra = "libra",
    Onza = "onza",
    Arroba = "arroba",
    Docena = "docena",
    Quintal = "quintal",
    Tonelada = "tonelada",
    Metro = "metro",
    Centimetro = "centimetro",
    Galon = "galon",
    Saco = "saco",
    Bolsa = "bolsa",
    Porcion = "porcion"
}
export declare enum UnidadMedidaAbreviadoEnum {
    Unidad = "und",
    Gramo = "g",
    Kilogramo = "kg",
    Mililitro = "ml",
    Litro = "l",
    Libra = "lb",
    Onza = "oz",
    Arroba = "ar",
    Quintal = "qq",
    Tonelada = "t",
    Metro = "m",
    Centimetro = "cm",
    Galon = "gal",
    Docena = "docena",
    Saco = "saco",
    Bolsa = "bolsa",
    Porcion = "porcion"
}
export declare enum TipoVentaEnum {
    Unidad = "unidad",// se vende como 1 unidad física
    Peso = "peso",// se vende por kg/g/lb/etc
    Volumen = "volumen"
}
export interface IProducto {
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
}
export interface Categoria {
    id: string;
    nombre: string;
    tag: string;
    descripcion: string;
    icono: string;
    color: string;
    orden: number;
    activa: boolean;
    createdAt: Date;
    updatedAt: Date;
    subcategorias: string[];
    imagen: ImageSizes;
}
export interface BeneficiosProducto {
    id: string;
    title: string;
    descripcion: string;
    productoId: string;
}
export interface UsosCulinariosProducto {
    id: string;
    title: string;
    descripcion: string;
    productoId: string;
}
export interface Receta {
    id: string;
    nombre: string;
    descripcion: string;
    imagen: string;
    url: string;
    productos?: IProducto[];
}
export interface RecetasProducto {
    id: string;
    recetaId: string;
    productoId: string;
}
export interface ProductosSubCategoria {
    id: string;
    productoId: string;
    subcategoriaId: string;
}
