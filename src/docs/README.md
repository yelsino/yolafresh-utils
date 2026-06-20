# Documentacion de `yolafresh-utils`

## Indice principal

- `inventario-tecnico-yolafresh-utils.md`: mapa general de modulos, exports y estructura.
- `cuentas-clientes.md`: definicion vigente del nuevo modelo de cuenta cliente.
- `cuentas-clientes-reimplementacion.md`: guia de consumo del modelo nuevo.
- `cobros-adelantos-clientes.md`: flujos de cobros, adelantos, saldo disponible y FIFO.
- `auditoria-trazabilidad-reimplementacion.md`: capas de trazabilidad del nuevo modelo.
- `personas.md`: contratos de personas, entidades y relaciones con otros contextos.
- `ventas-implementation-plan.md`: lineamientos de implementacion exterior para ventas.

## Nota

La fuente de verdad del modulo de cuenta cliente es el RFC v2 ya aterrizado en:

- `src/domain/shared/interfaces/customer-account.ts`

El modelo legacy de cuenta cliente ya no forma parte de la libreria publica.
