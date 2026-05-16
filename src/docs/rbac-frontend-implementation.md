# Implementación Frontend del Sistema de Roles y Permisos

Este documento explica cómo implementar en frontend el nuevo sistema RBAC de `yola-fresh-utils`.

El objetivo es que la UI:
- use permisos como fuente oficial de autorización
- soporte usuarios con múltiples roles
- soporte usuarios con múltiples entidades
- respete la entidad activa de sesión
- no dependa de lógica hardcodeada por nombre de rol

## 1. Principio base

En frontend:
- usar permisos para mostrar/ocultar acciones
- usar la sesión para determinar contexto operativo
- usar roles solo para vistas administrativas o configuración, no como autorización principal

Correcto:

```ts
if (puede(usuario, Permisos.PRODUCTOS_EDITAR)) {
  // mostrar botón editar
}
```

Incorrecto:

```ts
if (usuario.roles.some((rol) => rol.nombre === "admin")) {
  // lógica acoplada al rol
}
```

## 2. Contratos a importar

Desde `yola-fresh-utils`:

```ts
import {
  IUsuario,
  Entidad,
  SesionContexto,
  Permisos,
  RolesPredefinidos,
  puede,
  puedeMultiple,
  tieneRol,
  puedeAccederEntidad,
  obtenerPermisos,
  obtenerEntidadesAccesibles,
  crearSesionContexto,
} from "yola-fresh-utils";
```

Contratos base:
- `IUsuario`
- `Entidad`
- `Rol`
- `SesionContexto`
- `Permisos`
- `RolesPredefinidos`

Helpers principales:
- `puede()`
- `puedeMultiple()`
- `tieneRol()`
- `puedeAccederEntidad()`
- `obtenerPermisos()`
- `obtenerEntidadesAccesibles()`
- `crearSesionContexto()`

## 3. Estructura recomendada en frontend

Separar 3 capas:

### 3.1 Auth Store

Responsable de guardar:
- `usuario`
- `token`
- `sesion`
- `entidadActiva`

Ejemplo de shape:

```ts
type AuthState = {
  usuario: IUsuario | null;
  token: string | null;
  sesion: SesionContexto | null;
};
```

### 3.2 Permission Service

Crear una capa pequeña que envuelva los helpers de la librería:

```ts
import { IUsuario, Permisos, puede, puedeMultiple } from "yola-fresh-utils";

export function can(usuario: IUsuario | null, permiso: Permisos): boolean {
  if (!usuario) return false;
  return puede(usuario, permiso);
}

export function canAll(
  usuario: IUsuario | null,
  permisos: Permisos[],
): boolean {
  if (!usuario) return false;
  return puedeMultiple(usuario, permisos, true);
}

export function canAny(
  usuario: IUsuario | null,
  permisos: Permisos[],
): boolean {
  if (!usuario) return false;
  return puedeMultiple(usuario, permisos, false);
}
```

### 3.3 Route Guards / UI Guards

Usar guards en:
- navegación
- páginas
- botones
- menús
- tabs
- acciones contextuales

## 4. Sesión y entidad activa

El sistema es multi-entidad. Eso significa:
- un usuario puede tener varias entidades asociadas
- la sesión debe elegir una `entidadActiva`
- muchas operaciones dependen de esa entidad activa

Crear la sesión:

```ts
import { crearSesionContexto } from "yola-fresh-utils";

const sesion = crearSesionContexto(usuario, entidadIdSeleccionada);
```

Guardar en frontend:
- `sesion.usuarioId`
- `sesion.entidadActiva`
- `sesion.rolesActivos`
- `sesion.inicioSesion`
- `sesion.ultimaActividad`

## 5. Patrón recomendado para componentes

### 5.1 Botones de acción

```tsx
import { Permisos } from "yola-fresh-utils";
import { can } from "@/features/auth/permission-service";

function BotonEditarProducto({ usuario }: { usuario: IUsuario | null }) {
  if (!can(usuario, Permisos.PRODUCTOS_EDITAR)) return null;

  return <button>Editar producto</button>;
}
```

### 5.2 Menús laterales

```ts
const menu = [
  {
    label: "Ventas",
    visible: can(usuario, Permisos.VENTAS_VER),
  },
  {
    label: "Caja",
    visible: canAny(usuario, [
      Permisos.CAJA_ABRIR,
      Permisos.CAJA_CERRAR,
      Permisos.CAJA_MOVIMIENTOS,
    ]),
  },
  {
    label: "Compras",
    visible: canAny(usuario, [
      Permisos.COMPRAS_CREAR,
      Permisos.COMPRAS_APROBAR,
    ]),
  },
];
```

### 5.3 Rutas protegidas

```tsx
function ProtectedRoute({
  usuario,
  permiso,
  children,
}: {
  usuario: IUsuario | null;
  permiso: Permisos;
  children: React.ReactNode;
}) {
  if (!usuario) return <div>No autenticado</div>;
  if (!can(usuario, permiso)) return <div>Sin permisos</div>;
  return <>{children}</>;
}
```

## 6. Reglas de UX recomendadas

### 6.1 Ocultar vs deshabilitar

- ocultar cuando el usuario nunca debería ver esa acción
- deshabilitar cuando sí puede verla pero el contexto actual no lo permite

