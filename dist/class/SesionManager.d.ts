/**
 * Clase SesionManager - Maneja las sesiones de usuarios
 *
 * @description Gestiona el ciclo de vida completo de las sesiones de usuario
 * incluyendo autenticación, autorización y gestión de tokens
 */
import { Usuario } from "./Usuario";
import { LoginRespuesta } from "../interfaces/usuario";
import { SesionContexto } from "../interfaces/entidades";
/**
 * Configuración de sesiones
 */
export interface ConfiguracionSesion {
    /** Tiempo de expiración del token en minutos */
    tiempoExpiracionToken: number;
    /** Tiempo de expiración del refresh token en días */
    tiempoExpiracionRefresh: number;
    /** Tiempo máximo de inactividad en minutos */
    tiempoMaximoInactividad: number;
    /** Permitir sesiones concurrentes */
    permitirSesionesConcurrentes: boolean;
    /** Máximo número de sesiones concurrentes */
    maxSesionesConcurrentes: number;
}
/**
 * Información de token
 */
export interface TokenInfo {
    /** Token de acceso */
    token: string;
    /** Token de refresh */
    refreshToken: string;
    /** Tiempo de expiración */
    expiraEn: number;
    /** Fecha de creación */
    fechaCreacion: Date;
    /** Usuario ID */
    usuarioId: string;
}
/**
 * Clase SesionManager - Gestiona sesiones de usuario
 *
 * 🎯 Características:
 * - 🔐 Autenticación segura
 * - 🎫 Gestión de tokens JWT
 * - ⏰ Control de expiración
 * - 🚫 Bloqueo por intentos fallidos
 * - 📊 Sesiones concurrentes
 * - 🔄 Refresh tokens
 */
export declare class SesionManager {
    private configuracion;
    private sesionesActivas;
    private tokensActivos;
    private refreshTokens;
    constructor(configuracion?: Partial<ConfiguracionSesion>);
    /**
     * Crea una sesión para un usuario ya autenticado
     */
    crearSesion(usuario: Usuario, entidadId?: string): Promise<LoginRespuesta>;
    /**
     * Refresca un token expirado
     */
    refrescarToken(refreshToken: string): Promise<TokenInfo>;
    /**
     * Valida un token de acceso
     */
    validarToken(token: string): TokenInfo | null;
    /**
     * Obtiene la sesión activa de un usuario
     */
    obtenerSesion(usuarioId: string): SesionContexto | null;
    /**
     * Actualiza la actividad de una sesión
     */
    actualizarActividad(usuarioId: string): void;
    /**
     * Cambia la entidad activa en la sesión
     */
    cambiarEntidadActiva(usuarioId: string, entidadId: string, usuario: Usuario): void;
    /**
     * Cierra una sesión específica
     */
    cerrarSesion(usuarioId: string): void;
    /**
     * Cierra todas las sesiones de un usuario
     */
    cerrarTodasLasSesiones(usuarioId: string): void;
    /**
     * Obtiene todas las sesiones activas
     */
    obtenerSesionesActivas(): SesionContexto[];
    /**
     * Obtiene estadísticas de sesiones
     */
    obtenerEstadisticasSesiones(): {
        sesionesActivas: number;
        tokensActivos: number;
        refreshTokensActivos: number;
        usuariosUnicos: number;
    };
    /**
     * Genera tokens de acceso y refresh
     */
    private generarTokens;
    /**
     * Genera un token único
     */
    private generarToken;
    /**
     * Verifica si un token ha expirado
     */
    private tokenExpirado;
    /**
     * Verifica si una sesión está inactiva
     */
    private sesionInactiva;
    /**
     * Verifica el límite de sesiones concurrentes
     */
    private verificarLimiteSesiones;
    /**
     * Invalida todos los tokens de un usuario
     */
    private invalidarTokensUsuario;
    /**
     * Limpia tokens y sesiones expiradas
     */
    limpiarExpirados(): void;
    /**
     * Programa la limpieza automática de expirados
     */
    iniciarLimpiezaAutomatica(intervaloMinutos?: number): NodeJS.Timeout;
    /**
     * Actualiza la configuración del gestor de sesiones
     */
    actualizarConfiguracion(nuevaConfiguracion: Partial<ConfiguracionSesion>): void;
    /**
     * Obtiene la configuración actual
     */
    obtenerConfiguracion(): ConfiguracionSesion;
    /**
     * Obtiene el historial de sesiones de un usuario
     */
    obtenerHistorialSesiones(usuarioId: string): {
        sesionActual?: SesionContexto;
        ultimaActividad?: Date;
        sesionesActivas: number;
    };
    /**
     * Verifica si un usuario tiene sesión activa
     */
    tieneSesionActiva(usuarioId: string): boolean;
}
