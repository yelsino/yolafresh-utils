# Core

## Propósito

Este directorio documenta núcleo vigente de `yolafresh-utils` después de migración completa a estructura por dominios.

La evidencia principal vive en:

- [src/index.ts](../../index.ts)
- [base/index.ts](../../domain/shared/base/index.ts)
- [kernel/index.ts](../../domain/shared/kernel/index.ts)
- [value-objects/index.ts](../../domain/shared/value-objects/index.ts)
- [dates.ts](../../domain/shared/utils/dates.ts)
- [ventas/index.ts](../../domain/ventas/index.ts)
- [finanzas/index.ts](../../domain/finanzas/index.ts)
- [compras/index.ts](../../domain/compras/index.ts)

## Alcance

El core documenta:

- propósito actual del paquete;
- root mínimo y subpaths oficiales;
- ownership contractual por dominio;
- primitivas de dominio reutilizables;
- entidades ricas que siguen en surface pública;
- límites entre dominio e infraestructura.

## Documentos

- [arquitectura-vigente.md](./arquitectura-vigente.md): arquitectura actual, capas y límites.
- [contratos-compartidos.md](./contratos-compartidos.md): mapa de contratos por dominio propietario.
- [primitivas-y-publicacion.md](./primitivas-y-publicacion.md): primitivas base, eventos y publicación raíz.
- [rfc-evolucion-estructura-libreria.md](./rfc-evolucion-estructura-libreria.md): RFC aceptado e implementado.

## Regla central

`yolafresh-utils` preserva lenguaje compartido de negocio.

Su foco vigente es:

- contratos de negocio;
- kernel transversal mínimo;
- primitivas de dominio;
- entidades con invariantes;
- publicación explícita por dominio.

## Referencias

- [../README.md](../README.md)
- [../ventas/README.md](../ventas/README.md)
- [../finanzas/README.md](../finanzas/README.md)
