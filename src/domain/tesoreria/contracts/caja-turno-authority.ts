import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import type { CajaTurnoAuthorityState, CajaTurnoAvailability, CajaTurnoCommandResponse, CloseTurnoCajaCommand,
  OpenTurnoCajaCommand, TurnoCajaAuthorityConfirmation, TurnoCajaJson } from "./caja-turno-authority.contract";

const fail = (code: string): never => { throw new Error(code); };
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const amount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const balance = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const timestamp = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const fingerprint = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isoDate = (value: unknown): value is string => typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);

function keys(value: unknown, required: readonly string[], optional: readonly string[], code: string): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value as object);
  if (required.some(key => !actual.includes(key)) || actual.some(key => !required.includes(key) && !optional.includes(key))) fail(code);
}

const commandFields = ["operationId", "turnoId", "cajaId"];
export function assertOpenTurnoCajaCommand(value: unknown): asserts value is OpenTurnoCajaCommand {
  keys(value, [...commandFields, "montoEfectivoInicial", "montoDigitalInicial"], [], "TURNO_COMMAND_INVALID");
  const row = value as OpenTurnoCajaCommand;
  if (![row.operationId, row.turnoId, row.cajaId].every(text) ||
      ![row.montoEfectivoInicial, row.montoDigitalInicial].every(amount)) fail("TURNO_COMMAND_INVALID");
}

export function assertCloseTurnoCajaCommand(value: unknown): asserts value is CloseTurnoCajaCommand {
  keys(value, [...commandFields, "montoEfectivoContado", "montoDigitalContado", "montoEfectivoEsperado", "montoDigitalEsperado"],
    ["motivoDiferencia", "validadoPorId", "observacionSupervisor"], "TURNO_COMMAND_INVALID");
  const row = value as CloseTurnoCajaCommand;
  if (![row.operationId, row.turnoId, row.cajaId].every(text) ||
      ![row.montoEfectivoContado, row.montoDigitalContado].every(amount) ||
      ![row.montoEfectivoEsperado, row.montoDigitalEsperado].every(balance) ||
      [row.motivoDiferencia, row.validadoPorId, row.observacionSupervisor]
        .some(value => value !== undefined && !text(value))) fail("TURNO_COMMAND_INVALID");
}

/** El servidor guarda la huella bajo el scope autenticado; una selección no suplanta al actor. */
export function cajaTurnoRequestFingerprint(action: "OPEN" | "CLOSE", command: OpenTurnoCajaCommand | CloseTurnoCajaCommand): string {
  if (action === "OPEN") assertOpenTurnoCajaCommand(command);
  else if (action === "CLOSE") assertCloseTurnoCajaCommand(command);
  else fail("TURNO_COMMAND_INVALID");
  const ordered = Object.fromEntries(Object.entries(command).filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right)));
  return bytesToHex(sha256(utf8ToBytes(JSON.stringify({ action, command: ordered }))));
}

export function assertTurnoCajaAuthorityConfirmation(value: unknown): asserts value is TurnoCajaAuthorityConfirmation {
  if (value && typeof value === "object" && (value as { legacyOpening?: unknown }).legacyOpening === true) {
    keys(value, ["version", "legacyOpening", "closingOperationId", "closingRequestFingerprint", "closingConfirmedAtMs"],
      ["sessionId"], "TURNO_AUTHORITY_INVALID");
    const row = value as TurnoCajaAuthorityConfirmation;
    if (row.version !== 1 || !text(row.closingOperationId) || !fingerprint(row.closingRequestFingerprint) ||
        !timestamp(row.closingConfirmedAtMs) || row.sessionId !== undefined && !text(row.sessionId)) fail("TURNO_AUTHORITY_INVALID");
    return;
  }
  keys(value, ["version", "openingOperationId", "openingRequestFingerprint", "openingConfirmedAtMs"],
    ["legacyOpening", "sessionId", "closingOperationId", "closingRequestFingerprint", "closingConfirmedAtMs"], "TURNO_AUTHORITY_INVALID");
  const row = value as TurnoCajaAuthorityConfirmation;
  if (row.version !== 1 || row.legacyOpening !== undefined && row.legacyOpening !== false ||
      !text(row.openingOperationId) || !fingerprint(row.openingRequestFingerprint) ||
      !timestamp(row.openingConfirmedAtMs) || row.sessionId !== undefined && !text(row.sessionId)) fail("TURNO_AUTHORITY_INVALID");
  const closing = [row.closingOperationId, row.closingRequestFingerprint, row.closingConfirmedAtMs];
  if (closing.some(value => value !== undefined) && (!text(row.closingOperationId) ||
      !fingerprint(row.closingRequestFingerprint) || !timestamp(row.closingConfirmedAtMs) ||
      row.closingConfirmedAtMs! < row.openingConfirmedAtMs!)) fail("TURNO_AUTHORITY_INVALID");
}

