import assert from "node:assert/strict";
import test from "node:test";

import type {
  ComandaRestaurante,
  ComandoRestaurante,
  CuentaConsumoRestaurante,
  MesaRestaurante,
  PedidoRestaurante,
  ProductoRestaurante,
  ResultadoComandoRestaurante,
  SesionServicioRestaurante,
  TareaPreparacionRestaurante,
} from "../contracts";
import {
  TIPO_DOCUMENTO_RESTAURANTE,
  MODO_OPERACION_ESTACION_RESTAURANTE,
  calcularTotalesCuentaRestaurante,
  crearClaveLineaPedidoRestaurante,
  crearFirmaConversionPedidoRestaurante,
  dineroRestaurante,
  evaluarConversionPedidoRestaurante,
  estadoInicialTareaPreparacionRestaurante,
  esTareaPreparacionTerminalRestaurante,
  evaluarAbandonoSesionRestaurante,
  evaluarCierreRestaurante,
  evaluarLiberacionMesaCompletadaRestaurante,
  puedeTransicionarCuentaRestaurante,
  puedeTransicionarSesionRestaurante,
  puedeTransicionarTareaPreparacionRestaurante,
  validarModificadoresRestaurante,
  validarProductoRestaurante,
} from "../index";

const audit = {
  schemaVersion: 1,
  localId: "local-001",
  version: 1,
  createdAt: 1000,
  updatedAt: 1000,
  createdBy: "user-001",
  updatedBy: "user-001",
  deviceId: "device-001",
};

test("type CouchDB coincide exactamente con la tabla SQLite", () => {
  assert.equal(TIPO_DOCUMENTO_RESTAURANTE.SALONES, "restaurant_salones");
  assert.equal(TIPO_DOCUMENTO_RESTAURANTE.COMANDAS, "restaurant_comandas");
  const session: SesionServicioRestaurante = {
    ...audit,
    id: "session-001",
    type: "restaurant_sesiones_servicio",
    canal: "SALON",
    estado: "ABIERTA",
    mesaId: "mesa-001",
    cantidadComensales: 4,
    responsableId: "user-001",
    pedidoId: "order-001",
    cuentaConsumoId: "account-001",
    abiertaAt: 1000,
  };
  assert.equal(session.type, "restaurant_sesiones_servicio");
});

test("producto exige ruteo operativo explicito", () => {
  const producto: ProductoRestaurante = {
    ...audit,
    id: "restaurant-product-001",
    type: "restaurant_productos",
    presentacionId: "presentation-001",
    rutasPreparacion: [
      { estacionPreparacionId: "kitchen", modo: "PREPARAR", orden: 1 },
    ],
    gruposModificadores: [],
    disponibilidad: "DISPONIBLE",
    orden: 1,
  };
  assert.equal(validarProductoRestaurante(producto).valid, true);
  assert.equal(
    validarProductoRestaurante({ ...producto, rutasPreparacion: [] }).valid,
    false,
  );
  assert.equal(estadoInicialTareaPreparacionRestaurante("PREPARAR"), "EN_COLA");
  assert.equal(
    estadoInicialTareaPreparacionRestaurante("DESPACHO_DIRECTO"),
    "LISTA",
  );
  assert.equal(
    estadoInicialTareaPreparacionRestaurante(
      "PREPARAR",
      MODO_OPERACION_ESTACION_RESTAURANTE.COMANDA_FISICA,
    ),
    "GESTION_EXTERNA",
  );
  assert.equal(
    esTareaPreparacionTerminalRestaurante({ estado: "GESTION_EXTERNA" }),
    false,
  );
});

test("cada configuracion especial genera identidad de linea diferente", () => {
  const common = {
    productoRestauranteId: "menu-ceviche",
    snapshot: {
      productoId: "product-ceviche",
      presentacionId: "presentation-ceviche",
      nombre: "Ceviche",
      precioBaseUnitario: dineroRestaurante(1000),
      impuestoUnitario: dineroRestaurante(180),
    },
    modificadores: [],
    rutasPreparacion: [
      { estacionPreparacionId: "kitchen", modo: "PREPARAR" as const, orden: 1 },
    ],
  };
  assert.notEqual(
    crearClaveLineaPedidoRestaurante({
      ...common,
      instrucciones: "con cebolla",
    }),
    crearClaveLineaPedidoRestaurante({
      ...common,
      instrucciones: "sin cebolla",
    }),
  );
});

