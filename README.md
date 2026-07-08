# Yola Fresh Utils

## Propósito

`yolafresh-utils` es biblioteca TypeScript del ecosistema YolaFresh orientada al lenguaje compartido del negocio.

El paquete modela:

- contratos de negocio;
- enums y configuraciones canónicas;
- primitivas de dominio;
- entidades ricas con invariantes puntuales;
- surface pública pequeña y explícita.

No es colección genérica de helpers frontend ni capa de infraestructura.

## Arquitectura pública

La surface oficial sigue regla:

- raíz mínima;
- subpaths por dominio;
- `shared/` reducido a `base`, `kernel`, `utils`, `value-objects`.

La raíz exporta solo:

- `shared/base`
- `shared/kernel`
- `shared/utils`
- `shared/value-objects`
- `Venta`
- `CarritoVenta`
- `VentaSnapshot`
- `RecurrenciaEntity`

## Dominios publicados

- `ventas`: contratos, entidades y eventos de venta.
- `compras`: contratos y entidad rica `Compra`.
- `inventario`: contratos de catálogo, stock, movimientos y recepción.
- `tesoreria`: contratos de caja, turnos, movimientos y pagos.
- `finanzas`: contratos monetarios, cuenta cliente, ledger auxiliar y recurrencias.
- `auth`: permisos, grants, roles base, metadata, snapshot auth y helpers puros.
- `personas`: contratos de actores, usuarios y direcciones.
- `contabilidad`: contratos y entidades contables publicadas por subpath.

## Principios

- `Venta` no es `Pago`.
- `Venta` no es `MovimientoCaja`.
- `Venta` no es `MovimientoCuentaCliente`.
- `Venta` no es `MovimientoInventario`.
- `CuentaCliente` pertenece a `finanzas`.
- `ResumenCuentaCliente` no reemplaza ledger oficial.
- Infraestructura, persistencia, mappers y UI no pertenecen al paquete.

## Instalación

Consumers de YolaFresh jalan directo desde GitHub.

Recomendación oficial:

- no usar rama flotante `github:yelsino/yolafresh-utils`;
- fijar siempre tag real `vX.Y.Z`;
- usar nueva `major` solo cuando migración esté aprobada.

Instalar desde GitHub por tag exacto:

```bash
npm install github:yelsino/yolafresh-utils#v2.1.0
```

En `package.json`:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v2.1.0"
  }
}
```

Si un consumer necesita seguir en línea estable vieja:

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

Regla de lectura:

- `major`: rompe compatibilidad;
- `minor`: agrega sin romper;
- `patch`: corrige sin romper.

Por eso:

- `v1.0.2` = línea vieja estable;
- `v2.1.0` = línea actual recomendada con dominio `auth`, helpers completos y migración documentada.

## Desarrollo local

```bash
pnpm run generate-exports
pnpm run build
```

## Releases

Crear nueva versión patch:

```bash
npm run release:patch
```

Crear nueva versión minor:

```bash
npm run release:minor
```

Crear nueva versión major:

```bash
npm run release:major
```

Crear prerelease:

```bash
npm run release:prerelease
```

Flujo configurado:

- `preversion`: corre tests;
- `version`: reconstruye paquete;
- `postversion`: deja lista versión y recuerda `git push --follow-tags`.

Más detalle:

- [CHANGELOG.md](./CHANGELOG.md)
- [src/docs/core/versionado-del-paquete.md](./src/docs/core/versionado-del-paquete.md)

## Uso

Consumo raíz:

```ts
import {
  CarritoVenta,
  DateUtils,
  RecurrenciaEntity,
  Venta,
  VentaState,
} from "yola-fresh-utils";
```

Consumo por dominio:

```ts
import type { Pedido } from "yola-fresh-utils/ventas/contracts";
import type {
  CuentaCliente,
  MovimientoCuentaCliente,
} from "yola-fresh-utils/finanzas/contracts";
import { Compra } from "yola-fresh-utils/compras/entities";
```

Consumo de primitivas:

```ts
import { AggregateRoot, Entity } from "yola-fresh-utils/shared/base";
import { EmpresaId } from "yola-fresh-utils/shared/value-objects";
```

## Documentación oficial

Fuente principal:

- [src/docs/README.md](./src/docs/README.md)
- [src/docs/core/README.md](./src/docs/core/README.md)
- [src/docs/core/vision-general-del-paquete.md](./src/docs/core/vision-general-del-paquete.md)
- [src/docs/core/guia-de-onboarding.md](./src/docs/core/guia-de-onboarding.md)
- [src/docs/core/mapa-del-dominio.md](./src/docs/core/mapa-del-dominio.md)
- [src/docs/ventas/README.md](./src/docs/ventas/README.md)
- [src/docs/finanzas/README.md](./src/docs/finanzas/README.md)
- [src/docs/compras/README.md](./src/docs/compras/README.md)
- [src/docs/inventario/README.md](./src/docs/inventario/README.md)
- [src/docs/tesoreria/README.md](./src/docs/tesoreria/README.md)
- [src/docs/personas/README.md](./src/docs/personas/README.md)
- [src/docs/contabilidad/README.md](./src/docs/contabilidad/README.md)

Cuando paquete se instala desde npm o GitHub, carpeta `src/docs/` también viaja dentro del paquete publicado.

Ruta esperada en consumer:

```txt
node_modules/yola-fresh-utils/src/docs/
```

Eso permite leer documentación oficial sin entrar al repositorio fuente.

## Alcance negativo

El paquete ya no publica ni debe reintroducir:

- utilidades de frontend o DOM;
- multimedia e íconos;
- mappers legacy;
- snapshots técnicos de persistencia;
- processors o services operativos;
- adapters a SQLite, CouchDB, API o mensajería.

## Licencia

MIT
