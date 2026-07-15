# Plan: Refactor de `Pedido` a Domain propio comercial + logístico

## Summary

Objetivo: sacar `Pedido` de `ventas` como contrato mínimo viejo y convertirlo en un Domain propio con dos contratos explícitos:

- `Pedido`: reserva comercial;
- `PedidoEntrega`: atención/preparación/despacho/entrega logística.

Además, crear documentación canónica en `src/docs/pedido`, actualizar ownership y exports públicos del paquete, y respaldar `VENCIDO` con campo temporal explícito.

Dirección confirmada con usuario:

- alcance: comercial + logística;
- mantener `VENCIDO`;
- crear `src/docs/pedido`;
- mover código a nuevo domain `pedido`;
- usar contrato logístico separado `PedidoEntrega`.

## Current State Analysis

### Código actual observado

- `Pedido` todavía vive en `src/domain/ventas/contracts/pedido.contract.ts`.
- `Pedido` actual solo expone:
  - `id`
  - `type`
  - `estado`
  - `clienteId`
  - `creadoPorId`
  - `items`
  - `subtotal`
  - `total`
  - `createdAt`
  - `updatedAt`
- `PedidoItem` actual solo expone:
  - `id`
  - `presentacionId`
  - `cantidadSolicitada`
  - `cantidadAtendida`
  - `precioUnitario`
- `PedidoState` actual vive en `src/domain/shared/kernel/enums.ts` con:
  - `ABIERTO`
  - `PARCIALMENTE_ATENDIDO`
  - `CONVERTIDO`
  - `CANCELADO`
  - `VENCIDO`

### Huecos detectados

- `Pedido` está modelado como shape liviano, no como Domain visible propio.
- `VENCIDO` existe en enum, pero hoy no tiene un campo temporal en el contrato que lo sustente.
- No existe contrato separado para estados logísticos como preparación, recojo, despacho, ruta o entrega.
- La documentación vigente trata `Pedido` dentro de `ventas`, no como Domain propio.
- El paquete no tiene subpaths públicos `./pedido` ni `./pedido/contracts`.

### Estructura pública observada

- Root index actual: `src/index.ts` exporta `ventas/contracts`, `compras/contracts`, `inventario/contracts`, `tesoreria/contracts`, `finanzas/contracts`, `auth`, `personas/contracts`, `contabilidad/contracts`.
- `src/index.ts` se genera mediante `scripts/generate-exports.ts`; no conviene editarlo manualmente.
- Los subpaths públicos se generan con `scripts/generate-public-subpath-stubs.cjs`.
- `package.json` no publica hoy `./pedido` ni `./pedido/contracts`.

### Documentación actual observada

- No existe `src/docs/pedido`.
- `Pedido` aparece hoy en:
  - `src/docs/ventas/README.md`
  - `src/docs/ventas/modelo-vigente.md`
  - `src/docs/ventas/relaciones-interdominio.md`
  - `src/docs/ventas/guia-de-consumo.md`
  - `src/docs/core/glosario.md`
  - `src/docs/core/contratos-compartidos.md`
  - `src/docs/core/mapa-del-dominio.md`
  - `src/docs/README.md`

## Assumptions & Decisions

### Decisiones cerradas

- `Pedido` deja de pertenecer contractualmente a `ventas` y pasa a `pedido`.
- `PedidoEntrega` se crea como contrato separado; no se meterá logística dentro de `PedidoState`.
- Se mantiene `VENCIDO`, pero ahora respaldado por `fechaVencimiento`.
- Se hace corte fuerte:
  - se elimina `Pedido` de `ventas/contracts`;
  - no se deja bridge de compatibilidad en `ventas/contracts`.
- Se preserva consumo desde root package exportando `pedido/contracts` en `src/index.ts`.
- Se agregan subpaths públicos nuevos:
  - `yola-fresh-utils/pedido`
  - `yola-fresh-utils/pedido/contracts`

### Decisiones de modelado

#### `PedidoState`

El enum final debe quedar así:

- `ABIERTO`
- `PARCIALMENTE_ATENDIDO`
- `ATENDIDO`
- `CONVERTIDO`
- `CANCELADO`
- `VENCIDO`

Racional:

