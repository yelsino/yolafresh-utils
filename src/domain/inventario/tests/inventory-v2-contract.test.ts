import assert from "node:assert/strict";
import test from "node:test";

import {
  AJUSTE_INVENTARIO_TYPE,
  CONTEO_INVENTARIO_LINEA_TYPE,
  CONTEO_INVENTARIO_TYPE,
  EstadoAprobacionInventario,
  EstadoConteoInventario,
  EstadoLineaConteoInventario,
  INVENTORY_V2_SCHEMA_VERSION,
  MERMA_INVENTARIO_TYPE,
  MOVIMIENTO_INVENTARIO_V2_TYPE,
  ModoControlInventario,
  MotivoMermaInventario,
  NivelPoliticaInventario,
  OrigenAjusteInventario,
  OrigenMovimientoInventarioV2,
  POLITICA_INVENTARIO_TYPE,
  TipoCapturaConteoInventario,
  TipoConteoInventario,
  TipoMovimientoInventarioV2,
  UnidadBaseInventarioV2,
  calcularDiferenciaConteo,
  calcularStockDisponibleBase,
  construirIdStockProductoBaseAlmacen,
  construirIdMovimientoMermaInventarioV2,
  convertirCantidadAUnidadBase,
  resolverPoliticaInventario,
  validarAjusteInventario,
  validarConteoInventario,
  validarConteoInventarioLinea,
  validarConversionInventario,
  validarMermaInventario,
  validarMovimientoInventarioV2,
  validarPoliticaInventario,
  type ActorInventarioSnapshot,
  type AjusteInventario,
  type ConteoInventario,
  type ConteoInventarioLinea,
  type ConversionUnidadInventarioSnapshot,
  type MermaInventario,
  type MovimientoInventarioV2,
  type AlcancePoliticaInventario,
  type PoliticaInventario,
} from "../index";

const ahora = 1_786_800_000_000;
const actor: ActorInventarioSnapshot = {
  usuarioId: "usuario_001",
  usuarioNombre: "Ana",
  dispositivoId: "tablet_001",
  sesionId: "sesion_001",
};
const conversion: ConversionUnidadInventarioSnapshot = {
  productoBaseId: "producto_arroz",
  presentacionId: "presentacion_saco_3kg",
  unidadOperacion: "saco",
  unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
  factorUnidadBase: 3,
  precisionCantidadBase: 3,
  versionConversion: 2,
  capturadaAt: ahora,
};

const buildPolitica = (
  id: string,
  alcance: AlcancePoliticaInventario,
  modo: ModoControlInventario,
): PoliticaInventario => ({
  id,
  type: POLITICA_INVENTARIO_TYPE,
  schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
  alcance,
  configuracion: { modo },
  activa: true,
  version: 1,
  actor,
  operationId: `operacion_${id}`,
  idempotencyKey: `${id}:version:1`,
  createdAt: ahora,
  updatedAt: ahora,
});

const buildMovimiento = (): MovimientoInventarioV2 => ({
  id: "movimiento_001",
  type: MOVIMIENTO_INVENTARIO_V2_TYPE,
  schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
  estado: "APLICADO",
  tipo: TipoMovimientoInventarioV2.SALIDA,
  almacenId: "almacen_001",
  origen: {
    tipo: OrigenMovimientoInventarioV2.VENTA,
    documentoId: "venta_001",
  },
  items: [{
    id: "linea_001",
    productoBaseId: "producto_arroz",
    almacenId: "almacen_001",
    cantidadOperacion: 2,
    conversionSnapshot: conversion,
    cantidadBaseDelta: -6,
    unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
  }],
  operationId: "operacion_001",
  idempotencyKey: "venta_001:inventario",
  correlationId: "venta_001",
  actor,
  fechaEfectiva: ahora,
  registradoAt: ahora,
});

test("convierte cantidades comerciales usando el snapshot congelado", () => {
  assert.equal(convertirCantidadAUnidadBase(1.25, conversion), 3.75);
  assert.equal(calcularDiferenciaConteo(3.75, 4, 3), -0.25);
  assert.equal(
    validarConversionInventario({ ...conversion, factorUnidadBase: 0 }).valido,
    false,
  );
});

