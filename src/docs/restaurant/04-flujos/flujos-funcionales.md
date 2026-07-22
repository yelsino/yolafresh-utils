# Flujos funcionales

## 1. Configuración inicial y capacidades

### Flujo

1. El administrador selecciona perfil `RETAIL`, `GASTRONOMICO` o `HIBRIDO`.
2. La aplicación propone capacidades por defecto, pero permite ajustar módulos compatibles.
3. Se valida la configuración y se persiste una versión.
4. La navegación y los casos de uso consultan capacidades, no el texto del tipo de negocio.
5. Se configura local, ambientes, mesas, estaciones, cajas, almacenes y permisos.

### Criterios

- cambiar de perfil no elimina datos;
- desactivar una capacidad con operación activa queda bloqueado o programado;
- retail continúa funcionando con el conjunto actual;
- la configuración está disponible offline después de materializarse.

## 2. Salón: llegada, mesa y sesión

1. Anfitrión consulta plano y espera.
2. Selecciona una mesa disponible o combina recursos si la política lo permite.
3. Abre una sesión con cantidad de comensales y responsable.
4. Mesero toma pedidos por ronda/asiento opcional.
5. Puede transferir la sesión a otra mesa con precondición de versión.
6. Al final, la mesa se libera sólo cuando la sesión se cierra o una excepción autorizada lo decide.

Casos alternos:

- cliente sin mesa: barra o mostrador;
- mesa compartida: sesiones separadas si se habilita;
- unión de mesas: agrupación temporal de recursos, no nueva mesa maestra;
- cambio de mesero: reasignación auditada, no transferencia de datos.

## 3. Toma de pedido y modificadores

1. Se consulta proyección local del menú por local, canal y horario.
2. Al elegir un ítem, se solicitan grupos requeridos hasta cumplir mínimos/máximos.
3. La línea captura precio, impuesto, modificadores, instrucciones, asiento y curso.
4. El pedido permanece editable hasta enviar.
5. Al enviar se crea un delta inmutable; nuevas líneas forman otra ronda.

Reglas:

- un ítem incompleto no puede enviarse;
- agotado manual impide nuevas líneas, pero no borra líneas aceptadas;
- instrucciones libres están separadas de modificadores para auditoría/costo;
- cambiar una línea enviada requiere anulación/corrección con motivo.

## 4. Cocina, barra y empaque

1. El envío se enruta por reglas versionadas a una o más estaciones.
2. Cada estación recibe sólo sus trabajos, con mesa/orden, prioridad, tiempo, curso y modificadores.
3. El operador inicia, marca listo o reporta incidencia por línea.
4. La proyección de expedición reúne el estado de todas las estaciones.
5. Se marca entregado al comensal o listo para recojo/delivery.

Casos alternos:

- `hold`: línea registrada pero no liberada a producción;
- `fire`: liberación manual/temporal por curso;
- `refire`: nuevo trabajo relacionado, con motivo;
- cancelación tardía: notifica estación y evalúa merma;
- impresora caída: trabajo permanece pendiente y puede redirigirse sin duplicarlo.

## 5. Precuenta, división y pago

1. La cuenta recibe cargos cuando las líneas alcanzan el punto configurado —aceptadas o enviadas—, decisión pendiente.
2. Se solicita precuenta, que no cierra ni fiscaliza.
3. Si se divide, se crean asignaciones por ítem/cantidad/asiento/parte/monto.
4. Se capturan uno o más pagos y se aplican a divisiones o saldo general.
5. Servicio y propina se calculan/registran como conceptos separados.
6. Al saldar, se genera Venta y snapshot de forma idempotente.
7. Los efectos de caja, crédito e inventario siguen sus casos de uso existentes/adaptados.

Casos alternos:

- pago parcial y continuación del servicio, si política lo permite;
- métodos mixtos;
- propina en efectivo o electrónica;
- cliente identificado sólo al requerir crédito o comprobante nominativo;
- reversa de pago con autorización;
- cuenta cerrada que debe reabrirse: operación excepcional y auditada.

## 6. Mostrador y comida rápida

1. Se crea sesión rápida sin mesa.
2. Se identifica por número/alias.
3. Puede cobrarse antes o después de preparar, según configuración.
4. Al aceptar, pasa a estaciones.
5. Pantalla de estado muestra en preparación/listo.
6. Se entrega y cierra.

La sesión rápida no obliga a usar plano de mesas, pero reutiliza pedido, preparación y cuenta.

## 7. Recojo y delivery

1. El pedido entra por canal manual o integrado.
2. Se valida disponibilidad y promesa.
3. Operador acepta o rechaza con motivo.
4. Sólo al aceptar se compromete la preparación según política.
5. Se prepara y pasa a `LISTO_RECOJO`.
6. En delivery propio se asigna repartidor, sale, entrega o reporta fallo.
7. Estados del canal y cocina se proyectan juntos, pero no se fusionan.

Datos mínimos:

- canal e identificador externo idempotente;
- destinatario/dirección snapshot;
- ventana prometida;
- estado de aceptación;
- pago esperado/confirmado;
- historial de entrega.

## 8. Reservas y lista de espera

1. Se registra solicitud con hora, personas y contacto.
2. Se confirma con mesa sugerida o capacidad sin mesa fija.
3. En llegada se marca presente y se asigna recurso disponible.
4. Se abre sesión y la reserva queda sentada.
5. Cancelación/no-show conserva motivo e historial.

Offline: un dispositivo puede registrar una reserva local, pero una asignación simultánea conflictiva debe quedar pendiente de conciliación; no se gana sólo por timestamp.

## 9. Recetas, producción e inventario

### Venta directa por receta

1. La línea cerrada referencia receta publicada y versión.
2. Se calcula consumo teórico según cantidad y rendimiento.
3. Se emite movimiento idempotente de consumo por insumo.
4. Diferencias se registran como merma/ajuste separado.

### Preparación intermedia

1. Se inicia lote de producción.
2. Se consumen componentes desde almacén origen.
3. Se registra cantidad obtenida y merma.
4. Se ingresa preparación al almacén destino con costo resultante.
5. Recetas finales consumen esa preparación.

### Producto de reventa

Bebidas empacadas u otros productos pueden seguir descontándose por presentación vendida, sin receta.

## 10. Cierre operativo

- caja concilia pagos capturados con movimientos;
- supervisor revisa cuentas abiertas, anulaciones, descuentos, refires y mermas;
- producción compara consumo teórico y real;
- reservas consolidan no-shows;
- trabajos offline pendientes permanecen visibles y no se interpretan como éxito confirmado.

## Matriz de actores

| Flujo | Responsable primario | Autorizaciones típicas |
|---|---|---|
| Abrir/transferir sesión | anfitrión/mesero | transferir ocupada, fusionar |
| Enviar/corregir pedido | mesero | anular tras iniciar preparación |
| Preparar/refire | cocina/barra | descarte/merma |
| Descuento/servicio | caja/supervisor | límites por porcentaje/monto |
| Cobrar/reversar | caja | reversa, reapertura |
| Receta/producción | encargado | publicar receta, ajustar rendimiento |
| Reserva/no-show | anfitrión | depósito y devolución |

