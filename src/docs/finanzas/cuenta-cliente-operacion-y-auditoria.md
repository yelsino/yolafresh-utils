# Cuenta Cliente: Operación y Auditoría

## Propósito

Este documento concentra flujos mínimos, custodia y trazabilidad del subdominio de cuenta cliente dentro de `finanzas`.

La evidencia vigente está en [cuenta-cliente.contract.ts](../../domain/finanzas/contracts/cuenta-cliente.contract.ts).

## Regla funcional central

### Recepción de dinero

La recepción operativa inicia con `RecepcionCobroCliente`.

### Impacto financiero

El impacto en relación financiera del cliente se registra con `MovimientoCuentaCliente`.

### Aplicación entre movimientos

La relación entre créditos y débitos se registra con `ImputacionCuentaCliente`.

### Custodia

La custodia del dinero recibido se expresa con `TransferenciaCustodiaCobro`.

## Flujos mínimos

### Adelanto sin venta

1. Crear `RecepcionCobroCliente`.
2. Cuando custodia quede resuelta según política operativa, crear `MovimientoCuentaCliente` tipo `DEPOSITO`.
3. Actualizar `ResumenCuentaCliente.saldoFavor`.

### Cobro parcial de deuda

1. Crear `RecepcionCobroCliente`.
2. Registrar `MovimientoCuentaCliente` tipo `COBRO`.
3. Actualizar `ResumenCuentaCliente.saldoPorCobrar`.

### Sobrepago

Si cliente paga más de lo necesario:

- parte aplicada a deuda o cargo se registra con movimiento correspondiente;
- excedente puede expresarse como `DEPOSITO`;
- si un débito consume crédito previo, crear `ImputacionCuentaCliente`.

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

## Capas de trazabilidad

### Recepción

`RecepcionCobroCliente` deja rastro de:

- quién recibió dinero;
- cuánto dinero se recibió;
- método de pago;
- momento de recepción.

### Custodia

`TransferenciaCustodiaCobro` deja rastro de:

- quién entrega;
- quién recibe;
- desde qué turno sale;
- a qué turno entra;
- si fue aceptada, rechazada o anulada.

### Ledger financiero

`MovimientoCuentaCliente` deja rastro oficial de:

- crédito o débito;
- origen;
- monto;
- reversa.

### Aplicación entre movimientos

`ImputacionCuentaCliente` deja rastro de:

- qué crédito financió qué débito;
- cuánto monto se aplicó;
- relación exacta entre ambos movimientos.

### Lectura resumida

`ResumenCuentaCliente` deja resumen reconstruible de:

- saldo a favor;
- saldo por cobrar.

## Regla de oro

No duplicar misma verdad en varias entidades.

Por eso:

- `RecepcionCobroCliente` no reemplaza ledger financiero;
- `TransferenciaCustodiaCobro` no reemplaza recepción original;
- `MovimientoCuentaCliente` no guarda saldo acumulado final como única verdad;
- `ResumenCuentaCliente` no reemplaza ledger.

## Regla de anulación

La anulación debe ser auditable sin destruir historia.

Por eso:

- no borrar movimientos;
- no editar históricos de forma silenciosa;
- usar `REVERSA` o estado auditable aplicable.

## Lectura recomendada para consumers

- recepción operativa: `RecepcionCobroCliente`;
- custodia humana: `TransferenciaCustodiaCobro`;
- auditoría financiera: `MovimientoCuentaCliente` + `ImputacionCuentaCliente`;
- lectura rápida: `ResumenCuentaCliente`.

## Decisiones vigentes observables

- `LIQUIDADO` pertenece al ciclo de `RecepcionCobroCliente` y representa cierre operativo de una recepción ya resuelta;
- `MovimientoCuentaCliente` y `TransferenciaCustodiaCobro` son contratos separados, por lo que custodia y movimiento financiero pueden auditarse sin colapsar en un único documento;
- `AJUSTE` existe como movimiento explícito y debe tratarse como corrección manual, no como sustituto de `REVERSA`;
- `RECHAZADO`, `ANULADO` y `REVERTIDO` expresan decisiones distintas: rechazo operativo, anulación del documento y reversa de movimiento ya registrado.

## Referencias

- [cuenta-cliente-modelo-vigente.md](./cuenta-cliente-modelo-vigente.md)
- [modelo-vigente.md](./modelo-vigente.md)
