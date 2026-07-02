# Modelo Vigente de Cuenta Cliente

## Visión general

El Domain de cuenta cliente modela la relación financiera entre YolaFresh y un cliente cuando existe saldo a favor, deuda, cobros, adelantos o aplicaciones entre movimientos.

La evidencia vigente está en [customer-account.ts](../../domain/shared/interfaces/customer-account.ts).

## Entidades y responsabilidades

### `CuentaCliente`

Representa la cuenta comercial asociada a un cliente.

Responsabilidades:

- vincular la cuenta con `clienteId`
- expresar estado general de la cuenta
- registrar apertura y cierre cuando aplique

No expresa:

- saldo actual
- deuda acumulada
- detalle histórico de movimientos

### `MovimientoCuentaCliente`

Representa el impacto financiero individual sobre la cuenta.

Responsabilidades:

- registrar crédito o débito
- indicar el tipo de movimiento
- enlazar origen del hecho que produjo el movimiento
- reflejar vínculos con recepción, caja, turno o custodio cuando aplique

Campos de negocio relevantes observados:

- `tipo`
- `direccion`
- `monto`
- `moneda`
- `tipoOrigen`
- `origenId`
- `estado`
- `recepcionCobroId`
- `cajaId`
- `turnoCajaId`
- `custodioId`
- `reversaDeMovimientoId`
- `deltaSaldoFavor`
- `deltaSaldoPorCobrar`

### `ImputacionCuentaCliente`

Representa la aplicación explícita entre un movimiento origen y un movimiento destino.

Responsabilidades:

- dejar rastro entre crédito y débito
- soportar aplicación parcial
- declarar estrategia de consumo

El contrato actual solo declara `FIFO` como estrategia explícita.

### `RecepcionCobroCliente`

Representa el evento de recepción de dinero del cliente.

Responsabilidades:

- registrar monto, moneda y método de pago
- identificar quién creó o recibió la recepción
- expresar estado operativo del cobro recibido
- asociar caja, turno y custodio cuando existan

No equivale por sí sola a impacto financiero confirmado en cuenta.

### `TransferenciaCustodiaCobro`

Representa el traspaso de custodia de una recepción entre responsables y turnos.

Responsabilidades:

- separar recepción de custodia efectiva
- expresar origen y destino de custodia
- dejar rastro de aceptación, rechazo o anulación

### `ResumenCuentaCliente`

Representa la lectura resumida de la cuenta.

Responsabilidades:

- exponer `saldoFavor`
- exponer `saldoPorCobrar`
- conservar metadatos de reconstrucción

No reemplaza a movimientos ni imputaciones como fuente primaria.

## Estados y clasificaciones

### Estado de la cuenta

| Valor | Significado observado |
| --- | --- |
| `ACTIVA` | Cuenta disponible para operación |
| `SUSPENDIDA` | Cuenta restringida |
| `CERRADA` | Cuenta cerrada |

### Tipo de movimiento

| Valor | Lectura de negocio observada |
| --- | --- |
| `DEPOSITO` | Incrementa saldo a favor |
| `COBRO` | Reduce saldo por cobrar |
| `VENTA` | Genera cargo o consume saldo |
| `DEVOLUCION` | Devuelve valor a la relación financiera |
| `REVERSA` | Revierte un movimiento previo |
| `AJUSTE` | Ajuste manual o administrativo |

### Dirección del movimiento

- `CREDITO`
- `DEBITO`

### Estado de movimiento

- `CONFIRMADO`
- `ANULADO`
- `RECHAZADO`
- `CONTABILIZADO`
- `REVERTIDO`

### Estado de imputación

- `APLICADA`
- `REVERTIDA`

### Estado de recepción de cobro

- `CREADO`
- `RECIBIDO`
- `EN_TRANSFERENCIA_CUSTODIA`
- `LIQUIDADO`
- `RECHAZADO`
- `ANULADO`

### Estado de transferencia de custodia

- `CREADA`
- `RECIBIDA`
- `PENDIENTE`
- `ACEPTADA`
- `RECHAZADA`
- `ANULADA`

## Relaciones de negocio

### Con `Venta`

`Venta` sigue siendo el hecho comercial. La cuenta cliente expresa deuda, adelanto, cobro aplicado o saldo, pero no reemplaza a la venta.

### Con `Pago`

`Pago` mantiene captura y conciliación del medio de pago. No sustituye a `RecepcionCobroCliente` ni a `MovimientoCuentaCliente`.

### Con `MovimientoCaja`

`MovimientoCaja` expresa tesorería operativa. La cuenta cliente expresa relación financiera con el cliente.

## Reglas de negocio respaldadas por evidencia

- no usar `CuentaCliente` como saldo mutable
- no usar `ResumenCuentaCliente` como ledger oficial
- no registrar impacto financiero sin `tipoOrigen` y `origenId`
- separar recepción, custodia, ledger e imputación
- modelar consumo de créditos mediante `ImputacionCuentaCliente`
- no borrar historia para anular; usar reversa o anulación auditable

## Restricciones observadas

- el contrato actual solo declara monedas `PEN` y `USD`
- la estrategia explícita de imputación observada es `FIFO`
- recepción y movimiento exponen vínculos a caja, turno y custodio

## Pendiente de validación

- criterio exacto para `AJUSTE`
- transición funcional completa de `RecepcionCobroCliente`
- transición funcional completa de `TransferenciaCustodiaCobro`
- criterio funcional entre `CONFIRMADO` y `CONTABILIZADO`

## Referencias

- [README.md](./README.md)
- [flujos-cobros-y-adelantos.md](./flujos-cobros-y-adelantos.md)
- [trazabilidad-y-auditoria.md](./trazabilidad-y-auditoria.md)
- [guia-de-consumo.md](./guia-de-consumo.md)
