import type { ResultadoValidacionInventario } from "../contracts/inventory-quantity.contract";
import { INVENTORY_SCHEMA_VERSION } from "../contracts/inventory-quantity.contract";
import type { PoliticaInventario } from "../contracts/politica-inventario.contract";
import {
  NivelPoliticaInventario,
  POLITICA_INVENTARIO_TYPE,
} from "../contracts/politica-inventario.contract";
import type {
  EntradaCrearPoliticaInventarioRevision,
  MaterialDigestPoliticaInventarioRevision,
  PoliticaInventarioRevision,
} from "../contracts/politica-inventario-revision.contract";
import {
  POLITICA_INVENTARIO_REVISION_DIGEST_ALGORITHM,
  POLITICA_INVENTARIO_REVISION_DIGEST_CANONICAL_VERSION,
  POLITICA_INVENTARIO_REVISION_TYPE,
} from "../contracts/politica-inventario-revision.contract";
import { validarPoliticaInventario } from "./inventory.helpers";

const DIGEST_SHA256_HEX = /^[0-9a-f]{64}$/;
const CAMPOS_REVISION = new Set([
  "_id", "_rev", "type", "schemaVersion", "politicaId", "version", "revisionKind",
  "previousRevisionDigest", "digestAlgorithm", "digestCanonicalVersion",
  "digest", "alcance", "configuracion", "activa", "actor", "operationId",
  "idempotencyKey", "createdAt",
]);
const CAMPOS_CONFIGURACION = new Set([
  "modo", "stockMinimoBase", "inventarioInicialRequerido", "conteoCiego",
  "frecuenciaConteoDias", "toleranciaCantidadBase", "toleranciaPorcentaje",
  "requiereAprobacionAjuste", "umbralAprobacionCantidadBase",
  "umbralAprobacionValor", "requiereEvidenciaMerma",
]);
const CAMPOS_ACTOR = new Set([
  "usuarioId", "usuarioNombre", "dispositivoId", "sesionId",
]);

const esRegistro = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const esTextoNoVacio = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const resultado = (errores: string[]): ResultadoValidacionInventario => ({
  valido: errores.length === 0,
  errores,
});

const validarCamposConocidos = (
  valor: Record<string, unknown>,
  permitidos: ReadonlySet<string>,
  ruta: string,
  errores: string[],
): void => {
  for (const campo of Object.keys(valor)) {
    if (!permitidos.has(campo)) {
      errores.push(`${ruta}.${campo} no pertenece al contrato`);
    }
  }
};

const camposAlcance = (nivel: unknown): ReadonlySet<string> | null => {
  switch (nivel) {
    case NivelPoliticaInventario.EMPRESA:
      return new Set(["nivel", "empresaId"]);
    case NivelPoliticaInventario.ALMACEN:
      return new Set(["nivel", "empresaId", "almacenId"]);
    case NivelPoliticaInventario.PRODUCTO:
      return new Set(["nivel", "empresaId", "productoBaseId"]);
    case NivelPoliticaInventario.PRODUCTO_ALMACEN:
      return new Set(["nivel", "empresaId", "productoBaseId", "almacenId"]);
    default:
      return null;
  }
};

/**
 * Valida el sobre append-only de una revisión sin derivar nada de `_id`.
 * Reutiliza las reglas del contenido editable de política a través de
 * `politicaId`, sin exigir un `id` duplicado en CouchDB.
 */
