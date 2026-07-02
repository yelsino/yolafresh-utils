# Inventario

## Propósito

Este directorio agrupa la documentación vigente del Domain de inventario en `yolafresh-utils`.

La evidencia principal vive en:

- [inventario.contract.ts](../../domain/inventario/contracts/inventario.contract.ts)
- [producto.contract.ts](../../domain/inventario/contracts/producto.contract.ts)
- [producto-update.contract.ts](../../domain/inventario/contracts/producto-update.contract.ts)

## Alcance

Este Domain documenta:

- almacenes y stock por presentación;
- movimientos de inventario;
- transferencias entre almacenes;
- recepciones de mercadería;
- líneas de kardex y asignaciones de recepción.

Este Domain no reemplaza:

- `Venta` como hecho comercial;
- `Compra` como documento económico de abastecimiento;
- `MovimientoCaja` o `Egreso` como registros de dinero.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): conceptos, relaciones y reglas observadas del dominio.

## Terminología canónica

- `Almacen`
- `StockPresentacionAlmacen`
- `StockLoteAlmacen`
- `MovimientoInventario`
- `Transferencia`
- `RecepcionMercaderia`
- `KardexLinea`
- `AsignacionRecepcionCompra`

## Referencias

- [../README.md](../README.md)
- [../ventas/README.md](../ventas/README.md)
- [../compras/README.md](../compras/README.md)
