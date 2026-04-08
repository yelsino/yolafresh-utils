# Plan de Implementación — Subsistema de Notificaciones (ERP/SaaS)

Este documento describe un plan práctico para implementar el subsistema de notificaciones en proyectos consumidores de `yola-fresh-utils`, usando los contratos definidos en:
- [notificaciones.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/notificaciones.ts)

El objetivo es soportar el flujo: Evento → Regla/Plantilla → Destinatarios → Canal → Estado, con trazabilidad por usuario, reintentos, agrupación y preferencias.

## 1) Contratos y responsabilidades

### 1.1 Contratos principales
- `Notification`: entidad principal (mensaje ya renderizado para consumo en UI).
- `NotificationEvent`: evento del sistema (entrada del pipeline).
- `NotificationTemplate`: plantilla parametrizable (título/mensaje).
- `NotificationPreference`: preferencias por usuario/canal/tipo.
- `NotificationRecipient`: destinatario por usuario o rol + canal + tracking de lectura.
- `NotificationDelivery`: intento de envío por canal (logs y reintentos).
- `NotificationGroup`: agregación para evitar spam.

### 1.2 Responsabilidades por capa (en el proyecto consumidor)
- Productores de eventos: módulos de ventas, compras, caja, inventario, etc.
- Evaluación de reglas: módulo “rules” que decide si un evento produce notificación y a quién.
- Renderización: módulo “templates” que arma `title/message` desde `template + data`.
- Distribución: módulo “delivery” que crea `NotificationDelivery` y llama adaptadores (email/push/etc.).
- UI: lista, contador, detalle, leído/no leído, filtros por prioridad/estado.

## 2) Tipos y convención de IDs

### 2.1 Tipos (recomendación)
- `Notification.type`: string estable tipo `PAGO_RECIBIDO`, `STOCK_BAJO`, `CAJA_CERRADA`.
- `Notification.entityType/entityId`: deep link al recurso origen (venta/compra/etc.).
- `Notification.priority`: `LOW | NORMAL | HIGH | CRITICAL`.
- `Notification.status`: estado general del “objeto notificación”.

### 2.2 IDs
- IDs únicos por documento: `notif_*`, `nevt_*`, `nrcp_*`, `ndlv_*`, `ntpl_*`, `nprf_*`, `ngrp_*`.
- El ID debe ser determinístico solo si necesitas idempotencia; de lo contrario UUID/ULID.

## 3) Pipeline mínimo (MVP)

### 3.1 Paso 1 — Emitir eventos
Para cada módulo relevante, emitir `NotificationEvent` cuando ocurren estados importantes:
- `VENTA_CREADA`, `PAGO_RECIBIDO`, `PAGO_VENCIDO`
- `STOCK_BAJO`, `PRODUCTO_AGOTADO`
- `CAJA_ABIERTA`, `CAJA_CERRADA`, `CAJA_DESCUADRADA`
- `SINCRONIZACION_FALLIDA`, `IMPRESION_FALLIDA`

Regla: un evento debe incluir `type`, `entityType/entityId`, `payload` con datos mínimos (ids, montos, estados).

### 3.2 Paso 2 — Evaluar reglas → decidir notificaciones
Implementar un “rules engine” simple:
- Entrada: `NotificationEvent`
- Salida: 0..N “intenciones de notificación” con:
  - `notificationType`
  - `priority`
  - `destinatarios` (usuarios y/o roles)
  - `channels` sugeridos
  - `templateCode`
  - `data` para render

Reglas por defecto:
- `CRITICAL`: siempre `APP`, y opcional `PUSH` si existe.
- `HIGH`: `APP` + `EMAIL` para roles de supervisión si aplica.

### 3.3 Paso 3 — Renderizar `Notification` desde plantilla
- Resolver `NotificationTemplate` por `templateCode`.
- Reemplazar variables con `data`.
- Generar `Notification` con `title/message` ya renderizados.

### 3.4 Paso 4 — Calcular destinatarios
Soportar dos modos:
- Por usuario (`NotificationRecipient.userId`)
- Por rol (`NotificationRecipient.roleId`) y luego expandir a usuarios del rol (en runtime).

Aplicar preferencias:
- Si `NotificationPreference.enabled=false` para `type+channel`, no crear recipient en ese canal.
- Si está en quiet hours, crear recipient pero dejarlo `PENDING` para envío posterior.

