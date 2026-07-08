# Helpers Puros

## Propósito

Estos helpers son API oficial para expansión y validación auth.

Fuente de verdad:

- [helpers/index.ts](../../domain/auth/helpers/index.ts)

## Helpers oficiales

### `expandGrant(grant)`

Expande grant único a permisos finos.

Fuente:

- [expand-grant.ts](../../domain/auth/helpers/expand-grant.ts)

### `expandGrants(grants)`

Expande múltiples grants, deduplica y mantiene orden de catálogo.

Fuente:

- [expand-grants.ts](../../domain/auth/helpers/expand-grants.ts)

### `getRoleDefinition(roleId)`

Devuelve definición base de rol o `undefined`.

Fuente:

- [get-role-definition.ts](../../domain/auth/helpers/get-role-definition.ts)

### `expandRoleGrants(roleIds)`

Resuelve grants de varios roles base.

Fuente:

- [expand-role-grants.ts](../../domain/auth/helpers/expand-role-grants.ts)

### `resolveRolePermissions(roleIds)`

Convierte roles a permisos finos expandidos.

Fuente:

- [resolve-role-permissions.ts](../../domain/auth/helpers/resolve-role-permissions.ts)

### `isSystemAdminRole(roleIds)`

Detecta admin global por flag o wildcard total.

Fuente:

- [is-system-admin-role.ts](../../domain/auth/helpers/is-system-admin-role.ts)

### `isValidPermission(permission)`

Valida si string pertenece al catálogo canónico.

Fuente:

- [is-valid-permission.ts](../../domain/auth/helpers/is-valid-permission.ts)

### `isValidGrant(grant)`

Valida si string pertenece a permisos o aliases canónicos.

Fuente:

- [is-valid-grant.ts](../../domain/auth/helpers/is-valid-grant.ts)

### `getCatalogVersion()`

Devuelve versión vigente del catálogo auth.

Fuente:

- [get-catalog-version.ts](../../domain/auth/helpers/get-catalog-version.ts)

## Uso recomendado

```ts
import {
  expandGrants,
  getCatalogVersion,
  isValidGrant,
  resolveRolePermissions,
} from "yola-fresh-utils/auth";

const grants = ["ventas:*", "iam:usuario:ver"] as const;

const validos = grants.every((grant) => isValidGrant(grant));
const permisos = expandGrants(validos ? [...grants] : []);
const permisosSupervisor = resolveRolePermissions(["supervisor"]);
const version = getCatalogVersion();
```

## Reglas

- helpers son puros;
- no hacen IO;
- no leen DB;
- no dependen de framework;
- consumers deben reutilizarlos, no rehacer lógica local.

## Qué no hacer

- copiar expansión de aliases por repo;
- meter fallback silencioso a grants inválidos;
- usar catálogo parcial local para acelerar UI.

## Referencias

- [catalogo-de-permisos.md](./catalogo-de-permisos.md)
- [roles-y-grants.md](./roles-y-grants.md)
