# Ventas

## Propósito

Este directorio agrupa la documentación vigente del Domain de ventas en `yolafresh-utils`.

La evidencia principal vive en:

- [Venta.ts](../../domain/ventas/entities/Venta.ts)
- [CarritoVenta.ts](../../domain/ventas/entities/CarritoVenta.ts)
- [VentaSnapshot.ts](../../domain/ventas/entities/VentaSnapshot.ts)
- [pedido.contract.ts](../../domain/ventas/contracts/pedido.contract.ts)
- [cuenta-cliente.contract.ts](../../domain/finanzas/contracts/cuenta-cliente.contract.ts)
- [inventario.contract.ts](../../domain/inventario/contracts/inventario.contract.ts)
- [caja.contract.ts](../../domain/tesoreria/contracts/caja.contract.ts)
- [pago.contract.ts](../../domain/tesoreria/contracts/pago.contract.ts)

## Alcance

Este Domain documenta:

- captura operativa previa a venta
- hecho comercial confirmado
- snapshot histórico visible
- relación con pedido
- integración con caja y pagos
- relación con cuenta cliente
- impacto sobre inventario, almacén y stock

La librería ya no publica snapshots técnicos de persistencia ni helpers operativos de integración.

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
- [../finanzas/README.md](../finanzas/README.md)
