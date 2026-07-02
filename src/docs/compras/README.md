# Compras

## Propósito

Este directorio agrupa la documentación vigente del Domain de compras en `yolafresh-utils`.

La evidencia principal vive en:

- [compras.ts](../../domain/shared/interfaces/compras.ts)
- [Compra.ts](../../domain/compras/Compra.ts)
- [Inventario.ts](../../domain/shared/interfaces/Inventario.ts)
- [finanzas.ts](../../domain/shared/interfaces/finanzas.ts)

## Alcance

Este Domain documenta:

- compra formal a proveedor;
- items comprados y su impacto económico;
- relación con evento de compra;
- condición y estado de pago de la compra;
- separación entre compra, recepción e inventario.

Este Domain no reemplaza:

- `RecepcionMercaderia` como ingreso físico;
- `MovimientoInventario` como impacto real de stock;
- `Egreso` como salida financiera;
- `MovimientoCuentaProveedor` como relación financiera con proveedor.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): conceptos, lifecycle, reglas y relaciones interdominio vigentes.

## Terminología canónica

- `ICompra`
- `Compra`
- `CompraItem`
- `CompraEgresoRef`
- `EventoCompra`
- `EventoCompraItem`

## Referencias

- [../README.md](../README.md)
- [../inventario/README.md](../inventario/README.md)
- [../finanzas/README.md](../finanzas/README.md)
- [../personas/README.md](../personas/README.md)
