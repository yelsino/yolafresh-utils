# Plan de Implementación — Ventas (Carrito → Venta → Finanzas → Inventario)

Este documento describe un plan práctico para implementar el flujo de ventas usando `yola-fresh-utils` como librería de contratos y clases.

Objetivo: mantener un POS escalable y auditable separando claramente:
- `CarritoVenta` (mutable / en curso)
- `Venta` (inmutable / histórica)
- finanzas (`MovimientoCaja`, `Ingreso`, `Pago`, cuentas)
- inventario (`MovimientoInventario`, `MovimientoInventarioService`)

## 1) Contratos y clases base

### 1.1 Carrito (estado mutable)
- `CarritoVenta` y `ICarritoVenta`: [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts)
- Ítem del carrito: `CarItem`

Responsabilidad:
- agregar/quitar productos
- calcular totales (subtotal/impuesto/total)
- manejar pesables vs unidades (`TipoVentaEnum`)

### 1.2 Venta (estado inmutable)
- `Venta` y `IVenta`: [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)

Responsabilidad:
- congelar snapshot del carrito para auditoría
- exponer getters (items, totales) sin mutación
- emitir eventos de dominio (ej. `VentaConfirmada`)

### 1.3 Snapshot estable (para escalabilidad)
- `VentaDetalleSnapshot`, `VentaProductSnapshot`, etc.: [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)

Regla:
- el snapshot histórico NO debe depender del catálogo completo (`Presentacion`) ni de `Partial<Presentacion>`
- debe ser mínimo y estable (tamaño controlado)

## 2) Flujo operativo (paso a paso)

### 2.1 Crear carrito
- Crear `CarritoVenta` con configuración fiscal apropiada (`paraPeru`, `sinImpuestos`, etc.)
- Setear trazabilidad: `cliente`, `personal`, `procedencia`, `metodoPago`, etc.

### 2.2 Agregar items
- Agregar items con:
  - `product.id` requerido (para agrupar/identificar)
  - `quantity`
  - `precioUnitario` opcional (override)

Para pesables:
- usar `incrementarCantidad(stepKg)` y `decrementarCantidad(stepKg)`

### 2.3 Validaciones mínimas antes de vender
- carrito no vacío
- `total > 0`
- si hay stock y validación habilitada: comprobar disponibilidad antes de confirmar (fuera de la librería o en un servicio de dominio del consumer)

### 2.4 Congelar carrito para venta (snapshot)
Usar:
- `carrito.toVentaSnapshot()`

Garantías del snapshot:
- `product` se convierte a `VentaProductSnapshot` (id/nombre/tipoVenta/precioVenta/contenidoNeto/unidadContenido/imagenUrl)
- `cliente` se reduce a `VentaClienteSnapshot`
- se evita guardar basura (campos del catálogo, createdAt/updatedAt del producto, urls extra, etc.)

### 2.5 Crear Venta
Usar:
- `Venta.fromCarritoVenta(carritoJSON, ventaId, { montoRedondeo })`

Regla:
- `Venta` siempre congela el snapshot resultante para inmutabilidad.
- totales de `Venta` se leen desde `detalleVenta` (evita inconsistencias).

## 3) Integración financiera (caja/pagos)

### 3.1 MovimientoCaja
Cada venta debe impactar caja con un movimiento:
- `MovimientoCaja.tipo = "INGRESO"`
- `monto = total`
- `metodoPago`
- `moneda`
- `codigoMovimiento`
- `saldoPosterior` (efectivo/digital/total)
- `referenciaTipo = "VENTA"`
- `referenciaId = ventaId`

Si hay crédito / pedido:
- registrar ingreso/pago según reglas de negocio del consumer
- si el pago excede deuda, usar `MovimientoCuentaCliente` (`SALDO_FAVOR`)

### 3.2 Pago (si aplica)
Si usas captura/confirmación:
- crear `Pago` con estado `CAPTURADO/CONFIRMADO/...`
- usar conciliación (`conciliado/conciliadoAt`) cuando aplique

## 4) Integración inventario (salida por venta)

### 4.1 Generar MovimientoInventario
Crear `MovimientoInventario`:
- `tipo = "SALIDA"`
- `origenDocumento = "VENTA"`
- `documentoReferenciaId = ventaId`
- `almacenOrigenId`
- `items`: mapear desde `detalleVenta.items`

Cantidad a descontar:
- si es unidad: `quantity`
- si es pesable: `quantity * contenidoNeto` cuando corresponda a la lógica de stock (según tu normalización de inventario)

### 4.2 Aplicar movimiento y kardex
Usar:
- `MovimientoInventarioService.aplicar({ movimiento, stocksActuales, almacenes })`

Notas:
- `lote` es opcional: si no viene, el servicio consume por FEFO o usa un lote interno cuando permite negativos.

## 5) Notificaciones (opcional, recomendado)

Emitir `NotificationEvent` para:
- `VENTA_CREADA`
- `PAGO_RECIBIDO`
- `CAJA_NEGATIVA`
- `PRODUCTO_AGOTADO`

Contratos:
- [notificaciones.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/notificaciones.ts)

## 6) Auditoría y trazabilidad (mínimos)

Recomendación:
- usar `MovimientoFinanciero` como ledger (opcional pero recomendado)
- guardar `AuditLog` para cambios críticos (anulación, cierre de caja, etc.)

Contratos:
- [ledger.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/ledger.ts)

## 7) Checklist de implementación (orden recomendado)

### Fase 1 — Venta simple
- CarritoVenta (crear/agregar/calcular)
- Venta.fromCarritoVenta() + snapshot limpio
- MovimientoCaja ingreso

### Fase 2 — Inventario
- MovimientoInventario por venta
- kardex + stocks actualizados

### Fase 3 — Crédito / pedidos
- pedidos (`esPedido`, `finanzaId`)
- cuentas de cliente (`MovimientoCuentaCliente`)

### Fase 4 — Auditoría pro
- saldos posteriores y correlativos en MovimientoCaja
- ledger (`MovimientoFinanciero`)
- audit log

