# Migración `v1.0.4 -> v1.0.5`

## Propósito

Este documento guía migración de consumers que usan `CarritoVenta` hacia `v1.0.5`.

`v1.0.5` introduce corte explícito sobre contrato público de `CarritoVenta` para alinearlo con modelo vigente de ventas:

- `CarritoVenta` como draft operativo;
- `Venta` como hecho comercial;
- `VentaSnapshot` como representación histórica.

> Nota: `v1.0.6` conserva este mismo corte y corrige semántica de snapshot; `v1.0.7` endurece aritmética monetaria y validación temprana del módulo ventas para evitar roturas silenciosas en POS.

## Cambio central

`CarritoVenta` deja de exponer campos que no forman parte de su rol operativo mínimo o que duplicaban otra fuente de verdad.

Campos removidos de `ICarritoVenta`:

- `notas`
- `tasaImpuesto`
- `clienteId`
- `personalId`

Además, `VentaSnapshotItem` ahora preserva:

- `montoModificado`

Y `CarritoVenta` corrige semántica de override manual:

- `montoModificado` ya no reescribe `precioUnitario`
- si cambia `quantity`, el override manual previo se invalida y la línea vuelve a cálculo normal

Además, `VentaSnapshot` refleja mejor la venta operativa:

- ahora puede transportar `descuentoTotal`
- ahora puede transportar `montoRedondeo`
- su consistencia total usa fórmula completa de venta, no solo `subtotal + impuesto`
- `Venta` expone `tryToVentaSnapshot()` para flujos donde snapshot no debe bloquear operación

## Razón de cada corte

### `notas`

Se removió porque no participaba en contrato canónico de `Venta` ni de `VentaSnapshot`.

Lectura correcta:

- si una nota no forma parte del documento comercial final ni del snapshot histórico oficial, no debe fingir ser parte del draft compartido;
- si un consumer todavía necesita comentarios efímeros, debe mantenerlos en estado de UI o capa de aplicación local.

### `tasaImpuesto`

Se removió porque duplicaba semántica ya presente en `configuracionFiscal`.

Lectura correcta:

- `configuracionFiscal` sigue siendo fuente fiscal del draft;
- publicar además `tasaImpuesto` en superficie pública inducía doble canal para mismo concepto;
- el cálculo de impuesto sigue existiendo, pero ya no se modela con propiedad paralela.

### `clienteId` y `personalId`

Se removieron porque duplicaban información ya contenida en:

- `cliente`
- `personal`

Lectura correcta:

- `CarritoVenta` conserva trazabilidad mediante objetos `cliente` y `personal`;
- `Venta.fromCarritoVenta()` ahora deriva `clienteId` y `vendedorId` desde esos objetos;
- el draft ya no publica IDs derivados como parte de su contrato estructural.

## Qué no cambió

- `CarritoVenta` sigue capturando `items`, `subtotal`, `impuesto`, `total`, `cliente`, `personal`, `procedencia` y `configuracionFiscal`;
- `Venta.fromCarritoVenta()` sigue generando `Venta`;
- `VentaSnapshot` sigue siendo representación histórica visible;
- `montoModificado` ya no se pierde al construir `VentaSnapshot`.

## Impacto para consumers

### Si serializas `CarritoVenta`

Debes dejar de leer o escribir:

- `carrito.notas`
- `carrito.tasaImpuesto`
- `carrito.clienteId`
- `carrito.personalId`

Debes usar:

- `carrito.configuracionFiscal`
- `carrito.cliente?.id`
- `carrito.personal?.id`

### Si generas `Venta` desde carrito

No necesitas reconstruir `clienteId` ni `personalId` dentro del payload del carrito.

Condición mínima:

- si quieres que `Venta` conserve `clienteId`, debes enviar `cliente`;
- si quieres que `Venta` conserve `vendedorId`, debes enviar `personal`.

### Si editas snapshots históricos

Si tu consumer interpreta override manual por línea, ahora debe leer:

- `snapshot.items[].montoModificado`

Si tu consumer trata snapshot como paso no crítico, ahora puede usar:

- `venta.tryToVentaSnapshot()`

Lectura recomendada:

- si `snapshot` existe, persistirlo;
- si `error` existe, registrar y continuar con `Venta`.

## Mapa de reemplazo

| Antes en `CarritoVenta` | Ahora |
| --- | --- |
| `notas` | mover a estado local de UI o capa consumidora |
| `tasaImpuesto` | usar `configuracionFiscal.tasaImpuesto` |
| `clienteId` | usar `cliente?.id` |
| `personalId` | usar `personal?.id` |

## Checklist de actualización

- fijar dependencia a `github:yelsino/yolafresh-utils#v1.0.5`
- eliminar lecturas y escrituras de `notas` en `CarritoVenta`
- eliminar lecturas y escrituras de `tasaImpuesto` en `CarritoVenta`
- reemplazar `clienteId` por `cliente?.id`
- reemplazar `personalId` por `personal?.id`
- validar generación de `Venta` desde `CarritoVenta`
- validar lectura de `snapshot.items[].montoModificado`
- validar lectura de `snapshot.descuentoTotal`
- validar lectura de `snapshot.montoRedondeo`
- si el flujo es POS crítico, migrar de `toVentaSnapshot()` a `tryToVentaSnapshot()`

## Instalación recomendada

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.5"
  }
}
```

## Cuándo no actualizar todavía

No conviene actualizar si consumer:

- depende de payloads legacy que solo envían `clienteId` o `personalId` sin objetos `cliente` o `personal`;
- persiste `notas` como si fueran parte contractual del carrito compartido;
- reconstruye fiscalidad desde `carrito.tasaImpuesto` en vez de `configuracionFiscal`.

En esos casos, primero debes adaptar consumer y luego subir a `v1.0.5`.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [guia-de-consumo.md](./guia-de-consumo.md)
- [../core/implementacion-para-clientes.md](../core/implementacion-para-clientes.md)
- [../core/versionado-del-paquete.md](../core/versionado-del-paquete.md)
