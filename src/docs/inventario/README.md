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

## Por qué existe este Domain

`inventario` existe para preservar verdad física del stock.

Su valor está en modelar de forma explícita:

- dónde está el stock;
- cuánto stock existe;
- cómo entra, sale, se transfiere o se ajusta;
- cómo se registra recepción de mercadería.

Esa separación evita que ventas, compras o finanzas muten stock de manera implícita.

## Cuándo entra en juego

Este Domain entra en juego cuando un consumer necesita:

- consultar stock por presentación y almacén;
- registrar movimiento de inventario;
- modelar transferencia entre almacenes;
- modelar recepción física de mercadería;
- relacionar compra o venta con impacto real de stock.

## Qué problema evita

Evita errores conceptuales como:

- guardar stock dentro del contrato de venta;
- asumir que compra implica ingreso físico automático;
- tratar catálogo de producto como si fuera inventario operativo.

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
