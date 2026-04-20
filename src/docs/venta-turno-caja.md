# Implementación — `turnoCajaId` en `Venta`

Este documento describe cómo usar el nuevo atributo `turnoCajaId?: string` para soportar el flujo operativo típico de POS con **caja por turnos** y permitir “patear ventas” (registrar la venta sin cobrarla y cobrarla después en una caja/turno abierto).

## 1) Qué es `turnoCajaId`

- **Ubicación del contrato**: `IVenta` en [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
- **Tipo**: `turnoCajaId?: string`
- **Referencia**: apunta a `TurnoCaja.id` en [tesoreria/caja.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/tesoreria/caja.ts)

Objetivo: responder inequívocamente a la pregunta operativa:

> ¿En qué turno de caja se cobró esta venta?

Esto separa:
- **Quién vendió** (`vendedorId`)
- **Cómo se pagó** (`tipoPago`)
- **Cómo se financió / documento financiero** (`finanzaId`)
- **Dónde/por quién se cobró en caja** (`turnoCajaId`)

## 2) Regla operativa mínima (recomendada)

- Si `turnoCajaId` es `undefined` → la venta **no está cobrada en caja** (no pertenece a ningún arqueo/cierre de turno).
- Si `turnoCajaId` tiene valor → la venta **ya fue cobrada** dentro de un turno de caja y debe tener impacto financiero asociado.

Nota: esta regla es intencionalmente simple para funcionar bien con persistencia local (offline-first) y sincronización.

## 3) Flujos soportados

### 3.1 Patear venta (registrar sin cobrar)

1) El vendedor genera/guarda una venta como pendiente:
- `estado = OrderState.PENDIENTE`
- `tipoPago = undefined`
- `finanzaId = undefined` (según tu modelo de finanzas)
- `turnoCajaId = undefined`

### 3.2 Cobrar venta (con turno abierto)

Precondición: existe un `TurnoCaja` activo (`estado: "ABIERTO"`).

Al momento del cobro:
- asignar `turnoCajaId = turno.id`
- asignar `tipoPago` según el cobro
- asignar `finanzaId` si tu flujo crea/usa un documento financiero
- actualizar `estado` (por ejemplo, a `OrderState.DESPACHADO` si ese es tu estado de “venta finalizada”)

Además, crear el impacto de caja con `MovimientoCaja`:
- `MovimientoCaja.turnoId = turnoCajaId`
- `MovimientoCaja.referenciaTipo = "VENTA"`
- `MovimientoCaja.referenciaId = venta.id`

Contratos relacionados:
- `TurnoCaja` / `MovimientoCaja`: [tesoreria/caja.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/tesoreria/caja.ts)
- `MetodoPago`: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)

## 4) Consideraciones por inmutabilidad de `Venta`

`Venta` se congela (`Object.freeze`) en su constructor, por lo que no se debe mutar una instancia existente.

Patrones recomendados para “actualizar” `turnoCajaId`:

### Opción A) Rehidratar creando una nueva instancia

```ts
import { Venta } from "@/domain/ventas/Venta";
import { OrderState } from "@/domain/shared/utils/enums";

const ventaPateada = new Venta(dataVentaPendiente);

const ventaCobrada = new Venta({
  ...ventaPateada.toJSON(),
  estado: OrderState.DESPACHADO,
  turnoCajaId: turno.id,
  tipoPago: metodoPago,
  finanzaId: finanzaId,
  updatedAt: new Date(),
});
```

### Opción B) Actualizar en persistencia y re-instanciar al leer

Si estás guardando `IVenta` (o snapshots) en SQLite/Pouch, puedes actualizar el documento/registro con `turnoCajaId` y luego reconstruir `Venta` al cargar.

## 5) Persistencia y sincronización (snapshots)

Se agregó `turnoCajaId?: string` en:
- `VentaPersistenceSnapshot`: [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)
- `VentaCouchMinimalSnapshot`: [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)

Implicancias:
- Backward compatible: ventas antiguas sin `turnoCajaId` siguen siendo válidas.
- Al sincronizar (Couch/Pouch), el campo viaja en el snapshot minimal, permitiendo reportes por turno en todos los nodos.

## 6) Checklist de implementación (consumer)

- Guardar ventas “pateadas” con `turnoCajaId` ausente.
- Al cobrar, exigir turno abierto y asignar `turnoCajaId`.
- Registrar `MovimientoCaja` con `turnoId` y `referenciaId` a la venta.
- En arqueo/cierre, agrupar por `turnoCajaId` y/o `MovimientoCaja.turnoId`.