test("conversion gastronómica distingue legacy, versión válida y metadata corrupta", () => {
  const baseSnapshot = {
    productoId: "product-beer",
    presentacionId: "presentation-beer",
    nombre: "Cerveza",
    unidadComercial: "botella",
    precioBaseUnitario: dineroRestaurante(1000),
    impuestoUnitario: dineroRestaurante(180),
  };
  assert.deepEqual(evaluarConversionPedidoRestaurante(baseSnapshot), {
    estado: "LEGACY_SIN_CONVERSION",
    valida: true,
    errores: [],
  });

  const versionedSnapshot = {
    ...baseSnapshot,
    conversionInventario: {
      productoBaseId: "product-beer",
      presentacionId: "presentation-beer",
      unidadOperacion: "botella",
      unidadBase: "litro" as const,
      factorUnidadBase: 0.33,
      precisionCantidadBase: 6,
      versionConversion: 2,
      capturadaAt: 2000,
    },
  };
  assert.equal(
    evaluarConversionPedidoRestaurante(versionedSnapshot).estado,
    "VERSIONADA",
  );
  assert.match(
    crearFirmaConversionPedidoRestaurante(versionedSnapshot),
    /product-beer:presentation-beer:botella:litro:0.33:6:2/,
  );

  const invalid = evaluarConversionPedidoRestaurante({
    ...versionedSnapshot,
    conversionInventario: {
      ...versionedSnapshot.conversionInventario,
      versionConversion: 0,
    },
  });
  assert.equal(invalid.estado, "INVALIDA");
  assert.equal(invalid.valida, false);
});

test("la clave de línea no mezcla legacy ni versiones de conversión distintas", () => {
  const common = {
    productoRestauranteId: "menu-beer",
    modificadores: [],
    rutasPreparacion: [
      { estacionPreparacionId: "bar", modo: "PREPARAR" as const, orden: 1 },
    ],
  };
  const legacySnapshot = {
    productoId: "product-beer",
    presentacionId: "presentation-beer",
    nombre: "Cerveza",
    unidadComercial: "botella",
    precioBaseUnitario: dineroRestaurante(1000),
    impuestoUnitario: dineroRestaurante(180),
  };
  const versionedSnapshot = {
    ...legacySnapshot,
    conversionInventario: {
      productoBaseId: "product-beer",
      presentacionId: "presentation-beer",
      unidadOperacion: "botella",
      unidadBase: "litro" as const,
      factorUnidadBase: 0.33,
      precisionCantidadBase: 6,
      versionConversion: 1,
      capturadaAt: 1000,
    },
  };
  const legacyKey = crearClaveLineaPedidoRestaurante({
    ...common,
    snapshot: legacySnapshot,
  });
  const versionOneKey = crearClaveLineaPedidoRestaurante({
    ...common,
    snapshot: versionedSnapshot,
  });
  const sameVersionLaterCaptureKey = crearClaveLineaPedidoRestaurante({
    ...common,
    snapshot: {
      ...versionedSnapshot,
      conversionInventario: {
        ...versionedSnapshot.conversionInventario,
        capturadaAt: 3000,
      },
    },
  });
  const versionTwoKey = crearClaveLineaPedidoRestaurante({
    ...common,
    snapshot: {
      ...versionedSnapshot,
      conversionInventario: {
        ...versionedSnapshot.conversionInventario,
        versionConversion: 2,
      },
    },
  });
  assert.notEqual(legacyKey, versionOneKey);
  assert.equal(versionOneKey, sameVersionLaterCaptureKey);
  assert.notEqual(versionOneKey, versionTwoKey);
});

test("comando canonico exige idempotencia y version esperada", () => {
  const command: ComandoRestaurante = {
    nombre: "ADD_ORDER_LINE",
    aggregateId: "order-001",
    expectedVersion: 3,
    trace: {
      operationId: "operation-001",
      correlationId: "session-001",
      actorId: "user-001",
      deviceId: "device-001",
      occurredAt: 1000,
    },
    payload: {
      lineId: "line-001",
      productoRestauranteId: "restaurant-product-001",
      cantidad: 1,
      modificadores: [],
    },
  };
  const result: ResultadoComandoRestaurante = {
    estado: "APLICADO",
    operationId: command.trace.operationId,
    aggregateId: command.aggregateId,
    version: 4,
  };
  assert.equal(result.estado, "APLICADO");
});

