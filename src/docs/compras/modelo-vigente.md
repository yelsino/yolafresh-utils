# Modelo Vigente de Compras

## Visión general

El Domain de compras modela la adquisición económica de mercadería o insumos a proveedor como documento separado de la recepción física y del movimiento financiero. “Formal” no es un tipo de flujo publicado por el contrato.

La evidencia vigente está en:

- [compra.contract.ts](../../domain/compras/contracts/compra.contract.ts)
- [Compra.ts](../../domain/compras/entities/Compra.ts)

## Conceptos principales

### `EventoCompra`

Representa un contexto agrupador para compras relacionadas.

Responsabilidades observadas:

- identificar responsable del evento;
- registrar origen y destino;
- conservar estado general del proceso;
- permitir agrupación de items o compras asociadas.

### `EventoCompraItem`

Representa relación entre evento de compra, proveedor e item tentativo o asociado.

Responsabilidades observadas:

- vincular un proveedor dentro del evento;
- conservar una proyección parcial de `CompraItem`.

El item de evento es preparación. Puede admitir información todavía incompleta según el consumer, pero antes de consolidar una compra o afectar inventario debe satisfacer las invariantes del contrato de destino.

### `ICompra`

Representa el contrato canónico de una compra.

Responsabilidades observadas:

- identificar proveedor y documento de compra;
- conservar fechas de documento y registro;
- expresar moneda, subtotal, impuestos, descuentos y total;
- declarar condición y estado de pago;
- mantener items comprados;
- vincular la compra a un `eventoCompraId`.

### `Compra`

Representa una entidad de dominio rica basada en `ICompra`.

Responsabilidades observadas:

- validar integridad del documento;
- confirmar, cerrar, anular y registrar pago;
- mantener consistencia entre subtotal, impuestos, descuentos, gastos e items.

### `CompraItem`

Representa renglón económico de una compra.

Responsabilidades observadas:

- identificar presentación y producto base cuando existe;
- conservar cantidad, costo unitario y costo total;
- declarar si afecta inventario;
- congelar `presentacionId`, `productoBaseId`, `factorUnidadBase`,
  `unidadBaseInventario` y `versionConversion` cuando afecta inventario;
- registrar lote o fecha de vencimiento cuando aplica.

Un `CompraItemInventariable` conserva la conversión usada al capturarlo; no es
una referencia para volver a consultar la conversión mutable de la presentación.
`versionConversion` empieza en 1 y debe ser un entero seguro positivo. Un
`CompraItemNoInventariable` puede omitir por completo estos metadatos físicos.

### `CompraEgresoRef`

Representa referencia entre compra y egreso aplicado.

Responsabilidades observadas:

- vincular salida financiera a compra;
- declarar monto aplicado.

## Estados y lifecycle

### `EstadoCompraEnum`

- `BORRADOR`
- `CONFIRMADO`
- `CERRADO`
- `ANULADO`

Lectura de negocio observada:

- `BORRADOR`: compra editable y todavía no consolidada;
- `CONFIRMADO`: compra validada comercialmente;
- `CERRADO`: compra completada y cerrada;
- `ANULADO`: compra revertida por flujo explícito.

### `EstadoEventoCompraEnum`

- `EN_REGISTRO`
- `CONFIRMADO`
- `CERRADO`
- `CANCELADO`

### Estado de pago

La compra usa `EstadoPagoEnum` del core compartido para expresar situación de pago.

## Reglas de negocio respaldadas por evidencia

- no puede existir `Compra` sin `id`;
- no puede existir `Compra` sin `eventoCompraId`;
- no puede existir `Compra` sin `proveedorId`;
- una compra debe tener al menos un item;
- `subtotal` debe ser consistente con suma de items;
- `total` debe ser consistente con subtotal, impuestos, descuentos y gastos adicionales;
- en `CREDITO`, `fechaVencimientoPago` es obligatoria;
- en `CONTADO`, `fechaVencimientoPago` no aplica;
- todo item inventariable exige presentación, producto base, factor positivo,
  unidad base de inventario y una `versionConversion` entera segura positiva;
- no se puede confirmar una compra anulado o fuera de `BORRADOR`;
- no se puede cerrar una compra fuera de `CONFIRMADO`;
- no se puede anular una compra `CERRADO`.

