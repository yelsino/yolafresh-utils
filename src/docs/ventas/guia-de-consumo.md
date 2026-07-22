# Guía de consumo del Domain de Ventas

## Propósito

Explicar cómo consumir el contrato compacto de `Venta` y su detalle canónico `VentaSnapshot`.

## Secuencia recomendada

### 1. Capturar la operación

Usar `CarritoVenta` mientras el usuario agrega o modifica productos. No usar `Venta` como carrito editable.

### 2. Construir venta y snapshot

```ts
import { Venta } from "yola-fresh-utils/ventas/entities";

const venta = Venta.fromCarritoVenta(carrito, ventaId, {
  condicionPago,
  pedidoId,
  montoRedondeo,
});

const ventaDoc = venta.toJSON();
const snapshotResult = venta.tryToVentaSnapshot({ cliente, vendedor });

if (!snapshotResult.snapshot) {
  throw snapshotResult.error;
}

const snapshotDoc = snapshotResult.snapshot;
```

Resultado:

- `ventaDoc.items` es un número;
- `snapshotDoc.items` es el único array detallado;
- ambos comparten la identidad por `snapshotDoc.ventaId`;
- la cantidad debe coincidir.

### 3. Persistir como una unidad

El consumer debe guardar Venta y snapshot en una misma transacción local o workflow reanudable.

No corresponde:

- guardar la venta y dejar el snapshot para una tarea no controlada;
- duplicar `snapshot.items` dentro de otro campo de Venta;
- considerar confirmada una escritura parcial;
- usar un ID de snapshot no determinista para reintentos.

### 4. Leer resumen o detalle

Para listados ligeros:

- leer `IVenta`;
- usar `items` como cantidad de líneas;
- usar subtotal, impuesto y total ya confirmados.

Para voucher, detalle o historial:

- leer `IVentaSnapshot` por `ventaId`;
- mostrar `VentaSnapshotItem.nombre`, imagen, unidad, cantidad, precio y ajustes;
- validar que la longitud coincide con `Venta.items`.

No volver a consultar el catálogo vivo para reconstruir nombres históricos.

### 5. Rehidratar una Venta

Una venta creada desde `IVenta` sólo conoce el conteo. Para volver a construir su snapshot hay que proporcionar el detalle:

```ts
const venta = new Venta(ventaDoc);
const snapshot = venta.toVentaSnapshot({
  items: snapshotDoc.items,
  cliente: snapshotDoc.cliente,
  vendedor: snapshotDoc.vendedor,
});
```

Llamar `toVentaSnapshot()` sin detalle sobre una venta rehidratada produce error explícito.

## Imports públicos

```ts
import type {
  IVenta,
  VentaCreateInput,
  IVentaSnapshot,
  VentaSnapshotItem,
} from "yola-fresh-utils/ventas/contracts";

import {
  CondicionPagoVenta,
  VentaState,
} from "yola-fresh-utils/shared/kernel";
```

`VentaItem` ya no existe en la surface pública.

## Cobro y tesorería

Si entra dinero real:

- validar o registrar `Pago` cuando exista;
- registrar `MovimientoCaja`;
- no guardar cobro dentro de Venta o snapshot.

## Cuenta cliente

Si la venta genera deuda o consume saldo:

- registrar `MovimientoCuentaCliente`;
- usar `ImputacionCuentaCliente` para aplicaciones entre crédito y débito;
- no guardar saldo dentro de Venta.

## Inventario

Si la venta afecta stock:

- generar `MovimientoInventario`;
- usar la venta como referencia documental;
- obtener líneas desde el snapshot o desde el comando original, no desde `Venta.items`.

## Errores de modelado a evitar

- `venta.items.map(...)`;
- importar `VentaItem`;
- interpretar `Venta.items` como cantidad física vendida;
- reconstruir detalle desde catálogo vivo;
- persistir `snapshotItems` dentro de Venta;
- permitir conteo diferente al array del snapshot;
- usar Venta como pago, caja, deuda o movimiento de stock.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [migracion-venta-items-conteo.md](./migracion-venta-items-conteo.md)
- [relaciones-interdominio.md](./relaciones-interdominio.md)