- `ATENDIDO` separa pedido totalmente cubierto de pedido ya convertido a `Venta`.
- `VENCIDO` permanece porque usuario lo quiere conservar, pero ya no quedará “flotando” sin soporte temporal.

#### Contrato `Pedido`

Archivo objetivo: `src/domain/pedido/contracts/pedido.contract.ts`

Shape final propuesto:

- `id: string`
- `type: "pedido"`
- `codigoPedido: string`
- `estado: PedidoState`
- `clienteId?: string`
- `creadoPorId: string`
- `ventaId?: string`
- `fechaPedido: Date`
- `fechaCompromiso?: Date`
- `fechaVencimiento?: Date`
- `items: PedidoItem[]`
- `subtotal: number`
- `total: number`
- `createdAt: Date`
- `updatedAt: Date`

`PedidoItem` final:

- `id: string`
- `presentacionId: string`
- `cantidadSolicitada: number`
- `cantidadAtendida: number`
- `precioUnitario: number`
- `subtotal: number`

Racional:

- `codigoPedido` da identidad ERP legible para cliente/operación.
- `ventaId?` permite trazabilidad directa de conversión.
- `fechaVencimiento?` respalda `VENCIDO`.
- `fechaCompromiso?` respalda promesa comercial sin mezclar logística completa.
- `subtotal` por item congela monto de línea en contrato.

#### Contrato `PedidoEntrega`

Archivo objetivo: `src/domain/pedido/contracts/pedido-entrega.contract.ts`

Shape final propuesto:

- `id: string`
- `type: "pedido_entrega"`
- `pedidoId: string`
- `estado: PedidoEntregaState`
- `modalidad: "RECOJO" | "DESPACHO"`
- `responsableId?: string`
- `programadoPara?: Date`
- `fechaSalida?: Date`
- `fechaEntrega?: Date`
- `createdAt: Date`
- `updatedAt: Date`

`PedidoEntregaState` final:

- `PENDIENTE`
- `EN_PREPARACION`
- `LISTO_PARA_RECOJO`
- `DESPACHADO`
- `EN_RUTA`
- `ENTREGADO`
- `NO_ENTREGADO`
- `CANCELADO`

Racional:

- `Pedido` conserva semántica comercial.
- `PedidoEntrega` resuelve pregunta operativa/logística que cliente sí entiende: listo, despachado, en ruta, entregado.

### Decisión sobre enums

Se mantendrán en `src/domain/shared/kernel/enums.ts` para minimizar ruptura de imports públicos actuales del catálogo de enums, pero:

- `PedidoState` se actualizará allí;
- `PedidoEntregaState` se agregará allí;
- ownership documental de contratos pasará al nuevo domain `pedido`.

### Compatibilidad

- Root import `from "yola-fresh-utils"` seguirá funcionando si el consumer toma `Pedido`, `PedidoItem`, `PedidoEntrega` y enums desde export raíz.
- Deep import `from "yola-fresh-utils/ventas/contracts"` para `Pedido` pasará a ser incompatible.
- Se documentará como cambio de migración en `src/docs/pedido`.

## Proposed Changes

### 1. Crear nuevo domain `pedido`

#### Crear `src/domain/pedido/contracts/pedido.contract.ts`

Qué:

- mover y rediseñar contrato comercial de `Pedido`;
- agregar campos faltantes:
  - `codigoPedido`
  - `ventaId?`
  - `fechaPedido`
  - `fechaCompromiso?`
  - `fechaVencimiento?`
  - `subtotal` por item

Por qué:

- `Pedido` deja de ser DTO huérfano dentro de `ventas`;
- `VENCIDO` queda respaldado por fecha;
- el contrato queda consumible en ERP real.

Cómo:

- crear nuevo archivo con imports desde `shared/kernel/enums`;
- definir `PedidoItem` y `Pedido` finales;
- mantener `type: "pedido"`.

#### Crear `src/domain/pedido/contracts/pedido-entrega.contract.ts`

Qué:

- crear contrato logístico separado.

Por qué:

- no mezclar reserva comercial con fulfillment/entrega;
- habilitar casos de uso cliente:
  - listo para recojo
  - despachado
  - en ruta
  - entregado

Cómo:

- definir `PedidoEntrega`;
- definir `modalidad` como unión string local;
- usar `PedidoEntregaState` desde `shared/kernel/enums`.

