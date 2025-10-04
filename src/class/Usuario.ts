/**
 * Clase Usuario - Maneja toda la lógica de un usuario del sistema
 * 
 * @description Implementa la lógica de negocio para usuarios, roles y entidades
 * Siguiendo el patrón establecido en ShoppingCart y Venta
 */

import { 
  IUsuario, 
  CrearUsuario, 
  ConfiguracionUsuario,
} from "@/interfaces/usuario";

import { 
  Entidad, 
  Rol, 
  Permisos, 
  RolesPredefinidos,
  SesionContexto 
} from "@/interfaces/entidades";

import { Cliente, Personal, Proveedor } from "@/interfaces/persons";

/**
 * Clase Usuario - Maneja la lógica completa del usuario
 * 
 * 🎯 Características:
 * - 🔐 Gestión de permisos y roles
 * - 🏢 Manejo de entidades múltiples  
 * - 🎪 Gestión de sesiones y contexto
 * - ✅ Validaciones y seguridad
 * - 📊 Métodos de consulta optimizados
 */
export class Usuario implements IUsuario {
  // === PROPIEDADES INMUTABLES ===
  public readonly id: string;
  public readonly email: string;
  public readonly username: string;
  public readonly passwordHash: string;
  public readonly createdAt: Date;
  public readonly emailVerificado: boolean;

  // === PROPIEDADES MUTABLES ===
  private _roles: Rol[];
  private _entidades: Entidad[];
  private _activo: boolean;
  private _updatedAt: Date;
  private _fechaUltimoAcceso?: Date;
  private _intentosFallidos: number;
  private _cuentaBloqueada: boolean;
  private _fechaBloqueo?: Date;
  private _tokenVerificacion?: string;
  private _configuraciones?: ConfiguracionUsuario;
  private _sesionActual?: SesionContexto;

  // === CACHE DE PERMISOS (para optimización) ===
  private _permisosCache?: string[];
  private _cacheExpiracion?: Date;

  constructor(data: IUsuario) {
    // Validaciones básicas
    if (!data.id || !data.email || !data.username) {
      throw new Error('ID, email y username son requeridos para crear un usuario');
    }

    if (!data.roles || data.roles.length === 0) {
      throw new Error('El usuario debe tener al menos un rol asignado');
    }

    // Propiedades inmutables
    this.id = data.id;
    this.email = data.email;
    this.username = data.username;
    this.passwordHash = data.passwordHash;
    this.createdAt = new Date(data.createdAt);
    this.emailVerificado = data.emailVerificado;

    // Propiedades mutables
    this._roles = [...data.roles];
    this._entidades = [...data.entidades];
    this._activo = data.activo;
    this._updatedAt = new Date(data.updatedAt);
    this._fechaUltimoAcceso = data.fechaUltimoAcceso ? new Date(data.fechaUltimoAcceso) : undefined;
    this._intentosFallidos = data.intentosFallidos;
    this._cuentaBloqueada = data.cuentaBloqueada;
    this._fechaBloqueo = data.fechaBloqueo ? new Date(data.fechaBloqueo) : undefined;
    this._tokenVerificacion = data.tokenVerificacion;
    this._configuraciones = data.configuraciones;
    this._sesionActual = data.sesionActual;
  }

  // === GETTERS ===
  get roles(): Rol[] { return this._roles; }
  get entidades(): Entidad[] { return this._entidades; }
  get activo(): boolean { return this._activo; }
  get updatedAt(): Date { return this._updatedAt; }
  get fechaUltimoAcceso(): Date | undefined { return this._fechaUltimoAcceso; }
  get intentosFallidos(): number { return this._intentosFallidos; }
  get cuentaBloqueada(): boolean { return this._cuentaBloqueada; }
  get fechaBloqueo(): Date | undefined { return this._fechaBloqueo; }
  get tokenVerificacion(): string | undefined { return this._tokenVerificacion; }
  get configuraciones(): ConfiguracionUsuario | undefined { return this._configuraciones; }
  get sesionActual(): SesionContexto | undefined { return this._sesionActual; }

  // === MÉTODOS DE PERMISOS ===

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  puede(permiso: string): boolean {
    if (!this._activo || this._cuentaBloqueada) {
      return false;
    }

    // Los administradores tienen todos los permisos
    if (this.esAdmin()) {
      return true;
    }

    return this.obtenerPermisos().includes(permiso);
  }

