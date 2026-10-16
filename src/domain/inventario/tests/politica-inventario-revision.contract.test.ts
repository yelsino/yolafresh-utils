import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  INVENTORY_V2_SCHEMA_VERSION,
  ModoControlInventario,
  NivelPoliticaInventario,
  POLITICA_INVENTARIO_REVISION_DIGEST_ALGORITHM,
  POLITICA_INVENTARIO_REVISION_DIGEST_CANONICAL_VERSION,
  POLITICA_INVENTARIO_REVISION_TYPE,
  construirPoliticaInventarioRevision,
  serializarPoliticaInventarioRevisionCanonica,
  validarAusenciaForkPoliticaInventarioRevision,
  validarEncadenamientoPoliticaInventarioRevision,
  validarPoliticaInventarioRevision,
  verificarDigestPoliticaInventarioRevision,
  type MaterialDigestPoliticaInventarioRevision,
  type PoliticaInventarioRevision,
} from "../index";

const sha256Hex = (entrada: string): string =>
  createHash("sha256").update(entrada, "utf8").digest("hex");

const crearRevision = (
  version: number,
  previousRevisionDigest: string | null,
  cambios: Partial<PoliticaInventarioRevision> = {},
): PoliticaInventarioRevision => {
  const borrador: PoliticaInventarioRevision = {
    _id: "opaque/ä:document-with-no-version-semantics",
    type: POLITICA_INVENTARIO_REVISION_TYPE,
    schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
    politicaId: "opaque-policy/@ 123",
    version,
    previousRevisionDigest,
    digestAlgorithm: POLITICA_INVENTARIO_REVISION_DIGEST_ALGORITHM,
    digestCanonicalVersion:
      POLITICA_INVENTARIO_REVISION_DIGEST_CANONICAL_VERSION,
    digest: "0".repeat(64),
    alcance: {
      nivel: NivelPoliticaInventario.PRODUCTO_ALMACEN,
      empresaId: "opaque-company/@ 123",
      productoBaseId: "opaque-product:abc/xyz",
      almacenId: "opaque-warehouse #1",
    },
    configuracion: {
      modo: ModoControlInventario.ESTRICTO,
      stockMinimoBase: 2.5,
      toleranciaCantidadBase: 1,
      toleranciaPorcentaje: 5,
      requiereAprobacionAjuste: true,
    },
    activa: true,
    actor: {
      usuarioId: "opaque-user:42",
      dispositivoId: "opaque-device/7",
    },
    operationId: `opaque-operation/${version}`,
    idempotencyKey: `opaque-idempotency/${version}`,
    createdAt: 1_786_800_000_000 + version,
    ...cambios,
  };
  return {
    ...borrador,
    digest: sha256Hex(serializarPoliticaInventarioRevisionCanonica(borrador)),
  };
};

test("revisión append-only acepta _id opaco sin propiedad id duplicada", async () => {
  const revision = crearRevision(1, null);
  assert.equal("id" in revision, false);
  assert.equal(validarPoliticaInventarioRevision(revision).valido, true);
  assert.equal(
    (await verificarDigestPoliticaInventarioRevision(revision, sha256Hex)).valido,
    true,
  );
});

test("constructor usa SHA-256 inyectado y entrega una revisión válida", async () => {
  const preparada = crearRevision(1, null);
  const {
    digest: _digest,
    _rev: _rev,
    ...entrada
  } = preparada;
  const revision = await construirPoliticaInventarioRevision(
    entrada,
    async (canonical) => sha256Hex(canonical),
  );
  assert.equal(revision.digest, preparada.digest);
  assert.equal(validarPoliticaInventarioRevision(revision).valido, true);
  assert.equal("id" in revision, false);
});

