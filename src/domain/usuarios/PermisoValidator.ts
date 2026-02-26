/**
 * Clase PermisoValidator - Validaciones avanzadas de permisos
 * 
 * @description Proporciona validaciones complejas de permisos, contexto y reglas de negocio
 * para operaciones específicas del sistema de retail
 */

import { Usuario } from "./usuario";
import { IUsuario } from "@/domain/shared/interfaces/usuario";
import { 
  Permisos, 
  RolesPredefinidos, 
  Entidad 
} from "@/domain/shared/interfaces/entidades";


/**
 * Contexto de validación de permisos
 */
export interface ContextoValidacion {
  /** Usuario que realiza la acción */
  usuario: Usuario;
  
  /** Entidad sobre la cual se realiza la acción */
  entidadObjetivo?: Entidad;
  
  /** Datos adicionales para la validación */
  datosAdicionales?: Record<string, any>;
  
  /** IP del usuario (para auditoría) */
  ip?: string;
  
  /** User Agent (para auditoría) */
  userAgent?: string;
}

/**
 * Resultado de validación
 */
export interface ResultadoValidacion {
  /** Indica si la validación fue exitosa */
  permitido: boolean;
  
  /** Mensaje de error o explicación */
  mensaje?: string;
  
  /** Código de error específico */
  codigoError?: string;
  
  /** Permisos faltantes */
  permisosFaltantes?: string[];
  
  /** Sugerencias para obtener acceso */
  sugerencias?: string[];
}


/**
 * Regla de validación personalizada
 */
export interface ReglaValidacion {
  /** Nombre de la regla */
  nombre: string;
  
  /** Descripción de la regla */
  descripcion: string;
  
  /** Función de validación */
  validar: (contexto: ContextoValidacion) => Promise<ResultadoValidacion> | ResultadoValidacion;
  
  /** Prioridad de la regla (mayor número = mayor prioridad) */
  prioridad: number;
}

/**
 * Clase PermisoValidator - Validaciones avanzadas de permisos
 * 
 * 🎯 Características:
 * - 🔍 Validaciones contextuales
 * - 📋 Reglas de negocio complejas
 * - 🎯 Validaciones específicas por entidad
 * - 📊 Auditoría de accesos
 * - 🔧 Reglas personalizables
 * - ⚡ Cache de validaciones
 */
export class PermisoValidator {
  private reglasPersonalizadas: Map<string, ReglaValidacion> = new Map();
  private cacheValidaciones: Map<string, { resultado: ResultadoValidacion; expiracion: Date }> = new Map();
  private auditoria: Array<{ contexto: ContextoValidacion; resultado: ResultadoValidacion; timestamp: Date }> = [];

  constructor() {
    this.inicializarReglasBasicas();
  }

  // === VALIDACIONES PRINCIPALES ===

  /**
   * Valida si un usuario puede realizar una acción específica
   */
  async validarAccion(
    accion: string,
    contexto: ContextoValidacion
  ): Promise<ResultadoValidacion> {
    try {
      // Verificar cache
      const cacheKey = this.generarCacheKey(accion, contexto);
      const resultadoCache = this.obtenerDeCache(cacheKey);
      if (resultadoCache) {
        return resultadoCache;
      }

      // Validaciones básicas
      const validacionBasica = this.validarBasico(contexto.usuario);
      if (!validacionBasica.permitido) {
        return this.registrarYRetornar(contexto, validacionBasica);
      }

      // Validar permiso específico
      const validacionPermiso = this.validarPermiso(accion, contexto.usuario);
      if (!validacionPermiso.permitido) {
        return this.registrarYRetornar(contexto, validacionPermiso);
      }

      // Aplicar reglas personalizadas
      const validacionReglas = await this.aplicarReglasPersonalizadas(accion, contexto);
      if (!validacionReglas.permitido) {
        return this.registrarYRetornar(contexto, validacionReglas);
      }

      // Validaciones específicas por acción
      const validacionEspecifica = await this.validarAccionEspecifica(accion, contexto);
      
      // Guardar en cache
      this.guardarEnCache(cacheKey, validacionEspecifica);
      
      return this.registrarYRetornar(contexto, validacionEspecifica);

    } catch (error) {
      const resultado: ResultadoValidacion = {
        permitido: false,
        mensaje: `Error en validación: ${(error as Error).message}`,
        codigoError: 'VALIDATION_ERROR'
      };
      
      return this.registrarYRetornar(contexto, resultado);
    }
  }

