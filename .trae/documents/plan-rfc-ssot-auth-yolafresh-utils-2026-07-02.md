# Plan: SSOT Auth en `yola-fresh-utils`

## Resumen

Implementar un dominio nuevo `auth` dentro de `yola-fresh-utils` para convertir el paquete en SSOT de contratos, catálogos, metadata y helpers puros de autorización compartida.

El cambio será de reemplazo directo respecto al RBAC canónico actual en `personas`.

Decisiones cerradas:

- crear `src/domain/auth`;
- exportar auth por raíz y por subpath `yola-fresh-utils/auth`;
- alcance completo en primera entrega: contratos, catálogos, metadata, helpers, exports, docs y tests;
- no mantener catálogo maestro paralelo en `personas`;
- backend y móvil deben consumir contratos y catálogos desde `yola-fresh-utils`.

## Estado actual analizado

### Dominio vigente

- hoy RBAC canónico vive en `src/domain/personas/contracts/`;
- `Permisos` está en `src/domain/personas/contracts/permisos.contract.ts` y usa formato viejo `recurso:accion`;
- `RolesPredefinidos` está en `src/domain/personas/contracts/roles.contract.ts`;
- `Rol` y `SesionContexto` viven mezclados con `Entidad` en `src/domain/personas/contracts/entidad.contract.ts`;
- `IUsuario` vive en `src/domain/personas/contracts/usuario.contract.ts` y depende de `Rol` y `SesionContexto`;
- catálogos seed RBAC vigentes viven en `src/domain/personas/contracts/rbac-catalogs.contract.ts`;
- `Usuario.ts` en `src/domain/personas/entities/Usuario.ts` encapsula helpers de autorización de dominio rico (`tieneRol`, `puede`, `esAdmin`, etc.).

### Surface pública vigente

- raíz pública se genera desde `scripts/generate-exports.ts`;
- hoy raíz reexporta `./domain/personas/contracts`, no existe `./domain/auth`;
- `package.json` no publica subpath `./auth`;
- `typesVersions` no contempla `auth`.

### Documentación vigente

- docs actuales de auth/RBAC están bajo `src/docs/personas/autorizacion-y-sesion.md`;
- también existen documentos históricos relevantes:
  - `src/docs/rbac-frontend-implementation.md`
  - `src/docs/roles y cargos/rbac-implementacion-final.md`
  - `src/docs/personas.md`
- no existe carpeta `src/docs/auth/`.

### Testing vigente

- `package.json` no tiene infraestructura real de tests;
- script actual `test` falla intencionalmente;
- `tsconfig.json` excluye `**/*.test.ts`;
- no existe hoy suite automatizada para exports o catálogos.

## Objetivo operativo

Dejar `yola-fresh-utils` con un dominio `auth` que publique:

- contratos auth compartidos;
- catálogo canónico de permisos en formato `modulo:recurso:accion`;
- catálogo canónico de grants/aliases;
- catálogo canónico de roles base;
- metadata completa por permiso;
- helpers puros de expansión y validación;
- contratos de snapshot offline auth;
- versionado de catálogo;
- tests de integridad y surface pública.

Al mismo tiempo:

- `personas` deja de ser dueño del RBAC canónico;
- `personas` conserva solo contratos de identidad/persona que realmente le pertenecen;
- docs de autorización pasan a `src/docs/auth/`;
- docs viejas en `personas` y RBAC histórico se ajustan para no competir con fuente vigente.

## Propuesta de cambios

### 1. Crear nuevo dominio `auth`

Crear árbol:

