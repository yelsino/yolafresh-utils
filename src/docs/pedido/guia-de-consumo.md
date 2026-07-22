# Guía de Consumo del Domain de Pedido

## Propósito

Este documento describe cómo debe interpretar un consumer el Domain `pedido` expuesto por `yolafresh-utils`.

## Secuencia funcional recomendada

### 1. Crear reserva comercial

Usar `Pedido` para:

- identificar la reserva con `codigoPedido`;
- vincular `clienteId` y `responsableId`;
- capturar `prioridad`, `procedencia` y `observaciones`;
- fijar `fechaPedido`, `fechaProgramada` y `fechaVencimiento` cuando aplique;
- congelar items y montos del pedido.

Cada `PedidoItem` debe conservar `nombre`. Puede conservar además
`montoModificado`, `unidadComercial` e `imagenUrl` para renderizar el histórico
sin depender del catálogo vivo.

### 2. Atender pedido

Usar `PedidoState` para lectura comercial:

- `ABIERTO`: reserva vigente;
- `PARCIALMENTE_ATENDIDO`: avance parcial;
- `ATENDIDO`: cobertura total sin conversión aún;
- `CONVERTIDO`: ya originó `Venta`;
- `CANCELADO`: reserva cerrada;
- `VENCIDO`: reserva fuera de vigencia.

Pendiente por item:

- `cantidadSolicitada - cantidadAtendida`

### 3. Seguir preparación, despacho o recojo

Usar `PedidoEntrega` para:

- saber si se está preparando;
- saber si ya está listo para recojo;
- saber si salió a despacho;
- saber si está en ruta;
- saber si ya fue entregado;
- mantener historial de seguimiento con responsable y observaciones.

### 4. Relacionar evidencias

Usar `Evidencia` por referencia externa:

- `PEDIDO`
- `PEDIDO_ENTREGA`

No embebas archivos o blobs dentro del pedido.

### 5. Convertir a venta

Cuando operación se confirma comercialmente:

- crear `Venta`;
- relacionar `Venta.pedidoId`;
- opcionalmente completar `Pedido.ventaId`;
- mover pedido a `CONVERTIDO` cuando corresponda.

Al crear la venta, `Venta.items` recibe el número de líneas y el detalle pasa al
`VentaSnapshot` asociado.

## Errores de modelado a evitar

- meter `DESPACHADO`, `EN_RUTA` o `ENTREGADO` dentro de `PedidoState`;
- meter `PAGO_PENDIENTE`, `PAGADO` o `FACTURADO` dentro de `PedidoState`;
- usar `Pedido` como reemplazo de `Venta`;
- usar `PedidoEntrega` como reemplazo de `MovimientoInventario`;
- duplicar evidencias embebiendo arrays propios cuando ya existe `Evidencia`.
- omitir `PedidoItem.nombre` o reconstruirlo posteriormente desde catálogo vivo;
- copiar `PedidoItem[]` dentro de `Venta`, cuyo campo `items` ahora es un conteo.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [relaciones-interdominio.md](./relaciones-interdominio.md)
