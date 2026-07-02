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
- `personas`: contratos de actores, usuarios, roles, permisos y direcciones.
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

```bash
pnpm add yola-fresh-utils
```

## Desarrollo local

```bash
pnpm run generate-exports
pnpm run build
```

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
- [src/docs/ventas/README.md](./src/docs/ventas/README.md)
- [src/docs/finanzas/README.md](./src/docs/finanzas/README.md)
- [src/docs/compras/README.md](./src/docs/compras/README.md)
- [src/docs/inventario/README.md](./src/docs/inventario/README.md)
- [src/docs/tesoreria/README.md](./src/docs/tesoreria/README.md)
- [src/docs/personas/README.md](./src/docs/personas/README.md)
- [src/docs/contabilidad/README.md](./src/docs/contabilidad/README.md)

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
