# Documentación de `yolafresh-utils`

## Propósito

Esta carpeta concentra documentación oficial del paquete después de la migración completa a estructura por dominios.

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

## Criterio de verdad

La evidencia primaria actual vive en:

- `src/index.ts`
- `src/domain/shared/base/`
- `src/domain/shared/kernel/`
- `src/domain/shared/utils/`
- `src/domain/shared/value-objects/`
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

## Nota

`CuentaCliente` ya no se documenta como dominio separado. Su lenguaje queda absorbido dentro de `finanzas`.
