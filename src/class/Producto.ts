import { EstadoStockEnum, TipoActualizacionEnum, TipoVentaEnum } from '../utils/enums';
import {  UpdateProducto, IProducto } from '../interfaces/producto';
import { MedidasConverter, FormatMedidaOptions } from '../utils/medidas-converter';

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
 * relacionadas con productos en el sistema YolaFresh
 */
export class Producto implements IProducto {
  // Propiedades de la interfaz IProducto
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
  creacion?: Date;
  actualizacion?: Date;
  stock: EstadoStockEnum;
  precioCompra: number;

  /**
   * Constructor de la clase Producto
   */
  constructor(data: Partial<IProducto> = {}) {
    this.id = data.id || '';
    this.idPrimario = data.idPrimario || '';
    this.mayoreo = data.mayoreo || false;
    this.cantidadParaDescuento = data.cantidadParaDescuento || 0;
    this.descuentoXCantidad = data.descuentoXCantidad || 0;
    this.nombre = data.nombre || '';
    this.precio = data.precio || 0;
    this.status = data.status !== undefined ? data.status : true;
    this.url = data.url || '';
    this.categorieId = data.categorieId || '';
    this.esPrimario = data.esPrimario || false;
    this.tipoVenta = data.tipoVenta || TipoVentaEnum.Unidad;
    this.fraccionable = data.fraccionable || false;
    this.titulo = data.titulo || '';
    this.consideraciones = data.consideraciones || '';
    this.caracteristicas = data.caracteristicas || '';
    this.descripcion = data.descripcion || '';
    this.peso = data.peso || '';
    this.creacion = data.creacion;
    this.actualizacion = data.actualizacion;
    this.stock = data.stock || EstadoStockEnum.STOCK_MEDIO;
    this.precioCompra = data.precioCompra || 0;
  }

  /**
   * Formatea la cantidad según el tipo de venta y configuraciones
   * Refactorizado para usar MedidasConverter y seguir principios SOLID
   */
  formatCantidad(params: FormatCantidadParams): string {
    const { cantidad, tipoVenta, mayoreo = false, abreviado = false, categoriaId } = params;

    // Si es solo para mayoreo, devolver solo el número
    if (mayoreo) {
      if (tipoVenta === TipoVentaEnum.Kilogramo && cantidad >= 1000) {
        const kilogramos = cantidad / 1000;
        return kilogramos.toFixed(3).replace(/\.?0+$/, '');
      }
      
      const fraccion = MedidasConverter.getFraccion(cantidad);
      return fraccion || cantidad.toString();
    }

    // Determinar opciones de formateo
    const formatOptions: FormatMedidaOptions = {
      abreviado,
      abarrotes: categoriaId === "5",
      plural: cantidad !== 1
    };

    // Manejo especial para kilogramos
    if (tipoVenta === TipoVentaEnum.Kilogramo) {
      if (cantidad < 1000) {
        // Verificar si es una fracción conocida
        const fraccion = MedidasConverter.getFraccion(cantidad);
        if (fraccion) {
          const unidad = MedidasConverter.getAbreviacion(TipoVentaEnum.Kilogramo, formatOptions);
          return `${fraccion} ${unidad}`;
        }
        
        // Mostrar en gramos para cantidades menores a 1kg
        const unidad = MedidasConverter.getAbreviacion(TipoVentaEnum.Gramo, formatOptions);
        return `${cantidad} ${unidad}`;
      } else {
        // Convertir a kilogramos
        const kilogramos = cantidad / 1000;
        const unidad = MedidasConverter.getAbreviacion(TipoVentaEnum.Kilogramo, {
          ...formatOptions,
          plural: kilogramos !== 1
        });
        return `${kilogramos.toFixed(3).replace(/\.?0+$/, '')} ${unidad}`;
      }
    }

    // Manejo para otros tipos de venta
    if (cantidad >= 1000) {
      const unidades = cantidad / 1000;
      const unidad = MedidasConverter.getAbreviacion(tipoVenta, {
        ...formatOptions,
        plural: unidades >= 2
      });
      return `${unidades.toFixed(3).replace(/\.?0+$/, '')} ${unidad}`;
    }

    // Verificar si es una fracción conocida
    const fraccion = MedidasConverter.getFraccion(cantidad);
    if (fraccion) {
      const unidad = MedidasConverter.getAbreviacion(tipoVenta, formatOptions);
      return `${fraccion} ${unidad}`;
    }

    // Formato estándar
    const unidad = MedidasConverter.getAbreviacion(tipoVenta, formatOptions);
    return `${cantidad} ${unidad}`;
  }

  /**
   * Calcula el precio con descuento por cantidad si aplica
   */
  calcularPrecioConDescuento(cantidad: number): number {
    if (this.cantidadParaDescuento > 0 && cantidad >= this.cantidadParaDescuento) {
      const descuento = (this.precio * this.descuentoXCantidad) / 100;
      return this.precio - descuento;
    }
    return this.precio;
  }

