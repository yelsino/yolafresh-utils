import type { Cliente } from "../../personas/contracts/persons.contract";
import type { IUsuario } from "../../personas/contracts/usuario.contract";
import type { ActorInventarioSnapshot } from "../../inventario/contracts/inventory-quantity-v2.contract";
import { VentaState } from "../../shared/kernel/enums";
import { ProcedenciaVenta } from "./CarritoVenta";
import type { IVenta } from "./Venta";

export const VENTA_SNAPSHOT_TYPE = "venta_snapshot" as const;
export const VENTA_INVENTORY_PLAN_SCHEMA = "venta_inventory_plan_v2" as const;
export const VENTA_INVENTORY_PLAN_VERSION = 1 as const;

type VentaSnapshotActorSource =
  | VentaSnapshotActor
  | Cliente
  | IUsuario
  | {
      id?: string | null;
      nombre?: string;
      nombres?: string;
      apellidos?: string;
      username?: string;
      email?: string;
    }
  | null
  | undefined;

export interface VentaSnapshotActor {
  id?: string | null;
  nombre: string;
}

export interface VentaSnapshotItem {
  id: string;
  presentacionId: string;
  /** Decisión explícita congelada; `false` identifica servicios sin stock. */
  afectaInventario?: boolean;
  /** Snapshot de inventario; `cantidadVendida` continúa siendo cantidad comercial. */
  productoBaseId?: string;
  nombre: string;
  cantidadVendida: number;
  unidadBase?: string;
  factorConversionBase?: number;
  cantidadBase?: number;
  /**
   * Requerida si el item genera un movimiento Inventory V2. Solo puede faltar
   * en snapshots comerciales legacy o en items omitidos por la política.
   */
  versionConversion?: number;
  precioUnitario: number;
  total: number;
  imagenUrl?: string;
  unidadComercial?: string;
  montoModificado?: boolean;
  descuento?: number;
}

/**
 * Recibo durable de la política de inventario aplicada al confirmar la venta.
 * La partición se congela antes de persistir la venta y nunca se recalcula al
 * aplicar o recuperar su movimiento físico.
 */
export interface VentaInventoryPlan {
  schema: typeof VENTA_INVENTORY_PLAN_SCHEMA;
  version: typeof VENTA_INVENTORY_PLAN_VERSION;
  resueltoAt: number;
  almacenId: string;
  /** Actor que confirmó la venta; nunca se sustituye por quien ejecuta un replay. */
  actor: ActorInventarioSnapshot;
  registrarMovimientoItemIds: string[];
  omitidosPorPoliticaItemIds: string[];
}

export interface IVentaSnapshot {
  id: string;
  type: typeof VENTA_SNAPSHOT_TYPE;
  ventaId: string;
  createdAt: number;
  items: VentaSnapshotItem[];
  subtotal: number;
  descuentoTotal?: number;
  impuesto: number;
  montoRedondeo?: number;
  total: number;
  codigoVenta?: string;
  procedencia?: ProcedenciaVenta;
  cliente?: VentaSnapshotActor;
  vendedor?: VentaSnapshotActor;
  /** Almacén físico elegido por la orquestación; no redefine el hecho comercial. */
  almacenOrigenId?: string;
  /** Plan de inventario congelado previo a persistir una venta confirmada. */
  planInventarioV2?: VentaInventoryPlan;
}

export interface VentaSnapshotBuildContext {
  id?: string;
  createdAt?: number | Date;
  items?: VentaSnapshotItem[];
  cliente?: VentaSnapshotActorSource;
  vendedor?: VentaSnapshotActorSource;
  almacenOrigenId?: string;
  planInventarioV2?: VentaInventoryPlan;
}

export interface VentaSnapshotCreateInput extends Omit<IVentaSnapshot, "type"> {
  type?: typeof VENTA_SNAPSHOT_TYPE;
}

