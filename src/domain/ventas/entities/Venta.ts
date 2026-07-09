import { CarItem, CarritoVenta, ICarritoVenta, ProcedenciaVenta } from "./CarritoVenta";
import { AggregateRoot } from "../../shared/base/AggregateRoot";
import { VentaConfirmada } from "../events/VentaConfirmada";
import { CondicionPagoVenta, VentaState } from "../../shared/kernel/enums";
import {
  IVentaSnapshot,
  VentaSnapshot,
  VentaSnapshotBuildContext,
} from "./VentaSnapshot";

export interface VentaItem {
  id: string;
  presentacionId: string;
  cantidadVendida: number;
  precioUnitario: number;
  montoTotal?: number;
  montoModificado?: boolean;
  descuento?: number;
}

export interface IVenta {
  id: string;
  nombre: string;
  type: string;
  estado: VentaState;
  condicionPago: CondicionPagoVenta;
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

export interface VentaCreateInput extends Omit<IVenta, "estado" | "condicionPago"> {
  estado: VentaState;
  condicionPago: CondicionPagoVenta;
}

export class Venta extends AggregateRoot<string> implements IVenta {
  static roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
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
      precioUnitario: Number(item.precioUnitario ?? item.product?.precioVenta ?? 0),
      montoTotal:
        typeof item.montoTotal === "number" ? Venta.roundMoney(item.montoTotal) : undefined,
      montoModificado:
        typeof item.montoModificado === "boolean" ? item.montoModificado : undefined,
      descuento: typeof item.descuento === "number" ? Number(item.descuento) : undefined,
    };
  }

  public readonly nombre: string;
  public readonly type: string;
  public estado: VentaState;
  public readonly condicionPago: CondicionPagoVenta;
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
        montoTotal:
          typeof item.montoTotal === "number"
            ? Venta.roundMoney(Number(item.montoTotal))
            : undefined,
        montoModificado:
          typeof item.montoModificado === "boolean" ? item.montoModificado : undefined,
        descuento:
          typeof item.descuento === "number" ? Number(item.descuento) : undefined,
      })),
    ) as VentaItem[];
    this.estado = data.estado;
    this.condicionPago = data.condicionPago;
    this.pedidoId =
      typeof data.pedidoId === "string" && data.pedidoId.trim() !== ""
        ? data.pedidoId
        : undefined;
    this.subtotal = Venta.roundMoney(Number(data.subtotal ?? 0));
    this.impuesto = Venta.roundMoney(Number(data.impuesto ?? 0));
    this.total = Venta.roundMoney(Number(data.total ?? 0));
    this.montoRedondeo =
      data.montoRedondeo === undefined ? undefined : Number(data.montoRedondeo);
    this.procedencia = data.procedencia;
    this.clienteId = data.clienteId;
    this.vendedorId = data.vendedorId;
    this.codigoVenta = data.codigoVenta;
    this.numeroVenta = data.numeroVenta;
    this.costoEnvio = data.costoEnvio;

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
    return this.estado === VentaState.CONFIRMADA;
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
        nombre: item.presentacionId,
        cantidadTotal: item.cantidadVendida,
        montoTotal: montoItem,
      });
    });

    return Array.from(productosMap.values()).map((producto) => ({
      ...producto,
      montoTotal: Venta.roundMoney(producto.montoTotal),
    }));
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
      condicionPago: this.condicionPago,
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

  toVentaSnapshot(context: VentaSnapshotBuildContext = {}): IVentaSnapshot {
    return VentaSnapshot.fromVenta(this, context).toJSON();
  }

  static fromCarritoVenta(
    carritoJSON: ICarritoVenta,
    id: string,
    options?: {
      nombre?: string;
      montoRedondeo?: number;
      pedidoId?: string;
      condicionPago?: CondicionPagoVenta;
    },
  ): Venta {
    const ahora = new Date();
    const montoRedondeo = options?.montoRedondeo ?? 0;
    const carritoInstance = CarritoVenta.fromJSON(carritoJSON);
    const detalle = carritoInstance.toJSON();
    const totalFinal = Venta.roundMoney(detalle.total + montoRedondeo);

    return new Venta({
      id,
      nombre: options?.nombre ?? carritoJSON.nombre ?? "Venta",
      type: "venta",
      estado: VentaState.CONFIRMADA,
      condicionPago: options?.condicionPago ?? CondicionPagoVenta.CONTADO,
      createdAt: ahora,
      updatedAt: ahora,
      items: detalle.items.map((item) => Venta.mapCarItemToVentaItem(item)),
      pedidoId: options?.pedidoId,
      subtotal: detalle.subtotal,
      impuesto: detalle.impuesto,
      total: totalFinal,
      montoRedondeo,
      procedencia: carritoJSON.procedencia || ProcedenciaVenta.Tienda,
      clienteId: carritoJSON.clienteId,
      vendedorId: carritoJSON.personalId,
      codigoVenta: "",
      numeroVenta: "",
      costoEnvio: 0,
    });
  }

  static validar(data: Partial<VentaCreateInput>): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!data.id) errores.push("ID es requerido");
    if (!data.nombre) errores.push("Nombre es requerido");
    if (!data.procedencia) errores.push("Procedencia es requerida");
    if (!data.condicionPago) errores.push("CondicionPago es requerida");

    if (!Array.isArray(data.items) || data.items.length === 0) {
      errores.push("La venta debe tener al menos un item");
    }

    if ((data.total || 0) <= 0) {
      errores.push("El total debe ser mayor a 0");
    }

    if (
      data.estado !== undefined &&
      !Object.values(VentaState).includes(data.estado)
    ) {
      errores.push("Estado de venta inválido");
    }

    if (
      data.condicionPago !== undefined &&
      !Object.values(CondicionPagoVenta).includes(data.condicionPago)
    ) {
      errores.push("CondicionPago de venta inválida");
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
        if (
          item.montoTotal !== undefined &&
          (!Number.isFinite(item.montoTotal) || item.montoTotal < 0)
        ) {
          errores.push(`Item ${index + 1}: montoTotal no puede ser negativo`);
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
    if (typeof item.montoTotal === "number" && Number.isFinite(item.montoTotal)) {
      return Venta.roundMoney(item.montoTotal);
    }
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
    return Venta.roundMoney(totalItems + this.impuesto + Number(this.montoRedondeo ?? 0));
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
