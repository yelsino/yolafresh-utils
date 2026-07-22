# Épicas, historias y criterios de aceptación

## E1. Perfil y capacidades

### US-1.1 Seleccionar perfil persistente

Como administrador quiero seleccionar un perfil y revisar sus capacidades para configurar el negocio sin afectar funciones existentes.

Criterios:

- la selección sobrevive reinicio y operación offline;
- retail queda activo por defecto para instalaciones existentes;
- se registra versión, actor y dispositivo;
- una capacidad con dependencia inválida no se guarda;
- desactivar no elimina información histórica.

### US-1.2 Autorizar acciones gastronómicas

Como administrador quiero asignar permisos por rol/local para limitar anulaciones, descuentos, reaperturas y mermas.

Criterios:

- el caso de uso valida permiso aunque la UI oculte el botón;
- rechazo no modifica estado;
- acción sensible registra actor, motivo y autorizador.

## E2. Espacios y sesiones

### US-2.1 Abrir sesión en mesa

Como anfitrión quiero asignar una mesa disponible para iniciar la atención.

Criterios:

- requiere mesa activa y sin sesión vigente;
- crea sesión y asignación en una transacción local;
- funciona offline y muestra estado pendiente;
- un comando repetido devuelve la misma sesión;
- un conflicto de doble ocupación no elimina ninguna sesión.

### US-2.2 Transferir sesión

Como mesero quiero mover la atención a otra mesa conservando pedidos y cuenta.

Criterios:

- valida versión de sesión y mesas;
- libera origen y ocupa destino de forma coordinada;
- no cambia IDs de pedido/cuenta;
- conflicto muestra resolución, no aplica LWW.

## E3. Menú y pedido

### US-3.1 Agregar ítem con modificadores

Como mesero quiero registrar exactamente cómo desea el plato cada comensal.

Criterios:

- obliga mínimos y máximos de grupos requeridos;
- calcula extras sin alterar precio maestro;
- guarda snapshot de nombres/precios/instrucciones;
- dos altas offline con IDs distintos se conservan;
- ítem agotado no admite nueva línea.

### US-3.2 Enviar sólo cambios nuevos

Como mesero quiero enviar una nueva ronda sin reimprimir lo anterior.

Criterios:

- el envío contiene delta y secuencia;
- repetir `commandId` no duplica trabajos;
- una línea enviada no desaparece por edición;
- corrección genera envío compensatorio.

## E4. Preparación

### US-4.1 Recibir trabajo por estación

Como cocinero quiero ver sólo lo que prepara mi estación, ordenado por prioridad y espera.

Criterios:

- ruteo usa reglas versionadas y snapshot;
- KDS local funciona sin conexión externa;
- muestra mesa/orden, ítem, cantidad y modificadores;
- transición inválida se rechaza;
- reconexión no duplica trabajos.

### US-4.2 Marcar listo por ítem

Como cocinero quiero completar líneas individualmente para que expedición conozca el avance real.

Criterios:

- registra actor y timestamps;
- actualiza proyección local inmediatamente;
- evento repetido es idempotente;
- una cancelación concurrente se clasifica como tardía y no borra historial.

### US-4.3 Reimprimir o redirigir

Como supervisor quiero recuperar una comanda cuando una impresora falla.

Criterios:

- el trabajo original conserva intentos/error;
- redirección no crea otro pedido;
- reimpresión manual queda marcada y auditada;
- el fallo de impresión no revierte el pedido aceptado.

## E5. Cuenta y pago

### US-5.1 Emitir precuenta

Como mesero quiero entregar un resumen antes de cobrar.

Criterios:

- refleja cargos, descuentos, impuestos, servicio y saldo;
- no crea Venta ni movimiento de caja;
- queda vinculada a versión de cuenta;
- cambios posteriores invalidan/identifican la precuenta anterior.

### US-5.2 Dividir por ítems/cantidades

Como cajero quiero cobrar por separado sin duplicar consumo.

Criterios:

- cada cargo se asigna una sola vez salvo fracción explícita;
- suma de divisiones coincide con total distribuible;
- redondeo tiene regla determinista;
- operación concurrente con versión vieja se rechaza;
- cancelar división restaura asignaciones, no copia líneas.

### US-5.3 Aplicar pagos mixtos

Como cajero quiero combinar efectivo y otros medios.

Criterios:

- cada Pago tiene asignación e idempotencia;
- aplicado no supera monto utilizable/saldo según política;
- efectivo confirmado requiere turno activo cuando corresponda;
- repetir pago no genera segundo movimiento;
- reversa crea operación compensatoria.

### US-5.4 Cerrar cuenta una sola vez

Como cajero quiero convertir una cuenta saldada en venta.

Criterios:

- requiere saldo cero y versión vigente;
- un `closeCommandId` genera como máximo una Venta;
- snapshot reproduce totales y detalle gastronómico;
- workflow reanuda efectos pendientes sin repetir confirmados;
- sesión/mesa se cierran según política explícita.

## E6. Inventario y producción

### US-6.1 Publicar receta versionada

Como encargado quiero definir componentes y rendimiento para calcular consumo y costo.

Criterios:

- unidades son compatibles;
- rendimiento es positivo;
- publicada no se edita; nueva modificación crea versión;
- una línea histórica conserva versión usada.

### US-6.2 Registrar consumo teórico

Como administrador quiero descontar insumos una sola vez al punto definido.

Criterios:

- origen referencia venta/línea/receta;
- reintento usa ID determinista;
- producto de reventa sigue flujo existente;
- falta de stock respeta política configurada y genera alerta.

### US-6.3 Registrar merma

Como cocina quiero declarar desperdicio con motivo.

Criterios:

- no genera venta ni ingreso;
- sí genera movimiento de inventario;
- exige permiso/motivo según umbral;
- no modifica movimientos anteriores.

## E7. Reservas y delivery

### US-7.1 Convertir reserva en sesión

Criterios:

- conserva reserva y crea sesión distinta;
- asigna mesa disponible con precondición;
- no-show/cancelación conservan motivo;
- datos personales mínimos y protegidos.

### US-7.2 Aceptar pedido delivery

Criterios:

- identificador de canal evita duplicados;
- aceptar dispara preparación una vez;
- rechazo requiere motivo y no crea trabajos;
- cocina y entrega mantienen estados separados;
- dirección se congela como snapshot de la orden.

## E8. Offline, conflictos y auditoría

### US-8.1 Ver estado de sincronización

Criterios:

- muestra pendiente, reintentando, conflicto y rechazado;
- no presenta pendiente como confirmado;
- permite inspeccionar acción segura sin exponer payload sensible.

### US-8.2 Resolver conflicto operativo

Criterios:

- conserva todas las intenciones/revisiones relevantes;
- propone opciones válidas por tipo;
- resolución registra actor y motivo;
- reconstruye proyecciones;
- no usa sobrescritura ciega para pagos, comandas o movimientos.

## Definición de terminado por historia

- reglas de dominio y casos de error probados;
- persistencia local transaccional;
- idempotencia y concurrencia probadas;
- proyección reconstruible;
- operación offline y reconexión verificadas;
- permisos y auditoría cubiertos;
- contratos/documentación actualizados;
- regresión retail aprobada;
- métricas/logs operativos sin datos sensibles.

