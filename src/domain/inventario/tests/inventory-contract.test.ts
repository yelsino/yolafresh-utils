import assert from "node:assert/strict";
import test from "node:test";

import {
  AJUSTE_INVENTARIO_TYPE,
  CONTEO_INVENTARIO_LINEA_TYPE,
  CONTEO_INVENTARIO_TYPE,
  EstadoAprobacionInventario,
  EstadoConteoInventario,
  EstadoLineaConteoInventario,
  INVENTORY_SCHEMA_VERSION,
  MERMA_INVENTARIO_TYPE,
  MOVIMIENTO_INVENTARIO_TYPE,
  MOVIMIENTO_INVENTARIO_V2_TYPE,
  ModoControlInventario,
  MotivoMermaInventario,
  NivelPoliticaInventario,
  OrigenAjusteInventario,
  OrigenMovimientoInventario,
  POLITICA_INVENTARIO_TYPE,
  TipoCapturaConteoInventario,
  TipoConteoInventario,
  TipoMovimientoInventario,
  UnidadBaseInventario,
  calcularDiferenciaConteo,
  calcularStockDisponibleBase,
  construirIdStockProductoBaseAlmacen,
  construirIdMovimientoMermaInventario,
  convertirCantidadAUnidadBase,
  resolverPoliticaInventario,
  validarAjusteInventario,
  validarConteoInventario,
  validarConteoInventarioLinea,
  validarConversionInventario,
  validarMermaInventario,
  validarMovimientoInventario,
  validarPoliticaInventario,
  type ActorInventarioSnapshot,
  type AjusteInventario,
  type AsignacionRecepcionCompra,
  type ConteoInventario,
  type ConteoInventarioLinea,
  type ConversionUnidadInventarioSnapshot,
  type MermaInventario,
  type MovimientoInventario,
  type AlcancePoliticaInventario,
  type PoliticaInventario,
  type RecepcionMercaderiaItem,
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
  unidadBase: UnidadBaseInventario.KILOGRAMO,
  factorUnidadBase: 3,
  precisionCantidadBase: 3,
  versionConversion: 2,
  capturadaAt: ahora,
};
const conversionUnidad: ConversionUnidadInventarioSnapshot = {
  productoBaseId: "producto_arroz",
  unidadOperacion: UnidadBaseInventario.UNIDAD,
  unidadBase: UnidadBaseInventario.UNIDAD,
  factorUnidadBase: 1,
  precisionCantidadBase: 0,
  capturadaAt: ahora,
};

