# Recurrencias para frontend o app offline-first

> Documento histórico de apoyo.
> La evidencia vigente del paquete debe leerse en `src/domain/finanzas/contracts/recurrencia.contract.ts` y `src/domain/finanzas/entities/RecurrenciaEntity.ts`.
> Este documento ya no puede asumirse como guía literal de consumo porque el repositorio actual no publica `RecurrenciaProcessor`.

## Propósito

Este documento describe cómo un consumer frontend o app offline-first puede apoyarse en los contratos de recurrencias que aún existen en `yolafresh-utils`.

## Qué expone hoy la librería

### Contratos

Disponibles desde `src/domain/finanzas/contracts/recurrencia.contract.ts`:

- `Recurrencia`
- `ReglaRecurrencia`
- `TipoAccionRecurrencia`
- `EjecucionRecurrencia`
- `RecurrenciaDispatch`

### Entidad

Disponible como comportamiento de dominio:

- `RecurrenciaEntity`

Responsabilidades observadas:

- crear recurrencias activas;
- pausar, activar y anular;
- reprogramar regla;
- calcular `siguienteEjecucionAt`.

## Qué ya no expone el repositorio actual

Durante la auditoría no se encontró `RecurrenciaProcessor`.

Por eso la librería actual no entrega:

- scheduler local listo para usar;
- función canónica `ejecutarSiCorresponde`;
- dispatcher local de acciones;
- handlers concretos para egresos, cargos, compras o recordatorios.

## Importación recomendada

Valores publicados en raíz:

```ts
import { RecurrenciaEntity } from "yola-fresh-utils";
```

Contratos compartidos:

```ts
import type {
  EjecucionRecurrencia,
  Recurrencia,
  ReglaRecurrencia,
  TipoAccionRecurrencia,
} from "yola-fresh-utils";
```

## Lectura correcta del modelo

### `Recurrencia`

Declara:

- regla temporal;
- acción a despachar;
- payload;
- rango de vigencia;
- próxima ejecución calculada.

### `ReglaRecurrencia`

Define:

- frecuencia `DIARIA | SEMANAL | MENSUAL | ANUAL`;
- intervalo;
- horario UTC;
- días de semana o día de mes cuando aplica.

### `EjecucionRecurrencia`

Representa un rastro contractual posible de despacho o resultado, pero no implica que la librería lo genere automáticamente.

## Flujo recomendado para consumer offline-first

### 1. Captura

- crear o reconstruir `RecurrenciaEntity`;
- persistir `Recurrencia` en almacenamiento local del consumer;
- añadir metadata local fuera del contrato base cuando haga falta.

### 2. Evaluación

El consumer debe decidir por su cuenta:

- cuándo revisar recurrencias activas;
- cómo comparar `siguienteEjecucionAt` con reloj local;
- cómo registrar una `EjecucionRecurrencia`;
- cómo recalcular el siguiente disparo.

### 3. Despacho local

- traducir `accion` y `payload` a casos de uso propios;
- crear documentos locales según política del producto;
- mantener idempotencia para no duplicar ejecuciones cuando reaparece conectividad.

## Restricciones observadas

- varias acciones del mapa contractual siguen con `payload` tipado como `unknown`;
- la librería no conoce SQLite, CouchDB, PouchDB ni sincronización concreta;
- la librería no decide por sí sola si una recurrencia ya fue ejecutada en el dispositivo.

## Decisiones vigentes observables

- la librería no publica processor reutilizable para ejecutar recurrencias en frontend;
- acciones oficiales con payload tipado estable hoy: `CREAR_EGRESO` y `CREAR_CARGO_CLIENTE`; extensiones adicionales usan payload genérico;
- la auditoría de ejecuciones puede apoyarse en `EjecucionRecurrencia`, pero sincronización y persistencia concreta pertenecen al consumer.

## Referencias

- [../README.md](../README.md)
- [../core/README.md](../core/README.md)
- [../core/contratos-compartidos.md](../core/contratos-compartidos.md)
