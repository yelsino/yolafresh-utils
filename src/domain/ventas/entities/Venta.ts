import { CarItem, CarritoVenta, ICarritoVenta, ProcedenciaVenta } from "./CarritoVenta";
import { AggregateRoot } from "../../shared/base/AggregateRoot";
import { VentaConfirmada } from "../events/VentaConfirmada";
import { CondicionPagoVenta, VentaState } from "../../shared/kernel/enums";
import {
  IVentaSnapshot,
  VentaSnapshot,
  VentaSnapshotBuildContext,
  VentaSnapshotBuildResult,
  VentaSnapshotItem,
} from "./VentaSnapshot";

/**
 * Resumen comercial persistible de una venta.
 *
 * `items` contiene únicamente la cantidad de líneas del snapshot asociado.
 * El detalle transaccional e histórico vive en `VentaSnapshotItem` para evitar
 * duplicar arrays entre los documentos `venta` y `venta_snapshot`.
 */
export interface IVenta {
  id: string;
  nombre: string;
  type: string;
  estado: VentaState;
  condicionPago: CondicionPagoVenta;
  items: number;
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
  /**
   * Detalle transitorio utilizado para construir el snapshot en la misma
   * operación. No se serializa dentro de `IVenta`.
   */
  snapshotItems?: VentaSnapshotItem[];
}

export class Venta extends AggregateRoot<string> implements IVenta {
  static roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private static mapCarItemToSnapshotItem(item: CarItem): VentaSnapshotItem {
    const presentacionId = String(item.product?.id || "").trim();
    if (!presentacionId) {
      throw new Error(
        "CarItem.product.id es requerido para crear VentaSnapshotItem",
      );
    }

    const cantidadVendida = Number(item.quantity ?? 0);
    const precioUnitario = Number(
      item.precioUnitario ?? item.product?.precioVenta ?? 0,
    );
    const descuento =
      typeof item.descuento === "number"
        ? Venta.roundMoney(Number(item.descuento))
        : undefined;
    const totalBruto =
      typeof item.montoTotal === "number" && Number.isFinite(item.montoTotal)
        ? item.montoTotal
        : precioUnitario * cantidadVendida;

    return {
      id: item.id,
      presentacionId,
      nombre: String(item.product?.nombre || presentacionId).trim(),
      cantidadVendida,
      precioUnitario: Venta.roundMoney(precioUnitario),
      total: Venta.roundMoney(totalBruto),
      imagenUrl: item.product?.imagen?.sizes?.small,
      unidadComercial: item.product?.unidadContenido,
      montoModificado:
        typeof item.montoModificado === "boolean"
          ? item.montoModificado
          : undefined,
      descuento,
    };
  }

  public readonly nombre: string;
  public readonly type: string;
  public estado: VentaState;
  public readonly condicionPago: CondicionPagoVenta;
  public readonly items: number;
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
  private readonly snapshotItems?: readonly VentaSnapshotItem[];

  constructor(data: VentaCreateInput) {
    super(data.id);

    if (!data.id || !data.nombre) {
      throw new Error("ID y nombre son requeridos para crear una venta");
    }

    this.nombre = data.nombre;
    this.type = data.type || "venta";
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.items = Number(data.items);
    this.snapshotItems = data.snapshotItems
      ? Object.freeze(data.snapshotItems.map((item) => ({ ...item })))
      : undefined;
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

    if (this.snapshotItems && this.snapshotItems.length !== this.items) {
      throw new Error(
        "Venta.items debe coincidir con la cantidad de VentaSnapshot.items",
      );
    }
  }

  get cantidadItems(): number {
    return this.items;
  }

  get estaProcesada(): boolean {
    return this.estado === VentaState.CONFIRMADA;
  }

  get esUnPedido(): boolean {
    return Boolean(this.pedidoId);
  }

  get resumen(): {
    cantidadItems: number;
    subtotal: number;
    impuesto: number;
    total: number;
  } {
    return {
      cantidadItems: this.cantidadItems,
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
    };
  }

  confirmar(): void {
    if (this.items <= 0) {
      throw new Error("No se puede confirmar venta sin items");
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
      items: this.items,
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
    return VentaSnapshot.fromVenta(this, {
      ...context,
      items: context.items ?? this.cloneTransientSnapshotItems(),
    }).toJSON();
  }

  tryToVentaSnapshot(
    context: VentaSnapshotBuildContext = {},
  ): { snapshot?: IVentaSnapshot; error?: Error } {
    const result: VentaSnapshotBuildResult = VentaSnapshot.tryFromVenta(this, {
      ...context,
      items: context.items ?? this.cloneTransientSnapshotItems(),
    });

    if (!result.snapshot) {
      return {
        error: result.error ?? new Error("No se pudo construir VentaSnapshot"),
      };
    }

    return { snapshot: result.snapshot.toJSON() };
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
    const snapshotItems = detalle.items.map((item) =>
      Venta.mapCarItemToSnapshotItem(item),
    );

    return new Venta({
      id,
      nombre: options?.nombre ?? carritoJSON.nombre ?? "Venta",
      type: "venta",
      estado: VentaState.CONFIRMADA,
      condicionPago: options?.condicionPago ?? CondicionPagoVenta.CONTADO,
      createdAt: ahora,
      updatedAt: ahora,
      items: snapshotItems.length,
      snapshotItems,
      pedidoId: options?.pedidoId,
      subtotal: detalle.subtotal,
      impuesto: detalle.impuesto,
      total: totalFinal,
      montoRedondeo,
      procedencia: carritoJSON.procedencia || ProcedenciaVenta.Tienda,
      clienteId: carritoInstance.cliente?.id,
      vendedorId: carritoInstance.personal?.id,
      codigoVenta: "",
      numeroVenta: "",
      costoEnvio: 0,
    });
  }

  static validar(
    data: Partial<VentaCreateInput>,
  ): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!data.id) errores.push("ID es requerido");
    if (!data.nombre) errores.push("Nombre es requerido");
    if (!data.procedencia) errores.push("Procedencia es requerida");
    if (!data.condicionPago) errores.push("CondicionPago es requerida");

    if (
      typeof data.items !== "number" ||
      !Number.isInteger(data.items) ||
      data.items <= 0
    ) {
      errores.push("Venta.items debe ser un entero mayor a 0");
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

    if ((data.subtotal || 0) < 0) {
      errores.push("El subtotal no puede ser negativo");
    }
    if ((data.impuesto || 0) < 0) {
      errores.push("El impuesto no puede ser negativo");
    }
    if (
      data.montoRedondeo !== undefined &&
      !Number.isFinite(data.montoRedondeo)
    ) {
      errores.push("montoRedondeo debe ser un número finito");
    }
    if (data.costoEnvio !== undefined && data.costoEnvio < 0) {
      errores.push("El costo de envío no puede ser negativo");
    }

    return {
      valida: errores.length === 0,
      errores,
    };
  }

  private cloneTransientSnapshotItems(): VentaSnapshotItem[] | undefined {
    return this.snapshotItems?.map((item) => ({ ...item }));
  }
}
