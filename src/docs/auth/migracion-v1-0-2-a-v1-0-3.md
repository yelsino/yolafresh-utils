# Migración `v1.0.2 -> v1.0.3`

## Propósito

Este documento guía migración desde `v1.0.2` hacia `v1.0.3` dentro de misma línea `v1.x`.

## Cambio central

`v1.0.3` mantiene línea `v1`, pero completa paquete con dominio `auth` compartido:

- `AuthPermission`
- `AuthGrant`
- `RoleDefinition`
- `AuthSnapshot`
- `PERMISSION_METADATA`
- `AUTH_ROLE_DEFINITIONS`
- helpers oficiales

No se abre nueva major. Cambio se publica como siguiente versión secuencial de línea `v1`.

## Qué usar ahora

Dependencia recomendada:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.3"
  }
}
```

## Cuándo seguir en `v1.0.2`

Solo si proyecto necesita congelarse exactamente en estado previo.

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.2"
  }
}
```

## Migración por backend

Backend debe:

- mover consumo auth hacia exports oficiales de `auth`;
- dejar contratos transicionales locales;
- consumir `AuthSnapshot` oficial;
- resolver grants con helpers oficiales;
- usar `AUTH_CATALOG_VERSION` para detectar drift.

## Migración por cliente móvil

Cliente debe:

- persistir `AuthSnapshot` oficial en SQLite;
- dejar enums y shapes auth locales;
- usar `permissionsExpanded` y `grants` compartidos en guards UI;
- fijar dependencia por tag GitHub `#v1.0.3`.

## Checklist

- cambiar dependencia a `#v1.0.3`
- reemplazar imports legacy por imports `auth` donde aplique
- eliminar helpers locales de expansión
- alinear snapshot backend con contrato oficial
- persistir snapshot sin redefinir tipos
- validar guards UI con catálogo oficial

## Regla no negociable

No usar rama flotante:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils"
  }
}
```

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [snapshot-offline.md](./snapshot-offline.md)
- [versionado-y-gobernanza.md](./versionado-y-gobernanza.md)
- [../core/versionado-del-paquete.md](../core/versionado-del-paquete.md)
