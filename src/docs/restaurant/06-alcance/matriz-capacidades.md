# Matriz de capacidades

## Leyenda

- **MVP:** necesario para operar un flujo básico profesional.
- **V1:** siguiente incremento recomendado.
- **V2:** ampliación posterior.
- **Fuera:** no se planifica en esta iniciativa.

## Configuración y operación

| Capacidad | MVP | V1 | V2 | Notas |
|---|:---:|:---:|:---:|---|
| Perfil/capacidades persistido | Sí |  |  | Mantiene retail por defecto |
| Local y ambientes | Sí |  |  | Configuración mínima |
| Zonas y mesas | Sí |  |  | Plano simple primero |
| Editor visual avanzado |  | Sí |  | Formas, unión y posicionamiento |
| Roles gastronómicos | Sí |  |  | Permisos por acción |
| Multi-local avanzado |  | Sí |  | Políticas y menú por local |

## Servicio

| Capacidad | MVP | V1 | V2 | Notas |
|---|:---:|:---:|:---:|---|
| Sesión de mesa | Sí |  |  | Apertura, transferencia, cierre |
| Barra/mostrador | Sí |  |  | Sin mesa |
| Comensales/asientos |  | Sí |  | Conteo en MVP, asiento opcional después |
| Mesero/equipo responsable | Sí |  |  | Reasignación auditada |
| Rondas | Sí |  |  | Deltas de envío |
| Cursos y hold/fire |  | Sí |  | Entrada/fondo/postre |
| Fusión de sesiones/cuentas |  | Sí |  | Reglas complejas |
| Autoservicio QR/kiosco |  |  | Sí | Requiere canal adicional |

## Menú y preparación

| Capacidad | MVP | V1 | V2 | Notas |
|---|:---:|:---:|:---:|---|
| Ítem de menú sobre catálogo | Sí |  |  | Producto/presentación existente |
| Modificadores requeridos/opcionales | Sí |  |  | Min/max y precio extra |
| Disponibilidad/agotado manual | Sí |  |  | Por local |
| Horarios/canales |  | Sí |  | Menú contextual |
| Combos |  | Sí |  | Grupos de elección |
| Estaciones y ruteo | Sí |  |  | Cocina/barra/empaque |
| Impresión de comandas | Sí |  |  | Delta e idempotencia |
| KDS |  | Sí |  | Puede pilotarse junto a impresión |
| Expedición multiestación |  | Sí |  | Vista coordinada |
| Tiempos predictivos |  |  | Sí | Analítica posterior |

## Cuenta y pagos

| Capacidad | MVP | V1 | V2 | Notas |
|---|:---:|:---:|:---:|---|
| Cuenta abierta y precuenta | Sí |  |  | Distinta de Venta |
| Pago único | Sí |  |  | Reutiliza pagos/caja |
| Pagos mixtos | Sí |  |  | Asignaciones explícitas |
| División por ítem/cantidad | Sí |  |  | Profesional mínimo |
| División por asiento/partes |  | Sí |  | Redondeos deterministas |
| Descuento de línea/global | Sí |  |  | Permisos/límites |
| Cargo de servicio | Sí |  |  | Configurable y separado |
| Propina | Sí |  |  | Durante pago inicialmente |
| Propina posterior |  |  | V2 | Depende de medio/normativa |
| Crédito cliente |  | Sí |  | Adaptar cuenta corriente existente |
| Reapertura de cuenta |  | Sí |  | Sólo supervisión |

## Inventario y costos

| Capacidad | MVP | V1 | V2 | Notas |
|---|:---:|:---:|:---:|---|
| Reventa por presentación | Sí |  |  | Ya soportada |
| Receta simple versionada | Sí |  |  | Consumo teórico al cierre |
| Merma con motivo | Sí |  |  | No es venta |
| Preparaciones intermedias |  | Sí |  | Producción por lote |
| Rendimiento real |  | Sí |  | Diferencia teórico/real |
| Lotes y caducidad avanzada |  |  | Sí | Según negocio |
| Ingeniería de menú |  |  | Sí | Margen/popularidad |

## Reservas y canales

| Capacidad | MVP | V1 | V2 | Notas |
|---|:---:|:---:|:---:|---|
| Recojo manual | Sí |  |  | Reutiliza/adapta Pedido |
| Delivery propio manual |  | Sí |  | Dirección, repartidor, estados |
| Integradores delivery |  |  | Sí | Fuera del núcleo inicial |
| Reservas básicas |  | Sí |  | Franja, grupo, contacto |
| Lista de espera |  | Sí |  | Conversión a sesión |
| Depósito/no-show |  |  | Sí | Requiere política monetaria |

## Offline y administración

| Capacidad | MVP | V1 | V2 | Notas |
|---|:---:|:---:|:---:|---|
| Escritura local durable | Sí |  |  | Todos los comandos MVP |
| Idempotencia y versión | Sí |  |  | Requisito de entrada |
| Estado de sync visible | Sí |  |  | Pendiente/conflicto/error |
| Resolución de conflictos críticos | Sí |  |  | Mesa, cierre, comanda |
| Auditoría de acciones sensibles | Sí |  |  | Actor/dispositivo/motivo |
| Reconciliación operativa |  | Sí |  | Panel de incidencias |
| Métricas avanzadas |  |  | Sí | SLA, forecast, productividad |

## Perfiles sugeridos

| Perfil | Capacidades iniciales |
|---|---|
| Retail | POS actual, catálogo, ventas, caja, inventario |
| Restaurante de mesa | mesas, sesiones, cuenta abierta, cocina, precuenta, división |
| Bar | barra/mesas, cuenta abierta, modificadores, estación barra, propina |
| Cafetería/QSR | mostrador, número de orden, prep, cobro antes/después |
| Dark kitchen | canales, aceptación, prep multiestación, expedición, sin mesas |
| Híbrido | retail + selección explícita de capacidades gastronómicas |

Los perfiles son presets editables; no deben convertirse en árboles de `if` permanentes.

