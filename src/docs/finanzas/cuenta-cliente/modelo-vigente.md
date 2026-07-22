# Cuenta Cliente dentro de Finanzas

## Propósito

Este documento describe subdominio de cuenta cliente como parte de `finanzas`.

La evidencia vigente está en [cuenta-cliente.contract.ts](../../../domain/finanzas/contracts/cuenta-cliente.contract.ts).

## Visión general

`CuentaCliente` modela relación financiera entre negocio y cliente cuando existe saldo a favor, deuda, cobros, adelantos o aplicaciones entre movimientos.

Casos de uso detallados en [casos-de-uso.md](./casos-de-uso.md).

## Entidades y contratos principales

### `CuentaCliente`

Representa cuenta comercial asociada a un cliente.

Responsabilidades observadas:

- vincular cuenta con `clienteId`;
- expresar estado general;
- registrar apertura y cierre cuando aplica.

No expresa por sí sola:

- saldo actual;
- deuda acumulada;
- detalle histórico de movimientos.

### `MovimientoCuentaCliente`

Representa impacto financiero individual sobre cuenta.

Responsabilidades observadas:

- registrar crédito o débito;
- indicar tipo de movimiento;
- enlazar origen del hecho que produjo el movimiento;
- reflejar vínculos con recepción, caja, turno o custodio cuando aplica.

Con `Opción A` vigente:

- ya no publica deltas acumulados de resumen;
- publica solo hecho de ledger;
- deja a `ImputacionCuentaCliente` la aplicación explícita entre créditos y débitos.

### `ImputacionCuentaCliente`

Representa aplicación explícita entre movimiento origen y movimiento destino.

Responsabilidades observadas:

- dejar rastro entre crédito y débito;
- soportar aplicación parcial;
- declarar estrategia de consumo.

El contrato observado declara `FIFO` como estrategia explícita.

### `RecepcionCobroCliente`

Representa evento de recepción de dinero del cliente.

Responsabilidades observadas:

- registrar monto, moneda y método de pago;
- conservar `codigoConstancia` cuando el medio o la operación emite una constancia identificable;
- identificar quién creó o recibió recepción;
- expresar estado operativo del cobro recibido;
- asociar caja, turno y custodio cuando existen.

No equivale por sí sola a impacto financiero confirmado.

### `TransferenciaCustodiaCobro`

Representa traspaso de custodia de una recepción entre responsables y turnos.

Responsabilidades observadas:

- separar recepción de custodia efectiva;
- expresar origen y destino de custodia;
- dejar rastro de aceptación, rechazo o anulación.

### `ResumenCuentaCliente`

Representa lectura resumida de cuenta.

Responsabilidades observadas:

- exponer `saldoFavor`;
- exponer `saldoPorCobrar`;
- conservar metadatos de reconstrucción.

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
| `DEPOSITO` | Genera crédito disponible a favor del cliente |
| `COBRO` | Genera crédito aplicable a débitos abiertos |
| `VENTA` | Genera débito y abre saldo por cobrar |
| `DEVOLUCION` | Genera crédito disponible a favor del cliente |
| `REVERSA` | Neutraliza efecto económico de movimiento previo |
| `AJUSTE` | Corrección administrativa explícita y auditable |

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

`Venta` sigue siendo hecho comercial. `CuentaCliente` expresa deuda, adelanto, cobro aplicado o saldo, pero no reemplaza venta.

### Con `Pago`

`Pago` mantiene evidencia externa de pago y su eventual validación operativa. No sustituye a `RecepcionCobroCliente` ni a `MovimientoCuentaCliente`.

Lectura importante:

- un `Pago` puede no quedar asociado a una venta;
- un `Pago` puede quedar solo como evidencia externa sin efecto financiero en cuenta cliente;
- cuenta cliente solo cambia cuando se registra contrato financiero propio del subdominio.

### Con `MovimientoCaja`

`MovimientoCaja` expresa tesorería operativa. `CuentaCliente` expresa relación financiera con cliente.

## Reglas de negocio respaldadas por evidencia

- no usar `CuentaCliente` como saldo mutable;
- no usar `ResumenCuentaCliente` como ledger oficial;
- no registrar impacto financiero sin `tipoOrigen` y `origenId`;
- separar recepción, custodia, ledger e imputación;
- modelar consumo de créditos mediante `ImputacionCuentaCliente`;
- no reconstruir saldo desde deltas embebidos en `MovimientoCuentaCliente`;
- tratar todo `DEBITO` como exposición abierta y todo `CREDITO` como crédito abierto, salvo neutralización explícita por reversa;
- no borrar historia para anular; usar reversa o anulación auditable.

## Regla de implementación para consumers

La implementación en frontend y backend debe respetar completamente `yola-fresh-utils` como fuente contractual oficial.

Por eso:

- no crear interfaces paralelas para `CuentaCliente` y contratos derivados;
- no copiar tipos a código local como “modelo propio”;
- no importar desde rutas privadas del paquete;
- si hace falta una evolución, primero se cambia el contrato compartido.

## Restricciones observadas

- el contrato actual declara monedas `PEN` y `USD`;
- la estrategia explícita de imputación observada es `FIFO`;
- una imputación válida debe unir crédito y débito de misma moneda;
- recepción y movimiento exponen vínculos a caja, turno y custodio.
- `codigoConstancia` es opcional para mantener compatibilidad con recepciones históricas y medios sin constancia.

## Decisiones vigentes observables

- `AJUSTE` existe como tipo explícito de `MovimientoCuentaCliente` para correcciones manuales auditablemente separadas de `VENTA`, `COBRO`, `DEPOSITO`, `DEVOLUCION` y `REVERSA`;
- `RecepcionCobroCliente` publica ciclo observable `CREADO`, `RECIBIDO`, `EN_TRANSFERENCIA_CUSTODIA`, `LIQUIDADO`, `RECHAZADO` y `ANULADO`;
- `TransferenciaCustodiaCobro` publica ciclo observable `CREADA`, `RECIBIDA`, `PENDIENTE`, `ACEPTADA`, `RECHAZADA` y `ANULADA`;
- `MovimientoCuentaCliente` diferencia `CONFIRMADO` de `CONTABILIZADO`, por lo que confirmación operativa y reflejo contable no son el mismo estado;
- `ResumenCuentaCliente` se interpreta como proyección reconstruible desde movimientos vigentes e imputaciones vigentes;
- `MovimientoCuentaCliente` ya no publica `deltaSaldoFavor` ni `deltaSaldoPorCobrar`.

## Referencias

- [README.md](./README.md)
- [casos-de-uso.md](./casos-de-uso.md)
- [operacion-y-auditoria.md](./operacion-y-auditoria.md)
- [rfcs/erfc-implementacion-cuenta-cliente.md](./rfcs/erfc-implementacion-cuenta-cliente.md)
- [../README.md](../README.md)
- [../../ventas/relaciones-interdominio.md](../../ventas/relaciones-interdominio.md)
