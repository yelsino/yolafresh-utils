"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const node_test_1 = __importDefault(require("node:test"));
const cuenta_cliente_contract_1 = require("../contracts/cuenta-cliente.contract");
(0, node_test_1.default)("agrega imputaciones de varias fuentes contra el mismo credito destino", () => {
    const evidencia = [
        { movimientoDestinoId: " deuda / opaca ", montoAplicadoEsperado: 55.85 },
        { movimientoDestinoId: "otra-deuda-opaca", montoAplicadoEsperado: 10 },
        { movimientoDestinoId: " deuda / opaca ", montoAplicadoEsperado: 344.85 },
        { movimientoDestinoId: "otra-deuda-opaca", montoAplicadoEsperado: 5.05 },
    ];
    strict_1.default.deepEqual((0, cuenta_cliente_contract_1.agruparEvidenciaCreditosEjecucionCobroCliente)(evidencia), [
        { movimientoDestinoId: " deuda / opaca ", montoAplicadoEsperado: 400.7 },
        { movimientoDestinoId: "otra-deuda-opaca", montoAplicadoEsperado: 15.05 },
    ]);
    strict_1.default.equal((0, cuenta_cliente_contract_1.coincidenCreditosPlanConEvidenciaEjecucionCobroCliente)([
        {
            movimientoDestinoId: "otra-deuda-opaca",
            montoAplicadoEsperado: 15.05,
        },
        {
            movimientoDestinoId: " deuda / opaca ",
            montoAplicadoEsperado: 400.7,
        },
    ], evidencia), true);
});
(0, node_test_1.default)("falla cerrado ante montos distintos o destinos duplicados en el plan", () => {
    strict_1.default.equal((0, cuenta_cliente_contract_1.coincidenCreditosPlanConEvidenciaEjecucionCobroCliente)([{ movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 10 }], [
        { movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 4 },
        { movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 5.99 },
    ]), false);
    strict_1.default.equal((0, cuenta_cliente_contract_1.coincidenCreditosPlanConEvidenciaEjecucionCobroCliente)([
        { movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 4 },
        { movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 6 },
    ], [{ movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 10 }]), false);
});
(0, node_test_1.default)("canonicaliza planHash igual con orden permutado, centimos e IDs opacos Unicode", () => {
    var _a, _b, _c;
    const plan = {
        montoAplicadoEsperado: 36.300000000000004,
        componentes: [
            {
                tipo: "DINERO_NUEVO",
                claveIdempotencia: "cash\tα",
                montoAplicadoEsperado: 6.000000000000001,
                montoRecibidoEsperado: 6,
                metodoPago: "EFECTIVO",
                creditos: [{ movimientoDestinoId: "β", montoAplicadoEsperado: 6 }],
            },
            {
                tipo: "DINERO_NUEVO",
                claveIdempotencia: " zeta Ω ",
                montoAplicadoEsperado: 20.2,
                montoRecibidoEsperado: 25,
                metodoPago: "DIGITAL",
                creditos: [
                    {
                        movimientoDestinoId: "crédito 😀 ",
                        montoAplicadoEsperado: 12.1,
                    },
                    { movimientoDestinoId: "A ", montoAplicadoEsperado: 8.1 },
                ],
            },
            {
                tipo: "SALDO_FAVOR",
                claveIdempotencia: " saldo β ",
                montoAplicadoEsperado: 10.1,
                creditos: [
                    { movimientoDestinoId: "ñ opaque", montoAplicadoEsperado: 5.05 },
                    { movimientoDestinoId: " 0", montoAplicadoEsperado: 5.05 },
                ],
            },
        ],
    };
    const permutado = {
        montoAplicadoEsperado: 36.3,
        componentes: [...plan.componentes].reverse().map((componente) => ({
            ...componente,
            creditos: [...componente.creditos].reverse(),
        })),
    };
    const canonical = (0, cuenta_cliente_contract_1.serializarPlanEjecucionCobroClienteCanonico)(plan);
    const canonicalPermutado = (0, cuenta_cliente_contract_1.serializarPlanEjecucionCobroClienteCanonico)(permutado);
    const normalized = (0, cuenta_cliente_contract_1.canonicalizarPlanEjecucionCobroCliente)(plan);
    strict_1.default.equal(cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_PLAN_CANONICALIZATION_VERSION, 1);
    strict_1.default.equal(canonicalPermutado, canonical);
    strict_1.default.equal(normalized.montoAplicadoEsperado, 36.3);
    strict_1.default.equal((_a = normalized.componentes[0]) === null || _a === void 0 ? void 0 : _a.claveIdempotencia, " saldo β ");
    strict_1.default.equal((_b = normalized.componentes[1]) === null || _b === void 0 ? void 0 : _b.claveIdempotencia, " zeta Ω ");
    strict_1.default.equal((_c = normalized.componentes[2]) === null || _c === void 0 ? void 0 : _c.claveIdempotencia, "cash\tα");
    strict_1.default.equal(canonical, '{"componentes":[{"claveIdempotencia":" saldo β ","creditos":[{"montoAplicadoEsperado":5.05,"movimientoDestinoId":" 0"},{"montoAplicadoEsperado":5.05,"movimientoDestinoId":"ñ opaque"}],"montoAplicadoEsperado":10.1,"tipo":"SALDO_FAVOR"},{"claveIdempotencia":" zeta Ω ","creditos":[{"montoAplicadoEsperado":8.1,"movimientoDestinoId":"A "},{"montoAplicadoEsperado":12.1,"movimientoDestinoId":"crédito 😀 "}],"metodoPago":"DIGITAL","montoAplicadoEsperado":20.2,"montoRecibidoEsperado":25,"tipo":"DINERO_NUEVO"},{"claveIdempotencia":"cash\\tα","creditos":[{"montoAplicadoEsperado":6,"movimientoDestinoId":"β"}],"metodoPago":"EFECTIVO","montoAplicadoEsperado":6,"montoRecibidoEsperado":6,"tipo":"DINERO_NUEVO"}],"montoAplicadoEsperado":36.3}');
    strict_1.default.equal((0, node_crypto_1.createHash)("sha256").update(canonical).digest("hex"), "1f5f12abc2bebeef622bef425842246dc4185ff5759e18188747f7c3144ea062");
});
(0, node_test_1.default)("custodia esperada entra completa y estable al planHash", () => {
    const plan = {
        montoAplicadoEsperado: 30.000000000000004,
        componentes: [
            {
                tipo: "DINERO_NUEVO",
                claveIdempotencia: " component / β ",
                montoAplicadoEsperado: 10,
                montoRecibidoEsperado: 10,
                metodoPago: "DIGITAL",
                creditos: [
                    { movimientoDestinoId: " deuda / Ω ", montoAplicadoEsperado: 10 },
                ],
                custodiaEsperada: {
                    custodioOrigenId: " cobrador / α 😀 ",
                    custodioDestinoId: " cajero / ñ ",
                    turnoCajaOrigenId: " turno móvil / Ω ",
                    turnoCajaDestinoId: " turno caja / β ",
                    cajaDestinoId: " caja destino / 01 ",
                },
            },
            {
                tipo: "DINERO_NUEVO",
                claveIdempotencia: " component / A ",
                montoAplicadoEsperado: 20,
                montoRecibidoEsperado: 20,
                metodoPago: "EFECTIVO",
                creditos: [
                    { movimientoDestinoId: " deuda / 2 ", montoAplicadoEsperado: 12.1 },
                    { movimientoDestinoId: " deuda / 1 ", montoAplicadoEsperado: 7.9 },
                ],
                custodiaEsperada: {
                    custodioOrigenId: " cobrador / 2 ",
                    custodioDestinoId: " cajero / 2 ",
                    turnoCajaOrigenId: " turno origen / 2 ",
                    turnoCajaDestinoId: " turno destino / 2 ",
                    cajaOrigenId: " caja móvil / 2 ",
                    cajaDestinoId: " caja destino / 2 ",
                },
            },
        ],
    };
    const permutado = {
        montoAplicadoEsperado: 30,
        componentes: [...plan.componentes].reverse().map((componente) => ({
            ...componente,
            creditos: [...componente.creditos].reverse(),
        })),
    };
    const canonical = (0, cuenta_cliente_contract_1.serializarPlanEjecucionCobroClienteCanonico)(plan);
    const canonicalPermutado = (0, cuenta_cliente_contract_1.serializarPlanEjecucionCobroClienteCanonico)(permutado);
    const normalized = (0, cuenta_cliente_contract_1.canonicalizarPlanEjecucionCobroCliente)(plan);
    const hash = (0, node_crypto_1.createHash)("sha256").update(canonical).digest("hex");
    const destinoModificado = {
        ...plan,
        componentes: plan.componentes.map((componente, index) => index !== 0 || componente.tipo !== "DINERO_NUEVO"
            ? componente
            : {
                ...componente,
                custodiaEsperada: {
                    ...componente.custodiaEsperada,
                    custodioDestinoId: " cajero / distinto ",
                },
            }),
    };
    strict_1.default.equal(canonicalPermutado, canonical);
    strict_1.default.equal(canonical, '{"componentes":[{"claveIdempotencia":" component / A ","creditos":[{"montoAplicadoEsperado":7.9,"movimientoDestinoId":" deuda / 1 "},{"montoAplicadoEsperado":12.1,"movimientoDestinoId":" deuda / 2 "}],"custodiaEsperada":{"cajaDestinoId":" caja destino / 2 ","cajaOrigenId":" caja móvil / 2 ","custodioDestinoId":" cajero / 2 ","custodioOrigenId":" cobrador / 2 ","turnoCajaDestinoId":" turno destino / 2 ","turnoCajaOrigenId":" turno origen / 2 "},"metodoPago":"EFECTIVO","montoAplicadoEsperado":20,"montoRecibidoEsperado":20,"tipo":"DINERO_NUEVO"},{"claveIdempotencia":" component / β ","creditos":[{"montoAplicadoEsperado":10,"movimientoDestinoId":" deuda / Ω "}],"custodiaEsperada":{"cajaDestinoId":" caja destino / 01 ","custodioDestinoId":" cajero / ñ ","custodioOrigenId":" cobrador / α 😀 ","turnoCajaDestinoId":" turno caja / β ","turnoCajaOrigenId":" turno móvil / Ω "},"metodoPago":"DIGITAL","montoAplicadoEsperado":10,"montoRecibidoEsperado":10,"tipo":"DINERO_NUEVO"}],"montoAplicadoEsperado":30}');
    strict_1.default.equal(hash, "349e7617f8ddd53c76373f6c713580cda1fce44353339b57ed1a96dae8f5d3c6");
    strict_1.default.equal((0, node_crypto_1.createHash)("sha256").update(canonicalPermutado).digest("hex"), hash);
    strict_1.default.notEqual((0, node_crypto_1.createHash)("sha256")
        .update((0, cuenta_cliente_contract_1.serializarPlanEjecucionCobroClienteCanonico)(destinoModificado))
        .digest("hex"), hash);
    const first = normalized.componentes[0];
    strict_1.default.equal(first === null || first === void 0 ? void 0 : first.tipo, "DINERO_NUEVO");
    if ((first === null || first === void 0 ? void 0 : first.tipo) !== "DINERO_NUEVO") {
        strict_1.default.fail("se esperaba componente DINERO_NUEVO");
    }
    strict_1.default.deepEqual(first.custodiaEsperada, {
        custodioOrigenId: " cobrador / 2 ",
        custodioDestinoId: " cajero / 2 ",
        turnoCajaOrigenId: " turno origen / 2 ",
        turnoCajaDestinoId: " turno destino / 2 ",
        cajaOrigenId: " caja móvil / 2 ",
        cajaDestinoId: " caja destino / 2 ",
    });
});
(0, node_test_1.default)("custodia esperada es condicional al rol y falla cerrada", () => {
    const cajero = {
        tipo: "DINERO_NUEVO",
        claveIdempotencia: "opaque cashier component",
        montoAplicadoEsperado: 10,
        montoRecibidoEsperado: 10,
        metodoPago: "EFECTIVO",
        creditos: [],
    };
    if (cajero.tipo !== "DINERO_NUEVO") {
        strict_1.default.fail("se esperaba componente DINERO_NUEVO");
    }
    const noCajero = {
        ...cajero,
        custodiaEsperada: {
            custodioOrigenId: " origin / opaque ",
            custodioDestinoId: " destination / opaque ",
            turnoCajaOrigenId: " source turn / opaque ",
            turnoCajaDestinoId: " destination turn / opaque ",
        },
    };
    strict_1.default.equal((0, cuenta_cliente_contract_1.esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente)(cajero, "CAJERO"), true);
    strict_1.default.equal((0, cuenta_cliente_contract_1.esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente)(noCajero, "VENDEDOR"), true);
    strict_1.default.equal((0, cuenta_cliente_contract_1.esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente)(noCajero, "SISTEMA"), true);
    strict_1.default.equal((0, cuenta_cliente_contract_1.esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente)(noCajero, "CAJERO"), false);
    strict_1.default.equal((0, cuenta_cliente_contract_1.esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente)(cajero, "VENDEDOR"), false);
    strict_1.default.equal((0, cuenta_cliente_contract_1.esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente)({
        ...noCajero,
        custodiaEsperada: {
            ...noCajero.custodiaEsperada,
            turnoCajaDestinoId: "",
        },
    }, "VENDEDOR"), false);
});
(0, node_test_1.default)("la cabecera durable declara el plan completo sin semantica en su id tecnico", () => {
    const cabecera = {
        type: cuenta_cliente_contract_1.TIPO_DOCUMENTO_EJECUCION_COBRO_CLIENTE,
        contractVersion: cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
        ejecucionCobroId: "opaque-execution-correlation",
        cuentaId: "opaque-account",
        clienteId: "opaque-customer",
        moneda: "PEN",
        planHash: "sha256-plan",
        plan: {
            montoAplicadoEsperado: 100,
            componentes: [
                {
                    tipo: "SALDO_FAVOR",
                    claveIdempotencia: "component-balance",
                    montoAplicadoEsperado: 15,
                    creditos: [
                        {
                            movimientoDestinoId: "opaque-credit-a",
                            montoAplicadoEsperado: 15,
                        },
                    ],
                },
                {
                    tipo: "DINERO_NUEVO",
                    claveIdempotencia: "component-cash",
                    metodoPago: "EFECTIVO",
                    montoRecibidoEsperado: 60,
                    montoAplicadoEsperado: 60,
                    creditos: [
                        {
                            movimientoDestinoId: "opaque-credit-a",
                            montoAplicadoEsperado: 60,
                        },
                    ],
                },
                {
                    tipo: "DINERO_NUEVO",
                    claveIdempotencia: "component-digital",
                    metodoPago: "DIGITAL",
                    montoRecibidoEsperado: 30,
                    montoAplicadoEsperado: 25,
                    creditos: [
                        {
                            movimientoDestinoId: "opaque-credit-b",
                            montoAplicadoEsperado: 25,
                        },
                    ],
                },
            ],
        },
        componentesConfirmados: ["component-balance", "component-cash"],
        estado: "EN_PROGRESO",
        creadoPorId: "opaque-user",
        createdAt: new Date("2026-09-03T10:00:00.000Z"),
        updatedAt: new Date("2026-09-03T10:00:01.000Z"),
    };
    strict_1.default.equal(cabecera.type, "ejecucion_cobro_cliente");
    const persistida = {
        ...cabecera,
        _id: "opaque-couch-document-id",
        _rev: "7-opaque-revision",
    };
    strict_1.default.equal(persistida._id, "opaque-couch-document-id");
    strict_1.default.equal("id" in persistida, false);
    strict_1.default.equal(cabecera.plan.componentes.length, 3);
    strict_1.default.deepEqual(cabecera.componentesConfirmados, [
        "component-balance",
        "component-cash",
    ]);
    strict_1.default.equal("id" in cabecera, false);
});
(0, node_test_1.default)("RecepcionCobroCliente admite código de constancia", () => {
    const recepcion = {
        id: "recepcion_001",
        codigoConstancia: "CONST-2026-0001",
        clienteId: "cliente_001",
        monto: 100,
        moneda: "PEN",
        metodoPago: "EFECTIVO",
        creadoPorId: "usuario_001",
        estado: "RECIBIDO",
        idempotencyKey: "recepcion:001",
        createdAt: new Date("2026-07-22T10:00:00.000Z"),
    };
    strict_1.default.equal(recepcion.codigoConstancia, "CONST-2026-0001");
});
(0, node_test_1.default)("documentos historicos siguen siendo validos sin ejecucionCobroId", () => {
    const movimiento = {
        id: "opaque-movement-random",
        cuentaId: "cuenta_001",
        tipo: "COBRO",
        direccion: "CREDITO",
        monto: 100,
        moneda: "PEN",
        tipoOrigen: "RECIBO_COBRO",
        origenId: "opaque-receipt-random",
        createdAt: new Date("2026-07-22T10:00:00.000Z"),
    };
    const imputacion = {
        id: "opaque-allocation-random",
        movimientoOrigenId: movimiento.id,
        movimientoDestinoId: "opaque-credit-random",
        monto: 100,
        moneda: "PEN",
        createdAt: new Date("2026-07-22T10:00:00.000Z"),
    };
    strict_1.default.equal(movimiento.ejecucionCobroId, undefined);
    strict_1.default.equal(movimiento.ejecucionCobroManifestVersion, undefined);
    strict_1.default.equal(imputacion.ejecucionCobroId, undefined);
    strict_1.default.equal(imputacion.ejecucionCobroManifestVersion, undefined);
    strict_1.default.equal(imputacion.tipoComponenteEjecucionCobro, undefined);
    strict_1.default.equal(imputacion.creadoPorId, undefined);
    strict_1.default.equal(imputacion.cobroId, undefined);
});
(0, node_test_1.default)("MANIFEST_V1 exige cobroId en DINERO_NUEVO y preserva moneda e IDs opacos", () => {
    const cobroIdEsObligatorio = true;
    const cobroIdHistoricoEsOpcional = true;
    const imputacion = {
        id: " allocation / α 😀 ",
        ejecucionCobroId: " execution / Ω ",
        ejecucionCobroManifestVersion: cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
        tipoComponenteEjecucionCobro: "DINERO_NUEVO",
        cobroId: " receipt / ñ 🧭 ",
        movimientoOrigenId: " movement / source ",
        movimientoDestinoId: " debt / target ",
        monto: 18.25,
        moneda: "USD",
        estado: "APLICADA",
        createdAt: new Date("2026-09-04T17:00:00.000Z"),
    };
    strict_1.default.equal(cobroIdEsObligatorio, true);
    strict_1.default.equal(cobroIdHistoricoEsOpcional, true);
    strict_1.default.equal(imputacion.cobroId, " receipt / ñ 🧭 ");
    strict_1.default.equal(imputacion.moneda, "USD");
    strict_1.default.equal(imputacion.id, " allocation / α 😀 ");
    strict_1.default.equal((0, cuenta_cliente_contract_1.esImputacionCuentaClienteManifestV1)(imputacion), true);
    const sinCobroId = {
        ...imputacion,
        cobroId: undefined,
    };
    strict_1.default.equal((0, cuenta_cliente_contract_1.esImputacionCuentaClienteManifestV1)(sinCobroId), false);
});
(0, node_test_1.default)("una imputacion conserva ejecucion, componente y actor sin codificarlos en su id", () => {
    const imputacion = {
        id: "opaque-allocation-without-business-semantics",
        ejecucionCobroId: "opaque-payment-execution",
        ejecucionCobroManifestVersion: cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
        tipoComponenteEjecucionCobro: "SALDO_FAVOR",
        creadoPorId: "opaque-user",
        movimientoOrigenId: "opaque-credit-source",
        movimientoDestinoId: "opaque-debt-target",
        monto: 25,
        moneda: "PEN",
        estado: "APLICADA",
        estrategia: "FIFO",
        createdAt: new Date("2026-09-03T10:00:00.000Z"),
    };
    strict_1.default.equal(imputacion.ejecucionCobroId, "opaque-payment-execution");
    strict_1.default.equal(imputacion.ejecucionCobroManifestVersion, 1);
    strict_1.default.equal(imputacion.tipoComponenteEjecucionCobro, "SALDO_FAVOR");
    strict_1.default.equal(imputacion.creadoPorId, "opaque-user");
});
(0, node_test_1.default)("la lectura historica no inventa actor ni identidad idempotente", () => {
    var _a, _b;
    const ejecucion = {
        contractVersion: cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
        id: "opaque-execution",
        cuentaId: "opaque-account",
        clienteId: "opaque-customer",
        moneda: "PEN",
        estado: "CONFIRMADA",
        componentes: [
            {
                tipo: "SALDO_FAVOR",
                estado: "CONFIRMADO",
                movimientoIds: ["opaque-balance-source"],
                imputacionIds: ["opaque-allocation"],
                montoDisponible: 10,
                montoAplicado: 10,
                montoNoImputado: 0,
            },
        ],
        totales: {
            montoDineroNuevo: 0,
            montoSaldoFavorAplicado: 10,
            montoAplicado: 10,
            montoNoImputado: 0,
        },
        createdAt: new Date("2026-09-01T15:00:00.000Z"),
        updatedAt: new Date("2026-09-01T15:00:00.000Z"),
    };
    strict_1.default.equal(ejecucion.creadoPorId, undefined);
    strict_1.default.equal((_a = ejecucion.componentes[0]) === null || _a === void 0 ? void 0 : _a.id, undefined);
    strict_1.default.equal((_b = ejecucion.componentes[0]) === null || _b === void 0 ? void 0 : _b.idempotencyKey, undefined);
});
(0, node_test_1.default)("distingue resultados parciales y terminales de negocio de recuperacion tecnica", () => {
    const estados = [
        "PARCIALMENTE_CONFIRMADA",
        "RECHAZADA",
        "ANULADA",
        "REVERTIDA",
    ];
    const componentes = [
        "PARCIALMENTE_REVERTIDO",
        "RECHAZADO",
        "ANULADO",
        "REVERTIDO",
    ];
    strict_1.default.deepEqual(estados, [
        "PARCIALMENTE_CONFIRMADA",
        "RECHAZADA",
        "ANULADA",
        "REVERTIDA",
    ]);
    strict_1.default.deepEqual(componentes, [
        "PARCIALMENTE_REVERTIDO",
        "RECHAZADO",
        "ANULADO",
        "REVERTIDO",
    ]);
});
(0, node_test_1.default)("conserva monto historico y efecto neto de una compensacion parcial", () => {
    var _a, _b;
    const ejecucion = {
        contractVersion: cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
        id: "opaque-partial-reversal",
        cuentaId: "opaque-account",
        clienteId: "opaque-customer",
        moneda: "PEN",
        estado: "PARCIALMENTE_CONFIRMADA",
        componentes: [
            {
                tipo: "SALDO_FAVOR",
                estado: "PARCIALMENTE_REVERTIDO",
                movimientoIds: ["opaque-source-a", "opaque-source-b"],
                imputacionIds: ["opaque-allocation-a", "opaque-allocation-b"],
                montoDisponible: 100,
                montoAplicado: 100,
                montoRevertido: 40,
                montoAplicadoNeto: 60,
                montoNoImputado: 0,
            },
        ],
        totales: {
            montoDineroNuevo: 0,
            montoSaldoFavorAplicado: 100,
            montoAplicado: 100,
            montoRevertido: 40,
            montoAplicadoNeto: 60,
            montoNoImputado: 0,
        },
        createdAt: new Date("2026-09-01T15:00:00.000Z"),
        updatedAt: new Date("2026-09-02T15:00:00.000Z"),
    };
    strict_1.default.equal((_a = ejecucion.componentes[0]) === null || _a === void 0 ? void 0 : _a.montoAplicado, 100);
    strict_1.default.equal((_b = ejecucion.componentes[0]) === null || _b === void 0 ? void 0 : _b.montoAplicadoNeto, 60);
    strict_1.default.equal(ejecucion.totales.montoRevertido, 40);
});
(0, node_test_1.default)("una ejecucion agrupa saldo a favor y varios metodos sin colapsar sus componentes", () => {
    const ejecucionCobroId = "9f5ee15a-opaque-no-business-format";
    const ejecucion = {
        contractVersion: cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
        id: ejecucionCobroId,
        cuentaId: "cuenta_001",
        clienteId: "cliente_001",
        moneda: "PEN",
        estado: "CONFIRMADA",
        componentes: [
            {
                id: "component-cash-opaque",
                tipo: "DINERO_NUEVO",
                estado: "CONFIRMADO",
                metodoPago: "EFECTIVO",
                idempotencyKey: "command:cash:opaque",
                requestHash: "hash-cash",
                recepcionCobroIds: ["receipt-cash-opaque"],
                movimientoIds: ["movement-cash-opaque"],
                imputacionIds: ["allocation-cash-credit-a"],
                montoDisponible: 60,
                montoAplicado: 60,
                montoNoImputado: 0,
            },
            {
                id: "component-digital-opaque",
                tipo: "DINERO_NUEVO",
                estado: "CONFIRMADO",
                metodoPago: "DIGITAL",
                idempotencyKey: "command:digital:opaque",
                recepcionCobroIds: ["receipt-digital-opaque"],
                movimientoIds: ["movement-digital-opaque"],
                imputacionIds: ["allocation-digital-credit-b"],
                montoDisponible: 25,
                montoAplicado: 20,
                montoNoImputado: 5,
            },
            {
                id: "component-balance-opaque",
                tipo: "SALDO_FAVOR",
                estado: "CONFIRMADO",
                idempotencyKey: "command:balance:opaque",
                movimientoIds: ["preexisting-credit-opaque"],
                imputacionIds: ["allocation-balance-credit-b"],
                montoDisponible: 15,
                montoAplicado: 15,
                montoNoImputado: 0,
            },
        ],
        totales: {
            montoDineroNuevo: 85,
            montoSaldoFavorAplicado: 15,
            montoAplicado: 95,
            montoNoImputado: 5,
        },
        creadoPorId: "usuario_001",
        createdAt: new Date("2026-09-01T15:00:00.000Z"),
        updatedAt: new Date("2026-09-01T15:00:01.000Z"),
        confirmadaAt: new Date("2026-09-01T15:00:01.000Z"),
    };
    strict_1.default.deepEqual(ejecucion.componentes.map((componente) => componente.tipo), ["DINERO_NUEVO", "DINERO_NUEVO", "SALDO_FAVOR"]);
    strict_1.default.equal(ejecucion.totales.montoDineroNuevo, 85);
    strict_1.default.equal(ejecucion.totales.montoSaldoFavorAplicado, 15);
    strict_1.default.equal(ejecucion.totales.montoAplicado, 95);
});
(0, node_test_1.default)("detalle versionado conserva recepciones, movimientos e imputaciones separados", () => {
    var _a, _b;
    const ejecucionCobroId = "opaque-execution-2026-09-01";
    const recepcion = {
        id: "opaque-receipt",
        ejecucionCobroId,
        clienteId: "cliente_001",
        cuentaId: "cuenta_001",
        monto: 100,
        moneda: "PEN",
        metodoPago: "EFECTIVO",
        creadoPorId: "usuario_001",
        estado: "RECIBIDO",
        idempotencyKey: "receipt-command-opaque",
        createdAt: new Date("2026-09-01T15:00:00.000Z"),
    };
    const movimiento = {
        id: "opaque-source-movement",
        ejecucionCobroId,
        cuentaId: "cuenta_001",
        clienteId: "cliente_001",
        tipo: "COBRO",
        direccion: "CREDITO",
        monto: 100,
        moneda: "PEN",
        tipoOrigen: "RECIBO_COBRO",
        origenId: recepcion.id,
        recepcionCobroId: recepcion.id,
        createdAt: new Date("2026-09-01T15:00:00.000Z"),
    };
    const imputaciones = [
        {
            id: "opaque-allocation-a",
            ejecucionCobroId,
            movimientoOrigenId: movimiento.id,
            movimientoDestinoId: "opaque-destination-a",
            monto: 40,
            moneda: "PEN",
            estado: "APLICADA",
            createdAt: new Date("2026-09-01T15:00:00.000Z"),
        },
        {
            id: "opaque-allocation-b",
            ejecucionCobroId,
            movimientoOrigenId: movimiento.id,
            movimientoDestinoId: "opaque-destination-b",
            monto: 60,
            moneda: "PEN",
            estado: "APLICADA",
            createdAt: new Date("2026-09-01T15:00:00.000Z"),
        },
    ];
    const ejecucion = {
        contractVersion: cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
        id: ejecucionCobroId,
        cuentaId: "cuenta_001",
        clienteId: "cliente_001",
        moneda: "PEN",
        estado: "CONFIRMADA",
        componentes: [
            {
                id: "opaque-component",
                tipo: "DINERO_NUEVO",
                estado: "CONFIRMADO",
                metodoPago: "EFECTIVO",
                idempotencyKey: "component-command-opaque",
                recepcionCobroIds: [recepcion.id],
                movimientoIds: [movimiento.id],
                imputacionIds: imputaciones.map(({ id }) => id),
                montoDisponible: 100,
                montoAplicado: 100,
                montoNoImputado: 0,
            },
        ],
        totales: {
            montoDineroNuevo: 100,
            montoSaldoFavorAplicado: 0,
            montoAplicado: 100,
            montoNoImputado: 0,
        },
        creadoPorId: "usuario_001",
        createdAt: new Date("2026-09-01T15:00:00.000Z"),
        updatedAt: new Date("2026-09-01T15:00:00.000Z"),
    };
    const detalle = {
        contractVersion: cuenta_cliente_contract_1.EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
        ejecucion,
        recepciones: [recepcion],
        movimientos: [movimiento],
        imputaciones,
        transferenciasCustodia: [],
        creditosDestino: [
            {
                movimientoDestinoId: "opaque-destination-a",
                tipoOrigen: "VENTA",
                origenId: "opaque-sale-a",
                codigoVisible: "VENTA A",
                imputacionIds: ["opaque-allocation-a"],
                montoOriginal: 70,
                saldoPendienteAnterior: 70,
                montoAplicado: 40,
                saldoPendienteRestante: 30,
            },
            {
                movimientoDestinoId: "opaque-destination-b",
                tipoOrigen: "VENTA",
                origenId: "opaque-sale-b",
                codigoVisible: "VENTA B",
                imputacionIds: ["opaque-allocation-b"],
                montoOriginal: 60,
                saldoPendienteAnterior: 60,
                montoAplicado: 60,
                saldoPendienteRestante: 0,
            },
        ],
        movimientosCompensatorios: [],
    };
    strict_1.default.equal((_a = detalle.recepciones[0]) === null || _a === void 0 ? void 0 : _a.ejecucionCobroId, ejecucionCobroId);
    strict_1.default.equal((_b = detalle.movimientos[0]) === null || _b === void 0 ? void 0 : _b.ejecucionCobroId, ejecucionCobroId);
    strict_1.default.equal(detalle.imputaciones.length, 2);
    strict_1.default.deepEqual(detalle.creditosDestino.map(({ montoAplicado }) => montoAplicado), [40, 60]);
});
(0, node_test_1.default)("detalle conserva N componentes y N transferencias de custodia sin colapsarlas", () => {
    const ejecucionCobroId = " execution / opaque / USD 😀 ";
    const recepciones = [
        {
            id: " receipt / cash / α ",
            ejecucionCobroId,
            ejecucionCobroManifestVersion: 1,
            clienteId: " customer / opaque ",
            cuentaId: " account / opaque ",
            monto: 12.25,
            moneda: "USD",
            metodoPago: "EFECTIVO",
            creadoPorId: " collector / one ",
            recibidoPorRol: "VENDEDOR",
            estado: "EN_TRANSFERENCIA_CUSTODIA",
            idempotencyKey: " receipt command / one ",
            createdAt: new Date("2026-09-04T18:00:00.000Z"),
        },
        {
            id: " receipt / digital / β ",
            ejecucionCobroId,
            ejecucionCobroManifestVersion: 1,
            clienteId: " customer / opaque ",
            cuentaId: " account / opaque ",
            monto: 7.75,
            moneda: "USD",
            metodoPago: "DIGITAL",
            creadoPorId: " collector / two ",
            recibidoPorRol: "VENDEDOR",
            estado: "EN_TRANSFERENCIA_CUSTODIA",
            idempotencyKey: " receipt command / two ",
            createdAt: new Date("2026-09-04T18:00:01.000Z"),
        },
    ];
    const transferenciasCustodia = [
        {
            id: " transfer / one / opaque ",
            recepcionCobroId: recepciones[0].id,
            custodioOrigenId: " collector / one ",
            custodioDestinoId: " cashier / one ",
            turnoCajaOrigenId: " mobile turn / one ",
            turnoCajaDestinoId: " cash turn / one ",
            cajaDestinoId: " cashbox / one ",
            estado: "PENDIENTE",
            createdAt: new Date("2026-09-04T18:00:02.000Z"),
        },
        {
            id: " transfer / two / opaque ",
            recepcionCobroId: recepciones[1].id,
            custodioOrigenId: " collector / two ",
            custodioDestinoId: " cashier / two ",
            turnoCajaOrigenId: " mobile turn / two ",
            turnoCajaDestinoId: " cash turn / two ",
            cajaDestinoId: " cashbox / two ",
            estado: "PENDIENTE",
            createdAt: new Date("2026-09-04T18:00:03.000Z"),
        },
    ];
    const imputaciones = recepciones.map((recepcion, index) => ({
        id: ` allocation / ${index} / opaque `,
        ejecucionCobroId,
        ejecucionCobroManifestVersion: 1,
        tipoComponenteEjecucionCobro: "DINERO_NUEVO",
        cobroId: recepcion.id,
        movimientoOrigenId: ` movement / ${index} / source `,
        movimientoDestinoId: ` movement / ${index} / debt `,
        monto: recepcion.monto,
        moneda: "USD",
        estado: "APLICADA",
        createdAt: new Date("2026-09-04T18:00:04.000Z"),
    }));
    const detalle = {
        contractVersion: 1,
        ejecucion: {
            contractVersion: 1,
            id: ejecucionCobroId,
            cuentaId: " account / opaque ",
            clienteId: " customer / opaque ",
            moneda: "USD",
            estado: "CONFIRMADA",
            componentes: recepciones.map((recepcion, index) => ({
                id: ` component / ${index} / opaque `,
                tipo: "DINERO_NUEVO",
                estado: "CONFIRMADO",
                metodoPago: recepcion.metodoPago,
                recepcionCobroIds: [recepcion.id],
                movimientoIds: [` movement / ${index} / source `],
                imputacionIds: [imputaciones[index].id],
                montoDisponible: recepcion.monto,
                montoAplicado: recepcion.monto,
                montoNoImputado: 0,
            })),
            totales: {
                montoDineroNuevo: 20,
                montoSaldoFavorAplicado: 0,
                montoAplicado: 20,
                montoNoImputado: 0,
            },
            createdAt: new Date("2026-09-04T18:00:00.000Z"),
            updatedAt: new Date("2026-09-04T18:00:05.000Z"),
        },
        recepciones,
        movimientos: [],
        imputaciones,
        transferenciasCustodia,
        creditosDestino: [],
        movimientosCompensatorios: [],
    };
    strict_1.default.equal(detalle.ejecucion.componentes.length, 2);
    strict_1.default.equal(detalle.transferenciasCustodia.length, 2);
    strict_1.default.deepEqual(detalle.transferenciasCustodia.map(({ recepcionCobroId }) => recepcionCobroId), recepciones.map(({ id }) => id));
    strict_1.default.deepEqual(detalle.imputaciones.map(({ cobroId }) => cobroId), recepciones.map(({ id }) => id));
    strict_1.default.equal("transferenciaCustodia" in detalle, false);
});
