# Yola Fresh Utils

## Propósito

`yolafresh-utils` es biblioteca TypeScript del ecosistema YolaFresh orientada al lenguaje compartido del negocio.

La versión de este checkout se define en `package.json`. Para instalar en otro
proyecto, elegir un tag publicado y verificado; no asumir que la versión del
checkout ya fue publicada.

El paquete modela:

- contratos de negocio;
- enums y configuraciones canónicas;
- primitivas de dominio;
- entidades ricas con invariantes puntuales;
- surface pública pequeña y explícita.

No es colección genérica de helpers frontend ni capa de infraestructura.

## Mapa del repositorio

| Ruta | Función | ¿Se edita a mano? |
| --- | --- | --- |
| `src/domain/` | Fuente de todos los contratos y entidades, incluido `fiscal/` | Sí |
| `src/docs/` | Documentación de los dominios | Sí |
| `auth/`, `ventas/`, `inventario/` y demás dominios en la raíz | Entradas públicas de compatibilidad generadas para los subpaths de `yola-fresh-utils` | No |
| `dist/` | Compilación de `yola-fresh-utils` | No |
| `dist-test/` | JavaScript compilado temporalmente para las pruebas | No |

Las carpetas de dominio en la raíz **no duplican el dominio fuente**: contienen
solo `index.js` e `index.d.ts` que apuntan a `dist/domain/`. Siguen presentes
porque el paquete las incluye y `typesVersions` las referencia. El script
`scripts/generate-public-subpath-stubs.cjs` actualiza únicamente esas entradas;
no debe borrar carpetas completas. La configuración de Cursor/VS Code oculta
las entradas generadas y las compilaciones en el explorador, sin eliminarlas
ni impedir buscarlas.

Los contratos fiscales están en `src/domain/fiscal/contracts/`, junto a los
demás dominios. Se exportan desde la raíz de `yola-fresh-utils` y desde
`yola-fresh-utils/fiscal` y `yola-fresh-utils/fiscal/contracts`. La
[documentación del dominio](src/docs/fiscal/modelo-de-comprobantes.md) explica
la relación entre venta, comprobante firmado, impresión y respuesta tributaria.

## Arquitectura pública

La surface oficial sigue regla:

- raíz mínima;
- subpaths por dominio;
- `shared/` reducido a `base`, `kernel`, `utils`, `value-objects`.

La raíz publica los contratos compartidos y los contratos de dominio, además de las
entidades ricas seleccionadas:

- `shared/base`
- `shared/kernel`
- `shared/utils`
- `shared/value-objects`
- contratos de `pedido`, `ventas`, `compras`, `inventario`, `tesoreria`, `finanzas`, `auth`, `personas` y `contabilidad`;
- `Venta`
- `CarritoVenta`
- `VentaSnapshot`
- `RecurrenciaEntity`

## Dominios publicados

- `ventas`: contratos, entidades y eventos de venta.
- `pedido`: contratos de pedido y entrega logística.
- `compras`: contratos y entidad rica `Compra`.
- `inventario`: contratos de catálogo, stock, movimientos y recepción.
- `tesoreria`: contratos de caja, turnos, movimientos y pagos.
- `finanzas`: contratos monetarios, cuenta cliente, ledger auxiliar y recurrencias.
- `auth`: permisos, grants, roles base, metadata, snapshot auth y helpers puros.
- `personas`: contratos de actores, usuarios y direcciones.
- `contabilidad`: contratos y entidades contables publicadas por subpath.
- `fiscal`: contratos y validadores puros de CPE publicados por raíz y subpath.

## Principios

- `Venta` no es `Pago`.
- `Venta` no es `MovimientoCaja`.
- `Venta` no es `MovimientoCuentaCliente`.
- `Venta` no es `MovimientoInventario`.
- `CuentaCliente` pertenece a `finanzas`.
- `ResumenCuentaCliente` no reemplaza ledger oficial.
- Infraestructura, persistencia, mappers y UI no pertenecen al paquete.

## Instalación

Los consumidores de YolaFresh instalan un tag exacto y comprobado de GitHub,
no una rama flotante. El antiguo `v2.4.0` no contiene el dominio fiscal; para
consumirlo hay que usar una versión publicada que incluya esta integración.
`2.5.8` es la versión local preparada para inspección, no un tag ni una
publicación. Reemplaza el contrato fiscal experimental `2.4.8-cpe.9`;
los consumidores deben adaptar sus imports y usos de `FiscalEvidence` antes
de actualizar la dependencia.

Los contratos fiscales se instalan con la misma versión de `yola-fresh-utils`.
No requieren instalar `@yolafresh/cpe-contracts` por separado.

Regla de lectura:

- `major`: rompe compatibilidad;
- `minor`: agrega sin romper;
- `patch`: corrige sin romper.

## Desarrollo local

```bash
pnpm run generate-exports
pnpm run build
```

El build crea `dist/` y actualiza las entradas públicas de la raíz. Las pruebas
crean `dist-test/`; ambas carpetas son salidas generadas y no se versionan.

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
- [src/docs/core/implementacion-para-clientes.md](./src/docs/core/implementacion-para-clientes.md)

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
import type { Pedido } from "yola-fresh-utils/pedido/contracts";
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
- [src/docs/pedido/README.md](./src/docs/pedido/README.md)
- [src/docs/ventas/README.md](./src/docs/ventas/README.md)
- [src/docs/finanzas/README.md](./src/docs/finanzas/README.md)
- [src/docs/compras/README.md](./src/docs/compras/README.md)
- [src/docs/inventario/README.md](./src/docs/inventario/README.md)
- [src/docs/tesoreria/README.md](./src/docs/tesoreria/README.md)
- [src/docs/personas/README.md](./src/docs/personas/README.md)
- [src/docs/contabilidad/README.md](./src/docs/contabilidad/README.md)
- [src/docs/auth/README.md](./src/docs/auth/README.md)

Cuando paquete se instala desde npm o GitHub, carpeta `src/docs/` también viaja dentro del paquete publicado.

## Jerarquía documental

En caso de discrepancia, aplicar este orden:

1. código publicado y `package.json`;
2. documentación vigente dentro de `src/docs/core/` y `src/docs/<dominio>/`;
3. migraciones y RFCs, únicamente para entender cambios históricos;
4. `.trae/`, que contiene planes y especificaciones de trabajo, no la API publicada.

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
