import { test } from "node:test";
import assert from "node:assert/strict";
import { assertCajaTurnoAuthorityState, assertCajaTurnoAvailability, assertCajaTurnoCommandResponse, assertCloseTurnoCajaCommand,
  assertOpenTurnoCajaCommand, assertTurnoCajaAuthorityConfirmation, assertTurnoCajaJson,
  cajaTurnoRequestFingerprint, type OpenTurnoCajaCommand, type TurnoCajaJson } from "../contracts";

const command: OpenTurnoCajaCommand = { operationId: "operación/opaca", turnoId: "turno:sin/patrón",
  cajaId: "caja/α:1", montoEfectivoInicial: 10.25, montoDigitalInicial: 0 };
function turno(): TurnoCajaJson {
  return { id: command.turnoId, cajaId: command.cajaId, usuarioId: "usuario/opaco", deviceId: "dispositivo:opaco",
    estado: "ABIERTO", montoEfectivoInicial: 10.25, montoDigitalInicial: 0,
    montoEfectivoEsperado: 10.25, montoDigitalEsperado: 0, inicioAt: "2026-10-28T12:00:00.000Z",
    createdAt: "2026-10-28T12:00:00.000Z", updatedAt: "2026-10-28T12:00:00.000Z",
    authority: { version: 1, openingOperationId: command.operationId,
      openingRequestFingerprint: cajaTurnoRequestFingerprint("OPEN", command), openingConfirmedAtMs: 1_000 } };
}

test("apertura conserva IDs opacos y rechaza suplantación de actor, tenant o dispositivo", () => {
  assert.doesNotThrow(() => assertOpenTurnoCajaCommand(command));
  for (const extra of [{ actorId: "otro" }, { usuarioId: "otro" }, { tenantId: "otro" }, { deviceId: "otro" }])
    assert.throws(() => assertOpenTurnoCajaCommand({ ...command, ...extra }), /TURNO_COMMAND_INVALID/);
  for (const value of [-1, Infinity, NaN, "10"])
    assert.throws(() => assertOpenTurnoCajaCommand({ ...command, montoEfectivoInicial: value }), /TURNO_COMMAND_INVALID/);
});

test("huella idempotente es estable por orden y distingue objetivo, acción y contenido", () => {
  const first = cajaTurnoRequestFingerprint("OPEN", command);
  assert.equal(first, cajaTurnoRequestFingerprint("OPEN", { montoDigitalInicial: 0, montoEfectivoInicial: 10.25,
    cajaId: command.cajaId, turnoId: command.turnoId, operationId: command.operationId }));
  for (const changed of [{ montoDigitalInicial: 1 }, { cajaId: "otra" }, { turnoId: "otro" }, { operationId: "otra" }])
    assert.notEqual(first, cajaTurnoRequestFingerprint("OPEN", { ...command, ...changed }));
});

test("cierre acepta diferencia sin imponer autorización financiera nueva", () => {
  const close = { operationId: "cerrar", turnoId: command.turnoId, cajaId: command.cajaId,
    montoEfectivoContado: 5, montoDigitalContado: 0, montoEfectivoEsperado: 10.25, montoDigitalEsperado: 0 };
  assert.doesNotThrow(() => assertCloseTurnoCajaCommand(close));
  assert.doesNotThrow(() => assertCloseTurnoCajaCommand({ ...close, montoEfectivoEsperado: -10 }));
  assert.doesNotThrow(() => assertTurnoCajaJson({ ...turno(), montoEfectivoEsperado: -10 }));
  assert.notEqual(cajaTurnoRequestFingerprint("CLOSE", close), cajaTurnoRequestFingerprint("OPEN", command));
  assert.throws(() => assertCloseTurnoCajaCommand({ ...close, montoEfectivoContado: -1 }), /COMMAND_INVALID/);
  assert.doesNotThrow(() => assertCloseTurnoCajaCommand({ ...close, validadoPorId: "personal opaco",
    observacionSupervisor: "Conteo declarado" }));
  assert.throws(() => assertCloseTurnoCajaCommand({ ...close, validadoAt: "2026-10-28T00:00:00.000Z" }), /COMMAND_INVALID/);
  assert.notEqual(cajaTurnoRequestFingerprint("CLOSE", close), cajaTurnoRequestFingerprint("CLOSE", {
    ...close, validadoPorId: "personal opaco" }));
});

