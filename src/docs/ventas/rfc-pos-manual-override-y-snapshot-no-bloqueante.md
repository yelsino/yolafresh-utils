# RFC: POS Manual Override y Snapshot No Bloqueante

> RFC implementado históricamente. Su semántica de override sigue vigente, pero
> cualquier referencia a detalle dentro de `Venta` queda sustituida por el modelo
> de [snapshot canónico](./migracion-venta-items-conteo.md).

## Estado

Aceptado e implementado entre `v1.0.6` y `v1.0.7`.

## Propósito

Este RFC explica dos correcciones de dominio realizadas en `yolafresh-utils` para flujos POS críticos:

- corrección de semántica de override manual por línea en `CarritoVenta`;
- corrección de semántica y uso de `VentaSnapshot` para que no bloquee la venta operativa.

El objetivo es que consumers entiendan:

- qué cambió;
- por qué cambió;
- cómo deben adaptar su implementación;
- qué reglas nuevas deben respetar.

## Contexto

La librería tiene propósito estricto:

- publicar contratos canónicos compartidos;
- preservar semántica de negocio;
- evitar que cada consumer redefina ventas, totales y snapshots con reglas distintas.

Ese propósito se rompe si la librería:

- reinterpreta un total manual como precio unitario;
- o exige un snapshot histórico incompleto como gate duro de una venta operativa válida.

## Caso 1. Override manual en `CarritoVenta`

### Problema detectado

La implementación previa de `CarritoVenta` alteraba `precioUnitario` cuando `montoModificado = true`.

Evidencia:

- [CarritoVenta.ts](../../domain/ventas/entities/CarritoVenta.ts)

Lectura del problema:

- POS podía fijar un `montoTotal` manual por línea;
- la librería convertía ese total en nuevo `precioUnitario`;
- el dato original de precio quedaba destruido;
- la línea pasaba a representar un prorrateo matemático, no un precio unitario real.

Eso contaminaba:

- edición posterior;
- auditoría;
- histórico visible;
- interpretación comercial de la línea.

### Decisión

Se decide que:

- `montoModificado` preserva un `montoTotal` manual;
- `montoModificado` no autoriza reinterpretar `precioUnitario`;
- `precioUnitario` mantiene su semántica de precio por unidad;
- si cambia `quantity`, el override manual previo deja de aplicar y la línea vuelve a cálculo normal.

### Regla canónica

Cuando `montoModificado = true`:

- se conserva `montoTotal`;
- no se recalcula `precioUnitario` desde `montoTotal`;
- `montoTotal` sigue representando monto bruto de línea;
- el histórico debe preservar que hubo override manual.

Cuando cambia `quantity` en una línea con override:

- `montoModificado` pasa a `false`;
- `montoTotal` se recalcula desde `precioUnitario` y `quantity`.

### Razón

Esto preserva separación correcta entre:

- precio unitario pactado;
- total manual de línea;
- evidencia de intervención manual.

La librería debe preservar verdad. No debe colapsar esos conceptos en un solo valor.

## Caso 2. `VentaSnapshot` no debe bloquear venta operativa

### Problema detectado

La implementación previa de `VentaSnapshot` imponía invariante incompleto:

- `total = subtotal + impuesto`

Evidencia:

- [VentaSnapshot.ts](../../domain/ventas/entities/VentaSnapshot.ts)
- [Venta.ts](../../domain/ventas/entities/Venta.ts)
- [CarritoVenta.ts](../../domain/ventas/entities/CarritoVenta.ts)

Problema real:

- `Venta` sí conocía `montoRedondeo`;
- `CarritoVenta` sí operaba con descuentos;
- `VentaSnapshot` no representaba esos ajustes top-level;
- aun así, validaba el total final con fórmula parcial;
- un snapshot podía fallar aunque la venta fuera comercialmente válida.

Además, en flujos POS críticos, un consumer podía usar snapshot como paso obligatorio de persistencia y abortar la venta por error de proyección histórica.

### Decisión

Se decide que:

- `VentaSnapshot` debe reflejar la aritmética real de `Venta`;
- `VentaSnapshot` ahora puede transportar `descuentoTotal`;
- `VentaSnapshot` ahora puede transportar `montoRedondeo`;
- `montoRedondeo` puede ser positivo, cero o negativo;
- validación de snapshot usa fórmula completa de venta;
- `Venta` expone `tryToVentaSnapshot()` para escenarios donde snapshot no debe bloquear operación.

