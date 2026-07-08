# Snapshot Offline

## Propósito

`AuthSnapshot` es contrato compartido para modo offline-first.

Fuente de verdad:

- [auth-snapshot.contract.ts](../../domain/auth/contracts/auth-snapshot.contract.ts)
- [auth-scope.contract.ts](../../domain/auth/contracts/auth-scope.contract.ts)

## Regla principal

- backend produce snapshot;
- móvil persiste snapshot en SQLite;
- snapshot es derivado;
- snapshot no reemplaza catálogo maestro;
- snapshot puede caducar y resincronizarse.

## Contratos

### `AuthScope`

Scope representa contexto de aplicación separado del permiso:

- `tenant`
- `sucursal`
- `almacen`
- `caja`
- `organizacion`

Contrato:

```ts
export type AuthScope = {
  scopeType: "tenant" | "sucursal" | "almacen" | "caja" | "organizacion";
  scopeIds: string[];
};
```

### `AuthSnapshot`

Snapshot compartido incluye:

- usuario;
- tenant;
- roles;
- grants;
- permisos expandidos;
- scopes resueltos;
- versión de catálogo;
- versión de policy;
- sesión y dispositivo;
- estado activo;
- timestamp de sync.

Contrato vigente:

```ts
export type AuthSnapshot = {
  userId: string;
  username: string;
  tenantId: string;
  roleIds: RoleId[];
  roleNames: string[];
  isSystemAdmin: boolean;
  grants: AuthGrant[];
  permissionsExpanded: AuthPermission[];
  scopes: AuthSnapshotScopes;
  catalogVersion: string;
  policyVersion: string;
  sessionId: string;
  deviceId: string;
  activo: boolean;
  lastAuthSyncAt: string;
  authSnapshotVersion: number;
};
```

## Responsabilidades

### Backend IAM

- resuelve grants por usuario;
- expande permisos;
- resuelve scopes;
- emite snapshot;
- valida requests con autoridad final.

### Cliente móvil

- consume snapshot;
- guarda localmente en SQLite;
- usa snapshot para guards UI y menús;
- no redefine catálogo maestro.

## Qué no hacer

- guardar roles/permisos locales inventados;
- meter scope en string de permiso;
- tratar snapshot como autoridad final;
- sincronizar catálogo alterno desde móvil.

## Uso correcto

```ts
import type { AuthSnapshot } from "yola-fresh-utils/auth";

function puedeVerReporte(snapshot: AuthSnapshot): boolean {
  return snapshot.permissionsExpanded.includes("reportes:finanzas:ver");
}
```

## Referencias

- [modelo-vigente.md](./modelo-vigente.md)
- [roles-y-grants.md](./roles-y-grants.md)
- [versionado-y-gobernanza.md](./versionado-y-gobernanza.md)
