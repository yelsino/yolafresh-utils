# Plan de implementación final: RFC de estructura por dominios

## Resumen

Implementar cierre total del RFC de evolución estructural de `yolafresh-utils` asumiendo ruptura completa y proyecto nuevo. El objetivo es alinear código fuente, surface pública, build y documentación con la estructura ya iniciada en `src/domain/*/{contracts,entities,events}` y eliminar todo rastro de publicación, imports y narrativa legacy basada en `shared/interfaces`, `domain/usuarios` y `domain/*` fuera de `dist`.

## Estado actual analizado

### Estructura fuente ya migrada parcialmente

- Existe nueva topología en `src/domain/ventas`, `src/domain/compras`, `src/domain/finanzas`, `src/domain/personas`, `src/domain/inventario`, `src/domain/tesoreria`, `src/domain/contabilidad` y `src/domain/shared`.
- Ya existen barrels por dominio en:
  - `src/domain/ventas/index.ts`
  - `src/domain/compras/index.ts`
  - `src/domain/finanzas/index.ts`
  - `src/domain/personas/index.ts`
  - `src/domain/inventario/index.ts`
  - `src/domain/tesoreria/index.ts`
  - `src/domain/contabilidad/index.ts`
  - `src/domain/shared/kernel/index.ts`
- `shared/interfaces` ya no existe en `src/`, pero sigue referenciado por surface pública y documentación.

### Surface pública y build siguen desalineados

- `src/index.ts` aún reexporta:
  - `./domain/shared/interfaces`
  - `./domain/ventas/Venta`
  - `./domain/ventas/CarritoVenta`
  - `./domain/ventas/VentaSnapshot`
  - `./domain/finanzas/Recurrencia`
- `package.json` aún publica exports legacy:
  - `./domain/*`
  - `./domain/shared/interfaces/*`
  - `./domain/usuarios/*`
  - aliases históricos `./interfaces`, `./utils`, `./class`
- `package.json` aún incluye `files: ["dist", "domain"]`, por lo que mantiene artefactos compilados legacy fuera de `dist`.
- `scripts/generate-exports.ts` genera una raíz y barrels basados en `shared/interfaces` y rutas antiguas.
- `scripts/generate-subpath-stubs.cjs` sigue formando parte del build, aunque la decisión vigente es publicar solo `dist`.
- `tsconfig.json` mantiene aliases obsoletos `@interfaces` y `@/interfaces` apuntando a rutas eliminadas.

### Documentación aún refleja estado anterior

- `src/docs/README.md` aún declara como evidencia primaria:
  - `src/domain/shared/interfaces/`
  - `src/domain/compras/Compra.ts`
  - `src/domain/finanzas/Recurrencia.ts`
- El RFC `src/docs/core/rfc-evolucion-estructura-libreria.md` sigue en estado `Propuesto`.
- Hay 180 ocurrencias en 31 archivos de documentación con referencias a:
  - `shared/interfaces`
  - `domain/usuarios`
  - rutas antiguas de `Venta.ts` y `Recurrencia.ts`
  - `cuenta-cliente/README.md`
- La documentación sigue tratando `cuenta-cliente` como bloque separado, aunque la decisión vigente es absorberla dentro de `finanzas`.

### Artefactos legacy presentes en repo

- Existe un árbol `domain/` en raíz con `.js` y `.d.ts` compilados de estructura antigua.
- Existen documentos históricos fuera del foco actual (`README-LIBRARY.md`, `SISTEMA-USUARIOS*.md`, `example.js`, etc.) que deben clasificarse como históricos o excluirse del discurso principal, pero no son prioridad inicial frente a source/build/docs oficiales.

## Decisiones cerradas

- No se conserva compatibilidad hacia atrás.
- Se asume proyecto nuevo.
- La convención de contratos es `*.contract.ts`.
- `shared/` queda limitado a `base`, `kernel`, `utils`, `value-objects`.
- `CuentaCliente` y su lenguaje se consideran parte de `finanzas`.
- La surface pública oficial será `root` mínimo + subpaths por dominio.
- La publicación oficial se hace solo desde `dist`; no se conservará árbol `domain/` publicado en raíz del paquete.
- Se acepta limpiar o eliminar wrappers, aliases y exports legacy aunque rompan imports previos.

## Cambios propuestos

### 1. Cerrar imports y barrels fuente

**Archivos a revisar**

- `src/index.ts`
- `src/domain/shared/base/index.ts`
- `src/domain/shared/kernel/index.ts`
- `src/domain/shared/utils/index.ts`
- `src/domain/shared/value-objects/index.ts`
- `src/domain/ventas/index.ts`
- `src/domain/compras/index.ts`
- `src/domain/finanzas/index.ts`
- `src/domain/personas/index.ts`
- `src/domain/inventario/index.ts`
- `src/domain/tesoreria/index.ts`
- `src/domain/contabilidad/index.ts`
- `src/domain/**/contracts/*.ts`
- `src/domain/**/entities/*.ts`