  /**
   * Valida múltiples acciones a la vez
   */
  async validarMultiplesAcciones(
    acciones: string[],
    contexto: ContextoValidacion,
    requiereTodas: boolean = true
  ): Promise<ResultadoValidacion> {
    const resultados = await Promise.all(
      acciones.map(accion => this.validarAccion(accion, contexto))
    );

    if (requiereTodas) {
      const fallidosIndex = resultados.findIndex(r => !r.permitido);
      if (fallidosIndex !== -1) {
        return {
          permitido: false,
          mensaje: `Acción '${acciones[fallidosIndex]}' no permitida: ${resultados[fallidosIndex].mensaje}`,
          codigoError: 'MULTIPLE_VALIDATION_FAILED',
          permisosFaltantes: resultados.filter(r => !r.permitido).flatMap(r => r.permisosFaltantes || [])
        };
      }
    } else {
      const exitosos = resultados.filter(r => r.permitido);
      if (exitosos.length === 0) {
        return {
          permitido: false,
          mensaje: 'Ninguna de las acciones está permitida',
          codigoError: 'ALL_ACTIONS_DENIED',
          permisosFaltantes: resultados.flatMap(r => r.permisosFaltantes || [])
        };
      }
    }

    return {
      permitido: true,
      mensaje: 'Validación múltiple exitosa'
    };
  }

  // === VALIDACIONES ESPECÍFICAS POR DOMINIO ===

  /**
   * Valida operaciones de ventas
   */
  async validarOperacionVenta(
    operacion: 'crear' | 'ver' | 'editar' | 'eliminar' | 'reportes',
    contexto: ContextoValidacion
  ): Promise<ResultadoValidacion> {
    const permisoRequerido = `ventas:${operacion}`;
    
    // Validación básica de permiso
    const validacionBasica = await this.validarAccion(permisoRequerido, contexto);
    if (!validacionBasica.permitido) {
      return validacionBasica;
    }

    // Reglas específicas de ventas
    switch (operacion) {
      case 'crear':
        return this.validarCreacionVenta(contexto);
      
      case 'editar':
        return this.validarEdicionVenta(contexto);
      
      case 'eliminar':
        return this.validarEliminacionVenta(contexto);
      
      case 'reportes':
        return this.validarReportesVenta(contexto);
      
      default:
        return validacionBasica;
    }
  }

  /**
   * Valida operaciones de productos
   */
  async validarOperacionProducto(
    operacion: 'crear' | 'ver' | 'editar' | 'eliminar' | 'stock',
    contexto: ContextoValidacion
  ): Promise<ResultadoValidacion> {
    const permisoRequerido = `productos:${operacion}`;
    
    const validacionBasica = await this.validarAccion(permisoRequerido, contexto);
    if (!validacionBasica.permitido) {
      return validacionBasica;
    }

    // Reglas específicas de productos
    if (operacion === 'eliminar') {
      // Solo administradores pueden eliminar productos
      if (!contexto.usuario.esAdmin()) {
        return {
          permitido: false,
          mensaje: 'Solo los administradores pueden eliminar productos',
          codigoError: 'ADMIN_REQUIRED'
        };
      }
    }

    return validacionBasica;
  }

  /**
   * Valida operaciones financieras
   */
  async validarOperacionFinanciera(
    operacion: 'ver' | 'crear' | 'editar' | 'reportes',
    contexto: ContextoValidacion
  ): Promise<ResultadoValidacion> {
    const permisoRequerido = `finanzas:${operacion}`;
    
    const validacionBasica = await this.validarAccion(permisoRequerido, contexto);
    if (!validacionBasica.permitido) {
      return validacionBasica;
    }

    // Solo contadores, supervisores y administradores
    const rolesPermitidos = [
      RolesPredefinidos.ADMIN,
      RolesPredefinidos.CONTADOR,
      RolesPredefinidos.SUPERVISOR
    ];

    const tieneRolPermitido = rolesPermitidos.some(rol => 
      contexto.usuario.tieneRol(rol)
    );

    if (!tieneRolPermitido) {
      return {
        permitido: false,
        mensaje: 'Operación financiera requiere rol de Contador, Supervisor o Administrador',
        codigoError: 'INSUFFICIENT_ROLE',
        sugerencias: ['Contactar al administrador para obtener los permisos necesarios']
      };
    }

    return validacionBasica;
  }

  // === VALIDACIONES ESPECÍFICAS PRIVADAS ===

  private validarBasico(usuario: Usuario): ResultadoValidacion {
    try {
      usuario.validarEstadoOperacional();
      return { permitido: true };
    } catch (error) {
      return {
        permitido: false,
        mensaje: (error as Error).message,
        codigoError: 'USER_STATE_INVALID'
      };
    }
  }

