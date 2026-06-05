# Guía de Reimplementación — Auditoría y Trazabilidad Monetaria

Esta guía aterriza los cambios recientes de auditoría y trazabilidad en `yolafresh-utils` para que **backend** y **frontend** se adapten sin mezclar infraestructura dentro de la librería.

## 1. Objetivo

El objetivo del ajuste es separar correctamente:

- la **entidad de negocio**,
- la **trazabilidad oficial del dinero**,
- la **custodia/recepción humana**,
- y la **auditoría detallada de cambios**.

La regla principal queda así:

```txt
No toda auditoría vive dentro de cada entidad.
La trazabilidad oficial del dinero vive en ledger/journal.
La auditoría detallada vive en un contrato separado.
```

## 2. Qué cambió en la librería

### 2.1 `Pago`

Fuente: [pagos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pagos.ts#L11-L52)

Cambios relevantes:

```ts
export interface Pago {
  id: string;
  clienteId?: string;
  movimientoCajaId?: string;
  ventaId?: string;
  montoAplicado?: number;
  fechaAplicacion?: number;
  proveedor: "YAPE" | "PLIN" | "EFECTIVO" | "TARJETA" | "OTRO";
  tipoMedio: MetodoPago;
  montoRecibido: number;
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

Interpretación:

- `Pago` queda como **captura / conciliación / evidencia**.
- No debe tratarse como la entidad universal para cualquier cobro.
- `movimientoCajaId` permite enlazar el pago con la caja cuando realmente impactó operación de caja.

### 2.2 `CobroCliente`

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L323-L358)

Cambios relevantes:

```ts
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
  derivadoACajaId?: string;
  derivadoATurnoCajaId?: string;
  derivadoACajeroId?: string;
  derivadoPorId?: string;
  derivadoAt?: Date;
  aplicaciones: CobroClienteAplicacion[];
  creadoPorId: string;
  recibidoPorId?: string;
  entregadoPorId?: string;
  entregadoAt?: Date;
  recibidoEnCajaPorId?: string;
  recibidoEnCajaAt?: Date;
  confirmadoPorId?: string;
  confirmadoAt?: Date;
  rechazadoPorId?: string;
  rechazadoAt?: Date;
  anuladoPorId?: string;
  anuladoAt?: Date;
  anulacionMotivo?: string;
  rechazoMotivo?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Interpretación:

- `CobroCliente` pasa a ser la entidad principal para modelar:
  - dinero recibido del cliente,
  - derivación operativa hacia caja/turno custodio,
  - custodia humana,
  - entrega a caja,
  - confirmación operativa.
- Si ventas recibe dinero pero caja todavía no lo acepta, el cobro puede existir **sin** `MovimientoCaja` confirmado.
- `cajaId` y `turnoCajaId` deben leerse como la caja/turno que finalmente asumieron la recepción oficial.
- `derivadoACajaId` y `derivadoATurnoCajaId` representan el objetivo operativo mientras el cobro aún no ha sido aceptado por el custodio.

### 2.3 `MovimientoCaja`

Fuente: [caja.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/caja.ts#L82-L109)

Interpretación:

- `MovimientoCaja` sigue siendo la **trazabilidad oficial del dinero en caja**.
- Es el registro canónico cuando el dinero entra o sale oficialmente del turno.
- No debe crearse prematuramente solo porque alguien “recibió” dinero.

### 2.4 `MovimientoCuentaCliente`

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L235-L257)

Interpretación:

- `MovimientoCuentaCliente` sigue siendo la **trazabilidad oficial de la deuda/saldo del cliente**.
- Aquí vive el ledger de cuenta corriente:
  - `CARGO`
  - `ABONO`
  - `SALDO_FAVOR`
  - `USO_SALDO`
  - `DEVOLUCION`

### 2.5 `AuditLog`

Fuente: [ledger.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/ledger.ts#L93-L109)

Contrato disponible:

```ts
export type AuditAccion = "CREADO" | "ACTUALIZADO" | "ANULADO" | "ELIMINADO";

export interface AuditLogCambio {
  campo: string;
  anterior: unknown;
  nuevo: unknown;
}

export interface AuditLog {
  id: string;
  entidad: string;
  entidadId: string;
  accion: AuditAccion;
  usuarioId: string;
  fecha: Date;
  cambios?: AuditLogCambio[];
}
```

Interpretación:

- La auditoría detallada de cambios ya tiene contrato separado.
- No es necesario inflar cada entidad monetaria con:
  - `oldValue`
  - `newValue`
  - IP
  - endpoint
  - metadata técnica

## 3. Regla arquitectónica recomendada

### 3.1 Lo que sí va dentro de la entidad

Solo auditoría mínima y contextual:

- `createdAt`
- `updatedAt`
- `creadoPorId`
- estado
- derivación / recepción / confirmación cuando son parte central del flujo
- anulación / rechazo si aplica
- referencias a caja / turno / movimiento cuando el flujo lo requiere

### 3.2 Lo que no debe repetirse en todas las entidades

No repetir en cada contrato:

- historial completo de cambios de campos,
- before/after values,
- logs técnicos,
- IP origen,
- endpoint,
- session id,
- metadata de persistencia.

Eso corresponde a `AuditLog` o a la infraestructura del consumer.

## 4. Cómo debe adaptarse el backend

### 4.1 Tratar `MovimientoCaja` como verdad oficial de caja

Backend debe asumir:

```txt
Si no existe MovimientoCaja confirmado,
el dinero todavía no es saldo oficial de caja.
```

Aplicación práctica:

- no aumentar saldo de caja solo porque existe `CobroCliente`,
- no considerar “dinero recibido por ventas” como caja oficial,
- generar `MovimientoCaja` solo al aceptar el dinero en turno/caja.

### 4.2 Tratar `MovimientoCuentaCliente` como verdad oficial de cuenta

Backend debe asumir:

```txt
La deuda o saldo del cliente se explica por MovimientoCuentaCliente.
```

Aplicación práctica:

- venta al crédito -> `CARGO`
- abono -> `ABONO`
- adelanto -> `SALDO_FAVOR`
- consumo de saldo -> `USO_SALDO`

### 4.3 Usar `CobroCliente` para recepción/custodia

Backend debe usar `CobroCliente` cuando:

- un cliente entrega dinero,
- hay intervención humana antes de caja,
- el dinero debe derivarse a un cajero custodio,
- el cobro puede quedar pendiente de entrega,
- el cajero confirma posteriormente.

Flujo recomendado:

```txt
1. Cliente entrega dinero.
2. Se crea CobroCliente.
3. Se registra recibidoPorId.
4. Si quien recibió no es el custodio, se registra la derivación con `derivadoACajaId`, `derivadoATurnoCajaId`, `derivadoACajeroId`, `derivadoPorId` y `derivadoAt`.
5. Si ventas entrega a caja, se registra entregadoPorId / entregadoAt.
6. Si caja acepta oficialmente, se registra recibidoEnCajaPorId / recibidoEnCajaAt y se asignan `cajaId` / `turnoCajaId`.
7. Recién ahí se crea o enlaza MovimientoCaja.
8. Se confirma el cobro.
```

### 4.4 Reservar `Pago` para captura/conciliación

Backend debe usar `Pago` principalmente para:

- Yape,
- Plin,
- tarjeta,
- integraciones,
- notificaciones externas,
- conciliación o validación previa.

No debe usar `Pago` obligatoriamente para cada cobro manual en efectivo.

### 4.5 Usar `AuditLog` para cambios auditables

Backend debe emitir `AuditLog` cuando realmente necesite registrar:

- quién cambió qué,
- cuándo,
- con qué valores previos y nuevos.

Ejemplo conceptual:

```txt
CobroCliente CONFIRMADO -> AuditLog
CobroCliente ANULADO -> AuditLog
Cambio manual de cajaId o turnoCajaId -> AuditLog
Rechazo operativo por cajero custodio -> AuditLog
```

## 5. Cómo debe adaptarse el frontend

### 5.1 No asumir que cobro = caja

Frontend debe dejar de interpretar:

```txt
si existe CobroCliente, entonces el dinero ya entró a caja
```

En su lugar:

- mostrar recepción,
- mostrar entrega,
- mostrar confirmación en caja,
- diferenciar “recibido” de “oficial”.

### 5.2 Mostrar etapas humanas del cobro

Frontend debería poder mostrar:

- quién recibió el dinero,
- a qué caja/turno/cajero fue derivado,
- quién lo entregó a caja,
- quién lo recibió en caja,
- quién rechazó la recepción,
- quién lo confirmó,
- si fue rechazado o anulado.

### 5.3 No usar `Pago` como sinónimo de cobro

Frontend debe distinguir:

- `Pago` = evidencia/captura
- `CobroCliente` = dinero recibido del cliente
- `MovimientoCaja` = dinero oficial en caja

### 5.4 Estados sugeridos en UI

Aunque la librería no impone una pantalla, la UI debería reflejar algo como:

```txt
Recibido
Derivado
Pendiente de recepción
Recibido en caja
Entregado a caja
Confirmado
Rechazado
Anulado
```

Si el estado formal sigue siendo simple en el contrato, estos labels pueden derivarse de los timestamps y usuarios presentes.

## 6. Qué no debe hacer backend ni frontend

### No hacer esto

- crear `MovimientoCaja` apenas ventas recibe dinero,
- marcar `cajaId` o `turnoCajaId` como definitivos mientras el cobro solo está derivado,
- usar `Pago` para cada cobro manual en efectivo,
- guardar auditoría pesada en todas las entidades,
- usar `MovimientoFinanciero` como fuente canónica del dinero.

### Sí hacer esto

- usar `MovimientoCaja` como rastro oficial de caja,
- usar `MovimientoCuentaCliente` como rastro oficial de cuenta,
- usar `CobroCliente` para recepción/custodia,
- usar los nuevos campos de derivación para distinguir intención operativa de recepción oficial,
- usar `AuditLog` para historial detallado de cambios.

## 7. Lectura correcta de cada contrato

```txt
Venta = documento comercial
CobroCliente = dinero recibido del cliente y su custodia
Pago = captura/conciliación/evidencia
MovimientoCuentaCliente = ledger oficial de deuda/saldo
MovimientoCaja = ledger oficial de caja
AuditLog = auditoría detallada de cambios
```

## 8. Plan mínimo de migración

### Backend

- dejar de usar `Pago` como entidad universal para todo cobro,
- crear `CobroCliente` cuando el cliente entrega dinero,
- derivar el cobro a caja/turno/cajero custodio cuando el usuario originador no es custodio activo,
- crear `MovimientoCaja` solo cuando caja acepta oficialmente,
- emitir `AuditLog` para cambios importantes.

### Frontend

- separar visualmente recepción de caja confirmada,
- mostrar derivación, pendiente de aceptación y rechazo operativo,
- no mostrar todo cobro como caja efectiva,
- usar los nuevos campos de `CobroCliente` para timeline operativo,
- tratar `Pago` digital como evidencia y no como caja automática.

## 9. Conclusión

La adaptación recomendada no busca agregar complejidad gratuita.

Busca separar correctamente:

```txt
captura
custodia
confirmación
ledger
auditoría
```

Si backend y frontend siguen esta guía:

- el flujo será más profesional,
- la caja será más confiable,
- la cuenta cliente será más clara,
- y la auditoría dejará de estar dispersa o duplicada.
