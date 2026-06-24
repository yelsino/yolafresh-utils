# Tasks
- [x] Task 1: Aterrizar contrato de `VentaSnapshot` en spec y dominio.
  - [x] Definir `VentaSnapshot`, `VentaSnapshotItem` y `VentaSnapshotActor`.
  - [x] Definir invariantes mínimas, nulabilidad y convención de identidad.
  - [x] Alinear naming con contratos actuales de `Venta`.

- [x] Task 2: Definir estrategia de creación de snapshot histórico.
  - [x] Decidir fuente de datos visible para `cliente`, `vendedor` e `items`.
  - [x] Definir cuándo se crea o regenera snapshot antes de cierre.
  - [x] Definir condición de inmutabilidad después de cierre.

- [x] Task 3: Definir persistencia y snapshots técnicos.
  - [x] Diseñar shape persistible para Couch/Pouch/SQLite.
  - [x] Definir relación con `Venta` mediante `ventaId`.
  - [x] Documentar índices mínimos por `type`, `ventaId` y `codigoVenta`.

- [x] Task 4: Integrar modelo objetivo con flujo de historial.
  - [x] Documentar cómo UI usa `Venta` + `VentaSnapshot`.
  - [x] Definir fallback transitorio para ventas antiguas sin snapshot.
  - [x] Asegurar que `VentaSnapshot` no reintroduce `detalleVenta` legacy.

- [x] Task 5: Implementar contrato y mapeos en código.
  - [x] Crear módulo dominio para `VentaSnapshot`.
  - [x] Exponer exports públicos necesarios.
  - [x] Agregar mapeos/factories desde `Venta`.
  - [x] Incorporar snapshots técnicos y compatibilidad de persistencia.

- [x] Task 6: Documentar y validar nueva capacidad.
  - [x] Actualizar documentación funcional/técnica de ventas.
  - [x] Verificar coherencia con spec previa de `Venta` y `Pedido`.
  - [x] Validar tipos y build del paquete.

# Task Dependencies
- Task 2 depends on Task 1.
- Task 3 depends on Task 1.
- Task 4 depends on Task 2 and Task 3.
- Task 5 depends on Task 2 and Task 3.
- Task 6 depends on Task 5.
