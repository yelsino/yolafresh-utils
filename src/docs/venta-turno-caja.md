# Integración de caja para `Venta`

Este documento reemplaza guía anterior que trataba `turnoCajaId`, `tipoPago` y `finanzaId` como campos primarios de `Venta`.

Estado actual del contrato:

- `Venta` vive en [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts).
- `Venta` ya usa `VentaState` y `pedidoId?` como relación comercial.
- `Pago`, `MovimientoCaja` y `CuentaCliente` siguen siendo contratos separados para cobro, caja y deuda.
- `turnoCajaId`, `tipoPago`, `finanzaId` y `esPedido` sobreviven solo en compatibilidad temporal de snapshots viejos, no como centro del agregado `Venta`.

## 1) Regla canónica

`Venta` responde pregunta comercial:

> ¿Qué se vendió, a quién, por cuánto, en qué estado comercial y desde qué pedido opcional nació?

`MovimientoCaja` y `Pago` responden preguntas de cobro/caja:

- ¿En qué turno de caja entró dinero?
- ¿Con qué método se capturó o concilió pago?
- ¿Qué cobro quedó aplicado a la venta?

## 2) Separación recomendada

- `Venta.estado`: usar `VentaState.CONFIRMADA`, `VentaState.DESPACHADA` o `VentaState.ANULADA`.
- `Venta.pedidoId`: usar cuando la venta nace desde un `Pedido`.
- `Pago`: usar para captura, conciliación y método de pago.
- `MovimientoCaja.turnoId`: usar para impacto de caja y arqueo.
- `CuentaCliente` / `MovimientoCuentaCliente`: usar para deuda, adelantos y saldo.

## 3) Flujo recomendado

### 3.1 Registrar venta sin cobro inmediato

1. Crear `Venta` con `VentaState.CONFIRMADA`.
2. No guardar `turnoCajaId` ni `tipoPago` dentro de `Venta`.
3. Si todavía no entra dinero, no crear `MovimientoCaja`.
4. Si nace desde pedido, guardar `pedidoId`.

### 3.2 Cobrar venta luego en caja

Precondición: existe un `TurnoCaja` activo.

Al momento del cobro:

- crear o confirmar `Pago` con método y monto,
- registrar `MovimientoCaja.turnoId = turno.id`,
- usar `MovimientoCaja.referenciaTipo = "VENTA"`,
- usar `MovimientoCaja.referenciaId = venta.id`.

Si además hay crédito o saldo:

- reflejarlo en `CuentaCliente` o `MovimientoCuentaCliente`,
- no reinyectarlo como `finanzaId` dentro de `Venta`.

## 4) Inmutabilidad de `Venta`

`Venta` sigue siendo inmutable como documento comercial. Si un consumer necesita cambiar estado comercial, debe rehidratar una nueva instancia con nuevo `estado`.

Ejemplo:

```ts
import { Venta, VentaState } from "yola-fresh-utils";

const ventaConfirmada = new Venta(dataVenta);

const ventaDespachada = new Venta({
  ...ventaConfirmada.toJSON(),
  estado: VentaState.DESPACHADA,
  updatedAt: new Date(),
});
```

## 5) Compatibilidad temporal

En [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts) todavía existen campos legacy para lectura de documentos antiguos:

- `turnoCajaId`
- `tipoPago`
- `finanzaId`
- `esPedido`

Esos campos deben tratarse como compatibilidad de persistencia, no como contrato objetivo nuevo.

## 6) Checklist para consumers

- Crear `Venta` usando `VentaState`.
- Relacionar pedidos con `pedidoId`, no con `esPedido`.
- Registrar cobro en `Pago`.
- Registrar caja en `MovimientoCaja.turnoId`.
- Registrar deuda o saldo en `CuentaCliente`.