```text
src/domain/auth/
  contracts/
    auth-permission.contract.ts
    auth-grant.contract.ts
    auth-role.contract.ts
    auth-scope.contract.ts
    auth-snapshot.contract.ts
    auth-catalog.contract.ts
    index.ts
  catalogs/
    permission.catalog.ts
    permission-alias.catalog.ts
    role.catalog.ts
    index.ts
  metadata/
    permission-metadata.catalog.ts
    index.ts
  helpers/
    expand-grant.ts
    expand-grants.ts
    get-role-definition.ts
    resolve-role-permissions.ts
    is-system-admin-role.ts
    is-valid-permission.ts
    is-valid-grant.ts
    get-catalog-version.ts
    index.ts
  version/
    auth-catalog.version.ts
    index.ts
  index.ts
```

### 2. Definir contratos auth nuevos

Implementar contratos puros:

- `AuthPermission`: unión string canónica `modulo:recurso:accion`;
- `AuthGrant`: unión de permisos finos + aliases centralizados + `*`;
- `RoleDefinition`: `id`, `nombre`, `descripcion`, `grants`, `flags`;
- `PermissionDefinition`: `id`, `modulo`, `recurso`, `accion`, `criticidad`, `requiresActiveSession`, `auditable`, `uiVisible`;
- `AuthScope`: contrato de scopes (`tenant`, `sucursal`, `almacen`, `caja`);
- `AuthSnapshot`: snapshot offline compartido;
- `CatalogVersion` o equivalente simple alrededor de `AUTH_CATALOG_VERSION`.

Decisión de modelado:

- `AuthPermission` será type union derivado de catálogo constante tipado;
- `AuthGrant` también será unión tipada, no `string` libre;
- `AuthSnapshot` usará fechas serializables como `string` ISO, no `Date`, porque representa payload compartido backend/cliente offline.

Archivos afectados:

- nuevos archivos en `src/domain/auth/contracts/`.

### 3. Definir catálogos canónicos

Implementar:

- `AUTH_PERMISSIONS` como arreglo/objeto tipado fuente de verdad;
- `AUTH_PERMISSION_ALIASES` como mapa `AuthGrant -> AuthPermission[]` para aliases no atómicos;
- `AUTH_ROLE_DEFINITIONS` como mapa o arreglo indexado de roles base;
- `PERMISSION_METADATA` como `Record<AuthPermission, PermissionDefinition>`.

Decisiones:

- permisos usarán convención `modulo:recurso:accion`;
- aliases permitidos solo desde catálogo central:
  - `modulo:*`
  - `modulo:recurso:*`
  - `*`
- metadata completa será obligatoria para todo permiso;
- `admin` se resolverá por `*` y/o `flags.isSystemAdmin`.

Archivos afectados:

- `src/domain/auth/catalogs/permission.catalog.ts`
- `src/domain/auth/catalogs/permission-alias.catalog.ts`
- `src/domain/auth/catalogs/role.catalog.ts`
- `src/domain/auth/metadata/permission-metadata.catalog.ts`

### 4. Implementar helpers puros

Implementar helpers sin side effects:

- `expandGrant(grant): AuthPermission[]`
- `expandGrants(grants): AuthPermission[]`
- `getRoleDefinition(roleId): RoleDefinition | undefined`
- `resolveRolePermissions(roleIds): AuthPermission[]`
- `isSystemAdminRole(roleIds): boolean`
- `isValidPermission(permission): boolean`
- `isValidGrant(grant): boolean`
- `getCatalogVersion(): string`

Reglas:

- nada de `startsWith()` regado fuera del catálogo;
- deduplicación siempre centralizada;
- orden estable para resultados, idealmente por orden de catálogo;
- expansión basada en tablas precomputadas o lookup puro, no heurística libre por consumer.

Archivos afectados:

- `src/domain/auth/helpers/*.ts`

### 5. Publicar versión de catálogo

Crear:

- `src/domain/auth/version/auth-catalog.version.ts`

Exportar:

- `AUTH_CATALOG_VERSION`
- helper `getCatalogVersion()`

Regla documental:

- major para cambios incompatibles de catálogo;
- minor para agregar permisos/grants/roles compatibles;
- patch para correcciones internas o metadata.

### 6. Reorganizar ownership entre `auth` y `personas`

