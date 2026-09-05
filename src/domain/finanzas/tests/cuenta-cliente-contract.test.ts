import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  agruparEvidenciaCreditosEjecucionCobroCliente,
  canonicalizarPlanEjecucionCobroCliente,
  coincidenCreditosPlanConEvidenciaEjecucionCobroCliente,
  EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
  EJECUCION_COBRO_CLIENTE_PLAN_CANONICALIZATION_VERSION,
  esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente,
  esImputacionCuentaClienteManifestV1,
  serializarPlanEjecucionCobroClienteCanonico,
  TIPO_DOCUMENTO_EJECUCION_COBRO_CLIENTE,
  type CabeceraEjecucionCobroCliente,
  type CabeceraEjecucionCobroClientePersistida,
  type DetalleEjecucionCobroCliente,
  type EjecucionCobroCliente,
  type EstadoComponenteEjecucionCobroCliente,
  type EstadoEjecucionCobroCliente,
  type ImputacionCuentaCliente,
  type ImputacionCuentaClienteDineroNuevoManifestV1,
  type ImputacionCuentaClienteManifestV1,
  type MovimientoCuentaCliente,
  type PlanEjecucionCobroCliente,
  type RecepcionCobroCliente,
  type TransferenciaCustodiaCobro,
} from "../contracts/cuenta-cliente.contract";

test("agrega imputaciones de varias fuentes contra el mismo credito destino", () => {
  const evidencia = [
    { movimientoDestinoId: " deuda / opaca ", montoAplicadoEsperado: 55.85 },
    { movimientoDestinoId: "otra-deuda-opaca", montoAplicadoEsperado: 10 },
    { movimientoDestinoId: " deuda / opaca ", montoAplicadoEsperado: 344.85 },
    { movimientoDestinoId: "otra-deuda-opaca", montoAplicadoEsperado: 5.05 },
  ];

  assert.deepEqual(agruparEvidenciaCreditosEjecucionCobroCliente(evidencia), [
    { movimientoDestinoId: " deuda / opaca ", montoAplicadoEsperado: 400.7 },
    { movimientoDestinoId: "otra-deuda-opaca", montoAplicadoEsperado: 15.05 },
  ]);
  assert.equal(
    coincidenCreditosPlanConEvidenciaEjecucionCobroCliente(
      [
        {
          movimientoDestinoId: "otra-deuda-opaca",
          montoAplicadoEsperado: 15.05,
        },
        {
          movimientoDestinoId: " deuda / opaca ",
          montoAplicadoEsperado: 400.7,
        },
      ],
      evidencia,
    ),
    true,
  );
});

test("falla cerrado ante montos distintos o destinos duplicados en el plan", () => {
  assert.equal(
    coincidenCreditosPlanConEvidenciaEjecucionCobroCliente(
      [{ movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 10 }],
      [
        { movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 4 },
        { movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 5.99 },
      ],
    ),
    false,
  );
  assert.equal(
    coincidenCreditosPlanConEvidenciaEjecucionCobroCliente(
      [
        { movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 4 },
        { movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 6 },
      ],
      [{ movimientoDestinoId: "destino-opaco", montoAplicadoEsperado: 10 }],
    ),
    false,
  );
});

