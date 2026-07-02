# Inventario técnico de `yolafresh-utils`

> Documento histórico de apoyo.
> La lectura vigente del paquete debe empezar en [core/README.md](./core/README.md).
> Si este archivo contradice `core/`, `ventas/` o `cuenta-cliente/`, prevalece la documentación modular vigente.

## Propósito

Este documento conserva una vista técnica resumida del estado actual del repositorio después del saneamiento hacia un enfoque de contratos de negocio.

No describe el detalle funcional de cada Domain. Su responsabilidad es responder:

- qué áreas siguen existiendo en `src/domain/`;
- qué piezas forman parte de la surface pública raíz;
- qué módulos quedaron como soporte contractual o comportamiento de dominio;
- qué activos históricos ya no deben interpretarse como publicación canónica.

## Estructura actual observada

La fuente principal vive en `src/`. En particular:

- `src/domain/` contiene contratos, primitivas y algunos agregados o entidades con invariantes;
- `src/index.ts` publica la raíz del paquete;
- `src/docs/` contiene la documentación de dominio e historial.

## Capas vigentes

### `shared/interfaces`

Responsabilidad observada:

- concentrar el mayor volumen de contratos compartidos del negocio;
- publicar vocabulario de producto, inventario, compras, pedidos, pagos, caja, finanzas, cuenta cliente, personas y organización;
- centralizar enums y configuración fiscal canónica.

Evidencia principal:

- `producto.ts`
- `Inventario.ts`
- `compras.ts`
- `pedido.ts`
- `pagos.ts`
- `caja.ts`
- `finanzas.ts`
- `customer-account.ts`
- `persons.ts`
- `usuario.ts`
- `enums.ts`
- `fiscales.ts`

### `shared/utils`

Responsabilidad observada:

- soporte mínimo de tiempo e identidad temporal para el resto del core.

Publica hoy solo:

- `DateUtils`
- `generarUlid`
- `UnixMillis`
- `ISODateString`
- `ISODateOnly`

Lectura importante:

- ya no es bolsa general de helpers;
- ya no publica transforms, mappers, helpers de UI, RBAC, multimedia ni adaptadores.

### `shared/base`

Responsabilidad observada:

- primitivas DDD reutilizables del paquete.

Piezas vigentes:

- `Entity`
- `AggregateRoot`
- `ValueObject`
- `DomainEvent`

### `shared/value-objects`

Responsabilidad observada:

- publicar `Value Object` transversales de identidad organizacional.

Piezas vigentes:

- `EmpresaId`
- `SucursalId`

## Módulos de comportamiento todavía presentes

Aunque el paquete se movió hacia contratos de negocio, todavía conserva algunos módulos con comportamiento explícito:

### `ventas`

Piezas vigentes observadas:

- `Venta`
- `CarritoVenta`
- `VentaSnapshot`
- `VentaConfirmada`

Lectura correcta:

- `CarritoVenta` modela captura mutable;
- `Venta` modela hecho comercial confirmado;
- `VentaSnapshot` preserva representación histórica visible;
- cobro, caja, cuenta cliente e inventario quedan fuera del contrato primario de `Venta`.

### `finanzas`

Pieza vigente observada:

- `RecurrenciaEntity`

Lectura correcta:

- la librería mantiene contratos de recurrencia en `shared/interfaces/recurrencias.ts`;
- la entidad calcula y reprograma `siguienteEjecucionAt`;
- ya no existe `RecurrenciaProcessor` dentro del repositorio actual.

### `compras`

Pieza vigente observada:

- `Compra`

Lectura correcta:

- representa compra formal basada en `ICompra`;
- conserva reglas de integridad, confirmación, cierre, anulación y pago;
- no implica que la raíz del paquete la publique directamente.

## Dominios contractuales relevantes

Además de los módulos con comportamiento, el repositorio mantiene contratos importantes en:

### Inventario

Contratos observados en `Inventario.ts`:

- `Almacen`
- `StockPresentacionAlmacen`
- `MovimientoInventario`
- `Transferencia`
- `RecepcionMercaderia`
- `KardexLinea`

Lectura correcta:

- el paquete define vocabulario e invariantes contractuales de inventario;
- ya no existe `MovimientoInventarioService` como servicio operativo del core.

### Tesorería y pagos

Contratos observados:

- `MovimientoCaja`
- `CierreCaja`
- `Pago`
- `EstadoPagoCapturaEnum`

Lectura correcta:

- siguen siendo contratos del lenguaje compartido;
- no reemplazan a `Venta`, `CuentaCliente` ni a la orquestación operativa del consumer.

### Cuenta cliente

Contratos observados:

- `CuentaCliente`
- `MovimientoCuentaCliente`
- `ImputacionCuentaCliente`
- `RecepcionCobroCliente`
- `TransferenciaCustodiaCobro`
- `ResumenCuentaCliente`

Se documentan en detalle en [cuenta-cliente/README.md](./cuenta-cliente/README.md).

### Organización y actores

Contratos observados:

- `Cliente`
- `Personal`
- `Proveedor`
- `IUsuario`
- `Entidad`
- `Rol`
- `Permisos`

Lectura correcta:

- hoy prevalecen los contratos de identidad y autorización;
- ya no existen utilidades RBAC ni validadores operativos como parte del core vigente.

## Surface pública raíz

La raíz del paquete publica hoy:

- `shared/interfaces`
- `shared/utils`
- `shared/base`
- `shared/value-objects`
- `Venta`
- `CarritoVenta`
- `VentaSnapshot`
- `RecurrenciaEntity`

Evidencia: `src/index.ts`.

## Publicación secundaria observada

`package.json` mantiene subpath exports para módulos bajo `domain/`.

Lectura importante:

- la raíz del paquete no expresa toda la amplitud del repositorio;
- algunos activos, como `Compra`, siguen disponibles por subpath;
- los subpaths no convierten automáticamente esos módulos en surface canónica de primer nivel.

## Qué ya no forma parte del core vigente

La limpieza reciente removió o dejó fuera de publicación canónica:

- mappers y transforms de persistencia;
- helpers de UI, DOM y frontend;
- multimedia e íconos;
- RBAC utilitario;
- snapshots técnicos de persistencia;
- processors, factories y services operativos;
- contratos laterales retirados de la raíz pública.

## Riesgos documentales detectados

Durante la auditoría de este documento se identificaron contradicciones históricas ya corregidas:

- referencias a `MovimientoInventarioService`, `RecurrenciaProcessor`, `PermisoValidator` y `utilsVenta`;
- referencias a `snapshots.ts` y otros artefactos eliminados;
- descripción antigua de `shared/utils` como bolsa general de helpers;
- lectura antigua del paquete como librería mixta de frontend, integración y dominio.

## Pendiente de validación

- si `Compra` debe seguir siendo parte del repositorio publicado o migrar completamente a publicación secundaria especializada;
- si `ledger.ts` permanecerá como contrato auxiliar histórico o se dividirá en contratos más específicos;
- si habrá una documentación modular propia para `compras`, `finanzas` o `inventario` más allá de este inventario técnico.

## Referencias

- [README.md](../README.md)
- [README.md](./README.md)
- [core/README.md](./core/README.md)
- [core/arquitectura-vigente.md](./core/arquitectura-vigente.md)
- [ventas/README.md](./ventas/README.md)
- [cuenta-cliente/README.md](./cuenta-cliente/README.md)
