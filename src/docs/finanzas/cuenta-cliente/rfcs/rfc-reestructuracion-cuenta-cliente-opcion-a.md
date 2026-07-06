# RFC: Reestructuración de Cuenta Cliente - Opción A

## Estado

Propuesto.

## Propósito

Este RFC propone evolucionar el subdominio `CuentaCliente` hacia un modelo más limpio y más cercano a un ERP profesional.

La propuesta se conoce en esta carpeta como **Opción A**:

- `MovimientoCuentaCliente` deja de publicar campos de impacto acumulado;
- `ImputacionCuentaCliente` pasa a ser la fuente explícita de aplicación entre créditos y débitos;
- `ResumenCuentaCliente` se reconstruye desde movimientos + imputaciones + reglas del subdominio;
- consumers siguen siendo responsables de adaptar persistencia y transporte.

## Motivación

El contrato vigente publica en `MovimientoCuentaCliente`:

- `deltaSaldoFavor?: number`
- `deltaSaldoPorCobrar?: number`

Esos campos son útiles para reconstrucción rápida, pero mezclan dos planos:

- el **hecho de negocio** individual (`MovimientoCuentaCliente`);
- el **efecto matemático acumulado** sobre la proyección (`ResumenCuentaCliente`).

Eso introduce redundancia contractual:

- `monto`
- `direccion`
- `tipo`
- `imputaciones`
- `deltaSaldoFavor`
- `deltaSaldoPorCobrar`

Cuando todos conviven, el consumer debe garantizar consistencia cruzada entre varias fuentes derivadas de la misma operación.

En modelado ERP/DDD más limpio, el ledger debe expresar el hecho y la imputación debe expresar la aplicación. El resumen debe ser consecuencia reconstruible, no dato parcialmente embebido en cada asiento.

## Problema del modelo actual

### `MovimientoCuentaCliente` hoy mezcla dos responsabilidades

Responsabilidad correcta:

- registrar asiento o evento financiero de cuenta cliente;
- conservar trazabilidad (`tipoOrigen`, `origenId`, `estado`, `idempotencyKey`);
- separar recepción, ledger, custodia e imputación.

Responsabilidad discutible:

- publicar directamente cómo cambió `saldoFavor`;
- publicar directamente cómo cambió `saldoPorCobrar`.

### Efecto práctico

El contrato actual permite que un consumer publique combinaciones válidas en tipos pero ambiguas semánticamente:

```ts
{
  tipo: "COBRO",
  direccion: "CREDITO",
  monto: 120,
  deltaSaldoFavor: 90,
  deltaSaldoPorCobrar: -10
}
```

La suma puede cuadrar, pero la semántica del subdominio queda repartida entre:

- asiento;
- imputaciones;
- reglas de reconstrucción;
- deltas manualmente calculados.

## Decisión propuesta

Evolucionar el contrato hacia Opción A:

1. `MovimientoCuentaCliente` conserva solo hechos del ledger.
2. `ImputacionCuentaCliente` expresa la aplicación entre crédito y débito.
3. `ResumenCuentaCliente` se reconstruye sin depender de `deltaSaldoFavor` ni `deltaSaldoPorCobrar`.
4. Persistencia CouchDB puede seguir agregando metadatos documentales como `type`, `_id`, `_rev`; eso no forma parte del contrato canónico.

## Contrato propuesto

### `MovimientoCuentaCliente`

Contrato propuesto:

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

Cambios respecto al contrato vigente:

- remover `deltaSaldoFavor?: number`
- remover `deltaSaldoPorCobrar?: number`

### `ImputacionCuentaCliente`

Se mantiene como contrato explícito de aplicación:

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

Su rol sube de importancia:

- ya no es un complemento opcional del delta;
- pasa a ser la pieza explícita que explica cuánto crédito se aplicó contra qué débito.

### `ResumenCuentaCliente`

Se mantiene como proyección materializada o reconstruible:

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

## Semántica propuesta

### Principio general

- `MovimientoCuentaCliente` registra existencia de crédito o débito;
- `ImputacionCuentaCliente` registra aplicación entre movimientos;
- `ResumenCuentaCliente` expresa saldo reconstruido.

### Lectura por tipo de movimiento

#### `VENTA`

- genera débito en cuenta cliente;
- aumenta exposición por cobrar;
- una imputación posterior puede cancelarlo total o parcialmente.

#### `COBRO`

- genera crédito en cuenta cliente;
- no necesita publicar cuánto fue a deuda dentro del mismo movimiento;
- imputaciones posteriores o simultáneas indican cuánto se aplicó;
- remanente no imputado pasa a saldo a favor / crédito no aplicado.

