# Plan: Implementación SSOT Auth en `yola-fresh-utils`

## Resumen

Completar implementación de `src/domain/auth` para que `yola-fresh-utils` sea SSOT de vocabulario auth compartido: contratos, catálogos, aliases, roles base, metadata, helpers puros, snapshot offline, versionado y surface pública.

Cambio seguirá decisiones ya cerradas en conversación y visibles en trabajo local:

- reemplazo directo del ownership canónico de RBAC hacia `auth`;
- publicación por raíz y por subpath `yola-fresh-utils/auth`;
- primera entrega completa, no parcial;
- backend IAM y cliente móvil consumen catálogo compartido, no inventan catálogo alterno.

## Estado actual analizado

### Dominio `auth`

Ya existe árbol nuevo en `src/domain/auth/`:

- `contracts/`
- `catalogs/`
- `helpers/`
- `metadata/`
- `version/`
- `index.ts`

Evidencia revisada:

- `src/domain/auth/contracts/auth-role.contract.ts`
- `src/domain/auth/contracts/auth-catalog.contract.ts`
- `src/domain/auth/catalogs/permission.catalog.ts`
- `src/domain/auth/catalogs/permission-alias.catalog.ts`
- `src/domain/auth/catalogs/role.catalog.ts`
- `src/domain/auth/helpers/index.ts`
- `src/domain/auth/index.ts`

Estado observado:

- contratos base ya existen;
- catálogo de permisos ya usa formato `modulo:recurso:accion`;
- aliases se derivan centralmente desde catálogo;
- roles base ya existen;
- helpers principales ya existen;
- `CatalogVersion` ya existe;
- falta cerrar integración pública, docs, tests y validación final.

### Ownership actual entre `auth` y `personas`

Evidencia revisada:

- `src/domain/personas/contracts/index.ts`
- `src/domain/personas/contracts/usuario.contract.ts`
- `src/domain/personas/entities/Usuario.ts`

Estado observado:

- `personas/contracts/index.ts` ya dejó de reexportar RBAC viejo;
- `IUsuario` ya importa `Rol` y `SesionContexto` desde `auth`;
- `Usuario.ts` ya consume `expandGrants()` e `isSystemAdminRole()`;
- archivos legacy siguen existiendo en `src/domain/personas/contracts/`:
  - `permisos.contract.ts`
  - `roles.contract.ts`
  - `rbac-catalogs.contract.ts`
- esos archivos ya no son surface canónica, pero todavía existen como residuo documental/técnico interno.

### Surface pública actual

Evidencia revisada:

- `src/index.ts`
- `scripts/generate-exports.ts`
- `scripts/generate-public-subpath-stubs.cjs`
- `package.json`

Estado observado:

- `scripts/generate-exports.ts` ya fue editado para incluir `export * from "./domain/auth";`;
- `scripts/generate-public-subpath-stubs.cjs` ya incluye stubs `auth/*`;
- `package.json` ya incluye `exports`, `files` y `typesVersions` para `auth`;
- `src/index.ts` todavía no está regenerado y sigue sin exportar `./domain/auth`;
- falta regenerar surface real y luego validar build/pack.

### Documentación actual

Evidencia revisada:

- `src/docs/auth/README.md`
- `src/docs/personas/autorizacion-y-sesion.md`
- `src/docs/personas/README.md`
- `src/docs/core/contratos-compartidos.md`
- grep sobre `roles.contract`, `permisos.contract`, `Permisos`, `RolesPredefinidos`

Estado observado:

- `src/docs/auth/README.md` ya referencia documentos que aún no existen:
  - `modelo-vigente.md`
  - `catalogo-de-permisos.md`
  - `roles-y-grants.md`
  - `snapshot-offline.md`
  - `helpers-puros.md`
  - `versionado-y-gobernanza.md`
  - `rfcs/rfc-ssot-auth-shared.md`
- `src/docs/personas/autorizacion-y-sesion.md` todavía afirma que vocabulario canónico vive en `personas`;
- `src/docs/personas/README.md`, `src/docs/core/contratos-compartidos.md`, `src/docs/personas.md`, `src/docs/rbac-frontend-implementation.md` y docs históricas siguen mencionando RBAC viejo como vigente.

### Testing actual

Evidencia revisada:

- `package.json`
- `tsconfig.json`
- búsqueda global `**/*.{test,spec}.{ts,tsx,js,mjs,cjs}` sin resultados

Estado observado:

- no existe suite de tests;
- script `test` actual falla intencionalmente;
- `tsconfig.json` excluye `**/*.test.ts`;
- no existe validación automática de catálogo, helpers ni exports públicos.

## Objetivo operativo

Dejar paquete listo para publicar con estos resultados:

- `auth` exportado por root y subpaths;
- contratos auth compartidos estables;
- catálogo y metadata completos y tipados;
- helpers puros oficiales funcionando;
- docs de `auth` completas y docs viejas desambiguadas;
- tests automatizados de integridad y surface pública;
- validación por `generate-exports`, `build`, `test` y `pack`.

