# Personas

## Propósito

Este directorio agrupa la documentación vigente del Domain de personas y acceso en `yolafresh-utils`.

La evidencia principal vive en:

- [persons.contract.ts](../../domain/personas/contracts/persons.contract.ts)
- [entidad.contract.ts](../../domain/personas/contracts/entidad.contract.ts)
- [usuario.contract.ts](../../domain/personas/contracts/usuario.contract.ts)
- [roles.contract.ts](../../domain/personas/contracts/roles.contract.ts)
- [permisos.contract.ts](../../domain/personas/contracts/permisos.contract.ts)
- [direccion.contract.ts](../../domain/personas/contracts/direccion.contract.ts)
- [Usuario.ts](../../domain/personas/entities/Usuario.ts)

## Alcance

Este Domain documenta:

- actores reales del negocio;
- cuentas digitales de usuario;
- roles, permisos y sesión;
- relación entre identidad organizacional y autorización;
- direcciones vinculadas a entidades.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): actores, responsabilidades y relaciones principales.
- [autorizacion-y-sesion.md](./autorizacion-y-sesion.md): RBAC, sesión y reglas de acceso observadas.

## Terminología canónica

- `Entidad`
- `Cliente`
- `Personal`
- `Proveedor`
- `IUsuario`
- `Usuario`
- `Rol`
- `SesionContexto`
- `Permisos`
- `RolesPredefinidos`
- `Direccion`
- `DireccionRelacion`

## Referencias

- [../README.md](../README.md)
- [../compras/README.md](../compras/README.md)
- [../finanzas/cuenta-cliente-modelo-vigente.md](../finanzas/cuenta-cliente-modelo-vigente.md)