Ejemplo:
- `Permisos.PRODUCTOS_EDITAR` permite ver botón editar
- pero si el producto está bloqueado por negocio, mostrar deshabilitado

### 6.2 Nunca confiar solo en frontend

Frontend:
- mejora UX
- evita mostrar acciones inútiles

Backend:
- valida permisos siempre

## 7. Catálogo de permisos que el frontend debe conocer

### 7.1 Ventas

- `Permisos.VENTAS_CREAR`
- `Permisos.VENTAS_VER`
- `Permisos.VENTAS_EDITAR`
- `Permisos.VENTAS_ANULAR`
- `Permisos.VENTAS_REPORTES`

### 7.2 Caja

- `Permisos.CAJA_ABRIR`
- `Permisos.CAJA_CERRAR`
- `Permisos.CAJA_ARQUEO`
- `Permisos.CAJA_MOVIMIENTOS`

### 7.3 Productos

- `Permisos.PRODUCTOS_CREAR`
- `Permisos.PRODUCTOS_VER`
- `Permisos.PRODUCTOS_EDITAR`
- `Permisos.PRODUCTOS_DESACTIVAR`
- `Permisos.PRODUCTOS_STOCK`

### 7.4 Inventario

- `Permisos.INVENTARIO_VER`
- `Permisos.INVENTARIO_AJUSTAR`
- `Permisos.INVENTARIO_CONTEO`
- `Permisos.INVENTARIO_TRANSFERIR`

### 7.5 Clientes / Personal / Proveedores

- `Permisos.CLIENTES_CREAR`
- `Permisos.CLIENTES_VER`
- `Permisos.CLIENTES_EDITAR`
- `Permisos.PERSONAL_CREAR`
- `Permisos.PERSONAL_VER`
- `Permisos.PERSONAL_EDITAR`
- `Permisos.PROVEEDORES_CREAR`
- `Permisos.PROVEEDORES_VER`
- `Permisos.PROVEEDORES_EDITAR`

### 7.6 Compras / Finanzas / Sistema / Perfil

- `Permisos.COMPRAS_CREAR`
- `Permisos.COMPRAS_APROBAR`
- `Permisos.COMPRAS_ANULAR`
- `Permisos.FINANZAS_VER`
- `Permisos.FINANZAS_CREAR`
- `Permisos.FINANZAS_EDITAR`
- `Permisos.FINANZAS_REPORTES`
- `Permisos.SISTEMA_ADMIN`
- `Permisos.SISTEMA_CONFIGURACION`
- `Permisos.SISTEMA_USUARIOS`
- `Permisos.SISTEMA_ROLES`
- `Permisos.PERFIL_VER`
- `Permisos.PERFIL_EDITAR`

## 8. Roles predefinidos

Los roles predefinidos sirven como:
- seeds iniciales
- referencia operativa
- ayuda de configuración

No deben convertirse en lógica rígida de frontend.

Disponibles:
- `RolesPredefinidos.ADMIN`
- `RolesPredefinidos.CAJERO`
- `RolesPredefinidos.VENDEDOR`
- `RolesPredefinidos.SUPERVISOR`
- `RolesPredefinidos.CONTADOR`

Uso válido:

```ts
if (tieneRol(usuario, RolesPredefinidos.CONTADOR)) {
  // mostrar acceso a panel especializado
}
```

Uso no recomendado:
- basar autorización completa solo en `tieneRol(...)`

## 9. Multi-entidad en UI

Cuando el usuario tiene más de una entidad:
- mostrar selector de entidad activa
- regenerar `SesionContexto` al cambiar la entidad
- invalidar vistas dependientes del contexto

Ejemplo:

```ts
import { crearSesionContexto } from "yola-fresh-utils";

function cambiarEntidadActiva(usuario: IUsuario, entidadId: string) {
  return crearSesionContexto(usuario, entidadId);
}
```

Validación útil:

```ts
if (!puedeAccederEntidad(usuario, entidadId)) {
  throw new Error("Usuario sin acceso a la entidad");
}
```

## 10. Recomendación de hooks

Frontend puede crear estos hooks:

- `useAuth()`
- `useSesionActiva()`
- `useCan(permiso)`
- `useCanAny(permisos)`
- `useCanAll(permisos)`
- `useEntidadesAccesibles(tipo?)`

Ejemplo:

```ts
function useCan(permiso: Permisos) {
  const { usuario } = useAuth();
  return can(usuario, permiso);
}
```

## 11. Recomendación de testing frontend

Probar:
- renderizado de botones según permisos
- rutas protegidas
- cambio de entidad activa
- menús dinámicos
- casos de usuario sin permisos

Casos mínimos:
- usuario con permiso exacto
- usuario sin permiso
- admin con acceso total
- usuario multi-entidad con entidad incorrecta

## 12. Resumen operativo

Flujo recomendado:

1. autenticar usuario
2. guardar `usuario` + `sesion`
3. construir permission service
4. usar `Permisos` para UI guards
5. usar `SesionContexto.entidadActiva` como contexto operativo
6. dejar validación final al backend

## 13. Archivos fuente del dominio

- [permisos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/permisos.ts)
- [roles.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/roles.ts)
- [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts)
- [usuario.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/usuario.ts)
- [rbac.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/rbac.ts)
