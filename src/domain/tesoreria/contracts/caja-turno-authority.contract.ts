import type { TurnoCaja } from "./caja.contract";

/** Recibos acotados al tenant, caja, turno, acción y operationId autenticados. */
export interface TurnoCajaConfirmedOpening {
  readonly version: 1;
  readonly legacyOpening?: false;
  readonly openingOperationId: string;
  readonly openingRequestFingerprint: string;
  readonly openingConfirmedAtMs: number;
  /** Evidencia de la sesión que abrió; no restringe la operación a un dispositivo. */
  readonly sessionId?: string;
  readonly closingOperationId?: string;
  readonly closingRequestFingerprint?: string;
  readonly closingConfirmedAtMs?: number;
}

/** Cerrar un turno anterior no fabrica una confirmación central de apertura. */
export interface TurnoCajaConfirmedLegacyClosing {
  readonly version: 1;
  readonly legacyOpening: true;
  readonly openingOperationId?: never;
  readonly openingRequestFingerprint?: never;
  readonly openingConfirmedAtMs?: never;
  readonly sessionId?: string;
  readonly closingOperationId: string;
  readonly closingRequestFingerprint: string;
  readonly closingConfirmedAtMs: number;
}
export type TurnoCajaAuthorityConfirmation = TurnoCajaConfirmedOpening | TurnoCajaConfirmedLegacyClosing;

/** Proyección HTTP JSON; nunca transmite instancias Date ni redefine el _id remoto. */
export type TurnoCajaJson = Omit<TurnoCaja, "inicioAt" | "finAt" | "createdAt" | "updatedAt" | "validadoAt"> & {
  readonly inicioAt: string;
  readonly finAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly validadoAt?: string;
};

/** CAS de la propia caja. El seed permite reconstruir la proyección de turno tras un fallo. */
export interface CajaTurnoAuthorityState {
  readonly version: 1;
  readonly revision: number;
  readonly activeTurno: TurnoCajaJson | null;
  readonly updatedAtMs: number;
}

/** Tenant, actor y dispositivo se resuelven exclusivamente desde autenticación. */
export interface OpenTurnoCajaCommand {
  readonly operationId: string;
  readonly turnoId: string;
  readonly cajaId: string;
  readonly montoEfectivoInicial: number;
  readonly montoDigitalInicial: number;
}

export interface CloseTurnoCajaCommand {
  readonly operationId: string;
  readonly turnoId: string;
  readonly cajaId: string;
  readonly montoEfectivoContado: number;
  readonly montoDigitalContado: number;
  /** Declaración del cierre; no introduce una nueva condición financiera de autorización. */
  readonly montoEfectivoEsperado: number;
  readonly montoDigitalEsperado: number;
  readonly motivoDiferencia?: string;
  /** Selección declarada por el cajero; no autentica ni concede permisos al supervisor. */
  readonly validadoPorId?: string;
  readonly observacionSupervisor?: string;
}

export interface CajaTurnoAvailability {
  readonly enabled: boolean;
  readonly cajaId: string;
  readonly revision: number;
  readonly status: "DISPONIBLE" | "OCUPADA";
  readonly activeTurno: TurnoCajaJson | null;
}

export interface CajaTurnoCommandResponse {
  readonly ok: true;
  readonly turno: TurnoCajaJson;
  readonly availability: CajaTurnoAvailability;
  readonly replayed?: boolean;
}

export const CAJA_TURNO_ERROR_CODES = [
  "CAJA_NOT_FOUND", "CAJA_INACTIVE", "CAJA_FORBIDDEN", "CAJA_OCUPADA",
  "CAJA_TURNO_AUTHORITY_DISABLED", "CAJA_TURNO_AUTHORITY_CONFLICT", "CAJA_TURNO_AUTHORITY_UNAVAILABLE",
  "TURNO_NOT_FOUND", "TURNO_NOT_ACTIVE", "TURNO_SCOPE_MISMATCH", "TURNO_OPERATION_CONFLICT",
  "TURNO_COMMAND_INVALID", "TURNO_AUTHORITY_INVALID", "TURNO_JSON_INVALID",
  "CAJA_MOVEMENTS_PENDING", "CAJA_LEDGER_INVALID", "CAJA_LEDGER_INCOMPLETE",
  "CAJA_LEGACY_TURNO_REQUIRES_CLOSE", "CAJA_TURNO_CENTRAL_COMMAND_REQUIRED",
  "CAJA_DOCUMENT_CONFLICT",
] as const;
export type CajaTurnoErrorCode = (typeof CAJA_TURNO_ERROR_CODES)[number];

export interface CajaTurnoApiError {
  readonly ok: false;
  readonly error: CajaTurnoErrorCode;
  readonly message?: string;
  readonly availability?: CajaTurnoAvailability;
}
