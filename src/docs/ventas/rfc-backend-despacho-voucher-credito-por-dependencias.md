# RFC: Backend - Despacho de Voucher de Crédito por Dependencias

## Estado

Propuesto.

## Propósito

Este RFC define cómo debe implementarse en backend consumidor el envío automático de voucher para ventas a crédito sin depender de polling bruto ni de carreras temporales entre `Venta`, `VentaSnapshot` y `CuentaCliente`.

No modifica contratos de `yolafresh-utils`.

Define forma recomendada de orquestación para proyectos consumidores que:

- generan `Venta`;
- generan `VentaSnapshot`;
- registran movimiento financiero en `CuentaCliente`;
- envían voucher por WhatsApp u otro canal.

## Evidencia

### Evidencia de dominio en paquete compartido

- [Venta.ts](../../domain/ventas/entities/Venta.ts): `Venta` representa hecho comercial confirmado.
- [VentaSnapshot.ts](../../domain/ventas/entities/VentaSnapshot.ts): `VentaSnapshot` representa snapshot histórico mostrable.
- [cuenta-cliente.contract.ts](../../domain/finanzas/contracts/cuenta-cliente.contract.ts): `CuentaCliente` representa efecto financiero, no documento comercial base.
- [guia-de-consumo.md](./guia-de-consumo.md): diferencia entre flujo operativo de venta y snapshot histórico.
- [relaciones-interdominio.md](./relaciones-interdominio.md): ventas y cuenta cliente son dominios relacionados pero con ownership distinto.

### Evidencia operativa observada en backend

Bitácora de depuración local:

- [debug-credit-voucher-missed.md](../../../debug-credit-voucher-missed.md)

Hallazgos en logs del backend para `2026-07-13 17:00-22:00` hora Lima:

- `14` eventos `cuenta_cliente_venta_ok`
- `14` eventos `auto_send_credito_voucher_queued`
- `11` eventos `auto_send_credito_voucher_failed`
- `3` eventos `auto_send_credito_voucher_sent`

Errores dominantes:

- `venta_not_found`
- `venta_snapshot_not_found`

Interpretación sustentada:

- backend sí dispara autoenvío al observar movimiento financiero;
- una parte de esos envíos ocurre antes de que `Venta` o `VentaSnapshot` estén disponibles para armar voucher;
- por eso el problema principal no es ausencia de intención de envío, sino mala condición de disparo.

## Problema

Flujo actual inferido por logs:

1. se registra venta a crédito en `CuentaCliente`;
2. backend encola autoenvío de voucher;
3. worker intenta resolver `Venta` y `VentaSnapshot`;
4. si aún no existen o no son visibles, falla;
5. algunas ventas luego reintentan o se reprocesan y sí salen; otras quedan perdidas.

Eso produce comportamiento intermitente:

- mismo flujo de negocio;
- distinto resultado técnico;
- operador y cliente perciben aleatoriedad;
- sistema rompe trazabilidad de notificación.

## Decisión

Se decide que:

1. `cuenta_cliente_venta_ok` puede seguir siendo señal de inicio.
2. Esa señal no debe disparar envío directo.
3. Esa señal debe crear una **intención persistente de despacho**.
4. El envío solo debe ocurrir cuando dependencias requeridas estén completas.
5. La completitud no se resuelve por polling fijo, sino por transición de estado ante eventos de disponibilidad.

## Principio arquitectónico

`CuentaCliente` crea obligación financiera.

`VentaSnapshot` habilita render del voucher.

`Venta` identifica hecho comercial.

Por tanto:

- evento financiero puede crear intención;
- evento financiero no debe ejecutar envío final;
- envío final requiere readiness de dependencias.

## Modelo recomendado

### Documento de orquestación

Backend consumidor debe persistir un documento técnico, por ejemplo:

- `credit_voucher_dispatch`

Responsabilidad:

- representar intención de envío;
- mantener estado de dependencias;
- servir de fuente autoritativa para worker de despacho;
- evitar que reintentos dependan de memoria temporal.

### Estado mínimo recomendado

