# Políticas y mermas de inventario

## Política: configuración segura, no hecho físico

`PoliticaInventario` determina el modo de control, tolerancias, periodicidad de
conteos, aprobación de ajustes y evidencia de mermas. No modifica stock.

Cada versión conserva:

- actor, `operationId` e `idempotencyKey` de la última escritura;
- `version`, `createdAt` y `updatedAt`.

La administración exige `inventario:politica:administrar` y una sesión activa.

Para crear se usa `version: 1`. Para editar,
`validarEvolucionPoliticaInventario` exige incremento exacto, alcance y
`createdAt` inmutables, y nuevas claves de operación. Un replay estructuralmente
idéntico es idempotente. CouchDB `_rev` o el CAS del repositorio continúa siendo
obligatorio; no se incluye metadata de infraestructura en el contrato de dominio.

## Merma: decisión separada del efecto físico

`MermaInventario` conserva `schemaVersion: 2`, `version` y `flujo`:

`BORRADOR -> PENDIENTE_APROBACION -> APROBADO -> APLICADO`

Desde pendiente también se puede `RECHAZAR`; borrador o pendiente se pueden
`CANCELAR`. Rechazado, aplicado y cancelado son terminales.

Cada transición tiene actor, fecha, `operationId`, `idempotencyKey` y
`expectedVersion`. La versión aumenta exactamente uno y el recibo anterior es
append-only. Esto evita que dos tablets aprueben o reemplacen decisiones sobre
la misma versión: el adapter valida `validarEvolucionMermaInventario` y realiza
CAS antes de persistir.

`APROBADO` todavía no modifica stock. La única construcción física admitida es
la transición validada `APROBADO -> APLICADO`, mediante
`construirMovimientoAplicacionMermaInventarioV2`. Produce una sola salida con ID
determinista y clave derivada de la acción de aplicación. Reintentar exactamente
la misma versión reproduce el mismo hecho; una segunda aplicación divergente es
rechazada.

Reglas adicionales:

- `MotivoMermaInventario.OTRO` exige detalle;
- una política con `requiereEvidenciaMerma` exige al menos una evidencia;
- rechazo y cancelación exigen comentario;
- una merma solo modifica stock durante su transición aprobada a `APLICADO`;
- la merma no representa un egreso de caja.

En sistemas de inventario, una merma se registra como salida hacia una ubicación
o clasificación de pérdida, conservando trazabilidad del origen. Esta decisión
es coherente con [Odoo: scrap inventory](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/scrap_inventory.html),
sin acoplar el contrato YolaFresh a una implementación externa.

## Permisos canónicos

- `inventario:politica:administrar`
- `inventario:merma:ver`
- `inventario:merma:crear`
- `inventario:merma:aprobar`

Administrar políticas y aprobar mermas son operaciones críticas, auditables y
requieren sesión activa.

## Referencias internas

- [politica-inventario.contract.ts](../../domain/inventario/contracts/politica-inventario.contract.ts)
- [ajuste-inventario.contract.ts](../../domain/inventario/contracts/ajuste-inventario.contract.ts)
- [inventory-v2.helpers.ts](../../domain/inventario/services/inventory-v2.helpers.ts)
