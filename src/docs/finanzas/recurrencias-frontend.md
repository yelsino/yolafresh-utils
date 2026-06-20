# Recurrencias (contratos y procesadores disponibles)

Este documento describe lo que la librería expone para que un frontend/consumer pueda:
- registrar recurrencias
- listar y mostrar próximas ejecuciones
- ejecutar un scheduler local (offline-first)
- generar documentos (sin I/O) y persistirlos en su propia app

## Importaciones

Desde la librería puedes usar:
- Contratos: `Recurrencia`, `ReglaRecurrencia`, `TipoAccionRecurrencia`, `EjecucionRecurrencia`
- Entidad: `RecurrenciaEntity`
- Procesador: `RecurrenciaProcessor`

Rutas habituales:
- `import { RecurrenciaEntity, RecurrenciaProcessor } from "yola-fresh-utils";`
- `import type { Recurrencia } from "yola-fresh-utils";`

## Contrato principal: `Recurrencia`

Una recurrencia define:
- `regla`: cuándo debe ejecutarse (frecuencia + horario UTC)
- `accion`: qué acción debe despachar cuando se ejecuta (ej: `CREAR_EGRESO`)
- `payload`: datos para que un handler (en tu app) ejecute la acción
- `siguienteEjecucionAt`: timestamp (UnixMillis) que el scheduler usa para decidir si corresponde ejecutar

Archivo: `src/domain/shared/interfaces/recurrencias.ts`

## Reglas soportadas (scheduler)

`ReglaRecurrencia` soporta:
- `frecuencia`: `DIARIA | SEMANAL | MENSUAL | ANUAL`
- `intervalo`: cada cuántas unidades (default 1)
- `horarioUTC`: `{ hora, minuto }` (se interpreta en UTC)
- `diasSemana`: (solo semanal) array de `0..6` (Domingo=0)
- `diaMes`: (mensual/anual) `1..31` (si el mes no tiene ese día, se usa el último día del mes)
- `mes`: (anual) `1..12`

## Acciones soportadas (despacho)

La recurrencia es un motor genérico: agenda y despacha acciones.

La librería expone `TipoAccionRecurrencia` con acciones base (y permite extenderlo):
- `CREAR_EGRESO`
- `CREAR_CARGO_CLIENTE`
- `CREAR_MERMA`
- `CREAR_COMPRA`
- `CREAR_RECORDATORIO`
- `ENVIAR_WHATSAPP`
- `GENERAR_REPORTE`
- `CREAR_VENTA`

El contenido de `payload` depende de la acción. Para acciones base, existe un mapa de payloads (`RecurrenciaAccionPayloadMap`) que puedes usar/expandir.

## Entidad: `RecurrenciaEntity`

La entidad te ayuda a crear y administrar una recurrencia:
- `RecurrenciaEntity.crear(...)` crea una recurrencia activa con `siguienteEjecucionAt` calculado
- `activar() / pausar() / anular()`
- `reprogramarRegla(regla)`
- `toJSON()` para persistir el contrato `Recurrencia` en tu DB local

## Procesador: `RecurrenciaProcessor`

### `ejecutarSiCorresponde({ recurrencia, now })`

Entrada:
- `recurrencia`: contrato `Recurrencia`
- `now`: UnixMillis opcional (default `Date.now()`)

Salida:
- `null` si no corresponde (no está activa, fuera de rango, o aún no llega `siguienteEjecucionAt`)
- si corresponde, retorna:
  - `recurrenciaActualizada` (con `ultimaEjecucionAt`, `siguienteEjecucionAt` y `updatedAt`)
  - `ejecucion` (`EjecucionRecurrencia`) en estado `DESPACHADA` con `{ accion, payload }`

Tip: puedes tratar `ejecucion` como un `RecurrenciaDispatch` para pasarlo a tu dispatcher/handlers.

## Flujo recomendado (frontend / consumer)

1) El usuario crea una recurrencia desde UI (form):
   - frecuencia, horario, intervalo
   - acción (egreso o cargo cliente)

2) Persistir localmente:
   - guardar `Recurrencia` en SQLite (vía PouchDB adapter sqlite)

3) Scheduler local (offline-first):
   - en background o al abrir la app, obtener recurrencias activas
   - para cada una, llamar `RecurrenciaProcessor.ejecutarSiCorresponde`
   - si retorna resultado:
     - persistir `EjecucionRecurrencia`
     - encolar o ejecutar un dispatcher local: `switch (ejecucion.accion)` → handler
     - los handlers crean y persisten documentos (ej: `Egreso`, `AccountEntry`, etc.)
     - actualizar la `Recurrencia` con `recurrenciaActualizada`

4) Sync:
   - sincronizar documentos hacia CouchDB cuando haya conexión
   - tratar ejecuciones como idempotentes (no re-ejecutar si ya existe una `EjecucionRecurrencia` para el mismo `scheduledFor`)

## UI mínima sugerida

- Lista de recurrencias (ACTIVA/PAUSADA/ANULADA)
- Detalle de recurrencia (regla + acción)
- Historial de ejecuciones (DESPACHADA/COMPLETADA/FALLIDA)
- Acciones: pausar, reanudar, anular, editar regla
- Vista “próximas ejecuciones” (calculada a partir de `siguienteEjecucionAt` y la regla)