export interface VentaSnapshotBuildResult {
  snapshot?: VentaSnapshot;
  error?: Error;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumItemDiscounts(items?: Array<Partial<VentaSnapshotItem>>): number {
  return roundMoney(
    (items ?? []).reduce(
      (sum, item) => sum + Number(item.descuento ?? 0),
      0,
    ),
  );
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

const normalizedIds = (values: unknown): string[] =>
  Array.isArray(values)
    ? values
        .map((value) => safeTrim(typeof value === "string" ? value : undefined))
        .filter((value): value is string => Boolean(value))
    : [];

export function validarVentaInventoryPlan(
  plan: Partial<VentaInventoryPlan> | null | undefined,
  items: ReadonlyArray<Partial<VentaSnapshotItem>>,
  almacenOrigenId?: string,
): { valida: boolean; errores: string[] } {
  const errores: string[] = [];
  if (!plan || typeof plan !== "object") {
    return {
      valida: false,
      errores: ["VentaSnapshot.planInventarioV2 es requerido"],
    };
  }

  if (plan.schema !== VENTA_INVENTORY_PLAN_SCHEMA) {
    errores.push(
      `VentaSnapshot.planInventarioV2.schema debe ser '${VENTA_INVENTORY_PLAN_SCHEMA}'`,
    );
  }
  if (plan.version !== VENTA_INVENTORY_PLAN_VERSION) {
    errores.push(
      `VentaSnapshot.planInventarioV2.version debe ser ${VENTA_INVENTORY_PLAN_VERSION}`,
    );
  }
  if (!Number.isInteger(plan.resueltoAt) || Number(plan.resueltoAt) <= 0) {
    errores.push(
      "VentaSnapshot.planInventarioV2.resueltoAt debe ser un timestamp positivo",
    );
  }

  const planAlmacenId = safeTrim(plan.almacenId);
  const snapshotAlmacenId = safeTrim(almacenOrigenId);
  if (!planAlmacenId) {
    errores.push("VentaSnapshot.planInventarioV2.almacenId es requerido");
  }
  if (!snapshotAlmacenId) {
    errores.push(
      "VentaSnapshot.almacenOrigenId es requerido cuando existe planInventarioV2",
    );
  } else if (planAlmacenId && planAlmacenId !== snapshotAlmacenId) {
    errores.push(
      "VentaSnapshot.planInventarioV2.almacenId debe coincidir con almacenOrigenId",
    );
  }

  const actor = plan.actor;
  if (!actor || typeof actor !== "object") {
    errores.push("VentaSnapshot.planInventarioV2.actor es requerido");
  } else {
    if (!safeTrim(actor.usuarioId)) {
      errores.push(
        "VentaSnapshot.planInventarioV2.actor.usuarioId es requerido",
      );
    }
    for (const [field, value] of [
      ["usuarioNombre", actor.usuarioNombre],
      ["dispositivoId", actor.dispositivoId],
      ["sesionId", actor.sesionId],
    ] as const) {
      if (value !== undefined && !safeTrim(value)) {
        errores.push(
          `VentaSnapshot.planInventarioV2.actor.${field} no puede estar vacío`,
        );
      }
    }
  }

  if (!Array.isArray(plan.registrarMovimientoItemIds)) {
    errores.push(
      "VentaSnapshot.planInventarioV2.registrarMovimientoItemIds debe ser un arreglo",
    );
  }
  if (!Array.isArray(plan.omitidosPorPoliticaItemIds)) {
    errores.push(
      "VentaSnapshot.planInventarioV2.omitidosPorPoliticaItemIds debe ser un arreglo",
    );
  }

  const registrarIds = normalizedIds(plan.registrarMovimientoItemIds);
  const omitidosIds = normalizedIds(plan.omitidosPorPoliticaItemIds);
  const itemIds = items.map((item) => safeTrim(item.id));
  if (itemIds.some((itemId) => !itemId)) {
    errores.push(
      "VentaSnapshot.planInventarioV2 no puede particionar items sin id",
    );
  }

  const uniqueItemIds = new Set(itemIds.filter((id): id is string => Boolean(id)));
  if (uniqueItemIds.size !== itemIds.length) {
    errores.push(
      "VentaSnapshot.planInventarioV2 requiere ids de item únicos",
    );
  }
  if (new Set(registrarIds).size !== registrarIds.length) {
    errores.push(
      "VentaSnapshot.planInventarioV2.registrarMovimientoItemIds contiene duplicados",
    );
  }
  if (new Set(omitidosIds).size !== omitidosIds.length) {
    errores.push(
      "VentaSnapshot.planInventarioV2.omitidosPorPoliticaItemIds contiene duplicados",
    );
  }

  const registrarSet = new Set(registrarIds);
  const omitidosSet = new Set(omitidosIds);
  registrarIds.forEach((id) => {
    if (omitidosSet.has(id)) {
      errores.push(
        `VentaSnapshot.planInventarioV2 contiene el item '${id}' en ambas particiones`,
      );
    }
  });
  [...registrarIds, ...omitidosIds].forEach((id) => {
    if (!uniqueItemIds.has(id)) {
      errores.push(
        `VentaSnapshot.planInventarioV2 referencia el item inexistente '${id}'`,
      );
    }
  });
  uniqueItemIds.forEach((id) => {
    if (!registrarSet.has(id) && !omitidosSet.has(id)) {
      errores.push(
        `VentaSnapshot.planInventarioV2 no clasificó el item '${id}'`,
      );
    }
  });

  items.forEach((item, index) => {
    const itemId = safeTrim(item.id);
    if (item.afectaInventario === false) {
      if (itemId && registrarSet.has(itemId)) {
        errores.push(
          `VentaSnapshot.items[${index}] no inventariable no puede registrar movimiento`,
        );
      }
      if (
        item.productoBaseId !== undefined ||
        item.unidadBase !== undefined ||
        item.factorConversionBase !== undefined ||
        item.cantidadBase !== undefined ||
        item.versionConversion !== undefined
      ) {
        errores.push(
          `VentaSnapshot.items[${index}] no inventariable no debe contener conversión física`,
        );
      }
      return;
    }
    if (!itemId || !registrarSet.has(itemId)) return;
    if (!safeTrim(item.productoBaseId)) {
      errores.push(
        `VentaSnapshot.items[${index}].productoBaseId es requerido por planInventarioV2`,
      );
    }
    const factorConversionBase = Number(item.factorConversionBase);
    const cantidadBase = Number(item.cantidadBase);
    const versionConversion = item.versionConversion;
    if (!safeTrim(item.unidadBase)) {
      errores.push(
        `VentaSnapshot.items[${index}].unidadBase es requerida para movimiento planificado`,
      );
    }
    if (
      !Number.isFinite(factorConversionBase) ||
      factorConversionBase <= 0
    ) {
      errores.push(
        `VentaSnapshot.items[${index}].factorConversionBase es requerido para movimiento planificado`,
      );
    }
    if (!Number.isFinite(cantidadBase) || cantidadBase <= 0) {
      errores.push(
        `VentaSnapshot.items[${index}].cantidadBase es requerida para movimiento planificado`,
      );
    }
    if (
      !Number.isSafeInteger(versionConversion) ||
      Number(versionConversion) < 1
    ) {
      errores.push(
        `VentaSnapshot.items[${index}].versionConversion es requerida para movimiento planificado y debe ser entero seguro positivo`,
      );
    }
  });

  return { valida: errores.length === 0, errores };
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
    const nombreCompleto = [source.nombres, source.apellidos].filter(Boolean).join(" ");
    return buildActor(
      typeof source.id === "string" ? source.id : undefined,
      nombreCompleto || source.nombres,
    );
  }

  if ("username" in source) {
    return buildActor(
      typeof source.id === "string" ? source.id : undefined,
      source.username || source.email,
    );
  }

  return undefined;
}

export function isVentaSnapshotImmutableState(
  estado: string | undefined,
): boolean {
  return estado === VentaState.CONFIRMADA || estado === VentaState.ANULADA;
}

export class VentaSnapshot implements IVentaSnapshot {
  public readonly id: string;
  public readonly type: typeof VENTA_SNAPSHOT_TYPE;
  public readonly ventaId: string;
  public readonly createdAt: number;
  public readonly items: VentaSnapshotItem[];
  public readonly subtotal: number;
  public readonly descuentoTotal?: number;
  public readonly impuesto: number;
  public readonly montoRedondeo?: number;
  public readonly total: number;
  public readonly codigoVenta?: string;
  public readonly procedencia?: ProcedenciaVenta;
  public readonly cliente?: VentaSnapshotActor;
  public readonly vendedor?: VentaSnapshotActor;
  public readonly almacenOrigenId?: string;
  public readonly planInventarioV2?: VentaInventoryPlan;

