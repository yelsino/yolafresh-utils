# Transferencias de inventario

## Decisión de dominio

`TransferenciaInventarioV2` es la raíz canónica con
`type: "transferencia_inventario_v2"`. Sus cantidades se expresan y concilian
en unidad base.

La transferencia representa una orden y su ciclo de custodia. Solo
`MovimientoInventarioV2` modifica stock:

1. `BORRADOR`: no modifica stock;
2. `ENVIADA`: produce una única `TRANSFERENCIA_SALIDA` por el total despachado;
3. `PARCIALMENTE_RECIBIDA`: conserva uno o más recibos y todavía tiene cantidad
   en tránsito;
4. `RECIBIDA`: toda la cantidad enviada fue aceptada;
5. `CERRADA_CON_DIFERENCIA`: toda la cantidad quedó conciliada, pero una parte
   fue rechazada o declarada faltante;
6. `CANCELADA`: solo procede desde `BORRADOR`, antes de la salida.

Una transferencia enviada no se cancela eliminando la salida. Un retorno o una
regularización posterior se representa con hechos compensatorios explícitos.

## Cantidades y recepción real

Cada línea congela producto base, unidad base, cantidad comercial, cantidad
base y conversión. Si incluye `presentacionId`, también exige
`versionConversion` como entero seguro positivo. La única variante sin versión
es la captura directa en unidad base: no incluye presentación, usa factor `1`
y la unidad de operación coincide con la unidad base.

`recepciones` es un historial append-only. Cada recibo contiene:

- `id`, actor, fecha, `operationId` e `idempotencyKey` propios;
- `expectedVersion`, que declara la versión de raíz observada;
- por línea, cantidades base aceptada, rechazada y faltante;
- motivo obligatorio cuando existe rechazo o faltante;
- evidencias opcionales;
- un `movimientoEntradaId` determinista.

Solo la cantidad aceptada entra al almacén destino. Rechazado y faltante son
resultados terminales; la cantidad omitida en un recibo continúa en tránsito.
Por eso:

`en tránsito = enviado - aceptado - rechazado - faltante`

El resumen expone el cálculo por línea y totales agrupados por `unidadBase`;
nunca suma kilogramos, litros, metros y unidades como si fueran comparables.

Un recibo físico debe aceptar alguna cantidad y genera exactamente una entrada.
Si todo el remanente se perdió sin una recepción física, `cierreDiferencia`
concilia el faltante sin fabricar un movimiento de entrada cero.

Este diseño sigue la práctica de tratar cada recepción parcial como una
transacción separada y de conservar discrepancias de recepción. Véanse
[Microsoft: inbound load handling](https://learn.microsoft.com/en-us/dynamics365/supply-chain/warehousing/inbound-load-handling)
y [Microsoft: transfer-order receiving](https://learn.microsoft.com/en-us/dynamics365/supply-chain/warehousing/configure-transfer-order-receiving-process).

## Concurrencia e idempotencia

La raíz comienza con `version: 1`. Envío, cada recibo, cierre por diferencia o
cancelación agregan exactamente una versión. Toda acción posterior a crear
lleva `expectedVersion`.

`validarEvolucionTransferenciaInventarioV2(actual, candidata)` exige:

- replay idéntico para repetir la misma versión;
- incremento exacto de una versión para una mutación real;
- una sola acción nueva;
- historial de recibos append-only;
- `expectedVersion` igual a la versión vigente;
- identidad, líneas enviadas y correlación inmutables.

El adapter debe combinar esta validación con `_rev` de CouchDB o CAS equivalente.
Dos tablets pueden preparar recibos desde la misma versión, pero solo uno puede
ganar el CAS; el otro debe releer, recalcular la cantidad en tránsito y volver a
presentar una nueva versión. Nunca se fusionan cantidades a ciegas.

Los IDs físicos también son deterministas:

- una salida por transferencia;
- una entrada por `transferenciaId + recepcionId`.

`construirMovimientosTransferenciaInventarioV2` es puro y materializa todos los
hechos exigidos por la versión validada. El consumer persiste raíz, movimiento y
proyecciones en una transacción SQLite y publica el conjunto con barrera causal.

## Permisos

Permisos canónicos:

- `inventario:transferencia:ver`
- `inventario:transferencia:crear`
- `inventario:transferencia:enviar`
- `inventario:transferencia:recibir`
- `inventario:transferencia:cancelar`

Cancelar es una acción crítica, auditable y con sesión activa.

## Integración

Snapshot, bootstrap, SQLite, sync y backend incorporan el mismo `type`. La
migración de datos históricos es una herramienta externa y nunca reinterpreta
cantidades por presentación sin evidencia de conversión.

## Referencias internas

- [transferencia-inventario-v2.contract.ts](../../domain/inventario/contracts/transferencia-inventario-v2.contract.ts)
- [inventory-transfer-v2.helpers.ts](../../domain/inventario/services/inventory-transfer-v2.helpers.ts)
- [politicas-y-mermas-v2.md](./politicas-y-mermas-v2.md)
