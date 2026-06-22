import { CarItem, CarritoVenta, ICarritoVenta, ProcedenciaVenta } from "./CarritoVenta";
import { AggregateRoot } from "@/domain/shared/base/AggregateRoot";
import { VentaConfirmada } from "./events/VentaConfirmada";
import { OrderState, VentaState } from "@/domain/shared/utils/enums";
import {
  VentaCouchMinimalSnapshot,
  VentaPersistenceSnapshot,
} from "./snapshots";

export interface VentaItem {
  id: string;
  presentacionId: string;
  cantidadVendida: number;
  precioUnitario: number;
  descuento?: number;
}

export interface IVenta {
  id: string;
  nombre: string;
  type: string;
  estado: VentaState;
  items: VentaItem[];
  pedidoId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  costoEnvio?: number;
  subtotal: number;
  impuesto: number;
  total: number;
  montoRedondeo?: number;
  procedencia: ProcedenciaVenta;
  clienteId?: string;
  vendedorId?: string;
  codigoVenta?: string;
  numeroVenta?: string;
}

interface VentaLegacyCompatibilityFields {
  detalleVenta?: ICarritoVenta;
  tipoPago?: string;
  finanzaId?: string;
  turnoCajaId?: string;
  esPedido?: boolean;
}

export interface VentaCreateInput
  extends Omit<IVenta, "estado"> {
  estado: VentaState;
}

interface VentaLegacyInput
  extends Partial<Omit<IVenta, "estado">>,
    VentaLegacyCompatibilityFields {
  id: string;
  nombre: string;
  estado: VentaState | OrderState;
  subtotal: number;
  impuesto: number;
  total: number;
  procedencia: ProcedenciaVenta;
}

export class Venta extends AggregateRoot<string> implements IVenta {
  static roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private static normalizeLegacyEstado(
    estado: VentaState | OrderState | string | undefined,
  ): VentaState {
    switch (estado) {
      case VentaState.CONFIRMADA:
      case "CONFIRMADA":
        return VentaState.CONFIRMADA;
      case VentaState.DESPACHADA:
      case "DESPACHADA":
      case OrderState.DESPACHADO:
      case OrderState.ENTREGADO:
      case "DESPACHADO":
      case "ENTREGADO":
        return VentaState.DESPACHADA;
      case VentaState.ANULADA:
      case "ANULADA":
      case OrderState.CANCELADO:
      case "CANCELADO":
        return VentaState.ANULADA;
      default:
        return VentaState.CONFIRMADA;
    }
  }

  private static mapCarItemToVentaItem(item: CarItem): VentaItem {
    const presentacionId = String(item.product?.id || "").trim();
    if (!presentacionId) {
      throw new Error("CarItem.product.id es requerido para crear VentaItem");
    }

    return {
      id: item.id,
      presentacionId,
      cantidadVendida: Number(item.quantity ?? 0),
      precioUnitario: Number(
        item.precioUnitario ?? item.product?.precioVenta ?? 0,
      ),
      descuento: typeof item.descuento === "number" ? item.descuento : undefined,
    };
  }

  private static mapVentaItemToCarItem(item: VentaItem): CarItem {
    const montoBase = Venta.roundMoney(item.precioUnitario * item.cantidadVendida);
    return {
      id: item.id,
      product: { id: item.presentacionId },
      quantity: item.cantidadVendida,
      precioUnitario: item.precioUnitario,
      montoTotal: montoBase,
      descuento: item.descuento,
    };
  }