export const validarPoliticaInventarioRevision = (
  valor: unknown,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  if (!esRegistro(valor)) {
    return resultado(["revision debe ser un objeto"]);
  }
  validarCamposConocidos(valor, CAMPOS_REVISION, "revision", errores);
  if (!esTextoNoVacio(valor._id)) errores.push("revision._id es requerido");
  if (valor._rev !== undefined && !esTextoNoVacio(valor._rev)) {
    errores.push("revision._rev no puede estar vacío");
  }
  if (valor.type !== POLITICA_INVENTARIO_REVISION_TYPE) {
    errores.push("revision.type es inválido");
  }
  if (valor.schemaVersion !== INVENTORY_SCHEMA_VERSION) {
    errores.push("revision.schemaVersion debe ser 2");
  }
  if (!esTextoNoVacio(valor.politicaId)) {
    errores.push("revision.politicaId es requerido");
  }
  if (!Number.isSafeInteger(valor.version) || (valor.version as number) < 1) {
    errores.push("revision.version debe ser un entero seguro positivo");
  }
  if (valor.digestAlgorithm !== POLITICA_INVENTARIO_REVISION_DIGEST_ALGORITHM) {
    errores.push("revision.digestAlgorithm debe ser SHA-256");
  }
  if (
    valor.digestCanonicalVersion !==
    POLITICA_INVENTARIO_REVISION_DIGEST_CANONICAL_VERSION
  ) {
    errores.push("revision.digestCanonicalVersion debe ser 1");
  }
  if (typeof valor.digest !== "string" || !DIGEST_SHA256_HEX.test(valor.digest)) {
    errores.push("revision.digest debe ser SHA-256 hex minúscula");
  }
  if (valor.revisionKind !== undefined && valor.revisionKind !== "LEGACY_BASELINE") {
    errores.push("revision.revisionKind es inválido");
  }
  if (valor.revisionKind === "LEGACY_BASELINE") {
    if (!Number.isSafeInteger(valor.version) || (valor.version as number) <= 1) {
      errores.push("revision LEGACY_BASELINE exige version mayor que 1");
    }
    if (valor.previousRevisionDigest !== null) {
      errores.push("revision LEGACY_BASELINE exige previousRevisionDigest null");
    }
  } else if (valor.version === 1) {
    if (valor.previousRevisionDigest !== null) {
      errores.push("revision.version 1 exige previousRevisionDigest null");
    }
  } else if (
    typeof valor.previousRevisionDigest !== "string" ||
    !DIGEST_SHA256_HEX.test(valor.previousRevisionDigest)
  ) {
    errores.push("revision.previousRevisionDigest debe ser SHA-256 hex minúscula");
  }
  if (!esRegistro(valor.alcance)) {
    errores.push("revision.alcance debe ser un objeto");
  } else {
    const permitidos = camposAlcance(valor.alcance.nivel);
    if (permitidos) {
      validarCamposConocidos(valor.alcance, permitidos, "revision.alcance", errores);
    }
  }
  if (!esRegistro(valor.configuracion)) {
    errores.push("revision.configuracion debe ser un objeto");
  } else {
    validarCamposConocidos(
      valor.configuracion,
      CAMPOS_CONFIGURACION,
      "revision.configuracion",
      errores,
    );
  }
  if (!esRegistro(valor.actor)) {
    errores.push("revision.actor debe ser un objeto");
  } else {
    validarCamposConocidos(valor.actor, CAMPOS_ACTOR, "revision.actor", errores);
  }
  if (!esTextoNoVacio(valor.operationId)) {
    errores.push("revision.operationId es requerido");
  }
  if (!esTextoNoVacio(valor.idempotencyKey)) {
    errores.push("revision.idempotencyKey es requerida");
  }

  if (
    esRegistro(valor.alcance) &&
    esRegistro(valor.configuracion) &&
    esRegistro(valor.actor)
  ) {
    const politicaCompatible: PoliticaInventario = {
      id: valor.politicaId as string,
      type: POLITICA_INVENTARIO_TYPE,
      schemaVersion: valor.schemaVersion as typeof INVENTORY_SCHEMA_VERSION,
      alcance: valor.alcance as unknown as PoliticaInventario["alcance"],
      configuracion: valor.configuracion as PoliticaInventario["configuracion"],
      activa: valor.activa as boolean,
      version: valor.version as number,
      actor: valor.actor as unknown as PoliticaInventario["actor"],
      operationId: valor.operationId as string,
      idempotencyKey: valor.idempotencyKey as string,
      createdAt: valor.createdAt as number,
      updatedAt: valor.createdAt as number,
    };
    errores.push(
      ...validarPoliticaInventario(politicaCompatible).errores.map(
        (error) => `revision.${error}`,
      ),
    );
  } else if (!Number.isSafeInteger(valor.createdAt) || (valor.createdAt as number) <= 0) {
    errores.push("revision.createdAt es inválido");
  }
  return resultado(errores);
};

const compararTextoOrdinal = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const ordenarJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(ordenarJson);
  if (esRegistro(value)) {
    const ordenado: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => compararTextoOrdinal(left, right))) {
      ordenado[key] = ordenarJson(item);
    }
    return ordenado;
  }
  return value;
};

/**
 * Devuelve los bytes lógicos que se codifican en UTF-8 y se hashean con
 * SHA-256. Los metadatos técnicos y los timestamps quedan fuera del digest.
 * No llama a `node:crypto`, por lo que sirve tanto al backend como a Expo.
 */