## Propuesta de cambios

### 1. Cerrar surface pública real de `auth`

#### Archivos

- `scripts/generate-exports.ts`
- `src/index.ts`
- `scripts/generate-public-subpath-stubs.cjs`
- `package.json`

#### Qué

- regenerar `src/index.ts` para que publique `auth` desde raíz;
- preservar publicación `root + subpath`;
- conservar stubs físicos `auth`, `auth/contracts`, `auth/catalogs`, `auth/helpers`, `auth/metadata`, `auth/version`;
- verificar consistencia entre `exports`, `typesVersions`, `files` y stubs.

#### Cómo

- usar `scripts/generate-exports.ts` como fuente de verdad de root exports;
- dejar `src/index.ts` generado, no editado manualmente;
- mantener `package.json` como contrato de publicación formal;
- validar que `auth` aparezca tanto en runtime como en tipos.

#### Por qué

Trabajo local ya preparó scripts y `package.json`, pero root actual todavía no refleja `auth`. Sin regeneración y verificación, surface pública queda rota o parcialmente aplicada.

### 2. Consolidar dominio `auth` como owner canónico

#### Archivos

- `src/domain/auth/contracts/*.ts`
- `src/domain/auth/catalogs/*.ts`
- `src/domain/auth/metadata/*.ts`
- `src/domain/auth/helpers/*.ts`
- `src/domain/auth/version/*.ts`
- `src/domain/auth/index.ts`
- `src/domain/personas/contracts/usuario.contract.ts`
- `src/domain/personas/entities/Usuario.ts`
- `src/domain/personas/contracts/entidad.contract.ts`

#### Qué

- revisar y ajustar shapes auth para que cumplan RFC final;
- mantener `Rol`, `SesionContexto` y snapshots auth dentro de `auth`;
- mantener `Entidad` e `IUsuario` en `personas`, apuntando a shapes `auth`;
- asegurar que helpers y tipos no dependan de catálogo viejo de `personas`.

#### Cómo

- normalizar nombres y exports faltantes dentro de `src/domain/auth`;
- verificar que contratos cubran:
  - `AuthPermission`
  - `AuthGrant`
  - `RoleDefinition`
  - `PermissionDefinition`
  - `AuthScope`
  - `AuthSnapshot`
  - `CatalogVersion`
- revisar `Usuario.ts` para que toda lógica auth use contratos y helpers nuevos;
- no volver a reexportar RBAC viejo desde `personas/contracts/index.ts`.

#### Por qué

Gran parte ya está creada, pero integración debe quedar limpia y consistente para evitar mezcla de ownership entre `personas` y `auth`.

### 3. Definir estrategia explícita para legado RBAC en `personas`

#### Archivos

- `src/domain/personas/contracts/permisos.contract.ts`
- `src/domain/personas/contracts/roles.contract.ts`
- `src/domain/personas/contracts/rbac-catalogs.contract.ts`
- `src/docs/personas/autorizacion-y-sesion.md`
- `src/docs/personas/README.md`
- `src/docs/core/contratos-compartidos.md`

#### Qué

- tratar contratos RBAC viejos como legado no canónico;
- evitar que docs los presenten como fuente vigente;
- decidir si permanecen en código solo como remanente interno no exportado o como compatibilidad documental explícita.

#### Cómo

- no reintroducirlos en `personas/contracts/index.ts`;
- actualizar docs para marcar:
  - `auth` = fuente vigente;
  - `personas` = identidad y entidades;
  - RBAC viejo = histórico/legacy, no SSOT nuevo.

#### Por qué

Hoy código ya se movió parcialmente, pero docs siguen contradiciendo arquitectura final. Eso reabre drift conceptual entre repos y equipos.

### 4. Completar documentación `src/docs/auth/`

#### Archivos nuevos

- `src/docs/auth/modelo-vigente.md`
- `src/docs/auth/catalogo-de-permisos.md`
- `src/docs/auth/roles-y-grants.md`
- `src/docs/auth/snapshot-offline.md`
- `src/docs/auth/helpers-puros.md`
- `src/docs/auth/versionado-y-gobernanza.md`
- `src/docs/auth/rfcs/rfc-ssot-auth-shared.md`

#### Archivos a alinear

- `src/docs/auth/README.md`
- `src/docs/README.md`
- `src/docs/personas/autorizacion-y-sesion.md`
- `src/docs/personas/README.md`
- `src/docs/core/contratos-compartidos.md`
- `src/docs/core/arquitectura-vigente.md`
- `src/docs/personas.md`
- `src/docs/rbac-frontend-implementation.md`

#### Qué

- completar carpeta `auth` con documentación vigente;
- reubicar narrativa canónica de autorización hacia `auth`;
- dejar referencias cruzadas desde `personas` y `core`;
- marcar documentos históricos viejos sin competir con fuente actual.

#### Cómo

