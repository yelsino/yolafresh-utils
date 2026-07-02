# Plan de implementación total del RFC de estructura por dominios

## Resumen

Se implementará una refactorización total de `yolafresh-utils` para convertir el paquete en una librería de dominio organizada por contexto de negocio y por tipo de artefacto (`contracts`, `entities`, `events`), eliminando compatibilidad legacy.

El resultado objetivo será:

- estructura fuente explícita por dominio;
- `shared/` reducido a kernel, primitivas, value objects y utilidades mínimas;
- `CuentaCliente` absorbido dentro de `finanzas`;
- mantenimiento de entidades ricas para `Venta`, `CarritoVenta`, `VentaSnapshot`, `Compra`, `RecurrenciaEntity`, `Usuario` y `AsientoContable`;
- publicación simplificada con `root` mínimo y subpaths nuevos por dominio;
- eliminación de surface legacy (`domain/` generado, aliases históricos, exports amplios, `typesVersions` viejos);
- documentación actualizada para reflejar la estructura final e RFC cerrado como aceptado.

## Análisis del estado actual

### Topología fuente real

- El código fuente activo está en `src/domain/`.
- Los dominios actuales visibles son `ventas`, `compras`, `contabilidad`, `finanzas`, `tesoreria`, `usuarios` y `shared`.
- `src/domain/shared/interfaces/index.ts` concentra el mayor volumen del lenguaje de negocio y hoy mezcla ownership semántico de múltiples dominios.
- `src/domain/shared/base`, `src/domain/shared/value-objects` y `src/domain/shared/utils` ya están bastante cerca del objetivo, aunque `shared/interfaces/fiscales.ts` contiene también lógica utilitaria (`FiscalUtils`, `ConfiguracionFiscalFactory`).

### Módulos con comportamiento real

- `src/domain/ventas/Venta.ts`
- `src/domain/ventas/CarritoVenta.ts`
- `src/domain/ventas/VentaSnapshot.ts`
- `src/domain/ventas/events/VentaConfirmada.ts`
- `src/domain/compras/Compra.ts`
- `src/domain/finanzas/Recurrencia.ts`
- `src/domain/usuarios/usuario.ts`
- `src/domain/contabilidad/AsientoContable.ts`
- `src/domain/contabilidad/ContabilidadBase.ts`

### Publicación y build actual

- `src/index.ts` reexporta `shared/interfaces`, `shared/utils`, `shared/base`, `shared/value-objects`, `Venta`, `CarritoVenta`, `VentaSnapshot` y `Recurrencia`.
- `package.json` publica simultáneamente raíz mínima, subpaths profundos `./domain/...` y aliases legacy `./interfaces`, `./utils`, `./class`.
- `typesVersions` replica esa compatibilidad antigua.
- `scripts/generate-exports.ts` genera barrels solo para `shared/*` y el root actual.
- `scripts/generate-subpath-stubs.cjs` genera el árbol legacy `domain/` desde `dist/domain`.
- `tsconfig.json` define aliases internos `@interfaces`, `@/interfaces`, `@utils`, `@/utils` apuntando a `src/domain/shared/*`.

### Documentación actual a alinear

- Navegación global: `README.md`, `src/docs/README.md`
- Core: `src/docs/core/README.md`, `src/docs/core/arquitectura-vigente.md`, `src/docs/core/contratos-compartidos.md`, `src/docs/core/primitivas-y-publicacion.md`, `src/docs/core/rfc-evolucion-estructura-libreria.md`
- Dominios: `src/docs/{ventas,compras,inventario,tesoreria,finanzas,personas,contabilidad,cuenta-cliente}/**/*.md`
- Apoyo histórico que depende del mapa vigente: `src/docs/types.md`, `src/docs/interface-extension-pattern.md`, `src/docs/inventario-tecnico-yolafresh-utils.md`, `src/docs/personas.md`, `src/docs/rbac-frontend-implementation.md`, `src/docs/roles y cargos/**/*.md`

