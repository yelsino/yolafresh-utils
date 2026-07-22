# Migración: `Venta.items[]` a conteo y snapshot canónico

## Estado

Cambio incompatible pendiente de publicación en una versión major.

## Objetivo

Eliminar la duplicación del detalle entre `Venta.items` y `VentaSnapshot.items`.

## Cambio contractual

Antes:

```ts
interface IVenta {
  items: VentaItem[];
}
```

Ahora:

```ts
interface IVenta {
  items: number;
}
```

`VentaItem` deja de exportarse. El detalle único es `VentaSnapshotItem[]`.

## Migración de código consumidor

| Antes | Ahora |
|---|---|
| `venta.items.length` | `venta.items` |
| `venta.items.map(...)` | `snapshot.items.map(...)` |
| `VentaItem` | `VentaSnapshotItem` |
| cálculo desde Venta | leer totales confirmados o snapshot |
| `venta.toVentaSnapshot()` rehidratada | `venta.toVentaSnapshot({ items })` |

## Migración de datos

Procesar cada venta y snapshot como un par:

1. localizar `venta_snapshot` por `ventaId`;
2. si existe y contiene líneas válidas, usarlo como detalle canónico;
3. si no existe, construirlo desde el antiguo `venta.items[]` antes de eliminar el array;
4. completar `nombre` y demás campos históricos sin depender de datos que puedan cambiar después;
5. validar totales y `snapshot.items.length > 0`;
6. reemplazar `venta.items` por `snapshot.items.length`;
7. guardar ambos documentos en una transacción local o workflow idempotente;
8. marcar migración completada sólo cuando ambos lados sean coherentes.

## Casos que deben ir a cuarentena

- venta sin snapshot y sin array antiguo;
- snapshot vacío;
- IDs de venta no coincidentes;
- totales incompatibles;
- líneas sin `id`, `presentacionId` o `nombre` recuperable;
- dos snapshots activos para la misma venta.

No asignar `items = 0` para ocultar una inconsistencia: el contrato exige un entero mayor a cero.

## Sincronización y bootstrap

- usar el ID determinista `${ventaId}:snapshot` cuando corresponda;
- hacer la migración idempotente;
- no volver a publicar el array antiguo;
- descargar resumen de Venta para listados y snapshot sólo cuando se necesite detalle, si la estrategia de bootstrap lo permite;
- detectar y reparar bundles parciales antes de exponer la venta como completa.

## Validación

- ninguna `Venta` serializada contiene un array en `items`;
- no existe export público `VentaItem`;
- para cada venta, `venta.items === snapshot.items.length`;
- reintentar migración no crea otro snapshot;
- historial visual conserva nombre, imagen, unidad y override;
- ventas de contado, crédito, pedido y anuladas mantienen su semántica.

## Rollback

El rollback requiere reconstruir el array antiguo desde `VentaSnapshot.items`. No borrar snapshots durante la ventana de migración.

