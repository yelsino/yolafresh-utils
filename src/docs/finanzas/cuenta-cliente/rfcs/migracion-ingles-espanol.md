# RFC: Migracion de Cuenta Cliente desde naming legacy en ingles hacia contratos canonicos en espanol

## Estado

Propuesto para adopcion por consumers frontend y backend.

## Fecha

2026-07-02

## Contexto

La evidencia vigente muestra que el lenguaje oficial de cuenta cliente ya vive en [cuenta-cliente.contract.ts](../../../../domain/finanzas/contracts/cuenta-cliente.contract.ts), se publica desde [contracts/index.ts](../../../../domain/finanzas/contracts/index.ts), [index.ts](../../../../domain/finanzas/index.ts) y vuelve a salir por raiz desde [src/index.ts](../../../../index.ts).

La referencia historica del modulo legacy todavia aparece en documentos como [personas.md](../../../personas.md), donde se menciona `customer-account.ts`. La evidencia historica en git muestra ademas una etapa antigua en la que ese archivo exponia simbolos en ingles (`CustomerAccount`, `AccountEntry`, `CashReceipt`, `CustodyTransfer`, `AccountSnapshot`) antes de converger al lenguaje canonico actual.

## Problema

Frontend y backend pueden seguir arrastrando:

- imports hacia rutas legacy;
- tipos locales en ingles;
- enums antiguos en ingles;
- mappers y validadores basados en payloads legacy;
- mezcla de responsabilidades entre cuenta cliente y tesoreria.

## Decision

Se adopta como referencia oficial para todos los consumers el lenguaje contractual actual publicado por `finanzas`.

Queda obsoleto el naming legacy en ingles y `customer-account.ts` pasa a ser referencia historica, no fuente vigente.

## Objetivos

- unificar lenguaje contractual entre frontend y backend;
- eliminar naming legacy en ingles del modulo;
- concentrar ownership semantico en `finanzas`;
- dejar explicito mapa de migracion y plan de adopcion.

## No objetivos

- reintroducir aliases legacy en `yolafresh-utils`;
- redefinir reglas de negocio fuera de la evidencia actual;
- mover `Caja` o `TurnoCaja` fuera de `tesoreria`.

## Surface oficial para consumo

Consumo valido:

~~~ts
import type {
  CuentaCliente,
  MovimientoCuentaCliente,
  ImputacionCuentaCliente,
  RecepcionCobroCliente,
  TransferenciaCustodiaCobro,
  ResumenCuentaCliente,
} from "yola-fresh-utils";
~~~

o:

~~~ts
import type {
  CuentaCliente,
  MovimientoCuentaCliente,
  ImputacionCuentaCliente,
  RecepcionCobroCliente,
  TransferenciaCustodiaCobro,
  ResumenCuentaCliente,
} from "yola-fresh-utils/finanzas";
~~~

No oficiales:

- `yola-fresh-utils/dist/...`
- `yola-fresh-utils/src/...`
- rutas legacy hacia `shared/interfaces/customer-account`

## Mapa de migracion

### Entidades y documentos

| Legacy ingles | Canonico actual | Observacion |
| --- | --- | --- |
| `CustomerAccount` | `CuentaCliente` | Cuenta comercial del cliente |
| `AccountEntry` | `MovimientoCuentaCliente` | Ledger financiero del cliente |
| `Allocation` | `ImputacionCuentaCliente` | Aplicacion entre movimientos |
| `CashReceipt` | `RecepcionCobroCliente` | Recepcion operativa de dinero |
| `CustodyTransfer` | `TransferenciaCustodiaCobro` | Traspaso de custodia |
| `AccountSnapshot` | `ResumenCuentaCliente` | Lectura resumida, no ledger oficial |
| `CashBox` | `Caja` | Ownership actual en `tesoreria` |
| `CashShift` | `TurnoCaja` | Ownership actual en `tesoreria` |

### Estados y enums

| Legacy ingles | Canonico actual |
| --- | --- |
| `ACTIVE` | `ACTIVA` |
| `SUSPENDED` | `SUSPENDIDA` |
| `CLOSED` | `CERRADA` |
| `DEPOSIT` | `DEPOSITO` |
| `PAYMENT` | `COBRO` |
| `SALE` | `VENTA` |
| `REFUND` | `DEVOLUCION` |
| `REVERSAL` | `REVERSA` |
| `CREDIT` | `CREDITO` |
| `DEBIT` | `DEBITO` |
| `CREATED` | `CREADO` o `CREADA` |
| `RECEIVED` | `RECIBIDO` o `RECIBIDA` |
| `REJECTED` | `RECHAZADO` o `RECHAZADA` |
| `CANCELLED` | `ANULADO` o `ANULADA` |