  constructor(data: VentaSnapshotCreateInput) {
    this.id = data.id;
    this.type = data.type ?? VENTA_SNAPSHOT_TYPE;
    this.ventaId = data.ventaId;
    this.createdAt = normalizeDate(data.createdAt);
    this.items = Object.freeze(
      data.items.map((item) => ({
        ...item,
        afectaInventario:
          typeof item.afectaInventario === "boolean"
            ? item.afectaInventario
            : undefined,
        nombre: safeTrim(item.nombre) ?? item.presentacionId,
        productoBaseId: safeTrim(item.productoBaseId),
        imagenUrl: safeTrim(item.imagenUrl),
        unidadComercial: safeTrim(item.unidadComercial),
        cantidadVendida: Number(item.cantidadVendida ?? 0),
        unidadBase: safeTrim(item.unidadBase),
        factorConversionBase:
          typeof item.factorConversionBase === "number"
            ? Number(item.factorConversionBase)
            : undefined,
        cantidadBase:
          typeof item.cantidadBase === "number"
            ? Number(item.cantidadBase)
            : undefined,
        versionConversion:
          typeof item.versionConversion === "number"
            ? Number(item.versionConversion)
            : undefined,
        precioUnitario: roundMoney(Number(item.precioUnitario ?? 0)),
        total: roundMoney(Number(item.total ?? 0)),
        montoModificado:
          typeof item.montoModificado === "boolean" ? item.montoModificado : undefined,
        descuento:
          typeof item.descuento === "number"
            ? roundMoney(Number(item.descuento))
            : undefined,
      })),
    ) as VentaSnapshotItem[];
    this.subtotal = roundMoney(Number(data.subtotal ?? 0));
    this.descuentoTotal =
      data.descuentoTotal === undefined
        ? undefined
        : roundMoney(Number(data.descuentoTotal ?? 0));
    this.impuesto = roundMoney(Number(data.impuesto ?? 0));
    this.montoRedondeo =
      data.montoRedondeo === undefined
        ? undefined
        : roundMoney(Number(data.montoRedondeo ?? 0));
    this.total = roundMoney(Number(data.total ?? 0));
    this.codigoVenta = safeTrim(data.codigoVenta);
    this.procedencia = data.procedencia;
    this.cliente = data.cliente ? { ...data.cliente } : undefined;
    this.vendedor = data.vendedor ? { ...data.vendedor } : undefined;
    this.almacenOrigenId = safeTrim(data.almacenOrigenId);
    this.planInventarioV2 = data.planInventarioV2
      ? (Object.freeze({
          schema: data.planInventarioV2.schema,
          version: data.planInventarioV2.version,
          resueltoAt: Number(data.planInventarioV2.resueltoAt),
          almacenId: safeTrim(data.planInventarioV2.almacenId) ?? "",
          actor: Object.freeze({
            usuarioId: safeTrim(data.planInventarioV2.actor?.usuarioId) ?? "",
            ...(safeTrim(data.planInventarioV2.actor?.usuarioNombre)
              ? { usuarioNombre: safeTrim(data.planInventarioV2.actor?.usuarioNombre) }
              : {}),
            ...(safeTrim(data.planInventarioV2.actor?.dispositivoId)
              ? { dispositivoId: safeTrim(data.planInventarioV2.actor?.dispositivoId) }
              : {}),
            ...(safeTrim(data.planInventarioV2.actor?.sesionId)
              ? { sesionId: safeTrim(data.planInventarioV2.actor?.sesionId) }
              : {}),
          }),
          registrarMovimientoItemIds: Object.freeze(
            normalizedIds(data.planInventarioV2.registrarMovimientoItemIds),
          ) as string[],
          omitidosPorPoliticaItemIds: Object.freeze(
            normalizedIds(data.planInventarioV2.omitidosPorPoliticaItemIds),
          ) as string[],
        }) as VentaInventoryPlan)
      : undefined;

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
      descuentoTotal: this.descuentoTotal,
      impuesto: this.impuesto,
      montoRedondeo: this.montoRedondeo,
      total: this.total,
      codigoVenta: this.codigoVenta,
      procedencia: this.procedencia,
      cliente: this.cliente ? { ...this.cliente } : undefined,
      vendedor: this.vendedor ? { ...this.vendedor } : undefined,
      almacenOrigenId: this.almacenOrigenId,
      planInventarioV2: this.planInventarioV2
          ? {
            ...this.planInventarioV2,
            actor: { ...this.planInventarioV2.actor },
            registrarMovimientoItemIds: [
              ...this.planInventarioV2.registrarMovimientoItemIds,
            ],
            omitidosPorPoliticaItemIds: [
              ...this.planInventarioV2.omitidosPorPoliticaItemIds,
            ],
          }
        : undefined,
    };
  }

