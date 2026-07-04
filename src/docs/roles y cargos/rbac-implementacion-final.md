# Implementación Final de RBAC

> Documento histórico de implementación.
> El paquete mantiene contratos de roles, permisos, usuarios y entidades, pero ya no publica utilidades RBAC en `shared/utils`.
> Para el estado vigente del dominio, leer primero [../personas/README.md](../personas/README.md) y [../personas/autorizacion-y-sesion.md](../personas/autorizacion-y-sesion.md).
> Las listas de helpers, seeds o matrices de este archivo pueden reflejar una etapa anterior del paquete y no deben asumirse como exports vigentes.
> Si este documento contradice el core vigente, prevalece [../core/README.md](../core/README.md).

Documento oficial de implementación del sistema de roles, permisos y cargos de `yola-fresh-utils`.

Este documento está pensado para los proyectos que consumen la librería y necesitan implementar:

- administración de usuarios
- asignación de roles
- sugerencias por cargo
- guards de frontend
- validación de backend
- matriz base de permisos por rol

La librería expone contratos y utilidades de dominio. La persistencia, endpoints, autenticación y almacenamiento de sesión pertenecen a la app consumidora.

## 1. Arquitectura oficial

### 1.1 Modelo conceptual

El sistema se apoya en 5 piezas:

- `Personal`: representa a la persona real dentro del negocio
- `Cargo`: representa su puesto laboral u organizacional
- `Usuario`: representa su cuenta de acceso a la app
- `Rol`: representa el conjunto de accesos funcionales
- `Permiso`: representa cada acción puntual autorizable

### 1.2 Regla principal

La autorización oficial se resuelve con:

`Usuario -> Roles -> Permisos`

Nunca con:

`Cargo -> Permisos`

El cargo sirve para operación organizacional, UI, RRHH y sugerencias de configuración. El permiso es la fuente real de autorización.

## 2. Contratos y catálogos disponibles

### 2.1 Contratos principales

- [permisos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/permisos.ts)
- [roles.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/roles.ts)
- [persons.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts)
- [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts)
- [usuario.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/usuario.ts)
- referencia histórica: utilidades RBAC removidas del core actual

### 2.2 Recursos exportados por la librería

La librería hoy expone:

- `Permisos`
- `RolesPredefinidos`
- `CargosPersonal`
- `Rol`
- `Entidad`
- `SesionContexto`
- `IUsuario`
- `CONFIGURACIONES_ROLES`
- `CARGOS_ROLES_SUGERIDOS`
- `PERMISOS_CRITICOS`

Los helpers externos históricos de autorización (`puede`, `tieneRol`, `puedeMultiple`, `obtenerPermisos`, etc.) ya no forman parte de la surface pública vigente del paquete.

## 3. Catálogo oficial de roles predefinidos

Los roles base disponibles son:

- `ADMIN`
- `SUPERVISOR`
- `CAJERO`
- `VENTAS`
- `OPERACIONES`
- `INVENTARIO`
- `COMPRAS`
- `FINANZAS`
- `CONTADOR`
- `AUDITOR`
- `SOPORTE_TECNICO`
- `SOLO_LECTURA`
- `VENDEDOR` como rol legacy

Regla:

- los roles predefinidos son seeds
- no limitan la creación de roles personalizados
- las apps consumidoras pueden extenderlos o combinarlos

## 4. Catálogo oficial de cargos

Los cargos disponibles hoy son:

- `ADMINISTRADOR`
- `SUPERVISOR`
- `OPERADOR_ATENCION_COMERCIAL`
- `ASISTENTE_OPERACIONES_COMERCIALES`
- `ENCARGADO_COMPRAS`
- `ENCARGADO_INVENTARIO`
- `ENCARGADO_ALMACEN`
- `DESPACHADOR`
- `AUXILIAR_ADMINISTRATIVO`
- `CONTADOR`
- `AUDITOR`
- `SOPORTE_TECNICO`
- `SECRETARIO`
- `ADMINISTRATIVO`
- `REPONEDOR`
- `CAJERO`
- `VENDEDOR`

## 5. Relación sugerida cargo -> roles

La librería expone esta relación sugerida mediante `CARGOS_ROLES_SUGERIDOS`.

| Cargo | Roles sugeridos |
|---|---|
| `ADMINISTRADOR` | `ADMIN` |
| `SUPERVISOR` | `SUPERVISOR` |
| `OPERADOR_ATENCION_COMERCIAL` | `VENTAS`, `CAJERO` |
| `ASISTENTE_OPERACIONES_COMERCIALES` | `OPERACIONES` |
| `ENCARGADO_COMPRAS` | `COMPRAS` |
| `ENCARGADO_INVENTARIO` | `INVENTARIO` |
| `ENCARGADO_ALMACEN` | `INVENTARIO`, `OPERACIONES` |
| `DESPACHADOR` | `OPERACIONES`, `VENTAS` |
| `AUXILIAR_ADMINISTRATIVO` | `FINANZAS`, `SOLO_LECTURA` |
| `CONTADOR` | `CONTADOR`, `FINANZAS` |
| `AUDITOR` | `AUDITOR` |
| `SOPORTE_TECNICO` | `SOPORTE_TECNICO` |
| `SECRETARIO` | `SOLO_LECTURA` |
| `ADMINISTRATIVO` | `FINANZAS` |
| `REPONEDOR` | `OPERACIONES` |
| `CAJERO` | `CAJERO` |
| `VENDEDOR` | `VENDEDOR` |