Reemplazo directo acordado.

Acciones:

- `personas` deja de ser dueño de `Permisos`, `RolesPredefinidos`, `rbac-catalogs` y de la narrativa RBAC canónica;
- `Rol` y `SesionContexto` deben migrar conceptualmente a `auth`;
- `Entidad` e `IUsuario` se mantienen en `personas`, pero deben dejar de depender del shape viejo si ese shape cambia.

Cambios concretos:

- revisar `src/domain/personas/contracts/entidad.contract.ts`:
  - separar `Rol` y `SesionContexto` de `Entidad`;
  - mover contratos auth a `src/domain/auth/contracts`.
- revisar `src/domain/personas/contracts/usuario.contract.ts`:
  - sustituir imports de `Rol` y `SesionContexto` para que apunten a `auth`;
  - decidir si `roles: Rol[]` se mantiene o si pasa a shape auth nuevo.
- revisar `src/domain/personas/entities/Usuario.ts`:
  - adaptar imports a auth nuevo;
  - revisar helpers `puede`, `tieneRol`, `esAdmin` para que usen catálogo nuevo;
  - si ya no caben en dominio persona, reducirlos o delegarlos a helpers auth puros.

Archivos afectados:

- `src/domain/personas/contracts/entidad.contract.ts`
- `src/domain/personas/contracts/usuario.contract.ts`
- `src/domain/personas/contracts/index.ts`
- `src/domain/personas/entities/Usuario.ts`
- `src/domain/personas/index.ts`

### 7. Resolver transición de `personas/contracts`

Como se acordó reemplazo directo, plan final:

- quitar de `personas/contracts/index.ts` los exports RBAC canónicos antiguos;
- dejar `personas` exportando solo contratos de identidad/persona;
- toda nueva API auth sale desde:
  - root `yola-fresh-utils`
  - subpath `yola-fresh-utils/auth`

Si durante implementación aparece dependencia técnica fuerte imposible de resolver en un solo corte, se documentará explícitamente en plan ejecutado, pero no se diseñará compatibilidad legacy como objetivo.

### 8. Actualizar exports públicos

Modificar:

- `scripts/generate-exports.ts`
- `package.json`

Cambios necesarios:

- agregar `export * from "./domain/auth/contracts";`
- agregar `export * from "./domain/auth/catalogs";`
- agregar `export * from "./domain/auth/metadata";`
- agregar `export * from "./domain/auth/helpers";`
- agregar `export * from "./domain/auth/version";`
- agregar subpath `./auth` en `package.json`;
- opcionalmente publicar subpaths internos estables:
  - `./auth/contracts`
  - `./auth/catalogs`
  - `./auth/helpers`
  - `./auth/metadata`
  - `./auth/version`
- extender `files` y `typesVersions` para `auth`.

También actualizar:

- `scripts/generate-public-subpath-stubs.cjs`

para generar stubs físicos de `auth` igual que resto de dominios.

### 9. Crear documentación nueva de `auth`

Crear carpeta:

```text
src/docs/auth/
  README.md
  modelo-vigente.md
  catalogo-de-permisos.md
  roles-y-grants.md
  snapshot-offline.md
  helpers-puros.md
  versionado-y-gobernanza.md
  rfcs/
    rfc-ssot-auth-shared.md
```

Objetivo de cada doc:

- `README.md`: índice de dominio y propósito;
- `modelo-vigente.md`: ownership, boundaries, contratos;
- `catalogo-de-permisos.md`: convención `modulo:recurso:accion`, aliases, metadata;
- `roles-y-grants.md`: roles base, grants canónicos, admin global;
- `snapshot-offline.md`: `AuthSnapshot`, scopes, responsabilidades backend/cliente;
- `helpers-puros.md`: cómo usar `expandGrant`, `resolveRolePermissions`, validadores;
- `versionado-y-gobernanza.md`: semver, proceso de cambio, prohibiciones.

