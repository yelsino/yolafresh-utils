# Dominio de Personas

> Documento histórico.
> Estado vigente vive en [personas/README.md](./personas/README.md), [personas/modelo-vigente.md](./personas/modelo-vigente.md), [personas/autorizacion-y-sesion.md](./personas/autorizacion-y-sesion.md) y [auth/README.md](./auth/README.md).
> Si este archivo contradice documentación modular vigente, prevalece documentación modular vigente.

## Lectura correcta hoy

- `personas` modela actores reales e identidad digital;
- `auth` modela catálogo maestro de autorización compartida;
- `IUsuario` y `Usuario` consumen shapes auth, pero no definen catálogo auth;
- persistencia, sync y enforcement siguen fuera de `yolafresh-utils`.

## Referencias vigentes

- [personas/README.md](./personas/README.md)
- [personas/modelo-vigente.md](./personas/modelo-vigente.md)
- [personas/autorizacion-y-sesion.md](./personas/autorizacion-y-sesion.md)
- [auth/README.md](./auth/README.md)
- [auth/modelo-vigente.md](./auth/modelo-vigente.md)
