# Arquitectura modular offline

## Objetivo

Extender la arquitectura actual sin convertir el POS en un store monolítico ni hacer depender retail de gastronomía.

## Capas

### Dominio

- agregados, objetos de valor, políticas y eventos puros;
- sin SQLite, CouchDB, React Native, impresión o stores;
- contratos por contexto y subpath;
- invariantes expresadas mediante comportamiento, no setters públicos.

### Aplicación

- comandos y consultas por caso de uso;
- puertos de repositorio, reloj, identidad, autorización, outbox e impresión;
- orquestación entre un agregado y sus eventos;
- sagas/workflows explícitos para cierre, inventario y preparación;
- resultados tipados de conflicto, autorización y reintento.

### Infraestructura

- repositorios SQLite;
- documentos/serialización CouchDB;
- procesadores de cambios y proyecciones;
- bandeja de salida, idempotencia y reintentos;
- adaptadores a venta, caja, pago, inventario e impresión.

### Presentación

- plano, POS gastronómico, KDS, cuenta y reserva;
- stores pequeños de estado de vista;
- lectura de proyecciones locales;
- comandos a casos de uso;
- indicadores de pendiente/conflicto/error recuperable.

## Módulos propuestos

```text
restaurant/
  configuration/
  spaces/
  reservations/
  service/
  menu/
  preparation/
  billing/
  fulfillment/
  production/
  projections/
```

La estructura exacta se decide al implementar, pero los límites de ownership no deben colapsarse.

## CQRS ligero

Se recomienda separar:

- **escrituras:** comandos sobre agregados con versión e idempotencia;
- **lecturas:** proyecciones SQLite optimizadas para plano, KDS, cuentas, menú y tablero de delivery.

No se propone event sourcing total. Se usan eventos durables donde el historial intermedio es requisito de negocio y tablas de estado/proyecciones para lectura rápida.

## Proyecciones mínimas

| Proyección | Clave principal | Necesidad |
|---|---|---|
| Plano operativo | local/ambiente | estado de mesa, sesión, cuenta, alerta |
| Menú disponible | local/canal/hora | ítems, precios, agotados, modificadores |
| KDS por estación | estación | trabajos ordenados, tiempos, curso, prioridad |
| Expedición | sesión/orden | completitud entre estaciones |
| Cuenta abierta | cuenta | cargos, divisiones, pagos, saldo |
| Reservas/espera | local/fecha | franja, grupo, estado, asignación |
| Delivery | local/estado | aceptación, promesa, preparación, entrega |
| Producción/costo | local/receta | lote, rendimiento, consumo y merma |

Cada proyección debe poder reconstruirse desde fuentes durables o reconciliarse con ellas.

## Workflows críticos

### Enviar a preparación

Transacción local conceptual:

1. validar versión y líneas;
2. registrar `EnvioPreparacion`;
3. crear trabajos/proyección local;
4. registrar outbox;
5. confirmar;
6. imprimir/notificar asincrónicamente.

Una falla de impresora no revierte el envío aceptado; deja un trabajo de entrega de salida pendiente.

### Cerrar cuenta

1. comprobar saldo, permisos y versión;
2. congelar snapshot de cuenta;
3. reservar `closeCommandId` idempotente;
4. generar o solicitar Venta;
5. registrar vínculos y estado de workflow;
6. ejecutar efectos de caja/crédito/inventario de forma idempotente;
7. cerrar sesión y liberar mesa cuando la política esté satisfecha.

Si una etapa falla, el workflow queda reanudable y visible; no repite los efectos confirmados.

### Transferir mesa

1. leer versiones de mesa origen, destino y sesión;
2. validar destino disponible/capacidad/política;
3. ejecutar actualización local coordinada;
4. registrar evento y outbox;
5. ante conflicto remoto, bloquear nueva transferencia y presentar conciliación.

## Integración con contratos existentes

- Menú referencia Producto/Presentación/Precio.
- Cierre produce una Venta válida, no una variante incompleta.
- Cuenta usa Pago y Caja mediante adaptadores; asignación de pago pertenece a billing.
- Producción produce MovimientoInventario; Inventario no conoce sesiones/mesas.
- Personas/Auth provee identidad y permiso; Servicio no administra usuarios.
- `Pedido` vigente puede originar una sesión de recojo/delivery mediante traducción explícita, sin equivalencia uno-a-uno obligatoria.

## Deuda que debe resolverse antes de escalar

1. extraer orquestación gastronómica fuera del store del carrito;
2. unificar interfaz de outbox con estado observable;
3. normalizar idempotencia, versión y error de conflicto;
4. eliminar instrumentación temporal de diagnóstico en rutas de sincronización antes de producción;
5. definir ownership de snapshots y mappers;
6. asegurar que los workflows puedan reanudarse tras cierre de aplicación.

## Observabilidad local

Registrar sin datos sensibles:

- comando, agregado, versión esperada/actual;
- estado local: pendiente, enviado, confirmado, conflicto, rechazado;
- latencia por estación y proyección;
- reintentos y siguiente intento;
- trabajos de impresión pendientes/fallidos;
- workflow de cierre incompleto;
- cantidad de conflictos por tipo y resolución.

## Regla de dependencia

`presentation -> application -> domain`. Infraestructura implementa puertos de aplicación y depende de contratos de dominio. Ningún agregado importa stores, schemas Drizzle o documentos CouchDB.

