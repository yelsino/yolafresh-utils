# Cuenta Cliente: Operación y Auditoría

## Propósito

Este documento concentra flujos mínimos, custodia y trazabilidad del subdominio de cuenta cliente dentro de `finanzas`.

La evidencia vigente está en [cuenta-cliente.contract.ts](../../../domain/finanzas/contracts/cuenta-cliente.contract.ts).

## Regla funcional central

### Recepción de dinero

La recepción operativa inicia con `RecepcionCobroCliente`.

### Impacto financiero

El impacto en relación financiera del cliente se registra con `MovimientoCuentaCliente`.

### Aplicación entre movimientos

La relación entre créditos y débitos se registra con `ImputacionCuentaCliente`.

### Custodia

La custodia del dinero recibido se expresa con `TransferenciaCustodiaCobro`.

### Ejecución de cobro

Una acción iniciada por el usuario se representa con `EjecucionCobroCliente`. El
mismo `ejecucionCobroId` debe viajar en cada recepción, movimiento e imputación
generados por esa acción. El agregado se sintetiza para lectura; no se persiste
como nueva raíz CouchDB y no reemplaza esos documentos.

## Flujos mínimos

### Adelanto sin venta

1. Crear `RecepcionCobroCliente`.
2. Cuando custodia quede resuelta según política operativa, crear `MovimientoCuentaCliente` tipo `DEPOSITO`.
3. Reconstruir `ResumenCuentaCliente` desde movimientos + imputaciones vigentes.

### Cobro parcial de deuda

1. Emitir un `ejecucionCobroId` opaco para la acción.
2. Crear `RecepcionCobroCliente` con ese identificador.
3. Registrar `MovimientoCuentaCliente` tipo `COBRO` con ese identificador.
4. Crear `ImputacionCuentaCliente` contra débitos abiertos con ese identificador
   y con `cobroId` igual al identificador opaco de la recepción fuente.
5. Confirmar las operaciones existentes cuando sus referencias sean durables.
6. Sintetizar `EjecucionCobroCliente` para lectura y reconstruir `ResumenCuentaCliente`.

### Cobro con múltiples fuentes y múltiples créditos

Una ejecución puede contener simultáneamente:

- un componente `SALDO_FAVOR`, que consume uno o más movimientos de crédito
  previos sin crear una recepción de dinero;
- uno o más componentes `DINERO_NUEVO`, separados por método de pago y ligados
  a sus propias recepciones;
- N imputaciones que enlazan cada movimiento fuente con cada deuda destino.

Cada comando conserva su propia `idempotencyKey` en su journal y puede conservar
su `requestHash`. El agregado de lectura las expone cuando esa proyección está
disponible; nunca inventa esos valores para registros históricos. La ejecución
no obliga a reutilizar una sola clave para comandos legítimamente distintos.

Cada componente `DINERO_NUEVO` recibido por un rol distinto de `CAJERO` debe
declarar una `custodiaEsperada` completa: custodios y turnos de origen y
destino, con cajas opcionales. Un componente recibido por `CAJERO` debe omitir
esa propiedad. La validación es fail-closed mediante
`esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente`: no completa datos
faltantes ni interpreta identificadores.

Cada imputación `DINERO_NUEVO` del manifest versión `1` usa
`ImputacionCuentaClienteDineroNuevoManifestV1` y exige `cobroId`. El campo une
la aplicación con su recepción concreta incluso cuando una ejecución contiene
varios métodos de pago. Para documentos históricos el campo sigue siendo
opcional. Una imputación `SALDO_FAVOR` consume el crédito señalado por
`movimientoOrigenId` y no exige crear una recepción nueva.

En bordes de entrada, `esImputacionCuentaClienteManifestV1` valida estos
discriminantes y la presencia del vínculo sin recortar ni interpretar los
identificadores opacos. No sustituye las validaciones monetarias o
referenciales del caso de uso.

Los totales del agregado de lectura se interpretan así:

- `montoDineroNuevo`: suma recibida durante la ejecución;
- `montoSaldoFavorAplicado`: crédito previo consumido;
- `montoAplicado`: suma confirmada de imputaciones;
- `montoNoImputado`: dinero nuevo que quedó como crédito abierto;
- `montoSaldoFavorGenerado`: alias opcional de presentación que, cuando se
  publica, debe ser igual a `montoNoImputado`.

### Sobrepago

Si cliente paga más de lo necesario:

- parte aplicada a deuda o cargo se registra con movimiento correspondiente;
- excedente permanece como crédito abierto del `COBRO` o puede modelarse como `DEPOSITO` explícito según caso de negocio;
- si un débito consume crédito previo, crear `ImputacionCuentaCliente`;
- reconstruir `ResumenCuentaCliente` desde abiertos e imputados.

### Uso de saldo a favor

1. Registrar `MovimientoCuentaCliente` tipo `VENTA`.
2. Aplicar créditos previos mediante `ImputacionCuentaCliente`.
3. Reconstruir `ResumenCuentaCliente` según débitos abiertos y créditos no aplicados.

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
- código de constancia, cuando existe;
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

No deja deltas acumulados de resumen.