test("ACK conserva scope de caja incluso al repetir un cierre con caja disponible", () => {
  const current = turno();
  const response = { ok: true, turno: { ...current, estado: "CERRADO", finAt: "2026-10-28T14:00:00.000Z" },
    availability: { enabled: true, cajaId: current.cajaId, revision: 2, status: "DISPONIBLE", activeTurno: null }, replayed: true };
  assert.doesNotThrow(() => assertCajaTurnoCommandResponse(response));
  assert.throws(() => assertCajaTurnoCommandResponse({ ...response,
    availability: { ...response.availability, cajaId: "otra" } }), /SCOPE_MISMATCH/);
});

test("seed ocupado confirmado no vence offline y no confunde la caja", () => {
  const current = turno();
  assert.doesNotThrow(() => assertCajaTurnoAuthorityState({ version: 1, revision: 9, activeTurno: current, updatedAtMs: 1_000 }));
  assert.doesNotThrow(() => assertCajaTurnoAvailability({ enabled: true, cajaId: current.cajaId, revision: 9,
    status: "OCUPADA", activeTurno: current }));
  assert.throws(() => assertCajaTurnoAvailability({ enabled: true, cajaId: "otra", revision: 9,
    status: "OCUPADA", activeTurno: current }), /SCOPE_MISMATCH/);
  assert.throws(() => assertCajaTurnoAvailability({ enabled: true, cajaId: current.cajaId, revision: 9,
    status: "DISPONIBLE", activeTurno: current }), /AUTHORITY_INVALID/);
  assert.throws(() => assertCajaTurnoAuthorityState({ version: 1, revision: 9,
    activeTurno: { ...current, authority: undefined }, updatedAtMs: 1_000 }), /AUTHORITY_INVALID/);
});

test("JSON del turno exige fechas serializadas y recibos de cierre completos", () => {
  const current = turno();
  assert.doesNotThrow(() => assertTurnoCajaJson(current));
  for (const date of [new Date(), "2026-02-30T12:00:00.000Z", "no-fecha"])
    assert.throws(() => assertTurnoCajaJson({ ...current, inicioAt: date }), /JSON_INVALID/);
  assert.throws(() => assertTurnoCajaAuthorityConfirmation({ ...current.authority,
    closingOperationId: "cierre" }), /AUTHORITY_INVALID/);
  const legacy = { version: 1, legacyOpening: true, closingOperationId: "cierre",
    closingRequestFingerprint: "b".repeat(64), closingConfirmedAtMs: 2_000 };
  assert.doesNotThrow(() => assertTurnoCajaAuthorityConfirmation(legacy));
  assert.throws(() => assertTurnoCajaAuthorityConfirmation({ ...legacy, openingOperationId: "inventada" }), /AUTHORITY_INVALID/);
  assert.throws(() => assertCajaTurnoAuthorityState({ version: 1, revision: 10,
    activeTurno: { ...current, authority: legacy }, updatedAtMs: 2_000 }), /AUTHORITY_INVALID/);
});

test("disponibilidad informa turno legacy ocupado sin confirmar su apertura", () => {
  const { authority: _authority, ...legacy } = turno();
  assert.doesNotThrow(() => assertCajaTurnoAvailability({ enabled: true, cajaId: legacy.cajaId,
    revision: 0, status: "OCUPADA", activeTurno: legacy }));
  assert.throws(() => assertCajaTurnoAuthorityState({ version: 1, revision: 0,
    activeTurno: legacy, updatedAtMs: 1_000 }), /AUTHORITY_INVALID/);
  assert.throws(() => assertCajaTurnoAvailability({ enabled: true, cajaId: legacy.cajaId,
    revision: 0, status: "OCUPADA", activeTurno: { ...legacy, estado: "DEFICIT" } }), /AUTHORITY_INVALID/);
});