test("digest canónico ignora solo _id, _rev y timestamp y ordena claves sin locale", async () => {
  const original = crearRevision(1, null);
  const materialSinDocumento: MaterialDigestPoliticaInventarioRevision = {
    type: original.type,
    schemaVersion: original.schemaVersion,
    politicaId: original.politicaId,
    version: original.version,
    previousRevisionDigest: original.previousRevisionDigest,
    digestAlgorithm: original.digestAlgorithm,
    digestCanonicalVersion: original.digestCanonicalVersion,
    alcance: original.alcance,
    configuracion: original.configuracion,
    activa: original.activa,
    actor: original.actor,
    operationId: original.operationId,
    idempotencyKey: original.idempotencyKey,
  };
  assert.equal(
    serializarPoliticaInventarioRevisionCanonica(materialSinDocumento),
    serializarPoliticaInventarioRevisionCanonica(original),
  );
  const reordenada: PoliticaInventarioRevision = {
    ...original,
    _id: "unrelated-id-without-semantic-prefix",
    _rev: "2-unrelated-couch-rev",
    createdAt: original.createdAt + 123,
    alcance: {
      almacenId: "opaque-warehouse #1",
      productoBaseId: "opaque-product:abc/xyz",
      empresaId: "opaque-company/@ 123",
      nivel: NivelPoliticaInventario.PRODUCTO_ALMACEN,
    },
    configuracion: {
      requiereAprobacionAjuste: true,
      toleranciaPorcentaje: 5,
      stockMinimoBase: 2.5,
      modo: ModoControlInventario.ESTRICTO,
      toleranciaCantidadBase: 1,
    },
    actor: {
      dispositivoId: "opaque-device/7",
      usuarioId: "opaque-user:42",
    },
  };
  assert.equal(
    serializarPoliticaInventarioRevisionCanonica(original),
    serializarPoliticaInventarioRevisionCanonica(reordenada),
  );
  assert.equal(
    (await verificarDigestPoliticaInventarioRevision(reordenada, sha256Hex)).valido,
    true,
  );
  assert.equal(
    validarAusenciaForkPoliticaInventarioRevision(original, reordenada).valido,
    true,
  );
});

test("digest detecta cambios en configuración, actor y operationId", async () => {
  const revision = crearRevision(1, null);
  for (const alterada of [
    { ...revision, configuracion: { ...revision.configuracion, stockMinimoBase: 3 } },
    { ...revision, actor: { usuarioId: "otro-actor" } },
    { ...revision, operationId: "otra-operacion" },
  ]) {
    const validacion = await verificarDigestPoliticaInventarioRevision(
      alterada,
      async (entrada) => sha256Hex(entrada),
    );
    assert.match(validacion.errores.join(" "), /digest no coincide/);
  }
});

test("revisión exige esquema, versión, digest y campos cerrados válidos", () => {
  const revision = crearRevision(1, null);
  const casos: Array<[unknown, RegExp]> = [
    [{ ...revision, _id: " " }, /_id es requerido/],
    [{ ...revision, id: "duplicado" }, /\.id no pertenece al contrato/],
    [{ ...revision, type: "politica_inventario" }, /type es inválido/],
    [{ ...revision, schemaVersion: 1 }, /schemaVersion debe ser 2/],
    [{ ...revision, politicaId: "" }, /politicaId es requerido/],
    [{ ...revision, version: Number.MAX_SAFE_INTEGER + 1 }, /entero seguro positivo/],
    [{ ...revision, digest: "AB".repeat(32) }, /digest debe ser SHA-256 hex minúscula/],
    [{ ...revision, digestAlgorithm: "SHA-1" }, /digestAlgorithm debe ser SHA-256/],
    [{ ...revision, digestCanonicalVersion: 2 }, /digestCanonicalVersion debe ser 1/],
    [{ ...revision, previousRevisionDigest: "0".repeat(64) }, /version 1 exige previousRevisionDigest null/],
    [{ ...revision, configuracion: { ...revision.configuracion, unknown: true } }, /unknown no pertenece al contrato/],
    [{ ...revision, alcance: { ...revision.alcance, anotherId: "x" } }, /anotherId no pertenece al contrato/],
    [{ ...revision, actor: { ...revision.actor, token: "x" } }, /token no pertenece al contrato/],
    [{ ...revision, createdAt: 0 }, /createdAt/],
    [{ ...revision, configuracion: { ...revision.configuracion, stockMinimoBase: -1 } }, /stockMinimoBase/],
  ];
  for (const [candidata, esperado] of casos) {
    assert.match(validarPoliticaInventarioRevision(candidata).errores.join(" "), esperado);
  }
  assert.match(
    validarPoliticaInventarioRevision({ ...revision, version: 2, previousRevisionDigest: null }).errores.join(" "),
    /previousRevisionDigest debe ser SHA-256/,
  );
});