test("conversión física exige versión segura con presentación y admite captura base sin versión", () => {
  const directaBase: ConversionUnidadInventarioSnapshot = {
    productoBaseId: "producto_arroz",
    unidadOperacion: UnidadBaseInventarioV2.KILOGRAMO,
    unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
    factorUnidadBase: 1,
    precisionCantidadBase: 3,
    capturadaAt: ahora,
  };
  assert.equal(validarConversionInventario(directaBase).valido, true);

  const sinVersion = {
    ...conversion,
    versionConversion: undefined,
  } as unknown as ConversionUnidadInventarioSnapshot;
  assert.match(
    validarConversionInventario(sinVersion).errores.join(" "),
    /versionConversion.*requerida.*entero seguro positivo/,
  );

  const versionInsegura = {
    ...conversion,
    versionConversion: Number.MAX_SAFE_INTEGER + 1,
  } as ConversionUnidadInventarioSnapshot;
  assert.match(
    validarConversionInventario(versionInsegura).errores.join(" "),
    /entero seguro positivo/,
  );

  const baseConVersionInventada = {
    ...directaBase,
    versionConversion: 1,
  } as unknown as ConversionUnidadInventarioSnapshot;
  assert.match(
    validarConversionInventario(baseConVersionInventada).errores.join(" "),
    /no aplica sin presentacionId/,
  );
});

test("stock se identifica por producto base y almacén", () => {
  assert.equal(
    construirIdStockProductoBaseAlmacen("producto/1", "almacen principal"),
    "stock_producto_base_almacen:producto%2F1:almacen%20principal",
  );
  assert.equal(
    calcularStockDisponibleBase({
      cantidadFisicaBase: 20,
      cantidadReservadaBase: 3.5,
    }),
    16.5,
  );
});

test("política aplica precedencia producto y almacén sobre empresa", () => {
  const politicas = [
    buildPolitica(
      "politica_empresa",
      { nivel: NivelPoliticaInventario.EMPRESA, empresaId: "empresa_001" },
      ModoControlInventario.ESTRICTO,
    ),
    buildPolitica(
      "politica_producto_almacen",
      {
        nivel: NivelPoliticaInventario.PRODUCTO_ALMACEN,
        empresaId: "empresa_001",
        almacenId: "almacen_001",
        productoBaseId: "producto_arroz",
      },
      ModoControlInventario.SIN_CONTROL,
    ),
  ];
  politicas.forEach((politica) => {
    assert.equal(validarPoliticaInventario(politica).valido, true);
  });
  const resuelta = resolverPoliticaInventario(politicas, {
    empresaId: "empresa_001",
    almacenId: "almacen_001",
    productoBaseId: "producto_arroz",
  });
  assert.equal(resuelta.modo, ModoControlInventario.SIN_CONTROL);
  assert.equal(resuelta.registrarMovimientos, false);
});

test("movimiento aplicado exige idempotencia, conversión y signo coherente", () => {
  const movimiento = buildMovimiento();
  assert.equal(validarMovimientoInventarioV2(movimiento).valido, true);
  const errores = validarMovimientoInventarioV2({
    ...movimiento,
    idempotencyKey: "",
    items: [{ ...movimiento.items[0], cantidadBaseDelta: 6 }],
  }).errores.join(" ");
  assert.match(errores, /idempotencyKey/);
  assert.match(errores, /signo incompatible/);
});

test("movimiento físico no acepta una presentación sin versión de conversión", () => {
  const movimiento = buildMovimiento();
  const sinVersion: MovimientoInventarioV2 = {
    ...movimiento,
    items: [{
      ...movimiento.items[0],
      conversionSnapshot: {
        ...movimiento.items[0].conversionSnapshot,
        versionConversion: undefined,
      } as unknown as ConversionUnidadInventarioSnapshot,
    }],
  };

  assert.match(
    validarMovimientoInventarioV2(sinVersion).errores.join(" "),
    /versionConversion.*requerida/,
  );

  const directoBase: MovimientoInventarioV2 = {
    ...movimiento,
    items: [{
      ...movimiento.items[0],
      cantidadOperacion: 6,
      cantidadBaseDelta: -6,
      conversionSnapshot: {
        productoBaseId: "producto_arroz",
        unidadOperacion: UnidadBaseInventarioV2.KILOGRAMO,
        unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
        factorUnidadBase: 1,
        precisionCantidadBase: 3,
        capturadaAt: ahora,
      },
    }],
  };
  assert.equal(validarMovimientoInventarioV2(directoBase).valido, true);
});

