/**
 * Clase SesionManager - Maneja las sesiones de usuarios
 * 
 * @description Gestiona el ciclo de vida completo de las sesiones de usuario
 * incluyendo autenticación, autorización y gestión de tokens
 */

import { Usuario } from "./Usuario";
import { 
  LoginRespuesta} from "@/interfaces/usuario";

import { SesionContexto } from "@/interfaces/entidades";

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
export class SesionManager {
  private configuracion: ConfiguracionSesion;
  private sesionesActivas: Map<string, SesionContexto> = new Map();
  private tokensActivos: Map<string, TokenInfo> = new Map();
  private refreshTokens: Map<string, TokenInfo> = new Map();

  constructor(configuracion?: Partial<ConfiguracionSesion>) {
    this.configuracion = {
      tiempoExpiracionToken: 60, // 1 hora
      tiempoExpiracionRefresh: 7 * 24 * 60, // 7 días
      tiempoMaximoInactividad: 30, // 30 minutos
      permitirSesionesConcurrentes: true,
      maxSesionesConcurrentes: 3,
      ...configuracion
    };
  }

  // === MÉTODOS DE AUTENTICACIÓN ===

  /**
   * Crea una sesión para un usuario ya autenticado
   */
  async crearSesion(
    usuario: Usuario, 
    entidadId?: string,
  ): Promise<LoginRespuesta> {
    try {
      // Validar estado del usuario
      usuario.validarEstadoOperacional();

      // Verificar límite de sesiones concurrentes
      if (!this.configuracion.permitirSesionesConcurrentes) {
        this.cerrarTodasLasSesiones(usuario.id);
      } else {
        this.verificarLimiteSesiones(usuario.id);
      }

      // Iniciar sesión en el usuario
      const sesion = usuario.iniciarSesion(entidadId);
      
      // Generar tokens
      const tokenInfo = this.generarTokens(usuario.id);
      
      // Registrar sesión activa
      this.sesionesActivas.set(usuario.id, sesion);
      
      return {
        usuario: usuario.toJSON(),
        token: tokenInfo.token,
        refreshToken: tokenInfo.refreshToken,
        sesion: sesion,
        expiraEn: tokenInfo.expiraEn
      };

    } catch (error) {
      console.error(`Error al crear sesión para usuario ${usuario.id}:`, error);
      throw error;
    }
  }

  /**
   * Refresca un token expirado
   */
  async refrescarToken(refreshToken: string): Promise<TokenInfo> {
    const tokenInfo = this.refreshTokens.get(refreshToken);
    
    if (!tokenInfo) {
      throw new Error('Refresh token inválido');
    }

    if (this.tokenExpirado(tokenInfo)) {
      this.refreshTokens.delete(refreshToken);
      throw new Error('Refresh token expirado');
    }

    // Generar nuevo token de acceso
    const nuevoToken = this.generarTokens(tokenInfo.usuarioId);
    
    // Invalidar tokens anteriores
    this.invalidarTokensUsuario(tokenInfo.usuarioId);
    
    return nuevoToken;
  }

  /**
   * Valida un token de acceso
   */
  validarToken(token: string): TokenInfo | null {
    const tokenInfo = this.tokensActivos.get(token);
    
    if (!tokenInfo) {
      return null;
    }

    if (this.tokenExpirado(tokenInfo)) {
      this.tokensActivos.delete(token);
      return null;
    }

    return tokenInfo;
  }

  // === MÉTODOS DE SESIÓN ===

  /**
   * Obtiene la sesión activa de un usuario
   */
  obtenerSesion(usuarioId: string): SesionContexto | null {
    const sesion = this.sesionesActivas.get(usuarioId);
    
    if (!sesion) {
      return null;
    }

    // Verificar inactividad
    if (this.sesionInactiva(sesion)) {
      this.cerrarSesion(usuarioId);
      return null;
    }

    return sesion;
  }

  /**
   * Actualiza la actividad de una sesión
   */
  actualizarActividad(usuarioId: string): void {
    const sesion = this.sesionesActivas.get(usuarioId);
    
    if (sesion) {
      sesion.ultimaActividad = new Date();
    }
  }

  /**
   * Cambia la entidad activa en la sesión
   */
  cambiarEntidadActiva(usuarioId: string, entidadId: string, usuario: Usuario): void {
    const sesion = this.sesionesActivas.get(usuarioId);
    
    if (!sesion) {
      throw new Error('No hay sesión activa');
    }

    // Verificar acceso a la entidad
    if (!usuario.puedeAccederEntidad(entidadId)) {
      throw new Error('Usuario no tiene acceso a la entidad especificada');
    }

    // Cambiar entidad activa
    const entidad = usuario.entidades.find(e => e.id === entidadId);
    if (entidad) {
      sesion.entidadActiva = entidad;
      sesion.ultimaActividad = new Date();
    }
  }

  /**
   * Cierra una sesión específica
   */
  cerrarSesion(usuarioId: string): void {
    // Remover sesión activa
    this.sesionesActivas.delete(usuarioId);
    
    // Invalidar todos los tokens del usuario
    this.invalidarTokensUsuario(usuarioId);
  }

  /**
   * Cierra todas las sesiones de un usuario
   */
  cerrarTodasLasSesiones(usuarioId: string): void {
    this.cerrarSesion(usuarioId);
  }

  /**
   * Obtiene todas las sesiones activas
   */
  obtenerSesionesActivas(): SesionContexto[] {
    return Array.from(this.sesionesActivas.values());
  }

