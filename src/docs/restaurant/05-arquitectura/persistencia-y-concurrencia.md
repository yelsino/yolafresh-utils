# Persistencia SQLite/CouchDB y concurrencia

## Principios

1. SQLite es la fuente operativa inmediata del dispositivo.
2. CouchDB transporta y conserva documentos sincronizables, pero su ganador de revisión no equivale a verdad de negocio.
3. Toda escritura de usuario se confirma localmente o falla de forma explícita.
4. La salida durable se registra junto con el cambio local.
5. Los comandos repetidos son idempotentes.
6. Las proyecciones toleran repetición, desorden y reconstrucción.

## Clasificación de persistencia

### Estado versionado mutable

Adecuado para:

- mesa y configuración física;
- sesión en su estado actual;
- borrador de pedido;
- cuenta abierta con control de versión;
- receta en borrador;
- disponibilidad manual.

Requiere `version`, `updatedAt`, `updatedBy`, `deviceId` y política de conflicto.

### Hechos inmutables

Adecuado para:

- envíos y cancelaciones de preparación;
- transiciones de cocina relevantes;
- aplicaciones/reversas de pago;
- movimientos de inventario/producción/merma;
- transferencias;
- autorizaciones;
- cierre y reapertura.

Requiere ID global, clave idempotente, agregado, secuencia/versión causal y timestamp.

### Proyecciones reconstruibles

- plano;
- KDS;
- expedición;
- resumen de cuenta;
- reservas del día;
- panel delivery;
- costo teórico.

No deben ser la única copia de un hecho económico.

## Forma documental recomendada

Evitar un documento gigante `restaurant:{sesion}` con mesa, líneas, cocina, pagos y entrega. El conflicto en cualquier subárea ocultaría cambios no relacionados y aumentaría contención.

Particionar conceptualmente por agregado y evento:

```text
restaurant_profile:{scopeId}
restaurant_table:{tableId}
restaurant_session:{sessionId}
restaurant_order:{orderId}
restaurant_prep_dispatch:{dispatchId}
restaurant_prep_event:{eventId}
restaurant_account:{accountId}
restaurant_payment_allocation:{allocationId}
restaurant_reservation:{reservationId}
restaurant_recipe:{recipeId}:{version}
restaurant_production:{productionId}
```

Los prefijos y tipos son ilustrativos; se aprueban en RFC y registro de tipos.

## Transacciones SQLite

### Deben ser atómicas localmente

- cambio del agregado + evento/outbox correspondiente;
- creación de envío + trabajos de preparación locales;
- aplicación de asignación + actualización del saldo proyectado;
- movimiento de inventario + actualización de stock/kardex según mecanismo actual;
- adquisición/liberación de mesa dentro del mismo almacén local de datos.

### Deben ser pequeñas

SQLite serializa escrituras. No se incluyen llamadas de red, impresión o cálculos largos dentro de la transacción. WAL mejora concurrencia de lectura/escritura, pero no crea múltiples escritores simultáneos.

## Outbox gastronómico

Cada entrada necesita:

- `operationId`/`commandId`;
- tipo y agregado;
- payload canónico/versionado;
- dependencias opcionales;
- estado e intentos;
- siguiente intento;
- error clasificable;
- timestamps;
- hash o clave de deduplicación cuando aplique.

Estados sugeridos: `PENDING`, `IN_FLIGHT`, `ACKNOWLEDGED`, `RETRY`, `CONFLICT`, `REJECTED`.

La cola actual reintenta indefinidamente con backoff y coalesce de updates; para gastronomía debe conservar orden causal por agregado y no fusionar eventos inmutables.

## Matriz de conflictos

| Operación | Política | Nunca hacer |
|---|---|---|
| Renombrar/mover mesa | LWW condicionado o merge de campos | Sobrescribir sesión activa |
| Ocupar mesa | Compare-and-set con versión | Elegir por reloj |
| Agregar línea no enviada | Comando idempotente; merge por ID de línea | Reemplazar arreglo completo |
| Enviar comanda | Evento append-only | Coalesce con envío previo |
| Marcar línea lista | Transición válida + versión | Retroceder por timestamp |
| Cancelar/refire | Evento compensatorio y permiso | Borrar trabajo original |
| Dividir cuenta | Versión esperada + asignaciones | Copiar totales |
| Aplicar pago | Evento idempotente | LWW del monto pagado |
| Transferir mesa | Precondiciones origen/destino | Doble ocupación silenciosa |
| Disponibilidad | Merge por local/ítem; conflicto visible si simultáneo | Reabrir agotado sin auditoría |
| Receta publicada | Inmutable por versión | Editar versión usada |
| Merma/inventario | Movimiento compensatorio | Editar saldo final directamente |

## Relojes y orden

`updatedAt` ayuda a presentación y diagnóstico, pero no prueba causalidad entre dispositivos. Para operaciones críticas usar:

- versión monotónica por agregado;
- identificador único de comando;
- secuencia de envío por pedido/estación;
- precondición `expectedVersion`;
- relación `causationId`/`correlationId` en workflows;
- timestamp como dato auxiliar, no árbitro único.

## Escenarios offline

### Dos meseros agregan líneas

Cada línea tiene ID propio y se agrega mediante comando; al sincronizar se conserva la unión si no viola estado de la sesión. Si uno cerró la sesión antes, el comando tardío queda rechazado/pendiente de supervisor, no se inserta silenciosamente.

### Dos dispositivos ocupan la misma mesa

Ambos pueden aceptar localmente si están totalmente desconectados. Al detectar conflicto, el sistema conserva ambas intenciones, bloquea operaciones que agraven el conflicto y solicita reasignación. Nunca descarta una sesión con pedidos.

### Cocina marca listo y mesero cancela

Los dos hechos se conservan. La política determina resultado operativo (`CANCELADA_TARDIA`, posible merma), con alerta y motivo; no gana el último timestamp.

### Dos cajas intentan cerrar la misma cuenta

El `closeCommandId` y la versión impiden dos Ventas. La segunda caja obtiene resultado ya procesado o conflicto, nunca crea otra salida económica.

### Impresión repetida

Un trabajo tiene ID estable por envío/destino/versión. Reintentar no crea nueva comanda; una reimpresión manual se registra como acción distinta y marcada.

## Detección y resolución

El consumidor de cambios debe solicitar información de conflictos para tipos críticos o ejecutar auditorías periódicas. Si se detectan hojas concurrentes:

1. obtener todas las revisiones relevantes;
2. clasificar por tipo de agregado;
3. aplicar merge automático sólo si la operación es segura;
4. crear revisión resuelta y eliminar ramas perdedoras;
5. registrar resolución y actor;
6. reconstruir proyecciones afectadas.

## Retención y compactación

No depender del cuerpo de revisiones antiguas para auditoría: CouchDB puede compactarlas. Los hechos que deben conservarse se almacenan como documentos/eventos propios y los snapshots de cierre se guardan explícitamente.

## Seguridad y datos sensibles

- no incluir secretos ni credenciales en documentos sincronizados;
- minimizar datos personales en reservas y delivery;
- separar permisos de lectura y acción por local/estación;
- logs locales no deben guardar mensajes de pago completos o direcciones innecesarias;
- definir retención/borrado de datos personales sin borrar hechos económicos requeridos.

