# Plan — Custodia de Adelantos y Confirmación por Caja

## Resumen

El objetivo es determinar si `yolafresh-utils` está preparada para modelar correctamente la casuística de **adelantos registrados por un usuario distinto del cajero custodio**, donde la confirmación oficial del dinero solo ocurre cuando el cajero responsable de una caja con turno activo acepta la recepción.

La conclusión del análisis actual es:

- La librería **está parcialmente preparada**.
- `CobroCliente` ya contiene una base útil para recepción, entrega y recepción en caja.
- Sin embargo, **todavía no está completamente preparada** para expresar de forma explícita:
  - derivación operativa,
  - aceptación del custodio,
  - rechazo por cajero equivocado,
  - bloqueo por ausencia de turno válido,
  - y separación estricta entre “registro” y “recepción oficial en caja”.

Este plan propone ajustar los contratos de dominio y dejar reglas de uso claras para consumers de backend y frontend.

## Análisis del Estado Actual

### 1. Contratos ya disponibles

#### `CobroCliente`

Archivo: [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L323-L358)

Hoy ya soporta:

- `estado`
- `cajaId?`
- `turnoCajaId?`
- `movimientoCajaId?`
- `creadoPorId`
- `recibidoPorId?`
- `entregadoPorId?`
- `entregadoAt?`
- `recibidoEnCajaPorId?`
- `recibidoEnCajaAt?`
- `confirmadoPorId?`
- `confirmadoAt?`
- `anuladoPorId?`
- `anuladoAt?`
- `anulacionMotivo?`
- `rechazoMotivo?`

Esto demuestra que la librería ya reconoce parcialmente:

- recepción humana,
- entrega,
- aceptación en caja,
- confirmación,
- rechazo/anulación.

#### `TurnoCaja`