  static fromJSON(snapshot: IVentaSnapshot): VentaSnapshot {
    return new VentaSnapshot(snapshot);
  }

  static fromVenta(
    venta: IVenta,
    context: VentaSnapshotBuildContext = {},
  ): VentaSnapshot {
    const items = context.items;
    if (!items) {
      throw new Error(
        "VentaSnapshotBuildContext.items es requerido porque Venta.items solo contiene el conteo",
      );
    }
    if (items.length !== venta.items) {
      throw new Error(
        "Venta.items debe coincidir con la cantidad de VentaSnapshot.items",
      );
    }
    const descuentoTotal = sumItemDiscounts(items);

    return new VentaSnapshot({
      id: safeTrim(context.id) ?? buildVentaSnapshotId(venta.id),
      ventaId: venta.id,
      createdAt: normalizeDate(context.createdAt ?? venta.createdAt ?? Date.now()),
      items,
      subtotal: venta.subtotal,
      descuentoTotal,
      impuesto: venta.impuesto,
      montoRedondeo:
        typeof venta.montoRedondeo === "number"
          ? roundMoney(Number(venta.montoRedondeo))
          : undefined,
      total: venta.total,
      codigoVenta: venta.codigoVenta,
      procedencia: venta.procedencia,
      cliente: mapVentaSnapshotActor(context.cliente),
      vendedor: mapVentaSnapshotActor(context.vendedor),
      almacenOrigenId: safeTrim(context.almacenOrigenId),
      planInventarioV2: context.planInventarioV2,
    });
  }

