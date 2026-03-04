export type ImageSizes = {
  base: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
};

export enum UnidadMedidaEnum {
  Unidad = "unidad",
  Gramo = "gramo",
  Kilogramo = "kilogramo",
  Mililitro = "mililitro",
  Litro = "litro",
  Libra = "libra",
  Onza = "onza",
  Saco = "saco",
  Bolsa = "bolsa",
  Arroba = "arroba",
  Quintal = "quintal",
  Porcion = "porcion",
  Docena = "docena",
  Tonelada = "tonelada",
  Metro = "metro",
  Centimetro = "centimetro",
  Galon = "galon",
}

export enum UnidadMedidaAbreviadoEnum {
  Unidad = "und",
  Gramo = "g",
  Kilogramo = "kg",
  Mililitro = "ml",
  Litro = "l",
  Libra = "lb",
  Onza = "oz",
  Saco = "saco",
  Bolsa = "bolsa",
  Arroba = "arr",
  Quintal = "qq",
  Porcion = "porc",
  Docena = "doc",
  Tonelada = "t",
  Metro = "m",
  Centimetro = "cm",
  Galon = "gal",
}

export enum TipoEmpaqueEnum {
  Saco = "saco",
  Bolsa = "bolsa",
  Caja = "caja",
  Balde = "balde",
  Lata = "lata",
  Botella = "botella",
  Paquete = "paquete",
  Bandeja = "bandeja",
  Frasco = "frasco",
  Malla = "malla",
  Blister = "blister",
  TetraPack = "tetrapack",
  SixPack = "sixpack",
  Bidon = "bidon",
  Manojo = "manojo",
  Atado = "atado",
  SinEmpaque = "sin_empaque",
}

export enum TipoVentaEnum {
  Unidad = "unidad", // se vende como unidad física
  Peso = "peso", // se vende por peso
  Volumen = "volumen", // se vende por volumen
}

export type UnidadBaseInterna = "kilogramo" | "litro" | "unidad";

export interface ProductoBase {
  id: string;
  type: "producto_base";

  nombre: string;
  descripcion?: string;
  // caracteristicas?: string;
  consideraciones?: string;
  marca?: string;

  unidadBaseInterna: UnidadBaseInterna;
  categoriaId: string;

  imagen: ImageSizes;

  keywords?: string[]; 

  aplicaIGV: boolean;
  porcentajeIGV: number;

  activo: boolean;

  createdAt: number;
  updatedAt: number;
}

export interface Presentacion {
  id: string;
  type: "presentacion";

  productoBaseId: string;

  nombre: string;

  sku?: string;
  codigoBarra?: string;
  codigosAlternos?: string[];
  precioVenta?: number;

  tipoVenta: TipoVentaEnum;

  contenidoNeto: number;

  unidadContenido: UnidadMedidaEnum;

  /**
   * ¿Cuántas unidades base representa ESTA presentación?
   * Ej:
   * - Bolsa 5kg arroz → 5
   * - Botella 500ml → 0.5
   * - Caja x12 botellas 1L → 12
   */
  equivalenciaUnidadBase: number;

  fraccionable: boolean;

  tipoEmpaque?: TipoEmpaqueEnum;

  visibleEnPOS: boolean;
  visibleOnline: boolean;

  precioCompraReferencial?: number;

  activo: boolean;
  imagen?: ImageSizes;

  cantidadParaDescuento?: number;
  descuentoXCantidad?: number;

  createdAt: number;
  updatedAt: number;
}

export interface ProductoPrecio {
  id: string;

  presentacionId: string;

  precioVenta: number;

  precioMinimo?: number;
  precioMaximo?: number;

  vigenteDesde: number;
  vigenteHasta?: number;

  origen: "COMPRA" | "MANUAL" | "PROMOCION";

  activo: boolean;

  compraId?: string;
  compraItemId?: string;

  createdAt: number;
}

export interface Categoria {
  id: string;

  nombre: string;
  tag: string;
  descripcion?: string;

  icono?: string;
  color?: string;

  orden: number;

  activa: boolean;

  subcategorias?: string[];

  imagen?: ImageSizes;

  createdAt: number;
  updatedAt: number;
}

export interface Receta {
  id: string;

  nombre: string;
  descripcion: string;

  imagen: string;
  url?: string;

  createdAt: number;
}

export interface RecetaProducto {
  id: string;

  recetaId: string;
  productoBaseId: string;

  cantidadRequerida: number;
  unidad: UnidadMedidaEnum;
}

export interface ProductoConPresentacionesDTO {
  producto: ProductoBase;
  presentaciones: Presentacion[];
}
