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

/**
 * Representa el producto genérico o conceptual dentro del catálogo.
 * 
 * Ejemplos:
 * - Papa blanca
 * - Arroz extra
 * - Aceite vegetal
 * 
 * El ProductoBase define características comunes del producto,
 * pero NO representa algo vendible directamente. Las ventas se
 * realizan mediante sus "Presentaciones".
 */
export interface ProductoBase {
  id: string;
  type: "producto_base";
  nombre: string;
  descripcion?: string;
  /** Consideraciones de uso, almacenamiento o manipulación. */
  consideraciones?: string;
  marca?: string;
  /**
   * Unidad base interna usada para inventario.
   * 
   * Ejemplo:
   * - kilogramo
   * - litro
   * - unidad
   * 
   * Todo el stock del sistema se calcula en esta unidad.
   */
  unidadBaseInterna: UnidadBaseInterna;
  categoriaId: string;
  imagen: ImageSizes;
  /** Palabras clave para búsqueda rápida en el POS o catálogo. */
  keywords?: string[];
  /** Indica si el producto está afecto al IGV. */
  aplicaIGV: boolean;
  /** Porcentaje de IGV aplicado (ej: 18). */
  porcentajeIGV: number;
  /** Indica si el producto está activo en el sistema. */
  activo: boolean;

  /** Timestamp de creación del registro. */
  createdAt: number;
  /** Timestamp de última actualización. */
  updatedAt: number;
}

/**
 * Representa una forma específica de vender un ProductoBase.
 * 
 * Ejemplos:
 * - Papa por kilogramo
 * - Papa saco 60kg
 * - Aceite botella 900ml
 * - Caja x12 cervezas
 * 
 * Cada presentación define:
 * - forma de venta
 * - contenido
 * - precio
 * - equivalencia con la unidad base de inventario
 */
export interface Presentacion {
  id: string;

  /** Tipo de documento para persistencia (CouchDB / NoSQL). */
  type: "presentacion";
  productoBaseId: string; // id de la base
  nombre: string;

  /** SKU interno opcional para control logístico. */
  sku?: string;
  codigoBarra?: string;
  /** Códigos alternos (otros códigos de proveedor o empaques). */
  codigosAlternos?: string[];

  /** Precio de venta actual de la presentación. */
  precioVenta?: number;
  tipoVenta: TipoVentaEnum;

  /**
   * Cantidad física del contenido.
   * 
   * Ejemplos:
   * - 5
   * - 500
   * - 12
   */
  contenidoNeto: number;

  /**
   * Unidad física del contenido.
   * 
   * Ejemplos:
   * - kilogramo
   * - gramo
   * - litro
   * - mililitro
   * - unidad
   */
  unidadContenido: UnidadMedidaEnum;

  /**
   * Equivalencia de esta presentación respecto a la unidad base interna.
   * 
   * Permite convertir cualquier venta al sistema de inventario.
   * 
   * Ejemplos:
   * - Bolsa arroz 5kg → 5
   * - Botella 500ml (base litro) → 0.5
   * - Caja x12 botellas 1L → 12
   */
  equivalenciaUnidadBase: number;
  /**
   * Indica si la presentación puede venderse en fracciones.
   * 
   * Ejemplo:
   * - papa por kilo → true
   * - botella sellada → false
   */
  fraccionable: boolean;
  tipoEmpaque?: TipoEmpaqueEnum;
  visibleEnPOS: boolean;
  visibleOnline: boolean;
  /** Precio de compra referencial usado como guía para compras. */
  precioCompraReferencial?: number;
  imagen?: ImageSizes;
  /** Indica si esta presentación maneja precios por mayoreo. */
  mayoreo?: boolean;
  /** Cantidad mínima requerida para aplicar descuento por volumen. */
  cantidadParaDescuento?: number;
  /** Porcentaje o monto de descuento aplicado al alcanzar la cantidad. */
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
  type: "categoria";
  parentId: string; 
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




export interface Categoria {
  id: string;
  type: "categoria";
  parentId: string;
  nombre: string;
}

[
  {
    id: "1",
    type: "categoria",
    parentId: "", 
    nombre: "Alimentos frescos",
  },
  {
    id: "2",
    type: "categoria",
    parentId: "1",
    nombre: "Categoría 2",
  },
  {
    id: "3",
    type: "categoria",
    parentId: "2",
    nombre: "Subcategoría 1.1",
  },
]