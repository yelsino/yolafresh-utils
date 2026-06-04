# Reestructuración de Entidades — Cuentas de Clientes Offline First

## Objetivo

Reestructurar las entidades del sistema de cuentas de clientes para soportar operaciones de dinero en una aplicación **offline first**, sin perder seguridad, trazabilidad ni control desde backend.

La idea principal es:

```txt
Offline registra la operación como pendiente.
Backend confirma la operación como oficial.
El saldo real se calcula solo con movimientos confirmados.
```

Este documento no define tablas, queries ni estrategia de base de datos. Define contratos de dominio y criterios de uso para implementación real en Yola Fresh App.

---

## Problema actual

El sistema actual ya diferencia correctamente:

- Cuenta del cliente.
- Movimientos de cuenta.
- Cobros del cliente.
- Aplicaciones del cobro.
- Pago capturado en contexto POS.

Sin embargo, para operaciones monetarias offline, falta distinguir claramente si un movimiento está:

- Registrado localmente.
- Pendiente de confirmación.
- Confirmado por backend.
- Rechazado por backend.
- Anulado.

Actualmente, un estado como `ACTIVO` no es suficiente para saber si el movimiento ya fue aceptado oficialmente.

---

## Decisión arquitectónica

Las operaciones de cuentas de clientes **pueden seguir siendo offline first**, pero la autoridad final debe estar en el backend.

### Regla principal

```txt
La app puede capturar dinero offline.
El backend debe confirmar el dinero oficialmente.
```

### Flujo recomendado

```txt
POS / App
  ↓
SQLite local
  ↓
Movimiento pendiente
  ↓
Cola de sincronización
  ↓
Backend API
  ↓
Validación + idempotencia
  ↓
Movimiento confirmado
  ↓
Saldo oficial actualizado
  ↓
CouchDB / SQLite reciben estado confirmado
```

---

# 1. CuentaCliente

## Rol de la entidad

`CuentaCliente` debe representar un **resumen/cache** del saldo del cliente, no la fuente principal de verdad.

La fuente real del saldo debe ser el historial de movimientos confirmados.

## Contrato actual en la librería

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L239-L244)

```ts
export interface CuentaCliente {
  clienteId: string;
  saldoActual: number;
  moneda: "PEN" | "USD";
  updatedAt: Date;
}
```

## Significado recomendado

```txt
saldoActual = saldo confirmado por backend
```

No debe incluir movimientos pendientes offline.

Si se desea mostrar saldo proyectado en UI, debe calcularse aparte desde movimientos pendientes.

Ejemplo:

```txt
Saldo confirmado: S/ 500.00
Abonos pendientes: S/ 1000.00
Saldo proyectado local: S/ 1500.00
```

Pero el saldo oficial sigue siendo:

```txt
S/ 500.00
```

---

# 2. MovimientoCuentaCliente

## Rol de la entidad

`MovimientoCuentaCliente` representa cada evento que afecta la cuenta del cliente.

Ejemplos:

- Cargo por venta al crédito.
- Abono del cliente.
- Saldo a favor.
- Uso de saldo.
- Devolución.
- Anulación.

Esta entidad es la pieza principal del sistema porque explica cómo se llegó al saldo actual.

---

## Tipos de movimiento

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L198-L203)

```ts
export type TipoMovimientoCuentaCliente =
  | "CARGO"
  | "ABONO"
  | "SALDO_FAVOR"
  | "USO_SALDO"
  | "DEVOLUCION";
```

## Tipos de referencia

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L205-L211)

```ts
export type ReferenciaTipoMovimientoCuentaCliente =
  | "VENTA"
  | "PAGO"
  | "ADELANTO"
  | "RECURRENCIA"
  | "AJUSTE"
  | "DEVOLUCION";
```

---

## Estado actual en la librería

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L213-L216)

```ts
export type EstadoMovimientoCuenta =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "RECHAZADO"
  | "ANULADO";
```

### Significado de cada estado

| Estado | Significado |
|---|---|
| `PENDIENTE` | Registrado localmente, todavía no confirmado por backend. |
| `CONFIRMADO` | Aceptado oficialmente por backend. Impacta el saldo real. |
| `RECHAZADO` | El backend no aceptó la operación. No impacta saldo real. |
| `ANULADO` | Fue confirmado, pero luego se anuló mediante trazabilidad. |

---

## Contrato actual en la librería

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L218-L236)

