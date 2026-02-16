export type ImageSizes = {
  base: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
};

export enum TipoEmpaqueEnum {
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
  SinEmpaque = "sin_empaque",
}

export enum UnidadMedidaEnum {
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
  Porcion = "porcion",
}

export enum UnidadMedidaAbreviadoEnum {
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
  Porcion = "porcion",
}

export enum TipoVentaEnum {
  Unidad = "unidad", // se vende como 1 unidad física
  Peso = "peso", // se vende por kg/g/lb/etc
  Volumen = "volumen", // se vende por l/ml/etc
}

export interface IProducto {
  // Identificación
  id: string;
  sku?: string; // Código interno
  codigosAlternos?: string[]; // Códigos del proveedor
  codigoBarra?: string;

  // Relación con producto primario
  idPrimario: string; // "" si es primario
  esPrimario: boolean; // true = stock independiente
  factorConversion?: number; // Solo si es secundario

  // Descuentos
  mayoreo: boolean;
  cantidadParaDescuento: number;
  descuentoXCantidad: number;

  // Información general
  nombre: string;
  titulo: string;
  descripcion: string;
  consideraciones: string;
  caracteristicas: string;
  status: boolean; // Activo/inactivo
  url: ImageSizes;
  marca?: string;
  keywords?: string[];
  visibleEnPOS?: boolean;
  visibleOnline?: boolean;

  // Categorías
  categorieId: string;
  subcategorieId?: string;

  // Logística
  contenidoNeto: number; // Ej: 200
  unidadContenido: UnidadMedidaEnum; // Ej: g, ml, kg
  unidadMedida: UnidadMedidaEnum; // Unidad de venta
  tipoVenta: TipoVentaEnum; // unidad, peso, volumen, etc
  tipoEmpaque: TipoEmpaqueEnum; // lata, caja, frasco, bolsa…
  fraccionable: boolean;

  // Stock (solo primarios)
  stock?: number;

  // Precios
  precioVenta: number;
  precioCompra: number;

  // Impuestos
  aplicaIGV?: boolean;
  porcentajeIGV?: number;

  // Fechas
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductoPrecio {
  id: string;

  productoId: string;

  unidadVenta: UnidadMedidaEnum; // kg, unidad, litro
  precioVenta: number;

  precioMinimo?: number;
  precioMaximo?: number;

  vigenteDesde: string;
  vigenteHasta?: string;

  origen: "COMPRA" | "MANUAL" | "PROMOCION";

  activo: boolean;

  // 🔥 Relación real
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