**Qué hacer**

- Reescribir `src/index.ts` como raíz mínima nueva.
- Exportar solo:
  - `./domain/shared/base`
  - `./domain/shared/kernel`
  - `./domain/shared/utils`
  - `./domain/shared/value-objects`
  - `Venta`, `CarritoVenta`, `VentaSnapshot` desde `./domain/ventas/entities`
  - `RecurrenciaEntity` desde `./domain/finanzas/entities`
- Revisar imports residuales y corregir cualquier referencia todavía apuntando a rutas anteriores.

**Resultado esperado**

- Ningún archivo en `src/` debe importar `shared/interfaces`, `domain/usuarios`, `domain/ventas/Venta` o `domain/finanzas/Recurrencia`.

### 2. Simplificar publicación y build

**Archivos a cambiar**

- `package.json`
- `tsconfig.json`
- `scripts/generate-exports.ts`
- `scripts/generate-subpath-stubs.cjs`

**Qué hacer**

- `package.json`
  - Actualizar descripción y metadatos públicos para reflejar librería de contratos/dominio.
  - Eliminar exports legacy y dejar exports explícitos hacia `dist`.
  - Definir subpaths oficiales:
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
  - Reducir `files` a `["dist"]`.
  - Ajustar `typesVersions` a nuevos subpaths o eliminarlo si `exports.types` ya cubre consumo moderno y no aporta valor.
  - Cambiar `build` a flujo sin stubs legacy, idealmente `tsc && tsc-alias`.
- `tsconfig.json`
  - Eliminar `@interfaces`, `@/interfaces` y cualquier alias muerto.
  - Mantener solo aliases que existan de verdad y aporten valor real.
- `scripts/generate-exports.ts`
  - Simplificarlo para generar únicamente `src/index.ts` nuevo, o retirarlo si deja de aportar valor frente a barrels explícitos.
  - La opción preferida es mantenerlo mínimo y explícito solo para la raíz.
- `scripts/generate-subpath-stubs.cjs`
  - Eliminarlo del flujo de build.
  - Si no queda uso real, borrar archivo.

**Resultado esperado**

- `pnpm run build` emite solo `dist/**`.
- `package.json` ya no expone rutas `domain/*`, `interfaces`, `utils`, `class` ni `usuarios`.

### 3. Eliminar residuos legacy de publicación

**Objetos a limpiar**

- Carpeta raíz `domain/`
- Cualquier archivo generado legacy que no sea fuente en `src/`

**Qué hacer**

- Borrar `domain/` de raíz porque representa publicación compilada vieja y contradice decisión de publicar solo `dist`.
- Confirmar que `.gitignore` y scripts no vuelvan a regenerarla.

**Resultado esperado**

- Repo no conserva doble source/publication tree.

### 4. Reescribir documentación oficial a topología nueva

**Archivos principales**

- `README.md`
- `src/docs/README.md`
- `src/docs/core/README.md`
- `src/docs/core/arquitectura-vigente.md`
- `src/docs/core/contratos-compartidos.md`
- `src/docs/core/primitivas-y-publicacion.md`
- `src/docs/core/rfc-evolucion-estructura-libreria.md`
- `src/docs/ventas/README.md`
- `src/docs/ventas/modelo-vigente.md`
- `src/docs/ventas/guia-de-consumo.md`
- `src/docs/ventas/relaciones-interdominio.md`
- `src/docs/finanzas/README.md`
- `src/docs/finanzas/modelo-vigente.md`
- `src/docs/compras/README.md`
- `src/docs/compras/modelo-vigente.md`
- `src/docs/inventario/README.md`
- `src/docs/inventario/modelo-vigente.md`
- `src/docs/tesoreria/README.md`
- `src/docs/tesoreria/modelo-vigente.md`
- `src/docs/personas/README.md`
- `src/docs/personas/modelo-vigente.md`
- `src/docs/personas/autorizacion-y-sesion.md`
- `src/docs/contabilidad/README.md`
- `src/docs/contabilidad/modelo-vigente.md`

**Tratamiento documental**

- `README.md`
  - Declarar nueva surface pública oficial.
  - Reemplazar ejemplos `yola-fresh-utils/domain/...` por subpaths nuevos.
  - Eliminar narrativa de `shared/interfaces`.
  - Integrar `CuentaCliente` dentro de `finanzas`.
