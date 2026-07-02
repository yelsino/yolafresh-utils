# Guía de Consumo del Modelo

## Propósito

Este documento explica cómo debe interpretar un consumer externo el modelo vigente de cuenta cliente expuesto por `yolafresh-utils`.

La librería define contratos y lenguaje del Domain. El consumer resuelve persistencia, sincronización, reglas de permisos e idempotencia.

## Separación obligatoria

Un consumo correcto mantiene esta separación:

- `CuentaCliente` != saldo
- `RecepcionCobroCliente` != custodia
- `TransferenciaCustodiaCobro` != ledger
- `MovimientoCuentaCliente` != resumen
- `ResumenCuentaCliente` != fuente de verdad primaria

## Secuencia funcional recomendada

### 1. Recepción

Cuando se recibe dinero del cliente:

- crear `RecepcionCobroCliente`
- registrar quién lo recibió o creó
- asignar `idempotencyKey`

### 2. Resolución de custodia

Si quien recibe ya es custodio válido:

- recepción y registro financiero pueden resolverse dentro del mismo flujo operativo

Si quien recibe no es custodio final:

- crear `TransferenciaCustodiaCobro`
- esperar aceptación o resolución de custodia
- registrar impacto financiero definitivo según política operativa del consumer

### 3. Registro del impacto financiero

Según el caso:

- `DEPOSITO`: crea saldo a favor
- `COBRO`: reduce deuda por cobrar
- `VENTA`: genera cargo o consume saldo
- `DEVOLUCION`: devuelve valor a la relación financiera
- `REVERSA`: corrige sin borrar historia
- `AJUSTE`: corrige por flujo manual o administrativo

### 4. Aplicación entre movimientos

Cuando un crédito financia un débito:

- crear `ImputacionCuentaCliente`
- enlazar movimiento origen y movimiento destino
- registrar monto aplicado y estrategia

### 5. Lectura resumida

Para consultas rápidas:

- reconstruir `ResumenCuentaCliente`
- no usar el resumen como fuente financiera primaria

## Reglas de sincronización respaldadas por proyecto

- toda operación reenviable debe usar `idempotencyKey`
- el backend debe actuar como autoridad final cuando exista arbitraje remoto
- los reintentos no deben duplicar dinero ni movimientos
- el saldo no debe calcularse por resta informal fuera del modelo

## Lectura recomendada por caso

- auditoría financiera: `MovimientoCuentaCliente` + `ImputacionCuentaCliente`
- lectura resumida: `ResumenCuentaCliente`
- recepción operativa: `RecepcionCobroCliente`
- custodia: `TransferenciaCustodiaCobro`

## Pendiente de validación

- criterio exacto para registrar movimiento financiero antes o después de aceptar custodia
- uso exacto de `AJUSTE`
- política uniforme entre `REVERSA`, `ANULADO`, `RECHAZADO` y `REVERTIDO`

## Referencias

- [modelo-vigente.md](./modelo-vigente.md)
- [flujos-cobros-y-adelantos.md](./flujos-cobros-y-adelantos.md)
- [trazabilidad-y-auditoria.md](./trazabilidad-y-auditoria.md)