test("stockMinimoBase sigue restringido a alcances de producto", () => {
  const revision = crearRevision(1, null);
  const empresa = {
    ...revision,
    alcance: {
      nivel: NivelPoliticaInventario.EMPRESA,
      empresaId: "opaque-company/@ 123",
    },
  };
  assert.match(
    validarPoliticaInventarioRevision(empresa).errores.join(" "),
    /stockMinimoBase requiere alcance de producto/,
  );
});

test("encadenamiento valida politicaId, versión consecutiva y digest previo", () => {
  const inicial = crearRevision(1, null);
  const siguiente = crearRevision(2, inicial.digest);
  assert.equal(
    validarEncadenamientoPoliticaInventarioRevision(inicial, siguiente).valido,
    true,
  );
  assert.match(
    validarEncadenamientoPoliticaInventarioRevision(
      inicial,
      crearRevision(3, inicial.digest),
    ).errores.join(" "),
    /incrementar version en uno/,
  );
  assert.match(
    validarEncadenamientoPoliticaInventarioRevision(
      inicial,
      crearRevision(2, "f".repeat(64)),
    ).errores.join(" "),
    /previousRevisionDigest no enlaza/,
  );
  assert.match(
    validarEncadenamientoPoliticaInventarioRevision(
      inicial,
      crearRevision(2, inicial.digest, { politicaId: "otra-politica" }),
    ).errores.join(" "),
    /misma politicaId/,
  );
});

test("baseline legada inicia una cadena sin inventar revisiones previas", async () => {
  const baseline = crearRevision(7, null, {
    revisionKind: "LEGACY_BASELINE",
  });
  const siguiente = crearRevision(8, baseline.digest);
  assert.equal(validarPoliticaInventarioRevision(baseline).valido, true);
  assert.equal(
    (await verificarDigestPoliticaInventarioRevision(baseline, sha256Hex)).valido,
    true,
  );
  assert.equal(
    validarEncadenamientoPoliticaInventarioRevision(baseline, siguiente).valido,
    true,
  );
  assert.notEqual(baseline.digest, crearRevision(7, null).digest);
  assert.match(
    validarPoliticaInventarioRevision({
      ...baseline,
      revisionKind: undefined,
    }).errores.join(" "),
    /previousRevisionDigest debe ser SHA-256/,
  );
  assert.match(
    validarPoliticaInventarioRevision({
      ...baseline,
      previousRevisionDigest: "f".repeat(64),
    }).errores.join(" "),
    /LEGACY_BASELINE exige previousRevisionDigest null/,
  );
  assert.match(
    validarPoliticaInventarioRevision({
      ...baseline,
      version: 1,
    }).errores.join(" "),
    /LEGACY_BASELINE exige version mayor que 1/,
  );
  assert.match(
    validarEncadenamientoPoliticaInventarioRevision(
      siguiente,
      crearRevision(9, null, { revisionKind: "LEGACY_BASELINE" }),
    ).errores.join(" "),
    /LEGACY_BASELINE no puede continuar/,
  );
});

test("dos ediciones offline concurrentes forman un fork detectable sin elegir ganadora", () => {
  const previa = crearRevision(1, null);
  const ramaA = crearRevision(2, previa.digest, {
    operationId: "operacion-offline-a",
    idempotencyKey: "dedupe-a",
    configuracion: { modo: ModoControlInventario.FLEXIBLE },
  });
  const ramaB = crearRevision(2, previa.digest, {
    operationId: "operacion-offline-b",
    idempotencyKey: "dedupe-b",
    configuracion: { modo: ModoControlInventario.REFERENCIAL },
  });
  assert.equal(validarEncadenamientoPoliticaInventarioRevision(previa, ramaA).valido, true);
  assert.equal(validarEncadenamientoPoliticaInventarioRevision(previa, ramaB).valido, true);
  assert.match(
    validarAusenciaForkPoliticaInventarioRevision(ramaA, ramaB).errores.join(" "),
    /fork de politica detectado/,
  );
  assert.equal(
    validarAusenciaForkPoliticaInventarioRevision(ramaA, {
      ...ramaA,
      _id: "otro-id-opaco",
      _rev: "2-couch",
      createdAt: ramaA.createdAt + 1,
    }).valido,
    true,
  );
});