export function assertTurnoCajaJson(value: unknown): asserts value is TurnoCajaJson {
  keys(value, ["id", "cajaId", "usuarioId", "deviceId", "estado", "montoEfectivoInicial", "montoDigitalInicial",
    "montoEfectivoEsperado", "montoDigitalEsperado", "inicioAt", "createdAt", "updatedAt"],
    ["montoEfectivoContado", "montoDigitalContado", "diferencia", "motivoDiferencia", "validadoPorId", "validadoAt",
      "observacionSupervisor", "finAt", "authority"], "TURNO_JSON_INVALID");
  const row = value as TurnoCajaJson;
  if (![row.id, row.cajaId, row.usuarioId, row.deviceId].every(text) ||
      !["ABIERTO", "ARQUEO", "CERRADO", "DEFICIT"].includes(row.estado) ||
      ![row.montoEfectivoInicial, row.montoDigitalInicial].every(amount) ||
      ![row.montoEfectivoEsperado, row.montoDigitalEsperado].every(balance) ||
      ![row.inicioAt, row.createdAt, row.updatedAt].every(isoDate) ||
      [row.finAt, row.validadoAt].some(value => value !== undefined && !isoDate(value)) ||
      [row.montoEfectivoContado, row.montoDigitalContado].some(value => value !== undefined && !amount(value)) ||
      row.diferencia !== undefined && (typeof row.diferencia !== "number" || !Number.isFinite(row.diferencia)) ||
      [row.motivoDiferencia, row.validadoPorId, row.observacionSupervisor].some(value => value !== undefined && !text(value)))
    fail("TURNO_JSON_INVALID");
  if (row.authority !== undefined) assertTurnoCajaAuthorityConfirmation(row.authority);
}

function activeTurno(value: TurnoCajaJson | null, requireConfirmation = true): void {
  if (value === null) return;
  assertTurnoCajaJson(value);
  if ((requireConfirmation && !value.authority) || !["ABIERTO", "ARQUEO"].includes(value.estado) ||
      value.finAt !== undefined || value.authority?.closingOperationId !== undefined)
    fail("TURNO_AUTHORITY_INVALID");
}

export function assertCajaTurnoAuthorityState(value: unknown): asserts value is CajaTurnoAuthorityState {
  keys(value, ["version", "revision", "activeTurno", "updatedAtMs"], [], "TURNO_AUTHORITY_INVALID");
  const row = value as CajaTurnoAuthorityState;
  if (row.version !== 1 || !timestamp(row.revision) || !timestamp(row.updatedAtMs)) fail("TURNO_AUTHORITY_INVALID");
  activeTurno(row.activeTurno);
}

export function assertCajaTurnoAvailability(value: unknown): asserts value is CajaTurnoAvailability {
  keys(value, ["enabled", "cajaId", "revision", "status", "activeTurno"], [], "TURNO_AUTHORITY_INVALID");
  const row = value as CajaTurnoAvailability;
  if (typeof row.enabled !== "boolean" || !text(row.cajaId) || !timestamp(row.revision) ||
      row.status !== (row.activeTurno === null ? "DISPONIBLE" : "OCUPADA")) fail("TURNO_AUTHORITY_INVALID");
  // Disponibilidad también debe mostrar una ocupación legacy sin fabricar ACK.
  activeTurno(row.activeTurno, false);
  if (row.activeTurno && row.activeTurno.cajaId !== row.cajaId) fail("TURNO_SCOPE_MISMATCH");
}

export function assertCajaTurnoCommandResponse(value: unknown): asserts value is CajaTurnoCommandResponse {
  keys(value, ["ok", "turno", "availability"], ["replayed"], "TURNO_AUTHORITY_INVALID");
  const row = value as CajaTurnoCommandResponse;
  if (row.ok !== true || row.replayed !== undefined && typeof row.replayed !== "boolean") fail("TURNO_AUTHORITY_INVALID");
  assertTurnoCajaJson(row.turno);
  assertCajaTurnoAvailability(row.availability);
  if (row.turno.cajaId !== row.availability.cajaId) fail("TURNO_SCOPE_MISMATCH");
}
