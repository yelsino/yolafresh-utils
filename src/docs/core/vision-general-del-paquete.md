# Visión General del Paquete

## Propósito

Este documento explica qué representa `yolafresh-utils`, por qué existe dentro del ecosistema YolaFresh y qué valor aporta a un consumer nuevo.

La evidencia principal vive en:

- [src/index.ts](../../index.ts)
- [arquitectura-vigente.md](./arquitectura-vigente.md)
- [contratos-compartidos.md](./contratos-compartidos.md)
- [README.md](../../../README.md)

## ¿Qué es `yolafresh-utils`?

`yolafresh-utils` es biblioteca TypeScript que preserva lenguaje compartido del negocio para el ecosistema YolaFresh.

Su responsabilidad actual es concentrar:

- contratos canónicos de negocio;
- clasificaciones y estados oficiales;
- primitivas de dominio;
- algunos Aggregate o entidades ricas con invariantes;
- puntos de publicación estables por dominio.

## ¿Por qué existe?

El paquete existe para evitar que cada aplicación del ecosistema redefina por su cuenta conceptos críticos del negocio.

Sin este paquete, cada consumer tendería a reinterpretar de forma distinta:

- qué es una `Venta`;
- qué representa un `Pago`;
- cuándo una `Venta` afecta `CuentaCliente`;
- cómo se expresa `MovimientoCaja`;
- cómo se modela stock, compra, recurrencia o asiento contable.

La librería reduce esa deriva semántica al fijar contratos y límites comunes.

## ¿Qué problema resuelve?

### Lenguaje compartido

Permite que app, backend u otros consumers hablen mismo idioma de negocio.

### Separación conceptual

Evita mezclar en una sola entidad conceptos que pertenecen a dominios distintos.

Ejemplos respaldados por documentación vigente:

- `Venta` no reemplaza a `Pago`;
- `Venta` no reemplaza a `MovimientoCaja`;
- `Venta` no reemplaza a `MovimientoCuentaCliente`;
- `ResumenCuentaCliente` no reemplaza ledger oficial.

Lectura importante:

- `Pago` no equivale a venta confirmada;
- `Pago` puede existir como evidencia externa sin quedar asociado a una venta;
- esa orfandad no implica inconsistencia del dominio.

### Estabilidad del dominio

Centraliza contratos canónicos para que evolución del negocio ocurra de forma explícita y auditable.

## ¿Qué no es este paquete?

`yolafresh-utils` no es:

- framework de aplicación;
- capa de infraestructura;
- adaptador a CouchDB, SQLite, HTTP o mensajería;
- colección de helpers de frontend;
- motor de sincronización;
- conjunto de services operativos.

## ¿Qué valor aporta a un nuevo integrante?

Le permite entender rápidamente:

- qué conceptos existen en negocio;
- qué conceptos están separados de forma intencional;
- qué dominio es dueño de cada contrato;
- qué piezas pueden consumirse desde raíz y cuáles por subpath.

## Mapa de valor por dominio

### `ventas`

Existe para modelar hecho comercial, captura previa y snapshot histórico sin contaminar venta con cobro, caja o stock.

### `tesoreria`

Existe para modelar operación diaria del dinero recibido o movido en caja.

### `finanzas`

Existe para modelar relación monetaria más allá de operación de caja: ingresos, egresos, cuentas, recurrencias y cuenta cliente.

### `inventario`

Existe para modelar stock, movimientos y recepciones físicas sin mezclarlo con documento comercial o financiero.

### `compras`

Existe para modelar abastecimiento económico a proveedor como documento distinto de recepción física y pago.

### `personas`

Existe para modelar actores reales del negocio, identidad digital y autorización.

### `contabilidad`

Existe para modelar registro balanceado posterior o consolidado, no operación comercial directa.

## Regla de lectura correcta

Cuando un concepto parezca cercano a otro, la pregunta útil es:

> ¿Qué verdad de negocio preserva este módulo que otro módulo no debe absorber?

Esa pregunta explica por qué la librería separa:

- venta de cobro;
- caja de cuenta cliente;
- compra de recepción;
- finanzas de contabilidad;
- actor real de cuenta digital.

## Cuándo conviene consumirlo

Conviene usar `yolafresh-utils` cuando un consumer necesita:

- hablar idioma oficial del negocio;
- compartir contratos entre capas o apps;
- preservar límites de dominio;
- evitar redefinir enums, estados y estructuras canónicas.

## Limitaciones conocidas

- la librería no ejecuta procesos operativos completos;
- algunos dominios conservan entidades ricas además de contratos;
- documentos históricos todavía existen como contexto, pero no deben reemplazar la documentación oficial.

## Criterio vigente

- el paquete conserva entidades ricas solo donde hoy existe comportamiento e invariantes explícitos;
- `shared/kernel` permanece mínimo y solo aloja contratos realmente transversales ya observables en código;
- cualquier concepto nuevo debe demostrar transversalidad real antes de entrar al kernel compartido.

## Referencias

- [README.md](../../../README.md)
- [README.md](./README.md)
- [arquitectura-vigente.md](./arquitectura-vigente.md)
- [../ventas/README.md](../ventas/README.md)
- [../finanzas/README.md](../finanzas/README.md)
