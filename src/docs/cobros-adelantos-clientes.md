# Cobros, adelantos y saldo a favor (implementación exterior)

Este documento describe cómo implementar en un proyecto consumidor (POS/ERP) la gestión de:
- adelantos sin venta
- pagos parciales
- pagos en exceso (saldo a favor)
- aplicación del saldo a favor a futuras ventas
- anulación/reversión con trazabilidad

La librería define contratos (interfaces/types) y entidades de negocio; el proyecto consumidor implementa persistencia, sincronización y casos de uso.

## Contratos involucrados

- Cuenta corriente cliente:
  - `MovimientoCuentaCliente`, `CuentaCliente`
  - `TipoMovimientoCuentaCliente`: `CARGO | ABONO | SALDO_FAVOR | USO_SALDO | DEVOLUCION`
  - `ReferenciaTipoMovimientoCuentaCliente`: incluye `ADELANTO`
  - Archivo: `src/domain/shared/interfaces/finanzas.ts`

- Documento de cobro (para agrupar aplicaciones y trazabilidad):
  - `CobroCliente`, `CobroClienteAplicacion`
  - Archivo: `src/domain/shared/interfaces/finanzas.ts`

- Caja / turno:
  - `MovimientoCaja`, `TurnoCaja`
  - `ReferenciaTipoMovimientoCaja`: incluye `ADELANTO`
  - Archivo: `src/domain/shared/interfaces/caja.ts`

- Captura de pago (opcional):
  - `Pago`
  - Archivo: `src/domain/shared/interfaces/pagos.ts`

## Convención de saldos (recomendación)

Definir una convención única para `CuentaCliente.saldoActual`:
- `saldoActual > 0`: deuda del cliente (cuenta por cobrar)
- `saldoActual < 0`: saldo a favor del cliente (crédito disponible)

Alternativa: mantener `saldoActual` siempre positivo y derivar “saldo a favor” desde movimientos. Si eliges esto, documenta cómo se calcula y cómo se evita doble contabilización.

## Regla contable mínima (ERP)

1) El dinero real que entra/sale se registra con `MovimientoCaja`.
2) La relación deuda/favor del cliente se registra con `MovimientoCuentaCliente`.
3) Aplicar saldo a favor a una venta NO mueve caja (solo mueve cuenta corriente).
4) No borrar registros para “corregir”: anular y registrar reversas.

## Flujo 1: Adelanto sin venta (cliente deja S/ 1000)

Objetivo: registrar que el cliente dejó dinero sin asociarlo aún a una venta.

### 1.1 Crear `CobroCliente`

- `montoRecibido = 1000`
- `aplicaciones = [{ tipo: \"SALDO_FAVOR\", monto: 1000 }]`
- `estado = \"CONFIRMADO\"` (o `BORRADOR` si hay revisión previa)

### 1.2 Registrar ingreso en caja

Crear `MovimientoCaja`:
- `tipo = \"INGRESO\"`
- `monto = 1000`
- `metodoPago` y `moneda`
- `referenciaTipo = \"ADELANTO\"`
- `referenciaId = cobroCliente.id`
- `clienteId = cobroCliente.clienteId`
- `turnoId` del turno activo
- `saldoEfectivoPosterior/saldoDigitalPosterior/saldoTotalPosterior` calculados por el consumer

Guardar el `movimientoCaja.id` en `cobroCliente.movimientoCajaId`.

### 1.3 Registrar cuenta corriente del cliente

Crear `MovimientoCuentaCliente`:
- `tipo = \"SALDO_FAVOR\"`
- `monto = 1000`
- `referenciaTipo = \"ADELANTO\"`
- `referenciaId = cobroCliente.id`
- `estado = \"ACTIVO\"`

### 1.4 Resultado esperado

- Caja sube S/ 1000
- Cuenta cliente queda con saldo a favor (según convención, `saldoActual` negativo o movimientos que lo respalden)

## Flujo 2: Venta a crédito de S/ 2000 (genera deuda)

