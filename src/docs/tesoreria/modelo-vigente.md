# Modelo Vigente de Tesoreria

## Visión general

El Domain de tesoreria modela dinero operativo: cajas, turnos, movimientos y pagos capturados en el flujo diario.

La evidencia vigente está en:

- [caja.contract.ts](../../domain/tesoreria/contracts/caja.contract.ts)
- [pago.contract.ts](../../domain/tesoreria/contracts/pago.contract.ts)

## Conceptos principales

### `Caja`

Representa contenedor operativo de dinero.

Responsabilidades observadas:

- identificar caja;
- declarar tipo físico, móvil o digital;
- vincular sucursal cuando existe;
- expresar estado activa/inactiva.

### `TurnoCaja`

Representa sesión operativa de caja.

Responsabilidades observadas:

- vincular caja, usuario y dispositivo;
- conservar montos iniciales, esperados y contados;
- expresar estado del turno;
- dejar rastro de validación supervisor cuando existe.

### `MovimientoCaja`

Representa impacto real sobre caja o medio de custodia.

Responsabilidades observadas:

- declarar ingreso o egreso;
- expresar subtipo y referencia de origen;
- conservar saldo posterior;
- registrar método de pago y responsable de generación.

### `Pago`

Representa evidencia de pago capturada desde sistema externo y validada operativamente por usuario humano.

Responsabilidades observadas:

- registrar proveedor o canal de pago;
- conservar monto recibido y esperado;
- expresar estado de captura, validación y eventual aplicación;
- vincular venta solo cuando evidencia se aplica;
- permitir existencia de pagos sin venta asociada;
- mantener contexto POS, caja y turno cuando existen.

Lectura importante:

- `Pago` no nace en `Venta`;
- `Pago` nace como evidencia capturada por sistema externo;
- `Pago` puede llegar tarde o no usarse a tiempo;
- `Pago` huérfano es estado válido del modelo.

## Estados y clasificaciones

### Tipo de caja

- `FIJA`
- `MOVIL`
- `DIGITAL`

### Estado de turno

- `ABIERTO`
- `ARQUEO`
- `CERRADO`
- `DEFICIT`

### Tipo de movimiento de caja

- `INGRESO`
- `EGRESO`

### Subtipo de movimiento

- `VENTA`
- `GASTO`
- `CAMBIO`
- `ANULACION`
- `AJUSTE`

### Estado de movimiento de caja

- `ACTIVO`
- `ANULADO`

### Estado de pago capturado

- `CAPTURADO`
- `CONFIRMADO`
- `APLICADO`
- `RECHAZADO`
- `ANULADO`

## Relaciones de negocio

### Con `Venta`

La venta responde qué se vendió. Tesoreria responde qué evidencia de pago se recibió, si fue validada y si llegó a aplicarse a una venta concreta.

### Con `Cuenta cliente`

`Pago` y `MovimientoCaja` no sustituyen deuda, saldo a favor ni imputaciones del cliente.

### Con `Finanzas`

Tesoreria expresa operación diaria del dinero. Finanzas consolida egresos, ingresos u otras lecturas de relación monetaria.

## Reglas de negocio respaldadas por evidencia

- `Pago.ventaId` solo se asigna cuando usuario relaciona evidencia con una venta;
- un `Pago` puede existir sin `ventaId` y seguir siendo válido;
- el estado `CAPTURADO` expresa llegada de evidencia desde sistema externo;
- el estado `CONFIRMADO` expresa validación humana de esa evidencia;
- el estado `APLICADO` expresa asociación efectiva a una venta;
- `MovimientoCaja.monto` se maneja siempre positivo;
- el turno conserva diferencia y motivo cuando conteo no cuadra;
- el pago puede requerir validación humana antes de quedar confirmado o aplicado;
- tesoreria conserva referencia a caja y turno sin contaminar el contrato primario de `Venta`.

## Restricciones observadas

- moneda observada: `PEN` y `USD`;
- el paquete define contratos de tesoreria, no procesos completos de apertura, cierre o conciliación automática;
- la fuente canónica vigente vive en `tesoreria/contracts`;
- la captura primaria del pago ocurre fuera de este paquete y fuera del POS.

## Decisiones vigentes observables

- `CAPTURADO` expresa llegada de evidencia externa, `CONFIRMADO` expresa validación humana y `APLICADO` expresa relación manual con una venta;
- `DEFICIT` existe como estado explícito de `TurnoCaja` cuando hay diferencia y el contrato conserva campos de validación por supervisor;
- tesorería queda limitada a operación de caja, turnos, movimientos y evidencias de pago; consolidación financiera formal queda fuera de este Domain.

## Referencias

- [README.md](./README.md)
- [../ventas/README.md](../ventas/README.md)
- [../finanzas/README.md](../finanzas/README.md)
- [../finanzas/cuenta-cliente-modelo-vigente.md](../finanzas/cuenta-cliente-modelo-vigente.md)