## Decisiones cerradas con el usuario

- No se conservará compatibilidad.
- Se asume proyecto nuevo y se permite ruptura total de imports y publication surface previa.
- `CuentaCliente` migrará dentro de `finanzas`.
- Las entidades ricas a mantener serán: `Venta`, `CarritoVenta`, `VentaSnapshot`, `Compra`, `RecurrenciaEntity`, `Usuario` y `AsientoContable`/`PeriodoFiscal`/`PlanCuenta`.
- La convención de contratos será `*.contract.ts`.
- La surface pública será `root` mínimo + subpaths por dominio.
- Se simplificará build/publicación, eliminando artefactos y exports legacy.
- El RFC quedará actualizado a estado aceptado y reflejará la estructura final implementada.

## Cambios propuestos

### 1. Reestructurar `src/domain` a topología por dominio

#### Objetivo

Pasar de una mezcla `shared/interfaces + dominios sueltos` a una organización uniforme:

```txt
src/domain/
  shared/
    base/
    kernel/
    utils/
    value-objects/
  ventas/
    contracts/
    entities/
    events/
    index.ts
  compras/
    contracts/
    entities/
    index.ts
  inventario/
    contracts/
    index.ts
  tesoreria/
    contracts/
    index.ts
  finanzas/
    contracts/
    entities/
    index.ts
  personas/
    contracts/
    entities/
    index.ts
  contabilidad/
    contracts/
    entities/
    index.ts
```

#### Archivos fuente que se deberán mover o dividir

- `src/domain/ventas/Venta.ts` -> `src/domain/ventas/entities/Venta.ts`
- `src/domain/ventas/CarritoVenta.ts` -> `src/domain/ventas/entities/CarritoVenta.ts`
- `src/domain/ventas/VentaSnapshot.ts` -> `src/domain/ventas/entities/VentaSnapshot.ts`
- `src/domain/ventas/events/VentaConfirmada.ts` -> `src/domain/ventas/events/VentaConfirmada.ts` (se mantiene, pero con imports actualizados)
- `src/domain/compras/Compra.ts` -> `src/domain/compras/entities/Compra.ts`
- `src/domain/finanzas/Recurrencia.ts` -> `src/domain/finanzas/entities/RecurrenciaEntity.ts`
- `src/domain/usuarios/usuario.ts` -> `src/domain/personas/entities/Usuario.ts`
- `src/domain/contabilidad/AsientoContable.ts` -> `src/domain/contabilidad/entities/AsientoContable.ts`
- `src/domain/contabilidad/ContabilidadBase.ts` -> dividir en:
  - `src/domain/contabilidad/entities/PeriodoFiscal.ts`
  - `src/domain/contabilidad/entities/PlanCuenta.ts`

### 2. Vaciar `shared/interfaces` y redistribuir contratos a dominios propietarios

#### Objetivo

Eliminar `src/domain/shared/interfaces` como centro del negocio y mover su contenido al dominio dueño.

#### Mapa de destino propuesto

- `producto.ts` -> `src/domain/inventario/contracts/producto.contract.ts`
- `producto.update.interface.ts` -> `src/domain/inventario/contracts/producto-update.contract.ts`
- `Inventario.ts` -> dividir o renombrar en `inventario`:
  - `almacen.contract.ts`
  - `stock.contract.ts`
  - `movimiento-inventario.contract.ts`
  - `transferencia.contract.ts`
  - `recepcion-mercaderia.contract.ts`
  - `kardex.contract.ts`