Archivo: [caja.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/caja.ts#L20-L53)

Hoy ya soporta:

- `cajaId`
- `usuarioId`
- `estado`
- `inicioAt`
- `finAt?`

Esto permite inferir quién es el custodio del turno activo.

#### `MovimientoCaja`

Archivo: [caja.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/caja.ts#L82-L109)

Hoy ya funciona como rastro oficial del impacto de dinero en caja.

#### `AuditLog`

Archivo: [ledger.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/ledger.ts#L93-L109)

Ya existe un contrato separado para auditoría detallada, por lo que no hace falta inflar todas las entidades con historial técnico completo.

### 2. Vacíos detectados

Aunque `CobroCliente` ya tiene varios campos útiles, faltan definiciones explícitas para estas casuísticas:

1. **Derivación formal**
   - No existe un campo inequívoco que exprese “este cobro fue derivado a una caja/turno custodio”.

2. **Aceptación operativa del custodio**
   - `recibidoEnCajaPorId` y `recibidoEnCajaAt` ayudan, pero no existe una semántica de estado claramente separada entre:
     - registrado,
     - derivado,
     - pendiente de aceptación,
     - aceptado,
     - confirmado.

3. **Bloqueo por turno no válido**
   - No hay un contrato que obligue a distinguir entre:
     - caja/turno válido,
     - caja equivocada,
     - usuario sin turno activo,
     - recepción fuera de horario o sin custodio.

4. **Rechazo con intención operativa**
   - `rechazoMotivo` existe, pero falta aclarar si el rechazo es:
     - del backend,
     - del cajero custodio,
     - de revisión operativa,
     - o de validación de negocio.

5. **Separación fuerte entre intención y recepción oficial**
   - Hoy todavía puede haber interpretaciones ambiguas por parte del consumer.

## Cambios Propuestos

### 1. Redefinir el ciclo de vida de `CobroCliente`

Archivo principal:

- [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)

#### Qué cambiar

Reemplazar el estado actual de `CobroCliente`:

```ts
export type CobroClienteEstado =
  | "BORRADOR"
  | "PENDIENTE"
  | "CONFIRMADO"
  | "RECHAZADO"
  | "ANULADO";
```

por un estado más preciso para custodia operativa, por ejemplo:

```ts
export type CobroClienteEstado =
  | "BORRADOR"
  | "DERIVADO"
  | "PENDIENTE_RECEPCION"
  | "RECIBIDO_EN_CAJA"
  | "CONFIRMADO"
  | "RECHAZADO"
  | "ANULADO";
```

#### Por qué

Porque `PENDIENTE` hoy es demasiado ambiguo y no permite saber si:

- el vendedor solo capturó la intención,
- ya hubo derivación,
- el dinero está esperando aceptación del cajero,
- o el cajero ya lo recibió pero aún falta confirmación final.

#### Cómo

- Actualizar `CobroClienteEstado`.
- Revisar todos los contratos que referencien ese estado.
- Ajustar documentación de consumo ya existente en `src/docs`.

### 2. Formalizar la derivación a caja/turno custodio

Archivo principal:

- [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)

#### Qué cambiar

Agregar campos explícitos en `CobroCliente` para modelar derivación:

```ts
derivadoACajaId?: string;
derivadoATurnoCajaId?: string;
derivadoACajeroId?: string;
derivadoPorId?: string;
derivadoAt?: Date;
```

#### Por qué

Hoy `cajaId` y `turnoCajaId` pueden interpretarse como caja “real” o caja “objetivo”.
Eso es riesgoso.

La librería debe poder distinguir:

- caja/turno objetivo de la derivación,
- caja/turno real donde finalmente quedó confirmado el dinero.

#### Cómo

- Reservar `cajaId` y `turnoCajaId` para la caja/turno **efectivamente responsables** una vez aceptada la recepción.
- Usar `derivadoACajaId` y `derivadoATurnoCajaId` para la intención operativa previa.

### 3. Diferenciar recepción física vs confirmación final

Archivo principal:

- [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)

#### Qué cambiar

Conservar y consolidar el significado de:

```ts
recibidoPorId?: string;
entregadoPorId?: string;
entregadoAt?: Date;
recibidoEnCajaPorId?: string;
recibidoEnCajaAt?: Date;
confirmadoPorId?: string;
confirmadoAt?: Date;
```

y documentar reglas claras:

- `recibidoPorId` = quién tomó dinero del cliente
- `entregadoPorId` = quién lo entregó al custodio
- `recibidoEnCajaPorId` = cajero custodio que lo aceptó físicamente
- `confirmadoPorId` = usuario que cerró formalmente el proceso

#### Por qué

Así la librería refleja la práctica ERP profesional:

- recibir dinero,
- custodiar dinero,
- aceptar dinero,
- confirmar dinero

no siempre son el mismo acto.

### 4. Separar rechazo operativo de anulación posterior

Archivo principal:

- [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)

#### Qué cambiar

Agregar campos opcionales para trazabilidad de rechazo operativo:

```ts
rechazadoPorId?: string;
rechazadoAt?: Date;
```

y dejar `rechazoMotivo` como motivo explícito del rechazo.

#### Por qué

Hoy `rechazoMotivo` existe, pero falta saber quién rechazó y cuándo.
Eso es importante para casos como:

- cajero equivocado,
- dinero no entregado,
- turno cerrado,
- inconsistencia detectada en recepción.

### 5. Restringir la creación de `MovimientoCaja` a recepción oficialmente aceptada

Archivos relacionados:

- [caja.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/caja.ts)
- [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)
- [pagos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pagos.ts)
- [ledger.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/ledger.ts)

#### Qué cambiar

No necesariamente requiere nuevo campo, pero sí documentación y contrato semántico:

```txt
Un CobroCliente derivado o pendiente de recepción NO debe implicar
la existencia automática de MovimientoCaja.
```

#### Por qué

Esto es la clave del problema descrito por el usuario:

- registrar intención no equivale a que caja recibió dinero.

#### Cómo

- Dejarlo expreso en guía de implementación.
- Alinear `movimientoCajaId` como referencia solo cuando ya hubo impacto oficial de caja.

### 6. Definir regla de compatibilidad con `TurnoCaja`

Archivo relacionado:

- [caja.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/caja.ts#L20-L53)

#### Qué cambiar

No hace falta modificar `TurnoCaja` por ahora, pero sí dejar una regla contractual:

```txt
Solo el usuario custodio del turno activo de la caja objetivo
puede aceptar y confirmar la recepción oficial del dinero.
```

#### Por qué

`TurnoCaja` ya tiene suficiente información para sostener esta regla desde consumers.

### 7. Reforzar documentación de auditoría separada

Archivos relacionados:

- [ledger.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/ledger.ts#L93-L109)
- [src/docs/auditoria-trazabilidad-reimplementacion.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/auditoria-trazabilidad-reimplementacion.md)

#### Qué cambiar

Actualizar documentación para dejar explícito:

- qué vive en `CobroCliente`,
- qué vive en `MovimientoCaja`,
- qué vive en `AuditLog`,
- y qué no debe duplicarse.

#### Por qué

La librería ya tiene piezas suficientes, pero hoy la interpretación todavía puede inducir a errores.

## Decisiones y Supuestos

### Decisiones tomadas

- El alcance será de **contratos + reglas**, no infraestructura.
- Se permiten **breaking changes** en la librería si son necesarios para expresar correctamente custodia y confirmación.
- `CobroCliente` será tratado como la entidad principal para esta casuística.
- `MovimientoCaja` seguirá siendo la fuente oficial del impacto monetario en caja.
- `AuditLog` seguirá siendo el contrato separado para auditoría detallada.

### Supuestos

- Los consumers backend/frontend son responsables de aplicar validaciones operativas concretas.
- `TurnoCaja.usuarioId` representa al custodio activo de la caja durante el turno.
- La librería no implementará base de datos ni repositorios, solo contratos y semántica de dominio.

## Pasos de Implementación

1. Ajustar `CobroClienteEstado` para expresar derivación, recepción y confirmación con mayor precisión.
2. Agregar campos explícitos de derivación en `CobroCliente`.
3. Agregar campos explícitos de rechazo operativo en `CobroCliente`.
4. Revisar si `cajaId` / `turnoCajaId` deben reinterpretarse como caja/turno confirmados y no solo objetivo de derivación.
5. Actualizar documentación de auditoría y reimplementación para backend/frontend.
6. Revisar exportaciones públicas para asegurar que los nuevos contratos sigan disponibles sin rutas rotas.
7. Validar que no existan otros contratos monetarios que dependan del estado viejo de `CobroCliente`.

## Verificación

La implementación debe validarse comprobando:

1. Que `CobroCliente` pueda expresar sin ambigüedad:
   - registro inicial,
   - derivación,
   - pendiente de recepción,
   - recepción en caja,
   - confirmación,
   - rechazo,
   - anulación.
2. Que `MovimientoCaja` siga representando exclusivamente el impacto oficial en caja.
3. Que `TurnoCaja` siga siendo suficiente para identificar custodio activo.
4. Que `AuditLog` siga siendo la capa separada para auditoría detallada.
5. Que la documentación explique claramente a backend y frontend cuándo crear o no crear `MovimientoCaja`.

## Respuesta Aterrizada a la Pregunta del Usuario

Hoy, `yolafresh-utils` **no está completamente preparada** para esta casuística si lo que se busca es un modelado ERP profesional sin ambigüedad.

Sí tiene base suficiente para evolucionar sin reescribir todo:

- `CobroCliente` ya tiene una estructura prometedora.
- `TurnoCaja` ya soporta custodia.
- `MovimientoCaja` ya representa caja oficial.
- `AuditLog` ya separa auditoría detallada.

Pero todavía hace falta reforzar formalmente:

- estados,
- derivación,
- aceptación del custodio,
- rechazo operativo,
- y semántica contractual.

La recomendación no es reescribir toda la librería, sino **endurecer `CobroCliente` y aclarar reglas de caja/custodia**.