Importante:

- esto es sugerencia inicial
- no reemplaza la asignación real de roles
- no autoriza nada por sí mismo

## 6. Áreas funcionales del sistema

El catálogo de permisos fue organizado para cubrir estos grupos:

- `dashboard`
- `punto-venta`
- `ventas`
- `caja`
- `cuentas`
- `productos`
- `categorias`
- `inventario`
- `almacenes`
- `clientes`
- `personal`
- `proveedores`
- `compras`
- `finanzas`
- `usuarios`
- `roles`
- `reportes`
- `analisis`
- `pagos`
- `notificaciones`
- `configuracion`
- `auditoria`
- `utilidades`
- `perfil`

## 7. Matriz oficial base por rol

Esta matriz no pretende listar cada permiso individual en detalle, sino definir el alcance esperado por cada rol seed.

### 7.1 `ADMIN`

Acceso esperado:

- todos los módulos
- todos los permisos
- configuración crítica
- usuarios y roles
- auditoría completa

Uso típico:

- administración total del negocio y del sistema

### 7.2 `SUPERVISOR`

Acceso esperado:

- dashboard operativo
- ventas con supervisión
- caja y arqueo
- inventario y aprobaciones
- clientes y personal en consulta/gestión parcial
- reportes operativos

No debería tener por defecto:

- control total de configuración crítica
- administración global de permisos

### 7.3 `CAJERO`

Acceso esperado:

- punto de venta
- ventas propias
- caja propia
- apertura y cierre de caja
- arqueo propio
- cobros y cuentas básicas
- impresión de comprobantes

No debería tener por defecto:

- costos
- utilidad
- configuración
- auditoría
- usuarios y roles

### 7.4 `VENTAS`

Acceso esperado:

- punto de venta
- ventas propias
- clientes
- búsqueda de productos
- descuentos permitidos
- comprobantes

No debería tener por defecto:

- caja avanzada
- reportes financieros
- compras
- configuración

### 7.5 `OPERACIONES`

Acceso esperado:

- stock básico
- conteos
- mermas
- almacenes en consulta
- apoyo logístico y operativo

No debería tener por defecto:

- finanzas
- costos
- usuarios
- configuración

### 7.6 `INVENTARIO`

Acceso esperado:

- inventario completo
- ajustes
- transferencias
- mermas
- historial de inventario
- almacenes

No debería tener por defecto:

- finanzas
- usuarios
- configuración crítica

### 7.7 `COMPRAS`

Acceso esperado:

- compras
- proveedores
- costos de compra
- recepciones
- pagos relacionados a compras

No debería tener por defecto:

- caja operativa diaria
- usuarios
- permisos del sistema

### 7.8 `FINANZAS`

Acceso esperado:

- caja histórica
- cuentas
- pagos
- conciliación
- reportes financieros
- análisis financiero

No debería tener por defecto:

- operación del POS
- edición de catálogo comercial

### 7.9 `CONTADOR`

Acceso esperado:

- revisión contable
- ventas en modo consulta
- compras en modo consulta
- caja histórica
- cuentas
- pagos
- exportación de reportes

No debería tener por defecto:

- operación comercial diaria
- modificación de ventas POS

### 7.10 `AUDITOR`

Acceso esperado:

- auditoría
- historial
- consulta transversal
- acciones críticas en revisión

No debería tener por defecto:

- crear
- editar
- anular
- aprobar

### 7.11 `SOPORTE_TECNICO`

Acceso esperado:

- dispositivos
- impresoras
- utilidades
- configuración técnica controlada
- revisión de alertas del sistema

No debería tener por defecto:

- costos
- finanzas sensibles
- cuentas
- auditoría financiera completa

### 7.12 `SOLO_LECTURA`

Acceso esperado:

- navegación de consulta
- pantallas permitidas en solo lectura

No debería tener por defecto:

- crear
- editar
- anular
- aprobar
- cerrar
- ajustar

## 8. Permisos críticos

La librería expone `PERMISOS_CRITICOS` como catálogo base de acciones sensibles.

Incluye acciones como:

- crear/desactivar usuarios
- asignar roles
- editar permisos
- editar precio
- ver costo
- anular ventas
- abrir/cerrar cajas sensibles
- editar finanzas
- ajustar inventario
- aprobar/anular compras
- editar configuración del sistema
- editar integraciones
- exportar auditoría

Uso recomendado en apps consumidoras:

- confirmar con modal
- registrar motivo
- mostrar advertencia visual
- exigir validación backend
- auditar la acción

## 9. Implementación en frontend

### 9.1 Regla principal

Frontend debe renderizar por permisos, no por rol.

Correcto:

