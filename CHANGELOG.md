# Changelog

Cambios relevantes de `yola-fresh-utils` se registran aquí.

Este proyecto adopta versionado semántico:

- `major`: cambios incompatibles en surface pública o contratos compartidos;
- `minor`: contratos, catálogos, exports o docs compatibles hacia atrás;
- `patch`: correcciones internas, tests, docs o fixes compatibles.

## [Unreleased]

## [2.0.0] - 2026-07-22

### Changed

- Cambio incompatible: `IVenta.items` pasa de `VentaItem[]` a `number` y
  representa la cantidad de líneas de `VentaSnapshot.items`.
- `VentaSnapshotItem` queda como único contrato de detalle confirmado y se retira
  `VentaItem` de la surface pública.
- `Venta` exige coherencia entre el conteo y el snapshot transitorio/contextual.
- `PedidoItem` incorpora `nombre`, `montoModificado`, `unidadComercial` e
  `imagenUrl` para conservar información visible de la línea.
- `RecepcionCobroCliente` incorpora `codigoConstancia` opcional.

### Migration

- Se agrega `src/docs/ventas/migracion-venta-items-conteo.md` para migrar datos y
  consumers sin perder el detalle histórico.

## [1.0.8] - 2026-07-15

### Added

- Se publica el dominio `pedido` con contratos para `Pedido` y `PedidoEntrega`.
- Se agregan los subpaths públicos `pedido` y `pedido/contracts`.
- Se documentan el modelo vigente, las relaciones interdominio y la migración desde
  `ventas/contracts` hacia `pedido/contracts`.

### Changed

- Se corrige la línea de release publicada para mantener el paquete en `1.x`.
- En esa release, la documentación de instalación y consumo fijaba `v1.0.8`.
- `Pedido` deja de exportarse desde `ventas/contracts` y debe importarse desde
  `pedido/contracts`; no existe bridge de compatibilidad.

## [1.0.7] - 2026-07-14

### Changed

- Se endurecen la aritmética monetaria y la validación temprana del módulo de ventas para POS.

## [1.0.6] - 2026-07-13

### Changed

- Se protege la entidad `Venta` y se corrige la construcción de snapshots.

## [1.0.5] - 2026-07-12

### Added

- Se incorpora el override manual de línea y se preserva el monto modificado en ventas.

## [1.0.4] - 2026-07-09

### Changed

- Se separa la condición de pago y se simplifica el estado de `Venta`.

## [1.0.3] - 2026-07-08

### Added

- Se completa línea `v1.x` sin abrir nueva major.
- Se consolida `auth` como dominio compartido dentro de misma línea `v1`.
- `resolveRoleGrants()` como helper público oficial.
- `getPermissionDefinition()`, `listAllPermissions()` y `listAllRoles()`.
- documentación de migración `v1 -> v2`.
- soporte documental y contractual para `dbName` en `AuthSnapshot`.
- test de contrato de snapshot y ampliación de cobertura de exports públicos.
- contratos `auth`, catálogos, metadata, snapshot offline y helpers puros.
- subpaths públicos `auth/*`.
- guía de instalación por tags GitHub y versionado secuencial.

## [1.0.2] - 2026-07-08

### Línea base

- Se consolida `1.0.2` como línea base documentada del paquete.
- Se formaliza política semver para futuras releases.
- Se agregan scripts de release por `patch`, `minor`, `major` y `prerelease`.