#### Crear `src/domain/pedido/contracts/index.ts`

Qué:

- exportar `pedido.contract`;
- exportar `pedido-entrega.contract`.

#### Crear `src/domain/pedido/index.ts`

Qué:

- exportar `./contracts`.

### 2. Reubicar y limpiar `Pedido` fuera de `ventas`

#### Actualizar `src/domain/ventas/contracts/index.ts`

Qué:

- eliminar export de `./pedido.contract`.

Por qué:

- `Pedido` deja de ser ownership de `ventas`.

#### Eliminar `src/domain/ventas/contracts/pedido.contract.ts`

Qué:

- borrar contrato viejo residual.

Por qué:

- evitar doble verdad contractual.

### 3. Actualizar catálogo de enums

#### Modificar `src/domain/shared/kernel/enums.ts`

Qué:

- cambiar `PedidoState` a:
  - `ABIERTO`
  - `PARCIALMENTE_ATENDIDO`
  - `ATENDIDO`
  - `CONVERTIDO`
  - `CANCELADO`
  - `VENCIDO`
- agregar `PedidoEntregaState`.

Por qué:

- `ATENDIDO` cierra hueco entre cobertura completa y conversión;
- `PedidoEntregaState` evita meter logística en `PedidoState`.

### 4. Publicar nuevo domain en surface pública del paquete

#### Modificar `scripts/generate-exports.ts`

Qué:

- agregar `export * from "./domain/pedido/contracts";` al contenido generado de `src/index.ts`.

Por qué:

- `src/index.ts` es autogenerado; la fuente real del cambio es el script.

#### Regenerar `src/index.ts`

Qué:

- ejecutar `npm run generate-exports`.

Por qué:

- sincronizar root export con nuevo domain `pedido`.

#### Modificar `package.json`

Qué:

- agregar exports:
  - `./pedido`
  - `./pedido/contracts`
- agregar `typesVersions` equivalentes;
- agregar `pedido` en `files`.

Por qué:

- publicar subpaths nuevos de forma oficial.

#### Modificar `scripts/generate-public-subpath-stubs.cjs`

Qué:

- agregar stubs:
  - `pedido`
  - `pedido/contracts`
- agregar `pedido` a `rootDirs`.

Por qué:

- build genera stubs root-level públicos desde este archivo.

### 5. Documentación nueva en `src/docs/pedido`

#### Crear `src/docs/pedido/README.md`

Qué:

- índice del nuevo Domain `pedido`.

Debe explicar:

- propósito;
- alcance;
- diferencia entre `Pedido` y `PedidoEntrega`;
- documentos disponibles;
- límites del paquete.

#### Crear `src/docs/pedido/modelo-vigente.md`

Qué:

- documento principal del modelo.

Debe cubrir:

- qué es `Pedido`;
- qué es `PedidoEntrega`;
- estados comerciales;
- estados logísticos;
- responsabilidades y límites;
- campos canónicos observados.

#### Crear `src/docs/pedido/relaciones-interdominio.md`

Qué:

- relaciones de `pedido` con:
  - `ventas`
  - `inventario`
  - `tesoreria`
  - `finanzas`
  - `personas`

Debe dejar claro:

- `Pedido` no es `Venta`;
- `PedidoEntrega` no es `MovimientoInventario`;
- `Pedido` puede convertirse en `Venta` vía `ventaId` / `pedidoId`;
- deuda, cobro, caja y stock siguen fuera del contrato principal.

#### Crear `src/docs/pedido/guia-de-consumo.md`

Qué:

- guía de lectura para consumers.

Debe cubrir:

- cómo crear `Pedido`;
- cómo leer pendiente;
- cuándo usar `PedidoEntrega`;
- cómo interpretar `VENCIDO`;
- cómo enlazar con `Venta`;
- errores de modelado a evitar.

#### Crear `src/docs/pedido/migracion-v1-0-7-a-v2-0-0.md`

Qué:

- guía de migración por ruptura de ownership/subpaths.

Debe cubrir:

- `Pedido` ya no sale desde `ventas/contracts`;
- nuevo subpath `pedido/contracts`;
- nuevo enum `ATENDIDO`;
- nuevo contrato `PedidoEntrega`;
- reemplazos de import.

