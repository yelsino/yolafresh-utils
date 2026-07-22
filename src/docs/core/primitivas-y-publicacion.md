# Primitivas y Publicación del Core

## Propósito

Este documento explica las primitivas de dominio publicadas por `yolafresh-utils` y cómo se compone la surface pública actual del paquete.

## Primitivas de dominio

### `Entity`

Evidencia: [Entity.ts](../../domain/shared/base/Entity.ts)

Responsabilidad observada:

- encapsular identidad estable de una entidad de dominio.

### `ValueObject`

Evidencia: [ValueObject.ts](../../domain/shared/base/ValueObject.ts)

Responsabilidad observada:

- encapsular valores tratados por su contenido y no por identidad propia.

### `DomainEvent`

Evidencia: [DomainEvent.ts](../../domain/shared/base/DomainEvent.ts)

Responsabilidad observada:

- expresar un hecho relevante ocurrido en el dominio;
- exigir al menos `occurredOn`.

### `AggregateRoot`

Evidencia: [AggregateRoot.ts](../../domain/shared/base/AggregateRoot.ts)

Responsabilidad observada:

- extender `Entity`;
- acumular `DomainEvent`;
- exponer `pullDomainEvents()` para extraer y vaciar eventos registrados.

## Value Objects publicados

Evidencia: [value-objects/index.ts](../../domain/shared/value-objects/index.ts)

Hoy se publican:

- `EmpresaId`
- `SucursalId`

Lectura de negocio:

- representan identidades especializadas para límites organizacionales del sistema.

## Eventos vigentes observados

### `VentaConfirmada`

Evidencia: [VentaConfirmada.ts](../../domain/ventas/events/VentaConfirmada.ts)

Responsabilidad observada:

- registrar confirmación de una venta;
- transportar `ventaId` y `total`.

Evidencia adicional:

- [Venta.ts](../../domain/ventas/entities/Venta.ts) agrega este evento al confirmar.

## Surface pública raíz

Evidencia: [src/index.ts](../../index.ts)

La publicación raíz actual se organiza en:

- `shared/base`
- `shared/kernel`
- `shared/utils`
- `shared/value-objects`
- contratos de `pedido`, `ventas`, `compras`, `inventario`, `tesoreria`, `finanzas`, `auth`, `personas` y `contabilidad`;
- `Venta`
- `CarritoVenta`
- `VentaSnapshot`
- `RecurrenciaEntity`

## Lectura correcta de publicación

### Lo que el paquete publica como lenguaje compartido

- contratos de negocio;
- enums;
- configuración fiscal;
- primitivas de dominio;
- tipos temporales;
- `Value Object`.

### Lo que el paquete publica como comportamiento todavía vigente

- `Venta`
- `CarritoVenta`
- `VentaSnapshot`
- `RecurrenciaEntity`

## Restricciones observadas

- el paquete no publica ya services operativos ni adapters;
- `shared/utils` quedó reducido a soporte temporal mínimo;
- la raíz ya no debe reabsorber contratos de UI, DOM, multimedia ni integración;
- el consumo detallado debe hacerse por subpaths de dominio.

## Referencias

- [README.md](./README.md)
- [arquitectura-vigente.md](./arquitectura-vigente.md)