const buildPolitica = (
  id: string,
  alcance: AlcancePoliticaInventario,
  modo: ModoControlInventario,
): PoliticaInventario => ({
  id,
  type: POLITICA_INVENTARIO_TYPE,
  schemaVersion: INVENTORY_SCHEMA_VERSION,
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

const buildMovimiento = (): MovimientoInventario => ({
  id: "movimiento_001",
  type: MOVIMIENTO_INVENTARIO_TYPE,
  schemaVersion: INVENTORY_SCHEMA_VERSION,
  estado: "APLICADO",
  tipo: TipoMovimientoInventario.SALIDA,
  almacenId: "almacen_001",
  origen: {
    tipo: OrigenMovimientoInventario.VENTA,
    documentoId: "venta_001",
  },
  items: [{
    id: "linea_001",
    productoBaseId: "producto_arroz",
    almacenId: "almacen_001",
    cantidadOperacion: 2,
    conversionSnapshot: conversion,
    cantidadBaseDelta: -6,
    unidadBase: UnidadBaseInventario.KILOGRAMO,
  }],
  operationId: "operacion_001",
  idempotencyKey: "venta_001:inventario",
  correlationId: "venta_001",
  actor,
  fechaEfectiva: ahora,
  registradoAt: ahora,
});

test("el ledger usa un único tipo documental sin sufijo de implementación", () => {
  assert.equal(MOVIMIENTO_INVENTARIO_TYPE, "movimiento_inventario");
  assert.equal(MOVIMIENTO_INVENTARIO_V2_TYPE, MOVIMIENTO_INVENTARIO_TYPE);
  assert.equal(buildMovimiento().type, "movimiento_inventario");
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
    unidadOperacion: UnidadBaseInventario.KILOGRAMO,
    unidadBase: UnidadBaseInventario.KILOGRAMO,
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

test("solo un empaque de compra explícito convierte una bolsa en 90 unidades sin presentación", () => {
  const bolsa: ConversionUnidadInventarioSnapshot = {
    origenConversion: "EMPAQUE_COMPRA",
    productoBaseId: "3e19bc35-f8ec-43f3-970f-4360d819d7e7",
    unidadOperacion: "bolsa",
    unidadBase: UnidadBaseInventario.UNIDAD,
    factorUnidadBase: 90,
    precisionCantidadBase: 0,
    capturadaAt: ahora,
  };
  assert.equal(validarConversionInventario(bolsa).valido, true);
  assert.equal(convertirCantidadAUnidadBase(2, bolsa), 180);

  const sinOrigen = { ...bolsa, origenConversion: undefined } as unknown as ConversionUnidadInventarioSnapshot;
  assert.match(
    validarConversionInventario(sinOrigen).errores.join(" "),
    /captura directa en unidad base con factor 1/,
  );
  for (const [changes, message] of [
    [{ presentacionId: "catalogo-existente" }, /no admite presentacionId/],
    [{ versionConversion: 1 }, /no admite versionConversion/],
    [{ origenConversion: "DESCONOCIDA" }, /origenConversion es inválido/],
    [{ unidadOperacion: "" }, /unidadOperacion es requerida/],
    [{ factorUnidadBase: 0 }, /factorUnidadBase debe ser mayor a 0/],
  ] as const) {
    const invalida = { ...bolsa, ...changes } as unknown as ConversionUnidadInventarioSnapshot;
    assert.match(validarConversionInventario(invalida).errores.join(" "), message);
  }

  const movimiento = buildMovimiento();
  const entrada: MovimientoInventario = {
    ...movimiento,
    tipo: TipoMovimientoInventario.ENTRADA,
    origen: { tipo: OrigenMovimientoInventario.COMPRA, documentoId: "compra-opaca" },
    items: [{
      ...movimiento.items[0],
      productoBaseId: bolsa.productoBaseId,
      cantidadOperacion: 1,
      cantidadBaseDelta: 90,
      unidadBase: UnidadBaseInventario.UNIDAD,
      conversionSnapshot: bolsa,
    }],
  };
  assert.equal(validarMovimientoInventario(entrada).valido, true);
});

test("recepción y asignación identifican el empaque personalizado por línea de compra", () => {
  const legacy: RecepcionMercaderiaItem = {
    presentacionId: "presentacion-catalogo-opaca",
    cantidadRecibida: 1,
  };
  const personalizada: RecepcionMercaderiaItem = {
    tipoPresentacionCompra: "PERSONALIZADA",
    compraId: "compra-opaca",
    compraItemId: "linea-opaca",
    cantidadRecibida: 1,
  };
  const asignacion: AsignacionRecepcionCompra = {
    id: "asignacion-opaca",
    recepcionMercaderiaId: "recepcion-opaca",
    compraId: personalizada.compraId!,
    compraItemId: personalizada.compraItemId!,
    tipoPresentacionCompra: "PERSONALIZADA",
    cantidadAsignada: 1,
    createdAt: ahora,
    updatedAt: ahora,
  };
  assert.equal(legacy.presentacionId, "presentacion-catalogo-opaca");
  assert.equal(personalizada.presentacionId, undefined);
  assert.equal(asignacion.compraItemId, personalizada.compraItemId);
  assert.equal(asignacion.presentacionId, undefined);
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
  assert.deepEqual(resuelta.fuentesVersionadasAplicadas, politicas.map((politica) => ({
    politicaId: politica.id,
    version: politica.version,
  })));
});

test("stock mínimo solo admite alcance de producto y conserva la precedencia por almacén", () => {
  const scope = {
    empresaId: "empresa_001",
    productoBaseId: "producto_arroz",
  };
  const product = buildPolitica(
    "policy-product-opaque",
    { nivel: NivelPoliticaInventario.PRODUCTO, ...scope },
    ModoControlInventario.FLEXIBLE,
  );
  product.configuracion.stockMinimoBase = 10;
  const warehouse = buildPolitica(
    "policy-product-warehouse-opaque",
    {
      nivel: NivelPoliticaInventario.PRODUCTO_ALMACEN,
      ...scope,
      almacenId: "almacen_001",
    },
    ModoControlInventario.FLEXIBLE,
  );
  warehouse.configuracion.stockMinimoBase = 4.5;
  const company = buildPolitica(
    "policy-company-opaque",
    { nivel: NivelPoliticaInventario.EMPRESA, empresaId: "empresa_001" },
    ModoControlInventario.FLEXIBLE,
  );
  company.configuracion.stockMinimoBase = 2;

  assert.equal(validarPoliticaInventario(product).valido, true);
  assert.equal(validarPoliticaInventario(warehouse).valido, true);
  assert.match(
    validarPoliticaInventario(company).errores.join(" "),
    /stockMinimoBase requiere alcance de producto/,
  );
  assert.equal(
    resolverPoliticaInventario([product, warehouse], {
      ...scope,
      almacenId: "almacen_001",
    }).stockMinimoBase,
    4.5,
  );
  assert.equal(
    resolverPoliticaInventario([product, warehouse], {
      ...scope,
      almacenId: "almacen_002",
    }).stockMinimoBase,
    10,
  );
  assert.equal(
    validarPoliticaInventario({
      ...warehouse,
      configuracion: { ...warehouse.configuracion, stockMinimoBase: -1 },
    }).valido,
    false,
  );
});

test("movimiento aplicado exige idempotencia, conversión y signo coherente", () => {
  const movimiento = buildMovimiento();
  assert.equal(validarMovimientoInventario(movimiento).valido, true);
  const errores = validarMovimientoInventario({
    ...movimiento,
    idempotencyKey: "",
    items: [{ ...movimiento.items[0], cantidadBaseDelta: 6 }],
  }).errores.join(" ");
  assert.match(errores, /idempotencyKey/);
  assert.match(errores, /signo incompatible/);
});

test("validar movimientos no equipara una unidad entera con cero a precisión cero", () => {
  const movimiento = buildMovimiento();
  const linea = {
    ...movimiento.items[0],
    unidadBase: UnidadBaseInventario.UNIDAD,
    cantidadOperacion: 1,
    cantidadBaseDelta: -1,
    conversionSnapshot: conversionUnidad,
  };
  assert.equal(validarMovimientoInventario({ ...movimiento, items: [linea] }).valido, true);
  assert.match(
    validarMovimientoInventario({
      ...movimiento,
      items: [{ ...linea, cantidadBaseDelta: -2 }],
    }).errores.join(" "),
    /cantidadBaseDelta no coincide con la conversión/,
  );
});

test("movimiento físico no acepta una presentación sin versión de conversión", () => {
  const movimiento = buildMovimiento();
  const sinVersion: MovimientoInventario = {
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
    validarMovimientoInventario(sinVersion).errores.join(" "),
    /versionConversion.*requerida/,
  );

  const directoBase: MovimientoInventario = {
    ...movimiento,
    items: [{
      ...movimiento.items[0],
      cantidadOperacion: 6,
      cantidadBaseDelta: -6,
      conversionSnapshot: {
        productoBaseId: "producto_arroz",
        unidadOperacion: UnidadBaseInventario.KILOGRAMO,
        unidadBase: UnidadBaseInventario.KILOGRAMO,
        factorUnidadBase: 1,
        precisionCantidadBase: 3,
        capturadaAt: ahora,
      },
    }],
  };
  assert.equal(validarMovimientoInventario(directoBase).valido, true);
});

test("conteo guarda cabecera y líneas separadas con cero permitido", () => {
  const linea: ConteoInventarioLinea = {
    id: "conteo_001:producto_arroz",
    type: CONTEO_INVENTARIO_LINEA_TYPE,
    schemaVersion: INVENTORY_SCHEMA_VERSION,
    conteoId: "conteo_001",
    productoBaseId: "producto_arroz",
    almacenId: "almacen_001",
    unidadBase: UnidadBaseInventario.KILOGRAMO,
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
    schemaVersion: INVENTORY_SCHEMA_VERSION,
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
  const conEvidencia: ConteoInventarioLinea = {
    ...linea,
    estado: EstadoLineaConteoInventario.VALIDADA,
    revisadaPor: actor,
    revisadaAt: ahora,
    evaluacionAprobacion: {
      capturaId: "captura_001",
      versionProyeccionAlCorte: 1,
      evaluadaAt: ahora,
      politica: {
        toleranciaCantidadBase: 2,
        toleranciaPorcentaje: 0,
        requiereAprobacionAjuste: false,
      },
      fuentes: [{ politicaId: "politica_empresa", version: 1 }],
      diferenciaValorPEN: null,
      requiereAprobacion: true,
      motivos: ["QUANTITY_TOLERANCE"],
    },
  };
  assert.equal(validarConteoInventarioLinea(conEvidencia).valido, true);
  assert.match(
    validarConteoInventarioLinea({
      ...conEvidencia,
      evaluacionAprobacion: {
        ...conEvidencia.evaluacionAprobacion!,
        capturaId: "otra-captura",
      },
    }).errores.join(" "),
    /no corresponde al conteo vigente/,
  );
  const conteoUnidad: ConteoInventarioLinea = {
    ...linea,
    unidadBase: UnidadBaseInventario.UNIDAD,
    cantidadTeoricaBaseAlCorte: 1,
    capturas: [{ ...linea.capturas[0], conversionSnapshot: conversionUnidad }],
    cantidadContadaBase: 1,
    diferenciaBase: -1,
  };
  assert.match(
    validarConteoInventarioLinea(conteoUnidad).errores.join(" "),
    /cantidadContadaBase no coincide con la captura vigente/,
  );
});

test("ajuste y merma aplicados exigen su movimiento resultante", () => {
  const ajuste: AjusteInventario = {
    id: "ajuste_001",
    type: AJUSTE_INVENTARIO_TYPE,
    schemaVersion: INVENTORY_SCHEMA_VERSION,
    estado: EstadoAprobacionInventario.APLICADO,
    origen: OrigenAjusteInventario.CONTEO,
    empresaId: "empresa_001",
    almacenId: "almacen_001",
    conteoInventarioId: "conteo_001",
    lineas: [{
      id: "ajuste_linea_001", productoBaseId: "producto_arroz",
      almacenId: "almacen_001", unidadBase: UnidadBaseInventario.KILOGRAMO,
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
    schemaVersion: INVENTORY_SCHEMA_VERSION,
    estado: EstadoAprobacionInventario.APLICADO,
    empresaId: "empresa_001",
    almacenId: "almacen_001",
    lineas: [{
      id: "merma_linea_001", productoBaseId: "producto_arroz",
      almacenId: "almacen_001", unidadBase: UnidadBaseInventario.KILOGRAMO,
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
    movimientoInventarioId: construirIdMovimientoMermaInventario("merma_001"),
    createdAt: ahora,
    updatedAt: ahora + 3,
  };
  assert.equal(validarAjusteInventario(ajuste).valido, true);
  assert.equal(validarMermaInventario(merma).valido, true);
  assert.match(
    validarAjusteInventario({
      ...ajuste,
      lineas: [{
        ...ajuste.lineas[0],
        unidadBase: UnidadBaseInventario.UNIDAD,
        conversionSnapshot: conversionUnidad,
        cantidadTeoricaBase: 1,
        cantidadObjetivoBase: 0,
        cantidadBaseDelta: -2,
      }],
    }).errores.join(" "),
    /cantidadBaseDelta no concilia con el objetivo/,
  );
  assert.match(
    validarMermaInventario({
      ...merma,
      lineas: [{
        ...merma.lineas[0],
        unidadBase: UnidadBaseInventario.UNIDAD,
        conversionSnapshot: conversionUnidad,
        cantidadOperacion: 1,
        cantidadBase: 2,
      }],
    }).errores.join(" "),
    /cantidadBase no coincide con la conversión/,
  );
  assert.equal(
    validarMermaInventario({ ...merma, movimientoInventarioId: undefined }).valido,
    false,
  );
});
