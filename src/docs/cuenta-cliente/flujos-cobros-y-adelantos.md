# Flujos de Cobros y Adelantos

## Propósito

Este documento describe flujos operativos mínimos del Domain de cuenta cliente para adelantos, cobros, uso de saldo y reversas.

## Regla funcional central

### Recepción de dinero

La recepción operativa inicia con `RecepcionCobroCliente`.

### Impacto financiero

El impacto en la relación financiera del cliente se registra con `MovimientoCuentaCliente`.

### Aplicación entre movimientos

La relación entre créditos y débitos se registra con `ImputacionCuentaCliente`.

### Custodia

La custodia del dinero recibido se expresa con `TransferenciaCustodiaCobro`.

## Flujos mínimos

### Adelanto sin venta

1. Crear `RecepcionCobroCliente`.
2. Cuando la custodia quede resuelta según política operativa, crear `MovimientoCuentaCliente` tipo `DEPOSITO`.
3. Actualizar `ResumenCuentaCliente.saldoFavor`.

### Cobro parcial de deuda

1. Crear `RecepcionCobroCliente`.
2. Registrar `MovimientoCuentaCliente` tipo `COBRO`.
3. Actualizar `ResumenCuentaCliente.saldoPorCobrar`.

### Sobrepago

Si el cliente paga más de lo necesario:

- la parte aplicada a deuda o cargo se registra con movimiento correspondiente
- el excedente puede expresarse como `DEPOSITO`
- si un débito consume crédito previo, crear `ImputacionCuentaCliente`

### Uso de saldo a favor

1. Registrar `MovimientoCuentaCliente` tipo `VENTA`.
2. Aplicar créditos previos mediante `ImputacionCuentaCliente`.
3. Reducir `saldoFavor` del resumen o aumentar `saldoPorCobrar` según efecto neto.

### Devolución

1. Registrar `MovimientoCuentaCliente` tipo `DEVOLUCION`.
2. Recalcular `ResumenCuentaCliente`.

### Reversa o anulación

1. Registrar `REVERSA` o estado auditable aplicable.
2. No borrar ni sobreescribir movimientos previos.

## Regla de custodia

### Cajero recibe directamente

- `RecepcionCobroCliente`
- `MovimientoCuentaCliente`
- `ResumenCuentaCliente`

### Vendedor recibe y luego entrega

- `RecepcionCobroCliente`
- `TransferenciaCustodiaCobro`
- aceptación o resolución de custodia
- `MovimientoCuentaCliente`
- `ResumenCuentaCliente`

## Validaciones observadas y recomendadas

- no registrar impacto financiero sin `tipoOrigen` y `origenId`
- no crear `ImputacionCuentaCliente` por monto mayor al disponible en movimiento origen
- no mutar `ResumenCuentaCliente` fuera del proceso de reconstrucción
- no mezclar custodia y ledger como si fueran misma cosa

## Preguntas abiertas

- cuándo una recepción debe pasar a `LIQUIDADO`
- cuándo registrar `MovimientoCuentaCliente` antes o después de aceptar custodia
- cuál es política exacta para `AJUSTE`

## Referencias

- [modelo-vigente.md](./modelo-vigente.md)
- [trazabilidad-y-auditoria.md](./trazabilidad-y-auditoria.md)
- [guia-de-consumo.md](./guia-de-consumo.md)
