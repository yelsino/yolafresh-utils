# Cuenta Cliente — Modelo Actual

Este documento describe el contrato vigente de cuenta cliente en `yolafresh-utils`.

La libreria ya no expone el modelo legacy anterior de cuenta cliente.

El modelo vigente sigue el RFC v2 y separa responsabilidades.

## Entidades vigentes

Archivo fuente principal:

- `src/domain/shared/interfaces/customer-account.ts`

### `CustomerAccount`

Representa la cuenta del cliente.

Reglas:

- no guarda dinero,
- no guarda saldo,
- no resume movimientos,
- solo identifica la cuenta y su estado.

Campos principales:

- `id`
- `clienteId`
- `estado`
- `createdAt`

### `AccountEntry`

Es la unica fuente financiera oficial de la cuenta cliente.

Reglas:

- es append-only,
- no se corrige por overwrite,
- no se debe usar como snapshot mutable,
- todo movimiento debe tener `originType` y `originId`.

Tipos vigentes:

- `DEPOSIT`
- `PAYMENT`
- `SALE`
- `REFUND`
- `REVERSAL`

Direccion:

- `CREDIT`
- `DEBIT`

### `Allocation`

Explica que credito financio que debito.

Uso principal:

- consumo de saldo por FIFO,
- aplicacion parcial de depositos,
- trazabilidad entre saldo disponible y ventas/debitos.

### `CashReceipt`

Representa el evento de recepcion de dinero.

Reglas:

- no guarda caja,
- no guarda turno,
- no guarda custodio derivado,
- solo representa que se recibio dinero del cliente.

### `CustodyTransfer`

Representa la transferencia de custodia del dinero entre actores y turnos.

Reglas:

- la custodia no se deduce por columnas sueltas en el recibo,
- la aceptacion o rechazo se modela aqui,
- el flujo vendedor -> cajero vive aqui.

Estados:

- `CREATED`
- `RECEIVED`
- `REJECTED`
- `CANCELLED`

### `CashBox`

Representa la caja.

### `CashShift`

Representa el turno de caja/custodia.

Regla:

- todo custodio debe tener turno.

### `AccountSnapshot`

Es una proyeccion reconstruible.

Reglas:

- no es fuente de verdad,
- puede recalcularse desde `AccountEntry` y `Allocation`,
- sirve para lecturas rapidas.

Campos principales:

- `availableBalance`
- `receivableBalance`

## Reglas obligatorias del modelo

- no actualizar saldo manualmente,
- no modificar historicos,
- no guardar relaciones derivadas duplicadas,
- no usar el snapshot como ledger,
- no registrar dinero sin custodio,
- no registrar movimiento financiero sin origen,
- no borrar operaciones; usar `REVERSAL`.

## Casos minimos

### Deposito para compra futura

- crear `CashReceipt`
- crear `AccountEntry` tipo `DEPOSIT`
- recalcular `AccountSnapshot`

### Pago de deuda

- crear `CashReceipt`
- crear `AccountEntry` tipo `PAYMENT`
- recalcular `AccountSnapshot.receivableBalance`

### Venta usando saldo

- crear `AccountEntry` tipo `SALE`
- crear `Allocation` contra creditos previos
- recalcular `AccountSnapshot`

### Devolucion

- crear `AccountEntry` tipo `REFUND`

### Reversa

- crear `AccountEntry` tipo `REVERSAL`
- nunca borrar el movimiento original

## Regla de consumo

El consumo de saldo es FIFO:

- primero entra,
- primero sale.

`Allocation` es la entidad que deja este rastro de forma explicita.

## Relacion con otros contratos

- `Pago` sigue siendo captura o conciliacion de medio de pago.
- `MovimientoCaja` sigue siendo ledger operativo de caja.
- `AuditLog` sigue siendo auditoria separada.

Ninguno de esos contratos reemplaza a:

- `AccountEntry`
- `Allocation`
- `CashReceipt`
- `CustodyTransfer`

## Nota de migracion

Si un consumer todavia usa contratos legacy de cuenta cliente, debe migrar al nuevo modelo.

La libreria ya no publica el modelo anterior.
