# Compras

## Propósito

Este directorio agrupa la documentación vigente del Domain de compras en `yolafresh-utils`.

La evidencia principal vive en:

- [compra.contract.ts](../../domain/compras/contracts/compra.contract.ts)
- [Compra.ts](../../domain/compras/entities/Compra.ts)
- [inventario.contract.ts](../../domain/inventario/contracts/inventario.contract.ts)
- [finanzas.contract.ts](../../domain/finanzas/contracts/finanzas.contract.ts)

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

## Por qué existe este Domain

`compras` existe para modelar abastecimiento económico a proveedor como hecho distinto de recepción física y pago.

Su valor está en preservar:

- documento comercial de compra;
- items comprados;
- condición de pago;
- estado comercial de la compra.

Esa separación evita que abastecimiento se mezcle con stock, caja o ledger financiero.

## Cuándo entra en juego

Este Domain entra en juego cuando un consumer necesita:

- registrar compra formal a proveedor;
- conservar items y totales de compra;
- expresar condición o estado de pago;
- vincular compra con egresos o con recepción física sin confundir conceptos.

## Qué problema evita

Evita errores conceptuales como:

- tratar recepción física como si fuera compra formal;
- tratar egreso como si fuera documento de abastecimiento;
- usar inventario como reemplazo del documento económico de compra.

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