export const serializarPoliticaInventarioRevisionCanonica = (
  revision: MaterialDigestPoliticaInventarioRevision,
): string => {
  return JSON.stringify(ordenarJson({
    type: revision.type,
    schemaVersion: revision.schemaVersion,
    politicaId: revision.politicaId,
    version: revision.version,
    revisionKind: revision.revisionKind,
    previousRevisionDigest: revision.previousRevisionDigest,
    digestAlgorithm: revision.digestAlgorithm,
    digestCanonicalVersion: revision.digestCanonicalVersion,
    alcance: revision.alcance,
    configuracion: revision.configuracion,
    activa: revision.activa,
    actor: revision.actor,
    operationId: revision.operationId,
    idempotencyKey: revision.idempotencyKey,
  }));
};

/** Construye una revisión nueva sin depender del proveedor criptográfico. */
export const construirPoliticaInventarioRevision = async (
  entrada: EntradaCrearPoliticaInventarioRevision,
  calcularSha256Hex: (entradaCanonicaUtf8: string) => string | Promise<string>,
): Promise<PoliticaInventarioRevision> => {
  const digest = await calcularSha256Hex(
    serializarPoliticaInventarioRevisionCanonica(entrada),
  );
  const revision: PoliticaInventarioRevision = { ...entrada, digest };
  const validacion = validarPoliticaInventarioRevision(revision);
  if (!validacion.valido) throw new Error(validacion.errores.join("; "));
  return revision;
};

/** El adapter inyecta su implementación SHA-256 (Node o nativa de Expo). */
export const verificarDigestPoliticaInventarioRevision = async (
  revision: unknown,
  calcularSha256Hex: (entradaCanonicaUtf8: string) => string | Promise<string>,
): Promise<ResultadoValidacionInventario> => {
  const validacion = validarPoliticaInventarioRevision(revision);
  if (!validacion.valido) return validacion;
  try {
    const calculado = await calcularSha256Hex(
      serializarPoliticaInventarioRevisionCanonica(
        revision as PoliticaInventarioRevision,
      ),
    );
    return resultado(
      calculado === (revision as PoliticaInventarioRevision).digest
        ? []
        : ["revision.digest no coincide con el contenido canónico"],
    );
  } catch {
    return resultado(["revision.digest no pudo verificarse"]);
  }
};

/**
 * Una rama siguiente solo puede enlazar el digest de la revisión anterior.
 * Este helper no decide cuál rama concurrente gana ni interpreta `_id`.
 */
export const validarEncadenamientoPoliticaInventarioRevision = (
  anterior: unknown,
  siguiente: unknown,
): ResultadoValidacionInventario => {
  const errores = [
    ...validarPoliticaInventarioRevision(anterior).errores.map((e) => `anterior.${e}`),
    ...validarPoliticaInventarioRevision(siguiente).errores.map((e) => `siguiente.${e}`),
  ];
  if (errores.length > 0) return resultado(errores);
  const previa = anterior as PoliticaInventarioRevision;
  const nueva = siguiente as PoliticaInventarioRevision;
  if (nueva.politicaId !== previa.politicaId) {
    errores.push("las revisiones deben pertenecer a la misma politicaId");
  }
  if (nueva.revisionKind === "LEGACY_BASELINE") {
    errores.push("una LEGACY_BASELINE no puede continuar una revisión anterior");
  }
  if (nueva.version !== previa.version + 1) {
    errores.push("la revisión siguiente debe incrementar version en uno");
  }
  if (nueva.previousRevisionDigest !== previa.digest) {
    errores.push("previousRevisionDigest no enlaza la revisión anterior");
  }
  return resultado(errores);
};

/** Detecta dos continuaciones incompatibles del mismo punto de la cadena. */
export const validarAusenciaForkPoliticaInventarioRevision = (
  izquierda: unknown,
  derecha: unknown,
): ResultadoValidacionInventario => {
  const errores = [
    ...validarPoliticaInventarioRevision(izquierda).errores.map((e) => `izquierda.${e}`),
    ...validarPoliticaInventarioRevision(derecha).errores.map((e) => `derecha.${e}`),
  ];
  if (errores.length > 0) return resultado(errores);
  const left = izquierda as PoliticaInventarioRevision;
  const right = derecha as PoliticaInventarioRevision;
  if (
    left.politicaId === right.politicaId &&
    left.version === right.version &&
    left.previousRevisionDigest === right.previousRevisionDigest &&
    (left.digest !== right.digest ||
      serializarPoliticaInventarioRevisionCanonica(left) !==
        serializarPoliticaInventarioRevisionCanonica(right))
  ) {
    errores.push("fork de politica detectado: dos revisiones incompatibles en la misma version");
  }
  return resultado(errores);
};