### 6. Actualizar documentación transversal

#### Modificar `src/docs/README.md`

Qué:

- agregar sección `Pedido`;
- enlazar nuevos docs del domain.

#### Modificar `src/docs/core/contratos-compartidos.md`

Qué:

- sacar `Pedido` del ownership de `ventas`;
- crear sección `Pedido` con evidencia:
  - `pedido/contracts/index.ts`
  - `pedido.contract.ts`
  - `pedido-entrega.contract.ts`

#### Modificar `src/docs/core/mapa-del-dominio.md`

Qué:

- agregar `Pedido` como domain/módulo propio en mapa;
- ajustar descripción de `ventas` para que ya no absorba reserva comercial.

#### Modificar `src/docs/core/glosario.md`

Qué:

- ampliar definición de `Pedido`;
- agregar `PedidoEntrega`.

### 7. Reducir `Pedido` dentro de documentación de ventas

#### Modificar `src/docs/ventas/README.md`

Qué:

- quitar `pedido.contract.ts` de evidencia principal de `ventas`;
- enlazar a `../pedido/README.md`.

#### Modificar `src/docs/ventas/modelo-vigente.md`

Qué:

- dejar `Pedido` solo como relación con `Venta`;
- mover semántica detallada al nuevo domain `pedido`.

#### Modificar `src/docs/ventas/relaciones-interdominio.md`

Qué:

- mantener sección de relación con `Pedido`, pero enlazar a documentación propietaria.

#### Modificar `src/docs/ventas/guia-de-consumo.md`

Qué:

- mantener regla de `pedidoId`;
- reemplazar cualquier lectura profunda de `Pedido` por referencia al nuevo domain.

## Implementation Order

1. Crear `src/domain/pedido/contracts/*` e `src/domain/pedido/index.ts`.
2. Actualizar `src/domain/shared/kernel/enums.ts`.
3. Quitar `Pedido` de `ventas/contracts` y eliminar contrato viejo.
4. Actualizar `scripts/generate-exports.ts` y regenerar `src/index.ts`.
5. Actualizar `package.json`.
6. Actualizar `scripts/generate-public-subpath-stubs.cjs`.
7. Crear `src/docs/pedido/*`.
8. Ajustar docs transversales y docs de `ventas`.
9. Ejecutar build y pruebas.
10. Revisar diagnósticos de archivos tocados.

## Verification Steps

### Verificación técnica

- ejecutar `npm run generate-exports`;
- ejecutar `npm run build`;
- ejecutar `npm test`.

### Verificación estructural

- confirmar existencia de:
  - `src/domain/pedido/contracts/pedido.contract.ts`
  - `src/domain/pedido/contracts/pedido-entrega.contract.ts`
  - `src/domain/pedido/contracts/index.ts`
  - `src/domain/pedido/index.ts`
  - `src/docs/pedido/README.md`
  - `src/docs/pedido/modelo-vigente.md`
  - `src/docs/pedido/relaciones-interdominio.md`
  - `src/docs/pedido/guia-de-consumo.md`
  - `src/docs/pedido/migracion-v1-0-7-a-v2-0-0.md`

### Verificación de exports

- confirmar que root export incluye `pedido/contracts`;
- confirmar que `package.json` publica:
  - `./pedido`
  - `./pedido/contracts`
- confirmar que stubs root-level `pedido/` se generan tras build.

### Verificación documental

- confirmar que `src/docs/README.md` lista `pedido`;
- confirmar que `core/contratos-compartidos.md` ya no atribuye `Pedido` a `ventas`;
- confirmar que `ventas/*` dejan `Pedido` como relación y no como ownership.

## Riesgos y mitigaciones

- Riesgo: ruptura de deep imports `ventas/contracts`.
  - Mitigación: documentar cambio en `src/docs/pedido/migracion-v1-0-7-a-v2-0-0.md`.
- Riesgo: `VENCIDO` siga ambiguo aunque exista fecha.
  - Mitigación: documentar criterio exacto de lectura en `guia-de-consumo.md`.
- Riesgo: duplicar semántica entre `Pedido` y `PedidoEntrega`.
  - Mitigación: documentar límites claros en `modelo-vigente.md` y `relaciones-interdominio.md`.