test("abandono de mesa tiene comando durable y versiones de todos los agregados", () => {
  const command: ComandoRestaurante = {
    nombre: "ABANDON_SERVICE_SESSION",
    aggregateId: "session-001",
    expectedVersion: 2,
    trace: {
      operationId: "operation-abandon-001",
      correlationId: "session-001",
      actorId: "user-001",
      deviceId: "device-001",
      occurredAt: 1000,
    },
    payload: {
      mesaId: "table-001",
      expectedMesaVersion: 3,
      pedidoId: "order-001",
      expectedPedidoVersion: 4,
      cuentaConsumoId: "account-001",
      expectedCuentaVersion: 1,
      motivo: "CLIENTE_SE_RETIRA",
    },
  };
  assert.equal(command.nombre, "ABANDON_SERVICE_SESSION");
});

test("reparacion de ocupacion cerrada conserva versiones de todos los agregados", () => {
  const command: ComandoRestaurante = {
    nombre: "RELEASE_COMPLETED_TABLE",
    aggregateId: "session-closed",
    expectedVersion: 4,
    trace: {
      operationId: "operation-release-001",
      correlationId: "session-closed",
      actorId: "user-001",
      deviceId: "device-001",
      occurredAt: 1000,
    },
    payload: {
      mesaId: "table-001",
      expectedMesaVersion: 5,
      sesionServicioId: "session-closed",
      expectedSessionVersion: 4,
      pedidoId: "order-001",
      expectedPedidoVersion: 6,
      cuentaConsumoId: "account-001",
      expectedAccountVersion: 5,
    },
  };
  assert.equal(command.nombre, "RELEASE_COMPLETED_TABLE");
});

test("permite abandonar una mesa vacia y bloquea consumo enviado", () => {
  const sesion: SesionServicioRestaurante = {
    ...audit,
    id: "session-empty",
    type: "restaurant_sesiones_servicio",
    canal: "SALON",
    estado: "ABIERTA",
    mesaId: "table-001",
    cantidadComensales: 2,
    responsableId: "user-001",
    pedidoId: "order-empty",
    cuentaConsumoId: "account-empty",
    abiertaAt: 1000,
  };
  const pedido: PedidoRestaurante = {
    ...audit,
    id: "order-empty",
    type: "restaurant_pedidos",
    sesionServicioId: sesion.id,
    estado: "BORRADOR",
    numeroRondaActual: 0,
    lineas: [],
  };
  const zero = dineroRestaurante(0);
  const cuenta: CuentaConsumoRestaurante = {
    ...audit,
    id: "account-empty",
    type: "restaurant_cuentas_consumo",
    sesionServicioId: sesion.id,
    estado: "ABIERTA",
    cargos: [],
    asignacionesPagoIds: [],
    totales: {
      subtotal: zero,
      descuento: zero,
      impuesto: zero,
      servicio: zero,
      propina: zero,
      redondeo: zero,
      total: zero,
      pagado: zero,
      saldo: zero,
    },
    ventaIds: [],
  };

  assert.deepEqual(
    evaluarAbandonoSesionRestaurante({
      sesion,
      pedido,
      cuenta,
      comandas: [],
      tareas: [],
    }),
    { permitido: true, lineasPendientes: 0 },
  );

  const blocked = evaluarAbandonoSesionRestaurante({
    sesion,
    pedido: {
      ...pedido,
      lineas: [
        {
          id: "line-sent",
          productoRestauranteId: "menu-001",
          snapshot: {
            productoId: "product-001",
            presentacionId: "presentation-001",
            nombre: "Ceviche",
            precioBaseUnitario: dineroRestaurante(2000),
            impuestoUnitario: dineroRestaurante(0),
          },
          cantidad: 1,
          cantidadEnviada: 1,
          modificadores: [],
          rutasPreparacion: [],
          totalLinea: dineroRestaurante(2000),
          creadaAt: 1000,
          creadaPor: "user-001",
        },
      ],
    },
    cuenta,
    comandas: [],
    tareas: [],
  });
  assert.equal(blocked.permitido, false);
  if (!blocked.permitido) assert.equal(blocked.motivo, "LINEAS_ENVIADAS");
});

