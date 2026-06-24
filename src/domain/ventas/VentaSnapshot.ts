import type { Cliente } from "@/domain/shared/interfaces/persons";
import type { IUsuario } from "@/domain/shared/interfaces/usuario";
import { ProcedenciaVenta } from "./CarritoVenta";
import type {
  VentaClienteSnapshot,
  VentaCouchMinimalSnapshot,
  VentaDetalleSnapshot,
  VentaItemSnapshot,
  VentaPersistenceSnapshot,
  VentaPersonalSnapshot,
} from "./snapshots";
import type { IVenta, VentaItem } from "./Venta";

export const VENTA_SNAPSHOT_TYPE = "venta_snapshot" as const;

type LegacyDetalleVenta =
  | VentaDetalleSnapshot
  | VentaPersistenceSnapshot["detalleVenta"]
  | VentaCouchMinimalSnapshot["detalleVenta"];

type LegacyDetalleVentaItem = LegacyDetalleVenta["items"][number];

type VentaLike = IVenta & {
  productosUnicos?: Array<{
    id: string;
    nombre: string;
    cantidadTotal: number;
    montoTotal: number;
  }>;
};

type VentaSnapshotActorSource =
  | VentaSnapshotActor
  | VentaClienteSnapshot
  | VentaPersonalSnapshot
  | Cliente
  | IUsuario
  | null
  | undefined;

export interface VentaSnapshotActor {
  id?: string | null;
  nombre: string;
}

export interface VentaSnapshotItem {
  id: string;
  presentacionId: string;
  nombre: string;
  cantidadVendida: number;
  precioUnitario: number;
  total: number;
  imagenUrl?: string;
  unidadComercial?: string;
  descuento?: number;
}

export interface IVentaSnapshot {
  id: string;
  type: typeof VENTA_SNAPSHOT_TYPE;
  ventaId: string;
  createdAt: number;
  items: VentaSnapshotItem[];
  subtotal: number;
  impuesto: number;
  total: number;
  codigoVenta?: string;
  procedencia?: ProcedenciaVenta;
  cliente?: VentaSnapshotActor;
  vendedor?: VentaSnapshotActor;
}

export interface VentaSnapshotBuildContext {
  id?: string;
  createdAt?: number | Date;
  items?: VentaSnapshotItem[];
  detalleVenta?: LegacyDetalleVenta;
  cliente?: VentaSnapshotActorSource;
  vendedor?: VentaSnapshotActorSource;
}

export interface VentaSnapshotCreateInput
  extends Omit<IVentaSnapshot, "type"> {
  type?: typeof VENTA_SNAPSHOT_TYPE;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeDate(value?: number | Date): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  return typeof value === "number" ? value : Date.now();
}