- `pedido.ts` -> `src/domain/ventas/contracts/pedido.contract.ts`
- `compras.ts` -> `src/domain/compras/contracts/compra.contract.ts`
- `caja.ts` -> `src/domain/tesoreria/contracts/caja.contract.ts`
- `pagos.ts` -> `src/domain/tesoreria/contracts/pago.contract.ts`
- `customer-account.ts` -> `src/domain/finanzas/contracts/cuenta-cliente.contract.ts`
- `finanzas.ts` -> `src/domain/finanzas/contracts/finanzas.contract.ts` y, si hace falta, separar:
  - `ingreso.contract.ts`
  - `egreso.contract.ts`
  - `cuenta-proveedor.contract.ts`
- `ledger.ts` -> `src/domain/finanzas/contracts/ledger-auxiliar.contract.ts` o `movimiento-financiero-auxiliar.contract.ts`
- `recurrencias.ts` -> `src/domain/finanzas/contracts/recurrencia.contract.ts`
- `persons.ts` -> `src/domain/personas/contracts/persons.contract.ts`
- `usuario.ts` -> `src/domain/personas/contracts/usuario.contract.ts`
- `entidades.ts` -> `src/domain/personas/contracts/entidad.contract.ts`
- `roles.ts` -> `src/domain/personas/contracts/roles.contract.ts`
- `permisos.ts` -> `src/domain/personas/contracts/permisos.contract.ts`
- `direccion.ts` -> `src/domain/personas/contracts/direccion.contract.ts`
- `empresa.ts` -> `src/domain/personas/contracts/empresa.contract.ts` o `src/domain/shared/kernel/empresa.contract.ts` si resulta realmente transversal
- `documentos.ts` -> `src/domain/shared/kernel/documentos.contract.ts` o dominio concreto si exploration de imports muestra ownership estable
- `evidencias.ts` -> `src/domain/shared/kernel/evidencias.contract.ts`
- `enums.ts` -> redistribuir enums por dominio; dejar solo enums verdaderamente transversales en `shared/kernel/enums.ts`
- `fiscales.ts` -> separar:
  - `src/domain/shared/kernel/fiscal.contract.ts` para `ConfiguracionFiscal`
  - evaluar si `FiscalUtils` y `ConfiguracionFiscalFactory` permanecen en `shared/utils` o salen del paquete si son pura conveniencia técnica

### 3. Crear barrels por dominio y reducir `shared/`

#### Objetivo

Que cada dominio tenga entradas claras para consumo interno y externo:

- `src/domain/ventas/index.ts`
- `src/domain/compras/index.ts`
- `src/domain/inventario/index.ts`
- `src/domain/tesoreria/index.ts`
- `src/domain/finanzas/index.ts`
- `src/domain/personas/index.ts`
- `src/domain/contabilidad/index.ts`
- `src/domain/shared/base/index.ts`
- `src/domain/shared/kernel/index.ts`
- `src/domain/shared/utils/index.ts`
- `src/domain/shared/value-objects/index.ts`

#### Qué exportará cada dominio

- `contracts/index.ts`: solo contratos y tipos de ese dominio
- `entities/index.ts`: solo entidades ricas
- `events/index.ts`: solo eventos, donde aplique
- `index.ts` del dominio: barrel agregado para `contracts`, `entities` y `events`

### 4. Actualizar imports internos y eliminar aliases legacy

#### Archivos a tocar

- Todos los `.ts` bajo `src/domain/**`
- `tsconfig.json`

#### Qué hacer

- Reemplazar imports `@interfaces`, `@/interfaces`, `@utils`, `@/utils` por imports relativos o aliases nuevos por dominio.
- Eliminar paths legacy desde `tsconfig.json`.
- Si se necesita, introducir aliases nuevos explícitos por dominio, por ejemplo:
  - `@shared/*`
  - `@ventas/*`
  - `@finanzas/*`
  - `@personas/*`

#### Decisión recomendada de implementación

- Preferir imports relativos claros dentro de cada dominio.
- Reservar aliases solo para `shared/*` y, si el volumen lo exige, para el root de cada dominio.

### 5. Simplificar publicación del paquete

#### Archivos a modificar

