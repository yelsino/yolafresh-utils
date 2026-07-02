# Autorizacion y Sesion

## Propósito

Este documento explica el modelo vigente de autorización y sesión observado en `yolafresh-utils`.

La evidencia principal vive en:

- [entidad.contract.ts](../../domain/personas/contracts/entidad.contract.ts)
- [usuario.contract.ts](../../domain/personas/contracts/usuario.contract.ts)
- [roles.contract.ts](../../domain/personas/contracts/roles.contract.ts)
- [permisos.contract.ts](../../domain/personas/contracts/permisos.contract.ts)
- [Usuario.ts](../../domain/personas/entities/Usuario.ts)

## Modelo conceptual

La autorización observada sigue este eje:

`Usuario -> Rol -> Permisos`

El actor real del negocio se modela aparte como `Entidad`.

## Conceptos principales

### `Rol`

Representa agrupación de permisos.

Responsabilidades observadas:

- identificar un rol;
- declarar permisos otorgados;
- conservar estado activo e historial básico.

### `Permisos`

Representa catálogo atómico de autorizaciones.

Reglas observadas en el contrato:

- formato `recurso:accion`;
- minúsculas;
- granularidad atómica;
- sin lógica implícita por rol.

### `RolesPredefinidos`

Representa catálogo base de seeds de autorización.

Lectura correcta:

- son referencias iniciales;
- no impiden crear roles propios en consumers;
- no sustituyen la validación por permiso.

### `SesionContexto`

Representa contexto operativo de un usuario autenticado.

Responsabilidades observadas:

- identificar usuario;
- declarar entidad activa;
- conservar roles activos;
- registrar inicio y última actividad.

## Áreas funcionales cubiertas por permisos

El catálogo actual cubre, entre otras áreas:

- dashboard;
- punto de venta;
- ventas;
- caja;
- cuentas;
- productos;
- inventario;
- compras;
- finanzas;
- usuarios;
- roles;
- reportes;
- pagos;
- configuración;
- auditoría;
- perfil.

## Reglas de negocio respaldadas por evidencia

- autorización se resuelve por permisos, no por cargo laboral;
- un usuario puede tener múltiples roles;
- un usuario puede estar asociado a múltiples entidades;
- la sesión puede operar sobre una entidad activa;
- un usuario administrador obtiene acceso total en el comportamiento observado de `Usuario`;
- el estado operacional del usuario exige activo, no bloqueado y email verificado.

## Separaciones obligatorias

### Cargo != Rol

- `cargo` describe función organizacional;
- `rol` describe acceso dentro del sistema.

### Entidad != Usuario

- `Entidad` representa actor real;
- `IUsuario` representa cuenta digital.

### Sesión != Identidad permanente

- `SesionContexto` modela contexto operativo;
- no reemplaza la identidad maestra del usuario ni de la entidad.

## Restricciones observadas

- el paquete actual no publica helpers RBAC externos como fuente oficial del core;
- la librería no define autenticación HTTP, tokens, middleware ni persistencia de sesión;
- los permisos deprecados deben tratarse como compatibilidad, no como vocabulario recomendado.

## Decisiones vigentes observables

- el paquete no publica helpers externos de autorización; el vocabulario canónico vive en `Usuario`, `Rol`, `Permisos` y `SesionContexto`;
- `IUsuario` separa `activo` de `emailVerificado`, por lo que ambos estados conviven sin equivalencia automática;
- `RolesPredefinidos` publica seeds oficiales iniciales sin impedir roles personalizados en consumers.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [../core/contratos-compartidos.md](../core/contratos-compartidos.md)
