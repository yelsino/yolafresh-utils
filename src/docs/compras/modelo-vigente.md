# Modelo Vigente de Compras

## Visión general

El Domain de compras modela la adquisición formal de mercadería o insumos a proveedor como documento económico separado de la recepción física y del movimiento financiero.

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
- conservar factor de conversión a unidad base;
- registrar lote o fecha de vencimiento cuando aplica.

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

### Con `Finanzas`

La compra puede relacionarse con:

- `Egreso` mediante `CompraEgresoRef`;
- `MovimientoCuentaProveedor` como efecto financiero con proveedor.

### Con `Documentos comerciales`

La compra declara tipo, serie y número de documento, pero no reemplaza al contrato transversal `DocumentoComercial`.

## Restricciones observadas

- moneda observada: `PEN` y `USD`;
- `Compra` sigue siendo módulo con comportamiento, pero no está publicado en la raíz del paquete;
- la recepción física se documenta fuera del Domain de compras puro.

## Pendiente de validación

- criterio funcional exacto para pasar de `CONFIRMADO` a `CERRADO`;
- política uniforme para compras sin impacto de inventario;
- nivel de obligatoriedad futura de `EventoCompra` en todos los consumers del ecosistema.

## Referencias

- [README.md](./README.md)
- [../inventario/README.md](../inventario/README.md)
- [../finanzas/README.md](../finanzas/README.md)