test("canonicaliza planHash igual con orden permutado, centimos e IDs opacos Unicode", () => {
  const plan: PlanEjecucionCobroCliente = {
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
  const permutado: PlanEjecucionCobroCliente = {
    montoAplicadoEsperado: 36.3,
    componentes: [...plan.componentes].reverse().map((componente) => ({
      ...componente,
      creditos: [...componente.creditos].reverse(),
    })),
  };

  const canonical = serializarPlanEjecucionCobroClienteCanonico(plan);
  const canonicalPermutado =
    serializarPlanEjecucionCobroClienteCanonico(permutado);
  const normalized = canonicalizarPlanEjecucionCobroCliente(plan);

  assert.equal(EJECUCION_COBRO_CLIENTE_PLAN_CANONICALIZATION_VERSION, 1);
  assert.equal(canonicalPermutado, canonical);
  assert.equal(normalized.montoAplicadoEsperado, 36.3);
  assert.equal(normalized.componentes[0]?.claveIdempotencia, " saldo β ");
  assert.equal(normalized.componentes[1]?.claveIdempotencia, " zeta Ω ");
  assert.equal(normalized.componentes[2]?.claveIdempotencia, "cash\tα");
  assert.equal(
    canonical,
    '{"componentes":[{"claveIdempotencia":" saldo β ","creditos":[{"montoAplicadoEsperado":5.05,"movimientoDestinoId":" 0"},{"montoAplicadoEsperado":5.05,"movimientoDestinoId":"ñ opaque"}],"montoAplicadoEsperado":10.1,"tipo":"SALDO_FAVOR"},{"claveIdempotencia":" zeta Ω ","creditos":[{"montoAplicadoEsperado":8.1,"movimientoDestinoId":"A "},{"montoAplicadoEsperado":12.1,"movimientoDestinoId":"crédito 😀 "}],"metodoPago":"DIGITAL","montoAplicadoEsperado":20.2,"montoRecibidoEsperado":25,"tipo":"DINERO_NUEVO"},{"claveIdempotencia":"cash\\tα","creditos":[{"montoAplicadoEsperado":6,"movimientoDestinoId":"β"}],"metodoPago":"EFECTIVO","montoAplicadoEsperado":6,"montoRecibidoEsperado":6,"tipo":"DINERO_NUEVO"}],"montoAplicadoEsperado":36.3}',
  );
  assert.equal(
    createHash("sha256").update(canonical).digest("hex"),
    "1f5f12abc2bebeef622bef425842246dc4185ff5759e18188747f7c3144ea062",
  );
});

test("custodia esperada entra completa y estable al planHash", () => {
  const plan: PlanEjecucionCobroCliente = {
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
  const permutado: PlanEjecucionCobroCliente = {
    montoAplicadoEsperado: 30,
    componentes: [...plan.componentes].reverse().map((componente) => ({
      ...componente,
      creditos: [...componente.creditos].reverse(),
    })),
  };

  const canonical = serializarPlanEjecucionCobroClienteCanonico(plan);
  const canonicalPermutado =
    serializarPlanEjecucionCobroClienteCanonico(permutado);
  const normalized = canonicalizarPlanEjecucionCobroCliente(plan);
  const hash = createHash("sha256").update(canonical).digest("hex");
  const destinoModificado: PlanEjecucionCobroCliente = {
    ...plan,
    componentes: plan.componentes.map((componente, index) =>
      index !== 0 || componente.tipo !== "DINERO_NUEVO"
        ? componente
        : {
            ...componente,
            custodiaEsperada: {
              ...componente.custodiaEsperada!,
              custodioDestinoId: " cajero / distinto ",
            },
          },
    ),
  };

  assert.equal(canonicalPermutado, canonical);
  assert.equal(
    canonical,
    '{"componentes":[{"claveIdempotencia":" component / A ","creditos":[{"montoAplicadoEsperado":7.9,"movimientoDestinoId":" deuda / 1 "},{"montoAplicadoEsperado":12.1,"movimientoDestinoId":" deuda / 2 "}],"custodiaEsperada":{"cajaDestinoId":" caja destino / 2 ","cajaOrigenId":" caja móvil / 2 ","custodioDestinoId":" cajero / 2 ","custodioOrigenId":" cobrador / 2 ","turnoCajaDestinoId":" turno destino / 2 ","turnoCajaOrigenId":" turno origen / 2 "},"metodoPago":"EFECTIVO","montoAplicadoEsperado":20,"montoRecibidoEsperado":20,"tipo":"DINERO_NUEVO"},{"claveIdempotencia":" component / β ","creditos":[{"montoAplicadoEsperado":10,"movimientoDestinoId":" deuda / Ω "}],"custodiaEsperada":{"cajaDestinoId":" caja destino / 01 ","custodioDestinoId":" cajero / ñ ","custodioOrigenId":" cobrador / α 😀 ","turnoCajaDestinoId":" turno caja / β ","turnoCajaOrigenId":" turno móvil / Ω "},"metodoPago":"DIGITAL","montoAplicadoEsperado":10,"montoRecibidoEsperado":10,"tipo":"DINERO_NUEVO"}],"montoAplicadoEsperado":30}',
  );
  assert.equal(
    hash,
    "349e7617f8ddd53c76373f6c713580cda1fce44353339b57ed1a96dae8f5d3c6",
  );
  assert.equal(
    createHash("sha256").update(canonicalPermutado).digest("hex"),
    hash,
  );
  assert.notEqual(
    createHash("sha256")
      .update(serializarPlanEjecucionCobroClienteCanonico(destinoModificado))
      .digest("hex"),
    hash,
  );
  const first = normalized.componentes[0];
  assert.equal(first?.tipo, "DINERO_NUEVO");
  if (first?.tipo !== "DINERO_NUEVO") {
    assert.fail("se esperaba componente DINERO_NUEVO");
  }
  assert.deepEqual(first.custodiaEsperada, {
    custodioOrigenId: " cobrador / 2 ",
    custodioDestinoId: " cajero / 2 ",
    turnoCajaOrigenId: " turno origen / 2 ",
    turnoCajaDestinoId: " turno destino / 2 ",
    cajaOrigenId: " caja móvil / 2 ",
    cajaDestinoId: " caja destino / 2 ",
  });
});

test("custodia esperada es condicional al rol y falla cerrada", () => {
  const cajero: PlanEjecucionCobroCliente["componentes"][number] = {
    tipo: "DINERO_NUEVO",
    claveIdempotencia: "opaque cashier component",
    montoAplicadoEsperado: 10,
    montoRecibidoEsperado: 10,
    metodoPago: "EFECTIVO",
    creditos: [],
  };
  if (cajero.tipo !== "DINERO_NUEVO") {
    assert.fail("se esperaba componente DINERO_NUEVO");
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

  assert.equal(
    esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente(cajero, "CAJERO"),
    true,
  );
  assert.equal(
    esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente(
      noCajero,
      "VENDEDOR",
    ),
    true,
  );
  assert.equal(
    esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente(
      noCajero,
      "SISTEMA",
    ),
    true,
  );
  assert.equal(
    esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente(noCajero, "CAJERO"),
    false,
  );
  assert.equal(
    esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente(cajero, "VENDEDOR"),
    false,
  );
  assert.equal(
    esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente(
      {
        ...noCajero,
        custodiaEsperada: {
          ...noCajero.custodiaEsperada,
          turnoCajaDestinoId: "",
        },
      },
      "VENDEDOR",
    ),
    false,
  );
});

test("la cabecera durable declara el plan completo sin semantica en su id tecnico", () => {
  const cabecera: CabeceraEjecucionCobroCliente = {
    type: TIPO_DOCUMENTO_EJECUCION_COBRO_CLIENTE,
    contractVersion: EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
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

  assert.equal(cabecera.type, "ejecucion_cobro_cliente");

  const persistida: CabeceraEjecucionCobroClientePersistida = {
    ...cabecera,
    _id: "opaque-couch-document-id",
    _rev: "7-opaque-revision",
  };
  assert.equal(persistida._id, "opaque-couch-document-id");
  assert.equal("id" in persistida, false);
  assert.equal(cabecera.plan.componentes.length, 3);
  assert.deepEqual(cabecera.componentesConfirmados, [
    "component-balance",
    "component-cash",
  ]);
  assert.equal("id" in cabecera, false);
});

test("RecepcionCobroCliente admite código de constancia", () => {
  const recepcion: RecepcionCobroCliente = {
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

  assert.equal(recepcion.codigoConstancia, "CONST-2026-0001");
});

test("documentos historicos siguen siendo validos sin ejecucionCobroId", () => {
  const movimiento: MovimientoCuentaCliente = {
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
  const imputacion: ImputacionCuentaCliente = {
    id: "opaque-allocation-random",
    movimientoOrigenId: movimiento.id,
    movimientoDestinoId: "opaque-credit-random",
    monto: 100,
    moneda: "PEN",
    createdAt: new Date("2026-07-22T10:00:00.000Z"),
  };

  assert.equal(movimiento.ejecucionCobroId, undefined);
  assert.equal(movimiento.ejecucionCobroManifestVersion, undefined);
  assert.equal(imputacion.ejecucionCobroId, undefined);
  assert.equal(imputacion.ejecucionCobroManifestVersion, undefined);
  assert.equal(imputacion.tipoComponenteEjecucionCobro, undefined);
  assert.equal(imputacion.creadoPorId, undefined);
  assert.equal(imputacion.cobroId, undefined);
});

test("MANIFEST_V1 exige cobroId en DINERO_NUEVO y preserva moneda e IDs opacos", () => {
  type CobroIdEsObligatorio =
    {} extends Pick<ImputacionCuentaClienteDineroNuevoManifestV1, "cobroId">
      ? false
      : true;
  type CobroIdHistoricoEsOpcional =
    {} extends Pick<ImputacionCuentaCliente, "cobroId"> ? true : false;

  const cobroIdEsObligatorio: CobroIdEsObligatorio = true;
  const cobroIdHistoricoEsOpcional: CobroIdHistoricoEsOpcional = true;
  const imputacion: ImputacionCuentaClienteManifestV1 = {
    id: " allocation / α 😀 ",
    ejecucionCobroId: " execution / Ω ",
    ejecucionCobroManifestVersion: EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
    tipoComponenteEjecucionCobro: "DINERO_NUEVO",
    cobroId: " receipt / ñ 🧭 ",
    movimientoOrigenId: " movement / source ",
    movimientoDestinoId: " debt / target ",
    monto: 18.25,
    moneda: "USD",
    estado: "APLICADA",
    createdAt: new Date("2026-09-04T17:00:00.000Z"),
  };

  assert.equal(cobroIdEsObligatorio, true);
  assert.equal(cobroIdHistoricoEsOpcional, true);
  assert.equal(imputacion.cobroId, " receipt / ñ 🧭 ");
  assert.equal(imputacion.moneda, "USD");
  assert.equal(imputacion.id, " allocation / α 😀 ");
  assert.equal(esImputacionCuentaClienteManifestV1(imputacion), true);

  const sinCobroId: ImputacionCuentaCliente = {
    ...imputacion,
    cobroId: undefined,
  };
  assert.equal(esImputacionCuentaClienteManifestV1(sinCobroId), false);
});

test("una imputacion conserva ejecucion, componente y actor sin codificarlos en su id", () => {
  const imputacion: ImputacionCuentaCliente = {
    id: "opaque-allocation-without-business-semantics",
    ejecucionCobroId: "opaque-payment-execution",
    ejecucionCobroManifestVersion: EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
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

  assert.equal(imputacion.ejecucionCobroId, "opaque-payment-execution");
  assert.equal(imputacion.ejecucionCobroManifestVersion, 1);
  assert.equal(imputacion.tipoComponenteEjecucionCobro, "SALDO_FAVOR");
  assert.equal(imputacion.creadoPorId, "opaque-user");
});

test("la lectura historica no inventa actor ni identidad idempotente", () => {
  const ejecucion: EjecucionCobroCliente = {
    contractVersion: EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
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

  assert.equal(ejecucion.creadoPorId, undefined);
  assert.equal(ejecucion.componentes[0]?.id, undefined);
  assert.equal(ejecucion.componentes[0]?.idempotencyKey, undefined);
});

test("distingue resultados parciales y terminales de negocio de recuperacion tecnica", () => {
  const estados = [
    "PARCIALMENTE_CONFIRMADA",
    "RECHAZADA",
    "ANULADA",
    "REVERTIDA",
  ] as const satisfies readonly EstadoEjecucionCobroCliente[];
  const componentes = [
    "PARCIALMENTE_REVERTIDO",
    "RECHAZADO",
    "ANULADO",
    "REVERTIDO",
  ] as const satisfies readonly EstadoComponenteEjecucionCobroCliente[];

  assert.deepEqual(estados, [
    "PARCIALMENTE_CONFIRMADA",
    "RECHAZADA",
    "ANULADA",
    "REVERTIDA",
  ]);
  assert.deepEqual(componentes, [
    "PARCIALMENTE_REVERTIDO",
    "RECHAZADO",
    "ANULADO",
    "REVERTIDO",
  ]);
});

test("conserva monto historico y efecto neto de una compensacion parcial", () => {
  const ejecucion: EjecucionCobroCliente = {
    contractVersion: EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
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

  assert.equal(ejecucion.componentes[0]?.montoAplicado, 100);
  assert.equal(ejecucion.componentes[0]?.montoAplicadoNeto, 60);
  assert.equal(ejecucion.totales.montoRevertido, 40);
});

test("una ejecucion agrupa saldo a favor y varios metodos sin colapsar sus componentes", () => {
  const ejecucionCobroId = "9f5ee15a-opaque-no-business-format";
  const ejecucion: EjecucionCobroCliente = {
    contractVersion: EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
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

  assert.deepEqual(
    ejecucion.componentes.map((componente) => componente.tipo),
    ["DINERO_NUEVO", "DINERO_NUEVO", "SALDO_FAVOR"],
  );
  assert.equal(ejecucion.totales.montoDineroNuevo, 85);
  assert.equal(ejecucion.totales.montoSaldoFavorAplicado, 15);
  assert.equal(ejecucion.totales.montoAplicado, 95);
});

test("detalle versionado conserva recepciones, movimientos e imputaciones separados", () => {
  const ejecucionCobroId = "opaque-execution-2026-09-01";
  const recepcion: RecepcionCobroCliente = {
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
  const movimiento: MovimientoCuentaCliente = {
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
  const imputaciones: ImputacionCuentaCliente[] = [
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
  const ejecucion: EjecucionCobroCliente = {
    contractVersion: EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
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
  const detalle: DetalleEjecucionCobroCliente = {
    contractVersion: EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION,
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

  assert.equal(detalle.recepciones[0]?.ejecucionCobroId, ejecucionCobroId);
  assert.equal(detalle.movimientos[0]?.ejecucionCobroId, ejecucionCobroId);
  assert.equal(detalle.imputaciones.length, 2);
  assert.deepEqual(
    detalle.creditosDestino.map(({ montoAplicado }) => montoAplicado),
    [40, 60],
  );
});

test("detalle conserva N componentes y N transferencias de custodia sin colapsarlas", () => {
  const ejecucionCobroId = " execution / opaque / USD 😀 ";
  const recepciones: RecepcionCobroCliente[] = [
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
  const transferenciasCustodia: TransferenciaCustodiaCobro[] = [
    {
      id: " transfer / one / opaque ",
      recepcionCobroId: recepciones[0]!.id,
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
      recepcionCobroId: recepciones[1]!.id,
      custodioOrigenId: " collector / two ",
      custodioDestinoId: " cashier / two ",
      turnoCajaOrigenId: " mobile turn / two ",
      turnoCajaDestinoId: " cash turn / two ",
      cajaDestinoId: " cashbox / two ",
      estado: "PENDIENTE",
      createdAt: new Date("2026-09-04T18:00:03.000Z"),
    },
  ];
  const imputaciones: ImputacionCuentaClienteManifestV1[] = recepciones.map(
    (recepcion, index) => ({
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
    }),
  );
  const detalle: DetalleEjecucionCobroCliente = {
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
        tipo: "DINERO_NUEVO" as const,
        estado: "CONFIRMADO" as const,
        metodoPago: recepcion.metodoPago,
        recepcionCobroIds: [recepcion.id],
        movimientoIds: [` movement / ${index} / source `],
        imputacionIds: [imputaciones[index]!.id],
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

  assert.equal(detalle.ejecucion.componentes.length, 2);
  assert.equal(detalle.transferenciasCustodia.length, 2);
  assert.deepEqual(
    detalle.transferenciasCustodia.map(
      ({ recepcionCobroId }) => recepcionCobroId,
    ),
    recepciones.map(({ id }) => id),
  );
  assert.deepEqual(
    detalle.imputaciones.map(({ cobroId }) => cobroId),
    recepciones.map(({ id }) => id),
  );
  assert.equal("transferenciaCustodia" in detalle, false);
});
