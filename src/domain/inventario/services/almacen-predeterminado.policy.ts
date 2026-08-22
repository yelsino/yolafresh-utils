import type { Almacen } from "../contracts/inventario.contract";

export type OrigenSeleccionAlmacen =
  | "UNICO_DISPONIBLE"
  | "CONFIGURADO"
  | "SELECCION_REQUERIDA"
  | "SIN_ALMACENES";

export interface ResolucionAlmacenPredeterminado {
  almacen: Almacen | null;
  almacenId: string | null;
  origen: OrigenSeleccionAlmacen;
  requiereSeleccion: boolean;
  configuracionInvalida: boolean;
  totalDisponibles: number;
}

const normalizeId = (value: unknown): string => String(value ?? "").trim();

/**
 * Resuelve un almacén sobre el conjunto que el operador puede utilizar.
 *
 * No decide por nombre, tipo ni orden. Con varios almacenes solo devuelve uno
 * cuando la configuración de empresa apunta a un almacén activo disponible.
 */
export const resolverAlmacenPredeterminado = (
  almacenes: readonly Almacen[],
  almacenPredeterminadoId?: string | null,
): ResolucionAlmacenPredeterminado => {
  const disponiblesPorId = new Map<string, Almacen>();

  for (const almacen of almacenes) {
    const id = normalizeId(almacen?._id);
    if (!id || almacen?.activo !== true) continue;
    disponiblesPorId.set(id, almacen);
  }

  const disponibles = [...disponiblesPorId.values()];
  const configuredId = normalizeId(almacenPredeterminadoId);

  if (disponibles.length === 0) {
    return {
      almacen: null,
      almacenId: null,
      origen: "SIN_ALMACENES",
      requiereSeleccion: false,
      configuracionInvalida: Boolean(configuredId),
      totalDisponibles: 0,
    };
  }

  if (disponibles.length === 1) {
    const almacen = disponibles[0];
    return {
      almacen,
      almacenId: normalizeId(almacen._id),
      origen: "UNICO_DISPONIBLE",
      requiereSeleccion: false,
      configuracionInvalida:
        Boolean(configuredId) && configuredId !== normalizeId(almacen._id),
      totalDisponibles: 1,
    };
  }

  const configured = configuredId
    ? disponiblesPorId.get(configuredId) ?? null
    : null;
  if (configured) {
    return {
      almacen: configured,
      almacenId: configuredId,
      origen: "CONFIGURADO",
      requiereSeleccion: false,
      configuracionInvalida: false,
      totalDisponibles: disponibles.length,
    };
  }

  return {
    almacen: null,
    almacenId: null,
    origen: "SELECCION_REQUERIDA",
    requiereSeleccion: true,
    configuracionInvalida: Boolean(configuredId),
    totalDisponibles: disponibles.length,
  };
};
