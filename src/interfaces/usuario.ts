import { Entidad, Rol, SesionContexto } from "./entidades";

/**
 * Interfaz para el Usuario del sistema
 * 
 * @description Representa la cuenta digital que accede al sistema
 * Un usuario puede estar vinculado a una o varias entidades y tener uno o varios roles
 * 
 * @example
 * ```typescript
 * const usuario: IUsuario = {
 *   id: "usr_001",
 *   email: "juan@tienda.com",
 *   username: "juan.cajero",
 *   passwordHash: "hash...",
 *   roles: [rolCajero],
 *   entidades: [personalJuan],
 *   activo: true,
 *   fechaCreacion: new Date(),
 *   fechaUltimoAcceso: new Date()
 * };
 * ```
 */
export interface IUsuario {
  /** Identificador único del usuario */
  id: string;
  
  /** Email del usuario (único en el sistema) */
  email: string;
  
  /** Nombre de usuario (único en el sistema) */
  username: string;
  
  /** Hash de la contraseña (nunca guardar en texto plano) */
  passwordHash: string;
  
  /** Roles asignados al usuario */
  roles: Rol[];
  
  /** Entidades asociadas al usuario (Cliente, Personal, Proveedor) */
  entidades: Entidad[];
  
  /** Indica si el usuario está activo */
  activo: boolean;
  
  /** Fecha de creación del usuario */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
  
  /** Fecha del último acceso al sistema */
  fechaUltimoAcceso?: Date;
  
  /** Número de intentos de login fallidos */
  intentosFallidos: number;
  
  /** Indica si la cuenta está bloqueada */
  cuentaBloqueada: boolean;
  
  /** Fecha hasta cuándo está bloqueada la cuenta */
  fechaBloqueo?: Date;
  
  /** Token de verificación de email */
  tokenVerificacion?: string;
  
  /** Indica si el email está verificado */
  emailVerificado: boolean;
  
  /** Configuraciones personales del usuario */
  configuraciones?: ConfiguracionUsuario;
  
  /** Contexto de sesión actual (opcional, solo cuando está logueado) */
  sesionActual?: SesionContexto;
}

/**
 * Configuraciones personales del usuario
 */
export interface ConfiguracionUsuario {
  /** Idioma preferido */
  idioma: string;
  
  /** Zona horaria */
  zonaHoraria: string;
  
  /** Tema de la interfaz */
  tema: "claro" | "oscuro" | "auto";
  
  /** Configuraciones de notificaciones */
  notificaciones: ConfiguracionNotificaciones;
  
  /** Entidad predeterminada al iniciar sesión */
  entidadPredeterminada?: string;
}

/**
 * Configuraciones de notificaciones
 */
export interface ConfiguracionNotificaciones {
  /** Notificaciones por email */
  email: boolean;
  
  /** Notificaciones push */
  push: boolean;
  
  /** Notificaciones de ventas */
  ventas: boolean;
  
  /** Notificaciones de stock bajo */
  stockBajo: boolean;
  
  /** Notificaciones de nuevos clientes */
  nuevosClientes: boolean;
}

/**
 * Datos para crear un nuevo usuario
 */
export interface CrearUsuario {
  /** Email del usuario */
  email: string;
  
  /** Nombre de usuario */
  username: string;
  
  /** Contraseña en texto plano (se hasheará) */
  password: string;
  
  /** IDs de roles a asignar */
  roleIds: string[];
  
  /** IDs de entidades a asociar */
  entidadIds: string[];
  
  /** Configuraciones iniciales (opcional) */
  configuraciones?: Partial<ConfiguracionUsuario>;
}

/**
 * Datos para actualizar un usuario existente
 */
export interface ActualizarUsuario {
  /** Email del usuario */
  email?: string;
  
  /** Nombre de usuario */
  username?: string;
  
  /** Nueva contraseña (opcional) */
  password?: string;
  
  /** IDs de roles a asignar */
  roleIds?: string[];
  
  /** IDs de entidades a asociar */
  entidadIds?: string[];
  
  /** Estado activo/inactivo */
  activo?: boolean;
  
  /** Configuraciones del usuario */
  configuraciones?: Partial<ConfiguracionUsuario>;
}

/**
 * Datos de login del usuario
 */
export interface LoginUsuario {
  /** Email o username */
  identificador: string;
  
  /** Contraseña */
  password: string;
  
  /** ID de entidad a activar (opcional, si tiene múltiples) */
  entidadId?: string;
}

/**
 * Respuesta del login exitoso
 */
export interface LoginRespuesta {
  /** Usuario autenticado */
  usuario: IUsuario;
  
  /** Token de acceso */
  token: string;
  
  /** Token de refresh */
  refreshToken: string;
  
  /** Contexto de sesión */
  sesion: SesionContexto;
  
  /** Tiempo de expiración del token */
  expiraEn: number;
}
