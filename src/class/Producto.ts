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
export class Producto implements IProducto {
  // Identificación
  id: string;
  sku?: string;
  codigosAlternos?: string[];
  codigoBarra?: string;

  // Relación con producto primario
  idPrimario: string;
  esPrimario: boolean;
  factorConversion?: number;

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
  status: boolean;
  url: ImageSizes;
  marca?: string;
  keywords?: string[];
  visibleEnPOS?: boolean;
  visibleOnline?: boolean;

  // Categorías
  categorieId: string;
  subcategorieId?: string;

  // Logística
  contenidoNeto: number;
  unidadContenido: UnidadMedidaEnum;
  unidadMedida: UnidadMedidaEnum;
  tipoVenta: TipoVentaEnum;
  tipoEmpaque: TipoEmpaqueEnum;
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

  constructor(data: Partial<IProducto> = {}) {
    this.id = data.id || '';
    this.sku = data.sku;
    this.codigosAlternos = data.codigosAlternos;
    this.codigoBarra = data.codigoBarra;

    this.idPrimario = data.idPrimario || '';
    this.esPrimario = data.esPrimario || false;
    this.factorConversion = data.factorConversion;

    this.mayoreo = data.mayoreo || false;
    this.cantidadParaDescuento = data.cantidadParaDescuento || 0;
    this.descuentoXCantidad = data.descuentoXCantidad || 0;

    this.nombre = data.nombre || '';
    this.titulo = data.titulo || '';
    this.descripcion = data.descripcion || '';
    this.consideraciones = data.consideraciones || '';
    this.caracteristicas = data.caracteristicas || '';
    this.status = data.status !== undefined ? data.status : true;
    this.url = Producto.toProductImage(data.url);
    this.marca = data.marca;
    this.keywords = data.keywords;
    this.visibleEnPOS = data.visibleEnPOS;
    this.visibleOnline = data.visibleOnline;

    this.categorieId = data.categorieId || '';
    this.subcategorieId = data.subcategorieId;

    this.contenidoNeto = data.contenidoNeto || 0;
    this.unidadContenido = data.unidadContenido || UnidadMedidaEnum.Unidad;
    this.unidadMedida = data.unidadMedida || UnidadMedidaEnum.Unidad;
    this.tipoVenta = data.tipoVenta || TipoVentaEnum.Unidad;
    this.tipoEmpaque = data.tipoEmpaque || TipoEmpaqueEnum.SinEmpaque;
    this.fraccionable = data.fraccionable || false;

    this.stock = data.stock;

    this.precioVenta = data.precioVenta || 0;
    this.precioCompra = data.precioCompra || 0;

    this.aplicaIGV = data.aplicaIGV;
    this.porcentajeIGV = data.porcentajeIGV;

    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Normaliza una entrada (string | ImageSizes | undefined) a ImageSizes
   */
  private static toProductImage(val: ImageSizes | string | undefined): ImageSizes {
    if (typeof val === 'string') {
      return { base: val, sizes: { small: val, medium: val, large: val } };
    }
    if (val && typeof val === 'object' && 'base' in val) {
      return val as ImageSizes;
    }
    return { base: '', sizes: { small: '', medium: '', large: '' } };
  }

  /**
   * Calcula el precio con descuento por cantidad si aplica
   */
  calcularPrecioConDescuento(cantidad: number): number {
    if (this.cantidadParaDescuento > 0 && cantidad >= this.cantidadParaDescuento) {
      const descuento = (this.precioVenta * this.descuentoXCantidad) / 100;
      return this.precioVenta - descuento;
    }
    return this.precioVenta;
  }

  /**
   * Calcula el margen de ganancia
   */
  calcularMargenGanancia(): number {
    if (this.precioCompra <= 0) return 0;
    return ((this.precioVenta - this.precioCompra) / this.precioCompra) * 100;
  }

  /**
   * Verifica si el producto tiene stock bajo
   */
  tieneStockBajo(limite: number = 5): boolean {
    return (this.stock || 0) <= limite && (this.stock || 0) > 0;
  }

  /**
   * Verifica si el producto está sin stock
   */
  estaSinStock(): boolean {
    return (this.stock || 0) <= 0;
  }

  /**
   * Convierte a JSON
   */
  toJSON(): IProducto {
    return {
      id: this.id,
      sku: this.sku,
      codigosAlternos: this.codigosAlternos,
      codigoBarra: this.codigoBarra,
      idPrimario: this.idPrimario,
      esPrimario: this.esPrimario,
      factorConversion: this.factorConversion,
      mayoreo: this.mayoreo,
      cantidadParaDescuento: this.cantidadParaDescuento,
      descuentoXCantidad: this.descuentoXCantidad,
      nombre: this.nombre,
      titulo: this.titulo,
      descripcion: this.descripcion,
      consideraciones: this.consideraciones,
      caracteristicas: this.caracteristicas,
      status: this.status,
      url: this.url,
      marca: this.marca,
      keywords: this.keywords,
      visibleEnPOS: this.visibleEnPOS,
      visibleOnline: this.visibleOnline,
      categorieId: this.categorieId,
      subcategorieId: this.subcategorieId,
      contenidoNeto: this.contenidoNeto,
      unidadContenido: this.unidadContenido,
      unidadMedida: this.unidadMedida,
      tipoVenta: this.tipoVenta,
      tipoEmpaque: this.tipoEmpaque,
      fraccionable: this.fraccionable,
      stock: this.stock,
      precioVenta: this.precioVenta,
      precioCompra: this.precioCompra,
      aplicaIGV: this.aplicaIGV,
      porcentajeIGV: this.porcentajeIGV,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(data: IProducto): Producto {
    return new Producto(data);
  }

  static fromJSONArray(dataArray: IProducto[]): Producto[] {
    return dataArray.map(data => Producto.fromJSON(data));
  }

  /**
   * Busca productos por texto
   */
  static buscarProductos(productos: Producto[], texto: string): Producto[] {
    if (!texto.trim()) return productos;
    
    const textoLower = texto.toLowerCase();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(textoLower) ||
      p.titulo.toLowerCase().includes(textoLower) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(textoLower)) ||
      (p.sku && p.sku.toLowerCase().includes(textoLower)) ||
      (p.codigoBarra && p.codigoBarra.includes(textoLower))
    );
  }

  /**
   * Agrupa productos por categoría
   */
  static agruparPorCategoria(productos: Producto[]): { [categoriaId: string]: Producto[] } {
    return productos.reduce((grupos, producto) => {
      const categoriaId = producto.categorieId || 'sin_categoria';
      if (!grupos[categoriaId]) {
        grupos[categoriaId] = [];
      }
      grupos[categoriaId].push(producto);
      return grupos;
    }, {} as { [categoriaId: string]: Producto[] });
  }

  /**
   * Convierte snake_case a camelCase (IProducto)
   */
  static fromSnakeCase(data: any): IProducto {
    return {
      id: data.id,
      sku: data.sku,
      codigosAlternos: data.codigos_alternos ? JSON.parse(data.codigos_alternos) : [],
      codigoBarra: data.codigo_barra,
      idPrimario: data.id_primario,
      esPrimario: data.es_primario,
      factorConversion: data.factor_conversion,
      mayoreo: data.mayoreo,
      cantidadParaDescuento: data.cantidad_para_descuento,
      descuentoXCantidad: data.descuento_x_cantidad,
      nombre: data.nombre,
      titulo: data.titulo,
      descripcion: data.descripcion,
      consideraciones: data.consideraciones,
      caracteristicas: data.caracteristicas,
      status: data.status,
      url: typeof data.url === 'string' ? JSON.parse(data.url) : data.url,
      marca: data.marca,
      keywords: data.keywords ? JSON.parse(data.keywords) : [],
      visibleEnPOS: data.visible_en_pos,
      visibleOnline: data.visible_online,
      categorieId: data.categorie_id,
      subcategorieId: data.subcategorie_id,
      contenidoNeto: data.contenido_neto,
      unidadContenido: data.unidad_contenido,
      unidadMedida: data.unidad_medida,
      tipoVenta: data.tipo_venta,
      tipoEmpaque: data.tipo_empaque,
      fraccionable: data.fraccionable,
      stock: data.stock,
      precioVenta: data.precio_venta,
      precioCompra: data.precio_compra,
      aplicaIGV: data.aplica_igv,
      porcentajeIGV: data.porcentaje_igv,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Convierte a snake_case
   */
  toSnakeCase(): any {
    return {
      id: this.id,
      sku: this.sku,
      codigos_alternos: JSON.stringify(this.codigosAlternos),
      codigo_barra: this.codigoBarra,
      id_primario: this.idPrimario,
      es_primario: this.esPrimario,
      factor_conversion: this.factorConversion,
      mayoreo: this.mayoreo,
      cantidad_para_descuento: this.cantidadParaDescuento,
      descuento_x_cantidad: this.descuentoXCantidad,
      nombre: this.nombre,
      titulo: this.titulo,
      descripcion: this.descripcion,
      consideraciones: this.consideraciones,
      caracteristicas: this.caracteristicas,
      status: this.status ? 1 : 0,
      url: JSON.stringify(this.url),
      marca: this.marca,
      keywords: JSON.stringify(this.keywords),
      visible_en_pos: this.visibleEnPOS,
      visible_online: this.visibleOnline,
      categorie_id: this.categorieId,
      subcategorie_id: this.subcategorieId,
      contenido_neto: this.contenidoNeto,
      unidad_contenido: this.unidadContenido,
      unidad_medida: this.unidadMedida,
      tipo_venta: this.tipoVenta,
      tipo_empaque: this.tipoEmpaque,
      fraccionable: this.fraccionable,
      stock: this.stock,
      precio_venta: this.precioVenta,
      precio_compra: this.precioCompra,
      aplica_igv: this.aplicaIGV,
      porcentaje_igv: this.porcentajeIGV,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString()
    };
  }

  /**
   * Obtiene la abreviación de una unidad de medida
   * @param unidad Unidad de medida a abreviar (si no se provee, usa la del producto)
   */
  static getUnidadMedidaAbreviada(unidad: UnidadMedidaEnum): string {
    // Como el enum ya tiene los valores abreviados ("kg", "g", "und"), 
    // simplemente devolvemos el valor del enum.
    // Esto mantiene la consistencia y evita mapas duplicados.
    return unidad;
  }

  /**
   * Obtiene la abreviación de la unidad de medida de esta instancia
   */
  get unidadMedidaAbreviada(): string {
    return Producto.getUnidadMedidaAbreviada(this.unidadMedida);
  }
}
