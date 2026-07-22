# Patrones profesionales y fuentes

## Síntesis comparativa

La documentación profesional revisada converge en una separación clara:

| Área | Patrón observado | Implicación para YolaFresh |
|---|---|---|
| Cuenta de comensal | Registro desde apertura hasta pago final | Crear `CuentaConsumo`, no mantener una `Venta` abierta |
| Mesas | Plano, capacidad, ocupación, reserva y traslado | Mesa es recurso; la sesión conserva la atención |
| Cocina | Ruteo por categoría/estación y estados por ítem | Comanda separada y proyección KDS |
| Modificadores | Hijos del ítem, grupos, mínimos/máximos, precio | Snapshot por línea y validación previa al envío |
| División | Mover o compartir ítems entre cuentas | Asignaciones explícitas, no duplicación de líneas |
| Propinas/servicio | Conceptos distintos y configurables | Componentes monetarios separados y auditables |
| Delivery | Canal con aceptación, rechazo y preparación | Estado de canal separado del estado de cocina |
| Merma | No es venta, sí afecta inventario | Movimiento de merma con motivo y autorización |
| Offline | Feed y replicación no eliminan conflictos | Política por comando/agregado y revisión visible |

## Hallazgos por fuente

### Oracle Simphony

**Hecho externo:** Oracle define el *guest check* como el registro de ítems, descuentos, cargos, anulaciones, devoluciones y pagos desde el primer pedido hasta el pago final. Esto respalda separar la cuenta abierta de la venta cerrada. Fuente: [Guest Checks](https://docs.oracle.com/en/industries/food-beverage/simphony/sipou/c_checks.htm).

**Hecho externo:** la división permite mover ítems a nuevas cuentas o compartirlos entre varias; cada nueva cuenta obtiene identidad propia. Fuente: [Split Check](https://docs.oracle.com/en/industries/food-beverage/simphony-essentials/simsl/t_check_func_split_check.htm).

**Hecho externo:** los modificadores/condimentos son hijos del ítem padre; pueden ser pagados, gratuitos, requeridos, opcionales, predeterminados y limitados por mínimos/máximos. Fuente: [Condiments](https://docs.oracle.com/en/industries/food-beverage/simphony/simcg/c_condiments.htm).

**Hecho externo:** Simphony distingue retener, enviar y reenviar ítems, incluso por asiento o curso. Fuente: [POS User Guide](https://docs.oracle.com/en/industries/food-beverage/simphony/19.5/sipou/F75912_06.pdf).

**Hecho externo:** una merma de ítem no registra venta, pero sí consume inventario y requiere razones/reportes. Fuente: [Menu Item Waste](https://docs.oracle.com/en/industries/food-beverage/simphony/simcg/c_menu_items_waste_checks.htm).

**Hecho externo:** cargos de servicio pueden reportarse como propina, cargo al servicio, ingreso del establecimiento o concepto no gravado como venta. Fuente: [Service Charges](https://docs.oracle.com/en/industries/food-beverage/simphony/19.7/simcg/c_service_charges.htm).

### Odoo POS

**Hecho externo:** el modo restaurante activa pisos, mesas, pedidos, comunicación con cocina/bar, precuenta, división y propinas. Fuente: [Funciones para restaurantes](https://www.odoo.com/documentation/18.0/es_419/applications/sales/point_of_sale/restaurant.html).

**Hecho externo:** el plano muestra disponibilidad, capacidad, ocupación, reservas y órdenes de cocina; el traslado lleva consigo los pedidos asociados. Fuente: [Floors and tables](https://www.odoo.com/documentation/17.0/applications/sales/point_of_sale/restaurant/floors_tables.html).

**Hecho externo:** la preparación se configura por pantalla, categorías y etapas; permite completar ítems individualmente y medir tiempo/alertas. Fuente: [Preparation display](https://www.odoo.com/documentation/18.0/applications/sales/point_of_sale/preparation.html).

**Hecho externo:** los combos reúnen grupos de elección y permiten precios extra por opción tanto en retail como en restaurante. Fuente: [Product combos](https://www.odoo.com/documentation/18.0/applications/sales/point_of_sale/combos.html).

**Hecho externo:** un pedido de delivery atraviesa colocado, aceptado y listo; al aceptar pasa a preparación y puede rechazarse con motivo. Fuente: [Online food delivery](https://www.odoo.com/documentation/18.0/applications/sales/point_of_sale/online_food_delivery.html).

**Hecho externo:** el autoservicio diferencia mesa y zona de recojo, y puede cobrar por orden o por comida según modalidad. Fuente: [Self-ordering](https://www.odoo.com/documentation/18.0/applications/sales/point_of_sale/self_order.html).

### CouchDB

**Hecho externo:** la replicación conserva revisiones concurrentes y escoge un ganador determinista para lectura; las revisiones perdedoras quedan ocultas hasta que la aplicación las resuelva. Fuente: [Replication and conflict model](https://docs.couchdb.org/en/stable/replication/conflicts.html).

**Hecho externo:** en una escritura sobre un nodo, una revisión obsoleta recibe `409`; la aplicación debe releer, reaplicar o pedir intervención. La sobrescritura ciega puede perder cambios. Misma fuente anterior.

**Hecho externo:** `_changes` garantiza el cambio más reciente por documento, no todos los estados intermedios. Por eso una comanda no puede usar un único documento mutable como bitácora completa. Fuente: [`_changes`](https://docs.couchdb.org/en/stable/api/database/changes.html).

**Hecho externo:** la replicación es direccional, usa checkpoints y se apoya en MVCC. Fuente: [Replication protocol](https://docs.couchdb.org/en/stable/replication/protocol.html).

### SQLite

**Hecho externo:** WAL permite lectores concurrentes con un escritor y ofrece aislamiento por snapshot; sigue existiendo un solo escritor simultáneo. Fuentes: [WAL](https://www.sqlite.org/wal.html) e [Isolation](https://www.sqlite.org/isolation.html).

**Hecho externo:** las operaciones SQL ocurren dentro de transacciones; `BEGIN IMMEDIATE` permite adquirir antes la intención de escritura y las transacciones anidadas requieren savepoints. Fuente: [Transactions](https://www.sqlite.org/lang_transaction.html).

## Recomendaciones derivadas

1. No almacenar todo el servicio de mesa en un documento mutable.
2. Tratar envíos, anulaciones, pagos y transferencias como comandos/eventos idempotentes.
3. Construir vistas de plano, KDS y cuentas desde proyecciones SQLite.
4. Separar estado comercial, preparación, pago y entrega.
5. Conservar snapshots de modificadores y receta aplicable para no reescribir el pasado.
6. Usar transacciones SQLite pequeñas por agregado y una bandeja de salida durable para propagación.

## Límites de la comparación

Las fuentes muestran patrones maduros, no requisitos automáticos. La primera versión de YolaFresh no necesita copiar toda la amplitud de Simphony u Odoo. El alcance mínimo se define en la [matriz de capacidades](../06-alcance/matriz-capacidades.md).

