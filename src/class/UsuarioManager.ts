/**
 * Clase UsuarioManager - Gestión completa de usuarios
 * 
 * @description Orquesta todas las operaciones relacionadas con usuarios,
 * incluyendo creación, autenticación, gestión de roles y auditoría
 */

import { Usuario } from "./Usuario";
import { SesionManager, ConfiguracionSesion } from "./SesionManager";
import { PermisoValidator, ContextoValidacion } from "./PermisoValidator";

import { 
  Usuario as IUsuario,
  CrearUsuario,
  ActualizarUsuario,
  LoginUsuario,
  LoginRespuesta
} from "@/interfaces/usuario";

import { 
  Rol, 
  Entidad, 
  RolesPredefinidos,
  SesionContexto
} from "@/interfaces/entidades";

import { Cliente, Personal, Proveedor } from "@/interfaces/persons";

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
export class UsuarioManager {
  private sesionManager: SesionManager;
  private permisoValidator: PermisoValidator;
  private configuracion: ConfiguracionUsuarioManager;
  
  // Cache de usuarios
  private cacheUsuarios: Map<string, { usuario: Usuario; expiracion: Date }> = new Map();
  
  // Repositorio de usuarios (en producción sería una base de datos)
  private usuarios: Map<string, Usuario> = new Map();
  
  // Auditoría
  private registrosAuditoria: Array<{
    usuarioId: string;
    accion: string;
    timestamp: Date;
    detalles?: any;
  }> = [];

  constructor(configuracion?: Partial<ConfiguracionUsuarioManager>) {
    this.configuracion = {
      auditoria: true,
      cache: true,
      tiempoVidaCache: 30, // 30 minutos
      hashearPassword: this.hashearPasswordDefault,
      validarPassword: this.validarPasswordDefault,
      ...configuracion
    };

    this.sesionManager = new SesionManager(this.configuracion.sesiones);
    this.permisoValidator = new PermisoValidator();
  }

  // === OPERACIONES CRUD DE USUARIOS ===

