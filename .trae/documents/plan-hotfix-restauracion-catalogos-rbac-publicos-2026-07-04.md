# Plan: Hotfix de restauración de catálogos RBAC públicos

## Resumen

Se implementará un hotfix para restaurar los catálogos RBAC públicos perdidos en `yola-fresh-utils`, manteniendo compatibilidad desde la raíz del paquete y desde el subpath `personas`.

El alcance aprobado para esta entrega es:

- restaurar `CONFIGURACIONES_ROLES`;
- restaurar `CARGOS_ROLES_SUGERIDOS`;
- restaurar `PERMISOS_CRITICOS`;
- publicarlos en `yola-fresh-utils` y `yola-fresh-utils/personas`;
- alinear la documentación RBAC para que no prometa surface inexistente;
- validar con `build` y revisión de artefactos publicados.

Queda fuera de esta entrega:

- restaurar helpers externos como `puede`, `tieneRol`, `puedeMultiple`, `obtenerPermisos`, `obtenerEntidadesAccesibles`;
- agregar pruebas automatizadas nuevas;
- cambios de infraestructura, UI, persistencia o endpoints.

## Análisis del estado actual

### Surface pública actual

- `src/index.ts` reexporta `./domain/personas/contracts`, por lo que cualquier contrato nuevo añadido en `src/domain/personas/contracts/index.ts` quedará disponible también desde la raíz del paquete.
- `src/domain/personas/index.ts` ya reexporta `./contracts` y `./entities`, por lo que los nuevos catálogos también quedarán disponibles desde `yola-fresh-utils/personas`.
- `package.json` ya declara exports para `.` y `./personas`, y la estrategia de subpaths públicos ya está resuelta mediante `exports`, `typesVersions` y stubs físicos. No se prevén cambios en `package.json` para este hotfix.

### Pérdida confirmada

- `src/domain/personas/contracts/index.ts` hoy solo reexporta:
  - `direccion.contract`
  - `entidad.contract`
  - `permisos.contract`
  - `persons.contract`
  - `roles.contract`
  - `usuario.contract`
- En `src/domain/shared/utils/index.ts` solo queda `dates`, por lo que los catálogos RBAC históricos ya no tienen ubicación pública actual.
- La pérdida fue introducida durante la gran reestructuración, y el historial git confirma que antes existían en `src/domain/shared/utils/rbac.ts`.

### Evidencia histórica relevante

- En `419edae^:src/domain/shared/utils/rbac.ts` existían:
  - `CONFIGURACIONES_ROLES`
  - `CARGOS_ROLES_SUGERIDOS`
  - `PERMISOS_CRITICOS`
- El tipo histórico observado para la configuración de rol incluía:
  - `nombre`
  - `descripcion`
  - `permisos`
- Los docs históricos siguen mencionando esos recursos como exports vigentes, en particular:
  - `src/docs/roles y cargos/rbac-implementacion-final.md`
  - `src/docs/rbac-frontend-implementation.md`
- La documentación vigente de `personas` hoy afirma lo contrario respecto a helpers externos, por lo que existe contradicción documental instalada dentro del paquete.

### Estado de validación actual

- No hay suite de tests automatizada en el repo (`package.json` mantiene `test` vacío).
- La validación realista para esta entrega será:
  - `npm run build`
  - inspección de `dist`
  - revisión de `dist/index.d.ts`, `dist/domain/personas/contracts/index.d.ts`, `dist/domain/personas/index.d.ts`
  - `npm pack --json` para confirmar empaquetado de surface y docs

## Cambios propuestos

### 1. Restaurar contrato canónico de catálogos RBAC

**Archivo a crear**

- `src/domain/personas/contracts/rbac-catalogs.contract.ts`

**Qué contendrá**

- `export type ConfiguracionRolPredefinido`
- `export const CONFIGURACIONES_ROLES`
- `export const CARGOS_ROLES_SUGERIDOS`
- `export const PERMISOS_CRITICOS`

**Cómo se definirá**