### Origenes con equivalencia parcial

| Legacy ingles | Equivalencia actual observada | Nota |
| --- | --- | --- |
| `CASH_RECEIPT` | `RECIBO_COBRO` | Hoy ademas existe `RecepcionCobroCliente` como documento propio |
| `SALE` | `VENTA` | Equivalencia directa |
| `ORDER` | `PEDIDO` | Equivalencia directa |
| `REFUND` | `DEVOLUCION` | Equivalencia directa |
| `REVERSAL` | `REVERSA` | Equivalencia directa |
| `RECURRENCE` | `RECURRENCIA` | Equivalencia directa |
| `MANUAL_ADJUSTMENT` | `AJUSTE_MANUAL` | Equivalencia directa |
| `EXTERNAL` | `EXTERNO` | Equivalencia directa |

Valores actuales sin equivalencia 1:1 observada en evidencia legacy antigua:

- `COBRO`
- `DEPOSITO`
- `TRANSFERENCIA_CUSTODIA`
- `MIGRACION`
- `MANUAL`

## Cambios contractuales relevantes

El cambio no fue solo rename. El modelo actual gano mas detalle operativo:

- `MovimientoCuentaCliente` ahora expone auditoria, referencias a recepcion, caja, turno, custodio, reversa y deltas de saldo.
- `RecepcionCobroCliente` ya no es solo receipt minimo; ahora expresa cuenta, custodio, caja, turno, origen y ciclo operativo ampliado.
- `TransferenciaCustodiaCobro` ahora expresa mas estados y metadatos de resolucion.
- `ResumenCuentaCliente` ya no es snapshot minimo; ahora tambien publica metadatos de reconstruccion.

## Impacto esperado en frontend

Frontend debe revisar:

- imports y barrels locales;
- view-models, formularios y stores;
- guards y validaciones de enums;
- normalizadores y caches offline;
- pantallas de cobros, custodia, resumen y movimientos.

## Impacto esperado en backend

Backend debe revisar:

- DTOs y mappers;
- validadores de payload;
- serializacion hacia persistencia;
- sincronizadores, jobs o colas;
- compatibilidad temporal con trafico legacy si todavia existe.

## Plan de adopcion recomendado

### Fase 1. Inventario

- listar imports, DTOs y enums legacy;
- detectar si ruptura es solo de path o tambien de payload.

### Fase 2. Contratos compartidos

- migrar imports hacia `yola-fresh-utils` o `yola-fresh-utils/finanzas`;
- dejar de crear contratos nuevos en ingles.

### Fase 3. Traduccion de bordes

- mapear entrada legacy hacia shape canonico solo durante transicion;
- emitir contratos nuevos en espanol.

### Fase 4. Limpieza

- borrar aliases internos de consumers;
- eliminar fixtures y tests con naming viejo;
- cerrar documentacion local legacy.

## Reglas no negociables

- no crear interfaces locales si contrato ya existe en `yolafresh-utils`;
- no usar rutas internas como `dist/...` o `src/...`;
- no usar `ResumenCuentaCliente` como ledger oficial;
- no mezclar `CuentaCliente` con ownership de `Caja` o `TurnoCaja`;
- no introducir nuevos aliases ingleses dentro del paquete compartido.

## Preguntas para cada consumer

- ?todavia existe trafico externo con payloads en ingles?
- ?hay datos historicos persistidos con enums antiguos?
- ?se requiere ventana de compatibilidad temporal en backend?
- ?hay UI o reportes que dependan del naming legacy?

## Referencias

- [../README.md](../README.md)
- [../modelo-vigente.md](../modelo-vigente.md)
- [../operacion-y-auditoria.md](../operacion-y-auditoria.md)
- [../../modelo-vigente.md](../../modelo-vigente.md)
- [../../../core/contratos-compartidos.md](../../../core/contratos-compartidos.md)
- [../../../core/rfc-evolucion-estructura-libreria.md](../../../core/rfc-evolucion-estructura-libreria.md)
