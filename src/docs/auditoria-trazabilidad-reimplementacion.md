# Auditoria y Trazabilidad del Nuevo Modelo

El nuevo modulo de cuenta cliente separa claramente la trazabilidad por capas.

## Capas de trazabilidad

### Recepcion

`CashReceipt` deja rastro de:

- quien recibio dinero,
- cuanto dinero se recibio,
- metodo de pago,
- momento de la recepcion.

### Custodia

`CustodyTransfer` deja rastro de:

- quien entrega,
- quien recibe,
- desde que turno sale,
- a que turno entra,
- si fue recibido, rechazado o cancelado.

### Ledger financiero

`AccountEntry` deja rastro oficial de:

- credito,
- debito,
- origen,
- monto,
- reversa.

### Aplicacion de dinero

`Allocation` deja rastro de:

- que credito pago que debito,
- cuanto monto se aplico,
- en que relacion exacta quedaron enlazados.

### Lectura rapida

`AccountSnapshot` deja un resumen reconstruible de:

- saldo disponible,
- saldo por cobrar.

### Auditoria tecnica

`AuditLog` sigue siendo el contrato para:

- before/after,
- cambios de campos,
- trazas de soporte,
- evidencia tecnica separada del modelo de negocio.

## Regla de oro

No duplicar la misma verdad en varias entidades.

Por eso:

- `CashReceipt` no guarda caja ni turno derivados,
- `AccountEntry` no guarda saldo acumulado,
- `AccountSnapshot` no reemplaza al ledger,
- `AuditLog` no reemplaza a las entidades de negocio.

## Regla de anulacion

La anulacion debe ser auditable sin destruir historia.

Por eso:

- no borrar movimientos,
- no editar historicos,
- usar `REVERSAL`,
- registrar auditoria tecnica por separado cuando aplique.

## Resultado

La trazabilidad correcta queda asi:

- recepcion operativa -> `CashReceipt`
- custodia humana -> `CustodyTransfer`
- dinero contable -> `AccountEntry`
- aplicacion FIFO -> `Allocation`
- lectura rapida -> `AccountSnapshot`
- auditoria tecnica -> `AuditLog`