- `package.json`
- `src/index.ts`
- `scripts/generate-exports.ts`
- `scripts/generate-subpath-stubs.cjs`

#### Qué hacer

- Eliminar exports legacy:
  - `./domain/*`
  - `./domain/shared/*`
  - `./interfaces`
  - `./utils`
  - `./class`
- Definir exports nuevos por dominio, por ejemplo:
  - `.`
  - `./ventas`
  - `./ventas/contracts`
  - `./ventas/entities`
  - `./ventas/events`
  - `./compras`
  - `./compras/contracts`
  - `./compras/entities`
  - `./inventario`
  - `./inventario/contracts`
  - `./tesoreria`
  - `./tesoreria/contracts`
  - `./finanzas`
  - `./finanzas/contracts`
  - `./finanzas/entities`
  - `./personas`
  - `./personas/contracts`
  - `./personas/entities`
  - `./contabilidad`
  - `./contabilidad/contracts`
  - `./contabilidad/entities`
  - `./shared/base`
  - `./shared/kernel`
  - `./shared/utils`
  - `./shared/value-objects`
- Reducir `files` a `dist`.
- Eliminar `typesVersions` legacy o regenerarlo solo para los nuevos subpaths públicos.
- Reescribir `scripts/generate-exports.ts` para generar barrels por dominio, no por `shared/interfaces`.
- Eliminar por completo `scripts/generate-subpath-stubs.cjs` del flujo de build.
- Ajustar script `build` a solo `tsc && tsc-alias` o equivalente que ya no dependa del árbol `domain/`.

### 6. Redefinir `src/index.ts`

#### Objetivo

Mantener root mínimo.

#### Exportaciones previstas

- `shared/base`
- `shared/kernel`
- `shared/utils`
- `shared/value-objects`
- símbolos estratégicos acordados:
  - `Venta`
  - `CarritoVenta`
  - `VentaSnapshot`
  - `RecurrenciaEntity`

#### No exportar desde root

- contratos masivos de todos los dominios;
- barrels profundos legacy;
- aliases históricos.

### 7. Actualizar documentación para reflejar estructura final

#### Archivos core

- `README.md`
- `src/docs/README.md`
- `src/docs/core/README.md`
- `src/docs/core/arquitectura-vigente.md`
- `src/docs/core/contratos-compartidos.md`
- `src/docs/core/primitivas-y-publicacion.md`
- `src/docs/core/rfc-evolucion-estructura-libreria.md`

#### Qué cambiar

- reflejar nueva topología `contracts/entities/events`;
- explicar que `CuentaCliente` ahora pertenece a `finanzas`;
- actualizar evidencia y rutas a archivos nuevos;
- cerrar RFC en estado `Aceptado` o `Implementado`;
- actualizar surface pública y subpaths nuevos;
- eliminar menciones al árbol legacy `domain/` generado;
- actualizar documentación de build/publicación.

#### Archivos de dominios a revisar

- `src/docs/ventas/**/*.md`
- `src/docs/compras/**/*.md`
- `src/docs/inventario/**/*.md`
- `src/docs/tesoreria/**/*.md`
- `src/docs/finanzas/**/*.md`
- `src/docs/personas/**/*.md`
- `src/docs/contabilidad/**/*.md`
- `src/docs/cuenta-cliente/**/*.md`

#### Decisión documental

- `cuenta-cliente/` dejará de ser dominio de primer nivel y se integrará como documentación dentro de `finanzas/`.
- Se conservarán documentos históricos solo si siguen aportando contexto; de lo contrario, se consolidarán o se marcarán como retirados.

### 8. Normalizar metadatos y mensajes públicos del paquete

#### Archivos a modificar

- `package.json`
- `README.md`

#### Qué hacer

- actualizar descripción del paquete a librería de dominio, no POS completo/UI;
- resolver placeholders actuales de `homepage`, `repository`, `bugs`, `author` si el usuario desea dejar metadatos reales en esta misma implementación;
- alinear README con publication surface nueva.