### 3.5 Paso 5 — Entrega por canal
Por cada `NotificationRecipient` crear 0..N `NotificationDelivery`:
- Crear un delivery por canal
- Cambiar estado a `SENT/FAILED`
- Si falla: guardar `error` y programar reintento

MVP: implementar solo `APP` (in-app). Dejar `EMAIL/PUSH/WHATSAPP/SMS/WEBHOOK` como adaptadores enchufables.

### 3.6 Paso 6 — Lecturas en UI
El “read” es por destinatario:
- Marcar `NotificationRecipient.isRead=true` y `readAt`
- El estado global `Notification.status` puede quedar como `DELIVERED/READ` cuando todos los recipients leyeron (opcional).

## 4) Estados y transiciones (recomendación)

### 4.1 `Notification.status`
- `CREATED`: creada y persistida
- `QUEUED`: lista para entrega
- `SENT`: al menos un canal enviado
- `DELIVERED`: al menos un canal confirmado
- `READ`: lectura confirmada
- `FAILED`: fallas permanentes
- `EXPIRED`: vencida por `expiresAt`
- `CANCELLED`: cancelada por reglas/negocio

### 4.2 `NotificationRecipient.status`
- `PENDING`: aún no se entrega
- `DELIVERED`: entregada al usuario (APP: visible; email: aceptado por proveedor)
- `READ`: leída por ese usuario
- `FAILED`: falló entrega para ese usuario/canal
- `CANCELLED`: cancelada por regla

## 5) Agrupación (anti‑spam)

Implementar `NotificationGroup` para eventos repetitivos:
- Key sugerida: `type + entityType + entityId` o `type + tenantId + userId`
- Política:
  - Si existe grupo activo, incrementar `count` y actualizar `lastEventAt`
  - No crear 10 notificaciones para 10 eventos similares en ventana corta
- La UI puede mostrar: “10 ventas nuevas”.

## 6) Preferencias (control SaaS)

`NotificationPreference` por usuario:
- Toggle por `notificationType+channel`
- Quiet hours opcionales

Recomendación de defaults:
- `CRITICAL`: no deshabilitable (o solo deshabilitar canales secundarios)
- `NORMAL/LOW`: configurable por usuario

## 7) Plantillas y localización

`NotificationTemplate`:
- `code` estable (ej. `PAYMENT_RECEIVED`)
- `language` opcional
- `channels` sugeridos

Estrategia:
- Plantillas por idioma: `PAYMENT_RECEIVED_es`, `PAYMENT_RECEIVED_en`
- Si no hay idioma: fallback a `es`

## 8) Idempotencia y reintentos

### 8.1 Idempotencia
Si el consumer puede duplicar eventos:
- Deduplicar por `NotificationEvent.id` o por hash (`type+entityId+timestampBucket`)
- Si existe evento ya procesado: no volver a crear notificaciones

### 8.2 Reintentos
En `NotificationDelivery`:
- Reintento con backoff lineal o exponencial
- Límite: N intentos, luego `FAILED`
- Guardar `error` para soporte

## 9) Integración con módulos del ERP (lista base)

Eventos recomendados:
- Ventas: `VENTA_CREADA`, `VENTA_ANULADA`, `VENTA_CONFIRMADA`
- Caja: `TURNO_ABIERTO`, `CAJA_CERRADA`, `CAJA_DESCUADRADA`, `CAJA_NEGATIVA`
- Pagos: `PAGO_CAPTURADO`, `PAGO_CONFIRMADO`, `PAGO_RECHAZADO`, `PAGO_VENCIDO`
- Inventario: `STOCK_BAJO`, `PRODUCTO_AGOTADO`, `TRANSFERENCIA_COMPLETADA`
- Sync/infra: `SINCRONIZACION_FALLIDA`, `RESPALDO_FALLIDO`, `IMPRESION_FALLIDA`

## 10) Checklist de entrega (incremental)

### Fase 1 — MVP In‑App
- Emitir `NotificationEvent` en 5 eventos críticos
- Reglas mínimas (admins/supervisores)
- Crear `Notification` + `NotificationRecipient (APP)`
- UI: lista, contador, marcar leído

### Fase 2 — Preferencias + agrupación
- `NotificationPreference`
- `NotificationGroup`
- Quiet hours básico

### Fase 3 — Multicanal
- Adaptador EMAIL
- Adaptador PUSH
- `NotificationDelivery` con reintentos

### Fase 4 — Observabilidad
- Métricas: entregas, fallas, tiempos
- Auditoría: correlación con `NotificationEvent.id`

