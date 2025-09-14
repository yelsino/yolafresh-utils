/**
 * Clase UsuarioManager - Gestión completa de usuarios
 *
 * @description Orquesta todas las operaciones relacionadas con usuarios,
 * incluyendo creación, autenticación, gestión de roles y auditoría
 */
import { Usuario } from "./Usuario";
import { SesionManager, ConfiguracionSesion } from "./SesionManager";
import { PermisoValidator } from "./PermisoValidator";
import { CrearUsuario, ActualizarUsuario, LoginUsuario, LoginRespuesta } from "../interfaces/usuario";
import { Rol, Entidad } from "../interfaces/entidades";
/**
 * Configuración del UsuarioManager
 */
export interface ConfiguracionUsuarioManager {
    /** Configuración de sesiones */
    sesiones?: Partial<ConfiguracionSesion>;
    /** Habilitar auditoría detallada */
    auditoria: boolean;
    /** Habilitar cache de usuarios */
    cache: boolean;
    /** Tiempo de vida del cache en minutos */
    tiempoVidaCache: number;
    /** Función para hashear passwords */
    hashearPassword?: (password: string) => Promise<string>;
    /** Función para validar passwords */
    validarPassword?: (password: string, hash: string) => Promise<boolean>;
}
/**
 * Estadísticas del sistema de usuarios
 */
export interface EstadisticasUsuarios {
    /** Total de usuarios */
    totalUsuarios: number;
    /** Usuarios activos */
    usuariosActivos: number;
    /** Usuarios bloqueados */
    usuariosBloqueados: number;
    /** Sesiones activas */
    sesionesActivas: number;
    /** Distribución por roles */
    distribucionRoles: Record<string, number>;
    /** Distribución por entidades */
    distribucionEntidades: Record<string, number>;
}
/**
 * Resultado de operación
 */
export interface ResultadoOperacion<T = any> {
    /** Indica si la operación fue exitosa */
    exito: boolean;
    /** Datos resultado (si aplica) */
    datos?: T;
    /** Mensaje de error o éxito */
    mensaje?: string;
    /** Código de error */
    codigoError?: string;
    /** Detalles adicionales */
    detalles?: Record<string, any>;
}
/**
 * Clase UsuarioManager - Gestión integral de usuarios
 *
 * 🎯 Características:
 * - 👥 CRUD completo de usuarios
 * - 🔐 Autenticación y autorización
 * - 🎪 Gestión de sesiones integrada
 * - ✅ Validaciones avanzadas
 * - 📊 Estadísticas y reportes
 * - 🔄 Cache inteligente
 * - 📝 Auditoría completa
 */
export declare class UsuarioManager {
    private sesionManager;
    private permisoValidator;
    private configuracion;
    private cacheUsuarios;
    private usuarios;
    private registrosAuditoria;
    constructor(configuracion?: Partial<ConfiguracionUsuarioManager>);
    /**
     * Crea un nuevo usuario
     */
    crearUsuario(datos: CrearUsuario, roles: Rol[], entidades: Entidad[], usuarioCreador?: Usuario): Promise<ResultadoOperacion<Usuario>>;
    /**
     * Obtiene un usuario por ID
     */
    obtenerUsuario(id: string, solicitante?: Usuario): Promise<ResultadoOperacion<Usuario>>;
    /**
     * Actualiza un usuario existente
     */
    actualizarUsuario(id: string, datos: ActualizarUsuario, solicitante: Usuario): Promise<ResultadoOperacion<Usuario>>;
    /**
     * Elimina un usuario (desactivación)
     */
    eliminarUsuario(id: string, solicitante: Usuario): Promise<ResultadoOperacion<void>>;
    /**
     * Autentica un usuario
     */
    autenticar(credenciales: LoginUsuario): Promise<ResultadoOperacion<LoginRespuesta>>;
    /**
     * Cierra la sesión de un usuario
     */
    cerrarSesion(usuarioId: string): Promise<ResultadoOperacion<void>>;
    /**
     * Asigna roles a un usuario
     */
    asignarRoles(usuarioId: string, roles: Rol[], solicitante: Usuario): Promise<ResultadoOperacion<void>>;
    /**
     * Asocia entidades a un usuario
     */
    asociarEntidades(usuarioId: string, entidades: Entidad[], solicitante: Usuario): Promise<ResultadoOperacion<void>>;
    /**
     * Lista todos los usuarios con filtros
     */
    listarUsuarios(filtros: {
        activo?: boolean;
        rol?: string;
        tipoEntidad?: string;
        limite?: number;
        offset?: number;
    } | undefined, solicitante: Usuario): Promise<ResultadoOperacion<Usuario[]>>;
    /**
     * Obtiene estadísticas del sistema de usuarios
     */
    obtenerEstadisticas(solicitante: Usuario): Promise<ResultadoOperacion<EstadisticasUsuarios>>;
    private validarDatosUsuario;
    private buscarPorEmail;
    private buscarPorUsername;
    private buscarPorEmailOUsername;
    private generarIdUnico;
    private hashearPasswordDefault;
    private validarPasswordDefault;
    private obtenerDeCache;
    private guardarEnCache;
    private limpiarCache;
    private registrarAuditoria;
    /**
     * Obtiene registros de auditoría
     */
    obtenerAuditoria(filtros: {
        usuarioId?: string;
        accion?: string;
        fechaInicio?: Date;
        fechaFin?: Date;
        limite?: number;
    } | undefined, solicitante: Usuario): Promise<ResultadoOperacion<any[]>>;
    /**
     * Obtiene el gestor de sesiones
     */
    get gestorSesiones(): SesionManager;
    /**
     * Obtiene el validador de permisos
     */
    get validadorPermisos(): PermisoValidator;
}
