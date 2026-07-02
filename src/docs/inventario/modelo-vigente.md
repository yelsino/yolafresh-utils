# Modelo Vigente de Inventario

## Visión general

El Domain de inventario modela dónde está el stock, cuánto hay, cómo se mueve y cómo se audita su trazabilidad física.

La evidencia vigente está en:

- [inventario.contract.ts](../../domain/inventario/contracts/inventario.contract.ts)
- [producto.contract.ts](../../domain/inventario/contracts/producto.contract.ts)

## Conceptos principales

### `Almacen`

Representa un punto físico u operativo donde existe stock.

Responsabilidades observadas:

- identificar almacén y su tipo;
- expresar si permite lotes o negativos;
- conservar ubicación, capacidad y responsable cuando existen.

### `StockPresentacionAlmacen`

Representa stock por presentación y almacén.

Responsabilidades observadas:

- expresar stock actual, reservado y disponible;
- conservar costo promedio y valorización del inventario;
- soportar límites operativos y lotes cuando aplican.

Lectura importante del contrato:

- el stock no vive en la presentación como catálogo;
- el inventario se normaliza por almacén y presentación.

### `StockLoteAlmacen`

Representa stock específico por lote.

Responsabilidades observadas:

- identificar lote;
- conservar fecha de vencimiento;
- declarar cantidad disponible en un almacén.

### `MovimientoInventario`

Representa hecho que modifica stock.

Responsabilidades observadas:

- declarar tipo de movimiento;
- enlazar documento de origen;
- registrar almacén origen y destino cuando aplica;
- mantener items, usuario y fecha del movimiento.

### `Transferencia`

Representa traspaso de stock entre almacenes.

Responsabilidades observadas:

- enlazar almacén origen y destino;
- mantener items y estado de la transferencia;
- conservar usuario solicitante y receptor cuando existen.

### `RecepcionMercaderia`

Representa ingreso físico de mercadería asociado a abastecimiento.

Responsabilidades observadas:

- identificar `eventoCompraId`;
- declarar almacén destino;
- conservar items recibidos;
- expresar estado de recepción.

### `KardexLinea`

Representa línea derivada de movimiento para trazabilidad de inventario.

Responsabilidades observadas:

- conservar entrada o salida;
- registrar costo unitario y costo total;
- expresar stock final y costo promedio final.

### `AsignacionRecepcionCompra`

Representa vínculo entre recepción y compra.

Responsabilidades observadas:

- enlazar recepción, compra e item de compra;
- declarar cantidad asignada.

## Estados y clasificaciones

### Tipo de almacén

- `CENTRAL`
- `TIENDA`
- `TRANSITO`
- `MOSTRADOR`

### Tipo de movimiento de inventario

- `ENTRADA`
- `SALIDA`
- `AJUSTE`
- `TRANSFERENCIA`

### Estado de movimiento

- `PENDIENTE`
- `APLICADO`
- `ANULADO`

### Origen del documento

- `COMPRA`
- `VENTA`
- `AJUSTE`
- `TRANSFERENCIA`
- `PRODUCCION`
- `MERMA`
- `DEVOLUCION`
- `INVENTARIO_FISICO`

### Estado de transferencia

- `PENDIENTE`
- `EN_TRANSITO`
- `RECIBIDO`
- `ANULADO`

### Estado de recepción de mercadería

- `BORRADOR`
- `CONFIRMADA`
- `ANULADA`

## Reglas de negocio respaldadas por evidencia

- solo `MovimientoInventario` modifica stock de forma canónica;
- el stock se controla por almacén y presentación, no solo por producto;
- una transferencia requiere almacén origen y destino;
- una recepción de mercadería se vincula a `eventoCompraId`;
- `MovimientoInventario` debe identificar usuario y fecha del movimiento;
- `KardexLinea` es derivada de movimientos, no documento primario.

## Relaciones de negocio

### Con `Ventas`

Una venta puede originar `MovimientoInventario` con salida, pero la venta no define stock por sí sola.

### Con `Compras`

La compra expresa hecho económico; `RecepcionMercaderia` expresa ingreso físico; `MovimientoInventario` expresa impacto real.

### Con `Producto`

El catálogo define `ProductoBase`, `Presentacion` y equivalencias. Inventario opera sobre presentaciones y almacenes.

## Restricciones observadas

- el contrato mantiene algunos campos con comentarios de deuda técnica, como `stockDisponible`;
- la librería no publica un servicio operativo de aplicación de stock;
- la validación de disponibilidad previa a venta queda fuera del agregado `Venta`.

## Pendiente de validación

- criterio uniforme para uso de `PENDIENTE` frente a `APLICADO` en todos los consumers;
- política oficial para stock negativo por almacén;
- uso futuro de `UpdateProducto` como contrato vigente o residual.

## Referencias

- [README.md](./README.md)
- [../ventas/README.md](../ventas/README.md)
- [../compras/README.md](../compras/README.md)
