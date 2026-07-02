# Extensión de contratos en consumers

> Documento histórico actualizado.
> La librería ya no publica helpers de transformación, mappers de persistencia ni tipos automáticos camel/snake.
> Este documento explica criterio de extensión, no una API vigente del paquete.

## Propósito

Explicar cómo un consumer puede extender contratos de `yolafresh-utils` sin contaminar el core compartido con detalles de SQLite, CouchDB, API o sincronización.

## Regla central

Los contratos canónicos deben permanecer en `yolafresh-utils`.

Las adaptaciones para persistencia o transporte deben vivir en la aplicación consumidora.

## Qué sí permite el enfoque actual

Un consumer puede:

- reutilizar contratos base del paquete;
- componer tipos locales para documentos SQLite, CouchDB o DTOs HTTP;
- agregar metadata operativa como `_id`, `_rev`, `syncStatus`, `version` o campos de partición;
- transformar nombres o formatos en sus propios bordes de infraestructura.

## Qué ya no ofrece la librería

La auditoría actual confirma que `yolafresh-utils` ya no publica:

- `ToSnakeCase`
- `ToCamelCase`
- `objectToSnakeCase`
- `objectToCamelCase`
- `arrayToSnakeCase`
- `arrayToCamelCase`
- `createTransformer`
- `NamingConverter`

Por lo tanto, cualquier conversión entre contratos de dominio y persistencia debe resolverse fuera del paquete.

## Patrón recomendado

### 1. Tomar contrato canónico

Ejemplo conceptual:

- `ProductoBase`
- `Presentacion`
- `Pedido`
- `CuentaCliente`
- `MovimientoCuentaCliente`

### 2. Crear tipo local de infraestructura

Ejemplo orientativo:

```ts
import type { CuentaCliente } from "yola-fresh-utils";

export interface CuentaClienteSQLite {
  doc_id: string;
  cuenta_id: string;
  cliente_id: string;
  estado: CuentaCliente["estado"];
  moneda?: CuentaCliente["moneda"];
  created_at: number;
  updated_at?: number;
  sync_status: "pending" | "synced" | "conflict";
}
```

### 3. Mapear en el borde

Responsabilidad del consumer:

- convertir nombres de campos;
- normalizar fechas;
- añadir `_id`, `_rev`, llaves locales o metadata de sincronización;
- mantener idempotencia y versionado.

## Reglas de diseño

- no agregar campos de SQLite o CouchDB al contrato canónico;
- no documentar adapters locales como si fueran parte del core;
- mantener una única fuente de verdad para el lenguaje de negocio;
- transformar solo en los bordes de entrada y salida;
- evitar duplicar contratos de dominio completos si basta extender o proyectar.

## Ejemplos de extensión válidos

- documento local con `syncStatus` e `idempotencyKey`;
- proyección de lectura con campos denormalizados para UI;
- documento CouchDB con `_id`, `_rev` y partición;
- DTO HTTP adaptado a convenciones del backend consumidor.

## Riesgos a evitar

- inventar un contrato nuevo cuando ya existe uno canónico en `shared/interfaces`;
- mezclar campos de negocio con metadata de persistencia en la misma fuente;
- introducir mappers dentro de `yolafresh-utils`;
- documentar contratos extendidos del consumer como si fueran oficiales del ecosistema.

## Pendiente de validación

- si conviene mantener una guía transversal adicional por tecnología fuera de este repositorio;
- qué convenciones mínimas de nombres deberían homologarse entre consumers del ecosistema.

## Referencias

- [README.md](./README.md)
- [core/README.md](./core/README.md)
- [core/contratos-compartidos.md](./core/contratos-compartidos.md)
