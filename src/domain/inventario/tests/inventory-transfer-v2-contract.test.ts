import assert from "node:assert/strict";
import test from "node:test";

import {
  INVENTORY_V2_SCHEMA_VERSION,
  UnidadBaseInventarioV2,
} from "../contracts/inventory-quantity-v2.contract";
import { TipoMovimientoInventarioV2 } from "../contracts/movimiento-inventario-v2.contract";
import {
  EstadoTransferenciaInventarioV2,
  TRANSFERENCIA_INVENTARIO_V2_TYPE,
  type AccionTransferenciaInventarioV2Snapshot,
  type AccionVersionadaTransferenciaInventarioV2Snapshot,
  type RecepcionTransferenciaInventarioV2Snapshot,
  type TransferenciaInventarioV2,
  type TransferenciaInventarioV2Linea,
} from "../contracts/transferencia-inventario-v2.contract";
import {
  assertTransicionTransferenciaInventarioV2,
  construirIdMovimientoTransferenciaInventarioV2,
  construirMovimientosTransferenciaInventarioV2,
  puedeAgregarRecepcionTransferenciaInventarioV2,
  puedeTransicionarTransferenciaInventarioV2,
  resumirTransferenciaInventarioV2,
  validarEvolucionTransferenciaInventarioV2,
  validarMovimientoInventarioV2,
  validarTransferenciaInventarioV2,
} from "../index";

const ahora = 1_786_800_000_000;

const accion = (
  suffix: string,
  registradaAt: number,
): AccionTransferenciaInventarioV2Snapshot => ({
  operationId: `operacion_${suffix}`,
  idempotencyKey: `transferencia_001:${suffix}`,
  actor: {
    usuarioId: "usuario_001",
    usuarioNombre: "Ana",
    dispositivoId: "tablet_001",
    sesionId: "sesion_001",
  },
  registradaAt,
});

const accionVersionada = (
  suffix: string,
  registradaAt: number,
  expectedVersion: number,
): AccionVersionadaTransferenciaInventarioV2Snapshot => ({
  ...accion(suffix, registradaAt),
  expectedVersion,
});

const crearLinea = (
  capturaBase: boolean,
): TransferenciaInventarioV2Linea => {
  const comun = {
    id: "linea_001",
    productoBaseId: "producto_arroz",
    unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
    cantidadBase: 6,
    lote: "LOTE-01",
    costoUnitarioBaseSnapshot: 2.5,
    monedaCosto: "PEN" as const,
  };

  if (capturaBase) {
    return {
      ...comun,
      cantidadOperacion: 6,
      conversionSnapshot: {
        productoBaseId: "producto_arroz",
        unidadOperacion: UnidadBaseInventarioV2.KILOGRAMO,
        unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
        factorUnidadBase: 1,
        precisionCantidadBase: 3,
        capturadaAt: ahora - 1_000,
      },
    };
  }

  return {
    ...comun,
    presentacionId: "presentacion_saco_3kg",
    cantidadOperacion: 2,
    conversionSnapshot: {
      productoBaseId: "producto_arroz",
      presentacionId: "presentacion_saco_3kg",
      unidadOperacion: "saco",
      unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
      factorUnidadBase: 3,
      precisionCantidadBase: 3,
      versionConversion: 4,
      capturadaAt: ahora - 1_000,
    },
  };
};

const crearBorrador = (capturaBase = false): TransferenciaInventarioV2 => ({
  id: "transferencia_001",
  type: TRANSFERENCIA_INVENTARIO_V2_TYPE,
  schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
  version: 1,
  estado: EstadoTransferenciaInventarioV2.BORRADOR,
  empresaId: "empresa_001",
  almacenOrigenId: "almacen_origen",
  almacenDestinoId: "almacen_destino",
  numeroTransferencia: "TR-0001",
  items: [crearLinea(capturaBase)],
  correlationId: "correlacion_transferencia_001",
  creacion: accion("crear", ahora),
  recepciones: [],
  createdAt: ahora,
  updatedAt: ahora,
});

const enviar = (borrador = crearBorrador()): TransferenciaInventarioV2 => ({
  ...borrador,
  version: 2,
  estado: EstadoTransferenciaInventarioV2.ENVIADA,
  envio: accionVersionada("enviar", ahora + 1_000, 1),
  movimientoSalidaId: construirIdMovimientoTransferenciaInventarioV2(
    borrador.id,
    "SALIDA",
  ),
  updatedAt: ahora + 1_000,
});

const recibo = (
  transferenciaId: string,
  id: string,
  expectedVersion: number,
  registradaAt: number,
  aceptada: number,
  rechazada = 0,
  faltante = 0,
): RecepcionTransferenciaInventarioV2Snapshot => ({
  id,
  ...accionVersionada(id, registradaAt, expectedVersion),
  movimientoEntradaId: construirIdMovimientoTransferenciaInventarioV2(
    transferenciaId,
    "ENTRADA",
    id,
  ),
  items: [
    {
      lineaTransferenciaId: "linea_001",
      cantidadBaseAceptada: aceptada,
      cantidadBaseRechazada: rechazada,
      cantidadBaseFaltante: faltante,
      motivoCodigo: rechazada > 0 || faltante > 0 ? "DIFERENCIA_RECEPCION" : undefined,
      evidenciaIds: rechazada > 0 || faltante > 0 ? ["evidencia_001"] : undefined,
    },
  ],
});

