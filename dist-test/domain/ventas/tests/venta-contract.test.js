"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const persons_contract_1 = require("../../personas/contracts/persons.contract");
const enums_1 = require("../../shared/kernel/enums");
const CarritoVenta_1 = require("../entities/CarritoVenta");
const Venta_1 = require("../entities/Venta");
const VentaSnapshot_1 = require("../entities/VentaSnapshot");
function buildSnapshotItem(overrides = {}) {
    return {
        id: "item_001",
        presentacionId: "pres_001",
        nombre: "Producto test",
        cantidadVendida: 2,
        precioUnitario: 5,
        total: 10,
        ...overrides,
    };
}
function buildVentaInput(overrides = {}) {
    return {
        id: "venta_test_001",
        nombre: "Venta test",
        type: "venta",
        estado: enums_1.VentaState.CONFIRMADA,
        condicionPago: enums_1.CondicionPagoVenta.CONTADO,
        items: 1,
        snapshotItems: [buildSnapshotItem()],
        subtotal: 10,
        impuesto: 0,
        total: 10,
        procedencia: CarritoVenta_1.ProcedenciaVenta.Tienda,
        ...overrides,
    };
}
function buildCliente() {
    return {
        id: "cliente_001",
        tipoEntidad: "Cliente",
        createdAt: new Date("2026-07-08T10:00:00.000Z"),
        updatedAt: new Date("2026-07-08T10:00:00.000Z"),
        activo: true,
        nombres: "Cliente Test",
        celular: "999999999",
        correo: "cliente@test.com",
        dni: "12345678",
        direccion: "Av. Test 123",
        pseudonimo: "cliente-test",
        historialCompras: [],
        totalGastado: 0,
        categoriaCliente: persons_contract_1.CategoriaCliente.REGULAR,
    };
}
function buildPersonal() {
    return {
        id: "usuario_001",
        username: "vendedor.test",
        passwordHash: "hash",
        roles: [],
        entidades: [],
        activo: true,
        createdAt: new Date("2026-07-08T10:00:00.000Z"),
        updatedAt: new Date("2026-07-08T10:00:00.000Z"),
        intentosFallidos: 0,
        cuentaBloqueada: false,
        emailVerificado: true,
    };
}
function buildCarrito() {
    return {
        id: "cart_001",
        createdAt: new Date("2026-07-08T10:00:00.000Z"),
        updatedAt: new Date("2026-07-08T10:00:00.000Z"),
        nombre: "Mostrador 1",
        items: [
            {
                id: "item_001",
                product: {
                    id: "pres_001",
                    nombre: "Producto test",
                    precioVenta: 10,
                    unidadContenido: "unidad",
                    imagen: {
                        base: "producto.jpg",
                        sizes: {
                            small: "producto-small.jpg",
                            medium: "producto-medium.jpg",
                            large: "producto-large.jpg",
                        },
                    },
                },
                quantity: 1,
                precioUnitario: 10,
                montoTotal: 10,
            },
        ],
        subtotal: 10,
        impuesto: 0,
        total: 10,
        descuentoTotal: 0,
        cantidadItems: 1,
        cantidadTotal: 1,
        procedencia: CarritoVenta_1.ProcedenciaVenta.Tienda,
        cliente: buildCliente(),
        personal: buildPersonal(),
    };
}
(0, node_test_1.default)("Venta conserva condición de pago en el resumen serializado", () => {
    const venta = new Venta_1.Venta(buildVentaInput({ condicionPago: enums_1.CondicionPagoVenta.CREDITO }));
    strict_1.default.equal(venta.condicionPago, enums_1.CondicionPagoVenta.CREDITO);
    strict_1.default.equal(venta.toJSON().condicionPago, enums_1.CondicionPagoVenta.CREDITO);
});
(0, node_test_1.default)("Venta rechaza creación sin condición de pago", () => {
    strict_1.default.throws(() => new Venta_1.Venta(buildVentaInput({
        condicionPago: undefined,
    })), /CondicionPago es requerida/);
});
(0, node_test_1.default)("Venta.items es un conteo entero mayor a cero", () => {
    strict_1.default.throws(() => new Venta_1.Venta(buildVentaInput({ items: 0, snapshotItems: [] })), /Venta\.items debe ser un entero mayor a 0/);
    strict_1.default.throws(() => new Venta_1.Venta(buildVentaInput({ items: 1.5, snapshotItems: undefined })), /Venta\.items debe ser un entero mayor a 0/);
});
(0, node_test_1.default)("Venta valida que el conteo coincida con el snapshot transitorio", () => {
    strict_1.default.throws(() => new Venta_1.Venta(buildVentaInput({
        items: 2,
        snapshotItems: [buildSnapshotItem()],
    })), /Venta\.items debe coincidir con la cantidad de VentaSnapshot\.items/);
});
(0, node_test_1.default)("Venta.toJSON no duplica el array de detalle", () => {
    const venta = new Venta_1.Venta(buildVentaInput());
    const serialized = venta.toJSON();
    strict_1.default.equal(serialized.items, 1);
    strict_1.default.equal(Array.isArray(serialized.items), false);
    strict_1.default.equal("snapshotItems" in serialized, false);
});
(0, node_test_1.default)("Venta.fromCarritoVenta construye conteo y snapshot histórico", () => {
    var _a, _b, _c;
    const cliente = buildCliente();
    const personal = buildPersonal();
    const carrito = { ...buildCarrito(), cliente, personal };
    const ventaContado = Venta_1.Venta.fromCarritoVenta(carrito, "venta_contado");
    const ventaCredito = Venta_1.Venta.fromCarritoVenta(carrito, "venta_credito", {
        condicionPago: enums_1.CondicionPagoVenta.CREDITO,
    });
    const snapshot = ventaContado.toVentaSnapshot();
    strict_1.default.equal(ventaContado.items, 1);
    strict_1.default.equal(ventaCredito.condicionPago, enums_1.CondicionPagoVenta.CREDITO);
    strict_1.default.equal(ventaContado.clienteId, cliente.id);
    strict_1.default.equal(ventaContado.vendedorId, personal.id);
    strict_1.default.equal(snapshot.items.length, ventaContado.items);
    strict_1.default.equal((_a = snapshot.items[0]) === null || _a === void 0 ? void 0 : _a.nombre, "Producto test");
    strict_1.default.equal((_b = snapshot.items[0]) === null || _b === void 0 ? void 0 : _b.unidadComercial, "unidad");
    strict_1.default.equal((_c = snapshot.items[0]) === null || _c === void 0 ? void 0 : _c.imagenUrl, "producto-small.jpg");
});
(0, node_test_1.default)("VentaSnapshot conserva el vínculo comercial hacia inventario", () => {
    const carrito = buildCarrito();
    Object.assign(carrito.items[0].product, {
        productoBaseId: "producto_base_001",
        unidadBaseInventario: "unidad",
        equivalenciaUnidadBase: 12,
        versionConversion: 3,
    });
    const snapshot = Venta_1.Venta.fromCarritoVenta(carrito, "venta_inventory_v2").toVentaSnapshot({ almacenOrigenId: "almacen_001" });
    const item = snapshot.items[0];
    strict_1.default.equal(snapshot.almacenOrigenId, "almacen_001");
    strict_1.default.equal(item === null || item === void 0 ? void 0 : item.cantidadVendida, 1);
    strict_1.default.equal(item === null || item === void 0 ? void 0 : item.productoBaseId, "producto_base_001");
    strict_1.default.equal(item === null || item === void 0 ? void 0 : item.unidadBase, "unidad");
    strict_1.default.equal(item === null || item === void 0 ? void 0 : item.factorConversionBase, 12);
    strict_1.default.equal(item === null || item === void 0 ? void 0 : item.cantidadBase, 12);
    strict_1.default.equal(item === null || item === void 0 ? void 0 : item.versionConversion, 3);
});
(0, node_test_1.default)("VentaSnapshot conserva un plan de inventario total, disjunto y completo", () => {
    var _a, _b;
    const controlled = buildSnapshotItem({
        id: "item_controlado",
        productoBaseId: "base_controlada",
        unidadBase: "unidad",
        factorConversionBase: 12,
        cantidadBase: 24,
        versionConversion: 2,
    });
    const omitted = buildSnapshotItem({
        id: "item_omitido",
        afectaInventario: false,
    });
    const snapshot = new VentaSnapshot_1.VentaSnapshot({
        id: "venta_plan:snapshot",
        ventaId: "venta_plan",
        createdAt: 1000,
        almacenOrigenId: "almacen_001",
        items: [controlled, omitted],
        subtotal: 20,
        impuesto: 0,
        total: 20,
        planInventarioV2: {
            schema: VentaSnapshot_1.VENTA_INVENTORY_PLAN_SCHEMA,
            version: VentaSnapshot_1.VENTA_INVENTORY_PLAN_VERSION,
            resueltoAt: 900,
            almacenId: "almacen_001",
            actor: {
                usuarioId: "vendedor_001",
                usuarioNombre: "Operador original",
                dispositivoId: "tablet_001",
                sesionId: "sesion_001",
            },
            registrarMovimientoItemIds: ["item_controlado"],
            omitidosPorPoliticaItemIds: ["item_omitido"],
        },
    }).toJSON();
    strict_1.default.deepEqual(snapshot.planInventarioV2, {
        schema: VentaSnapshot_1.VENTA_INVENTORY_PLAN_SCHEMA,
        version: VentaSnapshot_1.VENTA_INVENTORY_PLAN_VERSION,
        resueltoAt: 900,
        almacenId: "almacen_001",
        actor: {
            usuarioId: "vendedor_001",
            usuarioNombre: "Operador original",
            dispositivoId: "tablet_001",
            sesionId: "sesion_001",
        },
        registrarMovimientoItemIds: ["item_controlado"],
        omitidosPorPoliticaItemIds: ["item_omitido"],
    });
    strict_1.default.equal((_a = snapshot.items[1]) === null || _a === void 0 ? void 0 : _a.afectaInventario, false);
    strict_1.default.equal((_b = snapshot.items[1]) === null || _b === void 0 ? void 0 : _b.productoBaseId, undefined);
});
(0, node_test_1.default)("VentaSnapshot exige snapshot físico solo a líneas registradas", () => {
    const registeredWithoutSnapshot = buildSnapshotItem({
        id: "item_registrado_sin_snapshot",
    });
    strict_1.default.throws(() => new VentaSnapshot_1.VentaSnapshot({
        id: "venta_plan_sin_snapshot:snapshot",
        ventaId: "venta_plan_sin_snapshot",
        createdAt: 1000,
        almacenOrigenId: "almacen_001",
        items: [registeredWithoutSnapshot],
        subtotal: 10,
        impuesto: 0,
        total: 10,
        planInventarioV2: {
            schema: VentaSnapshot_1.VENTA_INVENTORY_PLAN_SCHEMA,
            version: VentaSnapshot_1.VENTA_INVENTORY_PLAN_VERSION,
            resueltoAt: 900,
            almacenId: "almacen_001",
            actor: { usuarioId: "vendedor_001" },
            registrarMovimientoItemIds: [registeredWithoutSnapshot.id],
            omitidosPorPoliticaItemIds: [],
        },
    }), /productoBaseId.*requerido por planInventarioV2/);
});
(0, node_test_1.default)("VentaSnapshot permite legado comercial, pero una salida planificada exige versión segura", () => {
    var _a;
    const legacy = new VentaSnapshot_1.VentaSnapshot({
        id: "venta_legacy:snapshot",
        ventaId: "venta_legacy",
        createdAt: 1000,
        items: [buildSnapshotItem()],
        subtotal: 10,
        impuesto: 0,
        total: 10,
    });
    strict_1.default.equal((_a = legacy.items[0]) === null || _a === void 0 ? void 0 : _a.versionConversion, undefined);
    const itemSinVersion = buildSnapshotItem({
        productoBaseId: "base_001",
        unidadBase: "unidad",
        factorConversionBase: 1,
        cantidadBase: 2,
    });
    const plan = {
        schema: VentaSnapshot_1.VENTA_INVENTORY_PLAN_SCHEMA,
        version: VentaSnapshot_1.VENTA_INVENTORY_PLAN_VERSION,
        resueltoAt: 900,
        almacenId: "almacen_001",
        actor: { usuarioId: "vendedor_001" },
        registrarMovimientoItemIds: [itemSinVersion.id],
        omitidosPorPoliticaItemIds: [],
    };
    strict_1.default.throws(() => new VentaSnapshot_1.VentaSnapshot({
        id: "venta_sin_version:snapshot",
        ventaId: "venta_sin_version",
        createdAt: 1000,
        almacenOrigenId: "almacen_001",
        items: [itemSinVersion],
        subtotal: 10,
        impuesto: 0,
        total: 10,
        planInventarioV2: plan,
    }), /versionConversion.*requerida.*entero seguro positivo/);
    strict_1.default.throws(() => new VentaSnapshot_1.VentaSnapshot({
        id: "venta_version_insegura:snapshot",
        ventaId: "venta_version_insegura",
        createdAt: 1000,
        almacenOrigenId: "almacen_001",
        items: [{
                ...itemSinVersion,
                versionConversion: Number.MAX_SAFE_INTEGER + 1,
            }],
        subtotal: 10,
        impuesto: 0,
        total: 10,
        planInventarioV2: plan,
    }), /versionConversion.*entero seguro positivo/);
});
(0, node_test_1.default)("VentaSnapshot rechaza planes de inventario ambiguos o parciales", () => {
    const item = buildSnapshotItem({
        productoBaseId: "base_001",
        unidadBase: "unidad",
        factorConversionBase: 1,
        cantidadBase: 2,
        versionConversion: 1,
    });
    strict_1.default.throws(() => new VentaSnapshot_1.VentaSnapshot({
        id: "venta_plan_invalido:snapshot",
        ventaId: "venta_plan_invalido",
        createdAt: 1000,
        almacenOrigenId: "almacen_001",
        items: [item],
        subtotal: 10,
        impuesto: 0,
        total: 10,
        planInventarioV2: {
            schema: VentaSnapshot_1.VENTA_INVENTORY_PLAN_SCHEMA,
            version: VentaSnapshot_1.VENTA_INVENTORY_PLAN_VERSION,
            resueltoAt: 900,
            almacenId: "almacen_001",
            actor: { usuarioId: "vendedor_001" },
            registrarMovimientoItemIds: [item.id],
            omitidosPorPoliticaItemIds: [item.id],
        },
    }), /ambas particiones/);
    strict_1.default.throws(() => new VentaSnapshot_1.VentaSnapshot({
        id: "venta_plan_sin_actor:snapshot",
        ventaId: "venta_plan_sin_actor",
        createdAt: 1000,
        almacenOrigenId: "almacen_001",
        items: [item],
        subtotal: 10,
        impuesto: 0,
        total: 10,
        planInventarioV2: {
            schema: VentaSnapshot_1.VENTA_INVENTORY_PLAN_SCHEMA,
            version: VentaSnapshot_1.VENTA_INVENTORY_PLAN_VERSION,
            resueltoAt: 900,
            almacenId: "almacen_001",
            registrarMovimientoItemIds: [item.id],
            omitidosPorPoliticaItemIds: [],
        },
    }), /actor\.usuarioId es requerido/);
});
(0, node_test_1.default)("Venta rehidratada exige detalle explícito para construir snapshot", () => {
    const original = new Venta_1.Venta(buildVentaInput());
    const rehidratada = new Venta_1.Venta(original.toJSON());
    strict_1.default.throws(() => rehidratada.toVentaSnapshot(), /VentaSnapshotBuildContext\.items es requerido/);
    const snapshot = rehidratada.toVentaSnapshot({ items: [buildSnapshotItem()] });
    strict_1.default.equal(snapshot.items.length, rehidratada.items);
});
(0, node_test_1.default)("VentaSnapshot rechaza detalle que no coincide con Venta.items", () => {
    const venta = new Venta_1.Venta(buildVentaInput({ items: 2, snapshotItems: undefined }));
    strict_1.default.throws(() => venta.toVentaSnapshot({ items: [buildSnapshotItem()] }), /Venta\.items debe coincidir con la cantidad de VentaSnapshot\.items/);
});
(0, node_test_1.default)("VentaSnapshot preserva información histórica y override", () => {
    var _a, _b, _c, _d;
    const item = buildSnapshotItem({
        nombre: "Zanahoria orgánica",
        imagenUrl: "zanahoria.jpg",
        unidadComercial: "kilogramo",
        montoModificado: true,
    });
    const venta = new Venta_1.Venta(buildVentaInput({ items: 1, snapshotItems: [item] }));
    const snapshot = venta.toVentaSnapshot();
    strict_1.default.equal((_a = snapshot.items[0]) === null || _a === void 0 ? void 0 : _a.nombre, "Zanahoria orgánica");
    strict_1.default.equal((_b = snapshot.items[0]) === null || _b === void 0 ? void 0 : _b.imagenUrl, "zanahoria.jpg");
    strict_1.default.equal((_c = snapshot.items[0]) === null || _c === void 0 ? void 0 : _c.unidadComercial, "kilogramo");
    strict_1.default.equal((_d = snapshot.items[0]) === null || _d === void 0 ? void 0 : _d.montoModificado, true);
});
(0, node_test_1.default)("VentaSnapshot acepta descuento y montoRedondeo firmado", () => {
    const item = buildSnapshotItem({
        cantidadVendida: 1,
        precioUnitario: 10,
        total: 10,
        descuento: 2,
    });
    const venta = new Venta_1.Venta(buildVentaInput({
        items: 1,
        snapshotItems: [item],
        subtotal: 10,
        impuesto: 0,
        total: 7.8,
        montoRedondeo: -0.2,
    }));
    const snapshot = venta.toVentaSnapshot();
    strict_1.default.equal(snapshot.descuentoTotal, 2);
    strict_1.default.equal(snapshot.montoRedondeo, -0.2);
    strict_1.default.equal(snapshot.total, 7.8);
});
(0, node_test_1.default)("Venta.tryToVentaSnapshot no lanza si el snapshot estricto falla", () => {
    const venta = new Venta_1.Venta(buildVentaInput({ total: 999 }));
    const result = venta.tryToVentaSnapshot();
    strict_1.default.equal(result.snapshot, undefined);
    strict_1.default.ok(result.error instanceof Error);
    strict_1.default.match(result.error.message, /VentaSnapshot\.total debe ser consistente/);
});
(0, node_test_1.default)("VentaSnapshot trata confirmada y anulada como estados finales", () => {
    strict_1.default.equal((0, VentaSnapshot_1.isVentaSnapshotImmutableState)(enums_1.VentaState.CONFIRMADA), true);
    strict_1.default.equal((0, VentaSnapshot_1.isVentaSnapshotImmutableState)(enums_1.VentaState.ANULADA), true);
    strict_1.default.equal((0, VentaSnapshot_1.isVentaSnapshotImmutableState)("DESPACHADA"), false);
});
(0, node_test_1.default)("CarritoVenta preserva precioUnitario cuando montoTotal es manual", () => {
    const carrito = new CarritoVenta_1.CarritoVenta("cart_override");
    carrito.agregarProducto({
        id: "item_001",
        product: {
            id: "pres_001",
            nombre: "Zanahoria",
            precioVenta: 1.8,
        },
        quantity: 1,
        precioUnitario: 1.8,
        montoTotal: 1.4,
        montoModificado: true,
    });
    const item = carrito.items[0];
    strict_1.default.ok(item);
    strict_1.default.equal(item.precioUnitario, 1.8);
    strict_1.default.equal(item.montoTotal, 1.4);
    strict_1.default.equal(item.montoModificado, true);
});
(0, node_test_1.default)("CarritoVenta invalida montoModificado al cambiar cantidad", () => {
    const carrito = new CarritoVenta_1.CarritoVenta("cart_quantity_reset");
    carrito.agregarProducto({
        id: "item_001",
        product: {
            id: "pres_001",
            nombre: "Zanahoria",
            precioVenta: 1.8,
        },
        quantity: 1,
        precioUnitario: 1.8,
        montoTotal: 1.4,
        montoModificado: true,
    });
    carrito.incrementarCantidad("item_001");
    const item = carrito.items[0];
    strict_1.default.ok(item);
    strict_1.default.equal(item.quantity, 2);
    strict_1.default.equal(item.precioUnitario, 1.8);
    strict_1.default.equal(item.montoModificado, false);
    strict_1.default.equal(item.montoTotal, 3.6);
});
(0, node_test_1.default)("CarritoVenta conserva redondeo monetario a 2 decimales", () => {
    var _a;
    const carrito = new CarritoVenta_1.CarritoVenta("cart_rounding");
    carrito.agregarProducto({
        id: "item_001",
        product: {
            id: "pres_001",
            nombre: "Producto test",
            precioVenta: 18.45,
        },
        quantity: 1,
        precioUnitario: 18.45,
    });
    strict_1.default.equal((_a = carrito.items[0]) === null || _a === void 0 ? void 0 : _a.montoTotal, 18.45);
    strict_1.default.equal(carrito.subtotal, 18.45);
});
(0, node_test_1.default)("CarritoVenta actualiza updatedAt al mutar items", () => {
    const carrito = new CarritoVenta_1.CarritoVenta("cart_touch");
    carrito.updatedAt = new Date("2020-01-01T00:00:00.000Z");
    carrito.agregarProducto({
        id: "item_001",
        product: {
            id: "pres_001",
            nombre: "Producto test",
            precioVenta: 5,
        },
        quantity: 1,
    });
    strict_1.default.ok(carrito.updatedAt.getTime() >
        new Date("2020-01-01T00:00:00.000Z").getTime());
});
(0, node_test_1.default)("CarritoVenta.fromJSON rechaza quantity inválida", () => {
    const carritoCorrupto = {
        ...buildCarrito(),
        id: "cart_bad",
        items: [
            {
                id: "item_001",
                product: {
                    id: "pres_001",
                    nombre: "Producto test",
                    precioVenta: 10,
                },
                quantity: "abc",
                precioUnitario: 10,
                montoTotal: 10,
            },
        ],
    };
    strict_1.default.throws(() => CarritoVenta_1.CarritoVenta.fromJSON(carritoCorrupto), /CarritoVenta\.items\[0\]\.quantity debe ser un número finito/);
});
