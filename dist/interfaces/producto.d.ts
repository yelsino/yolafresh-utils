export type ImageSizes = {
    base: string;
    sizes: {
        small: string;
        medium: string;
        large: string;
    };
};
export declare enum TipoEmpaqueEnum {
    Saco = "sacos",
    Bolsa = "bolsas",
    Caja = "cajas",
    Balde = "baldes",
    Lata = "latas",
    BolsaVacio = "bolsa_vacio",
    Botella = "botellas",
    Paquete = "paquetes",
    Bandeja = "bandejas",
    Frasco = "frascos",
    Malla = "mallas",
    Blister = "blisters",
    TetraPack = "tetrapacks",
    SixPack = "sixpacks",
    Rollo = "rollos",
    Bidon = "bidones",
    Manojo = "manojos",
    Atado = "atados",
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
export interface ProductoPrecio {
    id: string;
    productoId: string;
    unidadVenta: UnidadMedidaEnum;
    precioVenta: number;
    precioMinimo?: number;
    precioMaximo?: number;
    vigenteDesde: string;
    vigenteHasta?: string;
    origen: "COMPRA" | "MANUAL" | "PROMOCION";
    activo: boolean;
    compraId?: string;
    compraItemId?: string;
    createdAt: Date;
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
