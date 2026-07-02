# Relaciones Interdominio de Ventas

## Propósito

Este documento explica cómo se relaciona `Venta` con otros Domains relevantes del ecosistema YolaFresh, especialmente subdominio de cuenta cliente dentro de `finanzas`, `Inventario`, `Almacén`, `Stock`, `Caja` y `Pago`.

## Regla general

`Venta` responde pregunta comercial:

> qué se vendió, a quién, por cuánto, en qué estado comercial y desde qué pedido opcional nació

Otros Domains responden preguntas distintas:

- `Pago`: cómo se capturó o concilió dinero
- `MovimientoCaja`: en qué caja o turno impactó dinero real
- `CuentaCliente`: qué deuda, saldo o aplicación quedó registrada
- `MovimientoInventario`: qué stock salió o se ajustó
- `Almacen`: desde dónde se movió stock

## Relación con `CuentaCliente`

### Qué aporta cada Domain

- `Venta`: hecho comercial
- `MovimientoCuentaCliente`: impacto financiero sobre la cuenta del cliente
- `ImputacionCuentaCliente`: aplicación entre créditos y débitos
- `ResumenCuentaCliente`: lectura resumida de saldo a favor o saldo por cobrar

### Casos típicos

#### Venta de contado sin deuda

- existe `Venta`
- puede existir `Pago`
- puede existir `MovimientoCaja`
- no necesariamente existe `MovimientoCuentaCliente`

#### Venta a crédito

- existe `Venta`
- existe impacto en `CuentaCliente`
- el cobro puede ocurrir después

#### Venta que consume saldo a favor

- existe `Venta`
- existe `MovimientoCuentaCliente`
- existe `ImputacionCuentaCliente` si se aplica crédito previo

### Regla canónica

No guardar deuda, saldo o adelanto dentro de `Venta`.

Esos conceptos viven en [finanzas](../finanzas/README.md) y en [cuenta-cliente-modelo-vigente.md](../finanzas/cuenta-cliente-modelo-vigente.md).

## Relación con `Pago`

`Pago` representa captura y conciliación de dinero, no hecho comercial.

Evidencia observada:

- `Pago.ventaId` se asigna solo cuando pago se aplica
- `Pago.movimientoCajaId` vincula cobro con tesorería
- `Pago.estado` expresa ciclo de captura

### Regla canónica

`Venta` no debe cargar `tipoPago` como propiedad primaria.

## Relación con `Caja`

`MovimientoCaja` expresa ingreso o egreso real en tesorería.

Campos relevantes observados:

- `turnoId`
- `cajaDestinoId`
- `tipo`
- `metodoPago`
- `referenciaTipo`
- `referenciaId`
- saldos posteriores

### Regla canónica

`turnoCajaId` y `caja` no viven en contrato principal de `Venta`.

La venta puede originar un movimiento de caja, pero no lo reemplaza.

## Relación con `Inventario`

`MovimientoInventario` expresa impacto real sobre stock.

Para una venta, la relación observada es:

- `tipo = SALIDA`
- `origenDocumento = VENTA`
- `documentoReferenciaId = ventaId`

### Regla canónica

La venta no modifica stock directamente. El stock cambia a través de `MovimientoInventario` y de la orquestación que implemente el consumer.

## Relación con `Almacen`

`Almacen` responde dónde está el stock.

Campos relevantes observados:

- `nombre`
- `tipo`
- `activo`
- `permitirLotes`
- `permitirNegativos`

Para una venta con salida de inventario, hace falta determinar `almacenOrigenId`. Esa decisión no vive dentro de `Venta`.

## Relación con `Stock`

`StockPresentacionAlmacen` expresa cantidad disponible por presentación y almacén.

Reglas observadas:

- stock no vive en la presentación
- el inventario está normalizado por almacén
- solo `MovimientoInventario` modifica stock

### Consecuencia para ventas

Una venta puede requerir validación previa de disponibilidad, pero esa validación no forma parte del agregado `Venta`.

## Relación con `Pedido`

`Pedido` y `Venta` no son mismo documento.

Relación vigente:

- `Pedido` representa reserva comercial
- `Venta` representa hecho comercial
- unión correcta: `pedidoId`

## Relación con `VentaSnapshot`

`VentaSnapshot` resuelve representación histórica visible:

- nombres de productos
- unidad comercial visible
- imagen
- cliente visible
- vendedor visible

`Venta` sigue resolviendo identidad, estado y montos canónicos.

## Mapa general

```mermaid
flowchart TD
  CarritoVenta --> Venta
  Pedido --> Venta
  Venta --> VentaSnapshot
  Venta --> Pago
  Venta --> MovimientoCaja
  Venta --> MovimientoCuentaCliente
  MovimientoCuentaCliente --> ImputacionCuentaCliente
  Venta --> MovimientoInventario
  MovimientoInventario --> Almacen
  MovimientoInventario --> StockPresentacionAlmacen
```

## Restricciones observadas

- `Venta` no define almacén origen
- `Venta` no define por sí sola impacto de caja
- `Venta` no define por sí sola impacto en cuenta cliente
- `Venta` no define por sí sola salida de stock

Eso se resuelve mediante integración entre Domains.

## Preguntas abiertas

- cuándo una venta debe generar inmediatamente `MovimientoInventario` en todos los consumers
- si todas las ventas despachadas equivalen a stock ya descontado
- cómo se define de forma uniforme el almacén origen en escenarios multi-almacén

## Referencias

- [modelo-vigente.md](./modelo-vigente.md)
- [guia-de-consumo.md](./guia-de-consumo.md)
- [../finanzas/cuenta-cliente-modelo-vigente.md](../finanzas/cuenta-cliente-modelo-vigente.md)
