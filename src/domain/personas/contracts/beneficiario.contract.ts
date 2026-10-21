/** Persona que puede participar en el negocio sin poseer una cuenta cliente. */
export interface PersonaBeneficiaria {
  id: string;
  nombres: string;
  apellidos?: string;
  nombreCorto?: string;
  documento?: {
    tipo: string;
    numero: string;
  };
  estado: "ACTIVA" | "INACTIVA";
  createdAt: number;
  updatedAt: number;
}

/** Autorización de una persona para recibir consumos de un cliente pagador. */
export interface VinculoBeneficiario {
  id: string;
  clienteId: string;
  personaId: string;
  estado: "ACTIVO" | "INACTIVO";
  etiquetaId?: string;
  grupoId?: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
}

/** La venta identifica el vínculo concreto, no solo el nombre del receptor. */
export interface BeneficiarioEnVenta {
  vinculoId: string;
  personaId: string;
}

/** Evidencia histórica inmutable del receptor en el snapshot comercial. */
export interface BeneficiarioCongelado extends BeneficiarioEnVenta {
  nombre: string;
  etiquetaId?: string;
  grupoId?: string;
  /** Nombres históricos, nunca entradas libres de un vínculo nuevo. */
  etiqueta?: string;
  grupo?: string;
}

export const BENEFICIARIO_CATALOGO_TYPE = "beneficiario_catalogo" as const;
export const BENEFICIARIO_CATALOGO_SCHEMA_VERSION = 1 as const;
export type BeneficiarioCatalogoClase = "ETIQUETA" | "GRUPO";
export type BeneficiarioCatalogoEstado = "ACTIVO" | "ELIMINADO";

/** Opción reutilizable dentro del tenant; eliminar no reescribe el historial. */
export interface BeneficiarioCatalogoItem {
  id: string;
  schemaVersion: typeof BENEFICIARIO_CATALOGO_SCHEMA_VERSION;
  clase: BeneficiarioCatalogoClase;
  nombre: string;
  estado: BeneficiarioCatalogoEstado;
  revision: number;
  createdAt: number;
  updatedAt: number;
  creadoPorId: string;
  actualizadoPorId: string;
}

/** Sobre Couch canónico: no exige duplicar `_id` en una propiedad `id`. */
export type BeneficiarioCatalogoDocument = Omit<BeneficiarioCatalogoItem, "id"> & {
  _id: string;
  _rev?: string;
  type: typeof BENEFICIARIO_CATALOGO_TYPE;
};

const referenciaOpaca = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function validarBeneficiarioCatalogo(
  item: Partial<BeneficiarioCatalogoItem>,
): string[] {
  const errores: string[] = [];
  for (const field of ["id", "creadoPorId", "actualizadoPorId"] as const) {
    if (!referenciaOpaca(item[field])) errores.push(`catalogo.${field} es requerido`);
  }
  if (item.schemaVersion !== BENEFICIARIO_CATALOGO_SCHEMA_VERSION)
    errores.push("catalogo.schemaVersion es inválido");
  if (item.clase !== "ETIQUETA" && item.clase !== "GRUPO")
    errores.push("catalogo.clase es inválida");
  if (!referenciaOpaca(item.nombre) || item.nombre.trim().length > 100)
    errores.push("catalogo.nombre es requerido y admite hasta 100 caracteres");
  if (item.estado !== "ACTIVO" && item.estado !== "ELIMINADO")
    errores.push("catalogo.estado es inválido");
  if (!Number.isSafeInteger(item.revision) || Number(item.revision) < 1)
    errores.push("catalogo.revision debe ser un entero positivo");
  for (const field of ["createdAt", "updatedAt"] as const) {
    if (!Number.isSafeInteger(item[field]) || Number(item[field]) <= 0)
      errores.push(`catalogo.${field} debe ser un timestamp positivo`);
  }
  return errores;
}

export function validarBeneficiarioEnVenta(
  beneficiario: Partial<BeneficiarioEnVenta> | null | undefined,
): string[] {
  if (beneficiario == null) return [];
  const errores: string[] = [];
  if (!referenciaOpaca(beneficiario.vinculoId)) {
    errores.push("beneficiario.vinculoId es requerido");
  }
  if (!referenciaOpaca(beneficiario.personaId)) {
    errores.push("beneficiario.personaId es requerido");
  }
  return errores;
}

export function validarVinculoBeneficiario(
  vinculo: Partial<VinculoBeneficiario>,
): string[] {
  const errores: string[] = [];
  if (!referenciaOpaca(vinculo.id)) errores.push("vinculo.id es requerido");
  if (!referenciaOpaca(vinculo.clienteId)) {
    errores.push("vinculo.clienteId es requerido");
  }
  if (!referenciaOpaca(vinculo.personaId)) {
    errores.push("vinculo.personaId es requerido");
  }
  if (vinculo.estado !== "ACTIVO" && vinculo.estado !== "INACTIVO") {
    errores.push("vinculo.estado es inválido");
  }
  if (!Number.isSafeInteger(vinculo.revision) || Number(vinculo.revision) < 1) {
    errores.push("vinculo.revision debe ser un entero positivo");
  }
  return errores;
}

/** Compara únicamente referencias contractuales, sin interpretar sus formatos. */
export function autorizaBeneficiario(
  vinculo: VinculoBeneficiario,
  clienteId: string,
  beneficiario: BeneficiarioEnVenta,
): boolean {
  return (
    vinculo.estado === "ACTIVO" &&
    vinculo.clienteId === clienteId &&
    vinculo.id === beneficiario.vinculoId &&
    vinculo.personaId === beneficiario.personaId
  );
}
