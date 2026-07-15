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

No usar `CarritoVenta` para:

- persistir metadata efímera ajena a `Venta` o `VentaSnapshot`
- duplicar fiscalidad con `tasaImpuesto` paralela
- publicar IDs derivados como `clienteId` o `personalId` dentro del contrato compartido

### 2. Conversión a venta

Cuando operación se confirma comercialmente:

- crear `Venta`
- usar `VentaState`
- definir `CondicionPagoVenta`
- congelar items y totales

Si operación proviene de reserva:

- relacionar con `pedidoId`
- leer `Pedido` desde su Domain propietario en [../pedido/guia-de-consumo.md](../pedido/guia-de-consumo.md)

### 3. Snapshot histórico

Para historial humano durable:

- crear `VentaSnapshot`
- usar `venta.toVentaSnapshot()` cuando flujo necesite snapshot estricto
- usar `venta.tryToVentaSnapshot()` en POS o flujos críticos donde la venta no debe abortarse por fallo de proyección histórica

`VentaSnapshot` sirve para:

- historial visible
- ticket interno o voucher histórico
- reconstrucción duradera sin depender de catálogo vivo
- preservar `montoModificado` por item cuando línea fue ajustada manualmente
- reflejar `descuentoTotal` y `montoRedondeo` cuando forman parte de `Venta`
- aceptar `montoRedondeo` firmado cuando POS cierre con ajuste a favor o en contra

Lectura correcta:

- `Venta` es transacción operativa crítica
- `VentaSnapshot` es representación histórica derivada
- si snapshot falla en flujo crítico, se registra y se continúa con persistencia de `Venta`
- `montoTotal` de item es bruto antes de descuento
- ajustes de sencillo o cierre físico deben entrar por `montoRedondeo`, no por redondeo implícito del carrito

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
- `CondicionPagoVenta` != estado de cobranza
- `Pago` huérfano != error de dominio

## Errores de modelado a evitar

- meter `estadoCobranza` en contrato primario de `Venta`
- meter `turnoCajaId` en contrato primario de `Venta`
- meter `finanzaId` en contrato primario de `Venta`
- usar `esPedido` en vez de `pedidoId`
- usar `notas` como si siguiera siendo parte contractual de `CarritoVenta`
- leer `carrito.tasaImpuesto` en vez de `carrito.configuracionFiscal`
- reconstruir actor desde `clienteId` o `personalId` del carrito compartido
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
- [migracion-v1-0-4-a-v1-0-5.md](./migracion-v1-0-4-a-v1-0-5.md)
