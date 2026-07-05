# Recurrencias

## Propósito

Esta subcarpeta agrupa documentación del tema `Recurrencias` dentro del Domain `finanzas`.

Aquí se separa:

- documentación histórica de consumo para backend;
- documentación histórica de consumo para frontend u offline-first;
- material de ideación y contexto histórico.

La evidencia vigente principal está en:

- [recurrencia.contract.ts](../../../domain/finanzas/contracts/recurrencia.contract.ts)
- [RecurrenciaEntity.ts](../../../domain/finanzas/entities/RecurrenciaEntity.ts)

## Documentos

- [backend.md](./backend.md): guía histórica de consumo backend.
- [frontend.md](./frontend.md): guía histórica de consumo frontend y offline-first.
- [historico/recurrentes.md](./historico/recurrentes.md): contexto de ideación y casos de uso potenciales.

## Lectura correcta

- `Recurrencia` sigue siendo contrato vigente;
- `RecurrenciaEntity` sigue siendo comportamiento vigente;
- scheduler, processor y ejecución concreta siguen fuera del paquete;
- estos documentos no sustituyen contratos canónicos ni reglas de negocio vigentes de `finanzas`.

## Referencias

- [../README.md](../README.md)
- [../modelo-vigente.md](../modelo-vigente.md)
