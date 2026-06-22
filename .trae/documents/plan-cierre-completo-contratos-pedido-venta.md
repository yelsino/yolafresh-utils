# Plan — Cierre completo de contratos `Pedido` / `Venta`

## Resumen

Objetivo: terminar en una sola ejecución la limpieza contractual de `Pedido` y `Venta` en `yolafresh-utils`, eliminando el enfoque incremental y cerrando el refactor pendiente con un corte claro entre:

- contrato canónico nuevo,
- compatibilidad legacy controlada,
- documentación alineada,
- validación final de tipos.

Resultado esperado al ejecutar este plan:

- `Venta` queda expuesta públicamente solo como hecho comercial canónico.
- `Pedido` queda expuesto públicamente como contrato moderno.
- lo legacy se encapsula de forma explícita y limitada,
- `CarritoVenta` queda solo como captura mutable,
- `snapshots` quedan identificados como compatibilidad de persistencia y no como modelo público principal,
- helpers y docs dejan de enseñar o depender del modelo viejo.

## Análisis del Estado Actual

### 1. `Venta.ts` todavía mezcla contrato canónico con compatibilidad temporal

Archivo: [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)

Hechos observados:

- `IVenta` ya usa `VentaState`, `items` y `pedidoId?`.
- Pero `VentaInput` sigue aceptando `OrderState`, `tipoPago`, `finanzaId`, `turnoCajaId` y `esPedido`.
- `IVenta` todavía expone `detalleVenta?: ICarritoVenta`.
- El constructor sigue derivando `pedidoId` desde `esPedido`.
- La serialización a snapshots sigue cargando `detalleVenta` y aún replica campos legacy.

Conclusión:

- `Venta` ya está encaminada, pero todavía no está cerrada como contrato canónico puro.
- La compatibilidad sigue incrustada en la API pública en vez de estar aislada.

### 2. `CarritoVenta.ts` mantiene legado de pedido/finanzas en la API pública

