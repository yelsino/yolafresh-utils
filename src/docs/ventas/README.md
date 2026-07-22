# Ventas

## Propósito

Este directorio agrupa la documentación vigente del Domain de ventas en `yolafresh-utils`.

La evidencia principal vive en:

- [Venta.ts](../../domain/ventas/entities/Venta.ts)
- [CarritoVenta.ts](../../domain/ventas/entities/CarritoVenta.ts)
- [VentaSnapshot.ts](../../domain/ventas/entities/VentaSnapshot.ts)
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

## Por qué existe este Domain

`ventas` existe para preservar verdad comercial de una operación sin mezclarla con verdades de otros dominios cercanos.

Su valor está en separar de forma explícita:

- captura previa de la operación;
- hecho comercial confirmado;
- representación histórica visible;
- reserva comercial previa vía `Pedido`.

Esa separación evita que `Venta` absorba cobro, caja, deuda o stock como si fueran misma cosa.

## Cuándo entra en juego

Este Domain entra en juego cuando un consumer necesita:

- capturar productos antes de confirmar una venta;
- confirmar un hecho comercial;
- relacionar una venta con un pedido;
- conservar snapshot histórico mostrable;
- enlazar la venta con caja, pagos, cuenta cliente o inventario sin confundir ownership.

## Qué problema evita

Evita errores conceptuales como:

- tratar `Venta` como ledger de dinero;
- tratar `Venta` como resumen de deuda del cliente;
- tratar `Venta` como salida directa de stock;
- tratar UI histórica como contrato transaccional principal.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): conceptos, contratos, estados y reglas vigentes.
- [relaciones-interdominio.md](./relaciones-interdominio.md): relación de ventas con cuenta cliente, inventario, almacén, stock, caja y pagos.
- [guia-de-consumo.md](./guia-de-consumo.md): lectura recomendada para consumers y flujos operativos mínimos.
- [migracion-v1-0-4-a-v1-0-5.md](./migracion-v1-0-4-a-v1-0-5.md): cambios requeridos para consumers que usan `CarritoVenta`.
- [migracion-venta-items-conteo.md](./migracion-venta-items-conteo.md): migración incompatible que elimina `VentaItem[]` de `Venta`.
- [rfc-pos-manual-override-y-snapshot-no-bloqueante.md](./rfc-pos-manual-override-y-snapshot-no-bloqueante.md): RFC implementado para override manual y snapshot no bloqueante en POS.
- [rfc-backend-despacho-voucher-credito-por-dependencias.md](./rfc-backend-despacho-voucher-credito-por-dependencias.md): RFC propuesto para backend consumidor sobre envío de voucher de crédito por estado de dependencias, sin polling bruto.
- [../pedido/README.md](../pedido/README.md): documentación propietaria de reserva comercial y seguimiento de pedido.

## Terminología canónica

- `CarritoVenta`: captura mutable
- `Venta`: raíz y resumen compacto del hecho comercial confirmado
- `VentaSnapshot`: detalle histórico único asociado a la venta
- `Pedido`: relación documental externa; ver Domain [pedido](../pedido/README.md)
- `CondicionPagoVenta`: modalidad de cierre comercial (`CONTADO` o `CREDITO`)
- `Pago`: evidencia externa de pago validable y relacionable manualmente
- `MovimientoCaja`: impacto operativo en tesorería
- `MovimientoCuentaCliente`: impacto financiero sobre cuenta cliente
- `MovimientoInventario`: impacto de stock

## Límites vigentes del paquete

- el paquete distingue estados `CONFIRMADA` y `ANULADA`, y deja forma de pago en `CondicionPagoVenta`;
- `Venta.items` es la cantidad de líneas de `VentaSnapshot.items`; no es un array ni cantidad física vendida;
- `VentaItem` dejó de ser contrato público y `VentaSnapshotItem` es el único detalle de línea confirmado;
- el paquete separa `Venta` de `MovimientoInventario`, por lo que no obliga momento único de descuento de stock;
- el paquete no define orquestación automática de reversas entre ventas, tesorería, finanzas e inventario.
- `CarritoVenta` ya no publica `notas`, `tasaImpuesto`, `clienteId` ni `personalId` como parte de su contrato público; consumers deben migrar hacia `configuracionFiscal`, `cliente` y `personal`.

## Referencias

- [../README.md](../README.md)
- [../finanzas/README.md](../finanzas/README.md)