Cuando se confirma una venta a crédito, registrar el cargo:

Crear `MovimientoCuentaCliente`:
- `tipo = \"CARGO\"`
- `monto = 2000`
- `referenciaTipo = \"VENTA\"`
- `referenciaId = ventaId`
- `estado = \"ACTIVO\"`

## Flujo 3: Pago parcial de deuda (cliente paga S/ 1000 de una deuda de 2000)

### 3.1 Crear `CobroCliente`

- `montoRecibido = 1000`
- `aplicaciones = [{ tipo: \"VENTA\", ventaId, monto: 1000 }]`

### 3.2 Caja

`MovimientoCaja`:
- `tipo = \"INGRESO\"`
- `referenciaTipo = \"PAGO\"`
- `referenciaId = cobroCliente.id`
- `clienteId = clienteId`

### 3.3 Cuenta corriente

`MovimientoCuentaCliente`:
- `tipo = \"ABONO\"`
- `monto = 1000`
- `referenciaTipo = \"PAGO\"`
- `referenciaId = cobroCliente.id`

## Flujo 4: Sobrepago (cliente debe 2000 y deja 3000)

### 4.1 Crear `CobroCliente` con 2 aplicaciones

- `montoRecibido = 3000`
- `aplicaciones`:
  - `{ tipo: \"VENTA\", ventaId, monto: 2000 }`
  - `{ tipo: \"SALDO_FAVOR\", monto: 1000 }`

### 4.2 Caja

`MovimientoCaja` por S/ 3000 (ingreso real).

### 4.3 Cuenta corriente

Crear dos movimientos:
- `ABONO` por 2000 (referencia al `CobroCliente`)
- `SALDO_FAVOR` por 1000 (misma referencia)

## Flujo 5: Usar saldo a favor en una nueva venta

Si el cliente tiene saldo a favor y se aplica S/ 500 a una venta:

Crear `MovimientoCuentaCliente`:
- `tipo = \"USO_SALDO\"`
- `monto = 500`
- `referenciaTipo = \"VENTA\"`
- `referenciaId = ventaId`

Opcionalmente, reflejar esta aplicación dentro del documento de cobro o en un documento interno de “aplicación”, según tu UX.

## Flujo 6: Anulación / reversión (sin borrar)

### 6.1 Anular `CobroCliente`

Cambiar:
- `estado = \"ANULADO\"`
- `anuladoPorId`, `anuladoAt`, `anulacionMotivo`

### 6.2 Revertir caja

Crear un `MovimientoCaja` compensatorio (o anular el original si tu política lo permite):
- Si el original queda `ANULADO`, conserva trazabilidad del motivo.

### 6.3 Revertir cuenta corriente

Para cada `MovimientoCuentaCliente` generado por el cobro:
- registrar una reversa con `reversaDeId = movimientoOriginal.id`
- `estado = \"ACTIVO\"` en la reversa
- y marcar el original como `estado = \"ANULADO\"` con motivo, si tu política usa estados.

La reversa debe compensar el mismo monto pero con el tipo correspondiente según tu regla contable (por ejemplo, revertir `SALDO_FAVOR` con un movimiento que retire ese favor, o un `AJUSTE` interno según tu convención).

## Validaciones mínimas recomendadas (consumer)

- `CobroCliente.aplicaciones` debe sumar exactamente `montoRecibido`.
- Si una aplicación es `tipo=\"VENTA\"`, `ventaId` es obligatorio.
- No permitir aplicar más de lo pendiente en una venta (si hay sobrepago, el excedente pasa a `SALDO_FAVOR`).
- No permitir `USO_SALDO` si no hay saldo suficiente, salvo que lo permitas explícitamente como crédito.

## Offline-first (consumer)

- Guardar primero localmente (SQLite vía PouchDB adapter sqlite).
- En sincronización, emitir documentos y movimientos como eventos idempotentes (IDs deterministas o control de duplicados).
- En conflictos, priorizar inmutabilidad: no editar movimientos ya sincronizados; emitir anulaciones/reversas.
