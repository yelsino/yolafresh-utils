"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const inventory_quantity_v2_contract_1 = require("../contracts/inventory-quantity-v2.contract");
const movimiento_inventario_v2_contract_1 = require("../contracts/movimiento-inventario-v2.contract");
const transferencia_inventario_v2_contract_1 = require("../contracts/transferencia-inventario-v2.contract");
const index_1 = require("../index");
const ahora = 1786800000000;
const accion = (suffix, registradaAt) => ({
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
const accionVersionada = (suffix, registradaAt, expectedVersion) => ({
    ...accion(suffix, registradaAt),
    expectedVersion,
});
const crearLinea = (capturaBase) => {
    const comun = {
        id: "linea_001",
        productoBaseId: "producto_arroz",
        unidadBase: inventory_quantity_v2_contract_1.UnidadBaseInventarioV2.KILOGRAMO,
        cantidadBase: 6,
        lote: "LOTE-01",
        costoUnitarioBaseSnapshot: 2.5,
        monedaCosto: "PEN",
    };
    if (capturaBase) {
        return {
            ...comun,
            cantidadOperacion: 6,
            conversionSnapshot: {
                productoBaseId: "producto_arroz",
                unidadOperacion: inventory_quantity_v2_contract_1.UnidadBaseInventarioV2.KILOGRAMO,
                unidadBase: inventory_quantity_v2_contract_1.UnidadBaseInventarioV2.KILOGRAMO,
                factorUnidadBase: 1,
                precisionCantidadBase: 3,
                capturadaAt: ahora - 1000,
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
            unidadBase: inventory_quantity_v2_contract_1.UnidadBaseInventarioV2.KILOGRAMO,
            factorUnidadBase: 3,
            precisionCantidadBase: 3,
            versionConversion: 4,
            capturadaAt: ahora - 1000,
        },
    };
};
const crearBorrador = (capturaBase = false) => ({
    id: "transferencia_001",
    type: transferencia_inventario_v2_contract_1.TRANSFERENCIA_INVENTARIO_V2_TYPE,
    schemaVersion: inventory_quantity_v2_contract_1.INVENTORY_V2_SCHEMA_VERSION,
    version: 1,
    estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.BORRADOR,
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
const enviar = (borrador = crearBorrador()) => ({
    ...borrador,
    version: 2,
    estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.ENVIADA,
    envio: accionVersionada("enviar", ahora + 1000, 1),
    movimientoSalidaId: (0, index_1.construirIdMovimientoTransferenciaInventarioV2)(borrador.id, "SALIDA"),
    updatedAt: ahora + 1000,
});
const recibo = (transferenciaId, id, expectedVersion, registradaAt, aceptada, rechazada = 0, faltante = 0) => ({
    id,
    ...accionVersionada(id, registradaAt, expectedVersion),
    movimientoEntradaId: (0, index_1.construirIdMovimientoTransferenciaInventarioV2)(transferenciaId, "ENTRADA", id),
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
(0, node_test_1.default)("transferencia V2 acepta presentacion o captura directa en unidad base", () => {
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(crearBorrador()).valido, true);
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(crearBorrador(true)).valido, true);
    const presentacionSinVersion = crearBorrador();
    presentacionSinVersion.items[0] = {
        ...presentacionSinVersion.items[0],
        conversionSnapshot: {
            ...presentacionSinVersion.items[0].conversionSnapshot,
            versionConversion: undefined,
        },
    };
    strict_1.default.match((0, index_1.validarTransferenciaInventarioV2)(presentacionSinVersion).errores.join(" "), /versionConversion.*requerida/);
    const presentacionConVersionInsegura = crearBorrador();
    presentacionConVersionInsegura.items[0] = {
        ...presentacionConVersionInsegura.items[0],
        conversionSnapshot: {
            ...presentacionConVersionInsegura.items[0].conversionSnapshot,
            versionConversion: Number.MAX_SAFE_INTEGER + 1,
        },
    };
    strict_1.default.match((0, index_1.validarTransferenciaInventarioV2)(presentacionConVersionInsegura).errores.join(" "), /entero seguro positivo/);
    const baseInconsistente = crearBorrador(true);
    baseInconsistente.items[0] = {
        ...baseInconsistente.items[0],
        conversionSnapshot: {
            ...baseInconsistente.items[0].conversionSnapshot,
            factorUnidadBase: 2,
        },
    };
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(baseInconsistente).valido, false);
});
(0, node_test_1.default)("ciclo permite cancelar solo antes del envio y recibir en varios eventos", () => {
    strict_1.default.equal((0, index_1.puedeTransicionarTransferenciaInventarioV2)(transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.BORRADOR, transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.ENVIADA), true);
    strict_1.default.equal((0, index_1.puedeAgregarRecepcionTransferenciaInventarioV2)(transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA), true);
    strict_1.default.throws(() => (0, index_1.assertTransicionTransferenciaInventarioV2)(transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.ENVIADA, transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CANCELADA), /transicion_transferencia_inventario_v2_no_permitida/);
    const borrador = crearBorrador();
    const cancelada = {
        ...borrador,
        version: 2,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CANCELADA,
        cancelacion: {
            ...accionVersionada("cancelar", ahora + 1000, 1),
            motivoCodigo: "ERROR_CAPTURA",
        },
        updatedAt: ahora + 1000,
    };
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(cancelada).valido, true);
});
(0, node_test_1.default)("recepciones parciales materializan una entrada determinista por recibo", () => {
    const enviada = enviar();
    const primera = recibo(enviada.id, "recibo_001", 2, ahora + 2000, 2);
    const parcial = {
        ...enviada,
        version: 3,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA,
        recepciones: [primera],
        updatedAt: ahora + 2000,
    };
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(parcial).valido, true);
    strict_1.default.equal((0, index_1.resumirTransferenciaInventarioV2)(parcial).lineas[0].cantidadBaseEnTransito, 4);
    const segunda = recibo(enviada.id, "recibo_002", 3, ahora + 3000, 3, 0, 1);
    const cerrada = {
        ...parcial,
        version: 4,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
        recepciones: [primera, segunda],
        updatedAt: ahora + 3000,
    };
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(cerrada).valido, true);
    strict_1.default.deepEqual((0, index_1.resumirTransferenciaInventarioV2)(cerrada), {
        lineas: [
            {
                lineaTransferenciaId: "linea_001",
                unidadBase: inventory_quantity_v2_contract_1.UnidadBaseInventarioV2.KILOGRAMO,
                cantidadBaseEnviada: 6,
                cantidadBaseAceptada: 5,
                cantidadBaseRechazada: 0,
                cantidadBaseFaltante: 1,
                cantidadBaseEnTransito: 0,
            },
        ],
        totalesPorUnidadBase: [
            {
                unidadBase: inventory_quantity_v2_contract_1.UnidadBaseInventarioV2.KILOGRAMO,
                cantidadBaseEnviada: 6,
                cantidadBaseAceptada: 5,
                cantidadBaseRechazada: 0,
                cantidadBaseFaltante: 1,
                cantidadBaseEnTransito: 0,
            },
        ],
    });
    const movimientos = (0, index_1.construirMovimientosTransferenciaInventarioV2)(cerrada);
    strict_1.default.equal(movimientos.length, 3);
    strict_1.default.equal(movimientos[0].tipo, movimiento_inventario_v2_contract_1.TipoMovimientoInventarioV2.TRANSFERENCIA_SALIDA);
    strict_1.default.equal(movimientos[0].items[0].cantidadBaseDelta, -6);
    strict_1.default.equal(movimientos[1].items[0].cantidadBaseDelta, 2);
    strict_1.default.equal(movimientos[2].items[0].cantidadBaseDelta, 3);
    strict_1.default.notEqual(movimientos[1].id, movimientos[2].id);
    movimientos.forEach((movimiento) => {
        strict_1.default.equal((0, index_1.validarMovimientoInventarioV2)(movimiento).valido, true);
    });
});
(0, node_test_1.default)("cierre de diferencia concilia una transferencia sin inventar una entrada", () => {
    const enviada = enviar();
    const cerrada = {
        ...enviada,
        version: 3,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
        cierreDiferencia: {
            ...accionVersionada("cerrar_diferencia", ahora + 2000, 2),
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
        updatedAt: ahora + 2000,
    };
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(cerrada).valido, true);
    strict_1.default.equal((0, index_1.construirMovimientosTransferenciaInventarioV2)(cerrada).length, 1);
    strict_1.default.equal((0, index_1.resumirTransferenciaInventarioV2)(cerrada).lineas[0].cantidadBaseFaltante, 6);
});
(0, node_test_1.default)("validador rechaza sobre-recepcion, diferencias sin motivo y recibos sin entrada", () => {
    const enviada = enviar();
    const sobreRecibida = {
        ...enviada,
        version: 3,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.RECIBIDA,
        recepciones: [recibo(enviada.id, "recibo_001", 2, ahora + 2000, 7)],
        updatedAt: ahora + 2000,
    };
    strict_1.default.match((0, index_1.validarTransferenciaInventarioV2)(sobreRecibida).errores.join(" "), /excede la cantidad enviada/);
    const diferenciaSinMotivo = recibo(enviada.id, "recibo_002", 2, ahora + 2000, 5, 0, 1);
    diferenciaSinMotivo.items[0].motivoCodigo = undefined;
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)({
        ...enviada,
        version: 3,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
        recepciones: [diferenciaSinMotivo],
        updatedAt: ahora + 2000,
    }).valido, false);
    const sinAceptada = recibo(enviada.id, "recibo_003", 2, ahora + 2000, 0, 0, 6);
    strict_1.default.match((0, index_1.validarTransferenciaInventarioV2)({
        ...enviada,
        version: 3,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.CERRADA_CON_DIFERENCIA,
        recepciones: [sinAceptada],
        updatedAt: ahora + 2000,
    }).errores.join(" "), /debe aceptar stock/);
});
(0, node_test_1.default)("CAS contractual evita que dos tablets sobrescriban la misma version", () => {
    const enviada = enviar();
    const candidataA = {
        ...enviada,
        version: 3,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA,
        recepciones: [recibo(enviada.id, "recibo_A", 2, ahora + 2000, 2)],
        updatedAt: ahora + 2000,
    };
    const candidataB = {
        ...enviada,
        version: 3,
        estado: transferencia_inventario_v2_contract_1.EstadoTransferenciaInventarioV2.PARCIALMENTE_RECIBIDA,
        recepciones: [recibo(enviada.id, "recibo_B", 2, ahora + 2100, 3)],
        updatedAt: ahora + 2100,
    };
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(candidataA).valido, true);
    strict_1.default.equal((0, index_1.validarTransferenciaInventarioV2)(candidataB).valido, true);
    strict_1.default.equal((0, index_1.validarEvolucionTransferenciaInventarioV2)(enviada, candidataA).valido, true);
    strict_1.default.equal((0, index_1.validarEvolucionTransferenciaInventarioV2)(candidataA, candidataA).valido, true, "el replay identico es idempotente");
    strict_1.default.match((0, index_1.validarEvolucionTransferenciaInventarioV2)(candidataA, candidataB).errores.join(" "), /misma version/);
});
(0, node_test_1.default)("la superficie pública exporta los helpers de transferencia", () => {
    const pkg = require("yola-fresh-utils");
    strict_1.default.equal(pkg.TRANSFERENCIA_INVENTARIO_V2_TYPE, transferencia_inventario_v2_contract_1.TRANSFERENCIA_INVENTARIO_V2_TYPE);
    strict_1.default.equal(typeof pkg.validarTransferenciaInventarioV2, "function");
    strict_1.default.equal(typeof pkg.validarEvolucionTransferenciaInventarioV2, "function");
    strict_1.default.equal(typeof pkg.resumirTransferenciaInventarioV2, "function");
    strict_1.default.equal(typeof pkg.validarEvolucionPoliticaInventario, "function");
    strict_1.default.equal(typeof pkg.validarEvolucionMermaInventario, "function");
    strict_1.default.equal(typeof pkg.construirMovimientoAplicacionMermaInventarioV2, "function");
    strict_1.default.equal("EstadoTransferenciaEnum" in pkg, false);
});
