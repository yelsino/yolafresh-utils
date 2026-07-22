import assert from "node:assert/strict";
import test from "node:test";

import type { PedidoItem } from "../contracts/pedido.contract";

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
