# Roles y Grants

## Propósito

Este documento describe catálogo base de roles y resolución de grants.

Fuente de verdad:

- [role.catalog.ts](../../domain/auth/catalogs/role.catalog.ts)
- [auth-role.contract.ts](../../domain/auth/contracts/auth-role.contract.ts)
- [expand-role-grants.ts](../../domain/auth/helpers/expand-role-grants.ts)
- [resolve-role-permissions.ts](../../domain/auth/helpers/resolve-role-permissions.ts)
- [is-system-admin-role.ts](../../domain/auth/helpers/is-system-admin-role.ts)

## Modelo

### `RoleDefinition`

Rol base define:

- `id`
- `nombre`
- `descripcion`
- `grants`
- `flags`

Regla:

- rol agrupa grants;
- consumer no lista permisos manuales fuera de catálogo central;
- bypass admin se define por `*` o `flags.isSystemAdmin`.

### `Rol`

`Rol` es shape operativo compartido para usuarios/sesión.

Incluye:

- `id`
- `nombre`
- `grants`
- `permissionsExpanded?`
- `flags?`
- `activo`
- timestamps

## Catálogo base

Roles base vigentes:

- `admin`
- `supervisor`
- `cajero`
- `ventas`
- `inventario`
- `compras`
- `finanzas`
- `contador`
- `auditor`
- `soporte-tecnico`
- `solo-lectura`
- `cliente`

`cliente` representa una cuenta digital de cliente final. No representa el
documento comercial `Cliente` ni recibe privilegios del ERP por defecto. La
tienda puede definir y proteger sus capacidades propias mediante políticas y
permisos de su aplicación; Finanzas no debe inferir acceso desde la entidad ni
desde la mera autenticación.

Fuente:

- [AUTH_BASE_ROLE_IDS](../../domain/auth/catalogs/role.catalog.ts)
- [AUTH_ROLE_DEFINITIONS](../../domain/auth/catalogs/role.catalog.ts)

## Reglas de grants

Un grant puede ser:

- permiso fino;
- alias `modulo:*`;
- alias `modulo:recurso:*`;
- `*`.

Reglas:

- grants se expanden con helpers oficiales;
- consumer no debe derivar permisos por `startsWith()`;
- rol no implica scope;
- scope se modela aparte.

## Admin global

`admin` se considera admin global si:

- `flags.isSystemAdmin === true`, o
- grants incluyen `*`.

Helper oficial:

- [isSystemAdminRole()](../../domain/auth/helpers/is-system-admin-role.ts)

## Resolución oficial

Flujo correcto:

1. obtener `roleIds`;
2. expandir grants con [expandRoleGrants()](../../domain/auth/helpers/expand-role-grants.ts);
3. expandir permisos con [resolveRolePermissions()](../../domain/auth/helpers/resolve-role-permissions.ts);
4. usar snapshot o enforcement backend para decisión final.

## Ejemplo

```ts
import {
  getRoleDefinition,
  isSystemAdminRole,
  resolveRolePermissions,
} from "yola-fresh-utils/auth";

const roleIds = ["supervisor"];
const role = getRoleDefinition("supervisor");
const permissions = resolveRolePermissions(roleIds);
const isAdmin = isSystemAdminRole(roleIds);
```

## Qué no hacer

- crear `roles.config.ts` local como catálogo maestro;
- duplicar grants por repo;
- decidir acceso final solo por nombre de rol en UI;
- meter `sucursalId` o `tenantId` dentro de string de permiso.

## Referencias

- [catalogo-de-permisos.md](./catalogo-de-permisos.md)
- [snapshot-offline.md](./snapshot-offline.md)
- [helpers-puros.md](./helpers-puros.md)