  private validarPermiso(permiso: string, usuario: Usuario): ResultadoValidacion {
    if (!usuario.puede(permiso)) {
      return {
        permitido: false,
        mensaje: `Permiso requerido: ${permiso}`,
        codigoError: 'INSUFFICIENT_PERMISSIONS',
        permisosFaltantes: [permiso],
        sugerencias: ['Contactar al administrador para obtener los permisos necesarios']
      };
    }

    return { permitido: true };
  }

  private async validarAccionEspecifica(
    accion: string,
    contexto: ContextoValidacion
  ): Promise<ResultadoValidacion> {
    // Validaciones específicas por acción
    switch (accion) {
      case Permisos.SISTEMA_ADMIN:
        return this.validarAccesoAdmin(contexto);
      
      case Permisos.PERSONAL_ELIMINAR:
        return this.validarEliminacionPersonal(contexto);
      
      case Permisos.CLIENTES_ELIMINAR:
        return this.validarEliminacionCliente(contexto);
      
      default:
        return { permitido: true };
    }
  }

  private validarAccesoAdmin(contexto: ContextoValidacion): ResultadoValidacion {
    if (!contexto.usuario.esAdmin()) {
      return {
        permitido: false,
        mensaje: 'Acceso de administrador requerido',
        codigoError: 'ADMIN_ONLY'
      };
    }

    return { permitido: true };
  }

  private validarCreacionVenta(contexto: ContextoValidacion): ResultadoValidacion {
    // Verificar que el usuario tenga una entidad activa
    if (!contexto.usuario.sesionActual?.entidadActiva) {
      return {
        permitido: false,
        mensaje: 'Se requiere una entidad activa para crear ventas',
        codigoError: 'NO_ACTIVE_ENTITY'
      };
    }

    // Solo Personal puede crear ventas
    const entidadActiva = contexto.usuario.sesionActual.entidadActiva;
    if (entidadActiva.tipoEntidad !== 'Personal') {
      return {
        permitido: false,
        mensaje: 'Solo el personal puede crear ventas',
        codigoError: 'INVALID_ENTITY_TYPE'
      };
    }

    return { permitido: true };
  }

  private validarEdicionVenta(contexto: ContextoValidacion): ResultadoValidacion {
    // Solo supervisores y administradores pueden editar ventas
    const rolesPermitidos = [RolesPredefinidos.ADMIN, RolesPredefinidos.SUPERVISOR];
    const tieneRol = rolesPermitidos.some(rol => contexto.usuario.tieneRol(rol));

    if (!tieneRol) {
      return {
        permitido: false,
        mensaje: 'Solo supervisores y administradores pueden editar ventas',
        codigoError: 'INSUFFICIENT_ROLE'
      };
    }

    return { permitido: true };
  }

  private validarEliminacionVenta(contexto: ContextoValidacion): ResultadoValidacion {
    // Solo administradores pueden eliminar ventas
    if (!contexto.usuario.esAdmin()) {
      return {
        permitido: false,
        mensaje: 'Solo administradores pueden eliminar ventas',
        codigoError: 'ADMIN_REQUIRED'
      };
    }

    return { permitido: true };
  }

  private validarReportesVenta(contexto: ContextoValidacion): ResultadoValidacion {
    // Supervisores, contadores y administradores pueden ver reportes
    const rolesPermitidos = [
      RolesPredefinidos.ADMIN,
      RolesPredefinidos.SUPERVISOR,
      RolesPredefinidos.CONTADOR
    ];

    const tieneRol = rolesPermitidos.some(rol => contexto.usuario.tieneRol(rol));

    if (!tieneRol) {
      return {
        permitido: false,
        mensaje: 'Acceso a reportes requiere rol de Supervisor, Contador o Administrador',
        codigoError: 'INSUFFICIENT_ROLE'
      };
    }

    return { permitido: true };
  }

  private validarEliminacionPersonal(contexto: ContextoValidacion): ResultadoValidacion {
    // Solo administradores pueden eliminar personal
    if (!contexto.usuario.esAdmin()) {
      return {
        permitido: false,
        mensaje: 'Solo administradores pueden eliminar personal',
        codigoError: 'ADMIN_REQUIRED'
      };
    }

    // No puede eliminarse a sí mismo
    if (contexto.entidadObjetivo?.id === contexto.usuario.sesionActual?.entidadActiva.id) {
      return {
        permitido: false,
        mensaje: 'No puedes eliminarte a ti mismo',
        codigoError: 'SELF_DELETION_FORBIDDEN'
      };
    }

    return { permitido: true };
  }

