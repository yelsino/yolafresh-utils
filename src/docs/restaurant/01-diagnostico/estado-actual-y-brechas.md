# Estado actual y brechas

## Diagnóstico ejecutivo

**Hecho:** la aplicación tiene una arquitectura por capas y un flujo offline real: persiste en SQLite, encola operaciones salientes, consume cambios de CouchDB y actualiza proyecciones locales.

**Hecho:** el producto actual cubre ampliamente retail: catálogo, presentaciones, precios, ventas, caja, pagos, crédito, pedidos de entrega, compras, almacenes, stock, kardex, personas, permisos, impresión y reportes.

**Hecho:** la pantalla de configuración ofrece `restaurante`, pero la selección permanece en estado local de la pantalla; no se observó persistencia ni activación de módulos por ese valor.

**Inferencia:** YolaFresh tiene una buena plataforma operativa, pero no un dominio gastronómico. Añadir campos a `Venta` o reutilizar el `Pedido` actual como comanda produciría contradicciones de estado, concurrencia y contabilidad.

## Arquitectura actual

### Fortalezas

- Capas `application`, `domain`, `infrastructure` y `presentation` reconocibles.
- Casos de uso y puertos reales en catálogo, inventario, compras, POS y cuentas de cliente.
- SQLite como fuente local para lectura reactiva.
- Procesamiento del feed de cambios hacia tablas locales.
- Cola offline persistente con coalescencia parcial, reintentos y backoff exponencial.
- Identificadores deterministas en varios movimientos, por ejemplo inventario de venta/anulación.
- Snapshots de venta para conservar contexto histórico.
- Proveedores de workflow e invalidación de proyecciones.

### Deuda relevante

- Presentación y stores todavía concentran orquestación de negocio.
- El store del carrito es un objeto de gran tamaño y múltiples responsabilidades.
- El mismo flujo crea venta, pedido, egreso y venta rápida.
- La persistencia de venta y sus efectos de inventario/caja/crédito no forman una única transacción local coordinada; se apoyan en idempotencia y compensación parcial.
- La política explícita de “local pendiente y última escritura” sólo se usa en algunos procesadores.
- La cola conserva reintentos, pero no expresa dependencias y políticas por agregado gastronómico.
- Hay manejo de `409` y upsert, pero no un modelo uniforme de detección, clasificación y resolución de conflictos de negocio.

## Semántica actual de `Pedido`

**Hecho:** el POS tiene modos `VENTA`, `PEDIDO`, `COTIZACION` y `COMPRA`.

**Hecho:** el `Pedido` actual exige cliente identificado, registra cantidades solicitadas/atendidas, prioridad, responsable, fechas y una entrega `RECOJO` o `DESPACHO`.

**Hecho:** sus estados comerciales se orientan a atención y conversión a venta; la entrega sigue un flujo logístico general.

**Hecho:** el resultado de persistir un pedido se adapta al tipo de venta para reutilizar el workflow del carrito.

**Conclusión:** es reutilizable para encargos, preventa y despacho, pero no debe renombrarse ni extenderse hasta convertirse en sesión de mesa, comanda de cocina y cuenta. Esos ciclos de vida son independientes.

## Brechas por capacidad

| Capacidad | Estado actual | Brecha gastronómica |
|---|---|---|
| Perfil de negocio | Selector visual | Persistencia, versión y capacidades activas |
| Espacio físico | Almacenes y cajas | Local, ambiente, zona, mesa, asiento, punto de recojo y estación |
| Atención | Carrito y pedido | Sesión de servicio abierta, comensales, mesero/equipo, transferencias |
| Orden | Ítems dentro de venta/pedido | Pedido gastronómico editable y rondas de envío |
| Preparación | Entrega a nivel pedido | Comanda y líneas por estación, hold/fire, tiempos, recall/refire |
| Cuenta | Venta y pagos | Cuenta abierta, precuenta, divisiones y asignaciones parciales |
| Catálogo | Producto/presentación/precio | Ítem de menú, disponibilidad, modificadores, combos y canal |
| Producción | Movimiento de producto vendido | Receta, insumos, rendimiento, preparación intermedia y merma |
| Impresión | Trabajo asociado a `venta_id` | Trabajo por comanda/estación, delta, cancelación y reimpresión |
| Pagos | Pago asociado opcionalmente a venta | Múltiples pagos y asignaciones sobre cuenta/divisiones |
| Personas | Clientes, personal, usuarios | Comensal anónimo, anfitrión, mesero, cocina, barra y repartidor |
| Reserva | No observada | Reserva, lista de espera, no-show y asignación de mesa |
| Concurrencia | Timestamps, revisión y reintentos | Precondiciones, eventos inmutables, ownership temporal y resolución visible |

## Riesgos si se extiende el modelo retail directamente

1. `Venta` quedaría abierta durante horas aunque hoy representa una transacción comercial casi cerrada.
2. Una edición concurrente del arreglo de ítems podría perder pedidos enviados a cocina.
3. Una cuenta dividida duplicaría o perdería importes si se almacena como copias de venta.
4. La cocina no podría distinguir “registrado”, “enviado”, “preparando”, “listo” y “servido” por línea.
5. El stock se descontaría por producto vendido aunque la operación requiera explosión de receta o producción previa.
6. Un cliente identificado seguiría siendo obligatorio en flujos donde basta una mesa, alias o número de orden.
7. Impresión y reimpresión no podrían garantizar que sólo se envía el delta correcto a cada estación.

## Oportunidades inmediatas

- Convertir el selector de negocio en un perfil versionado de capacidades.
- Reutilizar proyecciones SQLite y feed de cambios para planos, KDS y cuentas abiertas.
- Reutilizar caja, turno, pago e inventario mediante puertos de integración bien definidos.
- Mantener `Pedido` para encargo/recojo/despacho y crear conceptos gastronómicos explícitos.
- Extraer orquestación del store antes de añadir complejidad de mesas y cocina.

