# Changelog

Cambios relevantes de `yola-fresh-utils` se registran aquí.

Este proyecto adopta versionado semántico:

- `major`: cambios incompatibles en surface pública o contratos compartidos;
- `minor`: contratos, catálogos, exports o docs compatibles hacia atrás;
- `patch`: correcciones internas, tests, docs o fixes compatibles.

## [Unreleased]

## [2.2.5] - 2026-09-01

### Fixed

- `Pedido` y `Venta` comparten ahora el único contrato
  `ProcedenciaComercialEnum`; los nombres históricos son aliases al mismo enum,
  no catálogos independientes.
- Las lecturas de `CarritoVenta`, `Venta` y `VentaSnapshot` normalizan las
  serializaciones titlecase históricas y las nuevas escrituras usan uppercase.
- `OTRO` forma parte del contrato compartido y los valores desconocidos no se
  reinterpretan automáticamente.

## [2.2.3] - 2026-08-22

### Fixed

- `Pedido` schema 3 congela por línea la decisión de inventario, el tipo de
  venta y la conversión física versionada que deberá conservarse al convertir
  el pedido en venta.
- Las líneas no inventariables quedan identificadas explícitamente y el plan
  de una venta ya no les exige metadatos físicos, manteniendo la exigencia
  completa para toda línea que sí registra un movimiento.

## [2.2.2] - 2026-08-22

### Fixed

- Los items inventariables de Compra congelan ahora la conversión física
  completa: presentación, producto base, factor, unidad base y
  `versionConversion` como entero seguro positivo.
- Los items no inventariables pueden omitir esos metadatos sin fabricar una
  conversión física ni una versión inexistente.

## [2.2.1] - 2026-08-22

### Fixed

- Todo hecho físico que referencia una presentación exige ahora su
  `versionConversion` como entero positivo seguro. Las capturas directas en la
  unidad base permanecen explícitamente separadas y no inventan una versión.
- `VentaSnapshot` y los validadores de movimientos rechazan versiones mayores
  que `Number.MAX_SAFE_INTEGER`, evitando incrementos o comparaciones no
  deterministas.

## [2.2.0] - 2026-08-22

### Added

- `Presentacion.versionConversion` pasa a ser obligatoria y se acompaña de una
  política compartida para crearla en `1`, conservarla ante cambios cosméticos
  e incrementarla exactamente en uno cuando cambia la conversión física.
- Los bordes legacy pueden normalizar únicamente la ausencia histórica a `1`;
  una versión explícita inválida se rechaza sin corrección silenciosa.
- Las líneas nuevas de Gastronomía congelan la conversión versionada usada al
  agregarse. La identidad de línea distingue conversiones diferentes y los
  pedidos históricos sin metadata permanecen explícitamente legacy.

### Compatibility

- Móvil y backend deben consumir el mismo tarball `2.2.0` antes de admitir
  nuevas escrituras de catálogo. Los documentos CouchDB existentes requieren
  un backfill controlado de `versionConversion: 1`.

## [1.12.0] - 2026-08-15

### Changed

- La activación de Inventory V2 deja de depender de un único conteo global:
  `CORTE_V2` y `V2_ACTIVO` conservan la lista canónica
  `aperturasPorAlmacen`, con un conteo físico independiente por almacén.
- `V2_ACTIVO` conserva también `coordinacionId`; la transición desde el corte
  exige coordinación y lista exactas, sin sustituciones ni omisiones.
- Las referencias y los snapshots especiales de apertura incorporan
  `almacenId`, cerrando la posibilidad de aplicar un conteo en otro almacén.
- La evidencia de activación contiene un par captura/aplicación por almacén y
  debe cubrir exactamente todas las aperturas declaradas.

### Validation

- `aperturasPorAlmacen` es obligatoria, no vacía, ordenada ascendentemente por
  `almacenId` y rechaza almacenes o conteos duplicados.
- Los payloads singulares anteriores con `conteoAperturaId` en `CORTE_V2` o
  `V2_ACTIVO` fallan cerrados; no se reinterpretan como una apertura completa.

### Migration

- Los coordinadores deben materializar una apertura por cada almacén activo,
  ordenar la lista antes de persistirla y recopilar ambos recibos por almacén.
- No debe escribirse `V2_ACTIVO` hasta tener cobertura exacta de todos los
  almacenes del corte.

## [1.11.1] - 2026-08-15

### Fixed

- `TransferenciaInventarioV2` deja de asumir una recepción total única: soporta
  recibos parciales/múltiples, cierre con diferencia, presentación opcional para
  captura base y una entrada determinista por recibo físico.
- Transferencias incorporan `version`/`expectedVersion`, evolución append-only y
  validación CAS para impedir sobre-recepción o pérdida de recibos concurrentes.
- `PoliticaInventario` incorpora observación de autoridad, actor e idempotencia;
  su administración solo se valida en `PREPARANDO_V2` o `V2_ACTIVO`.
- `MermaInventario` conserva lectura wire-v2 legacy y agrega un flujo auditado,
  versionado e idempotente para escritores nuevos. La salida solo se materializa
  desde una transición validada `APROBADO -> APLICADO`.

### Added

- Resumen contractual de cantidades enviadas, aceptadas, rechazadas, faltantes
  y en tránsito por transferencia.
- Validadores de evolución para transferencias, políticas y mermas, junto con
  pruebas de replay, stale version y decisiones multi-tablet concurrentes.
- Validación de evidencia de merma derivada de la política resuelta.

### Compatibility

- `Transferencia` V1 continúa intacta. `MermaInventario` mantiene
  `schemaVersion: 2` y acepta documentos anteriores sin `version`/`flujo` para
  lectura; toda evolución nueva exige el perfil auditado.

## [1.11.0] - 2026-08-15

### Added

- Raíz `TransferenciaInventarioV2`, separada del contrato V1, con líneas en
  unidad base, conversión congelada y recibos idempotentes por acción.
- Validadores, máquina de estados y materializadores puros de movimientos de
  salida/entrada para transferencias offline-first.
- Permisos atómicos para administrar políticas, operar/aprobar mermas y
  ver/crear/enviar/recibir/cancelar transferencias.

### Changed

- El catálogo auth pasa a `1.5.0` por la ampliación compatible de permisos.
- Los helpers de inventario quedan disponibles también desde la exportación
  raíz del paquete.

### Compatibility

- `Transferencia` y `EstadoTransferenciaEnum` V1 permanecen exportados sin
  cambios; ningún payload legacy se reinterpreta como V2.

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