- `src/docs/README.md`
  - Marcar `finanzas` como hogar de `cuenta-cliente`.
  - Mover criterio de verdad a rutas actuales en `src/domain/**`.
  - Reclasificar documentos históricos.
- Core docs
  - Reflejar `shared/kernel` como núcleo transversal actual.
  - Actualizar evidencias a `src/domain/*/contracts` y `entities`.
  - Cambiar RFC a estado `Aceptado` o `Implementado`.
  - Reescribir secciones de migración como ejecutadas, no propuestas.
- Docs de dominio
  - Cambiar enlaces y evidencias a rutas nuevas.
  - Ajustar lenguaje para `contracts/entities/events`.
  - En `finanzas`, absorber explícitamente `CuentaCliente`, `MovimientoCuentaCliente`, `ImputacionCuentaCliente`, `RecepcionCobroCliente`, `TransferenciaCustodiaCobro`, `ResumenCuentaCliente`.
- `src/docs/cuenta-cliente/`
  - Tratar como documentación a remover o migrar a `src/docs/finanzas/`.
  - Decisión del plan: mover contenido útil a `finanzas/` y luego eliminar carpeta `cuenta-cliente/` para evitar dualidad conceptual.

**Resultado esperado**

- La documentación oficial ya no apunta a rutas inexistentes ni separa `cuenta-cliente` fuera de `finanzas`.

### 5. Clasificar documentos históricos fuera de `src/docs/`

**Archivos candidatos**

- `README-LIBRARY.md`
- `GUIA-IMPLEMENTACION-USUARIOS.md`
- `SISTEMA-USUARIOS.md`
- `SISTEMA-USUARIOS-CLASES.md`
- `example.js`

**Qué hacer**

- Evaluar si deben quedar:
  - eliminados por obsoletos, o
  - marcados como históricos/no oficiales.
- Prioridad secundaria: ejecutar esta limpieza solo si no bloquea build, exports o docs oficiales.

**Resultado esperado**

- Menor ruido alrededor de surface pública real del paquete.

### 6. Validación técnica final

**Herramientas**

- `pnpm run generate-exports` si script sigue existiendo
- `pnpm run build`
- `GetDiagnostics` sobre archivos editados
- búsquedas finales con `Grep`

**Validaciones**

- Sin errores TypeScript en archivos tocados.
- Sin imports a rutas eliminadas.
- Sin referencias documentales oficiales a `shared/interfaces`, `domain/usuarios` ni rutas antiguas de entidades movidas.
- `package.json` y README muestran misma surface pública.

## Orden de ejecución recomendado

1. Corregir `src/index.ts`, imports e inconsistencias fuente.
2. Reescribir `package.json`, `tsconfig.json` y scripts de build/publicación.
3. Borrar artefactos legacy de publicación (`domain/` raíz y script de stubs si aplica).
4. Actualizar README y toda documentación oficial.
5. Ejecutar validación final de build y diagnósticos.

## Supuestos y criterios de aceptación

### Supuestos

- No hay necesidad de conservar imports legacy ni wrappers de transición.
- Los barrels ya creados por dominio son la base oficial del nuevo diseño.
- La carpeta raíz `domain/` es output legacy y puede eliminarse sin afectar source.

### Criterios de aceptación

- `src/index.ts` expone solo root mínimo nuevo.
- `package.json` publica solo `dist` y subpaths nuevos.
- `tsconfig.json` no contiene aliases muertos.
- `scripts/generate-subpath-stubs.cjs` sale del flujo o desaparece.
- `README.md` y `src/docs/` describen misma arquitectura vigente.
- `CuentaCliente` queda integrada técnica y documentalmente dentro de `finanzas`.
- RFC queda cerrado como decisión aceptada/implementada.
- Build TypeScript completa sin depender de estructura legacy.

## Verificación detallada

### Verificación de código

- Buscar en `src/**/*.ts`:
  - `shared/interfaces`
  - `domain/usuarios`
  - `domain/ventas/Venta`
  - `domain/finanzas/Recurrencia`
- Confirmar ausencia de resultados relevantes.

### Verificación de docs

- Buscar en `src/docs/**/*.md`:
  - `shared/interfaces`
  - `domain/usuarios`
  - `cuenta-cliente/README.md`
  - rutas antiguas de entidades movidas
- Confirmar que documentación oficial ya referencia solo topología nueva.

### Verificación de publicación

- Revisar `dist/` generado y confirmar exports mapeados correctamente.
- Verificar que `files` en `package.json` solo incluya `dist`.

### Verificación funcional

- Ejecutar build completo.
- Revisar diagnósticos de VS Code en archivos editados.
- Confirmar coherencia entre `README.md`, `src/index.ts` y `package.json`.
