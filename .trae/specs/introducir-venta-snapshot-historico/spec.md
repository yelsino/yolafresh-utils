# Venta Snapshot Histórico para `yolafresh-utils` Spec

## Why

`Venta` ya quedó saneada como documento transaccional/comercial canónico, pero sola no alcanza para reconstruir fielmente historial humano cuando cambian catálogo, nombres visibles o actores relacionados con venta.

Hace falta documento histórico separado que congele representación visible de venta sin volver a contaminar `Venta` con datos legacy de UI, cobro, caja o finanzas.

## What Changes

- Introducir documento nuevo `venta_snapshot` como representación histórica persistida de `Venta`.
- Definir contrato mínimo profesional de `VentaSnapshot`, `VentaSnapshotItem` y `VentaSnapshotActor`.
- Definir reglas de inmutabilidad y relación 1:1 lógica entre `venta` y `venta_snapshot`.
- Definir responsabilidad de `venta_snapshot` para UI histórica, impresión operativa y trazabilidad comercial.
- Definir qué datos históricos visibles se preservan y cuáles quedan explícitamente fuera.
- Definir estrategia de creación desde `Venta` y/o desde contexto de captura visible, sin revivir `detalleVenta` legacy como contrato principal.
- Definir snapshots y persistencia compatibles con Couch/Pouch/SQLite para `venta_snapshot`.
- **BREAKING** Documentar que historial nuevo de ventas no debe depender de catálogo vivo como única fuente para render humano duradero.

## Impact

- Affected specs:
  - `contratos-pedido-venta-yolafresh-utils`
  - `restructure-offline-first-sync-runtime`
  - `optimize-pos-sales-runtime-benchmark`
- Affected code:
  - `src/domain/ventas/Venta.ts`
  - `src/domain/ventas/snapshots.ts`
  - `src/domain/ventas/CarritoVenta.ts`
  - `src/domain/shared/utils/enums.ts`
  - `src/domain/shared/interfaces/index.ts`
  - `src/domain/shared/utils/index.ts`
  - `src/docs/ventas-pedidos-modelo-negocio.md`
  - `src/docs/ventas-implementation-plan.md`

## ADDED Requirements

### Requirement: Documento histórico separado de venta

El sistema SHALL proveer documento `venta_snapshot` separado de `Venta`, cuya responsabilidad sea preservar representación histórica mostrable de una venta.

#### Scenario: Snapshot histórico persistido
- **WHEN** se cree o cierre una `Venta`
- **THEN** el sistema debe poder materializar un `venta_snapshot`
- **AND** `venta_snapshot` no reemplaza a `Venta`
- **AND** `venta_snapshot.ventaId` debe referenciar a la venta canónica

#### Scenario: Historial visible duradero
- **WHEN** catálogo, nombres de productos, imágenes o usuarios cambien con tiempo
- **THEN** `venta_snapshot` debe seguir siendo suficiente para render histórico humano
- **AND** no debe requerir reconstrucción obligatoria desde catálogo vivo

### Requirement: Contrato mínimo de VentaSnapshot

El sistema SHALL definir contrato mínimo y profesional para `VentaSnapshot`.

#### Scenario: Campos de cabecera mínimos
- **WHEN** se defina `VentaSnapshot`
- **THEN** debe incluir `id`, `type`, `ventaId`, `createdAt`, `items`, `subtotal`, `impuesto` y `total`
- **AND** puede incluir `codigoVenta` y `procedencia`
- **AND** no debe incluir payloads de cobro, caja ni fiscalización

#### Scenario: Actores visibles
- **WHEN** se preserve trazabilidad visible
- **THEN** `VentaSnapshot` debe poder incluir `cliente` y `vendedor`
- **AND** cada actor debe preservar `id` opcional/null y `nombre`
- **AND** ese contrato no debe depender de documento vivo de cliente o usuario para render básico

