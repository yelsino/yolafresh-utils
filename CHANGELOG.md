# Changelog

Cambios relevantes de `yola-fresh-utils` se registran aquí.

Este proyecto adopta versionado semántico:

- `major`: cambios incompatibles en surface pública o contratos compartidos;
- `minor`: contratos, catálogos, exports o docs compatibles hacia atrás;
- `patch`: correcciones internas, tests, docs o fixes compatibles.

## [Unreleased]

## [1.4.3] - 2026-08-11

### Added

- Catálogo contextual de cargos laborales según el perfil operativo de la
  empresa.
- Cargos gastronómicos para salón, cocina y barra, visibles únicamente en la
  vertical `GASTRONOMIA`.
- Cargo `REPARTIDOR`, disponible únicamente cuando se activa `DELIVERY` o
  `RUTAS_REPARTO`.
- Catálogo RBAC gastronómico con permisos atómicos para configuración, salón,
  pedido, rondas, entrega, preparación y cuenta.
- Roles oficiales de anfitrión, mesero, capitán de salón, cocinero, jefe de
  cocina y barra, filtrados por vertical.

### Changed

- Las empresas legacy conservan el catálogo compatible con Retail.
- Los cargos gastronómicos reciben únicamente roles gastronómicos; `CAJERO`
  conserva su rol compartido y obtiene permisos de cuenta/cobro de restaurante.
- El catálogo de autorización pasa a la versión `1.3.0`.

## [1.4.2] - 2026-08-05

### Fixed

- Se incrementa `AUTH_CATALOG_VERSION` a `1.2.0` para que snapshots y clientes
  detecten la incorporación del permiso de imágenes.
- Se prueba explícitamente que el rol `inventario` resuelve el permiso canónico.

## [1.4.1] - 2026-08-05

### Fixed

- Se incorpora `productos:producto:editar_imagen` al catálogo IAM canónico y
  se concede a los roles `supervisor` e `inventario`, manteniendo al rol
  `admin` cubierto por el wildcard global.
- El permiso IAM canónico queda alineado conceptualmente con el permiso legado
  `productos:editar-imagen` sin mezclar los formatos de ambos catálogos.

## [1.4.0] - 2026-08-05

### Added

- Contratos `ImageScope`, `ProductImage` y `CompatibleProductImage` para
  distinguir recursos privados de tenant y recursos globales reutilizables.
- Validadores `isImageSizes` e `isProductImage` para migracion compatible de
  documentos existentes.
- Pruebas de producto sin imagen, imagen legacy e imagen global.

### Changed

- `ProductoBase.imagen` pasa a ser opcional y acepta el contrato compatible.
- Presentaciones, categorias y logo de empresa comparten el mismo contrato de
  imagen sin depender de infraestructura ni proveedor CDN.

## [1.3.0] - 2026-08-05

### Changed

- Los contratos gastronómicos adoptan nombres canónicos simples en español;
  los nombres ingleses de la vista previa se mantienen como aliases temporales.
- `ProductoRestaurante` queda definido como configuración de una
  `Presentacion` existente, no como un segundo producto.
- Se formaliza `ComandoRestaurante` con versión esperada obligatoria,
  dependencias causales y resultados tipados para sincronización
  multidispositivo sin última escritura ganadora.
- Se documenta la puerta productiva de la primera historia completa de salón,
  pedido, cocina y entrega.

## [1.2.0] - 2026-07-29

### Added

- Surface pública `restaurant`, `restaurant/contracts` y
  `restaurant/policies` para la operación gastronómica offline-first.
- Contratos versionados para local, ambientes, zonas, mesas, estaciones,
  menú/modificadores, sesiones, pedidos, comandas, preparación, cuentas y
  asignaciones de pago.
- Comandos durables con `operationId`, versión esperada y trazabilidad de
  actor/dispositivo.
- Políticas puras para transiciones de estado, modificadores y aritmética
  monetaria en unidades mínimas.

## [1.1.0] - 2026-07-25

### Added

- Contrato público v1 para enrolamiento seguro de dispositivos mediante QR.
- DTOs de invitación, claim, polling, finalización, binding y conexión tenant.
- Parser seguro del payload QR y constructor canónico del challenge Ed25519.
- Permisos IAM `iam:dispositivo:*` y concesión al rol base `soporte-tecnico`.
- Documentación del contrato compartido y RFC de implementación para frontend.

## [1.0.9] - 2026-07-22

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
