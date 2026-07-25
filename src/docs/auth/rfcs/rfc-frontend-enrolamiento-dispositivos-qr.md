# RFC-FE-YF-IAM-001: Enrolamiento seguro de dispositivos mediante QR

**Estado:** Propuesto  
**Objetivo:** implementación en frontend  
**Contrato compartido:** `yola-fresh-utils >= 1.1.0`  
**Protocolo:** `DEVICE_ENROLLMENT_CONTRACT_VERSION = 1`

## 1. Resumen

El frontend incorporará dos superficies:

- consola administrativa para crear, visualizar, aprobar, rechazar y revocar enrolamientos;
- cliente instalable para escanear el QR, demostrar posesión de una clave Ed25519 y guardar el binding del dispositivo.

El frontend no duplicará DTOs, estados, errores, permisos ni la construcción del challenge. Todo ello se importará desde `yola-fresh-utils/auth`.

## 2. Alcance

Incluye:

- lectura de QR y validación local;
- generación de clave Ed25519 por dispositivo;
- claim, polling y complete;
- aprobación/rechazo/revocación administrativa;
- recuperación segura ante reinicio;
- UX de expiración, rechazo y reintento;
- redacción de secretos en logs y telemetría.

No incluye:

- autenticación normal del usuario posterior al enrolamiento;
- sincronización de datos comerciales;
- implementación del backend IAM;
- exportación o respaldo de la clave privada.

## 3. Dependencia y contratos

Actualizar la dependencia:

```json
{
  "dependencies": {
    "yola-fresh-utils": "^1.1.0"
  }
}
```

Import oficial:

```ts
import {
  parseDeviceEnrollmentQrPayload,
  buildDeviceEnrollmentProofChallenge,
  type ClaimDeviceEnrollmentRequest,
  type ClaimDeviceEnrollmentResponse,
  type DeviceEnrollmentStatusResponse,
  type CompleteDeviceEnrollmentRequest,
  type CompleteDeviceEnrollmentResponse,
  type PendingDeviceEnrollment,
  type InstalledDeviceEnrollment,
} from "yola-fresh-utils/auth";
```

## 4. Arquitectura propuesta

Separar la implementación en:

- `DeviceEnrollmentApi`: adaptador HTTP sin estado.
- `DeviceKeyStore`: puerto al almacén seguro y operaciones Ed25519.
- `DeviceEnrollmentStore`: persistencia cifrada de proceso pendiente y binding instalado.
- `DeviceEnrollmentService`: orquestación y máquina de estados.
- vistas/componentes administrativos.
- wizard instalable de escaneo, espera y resultado.

Ningún componente visual debe acceder directamente al key store ni construir URLs/endpoints manualmente.

## 5. Flujo del cliente instalable

### 5.1 Identidad criptográfica

Al iniciar un alta sin binding:

1. obtener o crear un `deviceId` estable y no derivado de PII;
2. generar una clave Ed25519 no exportable;
3. exportar únicamente la clave pública como SPKI DER base64url;
4. conservar el identificador interno de la clave privada.

Si la plataforma no soporta Ed25519 en WebCrypto, usar el proveedor nativo aprobado para esa plataforma. No degradar a otro algoritmo.

### 5.2 Lectura y claim

Validar el texto del QR con `parseDeviceEnrollmentQrPayload()`. Ante éxito, enviar:

```http
POST /api/iam/device-enrollments/claim
Content-Type: application/json
```

El body usa `ClaimDeviceEnrollmentRequest`. Tras recibir `ClaimDeviceEnrollmentResponse`, persistir `PendingDeviceEnrollment` en almacenamiento seguro antes de mostrar la pantalla de espera.

### 5.3 Polling

Consultar:

```http
GET /api/iam/device-enrollments/{enrollmentId}/status
Authorization: Bearer <pollToken>
```

Política recomendada:

- intervalo inicial de 2 segundos;
- backoff hasta 10 segundos con jitter;
- respetar `Retry-After`;
- pausar en background y reanudar al volver a foreground;
- detener en estado terminal o al superar `expiresAt`;
- una sola operación de polling activa por `enrollmentId`.

### 5.4 Complete

Cuando el estado sea `APPROVED`:

1. comprobar que existen `bootstrapExchangeToken` y `proofChallenge`;
2. reconstruir el challenge con `buildDeviceEnrollmentProofChallenge()` y exigir igualdad exacta con el recibido;
3. firmar sus bytes UTF-8 con la clave privada Ed25519;
4. codificar la firma en base64url;
5. enviar `CompleteDeviceEnrollmentRequest`;
6. guardar `InstalledDeviceEnrollment` de forma atómica;
7. eliminar tokens y estado pendiente.