function safeTrim(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function buildActor(id?: string | null, nombre?: string): VentaSnapshotActor | undefined {
  const cleanNombre = safeTrim(nombre);
  const cleanId = safeTrim(id ?? undefined) ?? null;

  if (!cleanNombre && cleanId === null) {
    return undefined;
  }

  return {
    id: cleanId,
    nombre: cleanNombre ?? cleanId ?? "sin_nombre_visible",
  };
}

function isCliente(source: VentaSnapshotActorSource): source is Cliente {
  return Boolean(
    source &&
      typeof source === "object" &&
      "tipoEntidad" in source &&
      source.tipoEntidad === "Cliente",
  );
}

function isUsuario(source: VentaSnapshotActorSource): source is IUsuario {
  return Boolean(
    source &&
      typeof source === "object" &&
      "username" in source &&
      "roles" in source &&
      "passwordHash" in source,
  );
}

export function buildVentaSnapshotId(ventaId: string): string {
  const cleanVentaId = safeTrim(ventaId);
  if (!cleanVentaId) {
    throw new Error("ventaId es requerido para construir VentaSnapshot.id");
  }

  return `${cleanVentaId}:snapshot`;
}

export function mapVentaSnapshotActor(
  source: VentaSnapshotActorSource,
): VentaSnapshotActor | undefined {
  if (!source) {
    return undefined;
  }

  if (isCliente(source)) {
    const nombreCompleto = [source.nombres, source.apellidos].filter(Boolean).join(" ");
    return buildActor(source.id, nombreCompleto || source.pseudonimo);
  }

  if (isUsuario(source)) {
    return buildActor(source.id, source.username || source.email);
  }

  if ("nombre" in source) {
    return buildActor(
      typeof source.id === "string" ? source.id : undefined,
      source.nombre,
    );
  }

  if ("nombres" in source) {
    return buildActor(source.id, source.nombres);
  }

  if ("username" in source) {
    return buildActor(source.id, source.username || source.email);
  }

  return undefined;
}

function getLegacyItemPresentacionId(item: LegacyDetalleVentaItem): string {
  const presentacionId = safeTrim(item.product?.id);
  if (!presentacionId) {
    throw new Error(`Venta snapshot legacy sin product.id (${item.id})`);
  }

  return presentacionId;
}

function getLegacyItemNombre(item: LegacyDetalleVentaItem): string {
  const nombre =
    "displayName" in item
      ? safeTrim(item.displayName)
      : undefined;

  const nombreProducto =
    item.product && "nombre" in item.product
      ? safeTrim(item.product.nombre)
      : undefined;

  const productoBaseNombre =
    "productoBaseNombre" in item
      ? safeTrim(item.productoBaseNombre)
      : undefined;

  return nombre ?? nombreProducto ?? productoBaseNombre ?? getLegacyItemPresentacionId(item);
}

function getLegacyItemTotal(item: LegacyDetalleVentaItem): number {
  const quantity = Number(item.quantity ?? 0);
  const precioUnitario = Number(item.precioUnitario ?? 0);
  const descuento = Number(item.descuento ?? 0);
  const montoTotal = Number(item.montoTotal ?? Number.NaN);

  if (Number.isFinite(montoTotal)) {
    return roundMoney(montoTotal);
  }

  return roundMoney(quantity * precioUnitario - descuento);
}

function getLegacyImagenUrl(item: LegacyDetalleVentaItem): string | undefined {
  const imagenSmall = safeTrim(item.product?.imagen?.sizes?.small);
  return imagenSmall;
}

function getLegacyUnidadComercial(item: LegacyDetalleVentaItem): string | undefined {
  const contenidoNeto = item.product?.contenidoNeto;
  const unidadContenido = item.product?.unidadContenido;
  const tipoEmpaque = safeTrim(item.product?.tipoEmpaque);
  const tipoVenta =
    item.product?.tipoVenta !== undefined
      ? String(item.product.tipoVenta)
      : undefined;

  if (typeof contenidoNeto === "number" && unidadContenido !== undefined) {
    return `${contenidoNeto} ${String(unidadContenido)}`;
  }

  return tipoEmpaque ?? tipoVenta;
}

export function mapLegacyVentaItemToSnapshotItem(
  item: LegacyDetalleVentaItem,
): VentaSnapshotItem {
  const presentacionId = getLegacyItemPresentacionId(item);
  const cantidadVendida = Number(item.quantity ?? 0);
  const precioUnitario = Number(item.precioUnitario ?? 0);
  const descuento =
    typeof item.descuento === "number" ? Number(item.descuento) : undefined;

  return {
    id: item.id,
    presentacionId,
    nombre: getLegacyItemNombre(item),
    cantidadVendida,
    precioUnitario,
    total: getLegacyItemTotal(item),
    imagenUrl: getLegacyImagenUrl(item),
    unidadComercial: getLegacyUnidadComercial(item),
    descuento,
  };
}

export function mapVentaItemToSnapshotItem(
  item: VentaItem,
  options?: { nombre?: string },
): VentaSnapshotItem {
  const descuento =
    typeof item.descuento === "number" ? Number(item.descuento) : undefined;

  return {
    id: item.id,
    presentacionId: item.presentacionId,
    nombre: safeTrim(options?.nombre) ?? item.presentacionId,
    cantidadVendida: Number(item.cantidadVendida ?? 0),
    precioUnitario: Number(item.precioUnitario ?? 0),
    total:
      typeof item.montoTotal === "number" && Number.isFinite(item.montoTotal)
        ? roundMoney(item.montoTotal)
        : roundMoney(
            Number(item.precioUnitario ?? 0) * Number(item.cantidadVendida ?? 0) -
              Number(item.descuento ?? 0),
          ),
    descuento,
  };
}

function mapVentaItemsFromVenta(venta: VentaLike): VentaSnapshotItem[] {
  const nombresPorPresentacion = new Map<string, string>();

  venta.productosUnicos?.forEach((producto) => {
    nombresPorPresentacion.set(producto.id, producto.nombre);
  });

  return venta.items.map((item) =>
    mapVentaItemToSnapshotItem(item, {
      nombre: nombresPorPresentacion.get(item.presentacionId),
    }),
  );
}

function mapVentaItemsFromDetalle(detalleVenta: LegacyDetalleVenta): VentaSnapshotItem[] {
  return detalleVenta.items.map((item) => mapLegacyVentaItemToSnapshotItem(item));
}

export function isVentaSnapshotImmutableState(
  estado: string | undefined,
): boolean {
  return estado === "CONFIRMADA" || estado === "DESPACHADA";
}

export class VentaSnapshot implements IVentaSnapshot {
  public readonly id: string;
  public readonly type: typeof VENTA_SNAPSHOT_TYPE;
  public readonly ventaId: string;
  public readonly createdAt: number;
  public readonly items: VentaSnapshotItem[];
  public readonly subtotal: number;
  public readonly impuesto: number;
  public readonly total: number;
  public readonly codigoVenta?: string;
  public readonly procedencia?: ProcedenciaVenta;
  public readonly cliente?: VentaSnapshotActor;
  public readonly vendedor?: VentaSnapshotActor;

  constructor(data: VentaSnapshotCreateInput) {
    this.id = data.id;
    this.type = data.type ?? VENTA_SNAPSHOT_TYPE;
    this.ventaId = data.ventaId;
    this.createdAt = normalizeDate(data.createdAt);
    this.items = Object.freeze(
      data.items.map((item) => ({
        ...item,
        cantidadVendida: Number(item.cantidadVendida ?? 0),
        precioUnitario: roundMoney(Number(item.precioUnitario ?? 0)),
        total: roundMoney(Number(item.total ?? 0)),
        descuento:
          typeof item.descuento === "number"
            ? roundMoney(Number(item.descuento))
            : undefined,
      })),
    ) as VentaSnapshotItem[];
    this.subtotal = roundMoney(Number(data.subtotal ?? 0));
    this.impuesto = roundMoney(Number(data.impuesto ?? 0));
    this.total = roundMoney(Number(data.total ?? 0));
    this.codigoVenta = safeTrim(data.codigoVenta);
    this.procedencia = data.procedencia;
    this.cliente = data.cliente ? { ...data.cliente } : undefined;
    this.vendedor = data.vendedor ? { ...data.vendedor } : undefined;

    const validation = VentaSnapshot.validar(this.toJSON());
    if (!validation.valida) {
      throw new Error(validation.errores.join("; "));
    }
  }

  toJSON(): IVentaSnapshot {
    return {
      id: this.id,
      type: this.type,
      ventaId: this.ventaId,
      createdAt: this.createdAt,
      items: this.items.map((item) => ({ ...item })),
      subtotal: this.subtotal,
      impuesto: this.impuesto,
      total: this.total,
      codigoVenta: this.codigoVenta,
      procedencia: this.procedencia,
      cliente: this.cliente ? { ...this.cliente } : undefined,
      vendedor: this.vendedor ? { ...this.vendedor } : undefined,
    };
  }

  toPersistenceSnapshot(): IVentaSnapshot {
    return this.toJSON();
  }

  static fromVenta(
    venta: VentaLike,
    context: VentaSnapshotBuildContext = {},
  ): VentaSnapshot {
    const items =
      context.items ??
      (context.detalleVenta
        ? mapVentaItemsFromDetalle(context.detalleVenta)
        : mapVentaItemsFromVenta(venta));

    return new VentaSnapshot({
      id: safeTrim(context.id) ?? buildVentaSnapshotId(venta.id),
      ventaId: venta.id,
      createdAt: normalizeDate(context.createdAt ?? venta.createdAt ?? Date.now()),
      items,
      subtotal: venta.subtotal,
      impuesto: venta.impuesto,
      total: venta.total,
      codigoVenta: venta.codigoVenta,
      procedencia: venta.procedencia,
      cliente: mapVentaSnapshotActor(context.cliente),
      vendedor: mapVentaSnapshotActor(context.vendedor),
    });
  }

  static fromPersistenceSnapshot(
    snapshot: VentaPersistenceSnapshot,
  ): VentaSnapshot {
    return new VentaSnapshot({
      id: buildVentaSnapshotId(snapshot.id),
      ventaId: snapshot.id,
      createdAt: snapshot.createdAt,
      items: mapVentaItemsFromDetalle(snapshot.detalleVenta),
      subtotal: snapshot.subtotal,
      impuesto: snapshot.impuesto,
      total: snapshot.total,
      codigoVenta: snapshot.codigoVenta,
      procedencia: snapshot.procedencia as ProcedenciaVenta,
      cliente: mapVentaSnapshotActor(snapshot.detalleVenta.cliente),
      vendedor: mapVentaSnapshotActor(snapshot.detalleVenta.personal),
    });
  }

  static fromCouchSnapshot(snapshot: VentaCouchMinimalSnapshot): VentaSnapshot {
    return new VentaSnapshot({
      id: buildVentaSnapshotId(snapshot.id),
      ventaId: snapshot.id,
      createdAt: snapshot.createdAt,
      items: mapVentaItemsFromDetalle(snapshot.detalleVenta),
      subtotal: snapshot.subtotal,
      impuesto: snapshot.impuesto,
      total: snapshot.total,
      codigoVenta: snapshot.codigoVenta,
      procedencia: snapshot.procedencia as ProcedenciaVenta,
      cliente: mapVentaSnapshotActor(snapshot.detalleVenta.cliente),
      vendedor: mapVentaSnapshotActor(snapshot.detalleVenta.personal),
    });
  }

  static validar(
    data: Partial<IVentaSnapshot>,
  ): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!safeTrim(data.id)) {
      errores.push("VentaSnapshot.id es requerido");
    }

    if (data.type !== VENTA_SNAPSHOT_TYPE) {
      errores.push(`VentaSnapshot.type debe ser '${VENTA_SNAPSHOT_TYPE}'`);
    }

    if (!safeTrim(data.ventaId)) {
      errores.push("VentaSnapshot.ventaId es requerido");
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      errores.push("VentaSnapshot.items debe tener al menos un elemento");
    }

    if (Number(data.subtotal ?? 0) < 0) {
      errores.push("VentaSnapshot.subtotal no puede ser negativo");
    }

    if (Number(data.impuesto ?? 0) < 0) {
      errores.push("VentaSnapshot.impuesto no puede ser negativo");
    }

    if (Number(data.total ?? 0) < 0) {
      errores.push("VentaSnapshot.total no puede ser negativo");
    }

    if (roundMoney(Number(data.subtotal ?? 0) + Number(data.impuesto ?? 0)) !== roundMoney(Number(data.total ?? 0))) {
      errores.push("VentaSnapshot.total debe ser consistente con subtotal + impuesto");
    }

    data.items?.forEach((item, index) => {
      if (!safeTrim(item.id)) {
        errores.push(`VentaSnapshot.items[${index}].id es requerido`);
      }

      if (!safeTrim(item.presentacionId)) {
        errores.push(
          `VentaSnapshot.items[${index}].presentacionId es requerido`,
        );
      }

      if (!safeTrim(item.nombre)) {
        errores.push(`VentaSnapshot.items[${index}].nombre es requerido`);
      }

      if (Number(item.cantidadVendida ?? 0) <= 0) {
        errores.push(
          `VentaSnapshot.items[${index}].cantidadVendida debe ser mayor a 0`,
        );
      }

      if (Number(item.precioUnitario ?? 0) < 0) {
        errores.push(
          `VentaSnapshot.items[${index}].precioUnitario no puede ser negativo`,
        );
      }

      if (Number(item.total ?? 0) < 0) {
        errores.push(`VentaSnapshot.items[${index}].total no puede ser negativo`);
      }

      if (Number(item.descuento ?? 0) < 0) {
        errores.push(
          `VentaSnapshot.items[${index}].descuento no puede ser negativo`,
        );
      }
    });

    return {
      valida: errores.length === 0,
      errores,
    };
  }
}