- Se tomará como base el shape histórico observado en `src/domain/shared/utils/rbac.ts`.
- Se mantendrá el tipo histórico completo:
  - `nombre: RolesPredefinidos`
  - `descripcion: string`
  - `permisos: Permisos[]`
- El archivo importará únicamente contratos canónicos vigentes:
  - `Permisos` desde `permisos.contract.ts`
  - `RolesPredefinidos` desde `roles.contract.ts`
  - `CargosPersonal` desde `persons.contract.ts`
- No se reintroducirán helpers funcionales ni dependencias de infraestructura.

**Por qué**

- Devuelve al bounded context `personas` conocimiento de dominio seed que sí era parte del contrato compartido usado por consumers.
- Evita seguir dependiendo de docs históricas o fallbacks locales en apps consumidoras.

### 2. Reexportar catálogos desde `personas/contracts`

**Archivo a modificar**

- `src/domain/personas/contracts/index.ts`

**Cambio**

- Añadir `export * from "./rbac-catalogs.contract";`

**Por qué**

- Hace que el contrato quede disponible desde:
  - `yola-fresh-utils/personas/contracts`
  - `yola-fresh-utils/personas`
  - `yola-fresh-utils`

### 3. Regenerar y consolidar surface raíz oficial

**Archivos a modificar**

- `scripts/generate-exports.ts`
- `src/index.ts`

**Cambio**

- Revisar si el generador raíz requiere comentario/descripcion adicional para reflejar que `personas/contracts` vuelve a incluir catálogos seed RBAC.
- Regenerar `src/index.ts` mediante el flujo existente para mantener consistencia con la regla “archivo generado”.

**Por qué**

- Aunque `src/index.ts` ya reexporta `./domain/personas/contracts`, el cambio debe dejar surface raíz consistente con el generador oficial del proyecto, no con edición manual divergente.

### 4. Alinear documentación RBAC y de `personas`

**Archivos a modificar**

- `src/docs/personas/README.md`
- `src/docs/personas/autorizacion-y-sesion.md`
- `src/docs/roles y cargos/rbac-implementacion-final.md`
- `src/docs/rbac-frontend-implementation.md`
- `src/docs/README.md` si hace falta añadir o ajustar referencias

**Cambios documentales**

- En `personas/README.md` y `autorizacion-y-sesion.md`:
  - declarar explícitamente que el paquete vuelve a publicar catálogos seed RBAC;
  - mantener que los helpers externos siguen fuera del core vigente;
  - aclarar separación entre:
    - vocabulario contractual (`Permisos`, `RolesPredefinidos`, `Rol`, `SesionContexto`);
    - catálogos seed (`CONFIGURACIONES_ROLES`, `CARGOS_ROLES_SUGERIDOS`, `PERMISOS_CRITICOS`);
    - helpers externos removidos.
- En docs históricas RBAC:
  - corregir la sección “recursos exportados por la librería” para no seguir prometiendo helpers externos inexistentes;
  - restaurar como vigentes solo los tres catálogos, si corresponde;
  - dejar nota clara de qué parte del documento es histórica y qué parte describe surface actual.

**Por qué**

- El paquete instala `src/docs` y hoy esa documentación empuja a imports/expectativas que runtime no satisface.
- El hotfix no queda completo si runtime y docs siguen divergentes.

### 5. Validación de artefactos publicados

**Archivos / artefactos a revisar tras build**

- `dist/index.d.ts`
- `dist/index.js`
- `dist/domain/personas/contracts/rbac-catalogs.contract.d.ts`
- `dist/domain/personas/contracts/rbac-catalogs.contract.js`
- `dist/domain/personas/contracts/index.d.ts`
- `dist/domain/personas/index.d.ts`
- stubs públicos:
  - `personas/index.d.ts`
  - `personas/index.js`
  - `personas/contracts/index.d.ts`
  - `personas/contracts/index.js`

**Qué se verificará**

- que `CONFIGURACIONES_ROLES`, `CARGOS_ROLES_SUGERIDOS` y `PERMISOS_CRITICOS` existan en tipos y runtime;
- que importen correctamente desde:
  - `yola-fresh-utils`
  - `yola-fresh-utils/personas`
