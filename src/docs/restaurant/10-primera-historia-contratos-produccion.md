# Primera historia: contratos de producción para salón y cocina

## Decisión

La primera historia se construirá como un corte vertical **offline-first y
multidispositivo**. No se considera terminada si solo funciona en un equipo o
si sincroniza documentos completos con última escritura ganadora.

> Una empresa de restaurante o restobar configura uno o más salones, sus mesas
> y estaciones. Un mozo abre la atención de una mesa, registra platos y bebidas,
> envía cantidades a cocina o barra, el personal prepara y marca cada trabajo
> como listo, y el mozo lo entrega a la mesa correcta.

Este corte no intenta implementar todo el vector gastronómico. Sí fija una
base contractual que admite después cuentas divididas, reservas, recojo,
delivery, autoservicio, recetas, producción e integradores sin redefinir qué es
un producto, pedido o trabajo de cocina.

## Evidencia usada para definir el modelo

- Odoo modela restaurantes mediante pisos/salones, mesas, transferencia de
  órdenes, cocina/bar, preparación y división de cuentas. Esto respalda separar
  el recurso físico de la atención y de la preparación: [Restaurant features](https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/restaurant.html)
  y [Preparation display](https://www.odoo.com/documentation/saas-18.1/applications/sales/point_of_sale/preparation.html).
- Toast conserva ítems, modificadores, instrucciones, mesa, comensales y uno o
  varios checks dentro de la operación, y distingue estados de selección como
  `NEW`, `HOLD`, `SENT` y `READY`: [Orders API overview](https://doc.toasttab.com/doc/devguide/portalOrdersApiOverview.html),
  [modifiers and special instructions](https://doc.toasttab.com/doc/devguide/apiSpecifyingModifiersAndInstructions.html)
  y [Selection](https://doc.toasttab.com/openapi/orders/tag/Data-definitions/schema/Selection/).
- Oracle Simphony KDS enruta y agrupa preparación por estación y curso. Una
  comanda no es el mismo objeto que el pedido editable: [Dining courses](https://docs.oracle.com/en/industries/food-beverage/simphony/kdscu/c_kds_dining_courses.htm).
- CouchDB conserva ramas concurrentes y selecciona un ganador determinista; la
  revisión perdedora puede quedar oculta. Además, `_changes` entrega el estado
  más reciente del documento, no una bitácora completa. Por eso no es seguro
  resolver pedidos, comandas o pagos con PUT de JSON completo y LWW:
  [conflicts](https://docs.couchdb.org/en/stable/replication/conflicts.html) y
  [`_changes`](https://docs.couchdb.org/en/latest/api/database/changes.html).
- La idempotencia debe usar una clave estable y devolver el mismo resultado al
  reintentar, patrón documentado también por Stripe: [idempotent requests](https://docs.stripe.com/api/idempotent_requests).
- Para evitar reconstruir consumidores, los contratos publicados evolucionan
  de forma aditiva: no se renombra ni elimina un campo sin una nueva versión.
  Esta regla coincide con las [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md).

Como base de diseño se aplican agregados pequeños, invariantes y lenguaje
ubicuo de *Implementing Domain-Driven Design* de Vaughn Vernon
([Pearson](https://www.pearson.com/en-us/subject-catalog/p/Vernon-Implementing-Domain-Driven-Design/P200000009616/9780133039887))
y el tratamiento explícito de replicación, particionado y consistencia de
*Designing Data-Intensive Applications* de Martin Kleppmann
([sitio del autor](https://martin.kleppmann.com/2017/03/27/designing-data-intensive-applications.html)).

## Qué se reutiliza de Vector Retail

| Concepto existente | Decisión gastronómica |
|---|---|
| `ProductoBase` | Se reutiliza como identidad del producto. Un ceviche sigue siendo un producto. |
| `Presentacion` | Se reutiliza como unidad vendible: porción, vaso, botella, jarra, tamaño, etc. |
| `ProductoPrecio` | Sigue siendo la fuente de precio general. Una sustitución de carta es opcional y explícita. |
| `Categoria` | Se reutiliza para catálogo/navegación; no determina por sí sola la estación. |
| `ProductoRestaurante` | Es una extensión de la `Presentacion`: carta, disponibilidad, modificadores y ruteo. No duplica el producto. |
| `Venta` | Se crea al cerrar comercialmente. No representa la mesa abierta ni el trabajo de cocina. |
| `Pago`, caja y turno | Se reutilizan; `AsignacionPagoRestaurante` los vincula a la cuenta de consumo. |
| usuarios, roles y permisos | Se extienden con acciones de mozo, cocina, barra, caja y supervisor. |
| SQLite, outbox y feed | Se reutilizan como infraestructura, pero las operaciones críticas viajan como comandos semánticos. |

`PedidoRestaurante` no sustituye al carrito retail ni al `Pedido` de entrega.
Representa la intención de consumo editable de una `SesionServicioRestaurante`.
Sus `ItemPedidoRestaurante` referencian la misma `Presentacion` y guardan un
snapshot para que un cambio posterior de nombre, precio o modificadores no
reescriba el pedido histórico.

## Contratos y persistencia: no son sinónimos

Una interfaz TypeScript no exige una tabla. La primera historia tiene esta
granularidad de negocio:

| Categoría | Contratos | Persistencia esperada |
|---|---|---|
| Configuración | `LocalRestaurante`, `SalonRestaurante`, `ZonaServicioRestaurante`, `MesaRestaurante`, `EstacionPreparacionRestaurante` | Documentos configurables; `ZonaServicioRestaurante` es opcional. |
| Catálogo extendido | `ProductoRestaurante` | Un documento por presentación configurada para gastronomía. |
| Atención | `SesionServicioRestaurante` | Agregado independiente para que una mesa pueda transferirse sin mover el pedido. |
| Toma de pedido | `PedidoRestaurante` con `ItemPedidoRestaurante` anidados | Un agregado; los ítems no son una tabla obligatoria. |
| Envío a cocina/bar | `ComandaRestaurante` con `ItemComandaRestaurante` anidados | Hecho inmutable por ronda/delta; nunca se sobrescribe. |
| Ejecución KDS | `TareaPreparacionRestaurante` | Estado mutable por estación e ítem; se versiona independientemente. |
| Cobro futuro ya estabilizado | `CuentaConsumoRestaurante`, `AsignacionPagoRestaurante` | Separado del pedido y de la preparación para soportar división y pagos concurrentes. |
| Valores | dinero, snapshots, modificadores, auditoría, trazas, estados | Se anidan; no son tablas por definición. |

La base móvil puede seguir usando un almacén documental genérico en SQLite.
La decisión de normalizar determinadas proyecciones por rendimiento se toma en
el adaptador; no cambia estos contratos de dominio.

## Flujo obligatorio de la primera historia

1. Se configura `LocalRestaurante → SalonRestaurante → MesaRestaurante` y las
   estaciones de cocina, barra, postres, empaque o expedición.
2. La carta muestra `ProductoRestaurante`, resuelto sobre `Presentacion` y
   `ProductoBase`.
3. El mozo ejecuta `OPEN_SERVICE_SESSION`. En una mesa exige su versión vigente;
   no se permiten dos ocupaciones silenciosas.
4. Cada elección ejecuta `ADD_ORDER_LINE`. El pedido guarda producto,
   presentación, precio, impuesto, modificadores, instrucciones, asiento/curso
   opcionales y estaciones de destino.
5. `SEND_ORDER_ROUND` envía solo el incremento solicitado. Crea una
   `ComandaRestaurante` inmutable y una tarea por estación/ítem.
6. Cocina/bar ejecuta transiciones explícitas: iniciar, retener, marcar lista,
   cancelar o volver a preparar. Un cambio tardío genera compensación; no edita
   la comanda original.
7. El mozo marca la tarea entregada y la vista de salón identifica mesa, pedido,
   ronda e ítems pendientes/listos.

## Invariantes que el contrato debe proteger

1. Una `Presentacion` mantiene una sola identidad, sea vendida en retail,
   salón, recojo o delivery.
2. Una mesa no tiene más de una sesión activa confirmada.
3. Una línea no enviada puede editarse o retirarse; una cantidad ya enviada se
   corrige con una operación compensatoria.
4. `cantidadEnviada` nunca es negativa ni supera la cantidad pedida, salvo un
   flujo explícito de corrección/refire con auditoría.
5. Una `ComandaRestaurante` es inmutable y cada reintento conserva el mismo
   `operationId`.
6. Una tarea solo cambia mediante una transición válida y con
   `expectedVersion`.
7. `LISTA` significa lista en su estación; `ENTREGADA` significa entregada al
   destino de servicio. No son sinónimos.
8. El reloj del dispositivo ayuda a mostrar y auditar, pero no decide qué
   escritura gana.

## Protocolo multidispositivo obligatorio

Cada acción crítica persiste, dentro de una transacción local corta:

```text
cambio local del agregado + ComandoRestaurante en outbox
```

El comando contiene:

- `trace.operationId`: identidad e idempotencia global de la acción;
- `aggregateId`: sesión, pedido, tarea o cuenta afectada;
- `expectedVersion`: versión leída antes de modificar;
- `dependsOnOperationIds`: dependencias causales cuando existen;
- nombre semántico y payload mínimo, no una copia completa del documento.

El manejador local/remoto registra el `operationId` y responde mediante
`ResultadoComandoRestaurante`:

- `APLICADO`: mutó una vez y devolvió la nueva versión;
- `YA_APLICADO`: reintento seguro con el resultado previo;
- `CONFLICTO`: la intención se conserva y requiere rebase o decisión visible;
- `RECHAZADO`: viola una regla y no debe reintentarse ciegamente.

Un conflicto de versión al agregar una línea puede releerse y reaplicarse si el
pedido continúa abierto y el `lineId` no existe. Ocupar una mesa, cerrar una
cuenta, cancelar una preparación tardía o aplicar un pago requieren su política
específica. No existe una regla global de “gana el último”.

## Evolución sin reconstruir la aplicación

- `schemaVersion` describe la forma del documento; `version` describe la
  concurrencia del agregado; `_rev` solo pertenece a CouchDB.
- Los cambios compatibles agregan campos opcionales, comandos o tipos
  documentales. No cambian la semántica de campos ya publicados.
- Los snapshots históricos son inmutables. Un dato nuevo se agrega al snapshot
  de operaciones futuras, no se resuelve desde catálogo al leer el pasado.
- Los consumidores deben tener fallback ante valores de enum desconocidos. Un
  nuevo canal o estado visual no debe bloquear toda la sincronización.
- Los nombres ingleses de la vista previa 1.2.0 se conservan como aliases
  temporales; los nombres canónicos son simples y en español.
- Delivery, reservas, recetas, producción y fiscalización se integran mediante
  nuevos agregados y referencias (`entregaId`, `reservaId`, versión de receta),
  sin cargar sus ciclos de vida dentro de `PedidoRestaurante`.

## Puerta de salida de la primera historia

No se aprueba para producción hasta demostrar, de manera automatizada y con al
menos dos dispositivos:

1. dos mozos agregan líneas distintas al mismo pedido y ninguna se pierde;
2. dos dispositivos intentan abrir la misma mesa y el conflicto queda visible,
   sin descartar ninguna intención con consumo;
3. reenviar la misma operación no duplica línea, comanda ni tarea;
4. cocina marca lista offline, reconecta y el mozo ve el mismo estado;
5. una edición concurrente a una cantidad ya enviada se rechaza o compensa, no
   reescribe la comanda;
6. una transferencia de mesa es atómica respecto de origen y destino;
7. caída de la aplicación después del cambio local no pierde la outbox;
8. el flujo retail conserva sus contratos y pruebas actuales.

La existencia de pantallas, tablas SQLite y CRUD sincronizado no satisface esta
puerta por sí sola. El criterio es preservar las intenciones de negocio bajo
desconexión, concurrencia y reintentos.
