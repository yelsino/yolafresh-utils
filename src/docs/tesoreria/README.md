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
- evidencias de pago capturadas desde sistema externo;
- validación humana y aplicación operativa de esas evidencias;
- relación entre dinero real, venta y decisión del despachador o usuario validador.

Este Domain no reemplaza:

- `Venta` como hecho comercial;
- `CuentaCliente` como relación financiera con cliente;
- `MovimientoFinanciero` o `AsientoContable` como vistas de consolidación o contabilidad.

## Por qué existe este Domain

`tesoreria` existe para modelar operación diaria del dinero en caja y turnos.

Su valor está en separar:

- evidencia de pago externo;
- ingreso o egreso real en caja;
- sesión operativa de caja;
- validación humana del movimiento de dinero.

Esa separación evita que venta, finanzas o contabilidad absorban operación diaria de caja.

## Cuándo entra en juego

Este Domain entra en juego cuando un consumer necesita:

- abrir o cerrar operación de caja;
- registrar turno de caja;
- recibir evidencia de pago desde sistema externo;
- validar si esa evidencia corresponde o no a flujo operativo;
- relacionar esa evidencia a una venta solo cuando aplica;
- dejar rastro operativo del dinero que entra o sale.

## Qué problema evita

Evita errores conceptuales como:

- usar `Venta` para expresar caja o turno;
- usar `Pago` como sustituto de `MovimientoCaja`;
- asumir que todo `Pago` debe terminar asociado a una venta;
- usar cuenta cliente o contabilidad como reemplazo del flujo operativo diario.

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
- [../finanzas/cuenta-cliente/modelo-vigente.md](../finanzas/cuenta-cliente/modelo-vigente.md)
