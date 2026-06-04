# Guia de reimplementacion — Cuentas de Clientes Offline First

Esta guia describe **como reimplementar** el sistema de cuentas de clientes usando los contratos actuales de `yola-fresh-utils`, siguiendo la regla:

```txt
Offline captura.
Backend confirma.
Ledger explica.
Saldo resume.
```

No define base de datos, tablas ni queries. Se enfoca en **responsabilidades**, **flujo de uso** y **orden recomendado de implementacion**.

## 1. Objetivo de la reimplementacion

La reimplementacion busca que la app:

- pueda registrar operaciones de dinero sin internet,
- no trate como oficiales los movimientos todavia no confirmados,
- conserve trazabilidad completa,
- evite duplicados por reintentos,
- mantenga a backend como autoridad final.

## 2. Contratos involucrados

### 2.1 CuentaCliente

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L243-L248)

```ts
export interface CuentaCliente {
  clienteId: string;
  saldoActual: number;
  moneda: "PEN" | "USD";
  updatedAt: Date;
}
```

Uso recomendado:
- representa el **saldo confirmado**,
- funciona como resumen/cache,
- no debe mezclar pendientes offline.

### 2.2 MovimientoCuentaCliente

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L198-L241)

Uso recomendado:
- es el **ledger** del cliente,
- explica cada cambio del saldo,
- es la pieza principal para auditoria.

### 2.3 CobroCliente

Fuente: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L289-L327)

Uso recomendado:
- representa el dinero recibido,
- agrupa aplicaciones del cobro,
- puede derivar en uno o varios `MovimientoCuentaCliente`.

### 2.4 Pago

