# Recursos Expuestos de RBAC para Apps Consumidoras

> Documento histórico.
> Estado vigente ya no debe leerse desde este archivo.
> Para implementación actual, leer primero [auth/README.md](./auth/README.md), [auth/modelo-vigente.md](./auth/modelo-vigente.md), [auth/catalogo-de-permisos.md](./auth/catalogo-de-permisos.md) y [personas/autorizacion-y-sesion.md](./personas/autorizacion-y-sesion.md).

## Lectura correcta hoy

- catálogo maestro de permisos y roles vive en `auth`;
- backend IAM no define catálogo paralelo;
- cliente móvil consume snapshot derivado para offline-first;
- `personas` conserva identidad digital y entidades, no ownership canónico del vocabulario auth.

## Referencias vigentes

- [auth/README.md](./auth/README.md)
- [auth/modelo-vigente.md](./auth/modelo-vigente.md)
- [auth/catalogo-de-permisos.md](./auth/catalogo-de-permisos.md)
- [auth/roles-y-grants.md](./auth/roles-y-grants.md)
- [auth/snapshot-offline.md](./auth/snapshot-offline.md)
- [personas/autorizacion-y-sesion.md](./personas/autorizacion-y-sesion.md)
