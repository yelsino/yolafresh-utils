# Dominio de Personas (Usuarios, Entidades y RBAC)

> Documento histórico en proceso de alineación.
> Para el estado vigente del paquete, leer primero [personas/README.md](./personas/README.md), [personas/modelo-vigente.md](./personas/modelo-vigente.md) y [personas/autorizacion-y-sesion.md](./personas/autorizacion-y-sesion.md).
> Los ejemplos o recomendaciones antiguas de este archivo no deben interpretarse como surface pública vigente del paquete.
> Si este documento contradice la surface actual del paquete, prevalece la documentación modular vigente.

Este documento describe el dominio de “personas” dentro de `yola-fresh-utils`: cómo se modela la identidad digital (usuario), cómo se modela el “actor real” (entidad: cliente/personal/proveedor), y cómo se controla el acceso (roles/permisos).

La librería define contratos y utilidades/entidades de negocio. La app consumidora define persistencia, sincronización y endpoints.

## 1) Conceptos clave

### 1.1 Usuario vs Entidad

- **Usuario (`IUsuario`)**: cuenta digital (credenciales, roles, estado, sesión).
- **Entidad (`Entidad`)**: representación del actor real sobre el que se opera en el negocio.

Un usuario puede estar vinculado a una o varias entidades. Por ejemplo:
- un cajero es un usuario con una entidad `Personal`
- un cliente puede tener un usuario (app) vinculado a una entidad `Cliente`
- un proveedor puede tener un usuario (portal) vinculado a una entidad `Proveedor`

Contratos:
- [usuario.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/usuario.ts)
- [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts)
- [permisos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/permisos.ts)

### 1.2 RBAC (Roles y permisos)

El control de acceso sigue RBAC:
- **Rol (`Rol`)**: conjunto de permisos.
- **Permiso (`Permisos`)**: string con formato `recurso:acción`.
- **Sesión (`SesionContexto`)**: entidad activa + roles activos.

### 1.3 Cargo != Rol

- **Cargo**: describe qué hace la persona en la organización. Pertenece al dominio `Personal`.
- **Rol**: describe qué puede hacer dentro del sistema. Pertenece al dominio RBAC.

Ejemplos:
- cargos: `ADMINISTRADOR`, `CAJERO`, `OPERADOR_ATENCION_COMERCIAL`, `ENCARGADO_INVENTARIO`, `CONTADOR`
- roles: `admin`, `cajero`, `ventas`, `supervisor`, `contador`, `auditor`

Regla oficial:
- nunca modelar permisos desde el cargo
- siempre modelar autorización desde `Rol` + `Permisos`

