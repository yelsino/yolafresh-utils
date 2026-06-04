# Tareas
- [ ] Tarea 1: Auditar contratos monetarios existentes y definir el criterio de "dinero operativo" vs "contable".
  - [ ] Identificar todas las entidades que hoy representan entradas/salidas de dinero (Venta, Pago, Egreso, Ingreso, Cambio, Anulacion, CobroCliente, MovimientoCuentaCliente).
  - [ ] Definir la regla de enlazado a `MovimientoCaja` (por `movimientoCajaId` o por `referenciaTipo/referenciaId`).
- [ ] Tarea 2: Estandarizar contexto de caja/turno.
  - [ ] Agregar un type reusable (ej. `CajaOperacionContexto`) en `src/domain/shared/interfaces/caja.ts` o en un archivo existente de interfaces.
- [ ] Tarea 3: Extender contratos que mueven dinero para soportar caja/turno.
  - [ ] `src/domain/shared/interfaces/pagos.ts`: agregar `movimientoCajaId?: string`.
  - [ ] `src/domain/shared/interfaces/finanzas.ts`: agregar `cajaId?: string`, `turnoCajaId?: string`, `movimientoCajaId?: string`, `dispositivoId?: string` en `Egreso`, `Ingreso`, `Cambio`, `Anulacion`.
- [ ] Tarea 4: Alinear referencias en contratos relacionados.
  - [ ] Confirmar que `MovimientoCaja.referenciaTipo` cubre todos los casos necesarios y que el consumer puede linkear sin ambiguedades.
  - [ ] Revisar duplicidad entre `src/domain/shared/interfaces/caja.ts` y `src/domain/tesoreria/caja.ts` y definir cual es la fuente canonica (sin romper imports).
- [ ] Tarea 5: Validacion y verificacion
  - [ ] `npm run build` sin errores de TypeScript.
  - [ ] Verificar que los subpath exports (si existen) continúan funcionando.

# Dependencias de tareas
- Tarea 3 depende de Tarea 2
- Tarea 5 depende de Tarea 3
