# Migración `v1 -> v2`

## Propósito

Este documento guía migración desde línea legacy `v1.0.2` hacia línea auth compartida `v2.x`.

## Cambio central

En `v1`, vocabulario RBAC compartido vivía principalmente en `personas`:

- `Permisos`
- `RolesPredefinidos`
- `CONFIGURACIONES_ROLES`
- `CARGOS_ROLES_SUGERIDOS`
- `PERMISOS_CRITICOS`

En `v2`, ownership canónico de autorización pasa a `auth`:

- `AuthPermission`
- `AuthGrant`
- `RoleDefinition`
- `AuthSnapshot`
- `PERMISSION_METADATA`
- `AUTH_ROLE_DEFINITIONS`
- helpers oficiales

## Qué mantiene `v1`

`v1.0.2` sigue existiendo para consumers que aún no migran:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.2"
  }
}
```

## Qué usar en `v2`

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v2.1.0"
  }
}
```

## Migración por backend

Backend debe:

- dejar contratos auth transicionales locales;
- consumir `AuthSnapshot` oficial;
- resolver grants con helpers oficiales;
- dejar de inventar aliases fuera de `yolafresh-utils`;
- usar `AUTH_CATALOG_VERSION` para detectar drift.

## Migración por cliente móvil

Cliente debe:

- persistir `AuthSnapshot` oficial en SQLite;
- dejar enums y shapes auth locales;
- usar `permissionsExpanded` y `grants` compartidos en guards UI;
- fijar dependencia por tag GitHub, no por rama flotante.

## Mapeo conceptual

- `Permisos` legacy -> `AuthPermission`
- `RolesPredefinidos` legacy -> `AUTH_ROLE_DEFINITIONS`
- composición local de permisos -> `expandGrant()`, `expandGrants()`, `resolveRolePermissions()`
- resolución de admin local -> `isSystemAdminRole()`
- catálogo interno paralelo -> prohibido

## Checklist de migración

- cambiar dependencia a `#v2.1.0`
- reemplazar imports legacy por imports `auth`
- eliminar helpers locales de expansión
- alinear snapshot backend con contrato oficial
- persistir snapshot sin redefinir tipos
- validar guards UI con catálogo oficial

## Regla no negociable

No usar:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils"
  }
}
```

Eso jala `main` flotante y rompe control de compatibilidad.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [snapshot-offline.md](./snapshot-offline.md)
- [versionado-y-gobernanza.md](./versionado-y-gobernanza.md)
- [../core/versionado-del-paquete.md](../core/versionado-del-paquete.md)
