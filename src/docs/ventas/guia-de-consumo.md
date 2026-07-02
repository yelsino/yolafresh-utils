# Guía de Consumo del Domain de Ventas

## Propósito

Este documento describe cómo debe interpretar un consumer el Domain de ventas expuesto por `yolafresh-utils`.

## Secuencia funcional recomendada

### 1. Captura operativa

Usar `CarritoVenta` para:

- agregar productos
- calcular totales
- capturar cliente y personal
- mantener configuración fiscal

### 2. Conversión a venta

Cuando operación se confirma comercialmente:

- crear `Venta`
- usar `VentaState`
- congelar items y totales

Si operación proviene de reserva:

- relacionar con `pedidoId`

### 3. Snapshot histórico

Para historial humano durable:

- crear `VentaSnapshot`
- usar `venta.toVentaSnapshot()` o factory equivalente

`VentaSnapshot` sirve para:

- historial visible
- ticket interno o voucher histórico
- reconstrucción duradera sin depender de catálogo vivo

### 4. Cobro y tesorería

Si entra dinero real:

- crear o confirmar `Pago`
- registrar `MovimientoCaja`

No guardar cobro dentro de `Venta`.

### 5. Cuenta cliente

Si venta genera deuda o consume saldo:

- registrar `MovimientoCuentaCliente`
- crear `ImputacionCuentaCliente` cuando un crédito financia un débito

No guardar saldo o deuda dentro de `Venta`.

### 6. Inventario

Si venta impacta stock:

- generar `MovimientoInventario`
- usar `origenDocumento = VENTA`
- aplicar con `MovimientoInventarioService`

## Lectura recomendada por caso

### Historial comercial

- `Venta`
- `VentaSnapshot`

### Cobro y conciliación

- `Pago`
- `MovimientoCaja`

### Deuda, adelantos y saldo

- `CuentaCliente`
- `MovimientoCuentaCliente`
- `ImputacionCuentaCliente`
- `ResumenCuentaCliente`

### Stock y kardex

- `MovimientoInventario`
- `StockPresentacionAlmacen`
- `KardexLinea`

## Reglas de separación

- `CarritoVenta` != `Venta`
- `Venta` != `Pago`
- `Venta` != `MovimientoCaja`
- `Venta` != `MovimientoCuentaCliente`
- `Venta` != `MovimientoInventario`
- `Venta` != `VentaSnapshot`

## Errores de modelado a evitar

- meter `tipoPago` en contrato primario de `Venta`
- meter `turnoCajaId` en contrato primario de `Venta`
- meter `finanzaId` en contrato primario de `Venta`
- usar `esPedido` en vez de `pedidoId`
- usar `Venta` como si fuera documento de stock
- usar `Venta` como si fuera documento de deuda

## Preguntas abiertas

- cuándo exactamente debe nacer `VentaSnapshot` en todos los flows de consumer
- cuándo exactamente debe nacer `MovimientoInventario` en todos los flows de consumer
- cómo se resuelve políticamente la anulación entre venta, caja, cuenta cliente e inventario

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [relaciones-interdominio.md](./relaciones-interdominio.md)