Contratos:
- [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts#L39-L157)
- [permisos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/permisos.ts)

Referencia histórica:

- utilidades RBAC removidas del core actual; hoy prevalecen los contratos `roles`, `permisos`, `usuario`, `entidades` y `persons`

## 2) Contratos del dominio

### 2.1 `Entidad` (base)

`Entidad` es la base que comparten Cliente/Personal/Proveedor:
- `id`
- `tipoEntidad: "Cliente" | "Personal" | "Proveedor"`
- `activo`
- `createdAt`, `updatedAt`

Contrato: [Entidad](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts#L22-L37)

### 2.2 Cliente (`Cliente`)

Contrato: [Cliente](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L113-L155)

Campos típicos:
- Identidad/contacto: `nombres`, `apellidos?`, `dni`, `celular`, `correo`, `pseudonimo`
- Dirección (legado/rápido): `direccion`
- Crédito (alto nivel): `creditosPendientes?`, `limiteCredito?`
- Relación comercial: `categoriaCliente`, `descuentoEspecial?`
- Historial: `historialCompras`, `fechaUltimaCompra?`, `totalGastado`
- Preferencias y facturación:
  - [PreferenciasCliente](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L157-L176)
  - [InformacionFacturacion](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L178-L193)

Nota: para **cuentas por cobrar y saldos a favor**, el contrato recomendado es cuenta corriente (ver sección 4).

### 2.3 Personal (`Personal`)

Contrato: [Personal](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L21-L52)

Campos típicos:
- Identidad: `nombres`, `dni`, `celular`, `direccion`
- Organización: `cargo`, `area?`, `supervisorId?`, `fechaContratacion`
- Operación: `horarioTrabajo?` ([HorarioTrabajo](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L54-L69))
- Emergencia: `contactoEmergencia?` ([ContactoEmergencia](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L98-L110))

### 2.4 Proveedor (`Proveedor`)

Contrato: [Proveedor](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L204-L223)

Campos típicos:
- Identificación fiscal: `razonSocial`, `ruc`, `direccionFiscal?`
- Contacto: `telefonos?`, `email?`
- Relación: `estadoRelacion`, `calificacion?`, `notas?`
- Condiciones: `condicionesPagoDefault?` ([CondicionesPago](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L225-L243))

Soporte adicional:
- contactos: [ProveedorContacto](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L245-L256)
- cuentas bancarias: [ProveedorCuentaBancaria](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L258-L267)
- relación proveedor-producto: [ProveedorProducto](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts#L269-L281)

### 2.5 Usuario (`IUsuario`)

Contrato: [IUsuario](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/usuario.ts#L23-L76)

Responsabilidades típicas:
- autenticación: `username/email + passwordHash`
- autorización: `roles`
- multi-entidad: `entidades`
- estado y seguridad: `activo`, `cuentaBloqueada`, `intentosFallidos`, verificación de email
- configuración: `ConfiguracionUsuario`

Entidad de dominio (clase):
- [Usuario](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/usuarios/usuario.ts)

## 2.6) Contratos completos (personas + roles + cargos)

Los siguientes bloques son el “contrato entero” para que frontend/backend puedan tipar sin ambigüedad.

### 2.6.1 Enums de cargos y categorías

Fuente: [persons.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts)

```ts
export enum CargosPersonal {
  ADMINISTRADOR = "ADMINISTRADOR",
  SUPERVISOR = "SUPERVISOR",
  OPERADOR_ATENCION_COMERCIAL = "OPERADOR_ATENCION_COMERCIAL",
  ASISTENTE_OPERACIONES_COMERCIALES = "ASISTENTE_OPERACIONES_COMERCIALES",
  ENCARGADO_COMPRAS = "ENCARGADO_COMPRAS",
  ENCARGADO_INVENTARIO = "ENCARGADO_INVENTARIO",
  ENCARGADO_ALMACEN = "ENCARGADO_ALMACEN",
  DESPACHADOR = "DESPACHADOR",
  AUXILIAR_ADMINISTRATIVO = "AUXILIAR_ADMINISTRATIVO",
  CONTADOR = "CONTADOR",
  AUDITOR = "AUDITOR",
  SOPORTE_TECNICO = "SOPORTE_TECNICO",
  SECRETARIO = "SECRETARIO",
  ADMINISTRATIVO = "ADMINISTRATIVO",
  REPONEDOR = "REPONEDOR",
  CAJERO = "CAJERO",
  VENDEDOR = "VENDEDOR",
}

export enum CategoriaCliente {
  REGULAR = "REGULAR",
  PREMIUM = "PREMIUM",
  VIP = "VIP",
  MAYORISTA = "MAYORISTA",
  CORPORATIVO = "CORPORATIVO",
}

export enum EstadoRelacionProveedor {
  ACTIVO = "ACTIVO",
  BLOQUEADO = "BLOQUEADO",
  SUSPENDIDO = "SUSPENDIDO",
  INACTIVO = "INACTIVO",
}
```

### 2.6.2 Contratos base de entidad + roles/sesión

Fuente: [entidades.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/entidades.ts)

```ts
import { Permisos } from "./permisos";
import { RolesPredefinidos } from "./roles";

export type EntidadTipo = "Cliente" | "Personal" | "Proveedor";

export interface Entidad {
  id: string;
  tipoEntidad: EntidadTipo;
  createdAt: Date;
  updatedAt: Date;
  activo: boolean;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
  permisos: Permisos[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum RolesPredefinidos {
  ADMIN = "admin",
  SUPERVISOR = "supervisor",
  CAJERO = "cajero",
  VENTAS = "ventas",
  OPERACIONES = "operaciones",
  INVENTARIO = "inventario",
  COMPRAS = "compras",
  FINANZAS = "finanzas",
  VENDEDOR = "vendedor",
  CONTADOR = "contador",
  AUDITOR = "auditor",
  SOPORTE_TECNICO = "soporte-tecnico",
  SOLO_LECTURA = "solo-lectura",
}

export interface SesionContexto {
  usuarioId: string;
  entidadActiva: Entidad;
  rolesActivos: Rol[];
  inicioSesion: Date;
  ultimaActividad: Date;
}
```

### 2.6.3 Catálogo oficial de permisos

Fuente: [permisos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/permisos.ts)

```ts
export enum Permisos {
  DASHBOARD_VER = "dashboard:ver",
  PUNTO_VENTA_VER = "punto-venta:ver",
  PUNTO_VENTA_CREAR = "punto-venta:crear",
  VENTAS_CREAR = "ventas:crear",
  VENTAS_VER = "ventas:ver",
  VENTAS_VER_PROPIAS = "ventas:ver-propias",
  VENTAS_VER_TODAS = "ventas:ver-todas",
  VENTAS_EDITAR = "ventas:editar",
  VENTAS_ANULAR = "ventas:anular",
  VENTAS_REPORTES = "ventas:reportes",

  CAJA_VER_PROPIA = "caja:ver-propia",
  CAJA_VER_TODAS = "caja:ver-todas",
  CAJA_ABRIR = "caja:abrir",
  CAJA_CERRAR = "caja:cerrar",
  CAJA_ARQUEO = "caja:arqueo",
  CAJA_MOVIMIENTOS = "caja:movimientos",

  PRODUCTOS_CREAR = "productos:crear",
  PRODUCTOS_VER = "productos:ver",
  PRODUCTOS_EDITAR = "productos:editar",
  PRODUCTOS_EDITAR_PRECIO = "productos:editar-precio",
  PRODUCTOS_VER_COSTO = "productos:ver-costo",
  PRODUCTOS_DESACTIVAR = "productos:desactivar",
  PRODUCTOS_STOCK = "productos:stock",

  INVENTARIO_VER = "inventario:ver",
  INVENTARIO_AJUSTAR = "inventario:ajustar",
  INVENTARIO_CONTEO = "inventario:conteo",
  INVENTARIO_TRANSFERIR = "inventario:transferir",

  CUENTAS_VER = "cuentas:ver",
  CUENTAS_REGISTRAR_PAGO = "cuentas:registrar-pago",
  CLIENTES_CREAR = "clientes:crear",
  CLIENTES_VER = "clientes:ver",
  CLIENTES_EDITAR = "clientes:editar",
  CLIENTES_VER_CUENTAS = "clientes:ver-cuentas",

  PERSONAL_CREAR = "personal:crear",
  PERSONAL_VER = "personal:ver",
  PERSONAL_EDITAR = "personal:editar",
  PERSONAL_ASIGNAR_CARGO = "personal:asignar-cargo",

  PROVEEDORES_CREAR = "proveedores:crear",
  PROVEEDORES_VER = "proveedores:ver",
  PROVEEDORES_EDITAR = "proveedores:editar",

  COMPRAS_VER = "compras:ver",
  COMPRAS_CREAR = "compras:crear",
  COMPRAS_EDITAR = "compras:editar",
  COMPRAS_APROBAR = "compras:aprobar",
  COMPRAS_ANULAR = "compras:anular",

  FINANZAS_VER = "finanzas:ver",
  FINANZAS_CREAR = "finanzas:crear",
  FINANZAS_EDITAR = "finanzas:editar",
  FINANZAS_REPORTES = "finanzas:reportes",

  USUARIOS_VER = "usuarios:ver",
  USUARIOS_CREAR = "usuarios:crear",
  ROLES_VER = "roles:ver",
  ROLES_EDITAR_PERMISOS = "roles:editar-permisos",
  AUDITORIA_VER = "auditoria:ver",
  CONFIGURACION_VER = "configuracion:ver",
  NOTIFICACIONES_VER = "notificaciones:ver",

  PERFIL_VER = "perfil:ver",
  PERFIL_EDITAR = "perfil:editar",
}
```

### 2.6.4 Contrato de usuario

Fuente: [usuario.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/usuario.ts)

```ts
import { Entidad, Rol, SesionContexto } from "./entidades";

export interface IUsuario {
  id: string;
  email?: string;
  username: string;
  passwordHash: string;
  roles: Rol[];
  entidades: Entidad[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  fechaUltimoAcceso?: Date;
  intentosFallidos: number;
  cuentaBloqueada: boolean;
  fechaBloqueo?: Date;
  tokenVerificacion?: string;
  emailVerificado: boolean;
  configuraciones?: ConfiguracionUsuario;
  sesionActual?: SesionContexto;
  debeCambiarPassword?: boolean;
}

export interface ConfiguracionUsuario {
  idioma: string;
  zonaHoraria: string;
  tema: "claro" | "oscuro" | "auto";
  notificaciones: ConfiguracionNotificaciones;
  entidadPredeterminada?: string;
}

export interface ConfiguracionNotificaciones {
  email: boolean;
  push: boolean;
  ventas: boolean;
  stockBajo: boolean;
  nuevosClientes: boolean;
}
```

### 2.6.5 Contratos de personas (entidades reales)

Fuente: [persons.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/persons.ts)

```ts
import { Entidad } from "./entidades";
import { MetodoPago } from "./finanzas";
import { UnidadMedidaEnum } from "./producto";

export interface Personal extends Entidad {
  nombres: string;
  cargo: CargosPersonal;
  dni: string;
  celular: string;
  direccion: string;
  area?: string;
  salario?: number;
  fechaContratacion: Date;
  supervisorId?: string;
  horarioTrabajo?: HorarioTrabajo;
  contactoEmergencia?: ContactoEmergencia;
}

export interface HorarioTrabajo {
  horaEntrada: string;
  horaSalida: string;
  diasTrabajo: DiaSemana[];
  descansos?: Descanso[];
}

export enum DiaSemana {
  LUNES = "lunes",
  MARTES = "martes",
  MIERCOLES = "miercoles",
  JUEVES = "jueves",
  VIERNES = "viernes",
  SABADO = "sabado",
  DOMINGO = "domingo",
}

export interface Descanso {
  horaInicio: string;
  horaFin: string;
  descripcion: string;
}

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  relacion: string;
}

export interface Cliente extends Entidad {
  tipoEntidad: "Cliente";
  nombres: string;
  apellidos?: string;
  celular: string;
  correo: string;
  dni: string;
  direccion: string;
  pseudonimo: string;
  creditosPendientes?: number;
  limiteCredito?: number;
  historialCompras: string[];
  fechaUltimaCompra?: Date;
  totalGastado: number;
  descuentoEspecial?: number;
  categoriaCliente: CategoriaCliente;
  preferencias?: PreferenciasCliente;
  facturacion?: InformacionFacturacion;
}

export interface PreferenciasCliente {
  metodoPagoPreferido?: string;
  horarioPreferido?: string;
  productosFavoritos: string[];
  recibirPromociones: boolean;
  notificacionesWhatsApp: boolean;
}

export interface InformacionFacturacion {
  razonSocial?: string;
  ruc?: string;
  direccionFiscal: string;
  emailFacturacion: string;
}

export interface ValuesPersonals {
  personalId: string;
  personalName: string;
  metodoPago: MetodoPago;
  monto: number;
}

export interface Proveedor extends Entidad {
  tipoEntidad: "Proveedor";
  razonSocial: string;
  nombreComercial?: string;
  ruc: string;
  direccionFiscal?: string;
  telefonos?: string[];
  email?: string;
  estadoRelacion: EstadoRelacionProveedor;
  calificacion?: number;
  notas?: string;
  condicionesPagoDefault?: CondicionesPago;
  tiempoEntregaPromedioDias?: number;
}

export interface CondicionesPago {
  diasCredito: number;
  descuentoProntoPago?: number;
  diasDescuentoProntoPago?: number;
  montoMinimoPedido?: number;
  formaPagoPreferida: string;
}

export interface ProveedorContacto {
  id: string;
  proveedorId: string;
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  principal: boolean;
}

export interface ProveedorCuentaBancaria {
  id: string;
  proveedorId: string;
  banco: string;
  numeroCuenta: string;
  cci?: string;
  moneda: "PEN" | "USD";
  activa: boolean;
  esPrincipal?: boolean;
}

export interface ProveedorProducto {
  id: string;
  proveedorId: string;
  productoId: string;
  precioReferencia?: number;
  moneda?: "PEN" | "USD";
  unidadMedida?: UnidadMedidaEnum;
  factorConversion?: number;
  tiempoEntregaDias?: number;
  activo: boolean;
  ultimoCosto?: number;
  ultimaCompraFecha?: string;
}
```

## 3) Arquitectura oficial RBAC

### 3.1 Principios

- usar siempre permisos atómicos con formato `recurso:accion`
- evitar autorización por nombre de rol en frontend
- usar `Rol` para agrupar permisos, no para meter lógica
- considerar `cliente` y `proveedor` como entidades de negocio; sus roles predefinidos actuales se mantienen solo por compatibilidad legacy

### 3.2 Recomendaciones oficiales

Correcto:

```ts
if (puede(usuario, Permisos.VENTAS_CREAR)) {
  // autorizado
}
```

Incorrecto:

```ts
if (usuario.roles.some((rol) => rol.nombre === "admin")) {
  // lógica acoplada al rol
}
```

### 3.3 Semántica de permisos

- en ventas/compras/caja/finanzas: preferir `anular` y `reversar`
- en catálogos: preferir `desactivar` sobre `eliminar`
- el backend debe validar permisos siempre, aunque el frontend también oculte acciones

## 4) Acceso y sesión (RBAC)

Utilidades recomendadas para consumers:
- `puede(usuario, Permisos.X)` valida permiso
- `tieneRol(usuario, RolesPredefinidos.X)` valida rol
- `puedeAccederEntidad(usuario, entidadId)` valida que el usuario tenga esa entidad vinculada
- `crearSesionContexto(usuario, entidadActivaId?)` construye una `SesionContexto`

Referencia histórica: las utilidades RBAC antes publicadas ya no forman parte de la surface vigente; hoy solo permanecen los contratos del subdominio.

## 5) Personas y finanzas (cuenta corriente)

Para crédito, deuda, saldo disponible y custodia de dinero:
- `CuentaCliente` / `MovimientoCuentaCliente` / `ImputacionCuentaCliente`
- `MovimientoCuentaProveedor` / `CuentaProveedor`

Archivo: [customer-account.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/customer-account.ts)

Recomendación: tratar la cuenta cliente como ledger + snapshot reconstruible, no como un número mutable sin trazabilidad.

## 6) Direcciones (modelo polimórfico)

Además del campo `direccion: string` presente en algunos contratos, existe un modelo de direcciones polimórfico:
- `Direccion` (catálogo de direcciones)
- `DireccionRelacion` (relación dirección ↔ entidad, con rol/principal)

Archivo: [direccion.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/direccion.ts)

Notas:
- `DireccionEntidadTipo` usa valores en minúsculas (`"cliente"`, `"proveedor"`, `"usuario"`, etc.), mientras que `Entidad.tipoEntidad` usa `"Cliente" | "Personal" | "Proveedor"`. Mantén un mapeo explícito en tu app consumidora si necesitas unir ambos mundos.

## 7) Guía rápida para implementación exterior

### 6.1 Alta de usuario

Flujo típico en un consumer:
- crear entidad real (por ejemplo `Cliente`)
- crear `IUsuario` con roles y asociarlo a `entidades: [Entidad]`
- en login, construir `SesionContexto` con entidad activa

### 6.2 Multi-entidad

Si un usuario tiene múltiples entidades:
- usar `SesionContexto.entidadActiva` como “scope” para la operación (ventas, caja, etc.)
- validar acceso con `puedeAccederEntidad`

### 6.3 Auditoría y no “borrar”

En módulos críticos (finanzas/caja/cuentas):
- preferir anulación y reversas sobre eliminar datos
- mantener trazabilidad de “quién” y “cuándo”