El complete debe tratarse como intercambio de un solo uso. No se reintentará ciegamente tras una respuesta ambigua: primero se consultará estado.

## 6. Consola administrativa

La ruta de administración debe exigir los permisos compartidos:

- listar/detallar: `iam:dispositivo:ver`;
- crear y mostrar QR: `iam:dispositivo:enrolar`;
- aprobar o rechazar: `iam:dispositivo:aprobar`;
- revocar: `iam:dispositivo:revocar`.

Acciones:

```http
POST /api/iam/device-enrollments
GET  /api/iam/device-enrollments
POST /api/iam/device-enrollments/{enrollmentId}/approve
POST /api/iam/device-enrollments/{enrollmentId}/reject
POST /api/iam/device-enrollments/{enrollmentId}/revoke
```

La vista debe mostrar nombre/tipo de dispositivo, estado, vencimiento, sucursales permitidas y timestamps. Nunca debe mostrar tokens.

Antes de aprobar, presentar confirmación con identidad del dispositivo y alcance de sucursales. Revocar requiere confirmación explícita y refresco de la lista.

## 7. Manejo de errores

Mapear `DeviceEnrollmentErrorCode` a mensajes localizados. Reglas mínimas:

- `invitation_expired`, `enrollment_expired`: terminar flujo y solicitar QR nuevo;
- `invitation_already_used`: no reintentar claim;
- `invalid_poll_token`, `invalid_bootstrap_exchange`: limpiar proceso pendiente;
- `enrollment_rate_limited`: respetar `retryAfterSeconds`/`Retry-After`;
- `invalid_device_proof`: bloquear complete y registrar sólo código y correlación;
- `device_already_bound`: consultar/restaurar el binding existente;
- errores de red: conservar estado pendiente y ofrecer reintento seguro.

Los mensajes al usuario no deben interpolar secretos ni el payload QR completo.

## 8. Seguridad

- Prohibido guardar la clave privada en localStorage, IndexedDB sin cifrado, Redux, Zustand o logs.
- Prohibido enviar tokens a analytics, crash reporting, breadcrumbs o URLs.
- Aplicar allowlist de origen al parser; los entornos no productivos pasan su origen de forma explícita.
- No renderizar el QR después de expirar o cancelar la invitación.
- Limpiar la cámara y streams al abandonar la pantalla.
- Usar comparación exacta del challenge antes de firmar.
- Proteger acciones administrativas además en backend; ocultar botones no constituye autorización.

## 9. UX y accesibilidad

Estados visibles: escaneando, validando, esperando aprobación, aprobado/finalizando, completado, rechazado, expirado y error recuperable. Proveer alternativa de ingreso/pegado del payload cuando la plataforma no tenga cámara, sin mostrar el token una vez validado.

La pantalla de espera debe explicar que puede cerrarse y reanudarse. Usar anuncios accesibles para cambios de estado, foco controlado en errores y contraste suficiente para el QR.

## 10. Pruebas de aceptación

- El parser rechaza HTTP, host/path distintos, versión desconocida, UUID inválido y token ausente.
- Un QR válido produce exactamente el request de claim tipado.
- Reiniciar la aplicación durante `AWAITING_APPROVAL` reanuda el polling.
- Aprobar produce una firma Ed25519 verificable sobre el challenge exacto.
- Complete persiste binding y elimina secretos efímeros de forma atómica.
- Rechazo, expiración y revocación detienen polling y muestran la acción siguiente.
- El backoff respeta `Retry-After` y no crea pollers duplicados.
- Logs, analytics y reportes de error no contienen tokens, claves ni QR completo.
- Los controles administrativos respetan los cuatro permisos IAM.
- Los tests de contrato usan fixtures reales del backend v1.

## 11. Estrategia de entrega

1. actualizar Utils y añadir adaptador HTTP tipado;
2. implementar key store y pruebas criptográficas por plataforma;
3. implementar máquina de estados y persistencia recuperable;
4. implementar wizard del dispositivo;
5. implementar consola administrativa;
6. ejecutar pruebas de contrato contra staging;
7. habilitar mediante feature flag y observar errores por código, sin secretos.

## 12. Criterio de terminado

La implementación se considera terminada cuando el flujo completo funciona en staging desde creación de invitación hasta binding instalado, los estados terminales están cubiertos, la clave privada permanece no exportable, no existen secretos en telemetría y frontend consume exclusivamente los contratos públicos de `yola-fresh-utils`.