- que `npm pack --json` no filtre esos contratos ni rompa empaquetado existente.

## Decisiones y supuestos cerrados

### Decisiones confirmadas con usuario

- Restaurar solo catálogos seed RBAC, no helpers externos.
- Compatibilidad requerida en:
  - raíz del paquete
  - subpath `personas`
- Validación deseada:
  - solo build y empaquetado
  - sin agregar suite de pruebas nueva
- Incluir saneo documental en la misma entrega.

### Supuestos operativos

- El contenido histórico de `rbac.ts` es base válida para restaurar los tres catálogos, siempre adaptándolo a imports canónicos actuales de `personas/contracts`.
- No se requiere tocar `package.json`, `typesVersions` ni generador de stubs públicos, porque el subpath `personas` ya existe y publica `index`.
- No se necesita restaurar `shared/utils/rbac.ts`; la ubicación canónica nueva será `personas/contracts/rbac-catalogs.contract.ts`.

### Restricciones

- No inventar contratos ajenos a evidencia histórica.
- No reintroducir lógica de autorización fuera del dominio o acoplada a framework.
- No restaurar helpers funcionales como efecto colateral.
- No abrir un refactor general de RBAC; esto es un hotfix de compatibilidad y SSOT.

## Secuencia de implementación

1. Crear `src/domain/personas/contracts/rbac-catalogs.contract.ts` usando como fuente histórica `419edae^:src/domain/shared/utils/rbac.ts`.
2. Adaptar imports del catálogo a contratos vigentes en `personas/contracts`.
3. Reexportar desde `src/domain/personas/contracts/index.ts`.
4. Regenerar `src/index.ts` mediante `scripts/generate-exports.ts` para respetar surface raíz generada.
5. Actualizar documentación vigente e histórica RBAC para reflejar:
   - catálogos restaurados;
   - helpers externos aún removidos.
6. Ejecutar `npm run build`.
7. Revisar `dist` y surface publicada en `dist/index.d.ts` y `dist/domain/personas/contracts/index.d.ts`.
8. Ejecutar `npm pack --json`.
9. Verificar que tarball final incluya contratos restaurados y docs alineadas.

## Verificación

### Verificación funcional mínima

- El siguiente import debe resolver en tipos y runtime:

```ts
import {
  CONFIGURACIONES_ROLES,
  CARGOS_ROLES_SUGERIDOS,
  PERMISOS_CRITICOS,
} from "yola-fresh-utils";
```

- El siguiente import también debe resolver:

```ts
import {
  CONFIGURACIONES_ROLES,
  CARGOS_ROLES_SUGERIDOS,
  PERMISOS_CRITICOS,
} from "yola-fresh-utils/personas";
```

### Verificación estructural

- `CONFIGURACIONES_ROLES` debe tiparse como `Record<RolesPredefinidos, ConfiguracionRolPredefinido>`.
- `CARGOS_ROLES_SUGERIDOS` debe tiparse como `Record<CargosPersonal, RolesPredefinidos[]>`.
- `PERMISOS_CRITICOS` debe tiparse como `Permisos[]`.

### Verificación documental

- Ninguna doc vigente debe seguir afirmando que runtime actual publica helpers externos removidos.
- Las docs históricas deben señalar explícitamente cuando describen etapa previa del paquete.

## Riesgos observados

- El catálogo histórico usa permisos que deben seguir existiendo en `Permisos`; durante la implementación habrá que validar que ninguna clave histórica haya sido eliminada o renombrada.
- Si `generate-exports.ts` se omite y se edita solo `src/index.ts`, se corre riesgo de drift con el generador.
- Si se alinean mal las docs, el paquete seguirá instalando una narrativa contradictoria aunque el runtime quede reparado.

## Resultado esperado

Al terminar, `yola-fresh-utils` vuelve a publicar catálogos seed RBAC oficiales para consumers, sin resucitar helpers externos, y la documentación instalada deja de contradecir la surface pública real.
