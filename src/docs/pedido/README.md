# Pedido

## Propósito

Este directorio agrupa la documentación oficial del Domain `pedido` en `yolafresh-utils`.

La evidencia principal vive en:

- [pedido.contract.ts](../../domain/pedido/contracts/pedido.contract.ts)
- [pedido-entrega.contract.ts](../../domain/pedido/contracts/pedido-entrega.contract.ts)
- [enums.ts](../../domain/shared/kernel/enums.ts)
- [evidencias.contract.ts](../../domain/shared/kernel/evidencias.contract.ts)
- [venta.contract.ts](../../domain/ventas/contracts/venta.contract.ts)

## Alcance

Este Domain documenta:

- reserva comercial previa a venta;
- atención parcial o total del pedido;
- programación de fecha y hora;
- prioridad y procedencia;
- seguimiento logístico de entrega o recojo;
- relación con evidencias documentales;
- relación con `Venta`.

## Qué representa cada contrato

- `Pedido`: reserva comercial y acuerdo operativo base con cliente.
- `PedidoEntrega`: seguimiento operativo/logístico para preparación, recojo, despacho, ruta o entrega.

## Qué no representa

- `Pedido` no cobra dinero.
- `Pedido` no reemplaza a `Venta`.
- `PedidoEntrega` no reemplaza a `MovimientoInventario`.
- ninguno de los dos contratos reemplaza facturación, caja o deuda.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): conceptos, estados y contratos vigentes.
- [relaciones-interdominio.md](./relaciones-interdominio.md): límites con ventas, tesorería, finanzas, inventario y personas.
- [guia-de-consumo.md](./guia-de-consumo.md): lectura recomendada para consumers.
- [migracion-v1-0-7-a-v1-0-8.md](./migracion-v1-0-7-a-v1-0-8.md): migración desde `ventas/contracts`.

## Terminología canónica

- `Pedido`: reserva comercial.
- `PedidoEntrega`: seguimiento logístico/operativo del pedido.
- `PedidoState`: estado comercial del pedido.
- `PedidoEntregaState`: estado logístico del pedido.
- `PedidoPrioridadEnum`: urgencia operativa del pedido.
- `PedidoProcedenciaEnum`: canal u origen comercial del pedido.

## Límites vigentes del paquete

- el paquete separa `Pedido` de `Venta`, por lo que la conversión se expresa por referencia documental y no por fusión de contratos;
- el paquete separa `PedidoEntrega` de cobro, pago, facturación y stock;
- las evidencias se relacionan mediante `Evidencia.entidadReferencia`, no mediante un contrato embebido propio del pedido.

## Referencias

- [../README.md](../README.md)
- [../ventas/README.md](../ventas/README.md)