- `id`
- `tenantId`
- `ventaId`
- `clienteId`
- `movimientoCuentaClienteId`
- `snapshotId?`
- `numeroDestino?`
- `estado`
- `ventaReady`
- `snapshotReady`
- `recipientReady`
- `attemptCount`
- `lastError?`
- `createdAt`
- `updatedAt`
- `readyAt?`
- `sentAt?`

### Estados recomendados

- `PENDING_DEPENDENCIES`
- `READY_TO_SEND`
- `SENDING`
- `SENT`
- `FAILED_RETRYABLE`
- `FAILED_TERMINAL`

## Regla de completitud

Un dispatch queda `READY_TO_SEND` solo cuando:

- existe `Venta`;
- existe `VentaSnapshot`;
- existe destinatario válido;
- no existe evidencia de envío previo exitoso.

Forma compacta:

```txt
ventaReady && snapshotReady && recipientReady && !sent
```

## Flujo recomendado

### Paso 1. Señal financiera crea intención

Cuando backend observe evento equivalente a:

- `cuenta_cliente_venta_ok`

y ese movimiento corresponda a venta con `condicionPago = CREDITO`:

- crear o actualizar `credit_voucher_dispatch`;
- dejar estado `PENDING_DEPENDENCIES`;
- no intentar enviar todavía.

### Paso 2. Persistencia de `Venta` completa dependencia comercial

Cuando backend observe creación o disponibilidad de `Venta`:

- buscar dispatch por `ventaId`;
- marcar `ventaReady = true`;
- recalcular estado.

### Paso 3. Persistencia de `VentaSnapshot` completa dependencia documental

Cuando backend observe creación o disponibilidad de `VentaSnapshot`:

- buscar dispatch por `ventaId`;
- marcar `snapshotReady = true`;
- guardar `snapshotId`;
- recalcular estado.

### Paso 4. Disponibilidad de canal completa dependencia de envío

Cuando backend resuelva número o destinatario válido:

- marcar `recipientReady = true`;
- guardar `numeroDestino`;
- recalcular estado.

### Paso 5. Worker consume solo `READY_TO_SEND`

Worker de mensajería debe:

- tomar documentos `READY_TO_SEND`;
- pasar a `SENDING`;
- intentar render + envío;
- marcar `SENT` si sale bien;
- marcar `FAILED_RETRYABLE` si falla canal;
- marcar `FAILED_TERMINAL` solo por errores no recuperables.

## Qué no debe hacerse

- no enviar voucher directamente al crear movimiento financiero;
- no fallar definitivo por `venta_not_found`;
- no fallar definitivo por `venta_snapshot_not_found`;
- no usar cron de “revisar cada X segundos si apareció snapshot” como mecanismo principal;
- no depender de memoria del proceso para recordar pendientes.

## Qué sí debe hacerse

- persistir intención de despacho;
- reaccionar a eventos de disponibilidad de dependencias;
- recalcular readiness por evento;
- usar retry con backoff solo para entrega real del canal;
- mantener idempotencia por `ventaId` o `dispatchId`.

## Polling vs. reacción por eventos

### Enfoque incorrecto

```txt
cada 5 segundos:
  buscar dispatch incompletos
  preguntar si ya existe venta
  preguntar si ya existe snapshot
```

Problemas:

- ruido innecesario;
- costo operacional;
- retraso artificial;
- diseño frágil y opaco.

### Enfoque correcto

```txt
movimiento financiero -> crea dispatch pendiente
venta creada -> completa ventaReady
snapshot creado -> completa snapshotReady
destinatario válido -> completa recipientReady
dispatch listo -> worker envía
```

Ventaja:

- tiempo no define readiness;
- hechos sí definen readiness.

## Retry correcto

Retry aplica solo a envío real por canal, por ejemplo:

- WhatsApp caído;
- proveedor timeout;
- fallo transitorio de red.

No aplica como estrategia principal para descubrir dependencias faltantes.

Para delivery retryable:

- backoff exponencial o escalonado;
- límite de intentos;
- trazabilidad de error;
- opción de reproceso manual.

## Idempotencia

Para evitar duplicados:

- un `dispatch` por `ventaId + tipoDeVoucher`;
- envío exitoso debe dejar marca persistente;
- reproceso no debe crear múltiples vouchers para misma venta sin intención explícita.

## Pseudocódigo de referencia

```ts
function onCuentaClienteVentaOk(evento: CuentaClienteVentaOk) {
  upsertDispatch({
    ventaId: evento.origenId,
    clienteId: evento.clienteId,
    movimientoCuentaClienteId: evento.movimientoId,
    estado: "PENDING_DEPENDENCIES",
    ventaReady: false,
    snapshotReady: false,
    recipientReady: false,
  });
}

function onVentaDisponible(venta: Venta) {
  const dispatch = findDispatchByVentaId(venta.id);
  if (!dispatch) return;

  dispatch.ventaReady = true;
  recomputeDispatchState(dispatch);
}

function onVentaSnapshotDisponible(snapshot: VentaSnapshot) {
  const dispatch = findDispatchByVentaId(snapshot.ventaId);
  if (!dispatch) return;

  dispatch.snapshotReady = true;
  dispatch.snapshotId = snapshot.id;
  recomputeDispatchState(dispatch);
}

function onRecipientDisponible(ventaId: string, numero: string) {
  const dispatch = findDispatchByVentaId(ventaId);
  if (!dispatch) return;

  dispatch.recipientReady = true;
  dispatch.numeroDestino = numero;
  recomputeDispatchState(dispatch);
}

function recomputeDispatchState(dispatch: CreditVoucherDispatch) {
  const ready =
    dispatch.ventaReady &&
    dispatch.snapshotReady &&
    dispatch.recipientReady &&
    dispatch.estado !== "SENT";

  if (ready) {
    dispatch.estado = "READY_TO_SEND";
    dispatch.readyAt = new Date().toISOString();
  }
}
```

## Beneficios esperados

- elimina carrera entre movimiento financiero y snapshot;
- reduce fallos `venta_not_found`;
- reduce fallos `venta_snapshot_not_found`;
- vuelve determinístico flujo de voucher;
- permite observabilidad clara de qué falta en cada caso;
- separa dependencia de negocio de dependencia técnica de entrega.

## Riesgos y decisiones abiertas

### Riesgo 1. Backend actual quizá no emite eventos de `Venta` o `VentaSnapshot`

Si no existen listeners claros, backend consumidor debe introducir:

- outbox;
- change feed;
- hooks de persistencia;
- o process manager explícito.

### Riesgo 2. Destinatario puede cambiar después

Debe definirse si `numeroDestino`:

- se congela al crear dispatch;
- o se resuelve al momento de quedar `READY_TO_SEND`.

### Riesgo 3. Snapshot puede no existir nunca

Si backend decide que ciertos errores impiden snapshot permanente:

- dispatch debe quedar visible como `FAILED_TERMINAL` o `PENDING_DEPENDENCIES` con razón explícita;
- no debe desaparecer silenciosamente.

## Recomendación final

- mantener `cuenta_cliente_venta_ok` como señal financiera de inicio;
- introducir `credit_voucher_dispatch` como documento de orquestación;
- completar dependencias por eventos de `Venta`, `VentaSnapshot` y destinatario;
- despachar voucher solo desde `READY_TO_SEND`;
- reservar retry temporal para fallos de canal, no para descubrir dependencias.

## Referencias

- [README.md](./README.md)
- [guia-de-consumo.md](./guia-de-consumo.md)
- [relaciones-interdominio.md](./relaciones-interdominio.md)
- [rfc-pos-manual-override-y-snapshot-no-bloqueante.md](./rfc-pos-manual-override-y-snapshot-no-bloqueante.md)
- [notificaciones-implementation-plan.md](../notificaciones-implementation-plan.md)
- [Venta.ts](../../domain/ventas/entities/Venta.ts)
- [VentaSnapshot.ts](../../domain/ventas/entities/VentaSnapshot.ts)
- [cuenta-cliente.contract.ts](../../domain/finanzas/contracts/cuenta-cliente.contract.ts)
- [debug-credit-voucher-missed.md](../../../debug-credit-voucher-missed.md)
