# Plan de poda `contracts only` para `yolafresh-utils`

## Resumen

Este plan convierte `yolafresh-utils` en una librería estrictamente orientada a:

- contratos TypeScript;
- enums canónicos;
- `Value Object`;
- primitivas mínimas de dominio compartido;
- agregados/entidades solo si siguen cumpliendo rol contractual y no mezclan infraestructura ni adaptación.

El criterio decidido es **contracts only**. Por lo tanto, el plan elimina o saca de la superficie pública todo lo que sea:

- UI/frontend;
- adapters de app;
- integraciones específicas;
- binarios/artefactos;
- duplicados;
- services/processors/factories;
- snapshots de persistencia;
- compatibilidad legacy;
- utilidades de presentación o routing.

## Estado actual

### Superficie pública actual

Exploración confirmada en:

- [src/index.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/index.ts)
- [scripts/generate-exports.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/scripts/generate-exports.ts)
- [src/domain/shared/utils/index.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/index.ts)
- [src/domain/shared/interfaces/index.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/index.ts)

Hoy el paquete publica mezcla de:

- contratos e interfaces;
- utilidades UI y frontend;
- integración WhatsApp;
- services/processors/factories;
- snapshots de persistencia;
- módulos duplicados;
- artefactos binarios.

### Evidencia de módulos fuera de propósito

#### UI / frontend / app-specific

- [src/domain/shared/utils/tools.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/tools.ts)
  - usa `document`, `HTMLDialogElement`, listeners y estilos.
- [src/domain/shared/utils/icons.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/icons.ts)
  - contiene SVGs/UI assets.
- [src/domain/shared/utils/multimedia.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/multimedia.ts)
  - depende de `Audio`.
- [src/domain/shared/utils/venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/venta.ts)
  - genera link de WhatsApp y mensaje comercial.
- [src/domain/ventas/utilsVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/utilsVenta.ts)
  - duplica integración WhatsApp.
- [src/domain/shared/utils/producto.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/producto.ts)
  - construye URLs web.
- [src/domain/inventario/producto.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/inventario/producto.ts)
  - duplica routing web.

#### Services / processors / factories

- [src/domain/inventario/MovimientoInventarioService.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/inventario/MovimientoInventarioService.ts)
- [src/domain/compras/RecepcionService.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/compras/RecepcionService.ts)
- [src/domain/compras/EventoCompraFactory.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/compras/EventoCompraFactory.ts)
- [src/domain/compras/GeneradorCompra.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/compras/GeneradorCompra.ts)
- [src/domain/finanzas/RecurrenciaProcessor.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/finanzas/RecurrenciaProcessor.ts)
- [src/domain/usuarios/PermisoValidator.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/usuarios/PermisoValidator.ts)

Todos estos exceden una librería contractual pura.

#### Persistencia / snapshots / adapters

- [src/domain/ventas/snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)
  - DTOs de persistencia/Couch.
