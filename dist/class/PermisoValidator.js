"use strict";
/**
 * Clase PermisoValidator - Validaciones avanzadas de permisos
 *
 * @description Proporciona validaciones complejas de permisos, contexto y reglas de negocio
 * para operaciones específicas del sistema de retail
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermisoValidator = void 0;
const entidades_1 = require("@/interfaces/entidades");
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
class PermisoValidator {
    constructor() {
        this.reglasPersonalizadas = new Map();
        this.cacheValidaciones = new Map();
        this.auditoria = [];
        this.inicializarReglasBasicas();
    }
    // === VALIDACIONES PRINCIPALES ===
    /**
     * Valida si un usuario puede realizar una acción específica
     */
    async validarAccion(accion, contexto) {
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
        }
        catch (error) {
            const resultado = {
                permitido: false,
                mensaje: `Error en validación: ${error.message}`,
                codigoError: 'VALIDATION_ERROR'
            };
            return this.registrarYRetornar(contexto, resultado);
        }
    }
    /**
     * Valida múltiples acciones a la vez
     */
    async validarMultiplesAcciones(acciones, contexto, requiereTodas = true) {
        const resultados = await Promise.all(acciones.map(accion => this.validarAccion(accion, contexto)));
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
        }
        else {
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
    async validarOperacionVenta(operacion, contexto) {
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
    async validarOperacionProducto(operacion, contexto) {
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
    async validarOperacionFinanciera(operacion, contexto) {
        const permisoRequerido = `finanzas:${operacion}`;
        const validacionBasica = await this.validarAccion(permisoRequerido, contexto);
        if (!validacionBasica.permitido) {
            return validacionBasica;
        }
        // Solo contadores, supervisores y administradores
        const rolesPermitidos = [
            entidades_1.RolesPredefinidos.ADMIN,
            entidades_1.RolesPredefinidos.CONTADOR,
            entidades_1.RolesPredefinidos.SUPERVISOR
        ];
        const tieneRolPermitido = rolesPermitidos.some(rol => contexto.usuario.tieneRol(rol));
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
    validarBasico(usuario) {
        try {
            usuario.validarEstadoOperacional();
            return { permitido: true };
        }
        catch (error) {
            return {
                permitido: false,
                mensaje: error.message,
                codigoError: 'USER_STATE_INVALID'
            };
        }
    }
    validarPermiso(permiso, usuario) {
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
    async validarAccionEspecifica(accion, contexto) {
        // Validaciones específicas por acción
        switch (accion) {
            case entidades_1.Permisos.SISTEMA_ADMIN:
                return this.validarAccesoAdmin(contexto);
            case entidades_1.Permisos.PERSONAL_ELIMINAR:
                return this.validarEliminacionPersonal(contexto);
            case entidades_1.Permisos.CLIENTES_ELIMINAR:
                return this.validarEliminacionCliente(contexto);
            default:
                return { permitido: true };
        }
    }
    validarAccesoAdmin(contexto) {
        if (!contexto.usuario.esAdmin()) {
            return {
                permitido: false,
                mensaje: 'Acceso de administrador requerido',
                codigoError: 'ADMIN_ONLY'
            };
        }
        return { permitido: true };
    }
    validarCreacionVenta(contexto) {
        var _a;
        // Verificar que el usuario tenga una entidad activa
        if (!((_a = contexto.usuario.sesionActual) === null || _a === void 0 ? void 0 : _a.entidadActiva)) {
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
    validarEdicionVenta(contexto) {
        // Solo supervisores y administradores pueden editar ventas
        const rolesPermitidos = [entidades_1.RolesPredefinidos.ADMIN, entidades_1.RolesPredefinidos.SUPERVISOR];
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
    validarEliminacionVenta(contexto) {
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
    validarReportesVenta(contexto) {
        // Supervisores, contadores y administradores pueden ver reportes
        const rolesPermitidos = [
            entidades_1.RolesPredefinidos.ADMIN,
            entidades_1.RolesPredefinidos.SUPERVISOR,
            entidades_1.RolesPredefinidos.CONTADOR
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
    validarEliminacionPersonal(contexto) {
        var _a, _b;
        // Solo administradores pueden eliminar personal
        if (!contexto.usuario.esAdmin()) {
            return {
                permitido: false,
                mensaje: 'Solo administradores pueden eliminar personal',
                codigoError: 'ADMIN_REQUIRED'
            };
        }
        // No puede eliminarse a sí mismo
        if (((_a = contexto.entidadObjetivo) === null || _a === void 0 ? void 0 : _a.id) === ((_b = contexto.usuario.sesionActual) === null || _b === void 0 ? void 0 : _b.entidadActiva.id)) {
            return {
                permitido: false,
                mensaje: 'No puedes eliminarte a ti mismo',
                codigoError: 'SELF_DELETION_FORBIDDEN'
            };
        }
        return { permitido: true };
    }
    validarEliminacionCliente(contexto) {
        var _a;
        // Verificar que el cliente no tenga ventas pendientes
        if (((_a = contexto.datosAdicionales) === null || _a === void 0 ? void 0 : _a.ventasPendientes) > 0) {
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
    registrarRegla(regla) {
        this.reglasPersonalizadas.set(regla.nombre, regla);
    }
    /**
     * Remueve una regla de validación personalizada
     */
    removerRegla(nombreRegla) {
        this.reglasPersonalizadas.delete(nombreRegla);
    }
    /**
     * Aplica reglas personalizadas
     */
    async aplicarReglasPersonalizadas(accion, contexto) {
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
    generarCacheKey(accion, contexto) {
        var _a;
        const entidadId = ((_a = contexto.entidadObjetivo) === null || _a === void 0 ? void 0 : _a.id) || 'none';
        return `${contexto.usuario.id}_${accion}_${entidadId}`;
    }
    obtenerDeCache(cacheKey) {
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
    guardarEnCache(cacheKey, resultado) {
        const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
        this.cacheValidaciones.set(cacheKey, { resultado, expiracion });
    }
    /**
     * Limpia el cache de validaciones
     */
    limpiarCache() {
        this.cacheValidaciones.clear();
    }
    // === AUDITORÍA ===
    registrarYRetornar(contexto, resultado) {
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
    obtenerAuditoria(usuarioId, limite = 100) {
        let registros = this.auditoria;
        if (usuarioId) {
            registros = registros.filter(r => r.contexto.usuario.id === usuarioId);
        }
        return registros.slice(-limite);
    }
    // === INICIALIZACIÓN ===
    inicializarReglasBasicas() {
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
exports.PermisoValidator = PermisoValidator;