## Orden de implementación recomendado

### Etapa A: preparativos estructurales

1. Crear carpetas nuevas `contracts/entities/events/kernel`.
2. Crear barrels vacíos por dominio.
3. Mover primero las entidades ricas.

### Etapa B: migración contractual

4. Redistribuir contratos desde `shared/interfaces` a dominios propietarios.
5. Dividir contratos monolíticos cuando el archivo mezcla demasiados conceptos de un dominio.
6. Crear `shared/kernel` final con solo transversales reales.

### Etapa C: recompilación interna

7. Reescribir imports internos.
8. Ajustar `tsconfig.json`.
9. Regenerar barrels.

### Etapa D: publicación

10. Reescribir `src/index.ts`.
11. Reescribir `package.json`.
12. Eliminar `generate-subpath-stubs.cjs` del build.
13. Simplificar `generate-exports.ts`.

### Etapa E: documentación

14. Cerrar RFC.
15. Actualizar docs core.
16. Integrar `cuenta-cliente` dentro de `finanzas`.
17. Actualizar README raíz y navegación global.

### Etapa F: verificación

18. Ejecutar build.
19. Corregir imports/exports rotos.
20. Revisar diagnósticos TypeScript.

## Supuestos y decisiones de implementación

- Se permiten cambios destructivos de estructura y exports.
- No se preservarán rutas antiguas del paquete.
- Se permite borrar el directorio raíz `domain/` generado y todo soporte para stubs legacy.
- Los nombres exactos de archivos divididos desde contratos monolíticos podrán ajustarse durante implementación, siempre que respeten ownership de dominio y sufijo `*.contract.ts`.
- Si durante la ejecución aparece un contrato verdaderamente transversal que no pertenezca razonablemente a un único dominio, se moverá a `src/domain/shared/kernel/`.
- Si `FiscalUtils` o `ConfiguracionFiscalFactory` no encajan en contrato puro ni utilitario mínimo de dominio, se propondrá su eliminación del paquete en vez de conservarlo por inercia.

## Riesgos y mitigaciones

### Riesgo: división excesiva de archivos contractuales

Mitigación:

- mantener equilibrio pragmático; dividir solo cuando el archivo mezcla ownership o categorías claramente distintas.

### Riesgo: imports internos rotos por cambios masivos

Mitigación:

- migrar por dominio y ejecutar verificación al final de cada bloque grande.

### Riesgo: desalineación entre docs y source

Mitigación:

- no cerrar implementación hasta actualizar docs core y dominios con rutas nuevas.

### Riesgo: semántica confusa al absorber `cuenta-cliente` en finanzas

Mitigación:

- mantener subcarpeta documental o sección interna clara dentro de `finanzas`;
- dejar relaciones y límites explícitos frente a tesorería y ventas.

## Verificación

### Verificaciones técnicas

- revisar diagnósticos TypeScript en archivos movidos y nuevos barrels;
- ejecutar build del paquete;
- inspeccionar `dist/` para confirmar nueva surface pública;
- verificar que `package.json` exports resuelvan solo nuevas rutas;
- confirmar que ya no se genera ni se publica el árbol legacy `domain/`.

### Verificaciones documentales

- revisar diagnósticos Markdown en docs editadas;
- comprobar que `src/docs/README.md` navegue a la nueva topología;
- confirmar que RFC quede en estado aceptado/implementado;
- validar que no queden referencias primarias a `shared/interfaces` como depósito global ni a `cuenta-cliente/` como dominio separado si se absorbió en `finanzas`.

### Criterio de aceptación

La implementación se considerará completa cuando:

- el código fuente quede reorganizado por dominio con `contracts/entities/events`;
- el paquete compile sin soporte legacy;
- la publicación quede reducida a `dist` y exports nuevos;
- la documentación describa exactamente la estructura implementada;
- `shared/` deje de ser el centro contractual del negocio.
