# RFC: Evolucion de la estructura de `yolafresh-utils`

## Estado

Implementado.

## Fecha

2026-07-02

## Contexto

`yolafresh-utils` evoluciono desde una libreria heterogenea hacia un paquete enfocado en contratos de negocio, primitivas de dominio y algunos agregados con invariantes.

La evidencia actual muestra que:

- la raiz publica una surface minima desde [src/index.ts](../../index.ts);
- el lenguaje contractual ya fue redistribuido a `contracts/` por dominio;
- el paquete conserva modulos con comportamiento de dominio como [Venta.ts](../../domain/ventas/entities/Venta.ts), [CarritoVenta.ts](../../domain/ventas/entities/CarritoVenta.ts), [VentaSnapshot.ts](../../domain/ventas/entities/VentaSnapshot.ts), [Compra.ts](../../domain/compras/entities/Compra.ts) y [RecurrenciaEntity.ts](../../domain/finanzas/entities/RecurrenciaEntity.ts);
- la documentacion vigente espeja esta topologia en `src/docs/`.

La tension original quedo resuelta mediante:

- eliminacion de `shared/interfaces`;
- redistribucion de ownership contractual por dominio;
- separacion uniforme entre `contracts`, `entities` y `events`;
- surface publica oficial basada en root minimo + subpaths por dominio.

## Problema

El problema original era que la publicacion minima no expresaba con claridad ownership semantico ni topologia final de una libreria de dominio.

## Decision

`yolafresh-utils` se consolida como libreria de dominio organizada principalmente por Domain y secundariamente por tipo de artefacto.

La regla estructural implementada es:

- cada Domain publica su propio lenguaje;
- `shared/` se reduce al minimo transversal real;
- la raiz del paquete se mantiene pequena;
- los consumers avanzados usan subpaths por Domain;
- la documentacion espeja la estructura de dominios y publication surface.

## Objetivos

- hacer explicito el ownership semantico de cada contrato;
- separar contratos, entidades con invariantes y eventos de dominio;
- evitar que `shared/interfaces` vuelva a crecer como bolsa global;
- preparar el paquete para crecer sin mezclar infraestructura ni orquestacion;
- alinear estructura fuente, surface publica y documentacion.

## No objetivos

- convertir la libreria en microservicios;
- introducir infraestructura, repositorios o adapters;
- imponer CQRS, Event Sourcing o capas de aplicacion completas dentro del paquete;
- reintroducir compatibilidad legacy.

## Principios no negociables

### Dominio primero

Todo archivo nuevo debe pertenecer a uno de estos grupos:

- contrato de negocio;
- entidad o agregado con invariantes;
- evento de dominio;
- `Value Object`;
- primitiva transversal del dominio.

### Infraestructura fuera

No deben entrar al paquete:

- mappers de persistencia;
- adapters a SQLite, CouchDB, API o mensajeria;
- helpers de UI o frontend;
- schedulers, processors o servicios operativos;
- DTOs tecnicos ajenos al lenguaje de negocio.

### `shared/` minimo

`shared/` solo debe conservar:

- primitivas base;
- `Value Objects` transversales;
- errores o tipos de kernel verdaderamente compartidos;
- utilidades minimas puras como fechas o ULIDs.

### Root pequeno

La raiz del paquete no debe volver a reexportar todo el dominio. Su responsabilidad es ofrecer:

- entrada corta para primitives y piezas top del paquete;
- surface publica estable y pequena;
- acceso mas explicito por subpaths para el resto.

## Estructura objetivo recomendada

```txt
src/
  domain/
    shared/
      base/
      value-objects/
      kernel/
      utils/

    ventas/
      contracts/
      entities/
      events/

    compras/
      contracts/
      entities/

    inventario/
      contracts/

    tesoreria/
      contracts/

    finanzas/
      contracts/
      entities/

    personas/
      contracts/
      entities/

    contabilidad/
      contracts/
      entities/

  docs/
    core/
    ventas/
    compras/
    inventario/
    tesoreria/
    finanzas/
    personas/
    contabilidad/
```

## Criterio de clasificacion

### `contracts/`

Usar cuando el artefacto:

- define lenguaje compartido;
- modela forma y significado de negocio;
- no encapsula invariantes complejas;
- puede existir sin comportamiento rico.

Ejemplos esperados:

- `Pedido`
- `ICompra`
- `MovimientoCaja`
- `CuentaCliente`
- `Cliente`
- `Proveedor`

### `entities/`

Usar cuando el artefacto:

- mantiene identidad;
- encapsula invariantes;
- expone transiciones de estado o reglas de negocio;
- no es mera serializacion.

Ejemplos observados hoy:

- `Venta`
- `CarritoVenta`
- `Compra`
- `RecurrenciaEntity`
- `Usuario`
- `AsientoContable`

### `events/`

Usar cuando el artefacto:

- representa hecho pasado del dominio;
- se nombra en pasado;
- comunica cambio relevante sin acoplar infraestructura.

Ejemplo observado hoy:

- `VentaConfirmada`

### `shared/`

Usar solo cuando el artefacto:

- no pertenece razonablemente a un solo Domain;
- seria duplicado en multiples contextos;
- expresa lenguaje estructural y no negocio local.

## Estrategia de publicacion

### Publicacion raiz

La raiz debe mantenerse minima. Recomendacion:

- `shared/base`
- `shared/value-objects`
- `shared/kernel`
- `shared/utils`
- algunos simbolos estrategicos como `Venta` o `RecurrenciaEntity` solo si tienen valor transversal y estable.

### Publicacion por subpath

La mayor parte del consumo de negocio migro hacia subpaths por Domain.

Ejemplo conceptual:

```ts
import type { Pedido } from "yola-fresh-utils/ventas/contracts";
import { Venta } from "yola-fresh-utils/ventas";
import type { CuentaCliente } from "yola-fresh-utils/finanzas/contracts";
```

## Migracion ejecutada

### Normalizacion estructural

- se crearon carpetas `contracts/`, `entities` y `events` por dominio;
- se movieron entidades ricas a sus bounded contexts propietarios;
- `CuentaCliente` fue absorbido dentro de `finanzas`.

### Reduccion de `shared`

- `shared/interfaces` fue eliminado;
- `shared/` quedo limitado a `base`, `kernel`, `utils` y `value-objects`.

### Endurecimiento de publication surface

- la raiz quedo reducida a pocos simbolos transversales;
- la publicacion oficial ahora usa subpaths por dominio;
- el build publico solo `dist`.

### Estabilizacion

- la convencion contractual quedo fijada en `*.contract.ts`;
- documentacion y codigo quedaron alineados a misma topologia.

## Convenciones recomendadas

- contratos: `*.contract.ts` o `index.ts` por carpeta `contracts/`;
- entidades: nombre del concepto, por ejemplo `Venta.ts`;
- eventos: pasado, por ejemplo `VentaConfirmada.ts`;
- evitar nombres ambiguos como `helpers.ts`, `tools.ts`, `misc.ts` o `utilsVenta.ts`;
- cada Domain debe tener barrel propio y documentacion modular propia.

## Impacto esperado

### Beneficios

- ownership de dominio mas claro;
- mejor navegacion del codigo;
- menor probabilidad de mezclar infraestructura o conveniencia tecnica con lenguaje de negocio;
- mejor capacidad de crecimiento hacia monorepo o paquetes por Domain si algun dia hace falta;
- mejor alineacion entre codigo y documentacion.

### Costos

- migracion de imports internos;
- ajuste de barrels y scripts de exports;
- limpieza documental integral;
- gobernanza mas estricta para `shared/`.

## Riesgos residuales

- consumers legacy deben migrar a nuevos subpaths;
- algunos documentos historicos todavia pueden mencionar rutas anteriores;
- `ledger` sigue siendo contrato auxiliar y debe usarse con cautela.

## Alternativas consideradas

### Mantener estructura actual

Ventaja:

- no requiere migracion inmediata.

Desventaja:

- mantiene ambiguedad en ownership de contratos;
- deja `shared/interfaces` como punto de crecimiento desordenado.

### Saltar directo a monorepo por Domain

Ventaja:

- maxima separacion.

Desventaja:

- costo operativo alto para estado actual del proyecto;
- complejidad innecesaria antes de estabilizar dominios y surface publica.

## Recomendacion final

La evolucion mas recomendable para `yolafresh-utils` no es convertirlo en framework o servicio, sino consolidarlo como **libreria de dominio organizada por Domains**.

La mejor ruta es:

1. normalizar estructura por Domain dentro del mismo paquete;
2. reducir `shared/` al minimo transversal;
3. mantener raiz pequena;
4. empujar consumo por subpath;
5. hacer que documentacion y codigo compartan la misma topologia.

## Cierre

RFC aceptado e implementado.

La estructura vigente del paquete pasa a ser referencia arquitectonica oficial para cambios futuros.

## Decisiones vigentes post-implementacion

- `Compra`, `Usuario` y `AsientoContable` permanecen como entidades con comportamiento en estructura vigente;
- `ledger-auxiliar.contract.ts` queda como contrato auxiliar histórico explícitamente separado del núcleo canónico;
- la convención `*.contract.ts` se adopta como patrón vigente para contratos de dominio;
- la raíz mantiene publicación mínima con símbolos estratégicos y resto del consumo por subpaths.

## Referencias

- [README.md](./README.md)
- [arquitectura-vigente.md](./arquitectura-vigente.md)
- [contratos-compartidos.md](./contratos-compartidos.md)
- [../../domain/README.md](../../domain/README.md)
- [../../index.ts](../../index.ts)
