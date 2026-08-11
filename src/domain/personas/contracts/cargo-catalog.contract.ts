import type {
  CapacidadNegocio,
  PerfilNegocioConfigEmpresa,
  VerticalNegocio,
} from "../../shared/kernel/empresa.contract";
import { CargosPersonal } from "./persons.contract";

export type DefinicionCargoPersonal = {
  key: CargosPersonal;
  label: string;
  verticales?: readonly VerticalNegocio[];
  requiereAlgunaCapacidad?: readonly CapacidadNegocio[];
};

const SOLO_GASTRONOMIA = ["GASTRONOMIA"] as const satisfies readonly VerticalNegocio[];
const CAPACIDADES_REPARTO = [
  "DELIVERY",
  "RUTAS_REPARTO",
] as const satisfies readonly CapacidadNegocio[];

export const CATALOGO_CARGOS_PERSONAL: readonly DefinicionCargoPersonal[] =
  Object.freeze([
    { key: CargosPersonal.ADMINISTRADOR, label: "Administrador" },
    { key: CargosPersonal.SUPERVISOR, label: "Supervisor" },
    {
      key: CargosPersonal.OPERADOR_ATENCION_COMERCIAL,
      label: "Operador atención comercial",
    },
    {
      key: CargosPersonal.ASISTENTE_OPERACIONES_COMERCIALES,
      label: "Asistente operaciones comerciales",
    },
    { key: CargosPersonal.ENCARGADO_COMPRAS, label: "Encargado compras" },
    {
      key: CargosPersonal.ENCARGADO_INVENTARIO,
      label: "Encargado inventario",
    },
    { key: CargosPersonal.ENCARGADO_ALMACEN, label: "Encargado almacén" },
    { key: CargosPersonal.DESPACHADOR, label: "Despachador" },
    {
      key: CargosPersonal.AUXILIAR_ADMINISTRATIVO,
      label: "Auxiliar administrativo",
    },
    { key: CargosPersonal.CONTADOR, label: "Contador" },
    { key: CargosPersonal.AUDITOR, label: "Auditor" },
    { key: CargosPersonal.SOPORTE_TECNICO, label: "Soporte técnico" },
    { key: CargosPersonal.SECRETARIO, label: "Secretario" },
    { key: CargosPersonal.ADMINISTRATIVO, label: "Administrativo" },
    { key: CargosPersonal.REPONEDOR, label: "Reponedor" },
    { key: CargosPersonal.CAJERO, label: "Cajero" },
    { key: CargosPersonal.VENDEDOR, label: "Vendedor" },
    {
      key: CargosPersonal.ANFITRION,
      label: "Anfitrión",
      verticales: SOLO_GASTRONOMIA,
    },
    {
      key: CargosPersonal.MOZO_MESERO,
      label: "Mozo / mesero",
      verticales: SOLO_GASTRONOMIA,
    },
    {
      key: CargosPersonal.CAPITAN_SALON,
      label: "Capitán de salón",
      verticales: SOLO_GASTRONOMIA,
    },
    {
      key: CargosPersonal.COCINERO,
      label: "Cocinero",
      verticales: SOLO_GASTRONOMIA,
    },
    {
      key: CargosPersonal.JEFE_COCINA,
      label: "Jefe de cocina",
      verticales: SOLO_GASTRONOMIA,
    },
    {
      key: CargosPersonal.BARTENDER_ENCARGADO_BARRA,
      label: "Bartender / encargado de barra",
      verticales: SOLO_GASTRONOMIA,
    },
    {
      key: CargosPersonal.REPARTIDOR,
      label: "Repartidor",
      requiereAlgunaCapacidad: CAPACIDADES_REPARTO,
    },
  ] satisfies DefinicionCargoPersonal[]);

const CATALOGO_POR_CARGO = new Map(
  CATALOGO_CARGOS_PERSONAL.map((definition) => [definition.key, definition]),
);

const cumpleDisponibilidad = (
  definition: DefinicionCargoPersonal,
  perfil?: PerfilNegocioConfigEmpresa | null,
): boolean => {
  // Una empresa sin perfil es una instalación legacy compatible con Retail.
  const vertical = perfil?.vertical ?? "RETAIL";
  if (definition.verticales && !definition.verticales.includes(vertical)) {
    return false;
  }

  if (definition.requiereAlgunaCapacidad?.length) {
    const capacidades = new Set(perfil?.capacidades ?? []);
    return definition.requiereAlgunaCapacidad.some((capacidad) =>
      capacidades.has(capacidad),
    );
  }

  return true;
};

export const listarCargosPersonalDisponibles = (
  perfil?: PerfilNegocioConfigEmpresa | null,
): DefinicionCargoPersonal[] =>
  CATALOGO_CARGOS_PERSONAL.filter((definition) =>
    cumpleDisponibilidad(definition, perfil),
  );

export const obtenerDefinicionCargoPersonal = (
  cargo: CargosPersonal,
): DefinicionCargoPersonal | undefined => CATALOGO_POR_CARGO.get(cargo);

export const esCargoPersonalDisponible = (
  cargo: CargosPersonal,
  perfil?: PerfilNegocioConfigEmpresa | null,
): boolean => {
  const definition = obtenerDefinicionCargoPersonal(cargo);
  return definition ? cumpleDisponibilidad(definition, perfil) : false;
};