```ts
export interface MovimientoCuentaCliente {
  id: string;
  clienteId: string;

  tipo: TipoMovimientoCuentaCliente;
  monto: number;
  moneda: "PEN" | "USD";

  referenciaTipo: ReferenciaTipoMovimientoCuentaCliente;
  referenciaId?: string;

  descripcion?: string;
  estado: EstadoMovimientoCuenta;

  idempotencyKey: string;

  cajaId?: string;
  turnoCajaId?: string;
  dispositivoId?: string;
  creadoPorId: string;

  reversaDeId?: string;
  anuladoPorId?: string;
  anuladoAt?: Date;
  anulacionMotivo?: string;

  rechazoMotivo?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## Campos nuevos mínimos

### `estado`

Permite diferenciar si el movimiento todavía es local, si fue aceptado por backend, si fue rechazado o si fue anulado.

---

### `idempotencyKey`

Campo obligatorio para evitar duplicados por reintentos.

Ejemplo de problema:

```txt
1. Cajero registra abono de S/ 1000.
2. La app envía al backend.
3. El backend guarda el movimiento.
4. La app pierde conexión antes de recibir respuesta.
5. La app reintenta.
6. Sin idempotencia, se crea otro abono de S/ 1000.
```

Con `idempotencyKey`, el backend detecta que la operación ya fue procesada y devuelve el mismo resultado sin duplicar.

Ejemplo de generación:

```ts
const idempotencyKey = `${dispositivoId}:${turnoCajaId}:${clienteId}:${id}`;
```

---

### `dispositivoId`

Identifica desde qué POS, móvil o equipo se generó el movimiento.

Es importante para auditoría y diagnóstico.

---

### `creadoPorId`

Identifica qué usuario/cajero registró la operación.

Es obligatorio para operaciones de dinero.

---

### `cajaId` y `turnoCajaId`

Relacionan el movimiento con la operación real de caja.

No siempre serán obligatorios, pero para abonos, cobros y movimientos monetarios deberían existir cuando la operación nace desde POS.

---

### `rechazoMotivo`

Permite explicar por qué el backend rechazó el movimiento.

Ejemplos:

```txt
Turno de caja cerrado.
Usuario sin permiso.
Cliente no existe.
Monto inválido.
Movimiento duplicado inválido.
```

---

# 3. CobroCliente

## Rol de la entidad

`CobroCliente` representa el dinero recibido de un cliente.

Un cobro puede aplicarse a:

- Una venta específica.
- Varias ventas.
- Saldo a favor.

---

## Estado actual en la librería

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L284-L289)

```ts
export type CobroClienteEstado =
  | "BORRADOR"
  | "PENDIENTE"
  | "CONFIRMADO"
  | "RECHAZADO"
  | "ANULADO";
```

### Significado

| Estado | Significado |
|---|---|
| `BORRADOR` | Cobro preparado, todavía no registrado como operación real. |
| `PENDIENTE` | Cobro capturado offline y pendiente de backend. |
| `CONFIRMADO` | Cobro aceptado por backend. |
| `RECHAZADO` | Backend no aceptó el cobro. |
| `ANULADO` | Cobro previamente confirmado, luego anulado. |

---

## Contrato actual en la librería

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L291-L320)

```ts
export type CobroClienteOrigen = "EFECTIVO" | "DIGITAL" | "TARJETA" | "OTRO";

export type CobroClienteEstado =
  | "BORRADOR"
  | "PENDIENTE"
  | "CONFIRMADO"
  | "RECHAZADO"
  | "ANULADO";

export type CobroClienteAplicacionTipo = "VENTA" | "SALDO_FAVOR";

export interface CobroClienteAplicacion {
  id: string;
  tipo: CobroClienteAplicacionTipo;
  ventaId?: string;
  monto: number;
  createdAt: Date;
}

export interface CobroCliente {
  id: string;
  clienteId: string;
  moneda: "PEN" | "USD";

  montoRecibido: number;

  origen: CobroClienteOrigen;
  metodoPago: MetodoPago;

  estado: CobroClienteEstado;

  idempotencyKey: string;
  dispositivoId?: string;

  cajaId?: string;
  turnoCajaId?: string;
  movimientoCajaId?: string;

  aplicaciones: CobroClienteAplicacion[];

  creadoPorId: string;
  confirmadoPorId?: string;
  confirmadoAt?: Date;

  anuladoPorId?: string;
  anuladoAt?: Date;
  anulacionMotivo?: string;

