import type { FiscalV1Environment, FiscalV2CajaAssignment } from "./modulo-fiscal-v1.contract";

export interface FiscalCajaDocumentSeries {
  readonly series: string;
  readonly creditNoteSeries: string;
}

/** Provisión operativa central: no contiene ni reserva correlativos. */
export interface FiscalCajaNumberingAssignment extends FiscalV2CajaAssignment {
  readonly establishmentId: string;
  readonly series: Readonly<Partial<Record<"BOLETA" | "FACTURA", FiscalCajaDocumentSeries>>>;
}

/** Proyección replicable del registro privado; sus IDs son opacos y su revisión es independiente de Couch. */
export interface FiscalCajaNumberingProjection {
  readonly schemaVersion: 1;
  readonly tenantId: string;
  readonly issuerRuc: string;
  readonly environment: FiscalV1Environment;
  readonly registryId: string;
  readonly assignmentRevision: number;
  readonly assignments: readonly FiscalCajaNumberingAssignment[];
}

export type FiscalNumberingByEnvironment = Readonly<Partial<Record<FiscalV1Environment, FiscalCajaNumberingProjection>>>;

/** Prueba de asignación operativa para contrastar con la autoridad central al emitir. */
export interface FiscalOperationalCajaAssignmentBinding extends FiscalV2CajaAssignment {
  readonly registryId: string;
  readonly assignmentRevision: number;
}

export interface FiscalResolvedCajaNumberingAssignment extends FiscalOperationalCajaAssignmentBinding, FiscalCajaDocumentSeries {
  readonly tenantId: string;
  readonly issuerRuc: string;
  readonly environment: FiscalV1Environment;
  readonly establishmentId: string;
  readonly documentType: "BOLETA" | "FACTURA";
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
function keys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return Object.keys(value).length === expected.length && Object.keys(value).every(key => expected.includes(key));
}

export function assertFiscalCajaNumberingProjection(value: unknown): asserts value is FiscalCajaNumberingProjection {
  const invalid = (): never => { throw new Error("FISCAL_CAJA_NUMBERING_PROJECTION_INVALID"); };
  if (!object(value) || !keys(value, ["schemaVersion", "tenantId", "issuerRuc", "environment", "registryId", "assignmentRevision", "assignments"]) ||
    value.schemaVersion !== 1 || !text(value.tenantId) || !text(value.registryId) ||
    typeof value.issuerRuc !== "string" || !/^\d{11}$/.test(value.issuerRuc) ||
    value.environment !== "DEMO" && value.environment !== "PRODUCTION" ||
    !positive(value.assignmentRevision) || !Array.isArray(value.assignments)) return invalid();
  const seen = new Set<string>();
  for (const assignment of value.assignments) {
    if (!object(assignment) || !keys(assignment, ["cajaId", "assignmentVersion", "establishmentId", "series"]) ||
      !text(assignment.cajaId) || !positive(assignment.assignmentVersion) || !text(assignment.establishmentId) ||
      !object(assignment.series) || Object.keys(assignment.series).length === 0 ||
      Object.keys(assignment.series).some(key => key !== "BOLETA" && key !== "FACTURA") || seen.has(assignment.cajaId)) invalid();
    seen.add(assignment.cajaId);
    for (const documentType of ["BOLETA", "FACTURA"] as const) {
      const family = assignment.series[documentType];
      if (family === undefined) continue;
      const pattern = documentType === "BOLETA" ? /^B[A-Z0-9]{3}$/ : /^F[A-Z0-9]{3}$/;
      if (!object(family) || !keys(family, ["series", "creditNoteSeries"]) ||
        typeof family.series !== "string" || !pattern.test(family.series) ||
        typeof family.creditNoteSeries !== "string" || !pattern.test(family.creditNoteSeries)) invalid();
    }
  }
}

/** Lee sólo el scope solicitado; proyección ausente, inválida o ajena permanece no disponible. */
export function readFiscalCajaNumberingProjection(config: unknown, scope: {
  readonly tenantId: string; readonly issuerRuc: string; readonly environment: FiscalV1Environment;
}): FiscalCajaNumberingProjection | null {
  if (!object(config) || !object(config.fiscal) || !object(config.fiscal.numeracionPorEntorno)) return null;
  const value = config.fiscal.numeracionPorEntorno[scope.environment];
  try { assertFiscalCajaNumberingProjection(value); } catch { return null; }
  return value.tenantId === scope.tenantId && value.issuerRuc === scope.issuerRuc && value.environment === scope.environment ? value : null;
}

export function resolveFiscalCajaNumberingAssignment(config: unknown, scope: {
  readonly tenantId: string; readonly issuerRuc: string; readonly environment: FiscalV1Environment;
  readonly cajaId: string; readonly establishmentId: string; readonly documentType: "BOLETA" | "FACTURA";
}): FiscalResolvedCajaNumberingAssignment | null {
  const projection = readFiscalCajaNumberingProjection(config, scope);
  if (!projection) return null;
  const assignment = projection.assignments.find(row => row.cajaId === scope.cajaId && row.establishmentId === scope.establishmentId);
  const series = assignment?.series[scope.documentType];
  if (!assignment || !series) return null;
  return Object.freeze({ tenantId: projection.tenantId, issuerRuc: projection.issuerRuc, environment: projection.environment,
    registryId: projection.registryId, assignmentRevision: projection.assignmentRevision,
    cajaId: assignment.cajaId, assignmentVersion: assignment.assignmentVersion, establishmentId: assignment.establishmentId,
    documentType: scope.documentType, ...series });
}