test("maquinas de estado bloquean regresiones", () => {
  assert.equal(
    puedeTransicionarSesionRestaurante("ABIERTA", "EN_ATENCION"),
    true,
  );
  assert.equal(
    puedeTransicionarSesionRestaurante("CERRADA", "EN_ATENCION"),
    false,
  );
  assert.equal(
    puedeTransicionarTareaPreparacionRestaurante("EN_PREPARACION", "LISTA"),
    true,
  );
  assert.equal(
    puedeTransicionarTareaPreparacionRestaurante("ENTREGADA", "EN_PREPARACION"),
    false,
  );
  assert.equal(
    puedeTransicionarTareaPreparacionRestaurante(
      "GESTION_EXTERNA",
      "EN_PREPARACION",
    ),
    false,
  );
  assert.equal(
    puedeTransicionarTareaPreparacionRestaurante(
      "GESTION_EXTERNA",
      "ENTREGADA",
    ),
    true,
  );
  assert.equal(puedeTransicionarCuentaRestaurante("SALDADA", "CERRADA"), true);
  assert.equal(puedeTransicionarCuentaRestaurante("ABIERTA", "CERRADA"), false);
});

test("cuenta usa unidades minimas y rechaza sobrepago", () => {
  const charge = {
    id: "charge-001",
    pedidoId: "order-001",
    pedidoLineaId: "line-001",
    nombre: "Ceviche",
    cantidad: 1,
    subtotal: dineroRestaurante(2000),
    descuento: dineroRestaurante(0),
    impuesto: dineroRestaurante(360),
    total: dineroRestaurante(2360),
    createdAt: 1000,
  };
  const totals = calcularTotalesCuentaRestaurante({
    currency: "PEN",
    cargos: [charge],
    servicio: dineroRestaurante(100),
    propina: dineroRestaurante(200),
    pagos: [dineroRestaurante(1000)],
  });
  assert.equal(totals.total.minorUnits, 2660);
  assert.equal(totals.saldo.minorUnits, 1660);
  assert.throws(
    () =>
      calcularTotalesCuentaRestaurante({
        currency: "PEN",
        cargos: [],
        pagos: [dineroRestaurante(1)],
      }),
    /no pueden exceder/,
  );
});

test("modificadores validan minimos, maximos y repeticion", () => {
  const groups = [
    {
      id: "coccion",
      nombre: "Termino",
      minimoSelecciones: 1,
      maximoSelecciones: 1,
      permiteRepeticion: false,
      orden: 1,
      opciones: [
        {
          id: "medio",
          nombre: "Medio",
          precioExtra: dineroRestaurante(0),
          activa: true,
          predeterminada: false,
          orden: 1,
        },
      ],
    },
  ];
  assert.equal(validarModificadoresRestaurante(groups, []).valid, false);
  assert.equal(
    validarModificadoresRestaurante(groups, [
      {
        grupoId: "coccion",
        opcionId: "medio",
        grupoNombre: "Termino",
        opcionNombre: "Medio",
        cantidad: 1,
        precioExtraUnitario: dineroRestaurante(0),
      },
    ]).valid,
    true,
  );
});

