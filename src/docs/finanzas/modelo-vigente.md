# Modelo Vigente de Finanzas

## Visión general

El Domain de finanzas modela dinero, obligaciones y programación financiera que no debe confundirse con venta, caja o contabilidad formal.

La evidencia vigente está en:

- [finanzas.contract.ts](../../domain/finanzas/contracts/finanzas.contract.ts)
- [ledger-auxiliar.contract.ts](../../domain/finanzas/contracts/ledger-auxiliar.contract.ts)
- [recurrencia.contract.ts](../../domain/finanzas/contracts/recurrencia.contract.ts)
- [RecurrenciaEntity.ts](../../domain/finanzas/entities/RecurrenciaEntity.ts)

## Conceptos principales

### `Egreso`

Representa salida de valor económico.

Responsabilidades observadas:

- registrar monto, método de pago y clasificación del gasto;
- asociar caja, turno o movimiento de caja cuando aplica;
- distinguir quién registró y quién ejecutó el gasto;
- enlazar referencia externa como compra o transferencia si existe.

### `Ingreso`

Representa entrada financiera general.

Responsabilidades observadas:

- registrar monto y origen del ingreso;
- distinguir pago al contado frente a crédito;
- conservar evidencias y abonos parciales cuando existen;
- clasificar el documento financiero mediante `TypeFinanza`.

### `Cambio`

Representa conversión o traspaso entre medios de pago.

Responsabilidades observadas:

- expresar monto movido;
- conservar método origen y método destino;
- registrar quién generó el cambio.

### `Anulacion`

Representa reversión financiera explícita.

Responsabilidades observadas:

- enlazar el documento financiero anulado;
- exigir motivo;
- dejar rastro de aprobación cuando existe;
- preservar trazabilidad en lugar de borrar historia.

### `MovimientoCuentaProveedor`

Representa impacto financiero en la relación con proveedor.

Responsabilidades observadas:

- registrar cargo, abono, saldo a favor, uso de saldo o devolución;
- indicar referencia de compra, pago, adelanto, recurrencia o ajuste;
- conservar estado y trazabilidad de reversa o anulación.

### `CuentaProveedor`

Representa lectura resumida del saldo actual del proveedor.

Responsabilidades observadas:

- exponer saldo actual por proveedor;
- conservar moneda base de esa lectura.

No reemplaza al historial detallado de movimientos.

### `CuentaBancaria`

Representa cuenta bancaria de referencia.

Responsabilidades observadas:

- identificar entidad bancaria;
- conservar número y tipo de cuenta.

### `Recurrencia`

Representa programación periódica de una acción financiera u operativa.

Responsabilidades observadas:

- declarar regla temporal;
- declarar acción y payload;
- conservar próxima ejecución calculada;
- acotar vigencia por `inicioAt` y `finAt`.

### `RecurrenciaEntity`

Representa comportamiento de dominio para la recurrencia.

Responsabilidades observadas:

- crear recurrencias activas;
- pausar, activar y anular;
- reprogramar la regla;
- calcular `siguienteEjecucionAt`.

### `MovimientoFinanciero`

Representa vista financiera auxiliar de consolidación.

Lectura importante respaldada por `ledger.ts`:

- es contrato genérico y legacy de apoyo;
- no reemplaza trazabilidad oficial del dinero;
- debe tratarse como vista auxiliar, no como fuente canónica primaria.

## Estados y clasificaciones

### Estado de egreso

- `ACTIVO`
- `ANULADO`
- `PENDIENTE`

### Estado de ingreso

- `PAGADO`
- `ANULADO`
- `PENDIENTE`

### Tipo de finanza

- `Egreso`
- `Ingreso`
- `Cambio`
- `Anulacion`

### Tipo de movimiento en cuenta proveedor

- `CARGO`
- `ABONO`
- `SALDO_FAVOR`
- `USO_SALDO`
- `DEVOLUCION`

### Estado de movimiento financiero

- `PENDIENTE`
- `CONFIRMADO`
- `RECHAZADO`
- `ANULADO`

### Estado de recurrencia

- `ACTIVA`
- `PAUSADA`
- `ANULADA`

## Relaciones de negocio

### Con `Tesoreria`

`Egreso`, `Ingreso`, `Cambio` y `Pago` pueden vincular caja, turno y movimiento, pero no reemplazan la trazabilidad operativa de `MovimientoCaja`.

### Con `Compras`

`Compra` y `Egreso` pueden relacionarse por referencia. La compra representa hecho comercial con proveedor; el egreso representa salida financiera.

### Con `Contabilidad`

El Domain financiero registra hechos monetarios. La contabilidad formal balancea y confirma asientos.

### Con `Cuenta cliente`

La relación financiera específica con cliente ahora se documenta dentro del mismo Domain en [cuenta-cliente-modelo-vigente.md](./cuenta-cliente-modelo-vigente.md).

## Reglas de negocio respaldadas por evidencia

- no usar `MovimientoFinanciero` como ledger oficial;
- no mezclar `Recurrencia` con scheduler o I/O dentro del paquete;
- no borrar historia financiera para anular; usar anulaciones o reversas trazables;
- `CuentaProveedor` expresa saldo resumido, no detalle completo;
- `RecurrenciaEntity` solo programa y recalcula, no ejecuta efectos externos.

## Restricciones observadas

- moneda observada en varios contratos: `PEN` y `USD`;
- varios payloads de acciones recurrentes siguen como `unknown`;
- `Recurrencia` no ejecuta handlers ni define persistencia;
- `MovimientoFinanciero` se conserva como contrato auxiliar histórico.

## Pendiente de validación

- criterio funcional uniforme entre `Ingreso` y `Pago` en flows de cobro híbridos;
- política oficial para consolidar `MovimientoCaja` en `MovimientoFinanciero`;
- criterio futuro para tipar acciones recurrentes hoy genéricas.

## Referencias

- [README.md](./README.md)
- [cuenta-cliente-modelo-vigente.md](./cuenta-cliente-modelo-vigente.md)
- [../tesoreria/README.md](../tesoreria/README.md)
- [../compras/README.md](../compras/README.md)
- [../contabilidad/README.md](../contabilidad/README.md)
