# Modelo Vigente de `auth`

## Propósito

`auth` es dueño del lenguaje canónico de autorización compartida de `yolafresh-utils`.

Este Domain existe para centralizar:

- permisos;
- grants y aliases;
- roles base;
- metadata de permisos;
- helpers puros de expansión y validación;
- snapshot auth offline;
- versionado de catálogo.

## Evidencia principal

- [auth/index.ts](../../domain/auth/index.ts)
- [contracts/index.ts](../../domain/auth/contracts/index.ts)
- [catalogs/permission.catalog.ts](../../domain/auth/catalogs/permission.catalog.ts)
- [catalogs/permission-alias.catalog.ts](../../domain/auth/catalogs/permission-alias.catalog.ts)
- [catalogs/role.catalog.ts](../../domain/auth/catalogs/role.catalog.ts)
- [metadata/permission-metadata.catalog.ts](../../domain/auth/metadata/permission-metadata.catalog.ts)
- [helpers/index.ts](../../domain/auth/helpers/index.ts)
- [version/auth-catalog.version.ts](../../domain/auth/version/auth-catalog.version.ts)

## Principio rector

Si pregunta es:

- qué significa permiso, grant, rol o shape auth: responde `yolafresh-utils`;
- qué tiene asignado usuario específico: responde backend IAM;
- qué puede hacer usuario offline en dispositivo: responde snapshot local derivado.

## Ownership

### `yolafresh-utils`

Sí provee:

- vocabulario auth compartido;
- catálogo maestro de permisos;
- aliases canónicos;
- roles base;
- metadata por permiso;
- contratos de snapshot y scope;
- helpers puros;
- versión de catálogo.

No provee:

- persistencia `auth_user_role`;
- persistencia `auth_scope_assignment`;
- queries a DB;
- tokens;
- middleware HTTP;
- sync runtime;
- side effects;
- adapters CouchDB, SQLite o React Native.

### Backend IAM

Backend es dueño de:

- persistencia de asignaciones;
- policies dinámicas;
- resolución autoritativa por usuario;
- emisión de tokens;
- enforcement real;
- construcción de `AuthSnapshot`.

### Cliente móvil

Cliente es dueño de:

- persistencia SQLite local;
- guards UI;
- gating visual;
- navegación derivada;
- consumo de `AuthSnapshot`.

Cliente no debe:

- redefinir catálogo;
- crear permisos locales;
- mezclar scope dentro de permiso;
- decidir seguridad final.

## Contratos vigentes

`auth` publica hoy:

- `AuthPermission`
- `AuthGrant`
- `RoleDefinition`
- `Rol`
- `SesionContexto`
- `AuthScope`
- `AuthSnapshot`
- `CatalogVersion`
- `PermissionDefinition`

## Relación con `personas`

`personas` sigue siendo dueño de:

- `Entidad`
- `IUsuario`
- contratos de cliente, personal y proveedor;
- identidad digital y relación con actores reales.

`auth` ahora es dueño de:

- semántica de autorización;
- catálogo maestro;
- shapes auth compartidos.

Lectura correcta:

- `personas` modela quién es actor;
- `auth` modela qué puede hacer y bajo qué grants.

## Surface pública oficial

Imports oficiales:

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

## Restricciones no negociables

- backend IAM no inventa catálogo paralelo;
- móvil no redefine permisos, roles ni shapes auth;
- aliases se expanden solo desde catálogo central;
- snapshot offline es derivado, no verdad canónica;
- nuevos permisos entran primero por `yolafresh-utils`.

## Referencias

- [README.md](./README.md)
- [catalogo-de-permisos.md](./catalogo-de-permisos.md)
- [roles-y-grants.md](./roles-y-grants.md)
- [snapshot-offline.md](./snapshot-offline.md)
- [helpers-puros.md](./helpers-puros.md)
- [versionado-y-gobernanza.md](./versionado-y-gobernanza.md)
