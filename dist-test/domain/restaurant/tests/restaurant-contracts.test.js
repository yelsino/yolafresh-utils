"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const index_1 = require("../index");
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
(0, node_test_1.default)("type CouchDB coincide exactamente con la tabla SQLite", () => {
    strict_1.default.equal(index_1.TIPO_DOCUMENTO_RESTAURANTE.SALONES, "restaurant_salones");
    strict_1.default.equal(index_1.TIPO_DOCUMENTO_RESTAURANTE.COMANDAS, "restaurant_comandas");
    const session = {
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
    strict_1.default.equal(session.type, "restaurant_sesiones_servicio");
});
(0, node_test_1.default)("producto exige ruteo operativo explicito", () => {
    const producto = {
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
    strict_1.default.equal((0, index_1.validarProductoRestaurante)(producto).valid, true);
    strict_1.default.equal((0, index_1.validarProductoRestaurante)({ ...producto, rutasPreparacion: [] }).valid, false);
    strict_1.default.equal((0, index_1.estadoInicialTareaPreparacionRestaurante)("PREPARAR"), "EN_COLA");
    strict_1.default.equal((0, index_1.estadoInicialTareaPreparacionRestaurante)("DESPACHO_DIRECTO"), "LISTA");
    strict_1.default.equal((0, index_1.estadoInicialTareaPreparacionRestaurante)("PREPARAR", index_1.MODO_OPERACION_ESTACION_RESTAURANTE.COMANDA_FISICA), "GESTION_EXTERNA");
    strict_1.default.equal((0, index_1.esTareaPreparacionTerminalRestaurante)({ estado: "GESTION_EXTERNA" }), false);
});
(0, node_test_1.default)("cada configuracion especial genera identidad de linea diferente", () => {
    const common = {
        productoRestauranteId: "menu-ceviche",
        snapshot: {
            productoId: "product-ceviche",
            presentacionId: "presentation-ceviche",
            nombre: "Ceviche",
            precioBaseUnitario: (0, index_1.dineroRestaurante)(1000),
            impuestoUnitario: (0, index_1.dineroRestaurante)(180),
        },
        modificadores: [],
        rutasPreparacion: [
            { estacionPreparacionId: "kitchen", modo: "PREPARAR", orden: 1 },
        ],
    };
    strict_1.default.notEqual((0, index_1.crearClaveLineaPedidoRestaurante)({
        ...common,
        instrucciones: "con cebolla",
    }), (0, index_1.crearClaveLineaPedidoRestaurante)({
        ...common,
        instrucciones: "sin cebolla",
    }));
});
(0, node_test_1.default)("conversion gastronómica distingue legacy, versión válida y metadata corrupta", () => {
    const baseSnapshot = {
        productoId: "product-beer",
        presentacionId: "presentation-beer",
        nombre: "Cerveza",
        unidadComercial: "botella",
        precioBaseUnitario: (0, index_1.dineroRestaurante)(1000),
        impuestoUnitario: (0, index_1.dineroRestaurante)(180),
    };
    strict_1.default.deepEqual((0, index_1.evaluarConversionPedidoRestaurante)(baseSnapshot), {
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
            unidadBase: "litro",
            factorUnidadBase: 0.33,
            precisionCantidadBase: 6,
            versionConversion: 2,
            capturadaAt: 2000,
        },
    };
    strict_1.default.equal((0, index_1.evaluarConversionPedidoRestaurante)(versionedSnapshot).estado, "VERSIONADA");
    strict_1.default.match((0, index_1.crearFirmaConversionPedidoRestaurante)(versionedSnapshot), /product-beer:presentation-beer:botella:litro:0.33:6:2/);
    const invalid = (0, index_1.evaluarConversionPedidoRestaurante)({
        ...versionedSnapshot,
        conversionInventario: {
            ...versionedSnapshot.conversionInventario,
            versionConversion: 0,
        },
    });
    strict_1.default.equal(invalid.estado, "INVALIDA");
    strict_1.default.equal(invalid.valida, false);
});
(0, node_test_1.default)("la clave de línea no mezcla legacy ni versiones de conversión distintas", () => {
    const common = {
        productoRestauranteId: "menu-beer",
        modificadores: [],
        rutasPreparacion: [
            { estacionPreparacionId: "bar", modo: "PREPARAR", orden: 1 },
        ],
    };
    const legacySnapshot = {
        productoId: "product-beer",
        presentacionId: "presentation-beer",
        nombre: "Cerveza",
        unidadComercial: "botella",
        precioBaseUnitario: (0, index_1.dineroRestaurante)(1000),
        impuestoUnitario: (0, index_1.dineroRestaurante)(180),
    };
    const versionedSnapshot = {
        ...legacySnapshot,
        conversionInventario: {
            productoBaseId: "product-beer",
            presentacionId: "presentation-beer",
            unidadOperacion: "botella",
            unidadBase: "litro",
            factorUnidadBase: 0.33,
            precisionCantidadBase: 6,
            versionConversion: 1,
            capturadaAt: 1000,
        },
    };
    const legacyKey = (0, index_1.crearClaveLineaPedidoRestaurante)({
        ...common,
        snapshot: legacySnapshot,
    });
    const versionOneKey = (0, index_1.crearClaveLineaPedidoRestaurante)({
        ...common,
        snapshot: versionedSnapshot,
    });
    const sameVersionLaterCaptureKey = (0, index_1.crearClaveLineaPedidoRestaurante)({
        ...common,
        snapshot: {
            ...versionedSnapshot,
            conversionInventario: {
                ...versionedSnapshot.conversionInventario,
                capturadaAt: 3000,
            },
        },
    });
    const versionTwoKey = (0, index_1.crearClaveLineaPedidoRestaurante)({
        ...common,
        snapshot: {
            ...versionedSnapshot,
            conversionInventario: {
                ...versionedSnapshot.conversionInventario,
                versionConversion: 2,
            },
        },
    });
    strict_1.default.notEqual(legacyKey, versionOneKey);
    strict_1.default.equal(versionOneKey, sameVersionLaterCaptureKey);
    strict_1.default.notEqual(versionOneKey, versionTwoKey);
});
(0, node_test_1.default)("comando canonico exige idempotencia y version esperada", () => {
    const command = {
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
    const result = {
        estado: "APLICADO",
        operationId: command.trace.operationId,
        aggregateId: command.aggregateId,
        version: 4,
    };
    strict_1.default.equal(result.estado, "APLICADO");
});
(0, node_test_1.default)("abandono de mesa tiene comando durable y versiones de todos los agregados", () => {
    const command = {
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
    strict_1.default.equal(command.nombre, "ABANDON_SERVICE_SESSION");
});
(0, node_test_1.default)("reparacion de ocupacion cerrada conserva versiones de todos los agregados", () => {
    const command = {
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
    strict_1.default.equal(command.nombre, "RELEASE_COMPLETED_TABLE");
});
(0, node_test_1.default)("permite abandonar una mesa vacia y bloquea consumo enviado", () => {
    const sesion = {
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
    const pedido = {
        ...audit,
        id: "order-empty",
        type: "restaurant_pedidos",
        sesionServicioId: sesion.id,
        estado: "BORRADOR",
        numeroRondaActual: 0,
        lineas: [],
    };
    const zero = (0, index_1.dineroRestaurante)(0);
    const cuenta = {
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
    strict_1.default.deepEqual((0, index_1.evaluarAbandonoSesionRestaurante)({
        sesion,
        pedido,
        cuenta,
        comandas: [],
        tareas: [],
    }), { permitido: true, lineasPendientes: 0 });
    const blocked = (0, index_1.evaluarAbandonoSesionRestaurante)({
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
                        precioBaseUnitario: (0, index_1.dineroRestaurante)(2000),
                        impuestoUnitario: (0, index_1.dineroRestaurante)(0),
                    },
                    cantidad: 1,
                    cantidadEnviada: 1,
                    modificadores: [],
                    rutasPreparacion: [],
                    totalLinea: (0, index_1.dineroRestaurante)(2000),
                    creadaAt: 1000,
                    creadaPor: "user-001",
                },
            ],
        },
        cuenta,
        comandas: [],
        tareas: [],
    });
    strict_1.default.equal(blocked.permitido, false);
    if (!blocked.permitido)
        strict_1.default.equal(blocked.motivo, "LINEAS_ENVIADAS");
});
(0, node_test_1.default)("maquinas de estado bloquean regresiones", () => {
    strict_1.default.equal((0, index_1.puedeTransicionarSesionRestaurante)("ABIERTA", "EN_ATENCION"), true);
    strict_1.default.equal((0, index_1.puedeTransicionarSesionRestaurante)("CERRADA", "EN_ATENCION"), false);
    strict_1.default.equal((0, index_1.puedeTransicionarTareaPreparacionRestaurante)("EN_PREPARACION", "LISTA"), true);
    strict_1.default.equal((0, index_1.puedeTransicionarTareaPreparacionRestaurante)("ENTREGADA", "EN_PREPARACION"), false);
    strict_1.default.equal((0, index_1.puedeTransicionarTareaPreparacionRestaurante)("GESTION_EXTERNA", "EN_PREPARACION"), false);
    strict_1.default.equal((0, index_1.puedeTransicionarTareaPreparacionRestaurante)("GESTION_EXTERNA", "ENTREGADA"), true);
    strict_1.default.equal((0, index_1.puedeTransicionarCuentaRestaurante)("SALDADA", "CERRADA"), true);
    strict_1.default.equal((0, index_1.puedeTransicionarCuentaRestaurante)("ABIERTA", "CERRADA"), false);
});
(0, node_test_1.default)("cuenta usa unidades minimas y rechaza sobrepago", () => {
    const charge = {
        id: "charge-001",
        pedidoId: "order-001",
        pedidoLineaId: "line-001",
        nombre: "Ceviche",
        cantidad: 1,
        subtotal: (0, index_1.dineroRestaurante)(2000),
        descuento: (0, index_1.dineroRestaurante)(0),
        impuesto: (0, index_1.dineroRestaurante)(360),
        total: (0, index_1.dineroRestaurante)(2360),
        createdAt: 1000,
    };
    const totals = (0, index_1.calcularTotalesCuentaRestaurante)({
        currency: "PEN",
        cargos: [charge],
        servicio: (0, index_1.dineroRestaurante)(100),
        propina: (0, index_1.dineroRestaurante)(200),
        pagos: [(0, index_1.dineroRestaurante)(1000)],
    });
    strict_1.default.equal(totals.total.minorUnits, 2660);
    strict_1.default.equal(totals.saldo.minorUnits, 1660);
    strict_1.default.throws(() => (0, index_1.calcularTotalesCuentaRestaurante)({
        currency: "PEN",
        cargos: [],
        pagos: [(0, index_1.dineroRestaurante)(1)],
    }), /no pueden exceder/);
});
(0, node_test_1.default)("modificadores validan minimos, maximos y repeticion", () => {
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
                    precioExtra: (0, index_1.dineroRestaurante)(0),
                    activa: true,
                    predeterminada: false,
                    orden: 1,
                },
            ],
        },
    ];
    strict_1.default.equal((0, index_1.validarModificadoresRestaurante)(groups, []).valid, false);
    strict_1.default.equal((0, index_1.validarModificadoresRestaurante)(groups, [
        {
            grupoId: "coccion",
            opcionId: "medio",
            grupoNombre: "Termino",
            opcionNombre: "Medio",
            cantidad: 1,
            precioExtraUnitario: (0, index_1.dineroRestaurante)(0),
        },
    ]).valid, true);
});
(0, node_test_1.default)("pagar no libera una mesa con preparacion pendiente", () => {
    const pedido = {
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
                    precioBaseUnitario: (0, index_1.dineroRestaurante)(2000),
                    impuestoUnitario: (0, index_1.dineroRestaurante)(0),
                },
                cantidad: 1,
                cantidadEnviada: 1,
                modificadores: [],
                rutasPreparacion: [
                    { estacionPreparacionId: "kitchen", modo: "PREPARAR", orden: 1 },
                ],
                totalLinea: (0, index_1.dineroRestaurante)(2000),
                creadaAt: 1000,
                creadaPor: "user-001",
            },
        ],
    };
    const cuenta = {
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
                subtotal: (0, index_1.dineroRestaurante)(2000),
                descuento: (0, index_1.dineroRestaurante)(0),
                impuesto: (0, index_1.dineroRestaurante)(0),
                total: (0, index_1.dineroRestaurante)(2000),
                createdAt: 1000,
            },
        ],
        asignacionesPagoIds: ["allocation-001"],
        totales: (0, index_1.calcularTotalesCuentaRestaurante)({
            currency: "PEN",
            cargos: [
                {
                    id: "charge-001",
                    pedidoId: pedido.id,
                    pedidoLineaId: "line-001",
                    nombre: "Ceviche",
                    cantidad: 1,
                    subtotal: (0, index_1.dineroRestaurante)(2000),
                    descuento: (0, index_1.dineroRestaurante)(0),
                    impuesto: (0, index_1.dineroRestaurante)(0),
                    total: (0, index_1.dineroRestaurante)(2000),
                    createdAt: 1000,
                },
            ],
            pagos: [(0, index_1.dineroRestaurante)(2000)],
        }),
        ventaIds: ["sale-001"],
    };
    const comanda = {
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
    const task = {
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
    const blocked = (0, index_1.evaluarCierreRestaurante)({
        pedido,
        cuenta,
        comandas: [comanda],
        tareas: [task],
    });
    strict_1.default.deepEqual(blocked, {
        permitido: false,
        motivo: "PREPARACION_O_ENTREGA_PENDIENTE",
        message: "Aun hay productos en preparacion o pendientes de entrega.",
    });
    strict_1.default.equal((0, index_1.evaluarCierreRestaurante)({
        pedido,
        cuenta,
        comandas: [comanda],
        tareas: [
            {
                ...task,
                modoOperacionEstacion: index_1.MODO_OPERACION_ESTACION_RESTAURANTE.COMANDA_FISICA,
                estado: "GESTION_EXTERNA",
            },
        ],
    }).permitido, false);
    strict_1.default.equal((0, index_1.evaluarCierreRestaurante)({
        pedido,
        cuenta,
        comandas: [comanda],
        tareas: [{ ...task, estado: "ENTREGADA" }],
    }).permitido, true);
    const sesionCerrada = {
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
    const mesaVinculada = {
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
    strict_1.default.equal((0, index_1.evaluarLiberacionMesaCompletadaRestaurante)({
        mesa: mesaVinculada,
        sesion: sesionCerrada,
        pedido: { ...pedido, estado: "COMPLETADO" },
        cuenta: { ...cuenta, estado: "CERRADA", cerradaAt: 2000 },
        comandas: [comanda],
        tareas: [{ ...task, estado: "ENTREGADA" }],
    }).permitido, true);
});
