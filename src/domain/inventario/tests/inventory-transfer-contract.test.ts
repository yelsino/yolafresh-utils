import assert from "node:assert/strict";
import test from "node:test";

import {
  INVENTORY_SCHEMA_VERSION,
  UnidadBaseInventario,
} from "../contracts/inventory-quantity.contract";
import { TipoMovimientoInventario } from "../contracts/movimiento-inventario.contract";
import {
  EstadoTransferenciaInventario,
  TRANSFERENCIA_INVENTARIO_TYPE,
  type AccionTransferenciaInventarioSnapshot,
  type AccionVersionadaTransferenciaInventarioSnapshot,
  type RecepcionTransferenciaInventarioSnapshot,
  type TransferenciaInventario,
  type TransferenciaInventarioLinea,
} from "../contracts/transferencia-inventario.contract";
import {
  assertTransicionTransferenciaInventario,
  construirIdMovimientoTransferenciaInventario,
  construirMovimientosTransferenciaInventario,
  puedeAgregarRecepcionTransferenciaInventario,
  puedeTransicionarTransferenciaInventario,
  resumirTransferenciaInventario,
  validarEvolucionTransferenciaInventario,
  validarMovimientoInventario,
  validarTransferenciaInventario,
  TRANSFERENCIA_INVENTARIO_V2_TYPE,
} from "../index";

const ahora = 1_786_800_000_000;

const accion = (
  suffix: string,
  registradaAt: number,
): AccionTransferenciaInventarioSnapshot => ({
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
): AccionVersionadaTransferenciaInventarioSnapshot => ({
  ...accion(suffix, registradaAt),
  expectedVersion,
});

const crearLinea = (
  capturaBase: boolean,
): TransferenciaInventarioLinea => {
  const comun = {
    id: "linea_001",
    productoBaseId: "producto_arroz",
    unidadBase: UnidadBaseInventario.KILOGRAMO,
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
        unidadOperacion: UnidadBaseInventario.KILOGRAMO,
        unidadBase: UnidadBaseInventario.KILOGRAMO,
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
      unidadBase: UnidadBaseInventario.KILOGRAMO,
      factorUnidadBase: 3,
      precisionCantidadBase: 3,
      versionConversion: 4,
      capturadaAt: ahora - 1_000,
    },
  };
};

