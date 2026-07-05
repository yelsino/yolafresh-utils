# Posibles usos de recurrencias

> Documento histórico de ideación.
> No define contratos canónicos ni alcance vigente del paquete.
> La evidencia oficial de recurrencias vive en `src/domain/finanzas/contracts/recurrencia.contract.ts` y `src/domain/finanzas/entities/RecurrenciaEntity.ts`.

## Propósito

Este documento conserva ideas de negocio para entender por qué el ecosistema YolaFresh incorporó un modelo de recurrencias.

## Casos de uso observados o potenciales

- gastos fijos;
- sueldos o planilla;
- cuotas de préstamos;
- cargos recurrentes a cliente;
- suscripciones;
- recordatorios operativos o financieros;
- compras programadas;
- renovaciones;
- proyecciones de flujo de caja.

## Lectura correcta

Estas posibilidades explican el valor del concepto `Recurrencia`, pero no implican que la librería actual:

- ejecute automáticamente esas acciones;
- publique un scheduler;
- genere documentos de negocio por sí sola;
- contenga handlers listos para cada caso.

## Límite vigente del paquete

El repositorio actual aporta:

- contratos para definir la recurrencia;
- una entidad para crear, pausar, anular y recalcular;
- vocabulario para expresar acciones y ejecuciones.

El consumer resuelve:

- scheduler;
- persistencia;
- idempotencia;
- generación efectiva de documentos;
- sincronización y observabilidad.

## Preguntas abiertas

- cuáles de estos casos de uso serán canónicos para todos los productos del ecosistema;
- qué acciones merecen payload tipado específico en lugar de `unknown`;
- si recurrencias seguirá siendo un módulo con comportamiento o migrará a contratos puros en futuras iteraciones.

## Referencias

- [../backend.md](../backend.md)
- [../frontend.md](../frontend.md)
- [../../../core/contratos-compartidos.md](../../../core/contratos-compartidos.md)