  rechazoMotivo?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## Relación entre CobroCliente y MovimientoCuentaCliente

Un `CobroCliente` puede generar uno o más movimientos de cuenta.

Ejemplo 1: cobro aplicado a deuda de venta

```txt
CobroCliente
  montoRecibido: 100
  aplicaciones:
    - tipo: VENTA
      ventaId: venta_001
      monto: 100

MovimientoCuentaCliente
  tipo: ABONO
  monto: 100
  referenciaTipo: PAGO
  referenciaId: cobro_001
```

Ejemplo 2: cobro que queda como saldo a favor

```txt
CobroCliente
  montoRecibido: 1000
  aplicaciones:
    - tipo: SALDO_FAVOR
      monto: 1000

MovimientoCuentaCliente
  tipo: SALDO_FAVOR
  monto: 1000
  referenciaTipo: ADELANTO
  referenciaId: cobro_002
```

---

# 4. Pago

## Rol de la entidad

`Pago` representa la captura o confirmación de un medio de pago en contexto POS.

Ejemplos:

- Yape detectado.
- Plin detectado.
- Efectivo recibido.
- Tarjeta confirmada.

`Pago` no siempre debe modificar directamente la cuenta del cliente. Primero puede existir como captura, luego aplicarse a una venta o cuenta.

---

## Recomendación

Mantener `Pago` como entidad de captura/conciliación y conectarlo con `CobroCliente` cuando el pago se use para cuentas de cliente.

Flujo sugerido:

```txt
Pago capturado
  ↓
CobroCliente confirmado
  ↓
MovimientoCuentaCliente generado
  ↓
CuentaCliente actualizada como resumen
```

Contrato actual: [pagos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pagos.ts#L3-L51)

```ts
export enum EstadoPagoCapturaEnum {
  CAPTURADO = "CAPTURADO",
  CONFIRMADO = "CONFIRMADO",
  APLICADO = "APLICADO",
  RECHAZADO = "RECHAZADO",
  ANULADO = "ANULADO",
}

export interface Pago {
  id: string;
  clienteId?: string;
  ventaId?: string;
  montoAplicado?: number;
  fechaAplicacion?: number;
  proveedor: "YAPE" | "PLIN" | "EFECTIVO" | "TARJETA" | "OTRO";
  tipoMedio: MetodoPago;
  idTransaccionProveedor?: string;
  emisorReferencia?: string;
  nombrePaquete?: string;
  tituloNotificacion?: string;
  origen?: string;
  montoRecibido: number;
  montoEsperado?: number;
  moneda: "PEN" | "USD";
  estado: EstadoPagoCapturaEnum;
  usuarioConfirmaId?: string;
  fechaConfirmacion?: number;
  conciliado?: boolean;
  conciliadoAt?: number;
  dispositivoId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  fechaCaptura: number;
  rawMensaje?: string;
}
```

---

# 5. Reglas de saldo

## Saldo confirmado

El saldo oficial se calcula solo con movimientos confirmados.

```ts
const saldoConfirmado = movimientos
  .filter(m => m.estado === "CONFIRMADO")
  .reduce((total, mov) => total + calcularImpacto(mov), 0);
```

---

## Impacto por tipo de movimiento

| Tipo | Impacto sugerido |
|---|---:|
| `CARGO` | Aumenta deuda |
| `ABONO` | Reduce deuda o aumenta saldo a favor según contexto |
| `SALDO_FAVOR` | Aumenta saldo a favor |
| `USO_SALDO` | Reduce saldo a favor |
| `DEVOLUCION` | Depende del contexto de devolución |

La interpretación exacta depende de cómo se modele el signo del saldo:

- Saldo positivo como deuda del cliente.
- Saldo positivo como saldo a favor del cliente.

Se recomienda definir una sola convención y mantenerla en todo el sistema.

---

# 6. Regla de anulación

No se deben borrar movimientos de dinero.

Incorrecto:

```txt
Eliminar movimiento confirmado.
```

Correcto:

```txt
Crear relación de anulación o marcar como ANULADO con auditoría.
```

Campos relacionados:

```ts
reversaDeId?: string;
anuladoPorId?: string;
anuladoAt?: Date;
anulacionMotivo?: string;
```

---

# 7. Flujo de abono offline

```txt
1. Cajero registra abono del cliente.
2. App crea MovimientoCuentaCliente con estado PENDIENTE.
3. App genera idempotencyKey.
4. App guarda en SQLite.
5. UI muestra “pendiente de confirmación”.
6. Cuando hay internet, app envía al backend.
7. Backend valida usuario, caja, turno, cliente, monto e idempotencia.
8. Backend confirma o rechaza.
9. App actualiza el movimiento local.
10. Si confirma, el saldo oficial cambia.
```

---

# 8. Flujo de consumo de saldo offline

```txt
1. Cliente compra usando cuenta o saldo.
2. App revisa saldo confirmado local disponible.
3. App crea movimiento USO_SALDO o CARGO pendiente.
4. Cuando hay internet, backend valida.
5. Si el saldo confirmado era suficiente, confirma.
6. Si no era suficiente, rechaza o genera observación.
```

Recomendación:

```txt
No permitir usar abonos pendientes como saldo oficial.
```

Ejemplo:

```txt
Saldo confirmado: S/ 500
Abono pendiente: S/ 1000
Disponible oficial: S/ 500
Saldo proyectado local: S/ 1500
```

---

# 9. Backend como autoridad

El backend debe ser responsable de:

- Confirmar movimientos.
- Rechazar movimientos inválidos.
- Evitar duplicados por `idempotencyKey`.
- Validar permisos.
- Validar caja y turno.
- Validar cliente.
- Actualizar resumen `CuentaCliente`.
- Publicar datos confirmados a CouchDB si corresponde.

Permisos relacionados: [permisos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/permisos.ts#L66-L77)

```ts
CUENTAS_VER = "cuentas:ver",
CUENTAS_VER_PROPIAS = "cuentas:ver-propias",
CUENTAS_VER_TODAS = "cuentas:ver-todas",
CUENTAS_CREAR_CREDITO = "cuentas:crear-credito",
CUENTAS_REGISTRAR_PAGO = "cuentas:registrar-pago",
CUENTAS_EDITAR = "cuentas:editar",
CUENTAS_ANULAR = "cuentas:anular",
CUENTAS_AJUSTAR_DEUDA = "cuentas:ajustar-deuda",
CUENTAS_VER_HISTORIAL = "cuentas:ver-historial",
CUENTAS_VER_MOROSIDAD = "cuentas:ver-morosidad",
CUENTAS_EXPORTAR = "cuentas:exportar",
```

---

# 10. Campos que NO se agregan por ahora

Para mantener el modelo simple, no se agregan todavía:

- `estadoSync` separado.
- `fechaServidor`.
- `empresaId` obligatorio en el contrato base.
- `version`.
- `hashAuditoria`.
- `ipOrigen`.
- `metadata` compleja.

Estos campos pueden agregarse después si el sistema crece o si auditoría/soporte lo exige.

---

# 11. Resumen de cambios mínimos

## MovimientoCuentaCliente

Estados:

```txt
PENDIENTE / CONFIRMADO / RECHAZADO / ANULADO
```

Agregar:

```txt
idempotencyKey
dispositivoId
creadoPorId
updatedAt
rechazoMotivo
```

Mantener:

```txt
reversaDeId
anuladoPorId
anuladoAt
anulacionMotivo
referenciaTipo
referenciaId
```

---

## CobroCliente

Estados:

```txt
BORRADOR / PENDIENTE / CONFIRMADO / RECHAZADO / ANULADO
```

Agregar:

```txt
idempotencyKey
dispositivoId
rechazoMotivo
```

---

## CuentaCliente

Mantener simple:

```ts
export interface CuentaCliente {
  clienteId: string;
  saldoActual: number;
  moneda: "PEN" | "USD";
  updatedAt: Date;
}
```

Pero definir claramente:

```txt
saldoActual = saldo confirmado, no saldo proyectado.
```

---

# 12. Entidades relacionadas

## Cliente

Fuente: [persons.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L131-L167)

```ts
export interface Cliente extends Entidad {
  tipoEntidad: "Cliente";
  nombres: string;
  apellidos?: string;
  celular: string;
  correo: string;
  dni: string;
  direccion: string;
  pseudonimo: string;
  creditosPendientes?: number;
  limiteCredito?: number;
  historialCompras: string[];
  fechaUltimaCompra?: Date;
  totalGastado: number;
  descuentoEspecial?: number;
  categoriaCliente: CategoriaCliente;
  preferencias?: PreferenciasCliente;
  facturacion?: InformacionFacturacion;
}
```

## Método de pago

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L1-L1)

```ts
export type MetodoPago = "DIGITAL" | "EFECTIVO" | "TARJETA" | "OTRO";
```

---

# 13. Conclusión

La reestructuración no busca inflar las entidades, sino agregar los campos mínimos necesarios para que el sistema soporte dinero en modo offline first sin duplicaciones ni inconsistencias.

La regla final es:

```txt
Offline captura.
Backend confirma.
Ledger explica.
Saldo resume.
Anulación audita.
```
