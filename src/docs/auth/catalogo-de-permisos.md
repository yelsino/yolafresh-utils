# Catálogo de Permisos

## Propósito

Este documento fija reglas del catálogo auth compartido.

Fuente de verdad:

- [permission.catalog.ts](../../domain/auth/catalogs/permission.catalog.ts)
- [permission-alias.catalog.ts](../../domain/auth/catalogs/permission-alias.catalog.ts)
- [permission-metadata.catalog.ts](../../domain/auth/metadata/permission-metadata.catalog.ts)

## Estado publicado

`yola-fresh-utils` `2.4.0` publica `AUTH_CATALOG_VERSION` `2.2.0`. Son versiones
independientes: la primera identifica el paquete y la segunda, la revisión del
catálogo auth que debe viajar en snapshots y verificaciones de compatibilidad.

## Formato canónico

Todo permiso usa convención:

- `modulo:recurso:accion`

Ejemplos vigentes:

- `ventas:cotizacion:crear`
- `ventas:pedido:aprobar`
- `ventas:pedido:editar`
- `ventas:pedido:anular`
- `ventas:venta:anular`
- `compras:compra:crear`
- `inventario:ajuste:aprobar`
- `inventario:politica:administrar`
- `inventario:merma:aprobar`
- `inventario:transferencia:recibir`
- `finanzas:cuenta_proveedor:ver`
- `finanzas:cuenta_proveedor:ajustar`
- `iam:usuario:activar`
- `sistema:admin:global`

## Cuenta proveedor

La versión de paquete `2.4.0` separa explícitamente lectura y mutación de la
cuenta proveedor:

| Permiso | Alcance | Criticidad | Sesión activa | Auditable |
| --- | --- | --- | --- | --- |
| `finanzas:cuenta_proveedor:ver` | Consultar saldo, resumen, movimientos, imputaciones y estado de operaciones | `low` | Sí | Sí |
| `finanzas:cuenta_proveedor:ajustar` | Registrar obligaciones, pagos, adelantos y notas; aplicar créditos o ejecutar reversas | `critical` | Sí | Sí |

`ver` nunca autoriza una mutación. Cualquier comando que cambie el libro oficial
debe exigir `ajustar` en el backend, aunque la interfaz haya ocultado la acción.

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
