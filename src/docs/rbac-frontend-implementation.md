# Recursos Expuestos de RBAC para Apps Consumidoras

Este documento describe exclusivamente qué expone `yola-fresh-utils` en el subdominio de roles, permisos y cargos.

La librería no define cómo debe programarse el frontend ni el backend. Su responsabilidad aquí es exponer contratos, catálogos, relaciones sugeridas y utilidades de negocio reutilizables.

## 1. Modelo conceptual expuesto

El subdominio RBAC se apoya en estos conceptos:

- `Cargo`: puesto o función organizacional de una persona
- `Rol`: agrupación de accesos funcionales
- `Permiso`: acción puntual autorizable con formato `recurso:accion`
- `Entidad`: actor real vinculado al usuario
- `Usuario`: cuenta digital del sistema
- `SesionContexto`: contexto operativo de un usuario autenticado

Regla conceptual:

- el cargo describe función laboral
- el rol agrupa permisos
- el permiso representa la autorización mínima

## 2. Contratos expuestos

### 2.1 `Entidad`

Fuente: [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts)

Contrato base para los actores reales del sistema:

- `id`
- `tipoEntidad`
- `createdAt`
- `updatedAt`
- `activo`

Tipos de entidad actualmente soportados:

- `"Cliente"`
- `"Personal"`
- `"Proveedor"`

### 2.2 `Rol`

Fuente: [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts)

Contrato de rol de aplicación:

- `id`
- `nombre`
- `descripcion?`
- `permisos`
- `activo`
- `createdAt`
- `updatedAt`

### 2.3 `SesionContexto`

Fuente: [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts)

Contrato que representa el contexto de sesión:

- `usuarioId`
- `entidadActiva`
- `rolesActivos`
- `inicioSesion`
- `ultimaActividad`

### 2.4 `IUsuario`

Fuente: [usuario.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/usuario.ts)

Contrato de usuario de aplicación:

- identidad digital (`id`, `email`, `username`)
- seguridad (`passwordHash`, `cuentaBloqueada`, `intentosFallidos`, `emailVerificado`)
- autorización (`roles`)
- contexto de negocio (`entidades`)
- sesión actual (`sesionActual?`)
- configuración (`configuraciones?`)

## 3. Catálogos expuestos

### 3.1 `Permisos`

Fuente: [permisos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/permisos.ts)

Catálogo oficial de permisos del sistema.

Formato oficial:

- `recurso:accion`

Características:

- minúsculas
- atómicos
- descriptivos
- sin lógica implícita por rol

Áreas cubiertas actualmente:

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

### 3.2 `RolesPredefinidos`

Fuente: [roles.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/roles.ts)

Catálogo oficial de roles predefinidos:

- `ADMIN`
- `SUPERVISOR`
- `CAJERO`
- `VENTAS`
- `OPERACIONES`
- `INVENTARIO`
- `COMPRAS`
- `FINANZAS`
- `VENDEDOR`
- `CONTADOR`
- `AUDITOR`
- `SOPORTE_TECNICO`
- `SOLO_LECTURA`

Estos roles representan:

- seeds base
- referencias funcionales
- configuraciones iniciales reutilizables

No limitan la creación de roles personalizados en proyectos consumidores.

### 3.3 `CargosPersonal`

Fuente: [persons.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts)

Catálogo organizacional de cargos:

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

## 4. Relaciones y seeds expuestos

### 4.1 `CONFIGURACIONES_ROLES`

Fuente: [rbac.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/rbac.ts)

Mapa oficial de configuración para roles predefinidos.

Cada entrada contiene:

- `nombre`
- `descripcion`
- `permisos`

Su objetivo es ofrecer una base lista para:

- sembrar roles iniciales
- inspeccionar composiciones de permisos
- reutilizar catálogos estándar

### 4.2 `CARGOS_ROLES_SUGERIDOS`

Fuente: [rbac.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/rbac.ts)

Mapa de relación sugerida entre:

- `CargosPersonal`
- `RolesPredefinidos[]`

Su objetivo es expresar una relación funcional recomendada entre cargo organizacional y roles del sistema.

Importante:

- es una sugerencia de negocio
- no sustituye la asignación real de roles
- no autoriza por sí sola

### 4.3 `PERMISOS_CRITICOS`

Fuente: [rbac.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/rbac.ts)

Lista oficial de permisos considerados sensibles o críticos.

Su objetivo es identificar acciones que normalmente requieren:

- mayor control
- auditoría
- validación reforzada
- revisión administrativa

## 5. Utilidades expuestas

Fuente: [rbac.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/rbac.ts)

La librería expone utilidades puras para trabajar con el modelo RBAC:

- `puede(usuario, permiso)`
- `tieneRol(usuario, nombreRol)`
- `puedeAccederEntidad(usuario, entidadId)`
- `obtenerPermisos(usuario)`
- `puedeMultiple(usuario, permisos, requiereTodos?)`
- `crearSesionContexto(usuario, entidadActivaId?)`
- `requierePermiso(permisoRequerido)`
- `requiereRol(rolRequerido)`
- `puedeEnEntidad(usuario, permiso, entidadId)`
- `obtenerEntidadesAccesibles(usuario, tipo?)`
- `crearRolPredefinido(tipo, id)`

Estas utilidades:

- operan sobre contratos del dominio
- no dependen de infraestructura
- no imponen un framework de UI o backend

## 6. Semántica funcional expuesta

El modelo RBAC de la librería deja definidas estas reglas funcionales:

- un usuario puede tener múltiples roles
- un usuario puede estar asociado a múltiples entidades
- la sesión puede operar sobre una entidad activa
- un rol agrupa permisos
- un permiso es la unidad mínima de autorización
- un cargo no reemplaza al rol

## 7. Alcance del catálogo actual

El catálogo actual cubre escenarios funcionales de:

- POS
- ERP
- operación comercial
- operación logística
- operación financiera
- usuarios y accesos
- auditoría
- configuración técnica y administrativa

## 8. Qué no define este subdominio

Este subdominio no define:

- persistencia
- endpoints
- autenticación técnica
- almacenamiento de tokens
- framework de frontend
- framework de backend
- estrategia de guards de UI
- estrategia HTTP o middleware

Su responsabilidad es exponer el lenguaje y las estructuras de negocio para que otras apps las consuman.

## 9. Archivos fuente oficiales

- [permisos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/permisos.ts)
- [roles.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/roles.ts)
- [persons.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts)
- [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts)
- [usuario.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/usuario.ts)
- [rbac.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/rbac.ts)