  /**
   * Calcula el margen de ganancia
   */
  calcularMargenGanancia(): number {
    if (this.precioCompra <= 0) return 0;
    return ((this.precio - this.precioCompra) / this.precioCompra) * 100;
  }

  /**
   * Verifica si el producto está disponible
   */
  estaDisponible(): boolean {
    return this.status && this.stock !== EstadoStockEnum.STOCK_AGOTADO;
  }

  /**
   * Verifica si el producto tiene stock bajo
   */
  tieneStockBajo(): boolean {
    return this.stock === EstadoStockEnum.STOCK_BAJO;
  }

  /**
   * Verifica si el producto está sin stock
   */
  estaSinStock(): boolean {
    return this.stock === EstadoStockEnum.STOCK_AGOTADO;
  }

  /**
   * Obtiene la URL de imagen optimizada (si usa Cloudinary)
   */
  getImagenOptimizada(width?: number, height?: number, quality?: number): string {
    if (!this.url) return '';
    
    // Si es una URL de Cloudinary, aplicar transformaciones
    if (this.url.includes('cloudinary.com')) {
      let transformations = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      if (quality) transformations.push(`q_${quality}`);
      
      if (transformations.length > 0) {
        return this.url.replace('/upload/', `/upload/${transformations.join(',')}/`);
      }
    }
    
    return this.url;
  }

  /**
   * Convierte el producto a formato JSON
   */
  toJSON(): IProducto {
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
      creacion: this.creacion,
      actualizacion: this.actualizacion,
      stock: this.stock,
      precioCompra: this.precioCompra,
    };
  }

  /**
   * Actualiza las propiedades del producto
   */
  actualizar(data: Partial<IProducto>): void {
    Object.assign(this, data);
    this.actualizacion = new Date();
  }

  /**
   * Crea una instancia de Producto desde datos JSON
   */
  static fromJSON(data: IProducto): Producto {
    return new Producto(data);
  }

  /**
   * Crea múltiples instancias de Producto desde un array de datos
   */
  static fromJSONArray(dataArray: IProducto[]): Producto[] {
    return dataArray.map(data => Producto.fromJSON(data));
  }

  /**
   * Filtra una lista de productos según los criterios especificados
   */
  static filtrarProductos(productos: Producto[], filtros: ProductoFilters): Producto[] {
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
      resultado = resultado.filter(p => 
        p.nombre.toLowerCase().includes(nombreLower) ||
        p.titulo.toLowerCase().includes(nombreLower) ||
        p.descripcion.toLowerCase().includes(nombreLower)
      );
    }

    // Filtrar por rango de precios
    if (filtros.precioMin !== undefined) {
      resultado = resultado.filter(p => p.precio >= filtros.precioMin!);
    }
    if (filtros.precioMax !== undefined) {
      resultado = resultado.filter(p => p.precio <= filtros.precioMax!);
    }

    // Filtrar por fechas
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio);
      resultado = resultado.filter(p => 
        p.creacion && p.creacion >= fechaInicio
      );
    }
    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      resultado = resultado.filter(p => 
        p.creacion && p.creacion <= fechaFin
      );
    }

    // Ordenar resultados
    if (filtros.sortBy) {
      resultado.sort((a, b) => {
        const aValue = (a as any)[filtros.sortBy!];
        const bValue = (b as any)[filtros.sortBy!];
        
        if (filtros.sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return resultado;
  }

  /**
   * Busca productos por texto en múltiples campos
   */
  static buscarProductos(productos: Producto[], texto: string): Producto[] {
    if (!texto.trim()) return productos;
    
    const textoLower = texto.toLowerCase();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(textoLower) ||
      p.titulo.toLowerCase().includes(textoLower) ||
      p.descripcion.toLowerCase().includes(textoLower) ||
      p.caracteristicas.toLowerCase().includes(textoLower) ||
      p.consideraciones.toLowerCase().includes(textoLower)
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
   * Obtiene estadísticas de una lista de productos
   */
  static obtenerEstadisticas(productos: Producto[]) {
    const total = productos.length;
    const activos = productos.filter(p => p.status).length;
    const inactivos = total - activos;
    const conStock = productos.filter(p => p.stock !== EstadoStockEnum.STOCK_AGOTADO).length;
    const sinStock = productos.filter(p => p.stock === EstadoStockEnum.STOCK_AGOTADO).length;
    const stockBajo = productos.filter(p => p.stock === EstadoStockEnum.STOCK_BAJO).length;
    
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
  validar(): { esValido: boolean; errores: string[] } {
    const errores: string[] = [];

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
   * Crea un UpdateProducto para actualizar este producto
   */
  crearUpdateProducto(tipoActualizacion: TipoActualizacionEnum): UpdateProducto {
    return {
      id: this.id,
      productoId: this.id,
      tipoActualizacion,
      precioCompra: this.precioCompra,
      precioVenta: this.precio,
      stock: this.stock,
      creacion: this.creacion || new Date(),
      actualizacion: new Date()
    };
  }
}

