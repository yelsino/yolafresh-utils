# Personas

## Propósito

Este directorio agrupa documentación vigente del Domain `personas`.

`personas` es dueño de:

- actores reales del negocio;
- identidad digital de usuario;
- relación entre usuario y entidades;
- direcciones;
- contratos de cliente, personal y proveedor.

## Evidencia principal

- [persons.contract.ts](../../domain/personas/contracts/persons.contract.ts)
- [entidad.contract.ts](../../domain/personas/contracts/entidad.contract.ts)
- [usuario.contract.ts](../../domain/personas/contracts/usuario.contract.ts)
- [direccion.contract.ts](../../domain/personas/contracts/direccion.contract.ts)
- [Usuario.ts](../../domain/personas/entities/Usuario.ts)

## Frontera con `auth`

`personas` ya no es dueño del catálogo maestro de autorización.

`auth` es dueño de:

- permisos;
- grants;
- roles base;
- metadata auth;
- snapshots y scopes;
- helpers puros de validación y expansión.

`personas` consume shapes auth compartidos para `IUsuario` y `Usuario`, pero no define vocabulario auth canónico.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): actores, responsabilidades y relaciones principales.
- [autorizacion-y-sesion.md](./autorizacion-y-sesion.md): frontera actual entre identidad en `personas` y autorización en `auth`.

## Terminología canónica

- `Entidad`
- `Cliente`
- `Personal`
- `Proveedor`
- `IUsuario`
- `Usuario`
- `Direccion`
- `DireccionRelacion`

## Referencias

- [../auth/README.md](../auth/README.md)
- [../README.md](../README.md)
- [../compras/README.md](../compras/README.md)
- [../finanzas/cuenta-cliente/modelo-vigente.md](../finanzas/cuenta-cliente/modelo-vigente.md)
