# ERFC: Implementación de Cuenta Cliente

## Estado

Vigente como guía de implementación para consumers que integran `CuentaCliente` desde `yola-fresh-utils`.

## Propósito

Este ERFC explica cómo implementar `CuentaCliente` respetando estrictamente los contratos publicados por `yola-fresh-utils`.

Su objetivo no es redefinir el modelo.

Su objetivo es:

- fijar imports oficiales;
- mostrar contratos publicados;
- explicar casos de uso cubiertos;
- explicar reglas de negocio observables;
- evitar que frontend o backend creen contratos paralelos.

## Fuente oficial

La fuente canónica del subdominio vive en [cuenta-cliente.contract.ts](../../../domain/finanzas/contracts/cuenta-cliente.contract.ts).

Toda implementación debe partir de ese archivo y de los documentos vigentes de esta carpeta.

## Principio no negociable

`yola-fresh-utils` es source of truth contractual.

Por lo tanto:

- frontend no debe redefinir interfaces locales;
- backend no debe inventar DTOs equivalentes como nuevo contrato de dominio;
- si falta algo, primero se evoluciona `yola-fresh-utils`;
- consumers solo adaptan bordes, persistencia y transporte.

## Imports oficiales

Consumo válido desde raíz:

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

Consumo válido por dominio:

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

Consumo no válido:

- `yola-fresh-utils/dist/...`
- `yola-fresh-utils/src/...`
- contratos locales duplicados en apps consumidoras

## Contratos publicados

### `CuentaCliente`

Responsabilidad:

- identidad de cuenta comercial del cliente;
- estado de vida de la cuenta;
- apertura y cierre.

Campos principales observables:

- `id`
- `clienteId`
- `estado`
- `moneda`
- `aperturaAt`
- `cierreAt`

Lectura correcta:

- no guarda ledger;
- no guarda saldo histórico;
- no reemplaza `ResumenCuentaCliente`.

### `MovimientoCuentaCliente`

Responsabilidad:

- ledger oficial de impacto financiero individual.

Campos principales observables:

- `tipo`
- `direccion`
- `monto`
- `moneda`
- `tipoOrigen`
- `origenId`
- `recepcionCobroId`
- `cajaId`
- `turnoCajaId`
- `custodioId`
- `reversaDeMovimientoId`
- `deltaSaldoFavor`
- `deltaSaldoPorCobrar`

Lectura correcta:

- es documento central para débitos y créditos;
- exige origen explícito;
- soporta auditoría, reversa y trazabilidad operativa.

### `ImputacionCuentaCliente`

Responsabilidad:

- enlazar crédito con débito;
- soportar consumo parcial;
- dejar rastro de aplicación.

Campos principales observables:

- `movimientoOrigenId`
- `movimientoDestinoId`
- `monto`
- `moneda`
- `estado`
- `estrategia`

Lectura correcta:

- hoy la estrategia explícita observada es `FIFO`.

### `RecepcionCobroCliente`

Responsabilidad:

- recepción operativa del dinero del cliente.

Campos principales observables:

- `monto`
- `moneda`
- `metodoPago`
- `creadoPorId`
- `recibidoPorUsuarioId`
- `recibidoPorRol`
- `custodioId`
- `cajaId`
- `turnoCajaId`
- `tipoOrigen`
- `origenId`
- `estado`
- `idempotencyKey`

Lectura correcta:

- no equivale por sí sola a ledger financiero;
- recepción y movimiento no se deben colapsar.

### `TransferenciaCustodiaCobro`

Responsabilidad:

- traspaso de custodia entre responsables y turnos.

Campos principales observables:

- `recepcionCobroId`
- `custodioOrigenId`
- `custodioDestinoId`
- `turnoCajaOrigenId`
- `turnoCajaDestinoId`
- `cajaOrigenId`
- `cajaDestinoId`
- `estado`

Lectura correcta:

- custodia no reemplaza recepción;
- custodia no reemplaza ledger.