#### `DEPOSITO`

- genera crédito a favor del cliente;
- puede quedar totalmente no imputado;
- puede usarse después para compensar ventas.

#### `DEVOLUCION`

- reduce deuda abierta o crea crédito disponible según reglas del caso de uso;
- su efecto debe quedar determinado por reconstrucción e imputación, no por deltas embebidos.

#### `REVERSA`

- preserva historia;
- no borra asientos;
- revierte efecto del movimiento o flujo revertido mediante reglas explícitas del subdominio.

## Invariantes de negocio

### Invariantes contractuales

- todo `MovimientoCuentaCliente` debe llevar `tipoOrigen` y `origenId`;
- `monto` debe ser positivo;
- `direccion` debe ser consistente con naturaleza del movimiento;
- `ImputacionCuentaCliente.monto` debe ser positivo;
- una imputación no puede exceder saldo pendiente del débito destino;
- una imputación no puede exceder crédito disponible del movimiento origen;
- `ResumenCuentaCliente` debe ser reconstruible a partir de históricos válidos.

### Invariantes de modelado

- el ledger no publica deltas acumulados;
- el resumen no reemplaza movimientos ni imputaciones como fuente primaria;
- recepción, custodia, imputación y ledger siguen siendo capas separadas;
- persistencia documental no redefine contrato canónico.

## Ejemplos

### Caso 1: deuda total 500, cobro 400

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

Resumen esperado:

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

Resumen esperado:

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

- dejar de inferir saldos desde `deltaSaldoFavor` o `deltaSaldoPorCobrar`;
- consumir `ResumenCuentaCliente` como snapshot operativo;
- consumir `MovimientoCuentaCliente` como asiento;
- consumir `ImputacionCuentaCliente` como explicación de aplicación.

No debe:

- reconstruir saldos inventando reglas distintas a las del paquete;
- crear view-models que reintroduzcan `deltaSaldoFavor` o `deltaSaldoPorCobrar` como contrato base.

### Backend

Debe:

- dejar de persistir o publicar deltas como parte del contrato canónico;
- reconstruir `ResumenCuentaCliente` a partir de históricos válidos;
- validar que toda imputación respete saldo pendiente y crédito disponible;
- mantener recepción, custodia y ledger desacoplados.

No debe:

- compensar falta de imputaciones con deltas embebidos;
- reintroducir contratos paralelos internos.

## Persistencia y transporte

Este RFC no obliga forma de persistencia ni transporte.

En particular:

- CouchDB puede seguir usando documentos con `type`, `_id`, `_rev` y aliases de infraestructura;
- HTTP puede seguir usando aliases de transporte por compatibilidad;
- ninguna de esas decisiones debe contaminar contrato canónico de `yola-fresh-utils`.

## Estrategia de migración

### Paso 1

Publicar nueva versión de `yola-fresh-utils` sin `deltaSaldoFavor` ni `deltaSaldoPorCobrar` en `MovimientoCuentaCliente`.

### Paso 2

Actualizar consumers para:

- dejar de depender de deltas;
- recalcular o persistir `ResumenCuentaCliente` usando movimientos + imputaciones.

### Paso 3

Mantener en adaptadores legacy, si hace falta, compatibilidad temporal de lectura de persistencias antiguas.

### Paso 4

Eliminar caminos de código que generen deltas como parte de dominio.

## Riesgos

- consumers que hoy reconstruyen resumen incrementalmente usando deltas necesitarán refactor;
- migraciones apresuradas pueden romper saldos si imputaciones históricas están incompletas;
- bounded contexts que mezclen recepción y ledger deberán separar responsabilidades con más disciplina.

## Beneficios esperados

- contrato más limpio;
- menor redundancia semántica;
- mejor alineación con modelado ERP;
- separación más fuerte entre ledger, imputación y resumen;
- menor riesgo de inconsistencias entre deltas y movimientos.

## Recomendación

Adoptar Opción A como dirección de evolución del subdominio.

Hasta publicar nueva versión del paquete:

- el contrato vigente sigue siendo el actual;
- este RFC debe leerse como propuesta de reestructuración;
- los consumers no deben inventar transiciones locales incompatibles.

## Referencias

- [cuenta-cliente.contract.ts](../../../domain/finanzas/contracts/cuenta-cliente.contract.ts)
- [erfc-implementacion-cuenta-cliente.md](./erfc-implementacion-cuenta-cliente.md)
- [README.md](../README.md)
