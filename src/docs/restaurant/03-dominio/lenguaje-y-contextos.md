# Lenguaje ubicuo y mapa de contextos

## Principio de lenguaje

Los términos siguientes son canónicos para esta propuesta. Evitan usar una sola palabra —“pedido”— para representar atención, preparación, cuenta, venta y entrega.

## Glosario

| Término | Definición | No confundir con |
|---|---|---|
| Perfil de negocio | Configuración versionada que habilita capacidades | Texto visual del onboarding |
| Capacidad | Función independiente activable, por ejemplo mesas o KDS | Tipo rígido de empresa |
| Local operativo | Establecimiento donde ocurre la operación | Empresa legal |
| Ambiente | Agrupación física: primer piso, terraza, salón | Almacén |
| Zona de servicio | Subdivisión para asignar atención | Estación de preparación |
| Mesa | Recurso físico con capacidad y estado operativo | Cuenta o pedido |
| Asiento | Posición opcional de un comensal en una sesión | Persona registrada |
| Sesión de servicio | Ocupación/atención temporal en mesa, barra o mostrador | Turno de caja |
| Comensal | Participante de la sesión, identificado o anónimo | Cliente fiscal obligatorio |
| Pedido gastronómico | Intención de consumo editable dentro de una sesión/canal | `Pedido` comercial vigente |
| Línea de pedido | Ítem solicitado con cantidad, precio y modificadores congelados | Producto maestro mutable |
| Ronda | Agrupación temporal de líneas que se envían juntas | Curso gastronómico |
| Curso | Secuencia de servicio: entrada, fondo, postre | Estado de cocina |
| Comanda | Envío inmutable o versionado de líneas hacia preparación | Pedido completo o venta |
| Línea de preparación | Unidad rastreable por estación y estado | Línea monetaria de cuenta |
| Estación | Cocina caliente, fría, barra, empaque, etc. | Zona de mesas |
| Cuenta de consumo | Obligación monetaria abierta durante el servicio | Cuenta corriente del cliente |
| División de cuenta | Agrupación pagable de asignaciones de consumo | Copia de una venta |
| Precuenta | Representación informativa antes del cierre | Comprobante fiscal o pago |
| Venta cerrada | Resultado comercial confirmado generado desde una cuenta | Sesión abierta |
| Modificador | Elección o instrucción ligada a una línea | Presentación del producto |
| Receta | Versión de componentes y rendimientos de un ítem/preparación | Descripción libre |
| Preparación intermedia | Producción almacenable usada por otras recetas | Ítem vendido necesariamente |
| Merma | Consumo no vendido con motivo | Anulación comercial |
| Reserva | Compromiso futuro para una franja y tamaño de grupo | Ocupación efectiva |
| Lista de espera | Demanda presencial aún no asignada | Reserva confirmada |
| Canal | Origen del pedido: salón, barra, mostrador, recojo, delivery, autoservicio | Modalidad de entrega únicamente |

## Contextos delimitados

### 1. Configuración operativa

Responsable de perfil, capacidades, local, parámetros y activación gradual. Publica qué funciones están disponibles; no contiene reglas de venta o cocina.

### 2. Espacios y reservas

Responsable de ambientes, zonas, mesas, reservas y lista de espera. Una mesa no “contiene” pedidos: sólo puede estar asignada a una sesión activa.

### 3. Servicio y pedidos

Responsable de sesión, comensales, pedido gastronómico, líneas, rondas, responsables y transferencias. Es el núcleo de atención.

### 4. Menú

Responsable de disponibilidad comercial, modificadores, combos, horarios, canales y vínculo con producto/presentación/precio. Referencia catálogo; no lo sustituye.

### 5. Preparación

Responsable de estaciones, ruteo, comandas, líneas de preparación, hold/fire, tiempos, prioridad, cancelación y reenvío.

### 6. Cuenta y cierre

Responsable de cuenta abierta, cargos, descuentos, servicio, propina, divisiones, precuentas, pagos asignados y cierre hacia Venta.

### 7. Producción y costos

Responsable de recetas versionadas, insumos, rendimientos, preparaciones intermedias, producción, consumo teórico y merma. Integra con Inventario mediante movimientos.

### 8. Canales de cumplimiento

Responsable de recojo, delivery propio, asignación, dirección, promesa y estados de entrega. El estado de preparación sigue perteneciendo a Preparación.

### Contextos existentes integrados

- Ventas: recibe una transacción cerrada y su snapshot.
- Tesorería/caja: registra movimientos de dinero confirmados.
- Finanzas: crédito/cuenta corriente para cliente identificado.
- Inventario: aplica movimientos de stock y costos.
- Personas/Auth: identidad, roles y permisos.
- Compras: abastecimiento y recepción.

## Relaciones recomendadas

| Origen | Destino | Relación |
|---|---|---|
| Configuración | Todos | Publica capacidades y parámetros |
| Espacios | Servicio | Asigna/libera recurso por identificador |
| Menú | Servicio | Entrega una opción vendible y validaciones |
| Servicio | Preparación | Emite envíos de líneas |
| Servicio | Cuenta | Emite cargos y compensaciones |
| Preparación | Servicio | Informa avance/listo/servido |
| Cuenta | Ventas | Genera venta cerrada con snapshot |
| Cuenta | Caja/Pagos | Solicita y asigna pagos confirmados |
| Producción | Inventario | Solicita movimientos de consumo/producción/merma |
| Canales | Servicio | Crea/acepta pedido de canal |
| Canales | Preparación | Dispara preparación al aceptar |

## Reglas estratégicas

1. Referenciar otros agregados por ID; no anidar documentos completos que cambian independientemente.
2. Una transacción local modifica un agregado y registra sus eventos/outbox en la misma unidad cuando sea posible.
3. Efectos entre contextos son idempotentes y eventualmente consistentes.
4. Menú y receta conservan versiones; una línea guarda snapshot de lo vendido y producido.
5. No existe un “agregado Restaurante” total.
6. El perfil `RETAIL` no depende de ninguno de los nuevos contextos.

## Roles operativos iniciales

Los roles son composiciones de permisos, no condicionales codificados:

| Rol de referencia | Acciones típicas |
|---|---|
| Anfitrión | reservas, espera, asignación y liberación de mesa |
| Mesero | abrir sesión, tomar pedido, enviar, solicitar precuenta |
| Capitán/supervisor | transferir, fusionar, descuento, anulación autorizada |
| Cocina | aceptar/preparar/listo/rellamar según estación |
| Barra | equivalente a cocina para bebidas |
| Caja | cobrar, dividir/asignar pagos, cerrar cuenta |
| Repartidor | aceptar salida, en ruta, entregar/no entregar |
| Administrador | configuración, menú, recetas, estaciones y auditoría |

Una persona puede ejercer varios roles por local y turno. Las acciones sensibles deben registrar actor, dispositivo, motivo y autorización.