```ts
if (puede(usuario, Permisos.PRODUCTOS_EDITAR)) {
  // renderizar acción
}
```

Incorrecto:

```ts
if (tieneRol(usuario, RolesPredefinidos.ADMIN)) {
  // asumir acceso a todo por nombre de rol en la UI
}
```

### 9.2 Estructura recomendada

Separar:

- `auth store`
- `permission service`
- `navigation builder`
- `route guards`
- `action guards`

### 9.3 Datos mínimos de sesión

Guardar:

- `usuario`
- `sesion`
- `entidadActiva`
- `rolesActivos`
- `permisosPlano`

### 9.4 Navegación sugerida por permiso base

| Módulo | Permiso base |
|---|---|
| Dashboard | `Permisos.DASHBOARD_VER` |
| Punto de venta | `Permisos.PUNTO_VENTA_VER` |
| Ventas | `Permisos.VENTAS_VER` |
| Caja | `Permisos.CAJA_VER_PROPIA` o `Permisos.CAJA_VER_TODAS` |
| Clientes | `Permisos.CLIENTES_VER` |
| Productos | `Permisos.PRODUCTOS_VER` |
| Inventario | `Permisos.INVENTARIO_VER` |
| Almacenes | `Permisos.ALMACENES_VER` |
| Compras | `Permisos.COMPRAS_VER` |
| Finanzas | `Permisos.FINANZAS_VER` |
| Reportes | `Permisos.REPORTES_VER` |
| Usuarios | `Permisos.USUARIOS_VER` |
| Roles | `Permisos.ROLES_VER` |
| Auditoría | `Permisos.AUDITORIA_VER` |
| Configuración | `Permisos.CONFIGURACION_VER` |

### 9.5 Cargos en frontend

Frontend puede usar cargos para:

- perfil del personal
- formularios de RRHH
- filtros organizacionales
- sugerencias de roles
- onboarding administrativo

Frontend no debe usar cargos para:

- autorización
- guards de botones
- acceso a rutas

## 10. Implementación en backend

### 10.1 Regla principal

Backend siempre debe validar permisos.

Nunca confiar en:

- visibilidad de botones
- menú del frontend
- route guards del cliente

### 10.2 Patrón recomendado

Flujo sugerido:

1. autenticar usuario
2. reconstruir o recuperar `IUsuario`
3. reconstruir sesión y entidad activa si aplica
4. validar permiso requerido
5. validar reglas de negocio específicas
6. ejecutar caso de uso
7. auditar si la acción es crítica

### 10.3 Validación mínima por endpoint/caso de uso

Cada operación debería validar:

- estado del usuario
- permiso requerido
- entidad activa o acceso contextual
- regla adicional de negocio

Ejemplo conceptual:

```ts
if (!puede(usuario, Permisos.VENTAS_ANULAR)) {
  throw new Error("Acceso denegado");
}
```

### 10.4 Validación por acción crítica

Si el permiso está en `PERMISOS_CRITICOS`, además validar:

- motivo
- trazabilidad
- autorización fuerte
- no bloqueo contable o financiero
- política de anulación/reversión en lugar de borrado

### 10.5 Sesión multi-entidad

Si el usuario opera con múltiples entidades:

- backend debe conocer la entidad activa
- backend debe validar que el usuario tenga acceso a esa entidad
- backend debe impedir operaciones sobre entidades ajenas

## 11. Flujo recomendado de adopción

### Fase 1

- consumir `Permisos`, `RolesPredefinidos`, `CargosPersonal`
- usar `CONFIGURACIONES_ROLES`
- usar `CARGOS_ROLES_SUGERIDOS`

### Fase 2

- construir `permission service`
- construir menú dinámico por permisos
- proteger botones, tabs y rutas

### Fase 3

- validar permisos en backend
- auditar acciones críticas
- desacoplar totalmente la UI de nombres de rol

### Fase 4

- extender roles propios del negocio
- extender permisos personalizados si la app lo necesita
- mantener compatibilidad con el catálogo base

## 12. Ejemplos de uso

### 12.1 Sugerir roles por cargo

```ts
import { CARGOS_ROLES_SUGERIDOS, CargosPersonal } from "yola-fresh-utils";

const sugeridos = CARGOS_ROLES_SUGERIDOS[CargosPersonal.CAJERO];
```

### 12.2 Verificar permiso

```ts
import { puede, Permisos } from "yola-fresh-utils";

const puedeEditar = puede(usuario, Permisos.PRODUCTOS_EDITAR);
```

### 12.3 Crear contexto de sesión

```ts
import { crearSesionContexto } from "yola-fresh-utils";

const sesion = crearSesionContexto(usuario, entidadId);
```

## 13. Reglas finales

- el cargo no autoriza
- el rol agrupa
- el permiso decide
- el frontend sugiere y oculta
- el backend valida
- las acciones críticas se auditan
- las apps consumidoras pueden extender, pero no deben romper el modelo base

## 14. Documento complementario

Para el detalle de implementación específica del cliente UI, revisar también:

- [rbac-frontend-implementation.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/rbac-frontend-implementation.md)
