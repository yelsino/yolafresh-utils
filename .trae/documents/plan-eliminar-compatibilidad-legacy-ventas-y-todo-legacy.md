# Plan para eliminar compatibilidad legacy en ventas y todo legacy

## Resumen

Este plan elimina la compatibilidad antigua del modelo de `Venta` y de toda la superficie legacy todavía expuesta por la librería.

El objetivo no es diseñar migraciones ni resolver persistencia histórica. El alcance real de `yolafresh-utils` en esta tarea es:

- definir contratos canónicos;
- eliminar tipos, enums y factories legacy;
- cerrar exports públicos legacy;
- dejar `Venta` y `VentaSnapshot` alineados con modelo actual;
- remover dependencias internas que todavía consumen `pedido.legacy` o `OrderState`.

Queda explícitamente fuera de alcance:

- documentación en `src/docs/`;
- estrategia de migración de datos persistidos;
- runtime de sincronización o bases de datos;
- compatibilidad temporal hacia atrás.

## Análisis del estado actual

Exploración confirmada en repo:

- `src/domain/ventas/Venta.ts` todavía conserva capa completa de compatibilidad:
  - importa `OrderState`;
  - define `VentaLegacyCompatibilityFields` y `VentaLegacyInput`;
  - mantiene `_detalleVentaCompat`;
  - normaliza estados legacy;
  - hidrata desde `fromLegacyInput`, `fromPersistenceSnapshot` y `fromCouchSnapshot`;
  - serializa `detalleVenta` en snapshots.
- `src/domain/ventas/VentaSnapshot.ts` todavía depende de shapes legacy:
  - `LegacyDetalleVenta`;
  - `detalleVenta` dentro de `VentaSnapshotBuildContext`;
  - factories `fromPersistenceSnapshot` y `fromCouchSnapshot` que reconstruyen snapshot histórico desde `detalleVenta`.
- `src/domain/ventas/snapshots.ts` sigue definiendo DTOs legacy con:
  - `detalleVenta`;
  - `tipoPago`;
  - `finanzaId`;
  - `turnoCajaId`;
  - `esPedido`;
  - snapshots compactos orientados a compatibilidad vieja.
- `src/domain/shared/utils/enums.ts` todavía exporta `OrderState`.
- `src/domain/shared/interfaces/pedido.legacy.ts` sigue vivo y exportado públicamente.
- `src/domain/shared/interfaces/index.ts` y `scripts/generate-exports.ts` siguen exponiendo `pedido.legacy`.
- `src/domain/ventas/utilsVenta.ts`, `src/domain/shared/utils/venta.ts` y `src/domain/shared/utils/mappers.ts` todavía importan tipos desde `pedido.legacy`.

Conclusión: blast radius real no es solo `ventas/`; también afecta `shared/interfaces`, `shared/utils` y generador de exports.

## Decisiones y supuestos

### Decisiones cerradas

- Se elimina compatibilidad antigua por completo. No se deja fallback temporal.
- `Venta` queda como agregado canónico puro. No conserva `detalleVenta`, `esPedido`, `tipoPago`, `finanzaId` ni `turnoCajaId`.
- `OrderState` se elimina por completo del código fuente.
- `pedido.legacy.ts` deja de ser parte de superficie pública de librería.
- `VentaSnapshot` deja de reconstruirse desde shapes legacy de `Venta`.
- Historial humano detallado pertenece a `VentaSnapshot`, no a `Venta`.

### Supuestos operativos

- Esta librería define contratos y reglas de negocio. No resuelve estrategia de migración de datos ya persistidos.
- Cualquier consumidor que aún dependa de exports legacy deberá migrar a contratos canónicos del paquete.
- Donde hoy utilidades internas usan tipos legacy solo como ayuda de tipado, se reemplazarán por tipos locales no exportados y mínimos, basados únicamente en campos realmente usados.

## Contrato objetivo

### `Venta`

`Venta` debe sostener únicamente:

- `id`
- `nombre`
- `type`
- `estado: VentaState`
- `items: VentaItem[]`
- `pedidoId?`
- `createdAt?`
- `updatedAt?`
- `costoEnvio?`
- `subtotal`
- `impuesto`
- `total`
- `montoRedondeo?`
- `procedencia`
- `clienteId?`
- `vendedorId?`
- `codigoVenta?`
- `numeroVenta?`

Sin campos ni adaptadores legacy.

### Snapshot canónico de `Venta`