const crearBorrador = (capturaBase = false): TransferenciaInventario => ({
  id: "transferencia_001",
  type: TRANSFERENCIA_INVENTARIO_TYPE,
  schemaVersion: INVENTORY_SCHEMA_VERSION,
  version: 1,
  estado: EstadoTransferenciaInventario.BORRADOR,
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

const enviar = (borrador = crearBorrador()): TransferenciaInventario => ({
  ...borrador,
  version: 2,
  estado: EstadoTransferenciaInventario.ENVIADA,
  envio: accionVersionada("enviar", ahora + 1_000, 1),
  movimientoSalidaId: construirIdMovimientoTransferenciaInventario(
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
): RecepcionTransferenciaInventarioSnapshot => ({
  id,
  ...accionVersionada(id, registradaAt, expectedVersion),
  movimientoEntradaId: construirIdMovimientoTransferenciaInventario(
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

test("transferencia acepta presentacion o captura directa en unidad base", () => {
  assert.equal(validarTransferenciaInventario(crearBorrador()).valido, true);
  assert.equal(validarTransferenciaInventario(crearBorrador(true)).valido, true);

  const presentacionSinVersion = crearBorrador();
  presentacionSinVersion.items[0] = {
    ...presentacionSinVersion.items[0],
    conversionSnapshot: {
      ...presentacionSinVersion.items[0].conversionSnapshot,
      versionConversion: undefined,
    },
  } as never;
  assert.match(
    validarTransferenciaInventario(presentacionSinVersion).errores.join(" "),
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
    validarTransferenciaInventario(
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
    validarTransferenciaInventario(baseInconsistente).valido,
    false,
  );

});

test("una unidad enviada con precision cero permanece en transito hasta recibirla", () => {
  const borrador = crearBorrador(true);
  borrador.items = [{
    ...borrador.items[0],
    presentacionId: undefined,
    unidadBase: UnidadBaseInventario.UNIDAD,
    cantidadOperacion: 1,
    cantidadBase: 1,
    conversionSnapshot: {
      productoBaseId: borrador.items[0].productoBaseId,
      unidadOperacion: UnidadBaseInventario.UNIDAD,
      unidadBase: UnidadBaseInventario.UNIDAD,
      factorUnidadBase: 1,
      precisionCantidadBase: 0,
      capturadaAt: ahora - 1_000,
    },
  }];
  const enviada = enviar(borrador);

  assert.equal(validarTransferenciaInventario(enviada).valido, true);
  assert.equal(
    resumirTransferenciaInventario(enviada).lineas[0].cantidadBaseEnTransito,
    1,
  );

  const recibida: TransferenciaInventario = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventario.RECIBIDA,
    recepciones: [recibo(enviada.id, "recibo_unidad", 2, ahora + 2_000, 1)],
    updatedAt: ahora + 2_000,
  };
  assert.equal(validarTransferenciaInventario(recibida).valido, true);
  assert.equal(
    resumirTransferenciaInventario(recibida).lineas[0].cantidadBaseEnTransito,
    0,
  );

  const sobreRecibida: TransferenciaInventario = {
    ...recibida,
    recepciones: [recibo(enviada.id, "recibo_excesivo", 2, ahora + 2_000, 2)],
  };
  assert.match(
    validarTransferenciaInventario(sobreRecibida).errores.join(" "),
    /excede la cantidad enviada/,
  );

  const conversionDesfasada = crearBorrador(true);
  conversionDesfasada.items = [{
    ...borrador.items[0],
    cantidadOperacion: 2,
  }];
  assert.match(
    validarTransferenciaInventario(conversionDesfasada).errores.join(" "),
    /cantidadBase no coincide con la conversion/,
  );
});

test("ciclo permite cancelar solo antes del envio y recibir en varios eventos", () => {
  assert.equal(
    puedeTransicionarTransferenciaInventario(
      EstadoTransferenciaInventario.BORRADOR,
      EstadoTransferenciaInventario.ENVIADA,
    ),
    true,
  );
  assert.equal(
    puedeAgregarRecepcionTransferenciaInventario(
      EstadoTransferenciaInventario.PARCIALMENTE_RECIBIDA,
    ),
    true,
  );
  assert.throws(
    () =>
      assertTransicionTransferenciaInventario(
        EstadoTransferenciaInventario.ENVIADA,
        EstadoTransferenciaInventario.CANCELADA,
      ),
    /transicion_transferencia_inventario_v2_no_permitida/,
  );

  const borrador = crearBorrador();
  const cancelada: TransferenciaInventario = {
    ...borrador,
    version: 2,
    estado: EstadoTransferenciaInventario.CANCELADA,
    cancelacion: {
      ...accionVersionada("cancelar", ahora + 1_000, 1),
      motivoCodigo: "ERROR_CAPTURA",
    },
    updatedAt: ahora + 1_000,
  };
  assert.equal(validarTransferenciaInventario(cancelada).valido, true);
});

test("recepciones parciales materializan una entrada determinista por recibo", () => {
  const enviada = enviar();
  const primera = recibo(enviada.id, "recibo_001", 2, ahora + 2_000, 2);
  const parcial: TransferenciaInventario = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventario.PARCIALMENTE_RECIBIDA,
    recepciones: [primera],
    updatedAt: ahora + 2_000,
  };
  assert.equal(validarTransferenciaInventario(parcial).valido, true);
  assert.equal(
    resumirTransferenciaInventario(parcial).lineas[0].cantidadBaseEnTransito,
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
  const cerrada: TransferenciaInventario = {
    ...parcial,
    version: 4,
    estado: EstadoTransferenciaInventario.CERRADA_CON_DIFERENCIA,
    recepciones: [primera, segunda],
    updatedAt: ahora + 3_000,
  };
  assert.equal(validarTransferenciaInventario(cerrada).valido, true);
  assert.deepEqual(resumirTransferenciaInventario(cerrada), {
    lineas: [
      {
        lineaTransferenciaId: "linea_001",
        unidadBase: UnidadBaseInventario.KILOGRAMO,
        cantidadBaseEnviada: 6,
        cantidadBaseAceptada: 5,
        cantidadBaseRechazada: 0,
        cantidadBaseFaltante: 1,
        cantidadBaseEnTransito: 0,
      },
    ],
    totalesPorUnidadBase: [
      {
        unidadBase: UnidadBaseInventario.KILOGRAMO,
        cantidadBaseEnviada: 6,
        cantidadBaseAceptada: 5,
        cantidadBaseRechazada: 0,
        cantidadBaseFaltante: 1,
        cantidadBaseEnTransito: 0,
      },
    ],
  });

  const movimientos = construirMovimientosTransferenciaInventario(cerrada);
  assert.equal(movimientos.length, 3);
  assert.equal(movimientos[0].tipo, TipoMovimientoInventario.TRANSFERENCIA_SALIDA);
  assert.equal(movimientos[0].items[0].cantidadBaseDelta, -6);
  assert.equal(movimientos[1].items[0].cantidadBaseDelta, 2);
  assert.equal(movimientos[2].items[0].cantidadBaseDelta, 3);
  assert.notEqual(movimientos[1].id, movimientos[2].id);
  movimientos.forEach((movimiento) => {
    assert.equal(validarMovimientoInventario(movimiento).valido, true);
  });
});

test("cierre de diferencia concilia una transferencia sin inventar una entrada", () => {
  const enviada = enviar();
  const cerrada: TransferenciaInventario = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventario.CERRADA_CON_DIFERENCIA,
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
  assert.equal(validarTransferenciaInventario(cerrada).valido, true);
  assert.equal(construirMovimientosTransferenciaInventario(cerrada).length, 1);
  assert.equal(
    resumirTransferenciaInventario(cerrada).lineas[0].cantidadBaseFaltante,
    6,
  );
});

test("validador rechaza sobre-recepcion, diferencias sin motivo y recibos sin entrada", () => {
  const enviada = enviar();
  const sobreRecibida: TransferenciaInventario = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventario.RECIBIDA,
    recepciones: [recibo(enviada.id, "recibo_001", 2, ahora + 2_000, 7)],
    updatedAt: ahora + 2_000,
  };
  assert.match(
    validarTransferenciaInventario(sobreRecibida).errores.join(" "),
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
    validarTransferenciaInventario({
      ...enviada,
      version: 3,
      estado: EstadoTransferenciaInventario.CERRADA_CON_DIFERENCIA,
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
    validarTransferenciaInventario({
      ...enviada,
      version: 3,
      estado: EstadoTransferenciaInventario.CERRADA_CON_DIFERENCIA,
      recepciones: [sinAceptada],
      updatedAt: ahora + 2_000,
    }).errores.join(" "),
    /debe aceptar stock/,
  );
});

test("CAS contractual evita que dos tablets sobrescriban la misma version", () => {
  const enviada = enviar();
  const candidataA: TransferenciaInventario = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventario.PARCIALMENTE_RECIBIDA,
    recepciones: [recibo(enviada.id, "recibo_A", 2, ahora + 2_000, 2)],
    updatedAt: ahora + 2_000,
  };
  const candidataB: TransferenciaInventario = {
    ...enviada,
    version: 3,
    estado: EstadoTransferenciaInventario.PARCIALMENTE_RECIBIDA,
    recepciones: [recibo(enviada.id, "recibo_B", 2, ahora + 2_100, 3)],
    updatedAt: ahora + 2_100,
  };
  assert.equal(validarTransferenciaInventario(candidataA).valido, true);
  assert.equal(validarTransferenciaInventario(candidataB).valido, true);
  assert.equal(
    validarEvolucionTransferenciaInventario(enviada, candidataA).valido,
    true,
  );
  assert.equal(
    validarEvolucionTransferenciaInventario(candidataA, candidataA).valido,
    true,
    "el replay identico es idempotente",
  );
  assert.match(
    validarEvolucionTransferenciaInventario(candidataA, candidataB).errores.join(" "),
    /misma version/,
  );
});

test("la superficie pública exporta los helpers de transferencia", () => {
  const pkg = require("yola-fresh-utils") as Record<string, unknown>;
  assert.equal(INVENTORY_SCHEMA_VERSION, 2);
  assert.equal(TRANSFERENCIA_INVENTARIO_TYPE, "transferencia_inventario_v2");
  assert.equal(pkg.TRANSFERENCIA_INVENTARIO_TYPE, TRANSFERENCIA_INVENTARIO_TYPE);
  assert.equal(TRANSFERENCIA_INVENTARIO_V2_TYPE, TRANSFERENCIA_INVENTARIO_TYPE);
  assert.equal(typeof pkg.validarTransferenciaInventario, "function");
  assert.equal(typeof pkg.validarEvolucionTransferenciaInventario, "function");
  assert.equal(typeof pkg.resumirTransferenciaInventario, "function");
  assert.equal(typeof pkg.validarEvolucionPoliticaInventario, "function");
  assert.equal(typeof pkg.validarEvolucionMermaInventario, "function");
  assert.equal(
    typeof pkg.construirMovimientoAplicacionMermaInventario,
    "function",
  );
  assert.equal("EstadoTransferenciaEnum" in pkg, false);
});
