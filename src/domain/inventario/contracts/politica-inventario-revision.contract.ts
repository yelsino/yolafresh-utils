import type { UnixMillis } from "../../shared/utils/dates";
import type {
  ActorInventarioSnapshot,
  InventorySchemaVersion,
} from "./inventory-quantity.contract";
import type {
  AlcancePoliticaInventario,
  ConfiguracionPoliticaInventario,
} from "./politica-inventario.contract";

export const POLITICA_INVENTARIO_REVISION_TYPE =
  "politica_inventario_revision" as const;

/** La entrada canónica se codifica en UTF-8 antes de calcular SHA-256. */
export const POLITICA_INVENTARIO_REVISION_DIGEST_ALGORITHM = "SHA-256" as const;
export const POLITICA_INVENTARIO_REVISION_DIGEST_CANONICAL_VERSION = 1 as const;

/**
 * Hecho inmutable de una edición de política. Cada versión se crea como un
 * documento nuevo; nunca se sobrescribe una revisión anterior. `_id` es solo
 * direccionamiento CouchDB, no identifica la política ni codifica la versión.
 *
 * `digest` es SHA-256 hexadecimal en minúsculas de la serialización canónica
 * V1 de los campos materiales. No incluye `_id`, `_rev`, `createdAt` ni el
 * propio `digest`. El adapter conserva `_rev` solo como metadato de CouchDB.
 */
export interface PoliticaInventarioRevision {
  _id: string;
  _rev?: string;
  type: typeof POLITICA_INVENTARIO_REVISION_TYPE;
  schemaVersion: InventorySchemaVersion;
  politicaId: string;
  version: number;
  /** Señala una raíz de migración: no afirma que existan revisiones anteriores. */
  revisionKind?: "LEGACY_BASELINE";
  /** `null` en versión 1 o en una raíz LEGACY_BASELINE explícita. */
  previousRevisionDigest: string | null;
  digestAlgorithm: typeof POLITICA_INVENTARIO_REVISION_DIGEST_ALGORITHM;
  digestCanonicalVersion: typeof POLITICA_INVENTARIO_REVISION_DIGEST_CANONICAL_VERSION;
  digest: string;
  alcance: AlcancePoliticaInventario;
  configuracion: ConfiguracionPoliticaInventario;
  activa: boolean;
  actor: ActorInventarioSnapshot;
  operationId: string;
  idempotencyKey: string;
  createdAt: UnixMillis;
}

/** Datos exactos cubiertos por el digest; se pueden serializar antes de crear `_id`. */
export type MaterialDigestPoliticaInventarioRevision = Pick<
  PoliticaInventarioRevision,
  | "type"
  | "schemaVersion"
  | "politicaId"
  | "version"
  | "revisionKind"
  | "previousRevisionDigest"
  | "digestAlgorithm"
  | "digestCanonicalVersion"
  | "alcance"
  | "configuracion"
  | "activa"
  | "actor"
  | "operationId"
  | "idempotencyKey"
>;

/** El caller genera un `_id` nuevo y la implementación SHA-256 de su runtime. */
export type EntradaCrearPoliticaInventarioRevision =
  MaterialDigestPoliticaInventarioRevision &
  Pick<PoliticaInventarioRevision, "_id" | "createdAt">;