  /**
   * Verifica si el usuario tiene múltiples permisos
   */
  puedeMultiple(permisos: string[], requiereTodos: boolean = true): boolean {
    if (requiereTodos) {
      return permisos.every(permiso => this.puede(permiso));
    } else {
      return permisos.some(permiso => this.puede(permiso));
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  tieneRol(nombreRol: string): boolean {
    return this._roles.some(rol => rol.activo && rol.nombre === nombreRol);
  }

  /**
   * Verifica si el usuario es administrador
   */
  esAdmin(): boolean {
    return this.tieneRol(RolesPredefinidos.ADMIN);
  }

  /**
   * Obtiene todos los permisos del usuario (con cache)
   */
  obtenerPermisos(): string[] {
    // Verificar cache
    if (this._permisosCache && this._cacheExpiracion && new Date() < this._cacheExpiracion) {
      return this._permisosCache;
    }

    // Recalcular permisos
    const permisos = new Set<string>();
    this._roles.forEach(rol => {
      if (rol.activo) {
        rol.permisos.forEach(permiso => permisos.add(permiso));
      }
    });

    // Actualizar cache (válido por 5 minutos)
    this._permisosCache = Array.from(permisos);
    this._cacheExpiracion = new Date(Date.now() + 5 * 60 * 1000);

    return this._permisosCache;
  }

  /**
   * Invalida el cache de permisos
   */
  private invalidarCachePermisos(): void {
    this._permisosCache = undefined;
    this._cacheExpiracion = undefined;
  }

  // === MÉTODOS DE ROLES ===

  /**
   * Agrega un rol al usuario
   */
  agregarRol(rol: Rol): void {
    if (this._roles.some(r => r.id === rol.id)) {
      throw new Error(`El usuario ya tiene el rol ${rol.nombre}`);
    }

    this._roles.push(rol);
    this.invalidarCachePermisos();
    this.actualizarFechaModificacion();
  }

  /**
   * Remueve un rol del usuario
   */
  removerRol(rolId: string): void {
    const index = this._roles.findIndex(r => r.id === rolId);
    if (index === -1) {
      throw new Error('El rol no está asignado al usuario');
    }

    if (this._roles.length === 1) {
      throw new Error('El usuario debe tener al menos un rol asignado');
    }

    this._roles.splice(index, 1);
    this.invalidarCachePermisos();
    this.actualizarFechaModificacion();
  }

  /**
   * Reemplaza todos los roles del usuario
   */
  asignarRoles(nuevosRoles: Rol[]): void {
    if (!nuevosRoles || nuevosRoles.length === 0) {
      throw new Error('El usuario debe tener al menos un rol asignado');
    }

    this._roles = [...nuevosRoles];
    this.invalidarCachePermisos();
    this.actualizarFechaModificacion();
  }

  // === MÉTODOS DE ENTIDADES ===

  /**
   * Obtiene el nombre para mostrar del usuario
   */
  obtenerNombreCompleto(): string {
    if (!this._entidades || this._entidades.length === 0) {
      return this.username;
    }

    // Buscar en las entidades una que tenga nombre
    for (const entidad of this._entidades) {
      if (entidad.tipoEntidad === "Cliente") {
        const cliente = entidad as Cliente;
        return cliente.nombres + (cliente.apellidos ? ` ${cliente.apellidos}` : '');
      } else if (entidad.tipoEntidad === "Personal") {
        const personal = entidad as Personal;
        return personal.nombres;
      } else if (entidad.tipoEntidad === "Proveedor") {
        const proveedor = entidad as Proveedor;
        return proveedor.nombre;
      }
    }

    return this.username;
  }

  /**
   * Verifica si puede acceder a una entidad específica
   */
  puedeAccederEntidad(entidadId: string): boolean {
    return this._entidades.some(entidad => entidad.id === entidadId && entidad.activo);
  }

  /**
   * Obtiene entidades por tipo
   */
  obtenerEntidadesPorTipo<T extends Entidad>(tipo: string): T[] {
    return this._entidades.filter(entidad => 
        entidad.activo && entidad.tipoEntidad === tipo
    ) as T[];
  }

  /**
   * Agrega una entidad al usuario
   */
  agregarEntidad(entidad: Entidad): void {
    if (this._entidades.some(e => e.id === entidad.id)) {
      throw new Error(`El usuario ya está asociado a la entidad ${entidad.id}`);
    }

    this._entidades.push(entidad);
    this.actualizarFechaModificacion();
  }

  /**
   * Remueve una entidad del usuario
   */
  removerEntidad(entidadId: string): void {
    const index = this._entidades.findIndex(e => e.id === entidadId);
    if (index === -1) {
      throw new Error('La entidad no está asociada al usuario');
    }

    this._entidades.splice(index, 1);
    this.actualizarFechaModificacion();
  }

  // === MÉTODOS DE SESIÓN ===

  /**
   * Inicia sesión del usuario
   */
  iniciarSesion(entidadActivaId?: string): SesionContexto {
    if (!this._activo || this._cuentaBloqueada) {
      throw new Error('Usuario inactivo o bloqueado');
    }

    let entidadActiva: Entidad;

    if (entidadActivaId) {
      const entidad = this._entidades.find(e => e.id === entidadActivaId);
      if (!entidad || !entidad.activo) {
        throw new Error(`Usuario no tiene acceso a la entidad ${entidadActivaId}`);
      }
      entidadActiva = entidad;
    } else {
      // Usar entidad predeterminada o la primera disponible
      const entidadPredeterminada = this._configuraciones?.entidadPredeterminada;
      if (entidadPredeterminada) {
        const entidad = this._entidades.find(e => e.id === entidadPredeterminada && e.activo);
        entidadActiva = entidad || this._entidades.find(e => e.activo)!;
      } else {
        entidadActiva = this._entidades.find(e => e.activo)!;
      }
    }

    if (!entidadActiva) {
      throw new Error('Usuario no tiene entidades activas disponibles');
    }

    this._sesionActual = {
      usuarioId: this.id,
      entidadActiva,
      rolesActivos: this._roles.filter(rol => rol.activo),
      inicioSesion: new Date(),
      ultimaActividad: new Date()
    };

    this._fechaUltimoAcceso = new Date();
    this._intentosFallidos = 0; // Resetear intentos fallidos
    this.actualizarFechaModificacion();

    return this._sesionActual;
  }

  /**
   * Actualiza la actividad de la sesión
   */
  actualizarActividad(): void {
    if (this._sesionActual) {
      this._sesionActual.ultimaActividad = new Date();
    }
  }

  /**
   * Cambia la entidad activa en la sesión
   */
  cambiarEntidadActiva(entidadId: string): void {
    if (!this._sesionActual) {
      throw new Error('No hay sesión activa');
    }

    if (!this.puedeAccederEntidad(entidadId)) {
      throw new Error(`Usuario no tiene acceso a la entidad ${entidadId}`);
    }

    const entidad = this._entidades.find(e => e.id === entidadId)!;
    this._sesionActual.entidadActiva = entidad;
    this.actualizarActividad();
  }

  /**
   * Cierra la sesión del usuario
   */
  cerrarSesion(): void {
    this._sesionActual = undefined;
  }

  // === MÉTODOS DE SEGURIDAD ===

  /**
   * Registra un intento de login fallido
   */
  registrarIntentoFallido(): void {
    this._intentosFallidos++;
    
    // Bloquear cuenta después de 5 intentos fallidos
    if (this._intentosFallidos >= 5) {
      this.bloquearCuenta(30); // Bloquear por 30 minutos
    }
    
    this.actualizarFechaModificacion();
  }

  /**
   * Bloquea la cuenta del usuario
   */
  bloquearCuenta(minutos: number = 30): void {
    this._cuentaBloqueada = true;
    this._fechaBloqueo = new Date(Date.now() + minutos * 60 * 1000);
    this.cerrarSesion(); // Cerrar sesión activa
    this.actualizarFechaModificacion();
  }

  /**
   * Desbloquea la cuenta del usuario
   */
  desbloquearCuenta(): void {
    this._cuentaBloqueada = false;
    this._fechaBloqueo = undefined;
    this._intentosFallidos = 0;
    this.actualizarFechaModificacion();
  }

  /**
   * Verifica si el bloqueo ha expirado
   */
  verificarBloqueoExpirado(): boolean {
    if (!this._cuentaBloqueada || !this._fechaBloqueo) {
      return false;
    }

    if (new Date() > this._fechaBloqueo) {
      this.desbloquearCuenta();
      return true;
    }

    return false;
  }

  /**
   * Activa o desactiva el usuario
   */
  cambiarEstadoActivo(activo: boolean): void {
    this._activo = activo;
    
    if (!activo) {
      this.cerrarSesion(); // Cerrar sesión si se desactiva
    }
    
    this.actualizarFechaModificacion();
  }

  // === MÉTODOS DE CONFIGURACIÓN ===

  /**
   * Actualiza las configuraciones del usuario
   */
  actualizarConfiguraciones(nuevasConfiguraciones: Partial<ConfiguracionUsuario>): void {
    this._configuraciones = {
      ...this._configuraciones,
      ...nuevasConfiguraciones
    } as ConfiguracionUsuario;
    
    this.actualizarFechaModificacion();
  }

  // === MÉTODOS UTILITARIOS ===

  /**
   * Actualiza la fecha de modificación
   */
  private actualizarFechaModificacion(): void {
    this._updatedAt = new Date();
  }

  /**
   * Valida que el usuario esté en estado válido para operaciones
   */
  validarEstadoOperacional(): void {
    if (!this._activo) {
      throw new Error('Usuario inactivo');
    }

    if (this._cuentaBloqueada) {
      // Verificar si el bloqueo expiró
      if (!this.verificarBloqueoExpirado()) {
        throw new Error('Cuenta bloqueada');
      }
    }
  }

  // === MÉTODOS DE SERIALIZACIÓN ===

  /**
   * Convierte a objeto plano para guardar en DB
   */
  toPouchDB(): any {
    return {
      _id: this.id,
      type: 'usuario',
      email: this.email,
      username: this.username,
      passwordHash: this.passwordHash,
      roles: this._roles,
      entidades: this._entidades,
      activo: this._activo,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      fechaUltimoAcceso: this._fechaUltimoAcceso?.toISOString(),
      intentosFallidos: this._intentosFallidos,
      cuentaBloqueada: this._cuentaBloqueada,
      fechaBloqueo: this._fechaBloqueo?.toISOString(),
      tokenVerificacion: this._tokenVerificacion,
      emailVerificado: this.emailVerificado,
      configuraciones: this._configuraciones,
      sesionActual: this._sesionActual
    };
  }

  /**
   * Convierte a JSON para APIs externas
   */
  toJSON(): IUsuario {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      passwordHash: this.passwordHash,
      roles: this._roles,
      entidades: this._entidades,
      activo: this._activo,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      fechaUltimoAcceso: this._fechaUltimoAcceso,
      intentosFallidos: this._intentosFallidos,
      cuentaBloqueada: this._cuentaBloqueada,
      fechaBloqueo: this._fechaBloqueo,
      tokenVerificacion: this._tokenVerificacion,
      emailVerificado: this.emailVerificado,
      configuraciones: this._configuraciones,
      sesionActual: this._sesionActual
    };
  }

  // === MÉTODOS ESTÁTICOS ===

  /**
   * Crea Usuario desde datos de PouchDB
   */
  static fromPouchDB(doc: any): Usuario {
    return new Usuario({
      id: doc._id,
      email: doc.email,
      username: doc.username,
      passwordHash: doc.passwordHash,
      roles: doc.roles,
      entidades: doc.entidades,
      activo: doc.activo,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      fechaUltimoAcceso: doc.fechaUltimoAcceso ? new Date(doc.fechaUltimoAcceso) : undefined,
      intentosFallidos: doc.intentosFallidos,
      cuentaBloqueada: doc.cuentaBloqueada,
      fechaBloqueo: doc.fechaBloqueo ? new Date(doc.fechaBloqueo) : undefined,
      tokenVerificacion: doc.tokenVerificacion,
      emailVerificado: doc.emailVerificado,
      configuraciones: doc.configuraciones,
      sesionActual: doc.sesionActual
    });
  }

  /**
   * Crea Usuario desde datos de creación
   */
  static fromCrearUsuario(datos: CrearUsuario, id: string): Usuario {
    const ahora = new Date();
    
    return new Usuario({
      id,
      email: datos.email,
      username: datos.username,
      passwordHash: datos.password, // En producción, hashear aquí
      roles: [], // Se asignan después
      entidades: [], // Se asignan después
      activo: true,
      createdAt: ahora,
      updatedAt: ahora,
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
    });
  }

  /**
   * Valida estructura de datos de usuario
   */
  static validar(data: Partial<IUsuario>): { valida: boolean; errores: string[] } {
    const errores: string[] = [];
    
    if (!data.id) errores.push('ID es requerido');
    if (!data.email) errores.push('Email es requerido');
    if (!data.username) errores.push('Username es requerido');
    if (!data.passwordHash) errores.push('Password hash es requerido');
    if (!data.roles || data.roles.length === 0) errores.push('El usuario debe tener al menos un rol');
    
    // Validar formato de email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errores.push('Formato de email inválido');
    }
    
    return {
      valida: errores.length === 0,
      errores
    };
  }
}
