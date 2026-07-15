# Modelo Vigente de Pedido

## Propósito

Este documento fija la lectura canónica del Domain `pedido` a partir de los contratos publicados hoy por `yolafresh-utils`.

## Conceptos principales

### `Pedido`

`Pedido` representa una reserva comercial activa o histórica hecha por un cliente.

Responsabilidades observadas:

- identificar la reserva;
- vincular cliente y responsable operativo;
- congelar items solicitados y avance de atención;
- modelar prioridad y procedencia;
- registrar fecha programada y vencimiento opcional;
- dejar trazabilidad de conversión hacia `Venta`.

No representa:

- cobro;
- pago;
- caja;
- facturación;
- salida de stock;
- entrega física final.

### `PedidoEntrega`

`PedidoEntrega` representa seguimiento operativo/logístico del pedido.

Responsabilidades observadas:

- expresar modalidad `RECOJO` o `DESPACHO`;
- indicar responsable operativo actual;
- registrar fecha programada, salida y entrega;
- mantener historial de estados y observaciones;
- comunicar progreso como preparación, despacho, ruta o entrega.

No representa:

- reserva comercial primaria;
- cobro;
- deuda;
- movimiento de inventario.

## Estados comerciales

### `PedidoState`

- `ABIERTO`
- `PARCIALMENTE_ATENDIDO`
- `ATENDIDO`
- `CONVERTIDO`
- `CANCELADO`
- `VENCIDO`

Lectura correcta:

- `ABIERTO`: pedido vigente y pendiente de atención total;
- `PARCIALMENTE_ATENDIDO`: una parte fue cubierta y otra queda pendiente;
- `ATENDIDO`: todo el pedido fue cubierto comercialmente, pero todavía no necesariamente existe `Venta`;
- `CONVERTIDO`: el pedido ya originó una `Venta`;
- `CANCELADO`: reserva cerrada por decisión operativa/comercial;
- `VENCIDO`: reserva fuera de vigencia temporal según `fechaVencimiento`.

## Estados logísticos

### `PedidoEntregaState`

- `PENDIENTE`
- `EN_PREPARACION`
- `LISTO_PARA_RECOJO`
- `DESPACHADO`
- `EN_RUTA`
- `ENTREGADO`
- `NO_ENTREGADO`
- `CANCELADO`

Lectura correcta:

- `PENDIENTE`: todavía no inicia preparación ni salida;
- `EN_PREPARACION`: se está alistando pedido para entrega o recojo;
- `LISTO_PARA_RECOJO`: cliente ya puede recoger;
- `DESPACHADO`: pedido salió del punto operativo;
- `EN_RUTA`: pedido está en tránsito;
- `ENTREGADO`: entrega física completada;
- `NO_ENTREGADO`: hubo intento fallido o corte operativo;
- `CANCELADO`: flujo logístico ya no seguirá.

## Contratos nucleares

### `Pedido`

Campos canónicos observados:

- `id`
- `type`
- `codigoPedido`
- `estado`
- `prioridad`
- `procedencia`
- `clienteId`
- `responsableId`
- `creadoPorId`
- `ventaId`
- `fechaPedido`
- `fechaProgramada`
- `fechaVencimiento`
- `observaciones`
- `items`
- `subtotal`
- `total`
- `createdAt`
- `updatedAt`

### `PedidoItem`

Campos canónicos observados:

- `id`
- `presentacionId`
- `cantidadSolicitada`
- `cantidadAtendida`
- `precioUnitario`
- `subtotal`

Lectura importante:

- pendiente por item = `cantidadSolicitada - cantidadAtendida`;
- `subtotal` de item congela monto de línea en el pedido;
- `Pedido` no modela cancelación por línea como campo propio.

### `PedidoEntrega`

Campos canónicos observados:

- `id`
- `type`
- `pedidoId`
- `estado`
- `modalidad`
- `responsableId`
- `fechaProgramada`
- `fechaSalida`
- `fechaEntrega`
- `observaciones`
- `historial`
- `createdAt`
- `updatedAt`

### `PedidoEntregaSeguimiento`

Campos canónicos observados:

- `id`
- `estado`
- `fecha`
- `responsableId`
- `observaciones`

## Evidencias

El paquete no embebe evidencias dentro de `Pedido` ni de `PedidoEntrega`.

Relación observada:

- `Evidencia.entidadReferencia = "PEDIDO"` para evidencia del pedido;
- `Evidencia.entidadReferencia = "PEDIDO_ENTREGA"` para evidencia del seguimiento/entrega.

## Preguntas abiertas

- si en una siguiente iteración hará falta distinguir responsable comercial y responsable logístico con contratos distintos;
- si `Pedido` necesitará versión futura de programación recurrente o múltiples ventanas horarias.

## Referencias

- [README.md](./README.md)
- [relaciones-interdominio.md](./relaciones-interdominio.md)
- [../ventas/modelo-vigente.md](../ventas/modelo-vigente.md)