Los DTOs contractuales de snapshot de `Venta` deben alinearse al shape canónico del agregado, no al carrito legacy.

Decisión de shape:

- `VentaPersistenceSnapshot` y `VentaCouchMinimalSnapshot` comparten mismo núcleo canónico:
  - `id`
  - `nombre`
  - `type`
  - `estado`
  - `pedidoId?`
  - `createdAt`
  - `updatedAt`
  - `items`
  - `costoEnvio?`
  - `subtotal`
  - `impuesto`
  - `total`
  - `montoRedondeo?`
  - `procedencia`
  - `clienteId?`
  - `vendedorId?`
  - `codigoVenta?`
  - `numeroVenta?`

`items` debe usar un DTO canónico derivado de `VentaItem`:

- `id`
- `presentacionId`
- `cantidadVendida`
- `precioUnitario`
- `montoTotal?`
- `montoModificado?`
- `descuento?`

Quedan eliminados del contrato:

- `detalleVenta`
- `VentaDetalleSnapshot`
- `VentaCouchCompactDetalleSnapshot`
- snapshots de item/producto orientados a `CarritoVenta`
- cualquier marca deprecated asociada a compatibilidad temporal

### `VentaSnapshot`

`VentaSnapshot` sigue siendo documento histórico mostrable separado.

Decisión de modelado:

- `VentaSnapshot.fromVenta()` puede recibir contexto enriquecido para nombres/actores.
- Si no recibe `context.items`, construye items mínimos desde `Venta.items`, usando `presentacionId` como fallback de `nombre`.
- `VentaSnapshot` ya no conoce `detalleVenta`.
- `VentaSnapshot` ya no reconstruye histórico a partir de snapshots contractuales de `Venta`.
- Debe existir un hidratador simple desde su propio contrato (`fromJSON` o equivalente), no desde formatos legacy de `Venta`.

## Cambios propuestos

## 1. `src/domain/ventas/Venta.ts`

### Qué cambiar

- Eliminar import de `OrderState`.
- Eliminar `VentaLegacyCompatibilityFields`.
- Eliminar `VentaLegacyInput`.
- Eliminar `normalizeLegacyEstado()`.
- Eliminar `mapVentaItemToCarItem()`.
- Eliminar `buildDetalleVentaCompat()`.
- Eliminar propiedad privada `_detalleVentaCompat`.
- Eliminar factories:
  - `fromLegacyInput()`
  - `fromPersistenceSnapshot()`
  - `fromCouchSnapshot()`
- Reescribir `toPersistenceSnapshot()` para emitir snapshot canónico basado en `this.items`.
- Reescribir `toCouchSnapshotMinimal()` para emitir snapshot canónico basado en `this.items`.
- Reescribir `toVentaSnapshot()` para delegar sin inyectar `detalleVenta`.
- Ajustar `productosUnicos` para agregar por `presentacionId` y usar `presentacionId` como `nombre` fallback.
- Mantener `fromCarritoVenta()` solo como factory de creación de `Venta` desde captura operativa actual, pero sin dejar rastro compat en agregado.

### Por qué

- `Venta` sigue arrastrando forma de carrito histórico que ya no le pertenece.
- `_detalleVentaCompat` reintroduce acoplamiento a UI y a snapshot viejo.
- `fromLegacyInput` y derivados hacen que contratos antiguos sigan siendo válidos aunque modelo ya cambió.

### Cómo

- `Venta` queda auto-suficiente con `IVenta` + `VentaItem`.
- Para serialización, mapear `this.items` a DTO canónico de snapshot.
- `productosUnicos` ya no busca nombres históricos en compat legacy; solo consolida cantidades y montos por `presentacionId`.

## 2. `src/domain/ventas/VentaSnapshot.ts`

### Qué cambiar

- Eliminar tipo `LegacyDetalleVenta`.
- Eliminar tipo `LegacyDetalleVentaItem`.
- Eliminar `detalleVenta` de `VentaSnapshotBuildContext`.
- Eliminar helpers:
  - `getLegacyItemPresentacionId()`
  - `getLegacyItemNombre()`
  - `getLegacyItemTotal()`
  - `getLegacyImagenUrl()`
  - `getLegacyUnidadComercial()`
  - `mapLegacyVentaItemToSnapshotItem()`
  - `mapVentaItemsFromDetalle()`
- Eliminar factories:
  - `fromPersistenceSnapshot()`
  - `fromCouchSnapshot()`
