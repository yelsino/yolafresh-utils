# RFC: Reestructuración de Cuenta Cliente - Opción A

## Estado

Implementado.

## Propósito

Este RFC propone evolucionar `CuentaCliente` hacia un modelado más limpio y más cercano a un ERP profesional.

Esta propuesta se conoce como `Opción A`.

Dirección principal:

- `MovimientoCuentaCliente` publica solo hechos del ledger;
- `ImputacionCuentaCliente` publica aplicación explícita entre créditos y débitos;
- `ResumenCuentaCliente` se reconstruye desde movimientos vigentes + imputaciones vigentes;
- persistencia y transporte siguen fuera del contrato canónico;
- no se requiere compatibilidad legacy porque subdominio todavía está en construcción.

## Contexto

`CuentaCliente` es subdominio nuevo.

Por eso esta reestructuración no debe diseñarse con carga de compatibilidad histórica. El objetivo no es preservar shape intermedio. El objetivo es fijar contrato correcto antes de que consumers consoliden dependencias erróneas.

## Problema del contrato vigente

Hoy `MovimientoCuentaCliente` publica:

- `deltaSaldoFavor?: number`
- `deltaSaldoPorCobrar?: number`

Esos campos mezclan dos planos distintos:

- hecho individual del ledger;
- efecto derivado sobre proyección de resumen.

Eso introduce redundancia semántica porque el mismo caso de negocio puede quedar repartido entre:

- `tipo`
- `direccion`
- `monto`
- `imputaciones`
- `deltaSaldoFavor`
- `deltaSaldoPorCobrar`

Resultado: distintos consumers pueden “hacer cuadrar” mismo movimiento con reglas diferentes y aun así seguir tipando bien.

## Decisión

`Opción A` queda adoptada como dirección oficial del subdominio.

Eso implica:

1. remover `deltaSaldoFavor` y `deltaSaldoPorCobrar` de `MovimientoCuentaCliente`;
2. tratar `ImputacionCuentaCliente` como fuente explícita de aplicación;
3. tratar `ResumenCuentaCliente` como proyección reconstruible;
4. fijar algoritmo canónico de reconstrucción en documentación del paquete;
5. prohibir reconstrucciones inventadas por cada consumer.

## Contrato propuesto

### `MovimientoCuentaCliente`

```ts
export interface MovimientoCuentaCliente {
  id: string;
  cuentaId: string;
  clienteId?: string;
  tipo: TipoMovimientoCuentaCliente;
  direccion: DireccionMovimientoCuentaCliente;
  monto: number;
  moneda: MonedaCuentaCliente;
  tipoOrigen: OrigenMovimientoCuentaCliente;
  origenId: string;
  estado?: EstadoMovimientoCuentaCliente;
  descripcion?: string;
  recepcionCobroId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  custodioId?: string;
  idempotencyKey?: string;
  creadoPorId?: string;
  reversaDeMovimientoId?: string;
  occurredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
```

Cambio principal:

- remover `deltaSaldoFavor?: number`
- remover `deltaSaldoPorCobrar?: number`

### `ImputacionCuentaCliente`

```ts
export interface ImputacionCuentaCliente {
  id: string;
  cuentaId?: string;
  clienteId?: string;
  movimientoOrigenId: string;
  movimientoDestinoId: string;
  monto: number;
  moneda: MonedaCuentaCliente;
  estado?: EstadoImputacionCuentaCliente;
  estrategia?: "FIFO";
  createdAt: Date;
}
```

Lectura canónica:

- `movimientoOrigenId` debe referenciar crédito disponible;
- `movimientoDestinoId` debe referenciar débito pendiente;
- `monto` expresa cuánto crédito se aplicó contra cuánto débito;
- si `estado !== "APLICADA"`, no impacta resumen.

### `ResumenCuentaCliente`

```ts
export interface ResumenCuentaCliente {
  id?: string;
  cuentaId: string;
  clienteId?: string;
  saldoFavor: number;
  saldoPorCobrar: number;
  saldoCreditoNoAplicado?: number;
  moneda: MonedaCuentaCliente;
  ultimoAsientoId?: string;
  ultimoAsientoAt?: Date;
  cantidadAsientosFuente?: number;
  cantidadImputacionesFuente?: number;
  version?: number;
  reconstruidaAt?: Date;
  createdAt?: Date;
  updatedAt: Date;
}
```

