# Glosario Canónico

## Propósito

Este documento concentra terminología canónica mínima para leer `yolafresh-utils` sin mezclar conceptos de negocio distintos.

## Términos clave

### `Venta`

Hecho comercial confirmado que congela items, montos, procedencia y relación eventual con `Pedido`.

No representa:

- pago;
- movimiento de caja;
- movimiento de cuenta cliente;
- movimiento de inventario.

### `Pedido`

Reserva o intención comercial previa a la venta. Puede convertirse en `Venta`, pero no equivale a hecho comercial confirmado.

### `VentaSnapshot`

Representación histórica visible de una venta. Sirve para mostrar nombres, montos o contexto histórico sin contaminar contrato transaccional principal.

### `Pago`

Evidencia externa de pago capturada fuera del POS y validable por usuario humano.

No mueve dinero por sí mismo. Puede quedar sin venta asociada.

### `MovimientoCaja`

Impacto operativo del dinero en una caja y turno concretos.

Representa ingreso o egreso operativo, no contabilidad formal completa.

### `Ingreso`

Registro financiero de negocio dentro de `finanzas`. No equivale a `Pago`.

### `Egreso`

Salida financiera de negocio documentada en `finanzas`, con tipo de egreso, método de pago y trazabilidad operativa.

### `CuentaCliente`

Cuenta financiera del cliente para modelar saldo por cobrar o saldo a favor.

No reemplaza ledger contable formal.

### `MovimientoCuentaCliente`

Asiento financiero operativo sobre `CuentaCliente`. Puede representar venta, cobro, depósito, devolución, reversa o ajuste.

### `ImputacionCuentaCliente`

Relación de aplicación entre movimientos de cuenta cliente. Expresa consumo de saldo o cancelación de deuda. Estrategia observable actual: `FIFO`.

### `RecepcionCobroCliente`

Documento operativo de recepción de cobro del cliente. Registra método, custodio, caja, turno y estado del cobro recibido.

### `TransferenciaCustodiaCobro`

Documento de traspaso de custodia entre responsables de un cobro recibido.

### `Compra`

Hecho de compra confirmado a proveedor, con items, documento comercial, condición de pago y estado propio.

### `EventoCompra`

Contexto u operación de compra al que se vincula obligatoriamente una `Compra`.

### `MovimientoInventario`

Documento que altera stock por entrada, salida, ajuste o transferencia.

Solo `MovimientoInventario` modifica stock en modelo contractual vigente.

### `Almacen`

Ubicación operativa donde reside stock. Define, entre otras cosas, si permite negativos.

### `Entidad`

Actor real del sistema: `Cliente`, `Personal` o `Proveedor`.

### `IUsuario`

Cuenta digital con credenciales, roles, entidades asociadas y sesión opcional.

No reemplaza actor real del negocio.

### `Rol`

Conjunto de permisos que un usuario puede activar en sesión.

### `SesionContexto`

Contexto de sesión activa con `usuarioId`, `entidadActiva`, `rolesActivos` e información temporal.

### `Recurrencia`

Contrato que modela programación temporal de una acción. No ejecuta efectos por sí mismo.

### `RecurrenciaEntity`

Entidad rica que calcula y reprograma siguiente ejecución según regla temporal.

### `MovimientoFinanciero`

Contrato auxiliar histórico para integraciones, reportes o vistas consolidadas.

No es fuente canónica de auditoría.

### `AsientoContable`

Agregado contable balanceado con líneas de debe y haber. Solo puede confirmarse si cuadra y periodo fiscal está abierto.

## Regla de lectura

Cuando dos términos parezcan cercanos, usar este orden:

- primero identificar si concepto es comercial, operativo, financiero o contable;
- luego ubicar Domain propietario;
- por último revisar modelo vigente de ese Domain.

## Referencias

- [README.md](./README.md)
- [mapa-del-dominio.md](./mapa-del-dominio.md)
- [contratos-compartidos.md](./contratos-compartidos.md)