### `ResumenCuentaCliente`

Responsabilidad:

- lectura reconstruible de saldos.

Campos principales observables:

- `saldoFavor`
- `saldoPorCobrar`
- `saldoCreditoNoAplicado`
- `ultimoAsientoId`
- `cantidadAsientosFuente`
- `cantidadImputacionesFuente`
- `version`
- `reconstruidaAt`

Lectura correcta:

- sirve para consulta rápida;
- no reemplaza movimientos ni imputaciones como fuente primaria.

## Casos de uso cubiertos

Este subdominio cubre hoy:

- adelanto sin venta;
- venta al crédito;
- cobro parcial;
- cobro total;
- sobrepago;
- uso de saldo a favor;
- devolución con impacto financiero;
- ajuste manual auditable;
- reversa o anulación auditable;
- transferencia de custodia del dinero recibido.

Detalle operativo y ejemplos en [casos-de-uso.md](../casos-de-uso.md).

## Reglas de negocio observables

- `CuentaCliente` no es ledger;
- `ResumenCuentaCliente` no es ledger oficial;
- todo impacto financiero debe llevar `tipoOrigen` y `origenId`;
- recepción, custodia, ledger e imputación son capas separadas;
- la anulación debe preservar historia;
- `AJUSTE` no sustituye a `REVERSA`;
- `Pago` externo no debe generar por sí solo movimiento financiero en cuenta cliente;
- `MovimientoCaja` sigue siendo trazabilidad operativa de tesorería, no cuenta cliente.

## Estados relevantes

### Cuenta

- `ACTIVA`
- `SUSPENDIDA`
- `CERRADA`

### Movimiento

- `CONFIRMADO`
- `ANULADO`
- `RECHAZADO`
- `CONTABILIZADO`
- `REVERTIDO`

### Recepción

- `CREADO`
- `RECIBIDO`
- `EN_TRANSFERENCIA_CUSTODIA`
- `LIQUIDADO`
- `RECHAZADO`
- `ANULADO`

### Transferencia de custodia

- `CREADA`
- `RECIBIDA`
- `PENDIENTE`
- `ACEPTADA`
- `RECHAZADA`
- `ANULADA`

## Qué puede implementar cada consumer

### Frontend

Debe:

- consumir contratos oficiales;
- renderizar estados, tipos y saldos sin redefinir shape;
- capturar formularios y casos de uso sobre contratos oficiales;
- agregar solo view-models derivados cuando sea necesario.

No debe:

- redefinir contratos base;
- cambiar semántica de tipos;
- tratar `ResumenCuentaCliente` como verdad única.

### Backend

Debe:

- persistir contratos oficiales;
- validar invariantes de negocio;
- crear documentos de recepción, movimiento, imputación y custodia según flujo;
- reconstruir `ResumenCuentaCliente` a partir de ledger e imputaciones.

No debe:

- inventar equivalentes paralelos del subdominio;
- mezclar `Pago` con efecto financiero automático;
- borrar históricos para anular.

## Señales de mala implementación

- crear `CustomerAccount`, `AccountEntry` o contratos internos equivalentes;
- persistir solo `ResumenCuentaCliente` y no ledger;
- registrar cobro sin `tipoOrigen` ni `origenId`;
- usar `Pago` digital externo como si fuera `MovimientoCuentaCliente`;
- importar desde `dist/...` o `src/...`.

## Recomendación de adopción

Cuando un consumer necesite evolucionar este subdominio:

1. revisar si contrato ya existe en `yola-fresh-utils`;
2. si no existe, proponer evolución del paquete compartido;
3. solo después adaptar frontend/backend;
4. no consolidar forks contractuales locales.

## Referencias

- [README.md](../README.md)
- [modelo-vigente.md](../modelo-vigente.md)
- [operacion-y-auditoria.md](../operacion-y-auditoria.md)
- [casos-de-uso.md](../casos-de-uso.md)
- [migracion-ingles-espanol.md](./migracion-ingles-espanol.md)