  private validarEliminacionCliente(contexto: ContextoValidacion): ResultadoValidacion {
    // Verificar que el cliente no tenga ventas pendientes
    if (contexto.datosAdicionales?.ventasPendientes > 0) {
      return {
        permitido: false,
        mensaje: 'No se puede eliminar un cliente con ventas pendientes',
        codigoError: 'CLIENT_HAS_PENDING_SALES'
      };
    }

    return { permitido: true };
  }

  // === GESTIÓN DE REGLAS PERSONALIZADAS ===

  /**
   * Registra una regla de validación personalizada
   */
  registrarRegla(regla: ReglaValidacion): void {
    this.reglasPersonalizadas.set(regla.nombre, regla);
  }

  /**
   * Remueve una regla de validación personalizada
   */
  removerRegla(nombreRegla: string): void {
    this.reglasPersonalizadas.delete(nombreRegla);
  }

  /**
   * Aplica reglas personalizadas
   */
  private async aplicarReglasPersonalizadas(
    accion: string,
    contexto: ContextoValidacion
  ): Promise<ResultadoValidacion> {
    const reglasOrdenadas = Array.from(this.reglasPersonalizadas.values())
      .sort((a, b) => b.prioridad - a.prioridad);

    for (const regla of reglasOrdenadas) {
      const resultado = await regla.validar(contexto);
      if (!resultado.permitido) {
        return resultado;
      }
    }

    return { permitido: true };
  }

  // === GESTIÓN DE CACHE ===

  private generarCacheKey(accion: string, contexto: ContextoValidacion): string {
    const entidadId = contexto.entidadObjetivo?.id || 'none';
    return `${contexto.usuario.id}_${accion}_${entidadId}`;
  }

  private obtenerDeCache(cacheKey: string): ResultadoValidacion | null {
    const entrada = this.cacheValidaciones.get(cacheKey);
    
    if (!entrada) {
      return null;
    }

    if (new Date() > entrada.expiracion) {
      this.cacheValidaciones.delete(cacheKey);
      return null;
    }

    return entrada.resultado;
  }

  private guardarEnCache(cacheKey: string, resultado: ResultadoValidacion): void {
    const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    this.cacheValidaciones.set(cacheKey, { resultado, expiracion });
  }

  /**
   * Limpia el cache de validaciones
   */
  limpiarCache(): void {
    this.cacheValidaciones.clear();
  }

  // === AUDITORÍA ===

  private registrarYRetornar(
    contexto: ContextoValidacion,
    resultado: ResultadoValidacion
  ): ResultadoValidacion {
    // Registrar en auditoría
    this.auditoria.push({
      contexto,
      resultado,
      timestamp: new Date()
    });

    // Mantener solo los últimos 1000 registros
    if (this.auditoria.length > 1000) {
      this.auditoria = this.auditoria.slice(-1000);
    }

    return resultado;
  }

  /**
   * Obtiene el historial de auditoría
   */
  obtenerAuditoria(usuarioId?: string, limite: number = 100): Array<{
    contexto: ContextoValidacion;
    resultado: ResultadoValidacion;
    timestamp: Date;
  }> {
    let registros = this.auditoria;

    if (usuarioId) {
      registros = registros.filter(r => r.contexto.usuario.id === usuarioId);
    }

    return registros.slice(-limite);
  }

  // === INICIALIZACIÓN ===

  private inicializarReglasBasicas(): void {
    // Regla: Horario laboral
    this.registrarRegla({
      nombre: 'horario_laboral',
      descripcion: 'Valida que las operaciones se realicen en horario laboral',
      prioridad: 1,
      validar: (contexto) => {
        const ahora = new Date();
        const hora = ahora.getHours();
        
        // Horario laboral: 6 AM - 10 PM
        if (hora < 6 || hora > 22) {
          return {
            permitido: false,
            mensaje: 'Operación fuera del horario laboral (6:00 AM - 10:00 PM)',
            codigoError: 'OUTSIDE_BUSINESS_HOURS'
          };
        }

        return { permitido: true };
      }
    });

    // Regla: Límite de operaciones por hora
    this.registrarRegla({
      nombre: 'limite_operaciones',
      descripcion: 'Limita el número de operaciones por usuario por hora',
      prioridad: 2,
      validar: (contexto) => {
        // Esta sería una implementación más compleja que requeriría
        // tracking de operaciones por usuario
        return { permitido: true };
      }
    });
  }
}
