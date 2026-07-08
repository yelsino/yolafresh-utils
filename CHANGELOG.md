# Changelog

Cambios relevantes de `yola-fresh-utils` se registran aquí.

Este proyecto adopta versionado semántico:

- `major`: cambios incompatibles en surface pública o contratos compartidos;
- `minor`: contratos, catálogos, exports o docs compatibles hacia atrás;
- `patch`: correcciones internas, tests, docs o fixes compatibles.

## [Unreleased]

- Sin publicar todavía.

## [2.0.0] - 2026-07-08

### Breaking

- `auth` pasa a ser dueño canónico del vocabulario RBAC compartido.
- `personas` deja de ser owner canónico de permisos, grants y roles base.
- consumers que instalaban desde rama sin fijar tag deben migrar a dependencia por tag GitHub.

### Added

- dominio `auth` con contratos, catálogos, metadata, helpers y snapshot offline.
- subpaths públicos `auth/*`.
- documentación oficial de `auth`.
- infraestructura de tests y validación de exports públicos.
- guía formal de versionado del paquete.

## [1.0.2] - 2026-07-08

### Línea base

- Se consolida `1.0.2` como línea base documentada del paquete.
- Se formaliza política semver para futuras releases.
- Se agregan scripts de release por `patch`, `minor`, `major` y `prerelease`.
