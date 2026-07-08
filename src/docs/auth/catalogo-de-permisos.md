# Catálogo de Permisos

## Propósito

Este documento fija reglas del catálogo auth compartido.

Fuente de verdad:

- [permission.catalog.ts](../../domain/auth/catalogs/permission.catalog.ts)
- [permission-alias.catalog.ts](../../domain/auth/catalogs/permission-alias.catalog.ts)
- [permission-metadata.catalog.ts](../../domain/auth/metadata/permission-metadata.catalog.ts)

## Formato canónico

Todo permiso usa convención:

- `modulo:recurso:accion`

Ejemplos vigentes:

- `ventas:cotizacion:crear`
- `ventas:pedido:aprobar`
- `ventas:venta:anular`
- `compras:compra:crear`
- `inventario:ajuste:aprobar`
- `iam:usuario:activar`
- `sistema:admin:global`

## Reglas de modelado

- permiso describe capacidad;
- permiso no describe instancia concreta;
- permiso no codifica scope;
- permiso debe ser estable y semántico;
- metadata debe existir para todo permiso.

## Prohibido

- `cliente:123:editar`
- `ventas:sucursal-lima:ver`
- `ventas:total`
- aliases inventados fuera de `auth`

## Aliases canónicos

Aliases existen para simplificar grants y roles, no para reemplazar permisos finos.

Patrones válidos:

- `modulo:*`
- `modulo:recurso:*`
- `*`

Regla:

- expansión de alias ocurre solo desde [permission-alias.catalog.ts](../../domain/auth/catalogs/permission-alias.catalog.ts);
- consumers no deben expandir permisos con heurísticas locales.

## Metadata obligatoria

Cada permiso publica:

- `id`
- `modulo`
- `recurso`
- `accion`
- `criticidad`
- `requiresActiveSession`
- `auditable`
- `uiVisible`

Metadata vive en:

- [PERMISSION_METADATA](../../domain/auth/metadata/permission-metadata.catalog.ts)

## Uso correcto

Correcto:

```ts
import { PERMISSION_METADATA, type AuthPermission } from "yola-fresh-utils/auth";

function requiereConfirmacion(permission: AuthPermission): boolean {
  return PERMISSION_METADATA[permission].criticidad === "critical";
}
```

Incorrecto:

```ts
function esPermisoVentas(permission: string): boolean {
  return permission.startsWith("ventas:");
}
```

## Módulos cubiertos hoy

- `ventas`
- `compras`
- `inventario`
- `finanzas`
- `caja`
- `iam`
- `reportes`
- `configuracion`
- `auditoria`
- `sistema`

## Gobernanza de cambio

Cuando nace permiso nuevo:

1. negocio define módulo, recurso y acciones;
2. cambio entra primero en `yolafresh-utils`;
3. se actualizan aliases, metadata y roles si aplica;
4. backend y móvil consumen nueva versión;
5. nadie crea enum paralelo local.

## Referencias

- [modelo-vigente.md](./modelo-vigente.md)
- [roles-y-grants.md](./roles-y-grants.md)
- [helpers-puros.md](./helpers-puros.md)
