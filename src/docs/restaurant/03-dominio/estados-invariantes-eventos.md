# Estados, invariantes y eventos

## Filosofía

Los estados de servicio, cocina, cuenta, pago y entrega evolucionan por separado. Un plato puede estar listo mientras la cuenta sigue abierta; un delivery puede estar en ruta después de cerrar la venta; una mesa no debe quedar ocupada porque falló una impresión.

## Máquinas de estado candidatas

### Sesión de servicio

`PLANIFICADA -> ABIERTA -> EN_ATENCION -> SOLICITA_CIERRE -> CERRADA`

Salidas alternativas: `CANCELADA`, `ABANDONADA`.

Reglas:

- sólo una sesión activa por mesa salvo capacidad compartida explícita;
- cerrar exige cuenta saldada o excepción autorizada;
- una sesión cerrada es inmutable salvo reapertura autorizada y auditada;
- transferir cambia la asignación de recurso, no la identidad de la sesión.

### Pedido gastronómico

`BORRADOR -> ABIERTO -> PARCIALMENTE_ENVIADO -> ENVIADO -> COMPLETADO`

Salidas: `CANCELADO`; las líneas enviadas se compensan, no desaparecen.

### Línea de preparación

`PENDIENTE -> EN_COLA -> EN_PREPARACION -> LISTA -> ENTREGADA`

Salidas controladas: `RETENIDA`, `CANCELADA`, `DESCARTADA`; transición especial `REFIRE` crea un nuevo intento relacionado.

Reglas:

- una estación sólo cambia trabajos que le pertenecen o para los que tiene permiso;
- `LISTA` registra tiempo y actor;
- cancelar después de iniciar exige motivo y puede generar merma;
- entregar no equivale a cobrar.

### Cuenta de consumo

`ABIERTA -> PARCIALMENTE_PAGADA -> SALDADA -> CERRADA`

Salidas: `ANULADA` sólo sin actividad económica irreversible; `EN_DISPUTA` opcional para excepciones.

Reglas:

- saldo = cargos confirmados - pagos aplicados - compensaciones;
- los pagos aplicados no exceden el importe confirmado salvo manejo explícito de cambio;
- cerrar crea salida comercial idempotente;
- una cuenta cerrada no acepta cargos; una reapertura genera auditoría y autorización.

### Reserva

`SOLICITADA -> CONFIRMADA -> PRESENTE -> SENTADA -> COMPLETADA`

Salidas: `CANCELADA`, `NO_SHOW`, `RECHAZADA`.

### Delivery

`RECIBIDO -> ACEPTADO -> EN_PREPARACION -> LISTO_RECOJO -> ASIGNADO -> EN_RUTA -> ENTREGADO`

Salidas: `RECHAZADO`, `CANCELADO`, `NO_ENTREGADO`.

El estado del canal no sustituye a los trabajos de preparación.

## Invariantes transversales

1. Una misma clave idempotente no produce dos efectos económicos u operativos.
2. Cada comando registra actor, dispositivo, tiempo local y, cuando exista, tiempo confirmado.
3. Las cantidades no pueden ser negativas; devoluciones y anulaciones son operaciones separadas.
4. La suma de asignaciones de un cargo no supera el cargo.
5. La suma aplicada de un pago no supera el monto utilizable.
6. Una línea enviada conserva snapshot; los cambios de catálogo sólo afectan líneas nuevas.
7. Una receta usada conserva versión y rendimiento aplicados.
8. Un movimiento confirmado de inventario no se edita; se compensa.
9. Una transferencia requiere versión esperada del origen y disponibilidad del destino.
10. Una autorización sensible no puede inferirse sólo por UI; el caso de uso valida permiso.

## Eventos de dominio candidatos

### Espacios y servicio

- `SesionServicioAbierta`
- `MesaAsignadaASesion`
- `SesionTransferida`
- `ComensalAgregado`
- `SesionCierreSolicitado`
- `SesionCerrada`

### Pedido y preparación

- `LineaPedidoAgregada`
- `ModificadoresSeleccionados`
- `EnvioPreparacionCreado`
- `TrabajoPreparacionIniciado`
- `TrabajoPreparacionListo`
- `TrabajoPreparacionEntregado`
- `LineaPreparacionCancelada`
- `TrabajoPreparacionReenviado`

### Cuenta y cobro

- `CargoCuentaRegistrado`
- `DescuentoAplicado`
- `CuentaDividida`
- `PrecuentaEmitida`
- `PagoAplicadoACuenta`
- `PropinaRegistrada`
- `CuentaSaldada`
- `VentaGeneradaDesdeCuenta`

### Producción

- `RecetaPublicada`
- `ProduccionIniciada`
- `ProduccionCompletada`
- `MermaRegistrada`
- `ConsumoTeoricoCalculado`

## Eventos frente a documentos mutables

Se recomiendan eventos inmutables para operaciones que no deben perder estados intermedios:

- envío/cancelación/refire de comandas;
- aplicación/reversa de pagos;
- transferencias y fusiones;
- movimientos de inventario y merma;
- autorizaciones y reaperturas.

Se admiten documentos mutables con versión para:

- nombre/posición de mesa;
- preferencias de vista;
- configuración de estación;
- borradores aún no enviados;
- disponibilidad manual actual, acompañada de auditoría cuando impacte ventas.

## Comandos idempotentes mínimos

Cada comando durable incluye:

- `commandId` global;
- `aggregateId`;
- `expectedVersion` cuando protege concurrencia;
- `actorId` y `deviceId`;
- `occurredAt`;
- payload específico;
- motivo/autorizador si corresponde.

Resultado repetido: devolver el efecto ya registrado. Resultado con versión vencida: no sobrescribir; clasificar conflicto y ofrecer recarga, reintento semántico o resolución autorizada.

