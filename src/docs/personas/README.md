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

## Por qué existe este Domain

`personas` existe para separar actores reales del negocio de cuentas digitales y reglas de acceso.

Su valor está en distinguir:

- cliente, personal y proveedor como actores reales;
- usuario como identidad digital;
- rol y permiso como vocabulario de autorización;
- dirección como dato reusable vinculado a múltiples entidades.

Esa separación evita confundir relación comercial, identidad organizacional y acceso al sistema.

## Cuándo entra en juego

Este Domain entra en juego cuando un consumer necesita:

- modelar clientes, proveedores o personal;
- asociar usuario a entidades reales;
- resolver roles, permisos y contexto de sesión;
- vincular direcciones a actores o estructuras del negocio.

## Qué problema evita

Evita errores conceptuales como:

- usar `cargo` como sustituto de `rol`;
- usar usuario digital como reemplazo de actor real;
- mezclar autorización con datos comerciales del cliente o proveedor.

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
- `CONFIGURACIONES_ROLES`
- `CARGOS_ROLES_SUGERIDOS`
- `PERMISOS_CRITICOS`
- `Direccion`
- `DireccionRelacion`

## Referencias

- [../README.md](../README.md)
- [../compras/README.md](../compras/README.md)
- [../finanzas/cuenta-cliente/modelo-vigente.md](../finanzas/cuenta-cliente/modelo-vigente.md)