### Aplicación entre movimientos

`ImputacionCuentaCliente` deja rastro de:

- qué crédito financió qué débito;
- cuánto monto se aplicó;
- relación exacta entre ambos movimientos.

### Lectura resumida

`ResumenCuentaCliente` deja resumen reconstruible de:

- saldo a favor;
- saldo por cobrar.

### Detalle de una ejecución

`DetalleEjecucionCobroCliente` entrega por separado agregado, recepciones,
movimientos, imputaciones y todas las `transferenciasCustodia` de la ejecución.
La colección es lossless: N componentes pueden producir N transferencias y un
alias singular de compatibilidad nunca puede reemplazarla ni recortarla.
`creditosDestino` agrega únicamente datos de presentación como código visible,
monto aplicado y saldo pendiente; no reemplaza la evidencia financiera.
`movimientosCompensatorios` permite mostrar reversas,
devoluciones o ajustes posteriores sin ocultar el cobro original.

`PARCIALMENTE_CONFIRMADA` representa una ejecución con al menos un componente
confirmado y otro rechazado, anulado o revertido. `RECHAZADA`, `ANULADA` y
`REVERTIDA` son terminales de negocio distintos de
`RECUPERACION_REQUERIDA`, que señala efectos técnicos incompletos. Una reversa
no borra la ejecución original: cambia su lectura y conserva sus movimientos
compensatorios.

Un estado privado de journal como `estadoProcesamientoCobro` no se interpreta
como estado financiero ni de custodia. La lectura compartida usa la cabecera de
ejecución, sus componentes y `RecepcionCobroCliente.estado`; así se evita que
un detalle de persistencia duplique o contradiga la máquina de estados oficial.

Cuando una compensación afecta solo parte de las fuentes de un componente, el
estado es `PARCIALMENTE_REVERTIDO`. `montoAplicado` conserva el hecho histórico,
mientras `montoRevertido` y `montoAplicadoNeto` explican el efecto vigente sin
reescribir la operación original.

### Huella canónica del plan

`CabeceraEjecucionCobroCliente.planHash` es SHA-256 aplicado exactamente a la
cadena retornada por `serializarPlanEjecucionCobroClienteCanonico`. Productores
y backend deben consumir ese helper de `yola-fresh-utils`; no deben reconstruir
el algoritmo localmente. La versión vigente normaliza montos a centavos, ordena
créditos y componentes con comparación ordinal ECMAScript y preserva íntegros
los identificadores opacos, incluidos espacios y Unicode. El orden canónico no
expresa prioridad ni semántica de negocio.

Cuando existe `custodiaEsperada`, el canonicalizador copia los seis campos
contractuales en forma estable —cuatro requeridos y dos cajas opcionales— antes
de serializar. Por eso cualquier diferencia de custodio, turno o caja cambia el
`planHash` y permite rechazar la reutilización incompatible de una clave
idempotente. La ausencia correcta para `CAJERO` conserva el hash histórico de
planes que no contienen custodia.

## Regla de oro

No duplicar misma verdad en varias entidades.

Por eso:

- `RecepcionCobroCliente` no reemplaza ledger financiero;
- `TransferenciaCustodiaCobro` no reemplaza recepción original;
- `MovimientoCuentaCliente` no guarda saldo acumulado ni deltas embebidos de resumen;
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

Casos de uso detallados en [casos-de-uso.md](./casos-de-uso.md).

## Regla de consumo de contratos

Toda implementación debe consumir contratos oficiales de `yola-fresh-utils`.

No corresponde:

- redefinir modelos locales equivalentes;
- colapsar recepción y ledger en un solo documento “por comodidad”;
- usar imports internos del paquete;
- usar `ResumenCuentaCliente` como si fuera documento fuente.
- deducir pertenencia a una ejecución o tipo de crédito desde el formato de un identificador.

## Decisiones vigentes observables

- `LIQUIDADO` pertenece al ciclo de `RecepcionCobroCliente` y representa cierre operativo de una recepción ya resuelta;
- `MovimientoCuentaCliente` y `TransferenciaCustodiaCobro` son contratos separados, por lo que custodia y movimiento financiero pueden auditarse sin colapsar en un único documento;
- `AJUSTE` existe como movimiento explícito y debe tratarse como corrección manual, no como sustituto de `REVERSA`;
- `RECHAZADO`, `ANULADO` y `REVERTIDO` expresan decisiones distintas: rechazo operativo, anulación del documento y reversa de movimiento ya registrado;
- `ResumenCuentaCliente` debe reconstruirse desde movimientos vigentes e imputaciones vigentes, no desde deltas guardados por movimiento.
- la idempotencia pertenece a cada componente de `EjecucionCobroCliente`, porque una misma acción puede combinar saldo a favor, efectivo y medios digitales.

## Referencias

- [modelo-vigente.md](./modelo-vigente.md)
- [casos-de-uso.md](./casos-de-uso.md)
- [rfcs/erfc-implementacion-cuenta-cliente.md](./rfcs/erfc-implementacion-cuenta-cliente.md)
- [../modelo-vigente.md](../modelo-vigente.md)