Fuente: [pagos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pagos.ts#L3-L51)

Uso recomendado:
- sirve para captura/conciliacion en contexto POS,
- no reemplaza a `CobroCliente`,
- puede ser la evidencia operativa previa al cobro de cuenta.

## 3. Regla de oro

Separar siempre estos conceptos:

- **captura local**: la app registra una operacion,
- **confirmacion oficial**: backend acepta o rechaza,
- **saldo oficial**: sale solo de confirmados,
- **saldo proyectado**: lo calcula la UI si quiere mostrar pendientes.

## 4. Modelo mental correcto

### 4.1 CuentaCliente no es la fuente de verdad

`CuentaCliente` no debe ser tratada como ledger.

Su rol correcto es:

```txt
resumen del saldo confirmado del cliente
```

### 4.2 MovimientoCuentaCliente si es la fuente explicativa

Todo cambio de deuda, abono, saldo a favor o devolucion debe poder explicarse con movimientos.

### 4.3 CobroCliente representa dinero recibido

No es solo "pago". Tambien sirve para:

- aplicar a una venta,
- aplicar a varias ventas,
- dejar saldo a favor.

## 5. Estrategia de reimplementacion

## Fase 1 — Separar saldo oficial de saldo proyectado

Objetivo:
- dejar claro en toda la app que `CuentaCliente.saldoActual` es solo saldo confirmado.

Debes hacer que:
- reportes,
- widgets,
- detalle de cuenta,
- validaciones de consumo de saldo,

lean `CuentaCliente.saldoActual` como saldo oficial.

Si la UI quiere mostrar el efecto de pendientes:
- calcularlo aparte,
- no sobrescribir el saldo oficial.

## Fase 2 — Reimplementar el flujo de movimientos

Objetivo:
- toda operacion monetaria debe crear `MovimientoCuentaCliente`.

Casos minimos:
- venta al credito -> `CARGO`
- abono del cliente -> `ABONO`
- adelanto -> `SALDO_FAVOR`
- consumo de saldo -> `USO_SALDO`
- devolucion -> `DEVOLUCION`

Regla:
- si el movimiento nace offline, inicia en `PENDIENTE`.
- solo backend lo lleva a `CONFIRMADO` o `RECHAZADO`.

## Fase 3 — Reimplementar el flujo de cobros

Objetivo:
- todo dinero recibido del cliente debe pasar por `CobroCliente`.

Casos minimos:
- cobro aplicado a una deuda,
- cobro parcial,
- cobro que termina en saldo a favor.

Regla:
- `CobroCliente` representa la recepcion del dinero,
- `MovimientoCuentaCliente` representa el impacto contable de cuenta.

## Fase 4 — Reimplementar la sincronizacion

Objetivo:
- la app debe poder reintentar sin duplicar dinero.

Regla:
- todo `MovimientoCuentaCliente` y `CobroCliente` debe tener `idempotencyKey`.

El consumer debe asumir:
- puede haber varios intentos de envio,
- backend debe responder de forma idempotente,
- la app debe actualizar el estado local segun la respuesta oficial.

## 6. Flujo recomendado por tipo de operacion

### 6.1 Venta al credito

```txt
1. Se genera la venta.
2. Se crea MovimientoCuentaCliente tipo CARGO.
3. Si es offline, queda en PENDIENTE.
4. Backend confirma.
5. El saldo oficial aumenta.
```

### 6.2 Abono del cliente

```txt
1. Cajero registra dinero recibido.
2. Se crea CobroCliente.
3. Se crea MovimientoCuentaCliente tipo ABONO.
4. Ambos pueden iniciar en PENDIENTE.
5. Backend valida caja, turno, cliente e idempotencia.
6. Backend confirma o rechaza.
```

### 6.3 Adelanto o saldo a favor

```txt
1. Se recibe dinero.
2. Se crea CobroCliente.
3. La aplicacion del cobro va a SALDO_FAVOR.
4. Se crea MovimientoCuentaCliente tipo SALDO_FAVOR.
5. Solo cuando backend confirma, ese saldo cuenta como oficial.
```

### 6.4 Uso de saldo

```txt
1. La app revisa saldo confirmado disponible.
2. Se crea MovimientoCuentaCliente tipo USO_SALDO.
3. Si esta offline, queda pendiente.
4. Backend valida que el saldo confirmado sea suficiente.
5. Si aprueba, confirma.
6. Si no, rechaza.
```

## 7. Regla de estados

### 7.1 MovimientoCuentaCliente

Estados actuales:

```txt
PENDIENTE
CONFIRMADO
RECHAZADO
ANULADO
```

Interpretacion:
- `PENDIENTE`: existe localmente, aun no oficial.
- `CONFIRMADO`: impacta saldo real.
- `RECHAZADO`: no impacta saldo real.
- `ANULADO`: existio oficialmente y luego fue anulado.

### 7.2 CobroCliente

Estados actuales:

```txt
BORRADOR
PENDIENTE
CONFIRMADO
RECHAZADO
ANULADO
```

Interpretacion:
- `BORRADOR`: todavia no se consolida como operacion real.
- `PENDIENTE`: capturado offline, pendiente de backend.
- `CONFIRMADO`: aceptado oficialmente.
- `RECHAZADO`: backend no lo acepto.
- `ANULADO`: fue confirmado y luego se anulo.

## 8. Regla de saldo

El saldo oficial debe calcularse solo con movimientos confirmados.

```txt
confirmado = oficial
pendiente = proyectado
rechazado = ignorado
anulado = no vigente
```

Ejemplo:

```txt
Saldo confirmado: S/ 500
Abono pendiente: S/ 1000
Saldo mostrado como oficial: S/ 500
Saldo proyectado opcional en UI: S/ 1500
```

## 9. Regla de anulación

No borrar movimientos de dinero.

Siempre conservar:
- `reversaDeId`
- `anuladoPorId`
- `anuladoAt`
- `anulacionMotivo`

Objetivo:
- trazabilidad,
- auditoria,
- soporte,
- reconstruccion historica.

## 10. Regla de idempotencia

Toda operacion que pueda ser reenviada debe llevar `idempotencyKey`.

Objetivo:
- evitar duplicados por reconexion,
- evitar duplicados por timeout,
- evitar doble procesamiento.

Ejemplo conceptual:

```txt
misma operacion + mismo idempotencyKey = mismo resultado
```

## 11. Regla de backend como autoridad

Backend debe decidir:
- si el movimiento es valido,
- si el cobro es valido,
- si la caja/turno eran validos,
- si el usuario tenia permisos,
- si el cliente existe,
- si la operacion es duplicada,
- si debe confirmar o rechazar.

La app no debe asumir como oficial una operacion solo porque pudo guardarla offline.

## 12. Orden recomendado de trabajo

### Paso 1
- actualizar pantallas y casos de uso para leer `CuentaCliente` como saldo confirmado.

### Paso 2
- migrar generacion de movimientos a `MovimientoCuentaCliente` con estados nuevos.

### Paso 3
- migrar recepcion de dinero a `CobroCliente`.

### Paso 4
- introducir `idempotencyKey` en todos los comandos de envio.

### Paso 5
- reentrenar UI para mostrar:
  - confirmado,
  - pendiente,
  - rechazado,
  - anulado.

### Paso 6
- ajustar reportes para ignorar pendientes/rechazados en saldo oficial.

## 13. Lo que debe ofrecer el consumer

`yola-fresh-utils` ya te da los contratos.

El consumer debe implementar:
- casos de uso,
- validaciones de negocio,
- sincronizacion,
- manejo de cola,
- resolucion de conflictos,
- UI de estados,
- backend idempotente.

## 14. Que aporta `yola-fresh-utils` en esta reimplementacion

La libreria ya aporta:
- contratos consistentes para `CuentaCliente`,
- ledger de `MovimientoCuentaCliente`,
- modelo de recepcion con `CobroCliente`,
- captura POS con `Pago`,
- permisos RBAC relacionados a cuentas,
- tipos reutilizables para moneda, referencias y metodos de pago.

Esto permite que la reimplementacion:
- mantenga un lenguaje comun,
- evite inventar estructuras paralelas,
- tenga trazabilidad contractual consistente,
- deje la logica operativa en la app/backend sin deformar el dominio base.

## 15. Cierre

Si reimplementas siguiendo esta guia, la estructura final queda asi:

```txt
CuentaCliente = resumen del saldo confirmado
MovimientoCuentaCliente = ledger explicativo
CobroCliente = dinero recibido y distribuido
Pago = captura/conciliacion POS
Backend = autoridad final
```

Y la regla operativa siempre sera:

```txt
La app registra.
El backend valida.
El backend confirma.
El saldo oficial se actualiza.
```
