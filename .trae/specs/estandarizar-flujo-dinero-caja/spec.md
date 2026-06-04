# Especificación de Flujo de Dinero por Caja

## Por qué
Hoy existen entidades monetarias (Venta, Pago, Egreso, Ingreso, MovimientoCaja, etc.) pero no hay una regla contractual unica que garantice **trazabilidad operativa por caja/turno**. En un POS real esto afecta arqueos, cierres y auditoria.

## Qué cambia
- Definir el criterio de dominio: **solo el dinero que afecta el saldo operativo de caja por turno** se registra como `MovimientoCaja`.
- Estandarizar un contexto de caja/turno reusable para operaciones monetarias (ej. `CajaOperacionContexto`).
- Agregar referencias de caja/turno/movimiento donde falten:
  - `Pago`: agregar `movimientoCajaId?: string` para enlazar cuando el pago impacta caja.
  - `Egreso`: agregar `cajaId?: string`, `turnoCajaId?: string`, `movimientoCajaId?: string`, `dispositivoId?: string`.
  - `Ingreso`: agregar `cajaId?: string`, `turnoCajaId?: string`, `movimientoCajaId?: string`, `dispositivoId?: string`.
  - `Cambio`: agregar `cajaId?: string`, `turnoCajaId?: string`, `movimientoCajaId?: string`, `dispositivoId?: string`.
  - `Anulacion`: agregar `cajaId?: string`, `turnoCajaId?: string`, `movimientoCajaId?: string`, `dispositivoId?: string`.
- Mantener compatibilidad: los nuevos campos se agregan como opcionales, pero se definen **invariantes** para uso correcto.

## Impacto
- Especificaciones afectadas: caja/turno, cobros, ventas, cuentas de clientes, reporteria de cierre, auditoria.
- Codigo afectado:
  - `src/domain/shared/interfaces/caja.ts`
  - `src/domain/tesoreria/caja.ts`
  - `src/domain/shared/interfaces/pagos.ts`
  - `src/domain/shared/interfaces/finanzas.ts` (Egreso/Ingreso/Cambio/Anulacion)
  - `src/domain/ventas/Venta.ts` (reglas existentes de `turnoCajaId`)

## Requisitos agregados

### Requisito: El dinero operativo pasa por caja
El sistema DEBE considerar como "dinero operativo" todo evento que cambie el saldo de efectivo/digital de una caja en un turno (cobro, retiro, gasto, ingreso, ajuste, anulacion, cambio).

#### Escenario: Venta cobrada en caja
- **CUANDO** una `Venta` pasa a estado cobrada/pagada (segun el modelo del consumer)
- **ENTONCES** debe existir un `MovimientoCaja` con `referenciaTipo = "VENTA"` y `referenciaId = venta.id`
- **Y** la venta debe tener `turnoCajaId` asignado

#### Escenario: Pago aplicado a una venta
- **CUANDO** un `Pago` pasa a `estado = "APLICADO"` y tiene `ventaId`
- **ENTONCES** debe poder enlazarse a un `MovimientoCaja` (por `movimientoCajaId` o por `referenciaId/referenciaTipo`)
- **Y** debe incluir `turnoCajaId` cuando el pago impacta caja

#### Escenario: Egreso que saca dinero de caja
- **CUANDO** se registra un `Egreso` con `metodoPago` efectivo/digital y estado vigente
- **ENTONCES** debe existir un `MovimientoCaja` con `referenciaTipo = "EGRESO"` y `referenciaId = egreso.id`
- **Y** el `Egreso` debe poder referenciar `turnoCajaId` (directo o via `movimientoCajaId`)

### Requisito: Excepciones explicitas
El sistema DEBE permitir entidades monetarias sin caja/turno cuando no hay movimiento operativo de caja en ese momento.

Ejemplos tipicos:
- Venta a credito (se genera deuda, no entra dinero aun)
- Ingreso a credito pendiente de cobro
- Asientos contables o ajustes que no representan movimiento real en un turno

## Requisitos modificados

### Requisito: Trazabilidad de pagos y finanzas
El sistema DEBE permitir enlazar `Pago`, `Egreso`, `Ingreso`, `Cambio` y `Anulacion` al contexto de caja/turno y al `MovimientoCaja` correspondiente, para soportar auditoria y cierres.

## Requisitos eliminados
No aplica
