# Estrategia de pruebas

## Objetivo

Demostrar comportamiento de negocio, compatibilidad retail y resistencia offline. La cobertura de líneas no sustituye pruebas de invariantes, idempotencia y concurrencia.

## Pirámide

### 1. Dominio puro

Pruebas rápidas de:

- transiciones válidas e inválidas;
- mínimos/máximos de modificadores;
- asignaciones y sumas monetarias;
- cierre con saldo;
- versión de receta y rendimiento;
- permisos/políticas;
- reglas de compensación.

### 2. Casos de uso

Con repositorios y reloj dobles:

- comandos idempotentes;
- expected version;
- emisión de eventos/outbox;
- errores recuperables y definitivos;
- reanudación de workflow;
- autorización en capa de aplicación.

### 3. Repositorios y migraciones SQLite

- migración desde instalaciones retail reales/sintéticas;
- constraints, índices y transacciones;
- rollback ante error;
- idempotencia de migración;
- reconstrucción de proyecciones;
- `SQLITE_BUSY`/snapshot y reintento controlado;
- rendimiento con volumen de hora punta.

### 4. Sincronización CouchDB

Entorno con múltiples réplicas/dispositivos simulados:

- repetición, desorden, demora y pérdida temporal de conexión;
- `409` en documentos versionados;
- ramas conflictivas por replicación;
- ganador distinto del cambio de negocio correcto;
- checkpoints y reinicio del consumidor;
- `_changes` sin estados intermedios;
- resolución y limpieza de revisiones.

### 5. Integración de contextos

- cuenta saldada -> una Venta;
- pago efectivo -> un movimiento de caja;
- crédito -> un cargo de cuenta cliente;
- receta -> un movimiento de inventario;
- anulación/refire -> compensación/merma correcta;
- envío -> trabajo de impresión/KDS una sola vez.

### 6. UI y operación

- plano con estados y conflictos;
- toma rápida con modificadores;
- KDS táctil bajo carga;
- división y pagos mixtos;
- accesibilidad, tamaños táctiles y feedback offline;
- recuperación tras cierre forzado de la app.

## Matriz de escenarios críticos

| Escenario | Resultado esperado |
|---|---|
| Repetir abrir sesión | Misma sesión, no duplicado |
| Dos mesas/dispositivos reclaman un recurso | Conflicto visible, sin pérdida |
| Dos meseros agregan líneas distintas | Unión por IDs |
| Editar arreglo completo con versión vieja | Rechazo; no sobrescritura |
| Reintentar envío 20 veces | Una comanda lógica |
| Fallar impresora y reiniciar | Trabajo pendiente recuperado |
| Cocina listo vs cancelación simultánea | Ambos hechos + política tardía |
| Dos cajas cierran | Una Venta |
| Pago confirmado se repite | Una aplicación/movimiento |
| División concurrente | Versión vieja rechazada |
| Cambio de receta posterior | Histórico sin cambios |
| Reintento de consumo | Un movimiento inventario |
| Cambio remoto durante lectura SQLite | Snapshot coherente y refresco posterior |
| Feed omite estado intermedio | Eventos críticos mantienen historial |
| App muere entre workflow stages | Reanuda sin duplicar efectos |

## Pruebas basadas en propiedades

Aplicar especialmente a dinero y asignaciones:

- suma de divisiones + no asignado = total distribuible;
- ninguna asignación es negativa;
- aplicar y reversar restaura saldo salvo redondeo explícito;
- orden de reintentos no altera resultado idempotente;
- cantidad consumida escala con receta/rendimiento;
- merge de altas con IDs únicos es conmutativo;
- una transición terminal no acepta transición normal posterior.

## Pruebas de contratos públicos

Para cada subpath nuevo:

- exports explícitos;
- compilación ESM/CommonJS y tipos;
- enums/constantes con pruebas de integridad;
- serialización estable y versionada;
- consumidor mínimo de ejemplo;
- bloqueo de imports internos;
- semver y guía de migración.

## Regresión retail

Antes de cada fase:

- POS venta rápida/regular;
- pedido comercial y entrega;
- contado/crédito;
- caja y turno;
- anulación y reversas;
- inventario por presentación;
- compras y recepción;
- catálogo y precios;
- sincronización y bootstrap;
- empaquetado de `yola-fresh-utils`.

## Pruebas de rendimiento

Definir presupuestos antes del piloto para:

- apertura de plano con 100+ mesas;
- búsqueda/scroll de menú con miles de presentaciones;
- agregado y envío bajo 100+ cuentas abiertas;
- KDS con cientos de líneas activas;
- reconstrucción de proyección;
- flush de outbox grande;
- checkpoint WAL y crecimiento de archivo;
- arranque tras horas offline.

Medir percentiles, no sólo promedio, en hardware móvil objetivo.

## Inyección de fallos

- conectividad intermitente;
- respuesta lenta y `409`;
- disco lleno;
- `SQLITE_BUSY`;
- app terminada después de commit local y antes de flush;
- impresora desconectada o respuesta ambigua;
- reloj del dispositivo adelantado/atrasado;
- duplicación de notificación de pago;
- revisión conflictiva que “gana” incorrectamente.

## Datos y privacidad

- fixtures sin datos reales;
- logs inspeccionados para evitar credenciales, mensajes de pago y direcciones completas;
- pruebas de permisos por local/estación;
- pruebas de retención y anonimización de reservas/delivery;
- auditoría inmutable de acciones sensibles.

## Criterios de salida del piloto

- cero duplicados económicos u operativos sin resolver;
- todos los conflictos críticos son detectables;
- ningún comando pendiente se presenta como confirmado;
- workflows reanudables después de cierre forzado;
- rendimiento dentro de presupuesto en dispositivo objetivo;
- operadores completan flujos principales sin asistencia técnica;
- regresión retail y contratos compartidos en verde;
- runbook de conciliación y rollback validado.