  private static buildDetalleVentaCompat(
    data: IVenta,
    createdAt: Date,
    updatedAt: Date,
  ): ICarritoVenta {
    const carItems = data.items.map((item) => Venta.mapVentaItemToCarItem(item));
    const descuentoTotal = data.items.reduce(
      (sum, item) => sum + Number(item.descuento ?? 0),
      0,
    );
    const cantidadTotal = data.items.reduce(
      (sum, item) => sum + Number(item.cantidadVendida ?? 0),
      0,
    );
    const detalleTotal = Venta.roundMoney(data.total - (data.montoRedondeo ?? 0));

    return Object.freeze({
      id: `${data.id}-detalle`,
      createdAt,
      updatedAt,
      nombre: data.nombre,
      items: carItems,
      subtotal: data.subtotal,
      impuesto: data.impuesto,
      total: detalleTotal,
      descuentoTotal,
      cantidadItems: data.items.length,
      cantidadTotal,
      tasaImpuesto: 0,
      clienteId: data.clienteId,
      personalId: data.vendedorId,
      procedencia: data.procedencia,
    });
  }

  public readonly nombre: string;
  public readonly type: string;
  public estado: VentaState;
  public readonly items: VentaItem[];
  public readonly pedidoId?: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public readonly costoEnvio?: number;
  public readonly subtotal: number;
  public readonly impuesto: number;
  public readonly total: number;
  public readonly montoRedondeo?: number;
  public readonly procedencia: ProcedenciaVenta;
  public readonly clienteId?: string;
  public readonly vendedorId?: string;
  public readonly codigoVenta?: string;
  public readonly numeroVenta?: string;
  private _detalleVentaCompat: ICarritoVenta;

  constructor(data: VentaCreateInput) {
    super(data.id);

    if (!data.id || !data.nombre) {
      throw new Error("ID y nombre son requeridos para crear una venta");
    }

    this.nombre = data.nombre;
    this.type = data.type || "venta";
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.items = Object.freeze(
      data.items.map((item) => ({
        id: item.id,
        presentacionId: item.presentacionId,
        cantidadVendida: Number(item.cantidadVendida ?? 0),
        precioUnitario: Number(item.precioUnitario ?? 0),
        descuento:
          typeof item.descuento === "number" ? Number(item.descuento) : undefined,
      })),
    ) as VentaItem[];
    this.estado = data.estado;
    this.pedidoId =
      typeof data.pedidoId === "string" && data.pedidoId.trim() !== ""
        ? data.pedidoId
        : undefined;
    this.subtotal = Venta.roundMoney(Number(data.subtotal ?? 0));
    this.impuesto = Venta.roundMoney(Number(data.impuesto ?? 0));
    this.total = Venta.roundMoney(Number(data.total ?? 0));
    this.montoRedondeo = Number(data.montoRedondeo ?? 0);
    this.procedencia = data.procedencia;
    this.clienteId = data.clienteId;
    this.vendedorId = data.vendedorId;
    this.codigoVenta = data.codigoVenta;
    this.numeroVenta = data.numeroVenta;
    this.costoEnvio = data.costoEnvio;
    this._detalleVentaCompat = Venta.buildDetalleVentaCompat(
      this.toJSON(),
      this.createdAt,
      this.updatedAt,
    );

    const validation = Venta.validar(data);
    if (!validation.valida) {
      throw new Error(validation.errores.join("; "));
    }
  }

  get cantidadItems(): number {
    return this.items.length;
  }