- Agregar hidratador directo desde `IVentaSnapshot` si hoy no existe explícitamente.
- Mantener `mapVentaItemToSnapshotItem()` y `mapVentaItemsFromVenta()` como ruta canónica.
- Ajustar `fromVenta()` para usar solo `context.items` o `venta.items`.

### Por qué

- `VentaSnapshot` no debe depender de shape heredado de `CarritoVenta`.
- Si modelo histórico es documento separado, no tiene sentido reconstruirlo desde `detalleVenta` de `Venta`.

### Cómo

- `VentaSnapshotBuildContext` queda limitado a:
  - `id?`
  - `createdAt?`
  - `items?`
  - `cliente?`
  - `vendedor?`
- Fallback mínimo:
  - `nombre` de item = `presentacionId` cuando no venga snapshot enriquecido.

## 3. `src/domain/ventas/snapshots.ts`

### Qué cambiar

- Reemplazar contratos legacy por DTOs canónicos de venta.
- Definir tipo único de item snapshot contractual alineado a `VentaItem`.
- Quitar interfaces orientadas a `detalleVenta` y `product` compactado.
- Eliminar campos deprecated:
  - `tipoPago`
  - `finanzaId`
  - `turnoCajaId`
  - `esPedido`

### Por qué

- Este archivo hoy conserva compatibilidad temporal como parte oficial de contrato.
- Mientras este archivo siga exponiendo `detalleVenta`, capa legacy seguirá viva aunque `Venta` se limpie.

### Cómo

- Dejar `snapshots.ts` como traducción contractual plana de `Venta`, no de `CarritoVenta`.
- Si `VentaPersistenceSnapshot` y `VentaCouchMinimalSnapshot` terminan idénticos, permitir reutilizar mismo DTO base para ambos y solo conservar dos aliases nominales si hace falta por semántica externa.

## 4. `src/domain/shared/utils/enums.ts`

### Qué cambiar

- Eliminar enum `OrderState`.

### Por qué

- Sigue manteniendo semántica mezclada entre `Pedido` y `Venta`.
- Ya existen `PedidoState` y `VentaState` como reemplazo canónico.

### Cómo

- Sustituir todas referencias internas:
  - `Venta.ts` debe usar solo `VentaState`.
  - `pedido.legacy.ts` desaparece, por lo tanto no necesita reemplazo allí.

## 5. `src/domain/shared/interfaces/pedido.legacy.ts`

### Qué cambiar

- Eliminar archivo completo de superficie pública.

### Por qué

- Mantener `PedidoLegacy` publicado contradice objetivo de quitar todo legacy.
- También arrastra `OrderState`.

### Cómo

- Borrar export público de este módulo.
- Reemplazar usos internos residuales de `Carrito`, `Hora` y `Lista` por tipos locales mínimos dentro de archivos consumidores.

## 6. `src/domain/shared/interfaces/index.ts`

### Qué cambiar

- Eliminar re-export de `pedido.legacy`.
- Mantener solo export canónico:
  - `Pedido`
  - `PedidoItem`

### Por qué

- `index.ts` hoy vuelve legacy parte de API pública del paquete.

### Cómo

- Dejar archivo sin referencias a `PedidoLegacy`, `Carrito`, `Hora`, `Lista` ni aliases heredados.

## 7. `scripts/generate-exports.ts`

### Qué cambiar

- Eliminar tratamiento especial de `pedido.legacy`.
- Generar exports de `shared/interfaces` sin incluir módulo legacy eliminado.

### Por qué

- Mientras generador siga sabiendo de `pedido.legacy`, cleanup no será estable.
- Cada regeneración volvería a contaminar `src/domain/shared/interfaces/index.ts`.

### Cómo

- Mantener excepción solo para `pedido` si todavía se necesita export tipado explícito.
- Borrar línea que re-exporta tipos desde `./pedido.legacy`.
- Validar que resultado generado deje `src/domain/shared/interfaces/index.ts` limpio.

## 8. `src/domain/ventas/utilsVenta.ts`

### Qué cambiar

- Eliminar import desde `pedido.legacy`.
- Sustituir `Carrito` y `Hora` por tipos locales no exportados y mínimos, definidos en mismo archivo.

### Por qué

- Archivo no necesita módulo legacy completo; solo usa shape puntual para mensaje de WhatsApp y formato de hora.

### Cómo

