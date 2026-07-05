# ERFC: Implementación de Cuenta Cliente

## Estado

Vigente e implementado para consumers que integran `CuentaCliente` desde `yola-fresh-utils`.

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

Esta sección muestra todos los tipos y contratos publicados hoy por `CuentaCliente`, respetando exactamente la definición vigente del paquete y la implementación de `Opción A`.

### Tipos y contratos completos

```ts
import { MetodoPago } from "./finanzas.contract";

export type MonedaCuentaCliente = "PEN" | "USD";

export type EstadoCuentaCliente = "ACTIVA" | "SUSPENDIDA" | "CERRADA";

export type EstadoMovimientoCuentaCliente =
  | "CONFIRMADO"
  | "ANULADO"
  | "RECHAZADO"
  | "CONTABILIZADO"
  | "REVERTIDO";

export type EstadoImputacionCuentaCliente = "APLICADA" | "REVERTIDA";

export type RolRecepcionCobroCliente = "CAJERO" | "VENDEDOR" | "SISTEMA";

export interface CuentaCliente {
  id: string;
  clienteId: string;
  estado: EstadoCuentaCliente;
  moneda?: MonedaCuentaCliente;
  aperturaAt?: Date;
  cierreAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type TipoMovimientoCuentaCliente =
  | "DEPOSITO"
  | "COBRO"
  | "VENTA"
  | "DEVOLUCION"
  | "REVERSA"
  | "AJUSTE";

export type DireccionMovimientoCuentaCliente = "CREDITO" | "DEBITO";

export type OrigenMovimientoCuentaCliente =
  | "RECIBO_COBRO"
  | "COBRO"
  | "DEPOSITO"
  | "VENTA"
  | "PEDIDO"
  | "DEVOLUCION"
  | "REVERSA"
  | "RECURRENCIA"
  | "TRANSFERENCIA_CUSTODIA"
  | "MIGRACION"
  | "MANUAL"
  | "AJUSTE_MANUAL"
  | "EXTERNO";

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

export type EstadoRecepcionCobroCliente =
  | "CREADO"
  | "RECIBIDO"
  | "EN_TRANSFERENCIA_CUSTODIA"
  | "LIQUIDADO"
  | "RECHAZADO"
  | "ANULADO";

export interface RecepcionCobroCliente {
  id: string;
  clienteId: string;
  cuentaId?: string;
  monto: number;
  moneda: MonedaCuentaCliente;
  metodoPago: MetodoPago;
  creadoPorId: string;
  recibidoPorUsuarioId?: string;
  recibidoPorRol?: RolRecepcionCobroCliente;
  custodioId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  tipoOrigen?: OrigenMovimientoCuentaCliente;
  origenId?: string;
  estado: EstadoRecepcionCobroCliente;
  idempotencyKey: string;
  occurredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type EstadoTransferenciaCustodiaCobro =
  | "CREADA"
  | "RECIBIDA"
  | "PENDIENTE"
  | "ACEPTADA"
  | "RECHAZADA"
  | "ANULADA";

export interface TransferenciaCustodiaCobro {
  id: string;
  recepcionCobroId: string;
  custodioOrigenId: string;
  custodioDestinoId: string;
  turnoCajaOrigenId: string;
  turnoCajaDestinoId: string;
  cajaOrigenId?: string;
  cajaDestinoId?: string;
  estado: EstadoTransferenciaCustodiaCobro;
  idempotencyKey?: string;
  recibidaPorId?: string;
  rechazadaPorId?: string;
  anuladaPorId?: string;
  motivoRechazo?: string;
  motivoAnulacion?: string;
  solicitadaAt?: Date;
  aceptadaAt?: Date;
  createdAt: Date;
  resueltaAt?: Date;
}

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

### Lectura de los contratos

#### `CuentaCliente`

- identidad de cuenta comercial del cliente;
- estado de vida de la cuenta;
- apertura y cierre;
- no guarda ledger;
- no reemplaza `ResumenCuentaCliente`.

#### `MovimientoCuentaCliente`

- ledger oficial de impacto financiero individual;
- exige `tipoOrigen` y `origenId`;
- no publica deltas acumulados de resumen;
- soporta reversa, auditoría y trazabilidad operativa.

#### `ImputacionCuentaCliente`

- enlaza crédito con débito;
- soporta aplicación parcial;
- hoy publica `FIFO` como estrategia explícita;
- explica aplicación sin depender de deltas en movimiento.

#### `RecepcionCobroCliente`

- registra recepción operativa del dinero;
- no equivale por sí sola a impacto financiero confirmado;
- no debe colapsarse con `MovimientoCuentaCliente`.

#### `TransferenciaCustodiaCobro`

- modela traspaso de custodia;
- separa recepción de custodia efectiva;
- no reemplaza ledger.

#### `ResumenCuentaCliente`

- expone lectura reconstruible de saldo;
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
- `MovimientoCuentaCliente` ya no publica `deltaSaldoFavor` ni `deltaSaldoPorCobrar`;
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