- `modelo-vigente.md`: ownership, fronteras, responsabilidades de paquete/backend/cliente;
- `catalogo-de-permisos.md`: convención `modulo:recurso:accion`, catálogo, aliases, metadata, reglas prohibidas;
- `roles-y-grants.md`: roles base, grants canónicos, expansión y bypass admin;
- `snapshot-offline.md`: contrato `AuthSnapshot`, scopes y reglas offline-first;
- `helpers-puros.md`: API oficial y ejemplos de consumo;
- `versionado-y-gobernanza.md`: semver, proceso de cambio y prohibiciones de catálogos locales;
- `rfc-ssot-auth-shared.md`: RFC implementado con decisión arquitectónica, ownership y criterios de aceptación.

#### Por qué

README de `auth` ya apunta a estos archivos. Dejarlos faltantes rompe documentación publicada y onboarding.

### 5. Introducir infraestructura real de tests

#### Archivos

- `package.json`
- `tsconfig.json`
- `tsconfig.test.json` nuevo

#### Qué

- reemplazar script `test` que hoy falla;
- compilar tests TypeScript separados de build principal;
- ejecutar tests con `node:test` sobre salida compilada.

#### Cómo

- mantener `tsconfig.json` principal excluyendo `**/*.test.ts` para build de paquete;
- crear `tsconfig.test.json` extendiendo configuración base e incluyendo `src/**/*.ts` y `src/**/*.test.ts`, con `outDir` separado y sin declaraciones;
- agregar scripts:
  - `test:build`
  - `test`
- correr tests con `node --test` sobre JS compilado.

#### Por qué

Proyecto es TypeScript puro, no tiene framework de tests y debe mantener build principal limpio. Compilar tests aparte evita contaminar `dist/`.

### 6. Agregar suite auth de integridad y API pública

#### Archivos nuevos propuestos

- `src/domain/auth/tests/catalog-integrity.test.ts`
- `src/domain/auth/tests/helpers.test.ts`
- `src/domain/auth/tests/public-exports.test.ts`

#### Qué

- cubrir integridad de catálogo;
- cubrir expansión de grants/roles;
- cubrir admin global;
- cubrir metadata completa;
- cubrir grants inválidos;
- cubrir surface pública root y subpath.

#### Cómo

- `catalog-integrity.test.ts` validará:
  - unicidad de `AUTH_PERMISSIONS`;
  - metadata para cada permiso;
  - aliases válidos y expansión no vacía;
  - permisos generados sin colisiones.
- `helpers.test.ts` validará:
  - `expandGrant()`
  - `expandGrants()`
  - `resolveRolePermissions()`
  - `isSystemAdminRole()`
  - `isValidPermission()`
  - `isValidGrant()`
  - `getCatalogVersion()`
- `public-exports.test.ts` validará:
  - imports desde raíz del paquete compilado;
  - imports desde `auth`;
  - presencia de exports clave.

#### Por qué

RFC pide tests de integridad, helpers y backward safety de exports públicos. Hoy no existe ninguna red de seguridad.

### 7. Verificación técnica y empaquetado

#### Pasos

- ejecutar `npm run generate-exports`
- ejecutar `npm run build`
- ejecutar `npm test`
- ejecutar `npm pack --json --silent`
- revisar que tarball contenga:
  - `dist/`
  - `src/docs/auth/*`
  - stubs `auth/*`

#### Qué validar

- root export incluye `auth`;
- subpaths `auth/*` resuelven;
- tests pasan;
- paquete empacado incluye docs y stubs;
- no aparecen errores de TypeScript en archivos tocados.

## Decisiones y supuestos cerrados

- `yola-fresh-utils` será SSOT de vocabulario auth compartido.
- Backend IAM seguirá siendo owner de persistencia, asignación, enforcement y tokens.
- Cliente móvil seguirá consumiendo `AuthSnapshot` derivado para offline-first.
- No se crearán interfaces auth fuera de `yola-fresh-utils`.
- Publicación seguirá modelo `root + subpath`.
- Primera entrega será completa: dominio, docs, tests, build y pack.
- Legacy RBAC de `personas` no recupera ownership canónico.

## Riesgos a vigilar durante ejecución

- contradicción entre docs nuevas y docs viejas si no se limpian referencias cruzadas;
- tests root/subpath pueden requerir imports sobre salida compilada, no sobre `src/`;
- archivos legacy no exportados pueden seguir confundiendo a contributors si docs no los marcan como históricos;
- `src/index.ts` generado puede pisar cambios manuales si executor edita root antes de regenerar.

## Verificación final esperada

Aceptación quedará cumplida si al final:

- existe catálogo auth único en `src/domain/auth`;
- `src/index.ts` y `package.json` publican `auth` correctamente;
- docs `src/docs/auth/` están completas y enlazadas;
- docs de `personas` y `core` ya no presentan RBAC viejo como vigente;
- suite `node:test` valida catálogo, helpers y exports públicos;
- `generate-exports`, `build`, `test` y `pack` pasan sin errores.
