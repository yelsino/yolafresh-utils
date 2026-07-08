# RFC: SSOT Auth Compartido en `yolafresh-utils`

## Estado

Implementado.

## Propósito

Formalizar que `yolafresh-utils` es SSOT de contratos auth compartidos entre backend IAM, cliente móvil y futuros consumers.

## Decisión

`yolafresh-utils` es dueño de:

- contratos auth compartidos;
- catálogo canónico de permisos;
- catálogo canónico de aliases y wildcards;
- catálogo canónico de roles base;
- metadata de permisos;
- helpers puros;
- snapshot auth compartido;
- versionado de catálogo.

Backend IAM es dueño de:

- persistencia de asignaciones;
- scopes persistidos;
- policies dinámicas;
- resolución autoritativa por usuario;
- tokens;
- enforcement real.

Cliente móvil es dueño de:

- persistencia SQLite local;
- guards UI;
- menús y gating visual;
- consumo de snapshot derivado;
- operación offline-first.

## Principio rector

Si pregunta es:

- qué significa permiso, rol, grant o contrato: responde `yolafresh-utils`;
- qué tiene asignado usuario `X`: responde backend IAM;
- qué puede hacer usuario offline en dispositivo: responde snapshot local derivado.

## Alcance implementado

- `src/domain/auth/contracts/*`
- `src/domain/auth/catalogs/*`
- `src/domain/auth/metadata/*`
- `src/domain/auth/helpers/*`
- `src/domain/auth/version/*`
- exports públicos root y subpath `auth`
- documentación `src/docs/auth/*`
- tests de integridad y surface pública

## Reglas de modelado

- permiso usa formato `modulo:recurso:accion`;
- grants aceptan permisos finos y aliases canónicos;
- aliases se expanden solo desde catálogo central;
- rol base referencia grants canónicos;
- metadata es obligatoria por permiso;
- snapshot offline es derivado;
- scope viaja separado de permiso.

## Qué queda fuera

- repositorios;
- adapters CouchDB, SQLite o HTTP;
- Zustand, React hooks o UI;
- JWT;
- queries a DB;
- sync runtime;
- side effects.

## Beneficios esperados

- evitar drift entre backend y móvil;
- evitar catálogos duplicados;
- endurecer consistencia de seguridad;
- facilitar crecimiento por módulos;
- mantener offline-first limpio.

## Criterios de aceptación

- catálogo auth único vive en `auth`;
- backend no redefine catálogo;
- cliente no redefine catálogo;
- `admin` se resuelve por `*` o `isSystemAdmin`;
- snapshot offline usa contrato compartido;
- metadata existe para cada permiso;
- expansión de aliases está centralizada y testeada.

## Referencias

- [README.md](../README.md)
- [modelo-vigente.md](../modelo-vigente.md)
- [catalogo-de-permisos.md](../catalogo-de-permisos.md)
- [roles-y-grants.md](../roles-y-grants.md)
- [snapshot-offline.md](../snapshot-offline.md)
