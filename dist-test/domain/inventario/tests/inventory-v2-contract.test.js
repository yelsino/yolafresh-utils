"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const index_1 = require("../index");
const ahora = 1786800000000;
const actor = {
    usuarioId: "usuario_001",
    usuarioNombre: "Ana",
    dispositivoId: "tablet_001",
    sesionId: "sesion_001",
};
const conversion = {
    productoBaseId: "producto_arroz",
    presentacionId: "presentacion_saco_3kg",
    unidadOperacion: "saco",
    unidadBase: index_1.UnidadBaseInventarioV2.KILOGRAMO,
    factorUnidadBase: 3,
    precisionCantidadBase: 3,
    versionConversion: 2,
    capturadaAt: ahora,
};
const buildPolitica = (id, alcance, modo) => ({
    id,
    type: index_1.POLITICA_INVENTARIO_TYPE,
    schemaVersion: index_1.INVENTORY_V2_SCHEMA_VERSION,
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
const buildMovimiento = () => ({
    id: "movimiento_001",
    type: index_1.MOVIMIENTO_INVENTARIO_TYPE,
    schemaVersion: index_1.INVENTORY_V2_SCHEMA_VERSION,
    estado: "APLICADO",
    tipo: index_1.TipoMovimientoInventarioV2.SALIDA,
    almacenId: "almacen_001",
    origen: {
        tipo: index_1.OrigenMovimientoInventarioV2.VENTA,
        documentoId: "venta_001",
    },
    items: [{
            id: "linea_001",
            productoBaseId: "producto_arroz",
            almacenId: "almacen_001",
            cantidadOperacion: 2,
            conversionSnapshot: conversion,
            cantidadBaseDelta: -6,
            unidadBase: index_1.UnidadBaseInventarioV2.KILOGRAMO,
        }],
    operationId: "operacion_001",
    idempotencyKey: "venta_001:inventario",
    correlationId: "venta_001",
    actor,
    fechaEfectiva: ahora,
    registradoAt: ahora,
});
(0, node_test_1.default)("el ledger usa un único tipo documental sin sufijo de implementación", () => {
    strict_1.default.equal(index_1.MOVIMIENTO_INVENTARIO_TYPE, "movimiento_inventario");
    strict_1.default.equal(index_1.MOVIMIENTO_INVENTARIO_V2_TYPE, index_1.MOVIMIENTO_INVENTARIO_TYPE);
    strict_1.default.equal(buildMovimiento().type, "movimiento_inventario");
});
(0, node_test_1.default)("convierte cantidades comerciales usando el snapshot congelado", () => {
    strict_1.default.equal((0, index_1.convertirCantidadAUnidadBase)(1.25, conversion), 3.75);
    strict_1.default.equal((0, index_1.calcularDiferenciaConteo)(3.75, 4, 3), -0.25);
    strict_1.default.equal((0, index_1.validarConversionInventario)({ ...conversion, factorUnidadBase: 0 }).valido, false);
});
(0, node_test_1.default)("conversión física exige versión segura con presentación y admite captura base sin versión", () => {
    const directaBase = {
        productoBaseId: "producto_arroz",
        unidadOperacion: index_1.UnidadBaseInventarioV2.KILOGRAMO,
        unidadBase: index_1.UnidadBaseInventarioV2.KILOGRAMO,
        factorUnidadBase: 1,
        precisionCantidadBase: 3,
        capturadaAt: ahora,
    };
    strict_1.default.equal((0, index_1.validarConversionInventario)(directaBase).valido, true);
    const sinVersion = {
        ...conversion,
        versionConversion: undefined,
    };
    strict_1.default.match((0, index_1.validarConversionInventario)(sinVersion).errores.join(" "), /versionConversion.*requerida.*entero seguro positivo/);
    const versionInsegura = {
        ...conversion,
        versionConversion: Number.MAX_SAFE_INTEGER + 1,
    };
    strict_1.default.match((0, index_1.validarConversionInventario)(versionInsegura).errores.join(" "), /entero seguro positivo/);
    const baseConVersionInventada = {
        ...directaBase,
        versionConversion: 1,
    };
    strict_1.default.match((0, index_1.validarConversionInventario)(baseConVersionInventada).errores.join(" "), /no aplica sin presentacionId/);
});
(0, node_test_1.default)("stock se identifica por producto base y almacén", () => {
    strict_1.default.equal((0, index_1.construirIdStockProductoBaseAlmacen)("producto/1", "almacen principal"), "stock_producto_base_almacen:producto%2F1:almacen%20principal");
    strict_1.default.equal((0, index_1.calcularStockDisponibleBase)({
        cantidadFisicaBase: 20,
        cantidadReservadaBase: 3.5,
    }), 16.5);
});
(0, node_test_1.default)("política aplica precedencia producto y almacén sobre empresa", () => {
    const politicas = [
        buildPolitica("politica_empresa", { nivel: index_1.NivelPoliticaInventario.EMPRESA, empresaId: "empresa_001" }, index_1.ModoControlInventario.ESTRICTO),
        buildPolitica("politica_producto_almacen", {
            nivel: index_1.NivelPoliticaInventario.PRODUCTO_ALMACEN,
            empresaId: "empresa_001",
            almacenId: "almacen_001",
            productoBaseId: "producto_arroz",
        }, index_1.ModoControlInventario.SIN_CONTROL),
    ];
    politicas.forEach((politica) => {
        strict_1.default.equal((0, index_1.validarPoliticaInventario)(politica).valido, true);
    });
    const resuelta = (0, index_1.resolverPoliticaInventario)(politicas, {
        empresaId: "empresa_001",
        almacenId: "almacen_001",
        productoBaseId: "producto_arroz",
    });
    strict_1.default.equal(resuelta.modo, index_1.ModoControlInventario.SIN_CONTROL);
    strict_1.default.equal(resuelta.registrarMovimientos, false);
});
(0, node_test_1.default)("movimiento aplicado exige idempotencia, conversión y signo coherente", () => {
    const movimiento = buildMovimiento();
    strict_1.default.equal((0, index_1.validarMovimientoInventarioV2)(movimiento).valido, true);
    const errores = (0, index_1.validarMovimientoInventarioV2)({
        ...movimiento,
        idempotencyKey: "",
        items: [{ ...movimiento.items[0], cantidadBaseDelta: 6 }],
    }).errores.join(" ");
    strict_1.default.match(errores, /idempotencyKey/);
    strict_1.default.match(errores, /signo incompatible/);
});
(0, node_test_1.default)("movimiento físico no acepta una presentación sin versión de conversión", () => {
    const movimiento = buildMovimiento();
    const sinVersion = {
        ...movimiento,
        items: [{
                ...movimiento.items[0],
                conversionSnapshot: {
                    ...movimiento.items[0].conversionSnapshot,
                    versionConversion: undefined,
                },
            }],
    };
    strict_1.default.match((0, index_1.validarMovimientoInventarioV2)(sinVersion).errores.join(" "), /versionConversion.*requerida/);
    const directoBase = {
        ...movimiento,
        items: [{
                ...movimiento.items[0],
                cantidadOperacion: 6,
                cantidadBaseDelta: -6,
                conversionSnapshot: {
                    productoBaseId: "producto_arroz",
                    unidadOperacion: index_1.UnidadBaseInventarioV2.KILOGRAMO,
                    unidadBase: index_1.UnidadBaseInventarioV2.KILOGRAMO,
                    factorUnidadBase: 1,
                    precisionCantidadBase: 3,
                    capturadaAt: ahora,
                },
            }],
    };
    strict_1.default.equal((0, index_1.validarMovimientoInventarioV2)(directoBase).valido, true);
});
(0, node_test_1.default)("conteo guarda cabecera y líneas separadas con cero permitido", () => {
    const linea = {
        id: "conteo_001:producto_arroz",
        type: index_1.CONTEO_INVENTARIO_LINEA_TYPE,
        schemaVersion: index_1.INVENTORY_V2_SCHEMA_VERSION,
        conteoId: "conteo_001",
        productoBaseId: "producto_arroz",
        almacenId: "almacen_001",
        unidadBase: index_1.UnidadBaseInventarioV2.KILOGRAMO,
        cantidadTeoricaBaseAlCorte: 3,
        versionProyeccionAlCorte: 1,
        capturas: [{
                id: "captura_001",
                tipo: index_1.TipoCapturaConteoInventario.CONTEO,
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
        estado: index_1.EstadoLineaConteoInventario.CONTADA,
        createdAt: ahora,
        updatedAt: ahora,
    };
    const conteo = {
        id: "conteo_001",
        type: index_1.CONTEO_INVENTARIO_TYPE,
        schemaVersion: index_1.INVENTORY_V2_SCHEMA_VERSION,
        tipoConteo: index_1.TipoConteoInventario.CICLICO,
        estado: index_1.EstadoConteoInventario.EN_REVISION,
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
    strict_1.default.equal((0, index_1.validarConteoInventarioLinea)(linea).valido, true);
    strict_1.default.equal((0, index_1.validarConteoInventario)(conteo).valido, true);
    strict_1.default.equal("lineas" in conteo, false);
});
(0, node_test_1.default)("ajuste y merma aplicados exigen su movimiento resultante", () => {
    const ajuste = {
        id: "ajuste_001",
        type: index_1.AJUSTE_INVENTARIO_TYPE,
        schemaVersion: index_1.INVENTORY_V2_SCHEMA_VERSION,
        estado: index_1.EstadoAprobacionInventario.APLICADO,
        origen: index_1.OrigenAjusteInventario.CONTEO,
        empresaId: "empresa_001",
        almacenId: "almacen_001",
        conteoInventarioId: "conteo_001",
        lineas: [{
                id: "ajuste_linea_001", productoBaseId: "producto_arroz",
                almacenId: "almacen_001", unidadBase: index_1.UnidadBaseInventarioV2.KILOGRAMO,
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
    const merma = {
        id: "merma_001",
        type: index_1.MERMA_INVENTARIO_TYPE,
        schemaVersion: index_1.INVENTORY_V2_SCHEMA_VERSION,
        estado: index_1.EstadoAprobacionInventario.APLICADO,
        empresaId: "empresa_001",
        almacenId: "almacen_001",
        lineas: [{
                id: "merma_linea_001", productoBaseId: "producto_arroz",
                almacenId: "almacen_001", unidadBase: index_1.UnidadBaseInventarioV2.KILOGRAMO,
                cantidadOperacion: 1, cantidadBase: 3,
                conversionSnapshot: conversion, motivo: index_1.MotivoMermaInventario.DETERIORO,
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
        movimientoInventarioId: (0, index_1.construirIdMovimientoMermaInventarioV2)("merma_001"),
        createdAt: ahora,
        updatedAt: ahora + 3,
    };
    strict_1.default.equal((0, index_1.validarAjusteInventario)(ajuste).valido, true);
    strict_1.default.equal((0, index_1.validarMermaInventario)(merma).valido, true);
    strict_1.default.equal((0, index_1.validarMermaInventario)({ ...merma, movimientoInventarioId: undefined }).valido, false);
});
