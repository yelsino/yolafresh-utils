/** Persona que participa en una operación sin poseer necesariamente una cuenta cliente. */
export interface PersonaBeneficiaria {
  id: string;
  nombres: string;
  apellidos?: string;
  nombreCorto?: string;
  documento?: { tipo: string; numero: string };
  estado: "ACTIVA" | "INACTIVA";
  createdAt: number;
  updatedAt: number;
}

/** Autorización para recibir consumos con cargo a un titular concreto. */
export interface VinculoBeneficiario {
  id: string;
  clienteId: string;
  personaId: string;
  estado: "ACTIVO" | "INACTIVO";
  etiqueta?: string;
  grupo?: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
}

export interface BeneficiarioEnVenta {
  vinculoId: string;
  personaId: string;
}

export interface BeneficiarioCongelado extends BeneficiarioEnVenta {
  nombre: string;
  etiqueta?: string;
  grupo?: string;
}

const referenciaOpaca = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

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

/** Solo campos contractuales: nunca se infiere relación desde el ID técnico. */
export function autorizaBeneficiario(
  vinculo: VinculoBeneficiario,
  clienteId: string,
  beneficiario: BeneficiarioEnVenta,
): boolean {
  return vinculo.estado === "ACTIVO" &&
    vinculo.clienteId === clienteId &&
    vinculo.id === beneficiario.vinculoId &&
    vinculo.personaId === beneficiario.personaId;
}

