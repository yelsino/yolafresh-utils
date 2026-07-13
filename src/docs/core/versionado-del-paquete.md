# Versionado del Paquete

## Propósito

Este documento fija política de versionado de `yola-fresh-utils` para preservar compatibilidad entre proyectos consumidores.

## Regla base

`yola-fresh-utils` usa SemVer:

- `major`: rompe contratos, exports, nombres o shapes públicos;
- `minor`: agrega contratos, subpaths, helpers o catálogos sin romper compatibilidad;
- `patch`: corrige bugs, tests, docs o publicación sin romper surface pública.

## Qué significa cada línea

### `v1`

Línea mayor estable.

Todos los `1.x.y` deben mantener compatibilidad de consumo dentro de misma major, salvo deprecaciones documentadas y migraciones explícitas.

### `v1.1`

Línea menor.

Sirve para fijar consumer a familia compatible de funcionalidades:

- acepta `1.1.0`, `1.1.1`, `1.1.2`;
- no salta a `1.2.0` si consumer usa `~1.1.0`.

### `v1.1.3`

Versión exacta.

Sirve cuando consumer necesita reproducibilidad total.

## Cómo instalar

Consumers actuales de YolaFresh instalan directo desde GitHub.

Recomendación oficial:

- usar tags reales;
- no apuntar a rama flotante `main`;
- no dejar dependencia como `github:yelsino/yolafresh-utils` sin tag.
- seguir línea secuencial `v1.x`.

### Desde GitHub por tag exacto

```bash
npm install github:yelsino/yolafresh-utils#v1.0.6
```

En `package.json`:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.6"
  }
}
```

### Release anterior exacta

```bash
npm install github:yelsino/yolafresh-utils#v1.0.2
```

En `package.json`:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.2"
  }
}
```

Regla:

- tag Git debe ser `vX.Y.Z`;
- versión en `package.json` debe coincidir con tag.

## Flujo de release local

### Patch

```bash
npm run release:patch
```

### Minor

```bash
npm run release:minor
```

### Major

```bash
npm run release:major
```

### Prerelease

```bash
npm run release:prerelease
```

## Qué hacen scripts

- `preversion`: corre `npm test`;
- `version`: recompila paquete;
- `postversion`: muestra versión creada y recuerda `git push --follow-tags`.

`npm version` crea:

- cambio de versión en `package.json`;
- commit de versión;
- tag Git `vX.Y.Z`.

## Política para no romper consumers

- si cambias contratos compartidos de forma incompatible, sube `major`;
- si agregas contratos o permisos compatibles, sube `minor`;
- si corriges bug sin romper imports ni shapes, sube `patch`;
- no elimines exports públicos en `patch` ni `minor`;
- si una API debe morir, primero deprecar, luego remover en siguiente `major`.

## Excepción documentada vigente

`v1.0.5` publica corte coordinado sobre `CarritoVenta` aun dentro de línea `v1.0.x`.

Cambio documentado:

- se removieron `notas`, `tasaImpuesto`, `clienteId` y `personalId` de `ICarritoVenta`;
- se agregó guía de migración explícita para consumers de ventas.

Por eso, `v1.0.5` no debe asumirse como patch transparente para cualquier consumer que serialice `CarritoVenta`.

Referencia obligatoria:

- [../ventas/migracion-v1-0-4-a-v1-0-5.md](../ventas/migracion-v1-0-4-a-v1-0-5.md)

## Recomendación por tipo de consumer

- app productiva estable: fijar exacta `X.Y.Z`;
- app interna que acepta mejoras compatibles: usar `~X.Y.0`;
- ecosistema controlado por misma major: usar `^X.0.0`.

## Referencias

- [README.md](../../../README.md)
- [CHANGELOG.md](../../../CHANGELOG.md)
- [arquitectura-vigente.md](./arquitectura-vigente.md)