  /**
   * Crea un nuevo usuario
   */
  async crearUsuario(
    datos: CrearUsuario,
    roles: Rol[],
    entidades: Entidad[],
    usuarioCreador?: Usuario
  ): Promise<ResultadoOperacion<Usuario>> {
    try {
      // Validar permisos del usuario creador
      if (usuarioCreador) {
        const contexto: ContextoValidacion = { usuario: usuarioCreador };
        const validacion = await this.permisoValidator.validarAccion('sistema:usuarios', contexto);
        
        if (!validacion.permitido) {
          return {
            exito: false,
            mensaje: validacion.mensaje,
            codigoError: validacion.codigoError
          };
        }
      }

      // Validar datos básicos
      const validacionDatos = this.validarDatosUsuario(datos);
      if (!validacionDatos.exito) {
        return {
          exito: false,
          mensaje: validacionDatos.mensaje,
          codigoError: validacionDatos.codigoError
        };
      }

      // Verificar unicidad de email y username
      const usuarioExistente = this.buscarPorEmailOUsername(datos.email, datos.username);
      if (usuarioExistente) {
        return {
          exito: false,
          mensaje: 'Ya existe un usuario con ese email o username',
          codigoError: 'USER_ALREADY_EXISTS'
        };
      }

      // Generar ID único
      const id = this.generarIdUnico();

      // Hashear password
      const passwordHash = await this.configuracion.hashearPassword!(datos.password);

      // Crear usuario
      const datosUsuario: IUsuario = {
        id,
        email: datos.email,
        username: datos.username,
        passwordHash,
        roles,
        entidades,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        intentosFallidos: 0,
        cuentaBloqueada: false,
        emailVerificado: false,
        configuraciones: {
          idioma: "es",
          zonaHoraria: "America/Lima",
          tema: "claro",
          notificaciones: {
            email: true,
            push: true,
            ventas: false,
            stockBajo: false,
            nuevosClientes: false
          },
          ...datos.configuraciones
        }
      };

      const usuario = new Usuario(datosUsuario);

      // Guardar usuario
      this.usuarios.set(id, usuario);

      // Invalidar cache si está habilitado
      if (this.configuracion.cache) {
        this.limpiarCache();
      }

      // Auditoría
      this.registrarAuditoria(usuarioCreador?.id || 'sistema', 'crear_usuario', {
        usuarioCreado: id,
        email: datos.email,
        username: datos.username
      });

      return {
        exito: true,
        datos: usuario,
        mensaje: 'Usuario creado exitosamente'
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al crear usuario: ${(error as Error).message}`,
        codigoError: 'CREATE_USER_ERROR'
      };
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async obtenerUsuario(id: string, solicitante?: Usuario): Promise<ResultadoOperacion<Usuario>> {
    try {
      // Verificar cache primero
      if (this.configuracion.cache) {
        const usuarioCache = this.obtenerDeCache(id);
        if (usuarioCache) {
          return {
            exito: true,
            datos: usuarioCache
          };
        }
      }

      // Buscar en repositorio
      const usuario = this.usuarios.get(id);
      if (!usuario) {
        return {
          exito: false,
          mensaje: 'Usuario no encontrado',
          codigoError: 'USER_NOT_FOUND'
        };
      }

      // Validar permisos si hay solicitante
      if (solicitante && solicitante.id !== id) {
        const contexto: ContextoValidacion = { usuario: solicitante };
        const validacion = await this.permisoValidator.validarAccion('sistema:usuarios', contexto);
        
        if (!validacion.permitido) {
          return {
            exito: false,
            mensaje: validacion.mensaje,
            codigoError: validacion.codigoError
          };
        }
      }

      // Guardar en cache
      if (this.configuracion.cache) {
        this.guardarEnCache(id, usuario);
      }

      return {
        exito: true,
        datos: usuario
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener usuario: ${(error as Error).message}`,
        codigoError: 'GET_USER_ERROR'
      };
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async actualizarUsuario(
    id: string,
    datos: ActualizarUsuario,
    solicitante: Usuario
  ): Promise<ResultadoOperacion<Usuario>> {
    try {
      // Obtener usuario actual
      const resultadoUsuario = await this.obtenerUsuario(id);
      if (!resultadoUsuario.exito || !resultadoUsuario.datos) {
        return resultadoUsuario;
      }

      const usuario = resultadoUsuario.datos;

      // Validar permisos
      const contexto: ContextoValidacion = { usuario: solicitante };
      const validacion = await this.permisoValidator.validarAccion('sistema:usuarios', contexto);
      
      if (!validacion.permitido && solicitante.id !== id) {
        return {
          exito: false,
          mensaje: validacion.mensaje,
          codigoError: validacion.codigoError
        };
      }

      // Aplicar actualizaciones
      if (datos.email && datos.email !== usuario.email) {
        const usuarioExistente = this.buscarPorEmail(datos.email);
        if (usuarioExistente && usuarioExistente.id !== id) {
          return {
            exito: false,
            mensaje: 'El email ya está en uso',
            codigoError: 'EMAIL_IN_USE'
          };
        }
      }

      if (datos.username && datos.username !== usuario.username) {
        const usuarioExistente = this.buscarPorUsername(datos.username);
        if (usuarioExistente && usuarioExistente.id !== id) {
          return {
            exito: false,
            mensaje: 'El username ya está en uso',
            codigoError: 'USERNAME_IN_USE'
          };
        }
      }

      // Crear usuario actualizado
      const datosActualizados: IUsuario = {
        ...usuario.toJSON(),
        email: datos.email || usuario.email,
        username: datos.username || usuario.username,
        passwordHash: datos.password ? await this.configuracion.hashearPassword!(datos.password) : usuario.passwordHash,
        activo: datos.activo !== undefined ? datos.activo : usuario.activo,
        fechaActualizacion: new Date(),
        configuraciones: datos.configuraciones ? {
          idioma: datos.configuraciones.idioma || usuario.configuraciones?.idioma || "es",
          zonaHoraria: datos.configuraciones.zonaHoraria || usuario.configuraciones?.zonaHoraria || "America/Lima",
          tema: datos.configuraciones.tema || usuario.configuraciones?.tema || "claro",
          notificaciones: datos.configuraciones.notificaciones || usuario.configuraciones?.notificaciones || {
            email: true,
            push: true,
            ventas: false,
            stockBajo: false,
            nuevosClientes: false
          },
          entidadPredeterminada: datos.configuraciones.entidadPredeterminada || usuario.configuraciones?.entidadPredeterminada
        } : usuario.configuraciones
      };

      const usuarioActualizado = new Usuario(datosActualizados);

      // Guardar cambios
      this.usuarios.set(id, usuarioActualizado);

      // Invalidar cache
      if (this.configuracion.cache) {
        this.cacheUsuarios.delete(id);
      }

      // Auditoría
      this.registrarAuditoria(solicitante.id, 'actualizar_usuario', {
        usuarioActualizado: id,
        cambios: datos
      });

      return {
        exito: true,
        datos: usuarioActualizado,
        mensaje: 'Usuario actualizado exitosamente'
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al actualizar usuario: ${(error as Error).message}`,
        codigoError: 'UPDATE_USER_ERROR'
      };
    }
  }

  /**
   * Elimina un usuario (desactivación)
   */
  async eliminarUsuario(id: string, solicitante: Usuario): Promise<ResultadoOperacion<void>> {
    try {
      // Validar permisos de administrador
      const contexto: ContextoValidacion = { usuario: solicitante };
      const validacion = await this.permisoValidator.validarAccion('sistema:admin', contexto);
      
      if (!validacion.permitido) {
        return {
          exito: false,
          mensaje: validacion.mensaje,
          codigoError: validacion.codigoError
        };
      }

      // No permitir auto-eliminación
      if (id === solicitante.id) {
        return {
          exito: false,
          mensaje: 'No puedes eliminarte a ti mismo',
          codigoError: 'SELF_DELETION_FORBIDDEN'
        };
      }

      // Obtener usuario
      const resultadoUsuario = await this.obtenerUsuario(id);
      if (!resultadoUsuario.exito || !resultadoUsuario.datos) {
        return {
          exito: false,
          mensaje: 'Usuario no encontrado',
          codigoError: 'USER_NOT_FOUND'
        };
      }

      const usuario = resultadoUsuario.datos;

      // Desactivar usuario en lugar de eliminarlo
      usuario.cambiarEstadoActivo(false);

      // Cerrar todas las sesiones del usuario
      this.sesionManager.cerrarTodasLasSesiones(id);

      // Auditoría
      this.registrarAuditoria(solicitante.id, 'eliminar_usuario', {
        usuarioEliminado: id
      });

      return {
        exito: true,
        mensaje: 'Usuario eliminado exitosamente'
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al eliminar usuario: ${(error as Error).message}`,
        codigoError: 'DELETE_USER_ERROR'
      };
    }
  }

  // === AUTENTICACIÓN ===

  /**
   * Autentica un usuario
   */
  async autenticar(credenciales: LoginUsuario): Promise<ResultadoOperacion<LoginRespuesta>> {
    try {
      // Buscar usuario
      const usuario = this.buscarPorEmailOUsername(credenciales.identificador, credenciales.identificador);
      if (!usuario) {
        return {
          exito: false,
          mensaje: 'Credenciales inválidas',
          codigoError: 'INVALID_CREDENTIALS'
        };
      }

      // Autenticar con SesionManager
      const respuestaLogin = await this.sesionManager.autenticar(
        credenciales,
        usuario,
        this.configuracion.validarPassword!
      );

      // Auditoría
      this.registrarAuditoria(usuario.id, 'login_exitoso', {
        entidadActiva: respuestaLogin.sesion.entidadActiva.id
      });

      return {
        exito: true,
        datos: respuestaLogin,
        mensaje: 'Autenticación exitosa'
      };

    } catch (error) {
      // Auditoría de fallo
      this.registrarAuditoria('desconocido', 'login_fallido', {
        identificador: credenciales.identificador,
        error: (error as Error).message
      });

      return {
        exito: false,
        mensaje: (error as Error).message,
        codigoError: 'AUTHENTICATION_FAILED'
      };
    }
  }

  /**
   * Cierra la sesión de un usuario
   */
  async cerrarSesion(usuarioId: string): Promise<ResultadoOperacion<void>> {
    try {
      this.sesionManager.cerrarSesion(usuarioId);

      // Auditoría
      this.registrarAuditoria(usuarioId, 'logout', {});

      return {
        exito: true,
        mensaje: 'Sesión cerrada exitosamente'
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al cerrar sesión: ${(error as Error).message}`,
        codigoError: 'LOGOUT_ERROR'
      };
    }
  }

  // === GESTIÓN DE ROLES Y ENTIDADES ===

  /**
   * Asigna roles a un usuario
   */
  async asignarRoles(
    usuarioId: string,
    roles: Rol[],
    solicitante: Usuario
  ): Promise<ResultadoOperacion<void>> {
    try {
      // Validar permisos
      const contexto: ContextoValidacion = { usuario: solicitante };
      const validacion = await this.permisoValidator.validarAccion('sistema:roles', contexto);
      
      if (!validacion.permitido) {
        return {
          exito: false,
          mensaje: validacion.mensaje,
          codigoError: validacion.codigoError
        };
      }

      // Obtener usuario
      const resultadoUsuario = await this.obtenerUsuario(usuarioId);
      if (!resultadoUsuario.exito || !resultadoUsuario.datos) {
        return {
          exito: false,
          mensaje: 'Usuario no encontrado',
          codigoError: 'USER_NOT_FOUND'
        };
      }

      const usuario = resultadoUsuario.datos;

      // Asignar roles
      usuario.asignarRoles(roles);

      // Invalidar cache
      if (this.configuracion.cache) {
        this.cacheUsuarios.delete(usuarioId);
      }

      // Auditoría
      this.registrarAuditoria(solicitante.id, 'asignar_roles', {
        usuarioId,
        roles: roles.map(r => r.nombre)
      });

      return {
        exito: true,
        mensaje: 'Roles asignados exitosamente'
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al asignar roles: ${(error as Error).message}`,
        codigoError: 'ASSIGN_ROLES_ERROR'
      };
    }
  }

  /**
   * Asocia entidades a un usuario
   */
  async asociarEntidades(
    usuarioId: string,
    entidades: Entidad[],
    solicitante: Usuario
  ): Promise<ResultadoOperacion<void>> {
    try {
      // Validar permisos
      const contexto: ContextoValidacion = { usuario: solicitante };
      const validacion = await this.permisoValidator.validarAccion('sistema:usuarios', contexto);
      
      if (!validacion.permitido) {
        return {
          exito: false,
          mensaje: validacion.mensaje,
          codigoError: validacion.codigoError
        };
      }

      // Obtener usuario
      const resultadoUsuario = await this.obtenerUsuario(usuarioId);
      if (!resultadoUsuario.exito || !resultadoUsuario.datos) {
        return {
          exito: false,
          mensaje: 'Usuario no encontrado',
          codigoError: 'USER_NOT_FOUND'
        };
      }

      const usuario = resultadoUsuario.datos;

      // Asociar entidades
      entidades.forEach(entidad => {
        if (!usuario.puedeAccederEntidad(entidad.id)) {
          usuario.agregarEntidad(entidad);
        }
      });

      // Invalidar cache
      if (this.configuracion.cache) {
        this.cacheUsuarios.delete(usuarioId);
      }

      // Auditoría
      this.registrarAuditoria(solicitante.id, 'asociar_entidades', {
        usuarioId,
        entidades: entidades.map(e => ({ id: e.id, tipo: e.tipo }))
      });

      return {
        exito: true,
        mensaje: 'Entidades asociadas exitosamente'
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al asociar entidades: ${(error as Error).message}`,
        codigoError: 'ASSOCIATE_ENTITIES_ERROR'
      };
    }
  }

  // === CONSULTAS Y ESTADÍSTICAS ===

  /**
   * Lista todos los usuarios con filtros
   */
  async listarUsuarios(
    filtros: {
      activo?: boolean;
      rol?: string;
      tipoEntidad?: string;
      limite?: number;
      offset?: number;
    } = {},
    solicitante: Usuario
  ): Promise<ResultadoOperacion<Usuario[]>> {
    try {
      // Validar permisos
      const contexto: ContextoValidacion = { usuario: solicitante };
      const validacion = await this.permisoValidator.validarAccion('sistema:usuarios', contexto);
      
      if (!validacion.permitido) {
        return {
          exito: false,
          mensaje: validacion.mensaje,
          codigoError: validacion.codigoError
        };
      }

      let usuarios = Array.from(this.usuarios.values());

      // Aplicar filtros
      if (filtros.activo !== undefined) {
        usuarios = usuarios.filter(u => u.activo === filtros.activo);
      }

      if (filtros.rol) {
        usuarios = usuarios.filter(u => u.tieneRol(filtros.rol!));
      }

      if (filtros.tipoEntidad) {
        usuarios = usuarios.filter(u => 
          u.entidades.some(e => e.tipo === filtros.tipoEntidad)
        );
      }

      // Paginación
      const offset = filtros.offset || 0;
      const limite = filtros.limite || 50;
      usuarios = usuarios.slice(offset, offset + limite);

      return {
        exito: true,
        datos: usuarios,
        detalles: {
          total: this.usuarios.size,
          offset,
          limite,
          filtrado: usuarios.length
        }
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al listar usuarios: ${(error as Error).message}`,
        codigoError: 'LIST_USERS_ERROR'
      };
    }
  }

  /**
   * Obtiene estadísticas del sistema de usuarios
   */
  async obtenerEstadisticas(solicitante: Usuario): Promise<ResultadoOperacion<EstadisticasUsuarios>> {
    try {
      // Validar permisos de administrador
      const contexto: ContextoValidacion = { usuario: solicitante };
      const validacion = await this.permisoValidator.validarAccion('sistema:admin', contexto);
      
      if (!validacion.permitido) {
        return {
          exito: false,
          mensaje: validacion.mensaje,
          codigoError: validacion.codigoError
        };
      }

      const usuarios = Array.from(this.usuarios.values());
      const estadisticasSesiones = this.sesionManager.obtenerEstadisticasSesiones();

      // Calcular estadísticas
      const estadisticas: EstadisticasUsuarios = {
        totalUsuarios: usuarios.length,
        usuariosActivos: usuarios.filter(u => u.activo).length,
        usuariosBloqueados: usuarios.filter(u => u.cuentaBloqueada).length,
        sesionesActivas: estadisticasSesiones.sesionesActivas,
        distribucionRoles: {},
        distribucionEntidades: {}
      };

      // Distribución por roles
      usuarios.forEach(usuario => {
        usuario.roles.forEach(rol => {
          estadisticas.distribucionRoles[rol.nombre] = 
            (estadisticas.distribucionRoles[rol.nombre] || 0) + 1;
        });
      });

      // Distribución por entidades
      usuarios.forEach(usuario => {
        usuario.entidades.forEach(entidad => {
          estadisticas.distribucionEntidades[entidad.tipo] = 
            (estadisticas.distribucionEntidades[entidad.tipo] || 0) + 1;
        });
      });

      return {
        exito: true,
        datos: estadisticas
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener estadísticas: ${(error as Error).message}`,
        codigoError: 'STATS_ERROR'
      };
    }
  }

  // === MÉTODOS PRIVADOS ===

  private validarDatosUsuario(datos: CrearUsuario): ResultadoOperacion<void> {
    const errores: string[] = [];

    if (!datos.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      errores.push('Email inválido');
    }

    if (!datos.username || datos.username.length < 3) {
      errores.push('Username debe tener al menos 3 caracteres');
    }

    if (!datos.password || datos.password.length < 6) {
      errores.push('Password debe tener al menos 6 caracteres');
    }

    if (errores.length > 0) {
      return {
        exito: false,
        mensaje: errores.join(', '),
        codigoError: 'INVALID_DATA'
      };
    }

    return { exito: true };
  }

  private buscarPorEmail(email: string): Usuario | undefined {
    return Array.from(this.usuarios.values()).find(u => u.email === email);
  }

  private buscarPorUsername(username: string): Usuario | undefined {
    return Array.from(this.usuarios.values()).find(u => u.username === username);
  }

  private buscarPorEmailOUsername(email: string, username: string): Usuario | undefined {
    return Array.from(this.usuarios.values()).find(u => 
      u.email === email || u.username === username
    );
  }

  private generarIdUnico(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async hashearPasswordDefault(password: string): Promise<string> {
    // En producción usar bcrypt o similar
    return `hashed_${password}`;
  }

  private async validarPasswordDefault(password: string, hash: string): Promise<boolean> {
    // En producción usar bcrypt.compare o similar
    return hash === `hashed_${password}`;
  }

  // === GESTIÓN DE CACHE ===

  private obtenerDeCache(id: string): Usuario | null {
    const entrada = this.cacheUsuarios.get(id);
    
    if (!entrada) {
      return null;
    }

    if (new Date() > entrada.expiracion) {
      this.cacheUsuarios.delete(id);
      return null;
    }

    return entrada.usuario;
  }

  private guardarEnCache(id: string, usuario: Usuario): void {
    const expiracion = new Date(Date.now() + this.configuracion.tiempoVidaCache * 60 * 1000);
    this.cacheUsuarios.set(id, { usuario, expiracion });
  }

  private limpiarCache(): void {
    this.cacheUsuarios.clear();
  }

  // === AUDITORÍA ===

  private registrarAuditoria(usuarioId: string, accion: string, detalles: any): void {
    if (!this.configuracion.auditoria) {
      return;
    }

    this.registrosAuditoria.push({
      usuarioId,
      accion,
      timestamp: new Date(),
      detalles
    });

    // Mantener solo los últimos 10000 registros
    if (this.registrosAuditoria.length > 10000) {
      this.registrosAuditoria = this.registrosAuditoria.slice(-10000);
    }
  }

  /**
   * Obtiene registros de auditoría
   */
  async obtenerAuditoria(
    filtros: {
      usuarioId?: string;
      accion?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
      limite?: number;
    } = {},
    solicitante: Usuario
  ): Promise<ResultadoOperacion<any[]>> {
    try {
      // Validar permisos de administrador
      const contexto: ContextoValidacion = { usuario: solicitante };
      const validacion = await this.permisoValidator.validarAccion('sistema:admin', contexto);
      
      if (!validacion.permitido) {
        return {
          exito: false,
          mensaje: validacion.mensaje,
          codigoError: validacion.codigoError
        };
      }

      let registros = this.registrosAuditoria;

      // Aplicar filtros
      if (filtros.usuarioId) {
        registros = registros.filter(r => r.usuarioId === filtros.usuarioId);
      }

      if (filtros.accion) {
        registros = registros.filter(r => r.accion === filtros.accion);
      }

      if (filtros.fechaInicio) {
        registros = registros.filter(r => r.timestamp >= filtros.fechaInicio!);
      }

      if (filtros.fechaFin) {
        registros = registros.filter(r => r.timestamp <= filtros.fechaFin!);
      }

      // Limitar resultados
      const limite = filtros.limite || 100;
      registros = registros.slice(-limite);

      return {
        exito: true,
        datos: registros
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al obtener auditoría: ${(error as Error).message}`,
        codigoError: 'AUDIT_ERROR'
      };
    }
  }

  // === GETTERS PÚBLICOS ===

  /**
   * Obtiene el gestor de sesiones
   */
  get gestorSesiones(): SesionManager {
    return this.sesionManager;
  }

  /**
   * Obtiene el validador de permisos
   */
  get validadorPermisos(): PermisoValidator {
    return this.permisoValidator;
  }
}
