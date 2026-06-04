# Tareas
- [x] Tarea 1: Auditar contratos monetarios actuales y clasificar su rol de trazabilidad.
  - [x] Revisar `Venta`, `Pago`, `CobroCliente`, `MovimientoCaja`, `MovimientoCuentaCliente`, `Egreso`, `Ingreso`.
  - [x] Marcar cuáles son entidades de negocio, cuáles son ledger/journal y cuáles son de captura/conciliación.
- [x] Tarea 2: Definir el criterio de auditoría mínima dentro de la librería.
  - [x] Establecer qué campos mínimos deben vivir dentro de cada entidad monetaria.
  - [x] Establecer qué información no debe agregarse a todas las entidades (before/after, IP, logs técnicos, historial completo).
- [x] Tarea 3: Reforzar el modelado de `CobroCliente` como entidad de recepción/custodia.
  - [x] Evaluar si requiere campos explícitos para recepción, entrega a caja y confirmación en caja.
  - [x] Evaluar si requiere estados más precisos para flujos con custodia intermedia.
- [x] Tarea 4: Definir contrato separado de auditoría.
  - [x] Proponer un contrato compartido para eventos de auditoría o historial de cambios.
  - [x] Definir qué entidades deben referenciarlo conceptualmente sin acoplar toda la librería a infraestructura.
- [x] Tarea 5: Validación y consistencia.
  - [x] Verificar que la propuesta no duplique el propósito de `MovimientoCaja` ni `MovimientoCuentaCliente`.
  - [x] Verificar que `Pago` quede acotado a captura/conciliación.
  - [x] `npm run build` sin errores si la implementación modifica contratos.

# Dependencias de tareas
- Tarea 3 depende de Tarea 2
- Tarea 4 depende de Tarea 2
- Tarea 5 depende de Tarea 3 y Tarea 4