Archivo: [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts#L858-L1031)

Hechos observados:

- La API pública todavía expone `esPedido`, `finanzaId`, `marcarComoPedido()`, `convertirAVentaNormal()`, `marcarItemComoPedido()`, `itemsPedido`, `itemsVentaNormal` y `totalesSeparados`.
- Ya están marcados como `@deprecated`, pero siguen siendo parte activa del objeto.

Conclusión:

- Mientras sigan ahí, el consumer todavía puede seguir modelando pedidos dentro de `CarritoVenta`.
- Eso contradice el objetivo de cierre total del refactor.

### 3. `pedido.ts` mezcla contrato nuevo y tipos legacy en el mismo módulo

Archivo: [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)

Hechos observados:

- `Pedido` y `PedidoItem` ya existen con `PedidoState`.
- Pero el mismo archivo sigue exponiendo `Carrito`, `Hora`, `ItemCar`, `PedidoLegacy` y `OrderState`.
- Helpers viejos como [shared/utils/venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/venta.ts) y [ventas/utilsVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/utilsVenta.ts) dependen de `Carrito`.

Conclusión:

- El módulo público de pedido todavía no separa contrato moderno vs utilidades legacy.
- Hace falta mover o encapsular legado de mensajería/listado.

### 4. `snapshots.ts` sigue siendo compatibilidad válida, pero demasiado visible

Archivo: [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)

Hechos observados:

- `pedidoId` ya existe en snapshots.
- `tipoPago`, `finanzaId`, `turnoCajaId`, `esPedido` y `detalleVenta` siguen presentes.

Conclusión:

- Esto es aceptable como compatibilidad de persistencia.
- Pero debe quedar aislado del contrato público y del discurso de consumo normal.

### 5. Los docs principales de ventas ya mejoraron, pero aún falta cierre funcional

Archivos:

- [venta-turno-caja.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/venta-turno-caja.md)
- [ventas-implementation-plan.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/ventas-implementation-plan.md)
- [README.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/README.md)
- [interface-extension-pattern.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/interface-extension-pattern.md)

Hechos observados:

- Docs de ventas ya hablan de `VentaState`, `pedidoId`, `Pago` y `MovimientoCaja`.
- Docs de tesorería/cuentas todavía mencionan `turnoCajaId`, pero eso es correcto en su dominio.

Conclusión:

- La limpieza documental de ventas va bien.
- Lo que falta ya es sobre todo cierre técnico y encapsulamiento del legado.

## Cambios Propuestos

### 1. Cerrar `Venta` como contrato canónico público

Archivo principal:

- [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)

Qué cambiar:

- Dejar `IVenta` solo con campos canónicos:
  - `id`
  - `nombre`
  - `type`
  - `estado: VentaState`
  - `items`
  - `pedidoId?`
  - `createdAt`
  - `updatedAt`
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
- Sacar `detalleVenta` de `IVenta`.
- Reemplazar `VentaInput` por dos capas:
  - una entrada canónica pública,
  - una entrada legacy interna/compatibilidad para rehidratación.
- Mantener adaptación desde `OrderState` solo en un factory o mapper legacy explícito, no en el constructor canónico.
- Mantener compatibilidad de snapshots mediante método/factory dedicado.

Por qué:

- Hoy la API pública todavía permite construir ventas nuevas con semántica vieja.

Cómo:

- Introducir algo equivalente a `VentaLegacyInput` o `VentaSnapshotInput` dentro de `Venta.ts` o como tipo local no reexportado.
- Hacer que `new Venta(...)` acepte solo contrato canónico.
- Mover la normalización legacy a `fromLegacyInput(...)` y/o `fromPersistenceSnapshot(...)`.

### 2. Encapsular `detalleVenta` como compatibilidad y no como contrato público

Archivos:

- [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
- [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)

Qué cambiar:

- Quitar `detalleVenta` de `IVenta`.
- Mantener snapshot/detail solo en métodos de persistencia.
- Si hace falta acceso interno para nombres o reconstrucción, mantenerlo como propiedad privada o helper interno.

Por qué:

- `Venta` ya tiene `items` como fuente principal de contrato.
- Mantener `detalleVenta` en API pública alienta consumers a seguir anclados al modelo viejo.

Cómo:

- Recalcular `productosUnicos`, `getVentaItemsResumen` y serialización usando `items` como base primaria.
- Usar `detalleVenta` solo cuando se esté leyendo snapshot viejo y se necesite rehidratar.

### 3. Sacar legado de pedido fuera de `CarritoVenta` público

Archivo:

- [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts)

Qué cambiar:

- Quitar de la API pública:
  - `esPedido`
  - `finanzaId`
  - `marcarComoPedido()`
  - `convertirAVentaNormal()`
  - `marcarItemComoPedido()`
  - `itemsPedido`
  - `itemsVentaNormal`
  - `totalesSeparados`
- Dejar `metodoPago` y `dineroRecibido` solo si siguen siendo útiles para captura operativa; si se conservan, documentarlos como captura, no como agregado final.

Por qué:

- Usuario pidió terminar tarea completa, no dejar legado vivo “de a poco”.
- Ya no hay referencias TypeScript externas relevantes a esos miembros fuera del propio archivo.

Cómo:

- Ajustar interfaz `ICarritoVenta`.
- Ajustar `toJSON()`, `fromJSON()` y snapshot de carrito para eliminar o minimizar campos de pedido/finanza.
- Mantener compatibilidad de lectura, si es necesario, solo al parsear snapshots viejos.

### 4. Separar contrato moderno de pedido y legado de carrito/pedido

Archivos:

- [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)
- [shared/interfaces/index.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/index.ts)
- [shared/utils/venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/venta.ts)
- [ventas/utilsVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/utilsVenta.ts)

Qué cambiar:

- Dejar `pedido.ts` como módulo del contrato moderno:
  - `Pedido`
  - `PedidoItem`
  - `PedidoState`
- Mover `Carrito`, `Hora`, `ItemCar`, `PedidoLegacy` y relacionados a un archivo legacy explícito, por ejemplo `pedido.legacy.ts`.
- Reapuntar helpers de WhatsApp y formato al módulo legacy, no al contrato moderno.

Por qué:

- Hoy `pedido.ts` mezcla dos épocas del dominio.
- Eso confunde exports públicos y consumo futuro.

Cómo:

- Crear archivo legacy específico.
- Reexportar legado solo si aún hace falta compatibilidad, pero con naming explícito.
- Ajustar imports en `shared/utils/venta.ts`, `ventas/utilsVenta.ts` y `mappers.ts`.

### 5. Dejar compatibilidad de snapshots explícita y aislada

Archivos:

- [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)
- [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)

Qué cambiar:

- Mantener snapshots legacy para lectura y sync.
- Etiquetar claramente qué interfaces son canónicas nuevas y cuáles son solo persistencia heredada.
- Agregar factories/mappers dedicados:
  - `Venta.fromPersistenceSnapshot(...)`
  - `Venta.fromCouchSnapshot(...)`
  - o helpers equivalentes en módulo aparte.

Por qué:

- La compatibilidad tiene valor, pero no debe contaminar el modelo principal.

Cómo:

- Centralizar transformación legacy → canónica en un solo lugar.
- Evitar que constructor principal siga aceptando snapshots deformados.

### 6. Cerrar limpieza de documentación y exports públicos

Archivos:

- [README.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/README.md)
- [interface-extension-pattern.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/interface-extension-pattern.md)
- [ventas-implementation-plan.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/ventas-implementation-plan.md)
- [venta-turno-caja.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/venta-turno-caja.md)
- [index.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/index.ts)
- [shared/interfaces/index.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/index.ts)

Qué cambiar:

- Revisar exports para que contrato moderno y legado estén claramente distinguidos.
- Evitar enseñar `IPedido` o construcciones centradas en `detalleVenta`.
- Mantener docs de tesorería/cuentas sin tocar salvo que refieran incorrectamente `Venta`.

Por qué:

- El cierre de tarea incluye coherencia de consumo, no solo types.

Cómo:

- Hacer grep final sobre docs y exports públicos.
- Corregir solo referencias incorrectas al dominio `Venta`/`Pedido`.

## Decisiones y Supuestos

### Decisiones

- Se cerrará el refactor en una sola ejecución, no por tandas pequeñas.
- El contrato público canónico tendrá prioridad sobre compatibilidad interna.
- El legado seguirá existiendo solo donde haga falta para lectura/migración, no para creación nueva.
- `turnoCajaId` sigue siendo válido en tesorería/cuentas, pero no en `Venta` como campo primario.
- `Pago` no se renombra en esta fase.

### Supuestos

- No hay consumers TypeScript internos relevantes usando `OrderState` fuera de compatibilidad en `Venta.ts` y `PedidoLegacy`.
- Los helpers `shared/utils/venta.ts` y `ventas/utilsVenta.ts` son legado funcional acotado y pueden migrarse a imports legacy sin romper el nuevo contrato público.
- La compilación real seguirá validándose con `npx tsc --noEmit`, dado que `npm run build` está afectado por script ajeno de stubs en Windows.

## Secuencia de Implementación

1. Refactorizar `Venta.ts` para separar constructor canónico de factories legacy.
2. Quitar `detalleVenta` del contrato público `IVenta`.
3. Ajustar helpers y serialización para usar `items` como fuente primaria.
4. Limpiar `CarritoVenta.ts` retirando API legacy de pedido/finanza del contrato público.
5. Separar `pedido.ts` moderno de un nuevo archivo legacy para `Carrito`/`PedidoLegacy`.
6. Reapuntar `mappers.ts`, `shared/utils/venta.ts` y `ventas/utilsVenta.ts` al archivo legacy cuando corresponda.
7. Revisar `snapshots.ts` y factories de `Venta` para compatibilidad controlada.
8. Revisar exports públicos en `shared/interfaces/index.ts` y `src/index.ts`.
9. Hacer grep final sobre refs legacy en código/docs.
10. Validar con diagnósticos y `npx tsc --noEmit`.

## Verificación

La ejecución se considerará terminada si cumple todo esto:

1. `IVenta` ya no expone `detalleVenta`, `tipoPago`, `finanzaId`, `turnoCajaId` ni `esPedido`.
2. `new Venta(...)` acepta solo contrato canónico nuevo.
3. La compatibilidad legacy de venta queda aislada en factories/mappers explícitos.
4. `CarritoVenta` deja de ofrecer API pública para convertir/marcar pedidos o mezclar crédito/finanza.
5. `Pedido` moderno queda separado del legado de `Carrito`/`PedidoLegacy`.
6. Helpers de WhatsApp/pedido usan imports legacy explícitos, no el contrato moderno.
7. Docs principales de ventas no enseñan patrón viejo.
8. `npx tsc --noEmit` pasa correctamente.