### 10. Ajustar documentación existente

Actualizar:

- `src/docs/README.md`
- `src/docs/personas/README.md`
- `src/docs/personas/autorizacion-y-sesion.md`
- `src/docs/core/contratos-compartidos.md`
- `src/docs/core/arquitectura-vigente.md`
- `src/docs/rbac-frontend-implementation.md`
- `src/docs/roles y cargos/rbac-implementacion-final.md`
- `src/docs/personas.md`

Regla de actualización:

- `auth` pasa a ser fuente vigente para RBAC;
- `personas` deja de presentarse como dueño de autorización;
- documentos históricos deben quedar marcados como contexto histórico, no como surface vigente.

### 11. Implementar tests completos

Agregar infraestructura mínima de tests en TypeScript sin framework pesado nuevo, usando `node:test` + `ts-node/register`.

Cambios:

- crear carpeta `tests/auth/`
- agregar tests:
  - `tests/auth/catalog-integrity.test.ts`
  - `tests/auth/alias-expansion.test.ts`
  - `tests/auth/role-expansion.test.ts`
  - `tests/auth/admin-resolution.test.ts`
  - `tests/auth/metadata-completeness.test.ts`
  - `tests/auth/validation.test.ts`
  - `tests/auth/public-exports.test.ts`
- actualizar `package.json`:
  - script `test` real para ejecutar node test runner con TS.

Cobertura mínima:

- no colisión de permisos;
- metadata completa por permiso;
- aliases válidos expanden a permisos existentes;
- grants inválidos fallan;
- `admin` resuelve `*`;
- exports públicos root y `auth` exponen símbolos esperados.

### 12. Verificación y release técnico

Validaciones finales:

- `npm run generate-exports`
- `npm run build`
- `npm test`
- `npm pack --json --silent`
- revisar que paquete publicado incluya:
  - `dist/domain/auth/**`
  - stubs `auth/**`
  - docs `src/docs/auth/**`

## Supuestos y decisiones

- no se implementará persistencia, adapters, Fastify, hooks, Zustand, JWT ni sync runtime;
- `AuthSnapshot` será contrato derivado, no fuente maestra de asignación;
- backend IAM sigue siendo dueño de asignaciones reales, scopes persistidos, enforcement y tokens;
- cliente móvil sigue siendo dueño de SQLite local y guards UI;
- permisos de instancia tipo `cliente:123:editar` quedan prohibidos;
- scopes no se incrustan dentro del permiso canónico;
- `Entidad` e `IUsuario` permanecen en `personas`, salvo que durante implementación resulte más limpio mover alguno a `shared`;
- raíz seguirá exportando auth nuevo además de subpath dedicado;
- reemplazo directo implica que documentación y surface deben hablar de `auth` como dueño canónico al terminar.

## Riesgos identificados

- `Usuario.ts` puede quedar demasiado acoplado al shape viejo de `Permisos` y `RolesPredefinidos`;
- docs históricas pueden seguir sugiriendo surface antigua si no se limpian bien;
- reemplazo directo puede obligar a tocar más imports internos de `personas` de los previstos;
- crear suite de tests desde cero puede requerir ajuste fino del script con `ts-node`.

## Verificación

Checklist de aceptación para ejecución:

1. existe `src/domain/auth/` con contratos, catálogos, metadata, helpers y versionado;
2. root exporta auth;
3. `package.json` publica `./auth` y `typesVersions` para auth;
4. `personas` ya no es dueño del RBAC canónico;
5. docs vigentes apuntan a `src/docs/auth/` como fuente principal;
6. `npm run build` pasa;
7. `npm test` pasa;
8. `npm pack --json --silent` incluye `auth`;
9. catálogos y helpers cumplen criterios del RFC:
   - catálogo único;
   - metadata completa;
   - aliases centralizados;
   - admin resuelto centralmente;
   - snapshot auth compartido.
