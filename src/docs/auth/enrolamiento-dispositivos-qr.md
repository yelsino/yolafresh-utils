# Enrolamiento seguro de dispositivos mediante QR

## Estado

Implementado en `yola-fresh-utils` desde `v1.1.0`.

## Objetivo

Este módulo es la fuente compartida del contrato v1 entre backend, consola administrativa y cliente instalable. No ejecuta llamadas HTTP, no persiste secretos y no implementa criptografía: publica tipos, vocabulario y helpers puros.

## Imports

```ts
import {
  DEVICE_ENROLLMENT_CONTRACT_VERSION,
  DEVICE_ENROLLMENT_PROOF_ALGORITHM,
  parseDeviceEnrollmentQrPayload,
  buildDeviceEnrollmentProofChallenge,
  type ClaimDeviceEnrollmentRequest,
  type DeviceEnrollmentStatusResponse,
  type CompleteDeviceEnrollmentRequest,
  type BackendScopedTenantConnection,
  type DirectCouchPaymentTenantConnection,
} from "yola-fresh-utils/auth";
```

## Payload QR

Formato canónico:

```text
https://enroll.yolafresh.com/device#v=1&i=<invitation-uuid>&t=<opaque-token>
```

Los datos sensibles están en el fragmento para evitar que lleguen al servidor de navegación como parte de la URL HTTP. El consumidor debe:

1. leer el QR como texto;
2. llamar a `parseDeviceEnrollmentQrPayload`;
3. rechazar origen, path, versión o UUID inválidos;
4. no registrar ni enviar a telemetría el payload, `invitationToken`, `pollToken` o `bootstrapExchangeToken`.

Puede autorizarse un origen distinto en desarrollo pasando una lista explícita como segundo argumento al parser.

## Flujo contractual

1. Un administrador crea la invitación y presenta `qrPayload`.
2. El dispositivo genera localmente una clave Ed25519 y reclama la invitación con su clave pública SPKI DER codificada en base64url.
3. El backend responde `AWAITING_APPROVAL` y entrega un `pollToken`.
4. El dispositivo consulta estado usando `Authorization: Bearer <pollToken>`.
5. Al aprobarse, recibe una única vez `bootstrapExchangeToken` y `proofChallenge`.
6. Firma los bytes UTF-8 del challenge con la clave privada local.
7. Completa el enrolamiento y persiste el binding y la conexión tenant.

Challenge v1 exacto:

```text
yf-device-enrollment-v1:<enrollmentId>:<deviceId>:<bootstrapExchangeToken>
```

`buildDeviceEnrollmentProofChallenge()` evita que los consumidores construyan variantes incompatibles.

## Conexión discriminada por tipo de dispositivo

`DeviceTenantConnection` es una unión discriminada por `syncMode`:

- `backend_scoped`: conserva `backendBaseUrl` y el token de bootstrap por dispositivo para POS, KIOSK, MOBILE y DESKTOP.
- `direct_couch`: entrega `couchBaseUrl`, `database`, `username` y `password` únicamente a un `PAYMENT_MONITOR` aprobado. La credencial debe ser individual, limitada a pagos y revocable.

El contrato no autoriza incluir credenciales CouchDB dentro del QR, variables públicas del cliente o el binario distribuido. El backend debe emitirlas después de verificar la prueba Ed25519. Para evitar lectura de otros documentos del tenant, la implementación debe conectar el monitor a una base dedicada de pagos o a una frontera equivalente que aplique mínimo privilegio.

El nombre `bootstrapExchangeToken` se mantiene por compatibilidad del protocolo v1. En un `PAYMENT_MONITOR` es solamente el token efímero de finalización; no implica descargar un snapshot/bootstrap ni abrir una sesión IAM.

## Estados

- `INVITED`: invitación creada, todavía no reclamada.
- `AWAITING_APPROVAL`: reclamada y pendiente del administrador.
- `APPROVED`: aprobada; puede completar el intercambio.
- `REJECTED`: rechazada.
- `COMPLETED`: binding instalado correctamente.
- `EXPIRED`: venció la ventana temporal.
- `REVOKED`: acceso del dispositivo revocado.

Los estados terminales para el flujo de alta son `REJECTED`, `COMPLETED`, `EXPIRED` y `REVOKED`.

## Persistencia segura

La clave privada Ed25519 nunca debe salir del almacén seguro del sistema operativo. `pollToken` y `bootstrapExchangeToken` son secretos efímeros; deben persistirse sólo si hace falta tolerar un reinicio y eliminarse al completar o terminar el flujo. `InstalledDeviceEnrollment` representa el dato durable posterior al alta. Si contiene una conexión `direct_couch`, todos sus campos deben cifrarse con el almacén seguro y su representación textual debe ocultar usuario y contraseña.

## Permisos

- `iam:dispositivo:ver`
- `iam:dispositivo:enrolar`
- `iam:dispositivo:aprobar`
- `iam:dispositivo:revocar`

`admin` los hereda mediante `*`; `soporte-tecnico` mediante `iam:dispositivo:*`.

## Compatibilidad

`DEVICE_ENROLLMENT_CONTRACT_VERSION` gobierna el protocolo y actualmente vale `1`. `AUTH_CATALOG_VERSION` cambia a `1.1.0` por la ampliación del catálogo. Un cambio incompatible en wire format requiere una nueva versión de protocolo; no debe reinterpretarse `v=1`.