  /**
   * Obtiene estadísticas de sesiones
   */
  obtenerEstadisticasSesiones(): {
    sesionesActivas: number;
    tokensActivos: number;
    refreshTokensActivos: number;
    usuariosUnicos: number;
  } {
    const usuariosUnicos = new Set(this.sesionesActivas.keys()).size;
    
    return {
      sesionesActivas: this.sesionesActivas.size,
      tokensActivos: this.tokensActivos.size,
      refreshTokensActivos: this.refreshTokens.size,
      usuariosUnicos
    };
  }

  // === MÉTODOS PRIVADOS ===

  /**
   * Genera tokens de acceso y refresh
   */
  private generarTokens(usuarioId: string): TokenInfo {
    const ahora = new Date();
    const token = this.generarToken();
    const refreshToken = this.generarToken();
    
    const tokenInfo: TokenInfo = {
      token,
      refreshToken,
      expiraEn: this.configuracion.tiempoExpiracionToken * 60 * 1000, // En millisegundos
      fechaCreacion: ahora,
      usuarioId
    };

    // Guardar tokens
    this.tokensActivos.set(token, tokenInfo);
    this.refreshTokens.set(refreshToken, {
      ...tokenInfo,
      expiraEn: this.configuracion.tiempoExpiracionRefresh * 24 * 60 * 60 * 1000
    });

    return tokenInfo;
  }

  /**
   * Genera un token único
   */
  private generarToken(): string {
    // En producción, usar una librería como jsonwebtoken
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}_${random}`;
  }

  /**
   * Verifica si un token ha expirado
   */
  private tokenExpirado(tokenInfo: TokenInfo): boolean {
    const ahora = new Date();
    const expiracion = new Date(tokenInfo.fechaCreacion.getTime() + tokenInfo.expiraEn);
    return ahora > expiracion;
  }

  /**
   * Verifica si una sesión está inactiva
   */
  private sesionInactiva(sesion: SesionContexto): boolean {
    const ahora = new Date();
    const tiempoInactividad = ahora.getTime() - sesion.ultimaActividad.getTime();
    const limiteInactividad = this.configuracion.tiempoMaximoInactividad * 60 * 1000;
    
    return tiempoInactividad > limiteInactividad;
  }

  /**
   * Verifica el límite de sesiones concurrentes
   */
  private verificarLimiteSesiones(usuarioId: string): void {
    const sesionesUsuario = Array.from(this.sesionesActivas.values())
      .filter(sesion => sesion.usuarioId === usuarioId);
    
    if (sesionesUsuario.length >= this.configuracion.maxSesionesConcurrentes) {
      // Cerrar la sesión más antigua
      const sesionMasAntigua = sesionesUsuario
        .sort((a, b) => a.inicioSesion.getTime() - b.inicioSesion.getTime())[0];
      
      this.cerrarSesion(sesionMasAntigua.usuarioId);
    }
  }

  /**
   * Invalida todos los tokens de un usuario
   */
  private invalidarTokensUsuario(usuarioId: string): void {
    // Invalidar tokens de acceso
    for (const [token, info] of this.tokensActivos.entries()) {
      if (info.usuarioId === usuarioId) {
        this.tokensActivos.delete(token);
      }
    }

    // Invalidar refresh tokens
    for (const [refreshToken, info] of this.refreshTokens.entries()) {
      if (info.usuarioId === usuarioId) {
        this.refreshTokens.delete(refreshToken);
      }
    }
  }

  // === MÉTODOS DE LIMPIEZA ===

  /**
   * Limpia tokens y sesiones expiradas
   */
  limpiarExpirados(): void {
    // Limpiar tokens de acceso expirados
    for (const [token, info] of this.tokensActivos.entries()) {
      if (this.tokenExpirado(info)) {
        this.tokensActivos.delete(token);
      }
    }

    // Limpiar refresh tokens expirados
    for (const [refreshToken, info] of this.refreshTokens.entries()) {
      if (this.tokenExpirado(info)) {
        this.refreshTokens.delete(refreshToken);
      }
    }

    // Limpiar sesiones inactivas
    for (const [usuarioId, sesion] of this.sesionesActivas.entries()) {
      if (this.sesionInactiva(sesion)) {
        this.sesionesActivas.delete(usuarioId);
      }
    }
  }

  /**
   * Programa la limpieza automática de expirados
   */
  iniciarLimpiezaAutomatica(intervaloMinutos: number = 15): NodeJS.Timeout {
    return setInterval(() => {
      this.limpiarExpirados();
    }, intervaloMinutos * 60 * 1000);
  }

  // === MÉTODOS DE CONFIGURACIÓN ===

  /**
   * Actualiza la configuración del gestor de sesiones
   */
  actualizarConfiguracion(nuevaConfiguracion: Partial<ConfiguracionSesion>): void {
    this.configuracion = {
      ...this.configuracion,
      ...nuevaConfiguracion
    };
  }

  /**
   * Obtiene la configuración actual
   */
  obtenerConfiguracion(): ConfiguracionSesion {
    return { ...this.configuracion };
  }

  // === MÉTODOS DE AUDITORÍA ===

  /**
   * Obtiene el historial de sesiones de un usuario
   */
  obtenerHistorialSesiones(usuarioId: string): {
    sesionActual?: SesionContexto;
    ultimaActividad?: Date;
    sesionesActivas: number;
  } {
    const sesionActual = this.obtenerSesion(usuarioId);
    
    return {
      sesionActual: sesionActual || undefined,
      ultimaActividad: sesionActual?.ultimaActividad,
      sesionesActivas: sesionActual ? 1 : 0
    };
  }

  /**
   * Verifica si un usuario tiene sesión activa
   */
  tieneSesionActiva(usuarioId: string): boolean {
    return this.obtenerSesion(usuarioId) !== null;
  }
}
