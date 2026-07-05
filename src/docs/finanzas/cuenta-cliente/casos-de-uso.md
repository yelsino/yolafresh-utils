# Cuenta Cliente: Casos de uso

## Propósito

Este documento enumera las casuísticas de negocio que hoy cubre el subdominio `CuentaCliente` dentro de `finanzas`.

La evidencia principal vive en [cuenta-cliente.contract.ts](../../../domain/finanzas/contracts/cuenta-cliente.contract.ts).

## Cuándo usar `CuentaCliente`

`CuentaCliente` debe usarse cuando el negocio necesita modelar relación financiera con cliente más allá del instante de venta.

Cubre casos como:

- adelantos;
- deuda pendiente;
- cobros parciales o totales;
- aplicación de saldo a favor;
- devoluciones con impacto financiero;
- ajustes auditables;
- trazabilidad entre recepción, custodia y ledger.

No debe usarse para reemplazar:

- `Venta` como hecho comercial;
- `Pago` como evidencia externa;
- `MovimientoCaja` como trazabilidad operativa de tesorería;
- `ResumenCuentaCliente` como ledger oficial.

## Casos de uso canónicos

### 1. Adelanto sin venta inmediata

Cliente entrega dinero hoy, pero todavía no consume una venta concreta.

Contratos implicados:

- `RecepcionCobroCliente`
- `MovimientoCuentaCliente` tipo `DEPOSITO`
- `ResumenCuentaCliente`

Resultado esperado:

- aumenta `saldoFavor`;
- queda trazabilidad de recepción y eventual custodia;
- no se necesita inventar contrato local de “anticipo”.

### 2. Venta al crédito

Negocio entrega producto o servicio y cliente queda debiendo.

Contratos implicados:

- `MovimientoCuentaCliente` tipo `VENTA`
- `ResumenCuentaCliente`

Resultado esperado:

- aumenta `saldoPorCobrar`;
- venta sigue siendo hecho comercial separado;
- relación financiera con cliente queda en `CuentaCliente`.

### 3. Cobro parcial de deuda

Cliente paga una parte de lo que debía.

Contratos implicados:

- `RecepcionCobroCliente`
- `MovimientoCuentaCliente` tipo `COBRO`
- `ResumenCuentaCliente`

Resultado esperado:

- baja `saldoPorCobrar`;
- recepción operativa y movimiento financiero no se colapsan en un único documento.

### 4. Cobro total de deuda

Cliente liquida por completo saldo pendiente.

Contratos implicados:

- `RecepcionCobroCliente`
- `MovimientoCuentaCliente` tipo `COBRO`
- `ResumenCuentaCliente`

Resultado esperado:

- `saldoPorCobrar` queda en cero cuando no exista residuo;
- auditoría conserva origen, monto y momento de cobro.

### 5. Sobrepago

Cliente paga más de lo adeudado.

Contratos implicados:

- `RecepcionCobroCliente`
- `MovimientoCuentaCliente` tipo `COBRO`
- `MovimientoCuentaCliente` tipo `DEPOSITO`
- `ImputacionCuentaCliente`

Resultado esperado:

- parte del dinero cancela deuda;
- excedente queda como saldo a favor;
- aplicación exacta entre movimientos queda trazable.

### 6. Consumo de saldo a favor

Cliente ya tenía crédito y lo usa en compra o cargo posterior.

Contratos implicados:

- `MovimientoCuentaCliente` tipo `VENTA`
- `ImputacionCuentaCliente`
- `ResumenCuentaCliente`

Resultado esperado:

- se consume crédito previo;
- `saldoFavor` disminuye;
- si el crédito no cubre todo, puede sobrevivir `saldoPorCobrar`.

### 7. Devolución con efecto financiero

Negocio devuelve valor al cliente por anulación parcial, retorno o compensación.

Contratos implicados:

- `MovimientoCuentaCliente` tipo `DEVOLUCION`
- `ResumenCuentaCliente`

Resultado esperado:

- relación financiera se ajusta sin borrar historia previa;
- efecto puede terminar como saldo a favor según política del consumer.

### 8. Ajuste manual auditable

Operación necesita corrección administrativa explícita.

Contratos implicados:

- `MovimientoCuentaCliente` tipo `AJUSTE`

Resultado esperado:

- corrección queda separada de `VENTA`, `COBRO`, `DEPOSITO`, `DEVOLUCION` y `REVERSA`;
- consumer no usa cambios silenciosos sobre históricos.

### 9. Reversa o anulación de movimiento

Se necesita corregir un movimiento ya registrado sin destruir evidencia.

Contratos implicados:

- `MovimientoCuentaCliente` tipo `REVERSA`
- estados `ANULADO`, `RECHAZADO`, `REVERTIDO`

Resultado esperado:

- historia permanece auditable;
- relación entre movimiento original y reversa queda explícita.

### 10. Custodia del dinero recibido

Dinero recibido debe pasar de una persona o turno a otro.

Contratos implicados:

- `RecepcionCobroCliente`
- `TransferenciaCustodiaCobro`

Resultado esperado:

- recepción y custodia quedan separadas;
- se puede auditar quién entregó, quién recibió y cómo terminó la transferencia.

## Casos que no pertenecen a este subdominio

### `Pago` digital externo

Si solo existe evidencia externa de pago, todavía no corresponde registrar `CuentaCliente` automáticamente.

Primero debe existir decisión financiera explícita del consumer.

### Caja operativa

Si el problema es apertura, cierre o arqueo de caja, corresponde `tesoreria`, no `CuentaCliente`.

### Asiento contable formal

Si el problema es balance contable, corresponde `contabilidad`, no `CuentaCliente`.

## Regla de integración

Frontend y backend deben consumir exclusivamente contratos oficiales de `yola-fresh-utils`.

Reglas no negociables:

- no crear interfaces locales que dupliquen `CuentaCliente`, `MovimientoCuentaCliente`, `ImputacionCuentaCliente`, `RecepcionCobroCliente`, `TransferenciaCustodiaCobro` o `ResumenCuentaCliente`;
- no importar desde `dist/...` ni `src/...`;
- no reinterpretar `Pago` como si fuera movimiento financiero automático;
- no usar `ResumenCuentaCliente` como fuente oficial del ledger.

Imports válidos:

```ts
import type {
  CuentaCliente,
  MovimientoCuentaCliente,
  ImputacionCuentaCliente,
  RecepcionCobroCliente,
  TransferenciaCustodiaCobro,
  ResumenCuentaCliente,
} from "yola-fresh-utils";
```

o:

```ts
import type {
  CuentaCliente,
  MovimientoCuentaCliente,
  ImputacionCuentaCliente,
  RecepcionCobroCliente,
  TransferenciaCustodiaCobro,
  ResumenCuentaCliente,
} from "yola-fresh-utils/finanzas";
```

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [operacion-y-auditoria.md](./operacion-y-auditoria.md)
- [rfcs/erfc-implementacion-cuenta-cliente.md](./rfcs/erfc-implementacion-cuenta-cliente.md)
