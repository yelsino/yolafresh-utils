# Tesoreria

## Propósito

Este directorio agrupa la documentación vigente del Domain de tesoreria en `yolafresh-utils`.

La evidencia principal vive en:

- [caja.contract.ts](../../domain/tesoreria/contracts/caja.contract.ts)
- [pago.contract.ts](../../domain/tesoreria/contracts/pago.contract.ts)

## Alcance

Este Domain documenta:

- cajas y turnos operativos;
- movimientos de caja;
- captura y conciliación de pagos;
- relación entre dinero real, venta y validación humana.

Este Domain no reemplaza:

- `Venta` como hecho comercial;
- `CuentaCliente` como relación financiera con cliente;
- `MovimientoFinanciero` o `AsientoContable` como vistas de consolidación o contabilidad.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): conceptos, lifecycle, reglas y límites del dominio.

## Terminología canónica

- `Caja`
- `TurnoCaja`
- `MovimientoCaja`
- `Pago`
- `EstadoPagoCapturaEnum`

## Referencias

- [../README.md](../README.md)
- [../ventas/README.md](../ventas/README.md)
- [../finanzas/README.md](../finanzas/README.md)
- [../finanzas/cuenta-cliente-modelo-vigente.md](../finanzas/cuenta-cliente-modelo-vigente.md)
