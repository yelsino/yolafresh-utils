# Changelog

Cambios relevantes de `yola-fresh-utils` se registran aquí.

Este proyecto adopta versionado semántico:

- `major`: cambios incompatibles en surface pública o contratos compartidos;
- `minor`: contratos, catálogos, exports o docs compatibles hacia atrás;
- `patch`: correcciones internas, tests, docs o fixes compatibles.

## [Unreleased]

- Sin publicar todavía.

## [1.0.3] - 2026-07-08

### Added

- Se completa línea `v1.x` sin abrir nueva major.
- Se consolida `auth` como dominio compartido dentro de misma línea `v1`.
- `resolveRoleGrants()` como helper público oficial.
- `getPermissionDefinition()`, `listAllPermissions()` y `listAllRoles()`.
- documentación de migración `v1 -> v2`.
- soporte documental y contractual para `dbName` en `AuthSnapshot`.
- test de contrato de snapshot y ampliación de cobertura de exports públicos.
- contratos `auth`, catálogos, metadata, snapshot offline y helpers puros.
- subpaths públicos `auth/*`.
- guía de instalación por tags GitHub y versionado secuencial.

## [1.0.2] - 2026-07-08

### Línea base

- Se consolida `1.0.2` como línea base documentada del paquete.
- Se formaliza política semver para futuras releases.
- Se agregan scripts de release por `patch`, `minor`, `major` y `prerelease`.