Regla adicional:

- `CarritoVenta` solo redondea dinero a 2 decimales;
- cualquier ajuste por sencillo debe modelarse como `montoRedondeo` en `Venta`, no como redondeo implícito de línea.

### Nueva fórmula canónica

`VentaSnapshot.total` debe ser consistente con:

```txt
subtotal - descuentoTotal + impuesto + montoRedondeo
```

Donde `montoRedondeo` puede ser:

- `> 0` si ajuste favorece total final;
- `= 0` si no hay ajuste;
- `< 0` si ajuste reduce total final por sencillo o cierre operativo.

### Regla operativa

En POS crítico:

- primero se persiste `Venta`;
- luego se intenta construir o persistir `VentaSnapshot`;
- si snapshot falla, se registra error y la venta continúa.

### Razón

`Venta` es transacción operativa crítica.

`VentaSnapshot` es proyección histórica derivada.

Una proyección histórica no debe tumbar atención de cliente en mostrador.

## Impacto en consumers

### Si consumer usa override manual por línea

Debe asumir:

- `precioUnitario` ya no será pisado por `montoTotal` manual;
- `snapshot.items[].montoModificado` es la señal oficial de override;
- al cambiar cantidad, override manual previo se invalida.

### Si consumer persiste snapshot

Debe migrar según criticidad:

- flujo estricto: `venta.toVentaSnapshot()`
- flujo crítico POS: `venta.tryToVentaSnapshot()`

Interpretación de `tryToVentaSnapshot()`:

- si retorna `snapshot`, persistirlo;
- si retorna `error`, registrar incidencia y continuar con `Venta`.

### Si consumer valida totales históricos

Debe dejar de asumir:

```txt
subtotal + impuesto = total
```

Debe usar:

```txt
subtotal - descuentoTotal + impuesto + montoRedondeo = total
```

## Implementación recomendada para cliente POS

### Flujo recomendado

1. construir `CarritoVenta`
2. convertir a `Venta`
3. persistir `Venta` en SQLite
4. intentar `venta.tryToVentaSnapshot()`
5. si existe snapshot, persistirlo
6. si existe error, registrar log técnico y continuar

### Pseudocódigo

```ts
const venta = Venta.fromCarritoVenta(carrito, ventaId, opciones);

await ventasRepo.upsert(venta.toJSON());

const snapshotResult = venta.tryToVentaSnapshot();

if (snapshotResult.snapshot) {
  await ventaSnapshotRepo.upsert(snapshotResult.snapshot);
}

if (snapshotResult.error) {
  logger.warn("venta_snapshot_no_persistido", {
    ventaId: venta.id,
    error: snapshotResult.error.message,
  });
}
```

## Compatibilidad

### Compatible

- consumers que ya usan `cliente` y `personal` como trazabilidad;
- consumers que tratan snapshot como derivado;
- consumers que distinguen precio unitario de total manual.

### Requiere ajuste

- consumers que esperaban que `montoTotal` manual reescriba `precioUnitario`;
- consumers que tratan snapshot como requisito transaccional obligatorio;
- consumers que validan snapshot con fórmula parcial.

## Riesgos conocidos

- si un consumer seguía usando `toVentaSnapshot()` en hot path crítico, todavía puede bloquearse por reglas estrictas de snapshot;
- si un consumer construye UI asumiendo que override manual cambia `precioUnitario`, verá comportamiento distinto tras `v1.0.6` y consolidado en `v1.0.7`.

## Recomendación final

- usar `Venta` como única verdad operativa para cierre comercial;
- usar `VentaSnapshot` como proyección histórica, no como gate de venta;
- preservar `precioUnitario`, `montoTotal` manual y `montoModificado` como conceptos separados;
- migrar POS críticos a `tryToVentaSnapshot()`.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [guia-de-consumo.md](./guia-de-consumo.md)
- [migracion-v1-0-4-a-v1-0-5.md](./migracion-v1-0-4-a-v1-0-5.md)
- [CarritoVenta.ts](../../domain/ventas/entities/CarritoVenta.ts)
- [Venta.ts](../../domain/ventas/entities/Venta.ts)
- [VentaSnapshot.ts](../../domain/ventas/entities/VentaSnapshot.ts)
