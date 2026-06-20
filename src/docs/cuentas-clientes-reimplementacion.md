# Reimplementacion de Cuenta Cliente

Esta guia describe como debe consumir un proyecto externo el nuevo modelo de cuenta cliente de `yolafresh-utils`.

## Principio central

Separar siempre estas responsabilidades:

- `CustomerAccount`: identidad de la cuenta
- `AccountEntry`: ledger financiero
- `Allocation`: aplicacion explicita de creditos a debitos
- `CashReceipt`: recepcion de dinero
- `CustodyTransfer`: custodia humana del dinero
- `AccountSnapshot`: cache reconstruible

## Lo que el consumer debe hacer

La libreria define contratos.

El consumer implementa:

- persistencia,
- validaciones de negocio,
- sincronizacion,
- idempotencia,
- proyecciones,
- reglas de permisos,
- auditoria tecnica.

## Flujo recomendado

### 1. Recibir dinero

- crear `CashReceipt`
- asignar `idempotencyKey`
- registrar quien recibio el dinero

### 2. Resolver custodia

Si el mismo cajero custodio lo recibe:

- crear `AccountEntry` inmediatamente

Si un vendedor recibe y luego entrega:

- crear `CustodyTransfer`
- esperar aceptacion del custodio
- solo luego registrar el `AccountEntry`

### 3. Registrar impacto financiero

Segun el caso:

- `DEPOSIT` para saldo disponible
- `PAYMENT` para reducir deuda por cobrar
- `SALE` para consumir saldo o registrar cargo
- `REFUND` para devoluciones
- `REVERSAL` para anular sin borrar historia

### 4. Aplicar FIFO

Cuando un debito consume creditos previos:

- crear `Allocation`
- enlazar `sourceEntryId`
- enlazar `targetEntryId`

### 5. Actualizar lectura rapida

- reconstruir `AccountSnapshot`
- no persistir saldos como fuente oficial

## Reglas de sincronizacion

- toda operacion reenviable debe tener `idempotencyKey`
- el backend es la autoridad final
- el consumer no debe inventar saldos por resta directa
- los reintentos no deben duplicar dinero

## Regla de anulacion

- no borrar,
- no editar historicos,
- emitir `REVERSAL`.

## Regla de lectura

- auditoria: leer `AccountEntry` + `Allocation`
- saldo rapido: leer `AccountSnapshot`

## Resultado esperado

La reimplementacion correcta deja esta separacion:

- recepcion != custodia
- custodia != ledger
- ledger != snapshot