- [src/domain/ventas/Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
  - hoy aún expone serialización a snapshots de persistencia.
- [src/domain/shared/interfaces/tarjetaVirtual.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/tarjetaVirtual.ts)
  - parece más integración/feature de app que contrato núcleo.
- [src/domain/shared/interfaces/notificaciones.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/notificaciones.ts)
  - empuja el paquete hacia mensajería multicanal e integración.

#### Duplicados / legacy / ruido

- [src/domain/ventas/pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/pedido.ts)
  - DTO legacy paralelo.
- [src/domain/usuarios/persons.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/usuarios/persons.ts)
  - duplicado divergente de `shared/interfaces/persons.ts`.
- [src/domain/inventario/producto.update.interface.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/inventario/producto.update.interface.ts)
  - duplicado de `shared/interfaces/producto.update.interface.ts`.
- [src/domain/usuarios/rbac.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/usuarios/rbac.ts)
  - alias/re-export superficial.
- [src/domain/shared/interfaces/producto.rar](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/producto.rar)
- [src/domain/inventario/producto.rar](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/inventario/producto.rar)
  - binarios dentro de `src/`.

### Zonas grises que deben simplificarse

- [src/domain/shared/utils/textos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/textos.ts)
  - mezcla formatting/presentación/localización.
- [src/domain/shared/utils/listas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/listas.ts)
  - helper ad-hoc de parsing.
- [src/domain/shared/utils/regex.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/regex.ts)
  - parsing de input/UX.
- [src/domain/shared/utils/enums.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/enums.ts)
  - contiene contratos válidos, pero está mal ubicada para una librería contractual pura.
- [src/domain/shared/interfaces/producto.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/producto.ts)
  - contiene arreglo de ejemplo incrustado al final.

## Decisiones y supuestos

### Decisiones cerradas

- El objetivo final es **contracts only**.
- Los módulos operacionales y de aplicación salen del paquete o dejan de publicarse.
- Los duplicados deben consolidarse en una única fuente canónica.
- Los binarios dentro de `src/` se eliminan.
- Los barrels y el root export deben reflejar solo la nueva superficie mínima.

### Supuestos

- Se acepta breaking change fuerte del paquete.
- No se conservará compatibilidad con imports históricos que estén fuera del propósito contractual.
- La ejecución puede requerir borrar archivos y ajustar exports generados.

## Cambios propuestos

## 1. Poda inmediata de UI y utilidades de app

### Archivos a eliminar

- `src/domain/shared/utils/tools.ts`
- `src/domain/shared/utils/icons.ts`
- `src/domain/shared/utils/multimedia.ts`
- `src/domain/shared/utils/venta.ts`
- `src/domain/ventas/utilsVenta.ts`
- `src/domain/shared/utils/producto.ts`
- `src/domain/inventario/producto.ts`

### Qué hacer

- Eliminar archivos.
- Quitar sus exports de barrels generados.
- Eliminar cualquier export raíz residual indirecto.

### Por qué

- Ninguno modela contratos ni reglas canónicas.
- Son frontend, integración o routing.

## 2. Poda de services, processors y factories

### Archivos a eliminar

- `src/domain/inventario/MovimientoInventarioService.ts`
- `src/domain/compras/RecepcionService.ts`
- `src/domain/compras/EventoCompraFactory.ts`
- `src/domain/compras/GeneradorCompra.ts`
- `src/domain/finanzas/RecurrenciaProcessor.ts`
- `src/domain/usuarios/PermisoValidator.ts`

### Qué hacer

- Eliminar archivos.
- Quitar exports directos del root (`src/index.ts`) y cualquier barrel involucrado.

### Por qué

- Son lógica operativa/orquestación, no superficie contractual.

## 3. Poda de persistencia y snapshots

### Archivos a eliminar o desenganchar

- `src/domain/ventas/snapshots.ts`

### Archivos a simplificar

- `src/domain/ventas/Venta.ts`
- `src/domain/ventas/VentaSnapshot.ts`
- `src/index.ts`

### Qué hacer

- Eliminar DTOs de persistencia/Couch.
- Sacar de `Venta.ts`:
  - imports de snapshots de persistencia;
  - `toPersistenceSnapshot()`;
  - `toCouchSnapshotMinimal()`;
  - cualquier helper que exista solo para esos DTOs.
- Mantener `Venta` como agregado/contrato puro.
- Mantener `VentaSnapshot` solo si permanece como contrato histórico de negocio y no como shape de almacenamiento.
- Quitar export root de `./domain/ventas/snapshots`.

### Por qué

- Persistencia no pertenece al propósito `contracts only`.

## 4. Eliminar duplicados y legacy residuales

### Archivos a eliminar

- `src/domain/ventas/pedido.ts`
- `src/domain/usuarios/persons.ts`
- `src/domain/inventario/producto.update.interface.ts`
- `src/domain/usuarios/rbac.ts`

### Fuente canónica que queda

- `src/domain/shared/interfaces/pedido.ts`
- `src/domain/shared/interfaces/persons.ts`
- `src/domain/shared/interfaces/producto.update.interface.ts`
- `src/domain/shared/utils/rbac.ts` o eliminación posterior si también queda fuera de propósito contractual

### Por qué

- Reducen coherencia y crean drift entre contratos.

## 5. Eliminar artefactos binarios

### Archivos a eliminar

- `src/domain/shared/interfaces/producto.rar`
- `src/domain/inventario/producto.rar`

### Por qué

- No pertenecen a una librería TS ni deben vivir bajo `src/`.

## 6. Revisar y podar interfaces fuera de foco

### Archivos a evaluar para eliminación

- `src/domain/shared/interfaces/tarjetaVirtual.ts`
- `src/domain/shared/interfaces/notificaciones.ts`
- `src/domain/shared/interfaces/Device.ts`

### Decisión de ejecución

- En esta poda `contracts only`, deben salir si no son núcleo retail/POS y no son reutilizados por contratos principales del paquete.

### Qué hacer

- Verificar referencias internas.
- Si no sostienen modelos núcleo, eliminarlos y ajustar barrels.

### Por qué

- Amplían la librería hacia features laterales o integración.

## 7. Normalizar capa contractual shared

### Archivos a simplificar

- `src/domain/shared/utils/enums.ts`
- `src/domain/shared/utils/textos.ts`
- `src/domain/shared/utils/listas.ts`
- `src/domain/shared/utils/regex.ts`
- `src/domain/shared/interfaces/producto.ts`

### Qué hacer

- `enums.ts`: decidir si permanece temporalmente o se mueve a `shared/interfaces`/nuevo módulo contractual. En primera ejecución puede quedarse, pero sin mezclar helpers no contractuales alrededor.
- `textos.ts`, `listas.ts`, `regex.ts`: evaluar referencias. Si solo hacen formatting/parsing de UX, eliminarlos.
- `producto.ts`: quitar dataset/ejemplo incrustado y dejar solo contrato canónico.

### Por qué

- Aunque no son todos igual de graves, hoy mezclan contrato con conveniencia de app.

## 8. Rehacer exports públicos mínimos

### Archivos a tocar

- `scripts/generate-exports.ts`
- `src/domain/shared/utils/index.ts`
- `src/domain/shared/interfaces/index.ts`
- `src/index.ts`

### Qué hacer

- Ajustar generador para dejar de exportar módulos podados.
- Regenerar barrels.
- Limitar `src/index.ts` a:
  - `shared/interfaces`
  - `shared/base`
  - `shared/value-objects`
  - solo contratos/agregados supervivientes realmente canónicos

### Por qué

- La API pública actual todavía expone demasiado.

## Orden de ejecución propuesto

## Fase A. Basura clara

1. Eliminar `*.rar`
2. Eliminar `tools.ts`, `icons.ts`, `multimedia.ts`
3. Eliminar `shared/utils/venta.ts`, `ventas/utilsVenta.ts`
4. Eliminar `shared/utils/producto.ts`, `inventario/producto.ts`

## Fase B. Duplicados y legacy

1. Eliminar `ventas/pedido.ts`
2. Eliminar `usuarios/persons.ts`
3. Eliminar `inventario/producto.update.interface.ts`
4. Eliminar `usuarios/rbac.ts`

## Fase C. Services y processors

1. Eliminar `MovimientoInventarioService.ts`
2. Eliminar `RecepcionService.ts`
3. Eliminar `EventoCompraFactory.ts`
4. Eliminar `GeneradorCompra.ts`
5. Eliminar `RecurrenciaProcessor.ts`
6. Eliminar `PermisoValidator.ts`

## Fase D. Persistencia fuera

1. Eliminar `ventas/snapshots.ts`
2. Simplificar `Venta.ts`
3. Simplificar `VentaSnapshot.ts`
4. Limpiar exports root

## Fase E. Contratos laterales

1. Auditar referencias de `tarjetaVirtual.ts`, `notificaciones.ts`, `Device.ts`
2. Eliminar los que no sostengan núcleo retail/POS
3. Revisar `textos.ts`, `listas.ts`, `regex.ts`
4. Limpiar `shared/interfaces/producto.ts`

## Fase F. Publicación final

1. Ajustar `generate-exports.ts`
2. Regenerar barrels
3. Verificar superficie pública final

## Verificación

### Búsquedas esperadas sin resultados

- `document.getElementById`
- `HTMLDialogElement`
- `wa.me`
- `Audio(`
- `producto.rar`
- `RecepcionService`
- `EventoCompraFactory`
- `GeneradorCompra`
- `RecurrenciaProcessor`
- `PermisoValidator`
- `toPersistenceSnapshot(`
- `toCouchSnapshotMinimal(`

### Validaciones

- `pnpm run generate-exports`
- `pnpm exec tsc && pnpm exec tsc-alias`
- `GetDiagnostics` en archivos supervivientes tocados
- Revisar `src/index.ts` generado

### Resultado esperado

Al terminar, `yolafresh-utils` debe exponer solo contratos y primitivas de dominio compartidas, sin UI, sin adapters, sin persistencia, sin binarios, sin duplicados y sin lógica operativa de aplicación.

## Riesgos

- Habrá breaking changes masivos en imports externos.
- Algunos contratos laterales (`notificaciones`, `tarjetaVirtual`, `Device`) pueden requerir validación final antes de borrado si algún consumidor externo depende de ellos.
- Al sacar `snapshots.ts`, puede ser necesario redefinir frontera exacta entre `Venta` y `VentaSnapshot`.

## Criterio de terminado

Trabajo termina cuando la superficie pública root y los barrels generados representen únicamente una librería contractual coherente con retail/POS, sin residuos de frontend, infraestructura, persistencia ni legacy.
