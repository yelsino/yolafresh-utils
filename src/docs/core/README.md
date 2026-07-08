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

## Por qué existe este módulo

`core` existe para explicar marco conceptual común del paquete.

Su valor está en concentrar:

- visión general;
- arquitectura vigente;
- publicación raíz;
- ownership de contratos;
- criterios que ordenan resto de dominios.

Sin este módulo, una persona nueva vería contratos y carpetas, pero no entendería por qué sistema está organizado de esta forma.

## Cuándo entra en juego

Este módulo entra en juego cuando una persona necesita:

- entender qué es `yolafresh-utils`;
- decidir desde dónde consumir símbolos;
- ubicar dueño semántico de un contrato;
- entender límites antes de tocar un dominio específico.

## Documentos

- [vision-general-del-paquete.md](./vision-general-del-paquete.md): explicación de qué es la librería, por qué existe y qué valor aporta.
- [guia-de-onboarding.md](./guia-de-onboarding.md): recorrido recomendado para una persona nueva.
- [mapa-del-dominio.md](./mapa-del-dominio.md): vista de alto nivel de relaciones entre dominios.
- [glosario.md](./glosario.md): terminología canónica mínima para evitar ambigüedades.
- [arquitectura-vigente.md](./arquitectura-vigente.md): arquitectura actual, capas y límites.
- [contratos-compartidos.md](./contratos-compartidos.md): mapa de contratos por dominio propietario.
- [primitivas-y-publicacion.md](./primitivas-y-publicacion.md): primitivas base, eventos y publicación raíz.
- [versionado-del-paquete.md](./versionado-del-paquete.md): semver, instalación por versión y flujo de release.
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
