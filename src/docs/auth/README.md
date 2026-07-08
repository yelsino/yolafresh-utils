# Auth

## Propósito

Esta carpeta concentra la documentación vigente del Domain `auth` dentro de `yolafresh-utils`.

`auth` es dueño del lenguaje canónico de autorización compartida:

- permisos;
- grants y aliases;
- roles base;
- metadata;
- helpers puros;
- snapshot auth offline;
- versionado de catálogo.

## Principio rector

Si pregunta es:

- qué significa permiso, grant, rol o snapshot auth: responde `yolafresh-utils`;
- qué tiene asignado usuario X: responde backend IAM;
- qué puede hacer usuario offline en dispositivo: responde snapshot derivado local.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): ownership, fronteras y contratos vigentes.
- [catalogo-de-permisos.md](./catalogo-de-permisos.md): convención, catálogo, aliases y metadata.
- [roles-y-grants.md](./roles-y-grants.md): roles base y resolución de grants.
- [snapshot-offline.md](./snapshot-offline.md): contrato compartido de snapshot auth.
- [helpers-puros.md](./helpers-puros.md): helpers oficiales para expansión y validación.
- [versionado-y-gobernanza.md](./versionado-y-gobernanza.md): semver y proceso de cambio.
- [rfcs/rfc-ssot-auth-shared.md](./rfcs/rfc-ssot-auth-shared.md): RFC implementado del dominio.

## Imports oficiales

```ts
import {
  AUTH_PERMISSIONS,
  AUTH_ROLE_DEFINITIONS,
  PERMISSION_METADATA,
  expandGrants,
  resolveRolePermissions,
  AUTH_CATALOG_VERSION,
} from "yola-fresh-utils";
```

o:

```ts
import {
  AUTH_PERMISSIONS,
  AUTH_ROLE_DEFINITIONS,
  PERMISSION_METADATA,
  expandGrants,
  resolveRolePermissions,
  AUTH_CATALOG_VERSION,
} from "yola-fresh-utils/auth";
```

## Regla no negociable

Backend IAM y cliente móvil no deben inventar catálogo paralelo.

Todo vocabulario auth compartido debe salir de `yola-fresh-utils`.
