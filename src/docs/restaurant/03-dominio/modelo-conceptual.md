# Modelo conceptual

## Nota de estado

Los nombres son candidatos para RFC. Este documento define responsabilidades y relaciones, no interfaces TypeScript ni tablas definitivas.

## Agregados principales

### PerfilNegocio

Raíz que protege:

- identificador de empresa/local aplicable;
- versión de configuración;
- perfil base: retail, gastronómico o híbrido;
- conjunto de capacidades habilitadas;
- parámetros compatibles entre sí.

Invariante: una capacidad dependiente no puede activarse sin sus prerrequisitos. Ejemplo: `DIVISION_CUENTA` requiere `CUENTA_ABIERTA`.

### Mesa

Raíz del recurso físico:

- local, ambiente y zona;
- código visible, capacidad y posición visual;
- activa/bloqueada/fuera de servicio;
- referencia opcional a sesión activa.

No contiene pedidos ni pagos. La ocupación se valida mediante versión/precondición.

### Reserva

Raíz temporal:

- franja, cantidad de personas, datos de contacto mínimos;
- preferencia o mesa asignada;
- canal, notas y depósito opcional;
- estado y motivo de cancelación/no-show.

Una reserva puede convertirse en sesión; no es la sesión.

### SesionServicio

Raíz de atención:

- canal y modalidad;
- ubicación opcional (mesa/barra/mostrador/zona de recojo);
- cantidad de comensales y asientos opcionales;
- responsable/equipo;
- referencias a pedidos y cuenta;
- timestamps de apertura, atención y cierre.

Protege que una sesión cerrada no reciba nuevos pedidos y que una transferencia no deje dos ubicaciones activas.

### PedidoGastronomico

Raíz de intención de consumo:

- sesión/canal;
- líneas solicitadas;
- rondas/cursos;
- autor y responsable;
- estado de edición/envío/cancelación;
- referencias a envíos de preparación.

La línea contiene snapshot de nombre, presentación, precio, impuestos, modificadores e instrucciones. No se recalcula retroactivamente al cambiar el menú.

### EnvioPreparacion

Raíz inmutable por envío:

- pedido y número de secuencia;
- líneas/deltas enviados;
- estación destino por línea;
- actor, dispositivo y momento;
- tipo: enviar, cancelar, corregir, refire;
- clave idempotente.

No debe sobrescribirse para “quitar” una línea ya vista en cocina. Una corrección genera otro envío compensatorio.

### TrabajoPreparacion

Raíz pequeña por estación o ticket, según prueba operativa:

- referencia a línea enviada;
- estación;
- cantidad;
- estado y tiempos;
- prioridad, curso y promesa;
- responsable opcional.

Decisión pendiente: granularidad por línea/unidad frente a ticket de estación. La proyección KDS puede agrupar independientemente.

### CuentaConsumo

Raíz monetaria abierta:

- sesión y moneda;
- cargos por líneas, descuentos, impuestos, servicio, propina y ajustes;
- asignaciones a divisiones;
- pagos aplicados;
- saldo, estado y versión;
- referencias a venta(s) resultante(s).

No almacena el dinero capturado como simple total. Cada pago y asignación conserva identidad e idempotencia.

### DivisionCuenta

Puede ser entidad interna de Cuenta si todas las operaciones se realizan bajo la misma versión, o agregado separado si el uso multidispositivo lo exige.

- criterio: por ítems, cantidades, asientos, partes iguales o monto;
- asignaciones exactas de cargo;
- subtotal, cargos distribuidos, pagos y saldo;
- estado pagable/cerrado.

No duplica una línea. Una cantidad fraccionable se representa mediante asignaciones cuya suma no excede la cantidad/cargo original.

### Receta

Raíz versionada:

- producto/presentación o preparación resultante;
- rendimiento y unidad;
- componentes, cantidades y merma esperada;
- vigencia, local y estado borrador/publicada/retirada;
- costo teórico calculable.

Una versión publicada no se modifica retroactivamente; se crea otra versión.

### RegistroProduccion

Raíz transaccional:

- receta y versión;
- cantidad planificada/obtenida;
- consumos reales, rendimiento y mermas;
- almacenes origen/destino;
- estado y responsable;
- movimientos de inventario derivados.

## Objetos de valor candidatos

- `Cantidad` con unidad compatible;
- `Dinero` y `Porcentaje`;
- `RangoHorario`;
- `CapacidadMesa`;
- `ClaveIdempotencia`;
- `VersionEsperada`;
- `SnapshotItemMenu`;
- `SeleccionModificador`;
- `DireccionEntregaSnapshot`;
- `MotivoOperacion`;
- `AsignacionCargo`;
- `TiempoPreparacion`.

## Modelo de menú

### ItemMenu

Referencia un producto/presentación vendible y define:

- canales/locales/horarios;
- categoría visual;
- disponibilidad y agotado temporal;
- estación/regla de ruteo;
- grupos de modificadores;
- receta o política de inventario;
- impuestos/precio aplicable por contexto.

### GrupoModificadores

- mínimo y máximo de selecciones;
- requerido/opcional;
- repetición permitida;
- orden y presentación;
- opciones y precios extra;
- reglas de incompatibilidad si fueran necesarias.

### Combo

Composición de grupos de elección. Una selección de combo conserva estructura padre-hijo para cocina, precio y costo; no se aplana en productos independientes sin rastreo.

## Modelo monetario

Orden recomendado de cálculo, sujeto a validación fiscal:

1. precio base y extras de línea;
2. descuentos de línea;
3. descuentos globales distribuidos de forma reproducible;
4. impuestos según reglas vigentes;
5. cargo de servicio;
6. propina voluntaria;
7. redondeo explícito;
8. pagos y cambio.

Toda distribución debe guardar la asignación resultante, no sólo la fórmula, para que una división posterior sea auditable.

## Identidad y anonimato

- La sesión puede no tener cliente registrado.
- Puede usar alias, número de orden o mesa como referencia operativa.
- Datos fiscales se solicitan al emitir el documento que los requiera.
- Delivery requiere un snapshot mínimo de destinatario/dirección, sin obligar a mezclarlo con la identidad maestra.
- Un comensal puede vincularse opcionalmente a una Persona/Cliente.