test("transferencia V2 acepta presentacion o captura directa en unidad base", () => {
  assert.equal(validarTransferenciaInventarioV2(crearBorrador()).valido, true);
  assert.equal(validarTransferenciaInventarioV2(crearBorrador(true)).valido, true);

  const presentacionSinVersion = crearBorrador();
  presentacionSinVersion.items[0] = {
    ...presentacionSinVersion.items[0],
    conversionSnapshot: {
      ...presentacionSinVersion.items[0].conversionSnapshot,
      versionConversion: undefined,
    },
  } as never;
  assert.match(
    validarTransferenciaInventarioV2(presentacionSinVersion).errores.join(" "),
    /versionConversion.*requerida/,
  );

  const presentacionConVersionInsegura = crearBorrador();
  presentacionConVersionInsegura.items[0] = {
    ...presentacionConVersionInsegura.items[0],
    conversionSnapshot: {
      ...presentacionConVersionInsegura.items[0].conversionSnapshot,
      versionConversion: Number.MAX_SAFE_INTEGER + 1,
    },
  } as never;
  assert.match(
    validarTransferenciaInventarioV2(
      presentacionConVersionInsegura,
    ).errores.join(" "),
    /entero seguro positivo/,
  );

  const baseInconsistente = crearBorrador(true);
  baseInconsistente.items[0] = {
    ...baseInconsistente.items[0],
    conversionSnapshot: {
      ...baseInconsistente.items[0].conversionSnapshot,
      factorUnidadBase: 2,
    },
  } as never;
  assert.equal(
    validarTransferenciaInventarioV2(baseInconsistente).valido,
    false,
  );

});

test("ciclo permite cancelar solo antes del envio y recibir en varios eventos", () => {
  assert.equal(
    puedeTransicionarTransferenciaInventarioV2(
      EstadoTransferenciaInventarioV2.BORRADOR,
      EstadoTransferenciaInventarioV2.ENVIADA,
    ),
    true,
  );
  assert.equal(
    puedeAgregarRecepcionTransferenciaInventarioV2(
      EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA,
    ),
    true,
  );
  assert.throws(
    () =>
      assertTransicionTransferenciaInventarioV2(
        EstadoTransferenciaInventarioV2.ENVIADA,
        EstadoTransferenciaInventarioV2.CANCELADA,
      ),
    /transicion_transferencia_inventario_v2_no_permitida/,
  );

  const borrador = crearBorrador();
  const cancelada: TransferenciaInventarioV2 = {
    ...borrador,
    version: 2,
    estado: EstadoTransferenciaInventarioV2.CANCELADA,
    cancelacion: {
      ...accionVersionada("cancelar", ahora + 1_000, 1),
      motivoCodigo: "ERROR_CAPTURA",
    },
    updatedAt: ahora + 1_000,
  };
  assert.equal(validarTransferenciaInventarioV2(cancelada).valido, true);
});

test("recepciones parciales materializan una entrada determinista por recibo", () => {
  const enviada = enviar();
  const primera = recibo(enviada.id, "recibo_001", 2, ahora + 2_000, 2);
  const parcial: TransferenciaInventarioV2 = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA,
    recepciones: [primera],
    updatedAt: ahora + 2_000,
  };
  assert.equal(validarTransferenciaInventarioV2(parcial).valido, true);
  assert.equal(
    resumirTransferenciaInventarioV2(parcial).lineas[0].cantidadBaseEnTransito,
    4,
  );

  const segunda = recibo(
    enviada.id,
    "recibo_002",
    3,
    ahora + 3_000,
    3,
    0,
    1,
  );
  const cerrada: TransferenciaInventarioV2 = {
    ...parcial,
    version: 4,
    estado: EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
    recepciones: [primera, segunda],
    updatedAt: ahora + 3_000,
  };
  assert.equal(validarTransferenciaInventarioV2(cerrada).valido, true);
  assert.deepEqual(resumirTransferenciaInventarioV2(cerrada), {
    lineas: [
      {
        lineaTransferenciaId: "linea_001",
        unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
        cantidadBaseEnviada: 6,
        cantidadBaseAceptada: 5,
        cantidadBaseRechazada: 0,
        cantidadBaseFaltante: 1,
        cantidadBaseEnTransito: 0,
      },
    ],
    totalesPorUnidadBase: [
      {
        unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
        cantidadBaseEnviada: 6,
        cantidadBaseAceptada: 5,
        cantidadBaseRechazada: 0,
        cantidadBaseFaltante: 1,
        cantidadBaseEnTransito: 0,
      },
    ],
  });

  const movimientos = construirMovimientosTransferenciaInventarioV2(cerrada);
  assert.equal(movimientos.length, 3);
  assert.equal(movimientos[0].tipo, TipoMovimientoInventarioV2.TRANSFERENCIA_SALIDA);
  assert.equal(movimientos[0].items[0].cantidadBaseDelta, -6);
  assert.equal(movimientos[1].items[0].cantidadBaseDelta, 2);
  assert.equal(movimientos[2].items[0].cantidadBaseDelta, 3);
  assert.notEqual(movimientos[1].id, movimientos[2].id);
  movimientos.forEach((movimiento) => {
    assert.equal(validarMovimientoInventarioV2(movimiento).valido, true);
  });
});

