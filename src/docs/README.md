# Documentación de `yolafresh-utils`

## Propósito

Esta carpeta concentra documentación oficial del paquete después de la migración completa a estructura por dominios.

Versión de referencia vigente: `2.0.0` (`v2.0.0`). Las migraciones y RFCs pueden
mencionar versiones anteriores, pero no sustituyen el modelo vigente descrito en
los documentos marcados como actuales.

La lectura recomendada va de:

- core;
- dominios activos;
- documentos históricos solo como contexto.

## Documentación oficial

### Core

- [core/README.md](./core/README.md): índice del núcleo vigente.
- [core/vision-general-del-paquete.md](./core/vision-general-del-paquete.md): qué es la librería, por qué existe y qué problema resuelve.
- [core/guia-de-onboarding.md](./core/guia-de-onboarding.md): recorrido recomendado para personas nuevas.
- [core/mapa-del-dominio.md](./core/mapa-del-dominio.md): mapa de módulos y flujos interdominio.
- [core/glosario.md](./core/glosario.md): vocabulario canónico mínimo del negocio.
- [core/arquitectura-vigente.md](./core/arquitectura-vigente.md): arquitectura actual, límites y surface pública.
- [core/contratos-compartidos.md](./core/contratos-compartidos.md): mapa de ownership contractual por dominio.
- [core/primitivas-y-publicacion.md](./core/primitivas-y-publicacion.md): primitivas base, eventos y root mínimo.
- [core/versionado-del-paquete.md](./core/versionado-del-paquete.md): semver, instalación por versión y flujo de release.
- [core/implementacion-para-clientes.md](./core/implementacion-para-clientes.md): playbook operativo para repos consumidores.
- [core/rfc-evolucion-estructura-libreria.md](./core/rfc-evolucion-estructura-libreria.md): RFC cerrado con estructura implementada.

### Ventas

- [ventas/README.md](./ventas/README.md)
- [ventas/modelo-vigente.md](./ventas/modelo-vigente.md)
- [ventas/relaciones-interdominio.md](./ventas/relaciones-interdominio.md)
- [ventas/guia-de-consumo.md](./ventas/guia-de-consumo.md)
- [ventas/migracion-v1-0-4-a-v1-0-5.md](./ventas/migracion-v1-0-4-a-v1-0-5.md)
- [ventas/rfc-pos-manual-override-y-snapshot-no-bloqueante.md](./ventas/rfc-pos-manual-override-y-snapshot-no-bloqueante.md)

### Pedido

- [pedido/README.md](./pedido/README.md)
- [pedido/modelo-vigente.md](./pedido/modelo-vigente.md)
- [pedido/relaciones-interdominio.md](./pedido/relaciones-interdominio.md)
- [pedido/guia-de-consumo.md](./pedido/guia-de-consumo.md)
- [pedido/migracion-v1-0-7-a-v1-0-8.md](./pedido/migracion-v1-0-7-a-v1-0-8.md)

### Finanzas

- [finanzas/README.md](./finanzas/README.md)
- [finanzas/modelo-vigente.md](./finanzas/modelo-vigente.md)
- [finanzas/cuenta-cliente/README.md](./finanzas/cuenta-cliente/README.md)
- [finanzas/cuenta-cliente/modelo-vigente.md](./finanzas/cuenta-cliente/modelo-vigente.md)
- [finanzas/cuenta-cliente/operacion-y-auditoria.md](./finanzas/cuenta-cliente/operacion-y-auditoria.md)
- [finanzas/cuenta-cliente/casos-de-uso.md](./finanzas/cuenta-cliente/casos-de-uso.md)
- [finanzas/cuenta-cliente/rfcs/erfc-implementacion-cuenta-cliente.md](./finanzas/cuenta-cliente/rfcs/erfc-implementacion-cuenta-cliente.md)
- [finanzas/cuenta-cliente/rfcs/rfc-reestructuracion-cuenta-cliente-opcion-a.md](./finanzas/cuenta-cliente/rfcs/rfc-reestructuracion-cuenta-cliente-opcion-a.md)
- [finanzas/recurrencias/README.md](./finanzas/recurrencias/README.md)
- [finanzas/recurrencias/backend.md](./finanzas/recurrencias/backend.md)
- [finanzas/recurrencias/frontend.md](./finanzas/recurrencias/frontend.md)

### Compras

- [compras/README.md](./compras/README.md)
- [compras/modelo-vigente.md](./compras/modelo-vigente.md)

### Inventario

- [inventario/README.md](./inventario/README.md)
- [inventario/modelo-vigente.md](./inventario/modelo-vigente.md)

### Tesoreria

- [tesoreria/README.md](./tesoreria/README.md)
- [tesoreria/modelo-vigente.md](./tesoreria/modelo-vigente.md)

