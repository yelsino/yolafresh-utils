# Trazabilidad y Auditoría

## Propósito

Este documento describe cómo el Domain de cuenta cliente separa la trazabilidad por capas, evitando que una sola entidad concentre toda la verdad del proceso.

## Capas de trazabilidad

### Recepción

`RecepcionCobroCliente` deja rastro de:

- quién recibió dinero
- cuánto dinero se recibió
- método de pago
- momento de la recepción

### Custodia

`TransferenciaCustodiaCobro` deja rastro de:

- quién entrega
- quién recibe
- desde qué turno sale
- a qué turno entra
- si fue aceptada, rechazada o anulada

### Ledger financiero

`MovimientoCuentaCliente` deja rastro oficial de:

- crédito o débito
- origen
- monto
- reversa

### Aplicación entre movimientos

`ImputacionCuentaCliente` deja rastro de:

- qué crédito financió qué débito
- cuánto monto se aplicó
- en qué relación exacta quedaron enlazados

### Lectura resumida

`ResumenCuentaCliente` deja un resumen reconstruible de:

- saldo a favor
- saldo por cobrar

### Auditoría técnica

`AuditLog` sigue siendo contrato separado para:

- before/after
- cambios de campos
- trazas de soporte
- evidencia técnica separada del modelo de negocio

## Regla de oro

No duplicar la misma verdad en varias entidades.

Por eso:

- `RecepcionCobroCliente` no reemplaza al ledger financiero
- `TransferenciaCustodiaCobro` no reemplaza a la recepción original
- `MovimientoCuentaCliente` no guarda saldo acumulado final como única verdad
- `ResumenCuentaCliente` no reemplaza al ledger
- `AuditLog` no reemplaza a las entidades de negocio

## Regla de anulación

La anulación debe ser auditable sin destruir historia.

Por eso:

- no borrar movimientos
- no editar históricos de forma silenciosa
- usar `REVERSA` o estado auditable aplicable
- registrar auditoría técnica por separado cuando corresponda

## Resultado esperado

La trazabilidad correcta queda así:

- recepción operativa -> `RecepcionCobroCliente`
- custodia humana -> `TransferenciaCustodiaCobro`
- dinero contable -> `MovimientoCuentaCliente`
- aplicación entre movimientos -> `ImputacionCuentaCliente`
- lectura rápida -> `ResumenCuentaCliente`
- auditoría técnica -> `AuditLog`

## Pendiente de validación

- política funcional completa para `RECHAZADO`, `ANULADO` y `REVERTIDO`
- límites exactos entre auditoría técnica y auditoría de negocio en consumers

## Referencias

- [modelo-vigente.md](./modelo-vigente.md)
- [flujos-cobros-y-adelantos.md](./flujos-cobros-y-adelantos.md)