  static tryFromVenta(
    venta: IVenta,
    context: VentaSnapshotBuildContext = {},
  ): VentaSnapshotBuildResult {
    try {
      return { snapshot: VentaSnapshot.fromVenta(venta, context) };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
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

    if (Number(data.descuentoTotal ?? sumItemDiscounts(data.items)) < 0) {
      errores.push("VentaSnapshot.descuentoTotal no puede ser negativo");
    }

    if (Number(data.impuesto ?? 0) < 0) {
      errores.push("VentaSnapshot.impuesto no puede ser negativo");
    }

    if (Number(data.total ?? 0) < 0) {
      errores.push("VentaSnapshot.total no puede ser negativo");
    }

    const descuentoTotal = roundMoney(
      Number(data.descuentoTotal ?? sumItemDiscounts(data.items)),
    );
    const montoRedondeo = roundMoney(Number(data.montoRedondeo ?? 0));
    if (
      roundMoney(
        Number(data.subtotal ?? 0) - descuentoTotal + Number(data.impuesto ?? 0) + montoRedondeo,
      ) !==
      roundMoney(Number(data.total ?? 0))
    ) {
      errores.push(
        "VentaSnapshot.total debe ser consistente con subtotal - descuentoTotal + impuesto + montoRedondeo",
      );
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

      if (
        item.afectaInventario !== undefined &&
        typeof item.afectaInventario !== "boolean"
      ) {
        errores.push(
          `VentaSnapshot.items[${index}].afectaInventario debe ser booleano`,
        );
      }

      if (
        item.afectaInventario === false &&
        (item.productoBaseId !== undefined ||
          item.unidadBase !== undefined ||
          item.factorConversionBase !== undefined ||
          item.cantidadBase !== undefined ||
          item.versionConversion !== undefined)
      ) {
        errores.push(
          `VentaSnapshot.items[${index}] no inventariable no debe contener conversión física`,
        );
      }

      if (Number(item.cantidadVendida ?? 0) <= 0) {
        errores.push(
          `VentaSnapshot.items[${index}].cantidadVendida debe ser mayor a 0`,
        );
      }

      if (
        item.factorConversionBase !== undefined &&
        (!Number.isFinite(item.factorConversionBase) ||
          item.factorConversionBase <= 0)
      ) {
        errores.push(
          `VentaSnapshot.items[${index}].factorConversionBase debe ser mayor a 0`,
        );
      }

      if (
        item.cantidadBase !== undefined &&
        (!Number.isFinite(item.cantidadBase) || item.cantidadBase <= 0)
      ) {
        errores.push(
          `VentaSnapshot.items[${index}].cantidadBase debe ser mayor a 0`,
        );
      }

      if (
        item.versionConversion !== undefined &&
        (!Number.isSafeInteger(item.versionConversion) ||
          item.versionConversion < 1)
      ) {
        errores.push(
          `VentaSnapshot.items[${index}].versionConversion debe ser entero seguro positivo`,
        );
      }

      if (
        item.factorConversionBase !== undefined &&
        item.cantidadBase !== undefined
      ) {
        const cantidadBaseEsperada =
          Math.round(
            Number(item.cantidadVendida ?? 0) *
              item.factorConversionBase *
              1_000_000,
          ) / 1_000_000;
        if (Math.abs(cantidadBaseEsperada - item.cantidadBase) > 0.000001) {
          errores.push(
            `VentaSnapshot.items[${index}].cantidadBase es inconsistente con cantidadVendida y factorConversionBase`,
          );
        }
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

      if (
        item.montoModificado !== undefined &&
        typeof item.montoModificado !== "boolean"
      ) {
        errores.push(
          `VentaSnapshot.items[${index}].montoModificado debe ser booleano`,
        );
      }
    });

    if (data.planInventarioV2 !== undefined) {
      errores.push(
        ...validarVentaInventoryPlan(
          data.planInventarioV2,
          data.items ?? [],
          data.almacenOrigenId,
        ).errores,
      );

    }

    return {
      valida: errores.length === 0,
      errores,
    };
  }
}