## Relaciones de negocio

### Con `Proveedor`

La compra conserva `proveedorId` y snapshots de nombre o RUC, pero no reemplaza al contrato maestro del proveedor.

### Con `Inventario`

La compra no implica por sí sola ingreso físico a stock.

La recepción física y el impacto de inventario descansan en:

- `RecepcionMercaderia`
- `MovimientoInventario`

La secuencia canónica es:

    Compra aprobada o registrada
      → RecepcionMercaderia BORRADOR
      → RecepcionMercaderia CONFIRMADA
      → AsignacionRecepcionCompra
      → MovimientoInventario ENTRADA/APLICADO
      → Stock + Kardex

Una recepción en borrador no modifica stock. Una compra, aunque esté confirmada, tampoco modifica stock por sí sola.

### Con `Finanzas`

La compra puede relacionarse con:

- `Egreso` mediante `CompraEgresoRef`;
- `MovimientoCuentaProveedor` como efecto financiero con proveedor.

### Con `Documentos comerciales`

La compra declara tipo, serie y número de documento, pero no reemplaza al contrato transversal `DocumentoComercial`.

## Restricciones observadas

- moneda observada: `PEN` y `USD`;
- `Compra` está publicada en el subpath `yola-fresh-utils/compras` y `yola-fresh-utils/compras/entities`; la raíz pública expone los contratos, no la entidad rica;
- la recepción física se documenta fuera del Domain de compras puro.

## Decisiones vigentes observables

- `Compra` solo puede pasar de `CONFIRMADO` a `CERRADO` mediante transición explícita del agregado;
- `CompraItem.afectaInventario` permite compras con o sin impacto de inventario según cada ítem;
- `eventoCompraId` es obligatorio en `ICompra`, por lo que la compra vigente siempre nace vinculada a un evento de compra.

El selector `FORMAL/INFORMAL` observado en un consumer no forma parte de estos
contratos. La propuesta para reemplazarlo por las dimensiones independientes de
flujo, documento, recepción y pago está en
[rfc-compra-directa.md](./rfc-compra-directa.md). Mientras el RFC no sea aprobado,
`TipoFlujoCompraEnum`, `EstadoDocumentarioCompraEnum` y
`LIQUIDACION_COMPRA` no deben considerarse APIs publicadas.

## Dimensiones de estado que no deben confundirse

El estado comercial de Compra, el estado físico de Recepción y el estado financiero son independientes:

| Dimensión | Contrato | Pregunta que responde |
|---|---|---|
| Compra | `EstadoCompraEnum` | ¿El documento está en borrador, aprobado, cerrado o anulado? |
| Recepción | `EstadoRecepcionMercaderiaEnum` | ¿La mercadería fue físicamente confirmada? |
| Pago | `EstadoPagoEnum` | ¿La obligación está pendiente, parcial o pagada? |

Un consumer no debe inferir automáticamente una dimensión a partir de otra, salvo una política de negocio compartida y explícita.

## Invariantes interdominio

- una Compra no cambia stock;
- una Recepción BORRADOR no cambia stock;
- solo un MovimientoInventario aplicado cambia stock;
- una asignación no puede superar la cantidad del CompraItem;
- la suma de recepciones parciales determina el pendiente físico;
- `factorUnidadBase` pertenece a la unidad comprada y convierte cantidad comprada a unidad base;
- `unidadBaseInventario` y `versionConversion` pertenecen al mismo snapshot de
  conversión que `factorUnidadBase`; no se completan consultando catálogo al recibir;
- `equivalenciaUnidadBase` de una presentación comercial no reemplaza a `factorUnidadBase` del CompraItem;
- todo movimiento físico debe tener una clave de presentación/unidad de movimiento inequívoca;
- un Egreso no sustituye la Compra ni la Recepción;
- un pago debe asignarse explícitamente a la obligación del proveedor para derivar `estadoPago`.

## Referencias

- [README.md](./README.md)
- [integracion-pos-offline-first.md](./integracion-pos-offline-first.md)
- [rfc-compra-directa.md](./rfc-compra-directa.md)
- [../inventario/README.md](../inventario/README.md)
- [../finanzas/README.md](../finanzas/README.md)