- Definir tipos locales con solo campos realmente leídos:
  - usuario
  - direccion
  - items
  - total
  - formaEntrega
  - horaEntrega
- No crear nuevos exports públicos.

## 9. `src/domain/shared/utils/venta.ts`

### Qué cambiar

- Mismo tratamiento que `src/domain/ventas/utilsVenta.ts`.

### Por qué

- Duplica dependencia legacy para helpers de formato.

### Cómo

- Replicar tipado local mínimo y remover import legacy.

## 10. `src/domain/shared/utils/mappers.ts`

### Qué cambiar

- Eliminar import desde `pedido.legacy`.
- Sustituir `Carrito` y `Lista` por tipos locales mínimos o por tipado estructural interno.
- Revisar `pedidodbToPedido()` para que entrada sea un payload de transición interno, no un contrato legacy exportado.

### Por qué

- Hoy `mappers.ts` perpetúa dependencia transversal a archivo legacy.

### Cómo

- Definir tipos internos de entrada basados solo en propiedades accedidas:
  - `datosPedido.items`
  - `datosPedido.usuario`
  - totales
  - fechas
- Mantener salida pública en contrato moderno `Pedido`.

## 11. `src/index.ts`

### Qué revisar

- Confirmar que no reaparece superficie legacy por export transitivo.

### Por qué

- `src/index.ts` exporta `shared/interfaces`; si esa categoría queda limpia, root export también.

### Cómo

- No requiere cambio manual si `generate-exports.ts` ya genera salida correcta.
- Solo verificar resultado final.

## Orden de implementación

## Fase A. Corte de contratos públicos

1. Limpiar `snapshots.ts`.
2. Limpiar `Venta.ts`.
3. Limpiar `VentaSnapshot.ts`.
4. Eliminar `OrderState`.
5. Eliminar `pedido.legacy.ts`.

## Fase B. Cierre de exports

1. Actualizar `scripts/generate-exports.ts`.
2. Regenerar `src/domain/shared/interfaces/index.ts`.
3. Verificar `src/index.ts`.

## Fase C. Limpieza de consumidores internos

1. `src/domain/ventas/utilsVenta.ts`
2. `src/domain/shared/utils/venta.ts`
3. `src/domain/shared/utils/mappers.ts`

## Fase D. Verificación

1. `pnpm run generate-exports`
2. `pnpm run build`
3. `GetDiagnostics` en archivos editados
4. Barrido de texto para asegurar eliminación total de legacy

## Verificación esperada

Al terminar, deben cumplirse estas condiciones:

- No existen referencias a `OrderState` en `src/`.
- No existe `src/domain/shared/interfaces/pedido.legacy.ts`.
- No existen imports de `pedido.legacy` en `src/`.
- `Venta.ts` no contiene:
  - `fromLegacyInput`
  - `_detalleVentaCompat`
  - `detalleVenta`
  - normalización de estados legacy
- `VentaSnapshot.ts` no contiene:
  - `LegacyDetalleVenta`
  - `detalleVenta` en context
  - factories desde snapshots legacy de venta
- `snapshots.ts` no contiene:
  - `detalleVenta`
  - `tipoPago`
  - `finanzaId`
  - `turnoCajaId`
  - `esPedido`
- `src/domain/shared/interfaces/index.ts` solo re-exporta `pedido` moderno.
- `pnpm run build` compila sin errores.

## Comandos de verificación

Ejecución posterior, fuera de plan mode:

```bash
pnpm run generate-exports
pnpm run build
```

Barridos esperados:

```bash
# sin resultados en src/ y scripts/
OrderState
pedido.legacy
fromLegacyInput
_detalleVentaCompat
detalleVenta
```

## Riesgos conocidos

- `productosUnicos` perderá nombre histórico enriquecido dentro de `Venta`; esto es intencional. Esa responsabilidad migra a `VentaSnapshot`.
- Consumidores externos que importen `PedidoLegacy`, `Carrito`, `Hora`, `Lista` o `OrderState` quedarán rotos hasta migrar a contratos canónicos o helpers locales propios.
- Si algún archivo adicional fuera de `src/` depende de legacy, deberá ajustarse durante ejecución, pero no se debe reabrir diseño: solo completar limpieza residual.

## Criterio de terminado

Trabajo termina cuando librería expone solo contratos canónicos de `Pedido`, `Venta`, `VentaSnapshot`, `PedidoState` y `VentaState`, sin compatibilidad antigua ni exports legacy residuales.