#### Scenario: Items históricos
- **WHEN** se defina `VentaSnapshotItem`
- **THEN** cada item debe incluir `id`, `presentacionId`, `nombre`, `cantidadVendida`, `precioUnitario` y `total`
- **AND** puede incluir `imagenUrl`, `unidadComercial` y `descuento`
- **AND** `total` de línea debe representar monto final de línea después de descuento

### Requirement: Inmutabilidad y consistencia

El sistema SHALL tratar `venta_snapshot` como documento inmutable después de cierre definitivo de venta.

#### Scenario: Venta abierta o en ajuste
- **WHEN** venta aún no se considere cerrada/finalizada
- **THEN** snapshot puede regenerarse o reemplazarse de forma controlada

#### Scenario: Venta cerrada
- **WHEN** venta ya esté confirmada/despachada/finalizada según política de negocio
- **THEN** `venta_snapshot` no debe mutar salvo migración técnica controlada

#### Scenario: Invariantes monetarias
- **WHEN** se persista `venta_snapshot`
- **THEN** `items` debe tener al menos un elemento
- **AND** `cantidadVendida` debe ser mayor que cero
- **AND** `precioUnitario`, `descuento`, `subtotal`, `impuesto` y `total` no deben ser negativos
- **AND** `subtotal + impuesto` debe ser consistente con `total`

### Requirement: Separación estricta de responsabilidades

El sistema SHALL mantener `VentaSnapshot` limpio de conceptos ajenos a representación histórica comercial.

#### Scenario: Campos prohibidos
- **WHEN** se defina contrato de `venta_snapshot`
- **THEN** no debe incluir `tipoPago`, `finanzaId`, `turnoCajaId`, `esPedido`, payloads de caja ni payloads fiscales
- **AND** no debe reintroducir shape completo de `detalleVenta` legacy

#### Scenario: Relación con otros agregados
- **WHEN** frontend renderice historial o ticket histórico
- **THEN** debe poder usar `Venta` para estado/ids/montos core
- **AND** debe poder usar `VentaSnapshot` para nombres visibles, imagen, unidad comercial y actores visibles

### Requirement: Persistencia y mapeo

El sistema SHALL permitir mapear `venta_snapshot` a persistencia local y sincronizada usando convenciones existentes de `yolafresh-utils`.

#### Scenario: Identidad y discriminador
- **WHEN** se construya `venta_snapshot`
- **THEN** debe usar identidad propia
- **AND** debe tener `type = "venta_snapshot"`
- **AND** debe exponer `ventaId` como FK lógica

#### Scenario: Couch/Pouch/SQLite
- **WHEN** se defina persistencia de `venta_snapshot`
- **THEN** contrato debe poder mapearse a Couch/Pouch/SQLite
- **AND** debe permitir índices por `type`, `ventaId` y `codigoVenta`

## MODIFIED Requirements

### Requirement: Historial de ventas

El historial de ventas SHALL dejar de depender exclusivamente de `Venta` más catálogo vivo para render humano duradero. Para ventas nuevas, modelo objetivo debe usar `Venta` como verdad transaccional y `VentaSnapshot` como representación histórica mostrable.

### Requirement: Modelo de Venta

`Venta` SHALL mantenerse como documento transaccional/comercial limpio. Cualquier necesidad de preservar nombre visible, imagen, unidad comercial o actor mostrado al momento de venta debe resolverse mediante `VentaSnapshot` y no mediante reintroducción de `detalleVenta` legacy en contrato principal de `Venta`.

## REMOVED Requirements

### Requirement: Reconstruir historial humano únicamente desde catálogo vivo
**Reason**: No garantiza fidelidad histórica cuando productos, clientes o vendedores cambian con el tiempo.
**Migration**: Ventas nuevas deben crear `VentaSnapshot`; ventas antiguas pueden usar fallback transitorio a `Venta` + catálogos vivos hasta completar estrategia de backfill o convivir sin snapshot.