Lectura canónica:

- proyección materializada o reconstruible;
- no reemplaza ledger;
- no reemplaza imputaciones.

## Matriz semántica canónica

### Tipos de movimiento

| Tipo | Dirección esperada | Semántica |
| --- | --- | --- |
| `VENTA` | `DEBITO` | abre saldo por cobrar |
| `COBRO` | `CREDITO` | crea crédito aplicable a débitos abiertos |
| `DEPOSITO` | `CREDITO` | crea saldo a favor aplicable a futuro |
| `DEVOLUCION` | `CREDITO` | crea crédito disponible a favor del cliente |
| `REVERSA` | depende de movimiento revertido | neutraliza efecto económico del movimiento referenciado |
| `AJUSTE` | `CREDITO` o `DEBITO` | corrección administrativa explícita y auditable |

### Lectura fuerte

- todo `DEBITO` abre exposición por cobrar;
- todo `CREDITO` abre crédito disponible;
- `ImputacionCuentaCliente` consume crédito disponible contra débito pendiente;
- `ResumenCuentaCliente` no deduce saldos desde deltas embebidos, solo desde abiertos e imputados.

## Reglas de reconstrucción

### Estados que sí participan

Movimientos válidos para resumen:

- `CONFIRMADO`
- `CONTABILIZADO`
- `undefined`

Movimientos que no participan:

- `ANULADO`
- `RECHAZADO`
- `REVERTIDO`

Imputaciones válidas para resumen:

- `APLICADA`
- `undefined`

Imputaciones que no participan:

- `REVERTIDA`

### Fórmulas canónicas

Sea:

- `debitosAbiertos = suma(montos de movimientos válidos con direccion = "DEBITO") - suma(imputaciones aplicadas sobre esos débitos)`
- `creditosAbiertos = suma(montos de movimientos válidos con direccion = "CREDITO") - suma(imputaciones aplicadas desde esos créditos)`

Entonces:

- `saldoPorCobrar = max(debitosAbiertos, 0)`
- `saldoFavor = max(creditosAbiertos, 0)`
- `saldoCreditoNoAplicado = max(creditosAbiertos, 0)`

### Algoritmo operativo

1. tomar movimientos vigentes de una `cuentaId`;
2. descartar movimientos no participantes por estado;
3. tomar imputaciones participantes de esa `cuentaId`;
4. validar que toda imputación una un crédito con un débito;
5. calcular saldo abierto por cada movimiento;
6. sumar débitos abiertos;
7. sumar créditos abiertos;
8. materializar `ResumenCuentaCliente`.

### Restricción de moneda

- todos los movimientos de una misma `CuentaCliente` deben compartir misma `moneda`;
- una imputación solo puede unir movimientos de misma `moneda`;
- este RFC no introduce conversión cambiaria ni `tipoCambio`.

## Invariantes

### Invariantes contractuales

- `monto` siempre positivo;
- todo `MovimientoCuentaCliente` debe llevar `tipoOrigen` y `origenId`;
- toda `ImputacionCuentaCliente.monto` debe ser positiva;
- `movimientoOrigenId` debe referenciar `CREDITO`;
- `movimientoDestinoId` debe referenciar `DEBITO`;
- una imputación no puede exceder crédito abierto del origen;
- una imputación no puede exceder débito abierto del destino;
- `REVERSA` debe apuntar a `reversaDeMovimientoId`;
- `AJUSTE` debe llevar `descripcion` suficiente para auditoría.

### Invariantes de modelado

- ledger no publica deltas acumulados;
- resumen no reemplaza fuente primaria;
- recepción, custodia, ledger e imputación siguen separadas;
- `Pago` externo no genera por sí solo movimiento en `CuentaCliente`;
- persistencia CouchDB no redefine contrato canónico.

## Ejemplos canónicos

### Caso 1: deuda 500, cobro 400

Movimientos:

```json
[
  {
    "id": "mov_venta_001",
    "cuentaId": "cc_001",
    "clienteId": "cliente_001",
    "tipo": "VENTA",
    "direccion": "DEBITO",
    "monto": 150,
    "moneda": "PEN",
    "tipoOrigen": "VENTA",
    "origenId": "venta_001",
    "estado": "CONTABILIZADO",
    "occurredAt": "2026-07-05T10:00:00.000Z",
    "createdAt": "2026-07-05T10:00:00.000Z"
  },
  {
    "id": "mov_venta_002",
    "cuentaId": "cc_001",
    "clienteId": "cliente_001",
    "tipo": "VENTA",
    "direccion": "DEBITO",
    "monto": 150,
    "moneda": "PEN",
    "tipoOrigen": "VENTA",
    "origenId": "venta_002",
    "estado": "CONTABILIZADO",
    "occurredAt": "2026-07-05T10:05:00.000Z",
    "createdAt": "2026-07-05T10:05:00.000Z"
  },
  {
    "id": "mov_venta_003",
    "cuentaId": "cc_001",
    "clienteId": "cliente_001",
    "tipo": "VENTA",
    "direccion": "DEBITO",
    "monto": 200,
    "moneda": "PEN",
    "tipoOrigen": "VENTA",
    "origenId": "venta_003",
    "estado": "CONTABILIZADO",
    "occurredAt": "2026-07-05T10:10:00.000Z",
    "createdAt": "2026-07-05T10:10:00.000Z"
  },
  {
    "id": "mov_cobro_001",
    "cuentaId": "cc_001",
    "clienteId": "cliente_001",
    "tipo": "COBRO",
    "direccion": "CREDITO",
    "monto": 400,
    "moneda": "PEN",
    "tipoOrigen": "COBRO",
    "origenId": "cobro_001",
    "estado": "CONTABILIZADO",
    "recepcionCobroId": "rc_001",
    "idempotencyKey": "idem-cobro-001",
    "occurredAt": "2026-07-05T11:00:00.000Z",
    "createdAt": "2026-07-05T11:00:00.000Z"
  }
]
```

Imputaciones:

```json
[
  {
    "id": "imp_001",
    "cuentaId": "cc_001",
    "clienteId": "cliente_001",
    "movimientoOrigenId": "mov_cobro_001",
    "movimientoDestinoId": "mov_venta_001",
    "monto": 150,
    "moneda": "PEN",
    "estado": "APLICADA",
    "estrategia": "FIFO",
    "createdAt": "2026-07-05T11:00:00.000Z"
  },
  {
    "id": "imp_002",
    "cuentaId": "cc_001",
    "clienteId": "cliente_001",
    "movimientoOrigenId": "mov_cobro_001",
    "movimientoDestinoId": "mov_venta_002",
    "monto": 150,
    "moneda": "PEN",
    "estado": "APLICADA",
    "estrategia": "FIFO",
    "createdAt": "2026-07-05T11:00:00.000Z"
  },
  {
    "id": "imp_003",
    "cuentaId": "cc_001",
    "clienteId": "cliente_001",
    "movimientoOrigenId": "mov_cobro_001",
    "movimientoDestinoId": "mov_venta_003",
    "monto": 100,
    "moneda": "PEN",
    "estado": "APLICADA",
    "estrategia": "FIFO",
    "createdAt": "2026-07-05T11:00:00.000Z"
  }
]
```

Resumen:

```json
{
  "cuentaId": "cc_001",
  "clienteId": "cliente_001",
  "saldoFavor": 0,
  "saldoPorCobrar": 100,
  "saldoCreditoNoAplicado": 0,
  "moneda": "PEN",
  "ultimoAsientoId": "mov_cobro_001",
  "ultimoAsientoAt": "2026-07-05T11:00:00.000Z",
  "cantidadAsientosFuente": 4,
  "cantidadImputacionesFuente": 3,
  "updatedAt": "2026-07-05T11:00:01.000Z"
}
```

### Caso 2: deuda 200, cobro parcial 100

Movimientos:

```json
[
  {
    "id": "mov_venta_010",
    "cuentaId": "cc_010",
    "clienteId": "cliente_010",
    "tipo": "VENTA",
    "direccion": "DEBITO",
    "monto": 200,
    "moneda": "PEN",
    "tipoOrigen": "VENTA",
    "origenId": "venta_010",
    "estado": "CONTABILIZADO",
    "occurredAt": "2026-07-05T12:00:00.000Z",
    "createdAt": "2026-07-05T12:00:00.000Z"
  },
  {
    "id": "mov_cobro_010",
    "cuentaId": "cc_010",
    "clienteId": "cliente_010",
    "tipo": "COBRO",
    "direccion": "CREDITO",
    "monto": 100,
    "moneda": "PEN",
    "tipoOrigen": "COBRO",
    "origenId": "cobro_010",
    "estado": "CONTABILIZADO",
    "recepcionCobroId": "rc_010",
    "idempotencyKey": "idem-cobro-010",
    "occurredAt": "2026-07-05T12:30:00.000Z",
    "createdAt": "2026-07-05T12:30:00.000Z"
  }
]
```

Imputación:

```json
[
  {
    "id": "imp_010",
    "cuentaId": "cc_010",
    "clienteId": "cliente_010",
    "movimientoOrigenId": "mov_cobro_010",
    "movimientoDestinoId": "mov_venta_010",
    "monto": 100,
    "moneda": "PEN",
    "estado": "APLICADA",
    "estrategia": "FIFO",
    "createdAt": "2026-07-05T12:30:00.000Z"
  }
]
```

Resumen:

```json
{
  "cuentaId": "cc_010",
  "clienteId": "cliente_010",
  "saldoFavor": 0,
  "saldoPorCobrar": 100,
  "saldoCreditoNoAplicado": 0,
  "moneda": "PEN",
  "ultimoAsientoId": "mov_cobro_010",
  "ultimoAsientoAt": "2026-07-05T12:30:00.000Z",
  "cantidadAsientosFuente": 2,
  "cantidadImputacionesFuente": 1,
  "updatedAt": "2026-07-05T12:30:01.000Z"
}
```

## Impacto en consumers

### Frontend

Debe:

- dejar de pensar `MovimientoCuentaCliente` como resumen incremental;
- usar `ResumenCuentaCliente` como snapshot operativo;
- usar `MovimientoCuentaCliente` como ledger;
- usar `ImputacionCuentaCliente` como explicación de aplicación;
- respetar contratos oficiales de `yola-fresh-utils`.

No debe:

- reconstruir saldos con reglas locales;
- recrear `deltaSaldoFavor` o `deltaSaldoPorCobrar` en view-model base;
- duplicar contratos compartidos.

### Backend

Debe:

- publicar ledger sin deltas embebidos;
- reconstruir `ResumenCuentaCliente` desde movimientos + imputaciones;
- validar moneda, estados e invariantes de imputación;
- mantener recepción, custodia, ledger e imputación desacoplados.

No debe:

- compensar ausencia de imputaciones con deltas manuales;
- mezclar `Pago` externo con efecto financiero automático;
- inventar contratos paralelos.

## Alcance de implementación en `yola-fresh-utils`

Archivos actualizados por esta implementación:

- `src/domain/finanzas/contracts/cuenta-cliente.contract.ts`
- `src/docs/finanzas/cuenta-cliente/modelo-vigente.md`
- `src/docs/finanzas/cuenta-cliente/casos-de-uso.md`
- `src/docs/finanzas/cuenta-cliente/operacion-y-auditoria.md`
- `src/docs/finanzas/cuenta-cliente/rfcs/erfc-implementacion-cuenta-cliente.md`

## Criterios de aceptación

- `MovimientoCuentaCliente` ya no publica `deltaSaldoFavor` ni `deltaSaldoPorCobrar`;
- `ImputacionCuentaCliente` queda documentada como fuente explícita de aplicación;
- `ResumenCuentaCliente` queda documentado como proyección reconstruible;
- frontend y backend pueden reconstruir mismo saldo usando misma regla canónica;
- docs de `CuentaCliente` quedan alineadas con `Opción A`.

## Beneficios esperados

- contrato más limpio;
- menor redundancia semántica;
- mejor alineación con modelado ERP;
- separación fuerte entre ledger, imputación y resumen;
- menor riesgo de inconsistencias.

## Referencias

- [cuenta-cliente.contract.ts](../../../domain/finanzas/contracts/cuenta-cliente.contract.ts)
- [erfc-implementacion-cuenta-cliente.md](./erfc-implementacion-cuenta-cliente.md)
- [README.md](../README.md)