  get cantidadTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + Number(item.cantidadVendida ?? 0),
      0,
    );
  }

  get estaProcesada(): boolean {
    return (
      this.estado === VentaState.CONFIRMADA ||
      this.estado === VentaState.DESPACHADA
    );
  }

  /**
   * @deprecated `Venta` ya no usa estados pendientes como canónicos.
   */
  get esPendiente(): boolean {
    return false;
  }

  get esUnPedido(): boolean {
    return Boolean(this.pedidoId);
  }

  get resumen(): {
    cantidadItems: number;
    cantidadTotal: number;
    subtotal: number;
    impuesto: number;
    total: number;
  } {
    return {
      cantidadItems: this.cantidadItems,
      cantidadTotal: this.cantidadTotal,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
    };
  }

  buscarItemPorProducto(productId: string): VentaItem | undefined {
    return this.items.find((item) => item.presentacionId === productId);
  }

  buscarItemPorId(itemId: string): VentaItem | undefined {
    return this.items.find((item) => item.id === itemId);
  }

  get productosUnicos(): Array<{
    id: string;
    nombre: string;
    cantidadTotal: number;
    montoTotal: number;
  }> {
    const nombres = new Map<string, string>();
    this._detalleVentaCompat.items.forEach((item) => {
      const productId = String(item.product?.id || "").trim();
      if (productId) {
        nombres.set(productId, item.product?.nombre ?? productId);
      }
    });

    const productosMap = new Map<
      string,
      { id: string; nombre: string; cantidadTotal: number; montoTotal: number }
    >();

    this.items.forEach((item) => {
      const current = productosMap.get(item.presentacionId);
      const montoItem = this.calcularTotalItem(item);
      if (current) {
        current.cantidadTotal += item.cantidadVendida;
        current.montoTotal += montoItem;
        return;
      }

      productosMap.set(item.presentacionId, {
        id: item.presentacionId,
        nombre: nombres.get(item.presentacionId) ?? item.presentacionId,
        cantidadTotal: item.cantidadVendida,
        montoTotal: montoItem,
      });
    });

    return Array.from(productosMap.values());
  }

  confirmar() {
    if (this.items.length === 0) {
      throw new Error("No se puede confirmar venta vacía");
    }

    this.estado = VentaState.CONFIRMADA;
    this.updatedAt = new Date();
    this.addDomainEvent(new VentaConfirmada(this.id, this.total));
  }

  toJSON(): IVenta {
    return {
      id: this.id,
      nombre: this.nombre,
      type: this.type,
      estado: this.estado,
      items: this.items.map((item) => ({ ...item })),
      pedidoId: this.pedidoId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
      montoRedondeo: this.montoRedondeo,
      procedencia: this.procedencia,
      clienteId: this.clienteId,
      vendedorId: this.vendedorId,
      codigoVenta: this.codigoVenta,
      numeroVenta: this.numeroVenta,
      costoEnvio: this.costoEnvio,
    };
  }

  toPersistenceSnapshot(): VentaPersistenceSnapshot {
    const detalleVenta = CarritoVenta.fromJSON(
      this._detalleVentaCompat,
    ).toVentaSnapshot();

    return {
      id: this.id,
      nombre: this.nombre,
      type: this.type,
      estado: this.estado,
      pedidoId: this.pedidoId,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      detalleVenta,
      costoEnvio: this.costoEnvio,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
      montoRedondeo: this.montoRedondeo,
      procedencia: this.procedencia,
      clienteId: this.clienteId,
      vendedorId: this.vendedorId,
      codigoVenta: this.codigoVenta,
      numeroVenta: this.numeroVenta,
    };
  }

  toCouchSnapshotMinimal(): VentaCouchMinimalSnapshot {
    const getImagenSnapshot = (
      product: Partial<CarItem["product"]> | undefined,
    ): { sizes: { small: string } } | undefined => {
      const img = (
        product as
          | { imagen?: { sizes?: { small?: string }; base?: string } }
          | undefined
      )?.imagen;
      const small = img?.sizes?.small ?? img?.base ?? "";
      const clean = String(small || "").trim();
      return clean ? { sizes: { small: clean } } : undefined;
    };

    const compactItemId = (item: CarItem): string => {
      const rawId = String(item.id || "").trim();
      const productId = String(item.product?.id || "").trim();
      if (!rawId) return productId || this.id;
      const parts = rawId.split("_").filter(Boolean);
      const base = parts[0] || rawId;
      const suffix = parts.length > 1 ? parts[parts.length - 1] : "";
      const baseShort =
        base.length > 12 ? `${base.slice(0, 8)}${base.slice(-4)}` : base;
      return suffix ? `${baseShort}_${suffix}` : baseShort;
    };

    const detalleVenta = this._detalleVentaCompat;
    const items = detalleVenta.items
      .map((item) => {
        const productId = String(item.product?.id || "").trim();
        if (!productId) return null;

        return {
          id: compactItemId(item),
          product: {
            id: productId,
            type:
              typeof (item.product as { type?: unknown })?.type === "string"
                ? String((item.product as { type?: string }).type)
                : undefined,
            productoBaseId:
              typeof (item.product as { productoBaseId?: unknown })
                ?.productoBaseId === "string"
                ? String(
                    (item.product as { productoBaseId?: string }).productoBaseId,
                  )
                : undefined,
            tipoVenta: item.product?.tipoVenta,
            contenidoNeto:
              typeof item.product?.contenidoNeto === "number"
                ? item.product.contenidoNeto
                : undefined,
            unidadContenido: item.product?.unidadContenido,
            tipoEmpaque:
              typeof item.product?.tipoEmpaque === "string"
                ? item.product.tipoEmpaque
                : undefined,
            fraccionable:
              typeof item.product?.fraccionable === "boolean"
                ? item.product.fraccionable
                : undefined,
            imagen: getImagenSnapshot(item.product),
          },
          quantity: Number(item.quantity || 0),
          precioUnitario:
            typeof item.precioUnitario === "number"
              ? item.precioUnitario
              : undefined,
          montoTotal:
            typeof item.montoTotal === "number" ? item.montoTotal : undefined,
          montoModificado:
            typeof item.montoModificado === "boolean"
              ? item.montoModificado
              : undefined,
          descuento:
            typeof item.descuento === "number" ? item.descuento : undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return {
      id: this.id,
      nombre: this.nombre,
      type: this.type,
      estado: this.estado,
      pedidoId: this.pedidoId,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      detalleVenta: {
        items,
        subtotal: detalleVenta.subtotal,
        impuesto: detalleVenta.impuesto,
        total: detalleVenta.total,
        descuentoTotal: detalleVenta.descuentoTotal,
        cantidadItems: detalleVenta.cantidadItems,
        cantidadTotal: detalleVenta.cantidadTotal,
        tasaImpuesto: detalleVenta.tasaImpuesto,
        notas: detalleVenta.notas,
        configuracionFiscal: detalleVenta.configuracionFiscal,
        cliente: detalleVenta.cliente
          ? {
              id: detalleVenta.cliente.id,
              nombres: detalleVenta.cliente.nombres,
              celular: detalleVenta.cliente.celular,
              correo: detalleVenta.cliente.correo,
              dni: detalleVenta.cliente.dni,
              direccion: detalleVenta.cliente.direccion,
            }
          : undefined,
        personal: detalleVenta.personal
          ? {
              id: detalleVenta.personal.id,
              username: detalleVenta.personal.username,
              email: detalleVenta.personal.email,
            }
          : undefined,
        clienteColor: detalleVenta.clienteColor,
        metodoPago: detalleVenta.metodoPago,
        dineroRecibido: detalleVenta.dineroRecibido,
        procedencia: detalleVenta.procedencia,
        clienteId: detalleVenta.clienteId,
        personalId: detalleVenta.personalId,
      },
      costoEnvio: this.costoEnvio,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
      montoRedondeo: this.montoRedondeo,
      procedencia: this.procedencia,
      clienteId: this.clienteId,
      vendedorId: this.vendedorId,
      codigoVenta: this.codigoVenta,
      numeroVenta: this.numeroVenta,
    };
  }

  static fromCarritoVenta(
    carritoJSON: ICarritoVenta,
    id: string,
    options?: { nombre?: string; montoRedondeo?: number; pedidoId?: string },
  ): Venta {
    const ahora = new Date();
    const montoRedondeo = options?.montoRedondeo ?? 0;
    const carritoInstance = CarritoVenta.fromJSON(carritoJSON);
    const detalle = carritoInstance.toJSON();
    const detalleFinal: ICarritoVenta = {
      ...detalle,
      updatedAt: ahora,
    };
    const totalFinal = Venta.roundMoney(detalleFinal.total + montoRedondeo);
    const venta = new Venta({
      id,
      nombre: options?.nombre ?? carritoJSON.nombre ?? "Venta",
      type: "venta",
      estado: VentaState.CONFIRMADA,
      createdAt: ahora,
      updatedAt: ahora,
      items: detalleFinal.items.map((item) => Venta.mapCarItemToVentaItem(item)),
      pedidoId: options?.pedidoId,
      subtotal: detalleFinal.subtotal,
      impuesto: detalleFinal.impuesto,
      total: totalFinal,
      montoRedondeo,
      procedencia: carritoJSON.procedencia || ProcedenciaVenta.Tienda,
      clienteId: carritoJSON.clienteId,
      vendedorId: carritoJSON.personalId,
      codigoVenta: "",
      numeroVenta: "",
      costoEnvio: 0,
    });
    venta._detalleVentaCompat = Object.freeze(
      CarritoVenta.fromJSON(detalleFinal).toJSON(),
    );
    return venta;
  }

  static fromLegacyInput(data: VentaLegacyInput): Venta {
    const items =
      Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : data.detalleVenta?.items?.map((item) => Venta.mapCarItemToVentaItem(item)) ?? [];

    const pedidoId =
      typeof data.pedidoId === "string" && data.pedidoId.trim() !== ""
        ? data.pedidoId
        : data.esPedido
          ? data.id
          : undefined;

    const venta = new Venta({
      id: data.id,
      nombre: data.nombre,
      type: data.type || "venta",
      estado: Venta.normalizeLegacyEstado(data.estado),
      items,
      pedidoId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      costoEnvio: data.costoEnvio,
      subtotal: Number(data.subtotal ?? 0),
      impuesto: Number(data.impuesto ?? 0),
      total: Number(data.total ?? 0),
      montoRedondeo: data.montoRedondeo,
      procedencia: data.procedencia,
      clienteId: data.clienteId,
      vendedorId: data.vendedorId,
      codigoVenta: data.codigoVenta,
      numeroVenta: data.numeroVenta,
    });

    if (data.detalleVenta?.items?.length) {
      venta._detalleVentaCompat = Object.freeze(
        CarritoVenta.fromJSON(data.detalleVenta).toJSON(),
      );
    }

    return venta;
  }

  static fromPersistenceSnapshot(snapshot: VentaPersistenceSnapshot): Venta {
    return Venta.fromLegacyInput({
      id: snapshot.id,
      nombre: snapshot.nombre,
      type: snapshot.type,
      estado: snapshot.estado as VentaState | OrderState,
      pedidoId: snapshot.pedidoId,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
      detalleVenta: CarritoVenta.fromJSON({
        ...snapshot.detalleVenta,
        createdAt: new Date(snapshot.detalleVenta.createdAt),
        updatedAt: new Date(snapshot.detalleVenta.updatedAt),
      }).toJSON(),
      costoEnvio: snapshot.costoEnvio,
      subtotal: snapshot.subtotal,
      impuesto: snapshot.impuesto,
      total: snapshot.total,
      montoRedondeo: snapshot.montoRedondeo,
      procedencia: snapshot.procedencia as ProcedenciaVenta,
      clienteId: snapshot.clienteId,
      vendedorId: snapshot.vendedorId,
      codigoVenta: snapshot.codigoVenta,
      numeroVenta: snapshot.numeroVenta,
      esPedido: snapshot.esPedido,
      tipoPago: snapshot.tipoPago,
      finanzaId: snapshot.finanzaId,
      turnoCajaId: snapshot.turnoCajaId,
    });
  }

  static fromCouchSnapshot(snapshot: VentaCouchMinimalSnapshot): Venta {
    return Venta.fromLegacyInput({
      id: snapshot.id,
      nombre: snapshot.nombre,
      type: snapshot.type,
      estado: snapshot.estado as VentaState | OrderState,
      pedidoId: snapshot.pedidoId,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
      detalleVenta: CarritoVenta.fromJSON({
        ...snapshot.detalleVenta,
        id: snapshot.id,
        nombre: snapshot.nombre,
        createdAt: new Date(snapshot.createdAt),
        updatedAt: new Date(snapshot.updatedAt),
      }).toJSON(),
      costoEnvio: snapshot.costoEnvio,
      subtotal: snapshot.subtotal,
      impuesto: snapshot.impuesto,
      total: snapshot.total,
      montoRedondeo: snapshot.montoRedondeo,
      procedencia: snapshot.procedencia as ProcedenciaVenta,
      clienteId: snapshot.clienteId,
      vendedorId: snapshot.vendedorId,
      codigoVenta: snapshot.codigoVenta,
      numeroVenta: snapshot.numeroVenta,
      esPedido: snapshot.esPedido,
      tipoPago: snapshot.tipoPago,
      finanzaId: snapshot.finanzaId,
      turnoCajaId: snapshot.turnoCajaId,
    });
  }

  static validar(data: Partial<VentaCreateInput>): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!data.id) errores.push("ID es requerido");
    if (!data.nombre) errores.push("Nombre es requerido");
    if (!data.procedencia) errores.push("Procedencia es requerida");

    if (!Array.isArray(data.items) || data.items.length === 0) {
      errores.push("La venta debe tener al menos un item");
    }

    if ((data.total || 0) <= 0) {
      errores.push("El total debe ser mayor a 0");
    }

    if ((data.subtotal || 0) < 0) errores.push("El subtotal no puede ser negativo");
    if ((data.impuesto || 0) < 0) errores.push("El impuesto no puede ser negativo");
    if (data.costoEnvio !== undefined && data.costoEnvio < 0) {
      errores.push("El costo de envío no puede ser negativo");
    }

    if (Array.isArray(data.items)) {
      data.items.forEach((item, index) => {
        if (!item.id) errores.push(`Item ${index + 1}: id es requerido`);
        if (!item.presentacionId) {
          errores.push(`Item ${index + 1}: presentacionId es requerido`);
        }
        if ((item.cantidadVendida || 0) <= 0) {
          errores.push(`Item ${index + 1}: cantidadVendida debe ser mayor a 0`);
        }
        if ((item.precioUnitario || 0) < 0) {
          errores.push(`Item ${index + 1}: precioUnitario no puede ser negativo`);
        }
      });
    }

    return {
      valida: errores.length === 0,
      errores,
    };
  }

  calcularSubtotalItem(item: VentaItem): number {
    return Venta.roundMoney(item.precioUnitario * item.cantidadVendida);
  }

  calcularTotalItem(item: VentaItem): number {
    return Venta.roundMoney(
      this.calcularSubtotalItem(item) - Number(item.descuento ?? 0),
    );
  }

  calcularSubtotal(): number {
    return Venta.roundMoney(
      this.items.reduce((sum, item) => sum + this.calcularSubtotalItem(item), 0),
    );
  }

  calcularTotal(): number {
    const totalItems = this.items.reduce(
      (sum, item) => sum + this.calcularTotalItem(item),
      0,
    );
    return Venta.roundMoney(totalItems + this.impuesto + (this.montoRedondeo ?? 0));
  }
}

/**
 * Helper para obtener items de una venta.
 */
export function getVentaItems(venta: IVenta): VentaItem[] {
  return venta.items || [];
}

/**
 * Helper para obtener resumen de items.
 */
export function getVentaItemsResumen(
  venta: IVenta | Venta,
): Array<{ id: string; nombre: string; cantidad: number; total: number }> {
  const detailNames = new Map<string, string>();
  if (venta instanceof Venta) {
    venta.productosUnicos.forEach((producto) => {
      detailNames.set(producto.id, producto.nombre);
    });
  }

  return getVentaItems(venta).map((item) => ({
    id: item.id,
    nombre: detailNames.get(item.presentacionId) ?? item.presentacionId,
    cantidad: item.cantidadVendida,
    total: Venta.roundMoney(
      item.precioUnitario * item.cantidadVendida - Number(item.descuento ?? 0),
    ),
  }));
}

/**
 * @deprecated Usar `VentaItem`.
 */
export type ItemVenta = VentaItem;
