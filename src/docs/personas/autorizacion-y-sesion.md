# Autorizacion y Sesion

## Propósito

Este documento aclara frontera vigente entre `personas` y `auth`.

Lectura correcta:

- `personas` modela identidad digital y actores reales;
- `auth` modela permisos, grants, roles base, scopes y snapshot auth;
- `IUsuario` y `Usuario` consumen shapes auth compartidos, pero no son dueños del catálogo maestro.

## Evidencia principal

- [usuario.contract.ts](../../domain/personas/contracts/usuario.contract.ts)
- [Usuario.ts](../../domain/personas/entities/Usuario.ts)
- [auth-role.contract.ts](../../domain/auth/contracts/auth-role.contract.ts)
- [auth-snapshot.contract.ts](../../domain/auth/contracts/auth-snapshot.contract.ts)
- [role.catalog.ts](../../domain/auth/catalogs/role.catalog.ts)
- [permission.catalog.ts](../../domain/auth/catalogs/permission.catalog.ts)

## Modelo conceptual vigente

Flujo lógico:

`Entidad -> IUsuario -> Rol -> AuthGrant -> AuthPermission`

El actor real del negocio sigue modelado aparte como `Entidad`.

## Qué vive en `personas`

- `Entidad`
- `Cliente`
- `Personal`
- `Proveedor`
- `IUsuario`
- `Usuario`
- direcciones

## Qué vive en `auth`

- `AuthPermission`
- `AuthGrant`
- `RoleDefinition`
- `Rol`
- `SesionContexto`
- `AuthScope`
- `AuthSnapshot`
- `PERMISSION_METADATA`

## Reglas de negocio vigentes

- autorización se resuelve por permisos, no por cargo laboral;
- un usuario puede tener múltiples roles;
- un usuario puede estar asociado a múltiples entidades;
- sesión puede operar con roles y scopes resueltos;
- admin global se detecta por wildcard total o flag explícito;
- estado operacional de `Usuario` sigue exigiendo activo, no bloqueado y email verificado.

## Separaciones obligatorias

### Cargo != Rol

- `cargo` describe función organizacional;
- `rol` describe acceso del sistema.

### Entidad != Usuario

- `Entidad` representa actor real;
- `IUsuario` representa cuenta digital.

### Scope != Permiso

- permiso describe capacidad;
- scope describe contexto;
- no se mezclan en misma string.

## Contratos legacy

Archivos RBAC viejos dentro de `personas/contracts/` deben tratarse como legado no canónico.

No deben usarse como fuente maestra para:

- catálogo de permisos;
- catálogo de roles base;
- expansión de aliases;
- snapshot auth compartido.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [../auth/README.md](../auth/README.md)
- [../auth/modelo-vigente.md](../auth/modelo-vigente.md)
- [../core/contratos-compartidos.md](../core/contratos-compartidos.md)
