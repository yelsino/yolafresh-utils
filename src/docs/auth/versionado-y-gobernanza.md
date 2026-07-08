# Versionado y Gobernanza

## Propósito

Este documento fija reglas de cambio para catálogo auth compartido.

Fuente de verdad:

- [AUTH_CATALOG_VERSION](../../domain/auth/version/auth-catalog.version.ts)
- [CatalogVersion](../../domain/auth/contracts/auth-catalog.contract.ts)

## Regla de versionado

Catálogo auth usa semver:

- `major`: cambio incompatible en permisos, grants, roles o contratos;
- `minor`: nuevos permisos, grants, metadata o roles compatibles;
- `patch`: correcciones internas o metadata sin ruptura contractual.

Versión actual vive en:

- [auth-catalog.version.ts](../../domain/auth/version/auth-catalog.version.ts)

## Proceso oficial de cambio

1. negocio define módulo, recurso y acciones;
2. RFC corta entra en `yolafresh-utils`;
3. se actualizan permisos, aliases, roles y metadata;
4. se publican tests y nueva versión;
5. backend actualiza dependencia y enforcement;
6. móvil actualiza dependencia y guards;
7. rollout coordinado.

## Gobernanza no negociable

- nuevo permiso no nace directo en backend;
- móvil no crea catálogo alterno;
- backend no mantiene enum paralelo;
- aliases no se inventan fuera de `auth`;
- todo permiso nuevo debe traer metadata;
- si rol base cambia, cambio debe vivir en catálogo central.

## Compatibilidad

Compatibilidad se preserva así:

- root export y subpath `auth` deben seguir resolviendo;
- snapshot debe cargar `catalogVersion`;
- cambios incompatibles requieren salto major;
- remoción de surface pública necesita deprecación formal, no borrado sorpresivo.

## Checklist por cambio

- permiso nuevo agregado en `AUTH_PERMISSIONS`;
- alias derivados validados;
- metadata completa;
- roles afectados actualizados;
- tests verdes;
- docs `auth` alineadas;
- `AUTH_CATALOG_VERSION` revisada.

## Referencias

- [modelo-vigente.md](./modelo-vigente.md)
- [catalogo-de-permisos.md](./catalogo-de-permisos.md)
- [roles-y-grants.md](./roles-y-grants.md)