test("conteo guarda cabecera y líneas separadas con cero permitido", () => {
  const linea: ConteoInventarioLinea = {
    id: "conteo_001:producto_arroz",
    type: CONTEO_INVENTARIO_LINEA_TYPE,
    schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
    conteoId: "conteo_001",
    productoBaseId: "producto_arroz",
    almacenId: "almacen_001",
    unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
    cantidadTeoricaBaseAlCorte: 3,
    versionProyeccionAlCorte: 1,
    capturas: [{
      id: "captura_001",
      tipo: TipoCapturaConteoInventario.CONTEO,
      ronda: 1,
      cantidadOperacion: 0,
      cantidadBase: 0,
      conversionSnapshot: conversion,
      actor,
      capturadaAt: ahora,
    }],
    capturaVigenteId: "captura_001",
    cantidadContadaBase: 0,
    diferenciaBase: -3,
    motivoDiferenciaCodigo: "AGOTADO",
    estado: EstadoLineaConteoInventario.CONTADA,
    createdAt: ahora,
    updatedAt: ahora,
  };
  const conteo: ConteoInventario = {
    id: "conteo_001",
    type: CONTEO_INVENTARIO_TYPE,
    schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
    tipoConteo: TipoConteoInventario.CICLICO,
    estado: EstadoConteoInventario.EN_REVISION,
    empresaId: "empresa_001",
    almacenId: "almacen_001",
    alcance: { productoBaseIds: ["producto_arroz"] },
    conteoCiego: true,
    fechaCorte: ahora,
    totales: {
      lineasEsperadas: 1, lineasPendientes: 0, lineasContadas: 1,
      lineasReconteo: 0, lineasValidadas: 0, lineasConDiferencia: 1,
    },
    creadoPor: actor,
    createdAt: ahora,
    updatedAt: ahora,
  };
  assert.equal(validarConteoInventarioLinea(linea).valido, true);
  assert.equal(validarConteoInventario(conteo).valido, true);
  assert.equal("lineas" in conteo, false);
});

test("ajuste y merma aplicados exigen su movimiento resultante", () => {
  const ajuste: AjusteInventario = {
    id: "ajuste_001",
    type: AJUSTE_INVENTARIO_TYPE,
    schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
    estado: EstadoAprobacionInventario.APLICADO,
    origen: OrigenAjusteInventario.CONTEO,
    empresaId: "empresa_001",
    almacenId: "almacen_001",
    conteoInventarioId: "conteo_001",
    lineas: [{
      id: "ajuste_linea_001", productoBaseId: "producto_arroz",
      almacenId: "almacen_001", unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
      conversionSnapshot: conversion, cantidadTeoricaBase: 3,
      cantidadObjetivoBase: 0, cantidadBaseDelta: -3,
      motivoCodigo: "DIFERENCIA_CONTEO",
    }],
    operationId: "operacion_ajuste_001",
    idempotencyKey: "conteo_001:ajuste",
    aprobacion: {
      solicitadoPor: actor, solicitadoAt: ahora,
      aprobadoPor: actor, aprobadoAt: ahora,
    },
    movimientoInventarioId: "movimiento_ajuste_001",
    createdAt: ahora,
    updatedAt: ahora,
  };
  const merma: MermaInventario = {
    id: "merma_001",
    type: MERMA_INVENTARIO_TYPE,
    schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
    estado: EstadoAprobacionInventario.APLICADO,
    empresaId: "empresa_001",
    almacenId: "almacen_001",
    lineas: [{
      id: "merma_linea_001", productoBaseId: "producto_arroz",
      almacenId: "almacen_001", unidadBase: UnidadBaseInventarioV2.KILOGRAMO,
      cantidadOperacion: 1, cantidadBase: 3,
      conversionSnapshot: conversion, motivo: MotivoMermaInventario.DETERIORO,
    }],
    operationId: "operacion_merma_aplicar",
    idempotencyKey: "merma_001:aplicar",
    version: 4,
    flujo: {
      creacion: {
        operationId: "operacion_merma_crear",
        idempotencyKey: "merma_001:crear",
        actor,
        registradaAt: ahora,
      },
      solicitud: {
        operationId: "operacion_merma_solicitar",
        idempotencyKey: "merma_001:solicitar",
        actor,
        registradaAt: ahora + 1,
        expectedVersion: 1,
      },
      aprobacion: {
        operationId: "operacion_merma_aprobar",
        idempotencyKey: "merma_001:aprobar",
        actor,
        registradaAt: ahora + 2,
        expectedVersion: 2,
      },
      aplicacion: {
        operationId: "operacion_merma_aplicar",
        idempotencyKey: "merma_001:aplicar",
        actor,
        registradaAt: ahora + 3,
        expectedVersion: 3,
      },
    },
    aprobacion: {
      solicitadoPor: actor, solicitadoAt: ahora + 1,
      aprobadoPor: actor, aprobadoAt: ahora + 2,
    },
    movimientoInventarioId: construirIdMovimientoMermaInventarioV2("merma_001"),
    createdAt: ahora,
    updatedAt: ahora + 3,
  };
  assert.equal(validarAjusteInventario(ajuste).valido, true);
  assert.equal(validarMermaInventario(merma).valido, true);
  assert.equal(
    validarMermaInventario({ ...merma, movimientoInventarioId: undefined }).valido,
    false,
  );
});