### Auth

- [auth/README.md](./auth/README.md)
- [auth/modelo-vigente.md](./auth/modelo-vigente.md)
- [auth/catalogo-de-permisos.md](./auth/catalogo-de-permisos.md)
- [auth/roles-y-grants.md](./auth/roles-y-grants.md)
- [auth/snapshot-offline.md](./auth/snapshot-offline.md)
- [auth/helpers-puros.md](./auth/helpers-puros.md)
- [auth/migracion-v1-0-2-a-v1-0-3.md](./auth/migracion-v1-0-2-a-v1-0-3.md)
- [auth/versionado-y-gobernanza.md](./auth/versionado-y-gobernanza.md)
- [auth/rfcs/rfc-ssot-auth-shared.md](./auth/rfcs/rfc-ssot-auth-shared.md)

### Personas

- [personas/README.md](./personas/README.md)
- [personas/modelo-vigente.md](./personas/modelo-vigente.md)
- [personas/autorizacion-y-sesion.md](./personas/autorizacion-y-sesion.md)

### Contabilidad

- [contabilidad/README.md](./contabilidad/README.md)
- [contabilidad/modelo-vigente.md](./contabilidad/modelo-vigente.md)

### Restaurante (propuesta de evolución)

- [restaurant/README.md](./restaurant/README.md): índice maestro del análisis gastronómico.
- [restaurant/01-diagnostico/estado-actual-y-brechas.md](./restaurant/01-diagnostico/estado-actual-y-brechas.md): diagnóstico del producto móvil y brechas.
- [restaurant/02-investigacion/patrones-profesionales.md](./restaurant/02-investigacion/patrones-profesionales.md): investigación oficial y fuentes.
- [restaurant/03-dominio/lenguaje-y-contextos.md](./restaurant/03-dominio/lenguaje-y-contextos.md): lenguaje ubicuo y mapa de contextos.
- [restaurant/07-plan/fases-de-implementacion.md](./restaurant/07-plan/fases-de-implementacion.md): secuencia recomendada de ejecución.

Este árbol es una propuesta y no amplía por sí solo la API pública de `2.0.0`.

## Criterio de verdad

La evidencia primaria actual vive en:

- `src/index.ts`
- `src/domain/shared/base/`
- `src/domain/shared/kernel/`
- `src/domain/shared/utils/`
- `src/domain/shared/value-objects/`
- `src/domain/pedido/`
- `src/domain/ventas/`
- `src/domain/compras/`
- `src/domain/inventario/`
- `src/domain/tesoreria/`
- `src/domain/finanzas/`
- `src/domain/auth/`
- `src/domain/personas/`
- `src/domain/contabilidad/`

## Documentos históricos

Los siguientes archivos pueden conservar valor contextual, pero no son fuente primaria del modelo vigente:

- [inventario-tecnico-yolafresh-utils.md](./inventario-tecnico-yolafresh-utils.md)
- [types.md](./types.md)
- [interface-extension-pattern.md](./interface-extension-pattern.md)
- [personas.md](./personas.md)
- [finanzas/recurrencias/historico/recurrentes.md](./finanzas/recurrencias/historico/recurrentes.md)
- [roles y cargos/rbac-implementacion-final.md](./roles%20y%20cargos/rbac-implementacion-final.md)
- [roles y cargos/roles-cargos-permisos-yolafresh-limpio.md](./roles%20y%20cargos/roles-cargos-permisos-yolafresh-limpio.md)
- [rbac-frontend-implementation.md](./rbac-frontend-implementation.md)
- [notificaciones-implementation-plan.md](./notificaciones-implementation-plan.md)
- [tarjetas-virtuales-consumo.md](./tarjetas-virtuales-consumo.md)

Nunca usar documentos históricos para redefinir semántica vigente de contratos activos cuando exista documentación oficial más reciente dentro de `core/` o de cada Domain.

Los documentos Markdown antiguos que estaban en la raíz del repositorio fueron
retirados de la superficie de lectura porque describían APIs eliminadas (`ShoppingCart`,
`UsuarioManager`, `SesionManager` y `PermisoValidator`). El historial Git conserva
esas versiones para consulta arqueológica; no deben copiarse a consumidores nuevos.

## RFCs operativos recientes

- [ventas/rfc-pos-manual-override-y-snapshot-no-bloqueante.md](./ventas/rfc-pos-manual-override-y-snapshot-no-bloqueante.md)
- [ventas/rfc-backend-despacho-voucher-credito-por-dependencias.md](./ventas/rfc-backend-despacho-voucher-credito-por-dependencias.md)

## Nota

`CuentaCliente` ya no se documenta como dominio separado. Su lenguaje queda absorbido dentro de `finanzas`.
