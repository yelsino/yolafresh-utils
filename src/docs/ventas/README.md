# Ventas

## Propósito

Este directorio agrupa la documentación vigente del Domain de ventas en `yolafresh-utils`.

La evidencia principal vive en:

- [Venta.ts](../../domain/ventas/Venta.ts)
- [CarritoVenta.ts](../../domain/ventas/CarritoVenta.ts)
- [VentaSnapshot.ts](../../domain/ventas/VentaSnapshot.ts)
- [snapshots.ts](../../domain/ventas/snapshots.ts)
- [customer-account.ts](../../domain/shared/interfaces/customer-account.ts)
- [Inventario.ts](../../domain/shared/interfaces/Inventario.ts)
- [caja.ts](../../domain/shared/interfaces/caja.ts)
- [pagos.ts](../../domain/shared/interfaces/pagos.ts)

## Alcance

Este Domain documenta:

- captura operativa previa a venta
- hecho comercial confirmado
- snapshot histórico visible
- relación con pedido
- integración con caja y pagos
- relación con cuenta cliente
- impacto sobre inventario, almacén y stock

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): conceptos, contratos, estados y reglas vigentes.
- [relaciones-interdominio.md](./relaciones-interdominio.md): relación de ventas con cuenta cliente, inventario, almacén, stock, caja y pagos.
- [guia-de-consumo.md](./guia-de-consumo.md): lectura recomendada para consumers y flujos operativos mínimos.

## Terminología canónica

- `CarritoVenta`: captura mutable
- `Venta`: hecho comercial confirmado
- `VentaSnapshot`: representación histórica mostrable
- `Pedido`: reserva comercial
- `Pago`: captura y conciliación de dinero
- `MovimientoCaja`: impacto operativo en tesorería
- `MovimientoCuentaCliente`: impacto financiero sobre cuenta cliente
- `MovimientoInventario`: impacto de stock

## Preguntas abiertas

- cuál es política funcional exacta para pasar de `CONFIRMADA` a `DESPACHADA`
- en qué momento operativo debe nacer `MovimientoInventario` en todos los consumers
- qué reglas funcionales uniformes gobiernan anulación de venta y reversas interdominio

## Referencias

- [../README.md](../README.md)
- [../cuenta-cliente/README.md](../cuenta-cliente/README.md)