test("cierre de diferencia concilia una transferencia sin inventar una entrada", () => {
  const enviada = enviar();
  const cerrada: TransferenciaInventarioV2 = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
    cierreDiferencia: {
      ...accionVersionada("cerrar_diferencia", ahora + 2_000, 2),
      items: [
        {
          lineaTransferenciaId: "linea_001",
          cantidadBaseRechazada: 0,
          cantidadBaseFaltante: 6,
          motivoCodigo: "EXTRAVIO_TOTAL",
          evidenciaIds: ["acta_001"],
        },
      ],
    },
    updatedAt: ahora + 2_000,
  };
  assert.equal(validarTransferenciaInventarioV2(cerrada).valido, true);
  assert.equal(construirMovimientosTransferenciaInventarioV2(cerrada).length, 1);
  assert.equal(
    resumirTransferenciaInventarioV2(cerrada).lineas[0].cantidadBaseFaltante,
    6,
  );
});

test("validador rechaza sobre-recepcion, diferencias sin motivo y recibos sin entrada", () => {
  const enviada = enviar();
  const sobreRecibida: TransferenciaInventarioV2 = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventarioV2.RECIBIDA,
    recepciones: [recibo(enviada.id, "recibo_001", 2, ahora + 2_000, 7)],
    updatedAt: ahora + 2_000,
  };
  assert.match(
    validarTransferenciaInventarioV2(sobreRecibida).errores.join(" "),
    /excede la cantidad enviada/,
  );

  const diferenciaSinMotivo = recibo(
    enviada.id,
    "recibo_002",
    2,
    ahora + 2_000,
    5,
    0,
    1,
  );
  diferenciaSinMotivo.items[0].motivoCodigo = undefined;
  assert.equal(
    validarTransferenciaInventarioV2({
      ...enviada,
      version: 3,
      estado: EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
      recepciones: [diferenciaSinMotivo],
      updatedAt: ahora + 2_000,
    }).valido,
    false,
  );

  const sinAceptada = recibo(
    enviada.id,
    "recibo_003",
    2,
    ahora + 2_000,
    0,
    0,
    6,
  );
  assert.match(
    validarTransferenciaInventarioV2({
      ...enviada,
      version: 3,
      estado: EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
      recepciones: [sinAceptada],
      updatedAt: ahora + 2_000,
    }).errores.join(" "),
    /debe aceptar stock/,
  );
});

test("CAS contractual evita que dos tablets sobrescriban la misma version", () => {
  const enviada = enviar();
  const candidataA: TransferenciaInventarioV2 = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA,
    recepciones: [recibo(enviada.id, "recibo_A", 2, ahora + 2_000, 2)],
    updatedAt: ahora + 2_000,
  };
  const candidataB: TransferenciaInventarioV2 = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA,
    recepciones: [recibo(enviada.id, "recibo_B", 2, ahora + 2_100, 3)],
    updatedAt: ahora + 2_100,
  };
  assert.equal(validarTransferenciaInventarioV2(candidataA).valido, true);
  assert.equal(validarTransferenciaInventarioV2(candidataB).valido, true);
  assert.equal(
    validarEvolucionTransferenciaInventarioV2(enviada, candidataA).valido,
    true,
  );
  assert.equal(
    validarEvolucionTransferenciaInventarioV2(candidataA, candidataA).valido,
    true,
    "el replay identico es idempotente",
  );
  assert.match(
    validarEvolucionTransferenciaInventarioV2(candidataA, candidataB).errores.join(" "),
    /misma version/,
  );
});

test("la superficie pública exporta los helpers de transferencia", () => {
  const pkg = require("yola-fresh-utils") as Record<string, unknown>;
  assert.equal(pkg.TRANSFERENCIA_INVENTARIO_V2_TYPE, TRANSFERENCIA_INVENTARIO_V2_TYPE);
  assert.equal(typeof pkg.validarTransferenciaInventarioV2, "function");
  assert.equal(typeof pkg.validarEvolucionTransferenciaInventarioV2, "function");
  assert.equal(typeof pkg.resumirTransferenciaInventarioV2, "function");
  assert.equal(typeof pkg.validarEvolucionPoliticaInventario, "function");
  assert.equal(typeof pkg.validarEvolucionMermaInventario, "function");
  assert.equal(
    typeof pkg.construirMovimientoAplicacionMermaInventarioV2,
    "function",
  );
  assert.equal("EstadoTransferenciaEnum" in pkg, false);
});
