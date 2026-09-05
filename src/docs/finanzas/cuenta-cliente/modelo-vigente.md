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

En documentos históricos `cobroId` puede faltar. En evidencia nueva del
manifest versión `1`, una imputación cuyo `tipoComponenteEjecucionCobro` sea
`DINERO_NUEVO` debe declarar `cobroId`: es la relación opaca y explícita hacia
la `RecepcionCobroCliente` que aportó el dinero. No se reconstruye desde `id`,
`movimientoOrigenId`, prefijos ni ningún patrón del identificador.

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

### `EjecucionCobroCliente`

Representa el agregado de lectura de una sola acción de cobro, aun cuando use
saldo a favor y uno o varios grupos de dinero nuevo por método de pago.

Responsabilidades observables del contrato versión `1`:

- agrupar por `ejecucionCobroId` la evidencia originada por la acción;
- conservar componentes independientes `DINERO_NUEVO` y `SALDO_FAVOR`;
- comprometer en cada componente `DINERO_NUEVO` la `custodiaEsperada` cuando
  quien recibe no tiene rol `CAJERO`;
- exponer la idempotencia y huella de petición cuando la proyección conserva
  el journal del componente;
- enumerar recepciones, movimientos e imputaciones por sus identificadores
  técnicos opacos;
- publicar totales de dinero nuevo, saldo aplicado, monto imputado y remanente;
- distinguir `EN_PROGRESO`, `CONFIRMADA`, `PARCIALMENTE_CONFIRMADA`,
  `RECHAZADA`, `ANULADA` y `REVERTIDA` de un fallo técnico
  `RECUPERACION_REQUERIDA`.

No es una raíz persistida ni introduce un nuevo tipo documental CouchDB. Se
sintetiza desde las operaciones y documentos existentes, y no sustituye ni
fusiona `RecepcionCobroCliente`, `MovimientoCuentaCliente` o
`ImputacionCuentaCliente`. Esos documentos siguen siendo las evidencias de
recepción, ledger y aplicación, respectivamente.

Para compatibilidad histórica, `ejecucionCobroId` es opcional al leer esos tres
documentos. Todo productor nuevo que participe en una ejecución debe escribir
el mismo identificador en cada documento generado. El valor es opaco: su
formato no clasifica el documento ni expresa lógica de negocio.

`estadoProcesamientoCobro` no forma parte de `RecepcionCobroCliente`: es un
detalle privado de journals o adaptadores que no debe convertirse en una
segunda máquina de estados compartida. Los consumers observan
`CabeceraEjecucionCobroCliente.estado`, los estados de sus componentes y el
estado operativo propio de la recepción.

### `DetalleEjecucionCobroCliente`

Es la respuesta versionada para la vista de detalle de un cobro. Mantiene en
colecciones separadas:

- recepciones operativas;
- movimientos del ledger;
- imputaciones exactas entre fuente y deuda;
- todas las `transferenciasCustodia` asociadas, como colección lossless;
- créditos destino enriquecidos con código visible, monto aplicado, saldo
  pendiente anterior y saldo pendiente restante cuando son reconstruibles;
- movimientos compensatorios posteriores, sin ocultar ni sobrescribir el cobro
  original.

La relación exacta se obtiene por identificadores contractuales, no por el
formato de `_id` ni por heurísticas de fecha o monto.

La colección `transferenciasCustodia` es la evidencia completa. Una propiedad
singular de compatibilidad HTTP, si algún adaptador todavía la publica, solo
puede ser un alias derivado y nunca puede sustituir ni truncar esta colección.

### `TransferenciaCustodiaCobro`

Representa traspaso de custodia de una recepción entre responsables y turnos.

Responsabilidades observadas:

- separar recepción de custodia efectiva;
- expresar origen y destino de custodia;
- dejar rastro de aceptación, rechazo o anulación.

### `CustodiaEsperadaCobroCliente`

Forma parte del plan inmutable de un componente `DINERO_NUEVO` cuando el actor
que recibe es `VENDEDOR` o `SISTEMA`. Declara custodios y turnos de origen y
destino, además de cajas opcionales. Para un actor `CAJERO` debe omitirse: no se
inventa una transferencia desde la misma custodia que ya recibe el dinero.

La ruta completa entra en la serialización canónica y, por tanto, en
`planHash`. Reutilizar una clave idempotente con una ruta distinta es una
petición incompatible. Todos sus identificadores son opacos: se conservan sin
recortar, reconstruir ni interpretar.

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
- `ejecucionCobroId` es opcional únicamente para compatibilidad de documentos históricos; es obligatorio para productores nuevos que formen parte de una ejecución.
- `cobroId` puede faltar en imputaciones históricas, pero es obligatorio en cada `ImputacionCuentaClienteDineroNuevoManifestV1` y debe apuntar a la recepción fuente exacta.

## Decisiones vigentes observables

- `AJUSTE` existe como tipo explícito de `MovimientoCuentaCliente` para correcciones manuales auditablemente separadas de `VENTA`, `COBRO`, `DEPOSITO`, `DEVOLUCION` y `REVERSA`;
- `RecepcionCobroCliente` publica ciclo observable `CREADO`, `RECIBIDO`, `EN_TRANSFERENCIA_CUSTODIA`, `LIQUIDADO`, `RECHAZADO` y `ANULADO`;
- `TransferenciaCustodiaCobro` publica ciclo observable `CREADA`, `RECIBIDA`, `PENDIENTE`, `ACEPTADA`, `RECHAZADA` y `ANULADA`;
- `MovimientoCuentaCliente` diferencia `CONFIRMADO` de `CONTABILIZADO`, por lo que confirmación operativa y reflejo contable no son el mismo estado;
- `ResumenCuentaCliente` se interpreta como proyección reconstruible desde movimientos vigentes e imputaciones vigentes;
- `MovimientoCuentaCliente` ya no publica `deltaSaldoFavor` ni `deltaSaldoPorCobrar`.
- `EjecucionCobroCliente` versión `1` sintetiza una acción sin imponer una única fuente, método de pago, petición o documento financiero ni crear otra raíz CouchDB.

## Referencias

- [README.md](./README.md)
- [casos-de-uso.md](./casos-de-uso.md)
- [operacion-y-auditoria.md](./operacion-y-auditoria.md)
- [rfcs/erfc-implementacion-cuenta-cliente.md](./rfcs/erfc-implementacion-cuenta-cliente.md)
- [../README.md](../README.md)
- [../../ventas/relaciones-interdominio.md](../../ventas/relaciones-interdominio.md)