test("pagar no libera una mesa con preparacion pendiente", () => {
  const pedido: PedidoRestaurante = {
    ...audit,
    id: "order-001",
    type: "restaurant_pedidos",
    sesionServicioId: "session-001",
    estado: "ENVIADO",
    numeroRondaActual: 1,
    lineas: [
      {
        id: "line-001",
        productoRestauranteId: "menu-001",
        snapshot: {
          productoId: "product-001",
          presentacionId: "presentation-001",
          nombre: "Ceviche",
          precioBaseUnitario: dineroRestaurante(2000),
          impuestoUnitario: dineroRestaurante(0),
        },
        cantidad: 1,
        cantidadEnviada: 1,
        modificadores: [],
        rutasPreparacion: [
          { estacionPreparacionId: "kitchen", modo: "PREPARAR", orden: 1 },
        ],
        totalLinea: dineroRestaurante(2000),
        creadaAt: 1000,
        creadaPor: "user-001",
      },
    ],
  };
  const cuenta: CuentaConsumoRestaurante = {
    ...audit,
    id: "account-001",
    type: "restaurant_cuentas_consumo",
    sesionServicioId: "session-001",
    estado: "SALDADA",
    cargos: [
      {
        id: "charge-001",
        pedidoId: pedido.id,
        pedidoLineaId: "line-001",
        nombre: "Ceviche",
        cantidad: 1,
        subtotal: dineroRestaurante(2000),
        descuento: dineroRestaurante(0),
        impuesto: dineroRestaurante(0),
        total: dineroRestaurante(2000),
        createdAt: 1000,
      },
    ],
    asignacionesPagoIds: ["allocation-001"],
    totales: calcularTotalesCuentaRestaurante({
      currency: "PEN",
      cargos: [
        {
          id: "charge-001",
          pedidoId: pedido.id,
          pedidoLineaId: "line-001",
          nombre: "Ceviche",
          cantidad: 1,
          subtotal: dineroRestaurante(2000),
          descuento: dineroRestaurante(0),
          impuesto: dineroRestaurante(0),
          total: dineroRestaurante(2000),
          createdAt: 1000,
        },
      ],
      pagos: [dineroRestaurante(2000)],
    }),
    ventaIds: ["sale-001"],
  };
  const comanda: ComandaRestaurante = {
    ...audit,
    id: "dispatch-001",
    type: "restaurant_comandas",
    pedidoId: pedido.id,
    sesionServicioId: "session-001",
    secuencia: 1,
    ronda: 1,
    tipoEnvio: "ENVIO",
    lineas: [
      {
        id: "dispatch-line-001",
        pedidoLineaId: "line-001",
        estacionPreparacionId: "kitchen",
        modoPreparacion: "PREPARAR",
        cantidad: 1,
        nombre: "Ceviche",
        modificadores: [],
      },
    ],
    trace: {
      operationId: "op-001",
      correlationId: "session-001",
      actorId: "user-001",
      deviceId: "device-001",
      occurredAt: 1000,
    },
  };
  const task: TareaPreparacionRestaurante = {
    ...audit,
    id: "task-001",
    type: "restaurant_tareas_preparacion",
    comandaId: comanda.id,
    comandaItemId: comanda.lineas[0].id,
    pedidoId: pedido.id,
    pedidoLineaId: "line-001",
    sesionServicioId: "session-001",
    estacionPreparacionId: "kitchen",
    modoPreparacion: "PREPARAR",
    estado: "EN_PREPARACION",
    cantidad: 1,
    prioridad: 0,
  };
  const blocked = evaluarCierreRestaurante({
    pedido,
    cuenta,
    comandas: [comanda],
    tareas: [task],
  });
  assert.deepEqual(blocked, {
    permitido: false,
    motivo: "PREPARACION_O_ENTREGA_PENDIENTE",
    message: "Aun hay productos en preparacion o pendientes de entrega.",
  });
  assert.equal(
    evaluarCierreRestaurante({
      pedido,
      cuenta,
      comandas: [comanda],
      tareas: [
        {
          ...task,
          modoOperacionEstacion:
            MODO_OPERACION_ESTACION_RESTAURANTE.COMANDA_FISICA,
          estado: "GESTION_EXTERNA",
        },
      ],
    }).permitido,
    false,
  );
  assert.equal(
    evaluarCierreRestaurante({
      pedido,
      cuenta,
      comandas: [comanda],
      tareas: [{ ...task, estado: "ENTREGADA" }],
    }).permitido,
    true,
  );

  const sesionCerrada: SesionServicioRestaurante = {
    ...audit,
    id: "session-001",
    type: "restaurant_sesiones_servicio",
    canal: "SALON",
    estado: "CERRADA",
    mesaId: "table-001",
    cantidadComensales: 5,
    responsableId: "user-001",
    pedidoId: pedido.id,
    cuentaConsumoId: cuenta.id,
    abiertaAt: 1000,
    cerradaAt: 2000,
  };
  const mesaVinculada: MesaRestaurante = {
    ...audit,
    id: "table-001",
    type: "restaurant_mesas",
    salonId: "floor-001",
    codigo: "M03",
    nombre: "Mesa 03",
    capacidad: 5,
    estadoOperativo: "ACTIVO",
    sesionActivaId: sesionCerrada.id,
  };
  assert.equal(
    evaluarLiberacionMesaCompletadaRestaurante({
      mesa: mesaVinculada,
      sesion: sesionCerrada,
      pedido: { ...pedido, estado: "COMPLETADO" },
      cuenta: { ...cuenta, estado: "CERRADA", cerradaAt: 2000 },
      comandas: [comanda],
      tareas: [{ ...task, estado: "ENTREGADA" }],
    }).permitido,
    true,
  );
});
