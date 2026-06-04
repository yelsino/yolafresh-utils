# Guía de consumo — Tarjetas Virtuales

## Propósito

Las **Tarjetas Virtuales** representan “tarjetas visuales” del negocio guardadas como **una imagen** (por ejemplo: QR de pago, QR de WiFi, datos bancarios, horarios, promociones, etc.).

La aplicación **no interpreta** el contenido de la imagen. Este recurso existe para:
- **Clasificar** la tarjeta por tipo (para agrupar/filtrar y dar contexto en UI).
- **Mostrar** la imagen como un recurso visual.
- **Administrar** publicación y orden sin borrar información (activar/inactivar, ordenar).

## Qué ofrece `yola-fresh-utils`

`yola-fresh-utils` provee contratos TypeScript para estandarizar este recurso entre consumers (apps, servicios, sincronización), sin imponer base de datos ni repositorios.

Incluye:
- `TarjetaVirtual`: contrato principal del documento.
- `TipoTarjetaVirtual`: enum de tipos permitidos para clasificación.
- `EstadoTarjetaVirtual`: estado permitido para publicación (`activo` | `inactivo`).

Fuente:
- [tarjetaVirtual.ts](file:///D:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/tarjetaVirtual.ts)

## Qué garantiza el contrato (para el consumer)

- **Identificación de documento**:
  - `_id`: string único (estilo CouchDB/PouchDB).
  - `type: "tarjeta_virtual"`: discriminador estable para el dominio.
- **Contenido de presentación**:
  - `nombre`: etiqueta visible.
  - `imagen`: URL/URI/path de imagen (la app solo renderiza, no interpreta).
- **Clasificación**:
  - `tipoTarjeta`: enum `TipoTarjetaVirtual` para categorizar.
- **Control operativo**:
  - `estado`: `activo` o `inactivo` para mostrar/ocultar.
  - `orden?`: número opcional para ordenar en listados.
- **Auditoría mínima**:
  - `createdAt`, `updatedAt`: timestamps en epoch (ms).

## Qué NO incluye (a propósito)

- No define estructura de base de datos, tablas, índices, migraciones ni repositorios.
- No define reglas de UI, permisos o validaciones de negocio específicas.
- No “entiende” el contenido de la imagen (QR, texto, etc.); eso es responsabilidad del consumer.

## Dónde se importa

Puedes consumir los contratos desde:
- Export de interfaces compartidas: `domain/shared/interfaces`

Archivos relevantes:
- Export: [shared/interfaces/index.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/index.ts)
- Contrato: [tarjetaVirtual.ts](file:///D:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/tarjetaVirtual.ts)

