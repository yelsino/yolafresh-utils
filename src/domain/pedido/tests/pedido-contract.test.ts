import assert from "node:assert/strict";
import test from "node:test";

import {
  PEDIDO_DOCUMENT_SCHEMA_VERSION,
  type Pedido,
  type PedidoItem,
} from "../contracts/pedido.contract";
import { TipoVentaEnum } from "../../inventario/contracts/producto.contract";

test("PedidoItem conserva snapshot visual y señal de monto modificado", () => {
  const item: PedidoItem = {
    id: "pedido_item_001",
    presentacionId: "pres_001",
    nombre: "Café americano",
    cantidadSolicitada: 2,
    cantidadAtendida: 1,
    precioUnitario: 8,
    subtotal: 16,
    montoModificado: true,
    unidadComercial: "taza",
    imagenUrl: "cafe-americano.jpg",
  };

  assert.equal(item.nombre, "Café americano");
  assert.equal(item.montoModificado, true);
  assert.equal(item.unidadComercial, "taza");
  assert.equal(item.imagenUrl, "cafe-americano.jpg");
});

test("PedidoItem schema 3 congela la decision y conversion de inventario", () => {
  const inventariable: PedidoItem = {
    id: "pedido_item_stock",
    presentacionId: "pres_stock",
    nombre: "Arroz saco",
    cantidadSolicitada: 2,
    cantidadAtendida: 0,
    precioUnitario: 80,
    subtotal: 160,
    afectaInventario: true,
    tipoVenta: TipoVentaEnum.Unidad,
    productoBaseId: "producto_arroz",
    factorUnidadBase: 50,
    unidadBaseInventario: "kilogramo",
    versionConversion: 4,
  };
  const servicio: PedidoItem = {
    id: "pedido_item_servicio",
    presentacionId: "servicio_delivery",
    nombre: "Delivery",
    cantidadSolicitada: 1,
    cantidadAtendida: 0,
    precioUnitario: 5,
    subtotal: 5,
    afectaInventario: false,
    tipoVenta: TipoVentaEnum.Unidad,
  };

  assert.equal(inventariable.afectaInventario, true);
  assert.equal(inventariable.factorUnidadBase, 50);
  assert.equal(inventariable.versionConversion, 4);
  assert.equal(servicio.afectaInventario, false);
  assert.equal(servicio.productoBaseId, undefined);
});

test("Pedido conserva checklist colaborativo, confirmacion y auditoria por actor", () => {
  const changedAt = new Date("2026-08-21T20:15:00.000Z");
  const pedido: Pedido = {
    id: "pedido_001",
    type: "pedido",
    schemaVersion: PEDIDO_DOCUMENT_SCHEMA_VERSION,
    codigoPedido: "PED-001",
    estado: "ABIERTO" as Pedido["estado"],
    prioridad: "NORMAL" as Pedido["prioridad"],
    creadoPorId: "usuario_creador",
    fechaPedido: changedAt,
    items: [
      {
        id: "pedido_item_001",
        presentacionId: "pres_001",
        nombre: "Café americano",
        cantidadSolicitada: 2,
        cantidadAtendida: 0,
        precioUnitario: 8,
        subtotal: 16,
        afectaInventario: true,
        tipoVenta: TipoVentaEnum.Unidad,
        productoBaseId: "producto_cafe",
        factorUnidadBase: 1,
        unidadBaseInventario: "unidad",
        versionConversion: 1,
        checklist: {
          marcado: true,
          actualizadoPorId: "usuario_prepara",
          actualizadoPorNombre: "Ana",
          dispositivoId: "tablet-cocina",
          actualizadoAt: changedAt,
          revision: 1,
        },
      },
    ],
    checklist: {
      estado: "COMPLETADO",
      completado: true,
      version: 2,
      actualizadoAt: changedAt,
      confirmadoAt: changedAt,
      confirmadoPorId: "usuario_prepara",
      confirmadoPorNombre: "Ana",
      confirmadoDesdeDispositivoId: "tablet-cocina",
      historial: [
        {
          id: "operation-001",
          operacionId: "pedido-operation-001",
          comandoHash: "sha256-command-001",
          accion: "ITEM_MARCADO",
          itemId: "pedido_item_001",
          marcado: true,
          usuarioId: "usuario_prepara",
          usuarioNombre: "Ana",
          dispositivoId: "tablet-cocina",
          fecha: changedAt,
        },
      ],
    },
    subtotal: 16,
    total: 16,
    createdAt: changedAt,
    updatedAt: changedAt,
  };

  assert.equal(pedido.schemaVersion, 3);
  assert.equal(pedido.items[0]?.checklist?.actualizadoPorNombre, "Ana");
  assert.equal(pedido.checklist?.completado, true);
  assert.equal(pedido.checklist?.historial[0]?.accion, "ITEM_MARCADO");
  assert.equal(
    pedido.checklist?.historial[0]?.operacionId,
    "pedido-operation-001",
  );
  assert.equal(
    pedido.checklist?.historial[0]?.comandoHash,
    "sha256-command-001",
  );
  // Una cantidad atendida cero es valida: significa sin disponibilidad, no
  // que la linea haya quedado sin revisar.
  assert.equal(pedido.items[0]?.cantidadAtendida, 0);
});
