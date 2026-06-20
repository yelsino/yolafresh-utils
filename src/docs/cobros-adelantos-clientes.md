# Cobros, Adelantos y Saldo Disponible

Este documento aterriza los casos operativos del nuevo modelo de cuenta cliente.

## Contratos involucrados

- `CustomerAccount`
- `AccountEntry`
- `Allocation`
- `CashReceipt`
- `CustodyTransfer`
- `CashBox`
- `CashShift`
- `AccountSnapshot`

## Regla contable

### Dinero recibido

Siempre inicia con `CashReceipt`.

### Impacto de cuenta

Siempre se registra con `AccountEntry`.

### Aplicacion entre movimientos

Siempre se registra con `Allocation`.

### Caja/turno/custodia

Se expresa por `CashBox`, `CashShift` y `CustodyTransfer`.

## Flujos minimos

### Adelanto sin venta

1. Crear `CashReceipt`
2. Si la custodia ya es oficial, crear `AccountEntry` tipo `DEPOSIT`
3. Actualizar `AccountSnapshot.availableBalance`

### Pago parcial de deuda

1. Crear `CashReceipt`
2. Crear `AccountEntry` tipo `PAYMENT`
3. Actualizar `AccountSnapshot.receivableBalance`

### Sobrepago

Si el cliente paga mas de lo necesario:

- la parte aplicada a deuda o venta se registra con el `AccountEntry` correspondiente
- el excedente se registra como `DEPOSIT`
- si un debito consume un credito previo, se crea `Allocation`

### Uso de saldo

1. Crear `AccountEntry` tipo `SALE`
2. Aplicar FIFO con `Allocation`
3. Reducir `availableBalance` en el snapshot

### Devolucion

1. Crear `AccountEntry` tipo `REFUND`
2. Recalcular snapshot

### Anulacion

1. Crear `AccountEntry` tipo `REVERSAL`
2. No borrar ni sobreescribir movimientos previos

## Regla de custodia

### Cajero recibe directamente

- `CashReceipt`
- `AccountEntry`
- `AccountSnapshot`

### Vendedor recibe y luego entrega

- `CashReceipt`
- `CustodyTransfer`
- aceptacion del custodio
- `AccountEntry`
- `AccountSnapshot`

## Validaciones recomendadas

- no aceptar dinero sin custodio
- no aceptar custodio sin turno
- no registrar `AccountEntry` sin origen
- no crear `Allocation` por monto mayor al disponible en el credito fuente
- no mutar snapshots manualmente fuera del proceso de reconstruccion
