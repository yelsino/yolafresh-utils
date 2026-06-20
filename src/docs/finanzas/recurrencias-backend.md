# Recurrencias (implementación backend / worker)

Este documento explica cómo implementar en un backend (API + worker) el motor de recurrencias usando lo que expone `yola-fresh-utils`.

La librería NO hace I/O: no persiste, no agenda jobs, no ejecuta cron. Solo entrega contratos, una entidad (`RecurrenciaEntity`) y un procesador puro (`RecurrenciaProcessor`) que despacha una acción + payload (sin ejecutar handlers).

## Qué te da la librería

- Contratos:
  - `Recurrencia`, `ReglaRecurrencia`, `TipoAccionRecurrencia`
  - `EjecucionRecurrencia`
  - Archivo: `src/domain/shared/interfaces/recurrencias.ts`

- Entidad:
  - `RecurrenciaEntity` (crear/pausar/anular/reprogramar + cálculo de `siguienteEjecucionAt`)
  - Archivo: `src/domain/finanzas/Recurrencia.ts`

- Procesador:
  - `RecurrenciaProcessor.ejecutarSiCorresponde({ recurrencia, now })`
  - Genera un dispatch sin I/O: `EjecucionRecurrencia` con `{ accion, payload }`
  - Archivo: `src/domain/finanzas/RecurrenciaProcessor.ts`

## Contratos de salida (dispatch)

El procesador no crea documentos de negocio. Solo:
- decide si corresponde ejecutar (`now >= siguienteEjecucionAt`)
- genera una `EjecucionRecurrencia` en estado `DESPACHADA` con `{ accion, payload }`
- calcula `siguienteEjecucionAt` y retorna `recurrenciaActualizada`

Luego tu backend aplica:
- Action Dispatcher (`switch (accion)`)
- Handlers especializados (crear egreso, merma, compra, WhatsApp, etc.)

## Arquitectura recomendada (Clean/Hexagonal)

- **Dominio (librería)**: `RecurrenciaEntity`, `RecurrenciaProcessor`
- **Aplicación (tu backend)**: casos de uso (crear/editar/pausar/ejecutar)
- **Infra (tu backend)**: repositorios (CouchDB), scheduler (cron/queue), lock distribuido, observabilidad

## API mínima sugerida (backend)

### Recurrencias

- `POST /recurrencias`
  - crea una `Recurrencia` usando `RecurrenciaEntity.crear(...)`
  - persiste contrato `Recurrencia`

- `GET /recurrencias?estado=ACTIVA|PAUSADA|ANULADA`
  - lista recurrencias

- `PATCH /recurrencias/:id`
  - editar `nombre` y/o `regla` (recalcular `siguienteEjecucionAt`)

- `POST /recurrencias/:id/pausar`
- `POST /recurrencias/:id/activar`
- `POST /recurrencias/:id/anular`

### Ejecuciones (historial)

- `GET /recurrencias/:id/ejecuciones`
  - lista `EjecucionRecurrencia` (útil para auditoría y UI admin)

## Worker / scheduler (cómo ejecutarlas)

### Loop recomendado

1) Consultar recurrencias `ACTIVA` donde `siguienteEjecucionAt <= now`.
2) Para cada recurrencia candidata:
   - adquirir lock (por `recurrenciaId`) para evitar doble ejecución concurrente
   - volver a leer la recurrencia (evitar stale)
   - ejecutar `RecurrenciaProcessor.ejecutarSiCorresponde({ recurrencia, now })`
   - si retorna `null`: liberar lock y continuar
   - si retorna resultado:
     - persistir `EjecucionRecurrencia`
     - encolar/ejecutar dispatcher → handlers especializados
     - los handlers crean/persisten documentos (ej: `Egreso`, `AccountEntry`, `MovimientoInventario`, etc.)
     - persistir `recurrenciaActualizada`

### Idempotencia (obligatorio)

Riesgo: dos workers ejecutan la misma recurrencia, o un retry vuelve a ejecutar.

Recomendación:
- Tratar la ejecución como idempotente por `(recurrenciaId, scheduledFor)`.
- Al persistir `EjecucionRecurrencia`, asegurar unicidad lógica para ese par.
- Si ya existe una ejecución `DESPACHADA` o `COMPLETADA` para ese `scheduledFor`, no despachar otra vez.

### Concurrencia y locks

Opciones comunes:
- Lock en DB (documento “lock” con TTL)
- Redis lock (si está permitido)
- Cola con single-consumer por partición (si usas queue)

El objetivo es que una recurrencia no se ejecute simultáneamente dos veces.

### Manejo de fallos

Cuando el procesador retorna `FALLIDA`:
- persistir `EjecucionRecurrencia` con `estado="FALLIDA"` y `error`
- decidir política de retry en tu backend:
  - retry inmediato con backoff
  - reintento al siguiente ciclo del scheduler
  - “pausar” automáticamente si falla N veces (operación)

Importante: el dispatch + la persistencia de documentos del handler deben ser transaccionales lógicamente (o con outbox) para evitar ejecuciones “a medias”.

## Consideraciones de tiempo (UTC)

La regla usa `horarioUTC`. Recomendación:
- guardar `siguienteEjecucionAt` en UnixMillis (UTC)
- el worker compara con `Date.now()`
- si tu UI permite configurar “hora local”, conviértela a UTC al guardar la regla

## Multi-empresa / multi-sucursal

Si tu backend es multi-tenant:
- añade en tu app campos de partición (p. ej. `empresaId`, `sucursalId`) al documento que persiste `Recurrencia`
- filtra ejecución por tenant
- el lock debe incluir el tenant

La librería mantiene el contrato de recurrencia genérico para que puedas extender el documento en tu backend.

## Dispatcher y handlers (backend)

El patrón recomendado:

Scheduler
  ↓
Recurrencias vencidas
  ↓
`RecurrenciaProcessor` (despacha acción)
  ↓
Action Dispatcher
  ↓
Handlers especializados

Tipos de ayuda (librería):
- `RecurrenciaDispatch`
- `RecurrenciaActionHandler<TAction>`

Ejemplo de handlers típicos:
- `handleCrearEgreso(payload)` → crea `Egreso` (+ caja/ledger si aplica)
- `handleCrearMerma(payload)` → crea movimiento inventario/merma
- `handleEnviarWhatsApp(payload)` → llama proveedor de mensajería
- `handleGenerarReporte(payload)` → genera reporte y lo guarda/notifica

Los handlers son quienes entienden el negocio. La recurrencia solo agenda y dispara.

## Observabilidad (operación)

Recomendado exponer:
- métricas de ejecuciones por estado (DESPACHADA/COMPLETADA/FALLIDA)
- latencia de ejecución
- número de acciones despachadas
- top recurrencias con más fallos

## Qué NO hace la librería (por diseño)

- No define repositorios, ni capa HTTP, ni cron/queue
- No implementa persistencia (CouchDB/SQL)
- No decide contabilidad/ledger automáticamente

La librería solo garantiza que:
- el cálculo de “cuándo toca” es consistente (vía `siguienteEjecucionAt`)
- el despacho de acciones es determinístico y sin efectos colaterales
