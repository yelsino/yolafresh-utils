# Recurrencias para backend

> Documento histórico de apoyo.
> La evidencia vigente debe leerse en `src/domain/finanzas/contracts/recurrencia.contract.ts` y `src/domain/finanzas/entities/RecurrenciaEntity.ts`.
> Este documento ya no debe interpretarse como guía literal de implementación, porque el repositorio actual no contiene `RecurrenciaProcessor`.

## Propósito

Este documento explica cómo un backend puede consumir el modelado de recurrencias que todavía expone `yolafresh-utils`.

## Qué sí aporta hoy la librería

### Contratos

La librería mantiene en `src/domain/finanzas/contracts/recurrencia.contract.ts`:

- `Recurrencia`
- `ReglaRecurrencia`
- `TipoAccionRecurrencia`
- `EjecucionRecurrencia`
- `RecurrenciaDispatch`
- `RecurrenciaActionHandler`

Lectura correcta:

- el contrato describe programación, acción y payload;
- la ejecución es un registro contractual posible, no un scheduler listo para usar;
- varias acciones siguen tipadas como `unknown`, por lo que requieren validación adicional en consumers.

### Entidad

La librería mantiene `RecurrenciaEntity` en `src/domain/finanzas/entities/RecurrenciaEntity.ts`.

Responsabilidades observadas:

- crear recurrencias activas;
- pausar, activar y anular;
- reprogramar la regla;
- calcular `siguienteEjecucionAt`.

## Qué ya no aporta el repositorio actual

Durante esta auditoría no se encontró `RecurrenciaProcessor.ts`.

Por lo tanto, el paquete actual no entrega:

- scheduler operativo;
- processor listo para decidir ejecución;
- dispatcher concreto;
- handlers de acciones;
- cron, colas o locks.

## Arquitectura recomendada

Separación sugerida para consumers backend:

- librería: contratos + `RecurrenciaEntity`;
- aplicación: casos de uso de alta, pausa, anulación y ejecución;
- infraestructura: persistencia, scheduler, locks, outbox y observabilidad.

## Flujo recomendado para consumer backend

### 1. Alta o edición

- crear o reconstruir `RecurrenciaEntity`;
- persistir `Recurrencia` como documento propio del backend;
- añadir metadatos de tenant, partición o trazabilidad fuera del contrato base si hacen falta.

### 2. Selección de candidatas

- consultar recurrencias `ACTIVA`;
- filtrar por `siguienteEjecucionAt <= now`;
- resolver concurrencia e idempotencia en infraestructura propia.

### 3. Decisión de ejecución

Como no existe processor canónico en la librería actual, el consumer debe decidir:

- si la recurrencia todavía está vigente;
- si corresponde ejecutar en `now`;
- cómo construir `EjecucionRecurrencia`;
- cómo recalcular y persistir la siguiente programación.

### 4. Despacho

- traducir `accion` + `payload` a casos de uso propios;
- registrar ejecución, error o anulación según política del backend;
- evitar que el contrato de recurrencia dispare efectos externos por sí solo.

## Reglas operativas recomendadas

- usar idempotencia por `recurrenciaId` + `scheduledFor`;
- separar decisión de ejecución de efectos externos;
- persistir auditoría de ejecución fuera de la entidad;
- no mezclar cron, repositorio y handlers dentro del dominio compartido.

## Tiempo y UTC

La regla usa `horarioUTC`.

Lectura recomendada:

- persistir tiempos en UnixMillis;
- convertir horario local a UTC al capturar la regla;
- comparar ejecuciones contra `Date.now()` o reloj equivalente del backend.

## Decisiones vigentes observables

- la librería actual no publica processor operativo de recurrencias; esa responsabilidad queda en consumers;
- acciones con payload tipado estable hoy: `CREAR_EGRESO` y `CREAR_CARGO_CLIENTE`; resto del mapa permanece extensible y genérico;
- `EjecucionRecurrencia` existe como contrato de ejecución auditable disponible para backends que quieran persistir despacho y resultado.

## Referencias

- [../README.md](../README.md)
- [../core/README.md](../core/README.md)
- [../core/contratos-compartidos.md](../core/contratos-compartidos.md)
