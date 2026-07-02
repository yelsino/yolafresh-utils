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

- recibir o validar `Pago` como evidencia externa cuando exista
- registrar `MovimientoCaja`

No guardar cobro dentro de `Venta`.

Lectura correcta:

- `Pago` no siempre nace dentro del flujo de venta;
- `Pago` puede llegar desde sistema externo después;
- `Pago` puede no terminar asociado a la venta y seguir siendo válido;
- asociación a venta ocurre solo cuando evidencia se aplica efectivamente.

### 5. Cuenta cliente

Si venta genera deuda o consume saldo:

- registrar `MovimientoCuentaCliente`
- crear `ImputacionCuentaCliente` cuando un crédito financia un débito

No guardar saldo o deuda dentro de `Venta`.

### 6. Inventario

Si venta impacta stock:

- generar `MovimientoInventario`
- usar `origenDocumento = VENTA`
- resolver aplicación de stock en la capa consumidora o módulo operativo correspondiente

## Lectura recomendada por caso

### Historial comercial

- `Venta`
- `VentaSnapshot`

### Evidencia de pago y tesorería

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
- `Pago` huérfano != error de dominio

## Errores de modelado a evitar

- meter `tipoPago` en contrato primario de `Venta`
- meter `turnoCajaId` en contrato primario de `Venta`
- meter `finanzaId` en contrato primario de `Venta`
- usar `esPedido` en vez de `pedidoId`
- usar `Venta` como si fuera documento de stock
- usar `Venta` como si fuera documento de deuda
- asumir que todo `Pago` debe asociarse a una venta

## Límites vigentes del paquete

- `VentaSnapshot` puede construirse desde `Venta`, pero la librería no obliga instante único de persistencia;
- `MovimientoInventario` se mantiene desacoplado del agregado `Venta`, por lo que cada consumer decide disparo operativo;
- la anulación interdominio requiere coordinación externa entre contratos, no automatismo dentro de `Venta`.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [relaciones-interdominio.md](./relaciones-interdominio.md)
