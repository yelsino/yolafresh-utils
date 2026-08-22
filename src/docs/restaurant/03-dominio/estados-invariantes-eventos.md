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
- pagar no cierra ni libera automáticamente: el operador debe confirmar el
  cierre cuando el servicio y la entrega hayan terminado;
- abandonar antes de la primera comanda exige cuenta en cero y ausencia de
  cantidades enviadas, cargos, pagos, venta, comandas y tareas; cancela el
  borrador, anula la cuenta y libera la mesa en una operación auditable;
- una sesión cerrada es inmutable salvo reapertura autorizada y auditada;
- transferir cambia la asignación de recurso, no la identidad de la sesión.

### PedidoRestaurante

`BORRADOR -> ABIERTO -> PARCIALMENTE_ENVIADO -> ENVIADO -> COMPLETADO`

Salidas: `CANCELADO`; las líneas enviadas se compensan, no desaparecen.

### TareaPreparacionRestaurante

`PENDIENTE -> EN_COLA -> EN_PREPARACION -> LISTA -> ENTREGADA`

Una estacion configurada como `COMANDA_FISICA` crea la tarea directamente en
`GESTION_EXTERNA`. Ese estado omite los cambios de preparacion de Cocina, pero
no significa `LISTA` ni `ENTREGADA`: declara que Yola Fresh no controla el
avance de esa preparacion. Salon conserva la confirmacion
`GESTION_EXTERNA -> ENTREGADA`, por lo que la mesa no se libera hasta registrar
que el plato llego al comensal. El modo queda copiado en la tarea cuando se
acepta la comanda, por lo que un cambio posterior de configuracion no altera el
historial.

Salidas controladas: `RETENIDA`, `CANCELADA`, `DESCARTADA`; transición especial `REFIRE` crea un nuevo intento relacionado.

Reglas:

- una estación sólo cambia trabajos que le pertenecen o para los que tiene permiso;
- `LISTA` registra tiempo y actor;
- cancelar después de iniciar exige motivo y puede generar merma;
- entregar no equivale a cobrar.

### CuentaConsumoRestaurante

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
- `SesionAbandonada`
- `MesaLiberadaSinConsumo`

### Pedido y preparación

- `ItemPedidoAgregado`
- `ModificadoresSeleccionados`
- `ComandaCreada`
- `TareaPreparacionIniciada`
- `TareaPreparacionLista`
- `TareaPreparacionEntregada`
- `LineaPreparacionCancelada`
- `TareaPreparacionReenviada`

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

Cada `ComandoRestaurante` durable incluye:

- `trace.operationId` global;
- `aggregateId`;
- `expectedVersion` obligatorio (`0` al crear);
- `actorId` y `deviceId`;
- `occurredAt`;
- payload específico;
- motivo/autorizador si corresponde.

Resultado repetido: devolver el efecto ya registrado. Resultado con versión vencida: no sobrescribir; clasificar conflicto y ofrecer recarga, reintento semántico o resolución autorizada.

Comandos de cierre de mesa:

- `CLOSE_CONSUMPTION_ACCOUNT`: cierre manual normal; vuelve a validar saldo,
  Venta, cobertura de cantidades enviadas y tareas terminales, y actualiza
  Cuenta, Pedido, Sesión y Mesa en una operación durable;
- `RELEASE_COMPLETED_TABLE`: reparación manual e idempotente cuando Cuenta,
  Pedido y Sesión ya están terminales pero la Mesa conserva por error el
  `sesionActivaId`; no permite omitir pago, preparación ni entrega.
