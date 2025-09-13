"use strict";
/**
 * Clase UsuarioManager - Gestión completa de usuarios
 *
 * @description Orquesta todas las operaciones relacionadas con usuarios,
 * incluyendo creación, autenticación, gestión de roles y auditoría
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioManager = void 0;
const Usuario_1 = require("./Usuario");
const SesionManager_1 = require("./SesionManager");
const PermisoValidator_1 = require("./PermisoValidator");
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
class UsuarioManager {
    constructor(configuracion) {
        // Cache de usuarios
        this.cacheUsuarios = new Map();
        // Repositorio de usuarios (en producción sería una base de datos)
        this.usuarios = new Map();
        // Auditoría
        this.registrosAuditoria = [];
        this.configuracion = {
            auditoria: true,
            cache: true,
            tiempoVidaCache: 30, // 30 minutos
            hashearPassword: this.hashearPasswordDefault,
            validarPassword: this.validarPasswordDefault,
            ...configuracion
        };
        this.sesionManager = new SesionManager_1.SesionManager(this.configuracion.sesiones);
        this.permisoValidator = new PermisoValidator_1.PermisoValidator();
    }
    // === OPERACIONES CRUD DE USUARIOS ===
    /**
     * Crea un nuevo usuario
     */
    async crearUsuario(datos, roles, entidades, usuarioCreador) {
        try {
            // Validar permisos del usuario creador
            if (usuarioCreador) {
                const contexto = { usuario: usuarioCreador };
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
            const passwordHash = await this.configuracion.hashearPassword(datos.password);
            // Crear usuario
            const datosUsuario = {
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
            const usuario = new Usuario_1.Usuario(datosUsuario);
            // Guardar usuario
            this.usuarios.set(id, usuario);
            // Invalidar cache si está habilitado
            if (this.configuracion.cache) {
                this.limpiarCache();
            }
            // Auditoría
            this.registrarAuditoria((usuarioCreador === null || usuarioCreador === void 0 ? void 0 : usuarioCreador.id) || 'sistema', 'crear_usuario', {
                usuarioCreado: id,
                email: datos.email,
                username: datos.username
            });
            return {
                exito: true,
                datos: usuario,
                mensaje: 'Usuario creado exitosamente'
            };
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al crear usuario: ${error.message}`,
                codigoError: 'CREATE_USER_ERROR'
            };
        }
    }
    /**
     * Obtiene un usuario por ID
     */
    async obtenerUsuario(id, solicitante) {
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
                const contexto = { usuario: solicitante };
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
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al obtener usuario: ${error.message}`,
                codigoError: 'GET_USER_ERROR'
            };
        }
    }
    /**
     * Actualiza un usuario existente
     */
    async actualizarUsuario(id, datos, solicitante) {
        var _a, _b, _c, _d, _e;
        try {
            // Obtener usuario actual
            const resultadoUsuario = await this.obtenerUsuario(id);
            if (!resultadoUsuario.exito || !resultadoUsuario.datos) {
                return resultadoUsuario;
            }
            const usuario = resultadoUsuario.datos;
            // Validar permisos
            const contexto = { usuario: solicitante };
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
            const datosActualizados = {
                ...usuario.toJSON(),
                email: datos.email || usuario.email,
                username: datos.username || usuario.username,
                passwordHash: datos.password ? await this.configuracion.hashearPassword(datos.password) : usuario.passwordHash,
                activo: datos.activo !== undefined ? datos.activo : usuario.activo,
                fechaActualizacion: new Date(),
                configuraciones: datos.configuraciones ? {
                    idioma: datos.configuraciones.idioma || ((_a = usuario.configuraciones) === null || _a === void 0 ? void 0 : _a.idioma) || "es",
                    zonaHoraria: datos.configuraciones.zonaHoraria || ((_b = usuario.configuraciones) === null || _b === void 0 ? void 0 : _b.zonaHoraria) || "America/Lima",
                    tema: datos.configuraciones.tema || ((_c = usuario.configuraciones) === null || _c === void 0 ? void 0 : _c.tema) || "claro",
                    notificaciones: datos.configuraciones.notificaciones || ((_d = usuario.configuraciones) === null || _d === void 0 ? void 0 : _d.notificaciones) || {
                        email: true,
                        push: true,
                        ventas: false,
                        stockBajo: false,
                        nuevosClientes: false
                    },
                    entidadPredeterminada: datos.configuraciones.entidadPredeterminada || ((_e = usuario.configuraciones) === null || _e === void 0 ? void 0 : _e.entidadPredeterminada)
                } : usuario.configuraciones
            };
            const usuarioActualizado = new Usuario_1.Usuario(datosActualizados);
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
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al actualizar usuario: ${error.message}`,
                codigoError: 'UPDATE_USER_ERROR'
            };
        }
    }
    /**
     * Elimina un usuario (desactivación)
     */
    async eliminarUsuario(id, solicitante) {
        try {
            // Validar permisos de administrador
            const contexto = { usuario: solicitante };
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
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al eliminar usuario: ${error.message}`,
                codigoError: 'DELETE_USER_ERROR'
            };
        }
    }
    // === AUTENTICACIÓN ===
    /**
     * Autentica un usuario
     */
    async autenticar(credenciales) {
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
            const respuestaLogin = await this.sesionManager.autenticar(credenciales, usuario, this.configuracion.validarPassword);
            // Auditoría
            this.registrarAuditoria(usuario.id, 'login_exitoso', {
                entidadActiva: respuestaLogin.sesion.entidadActiva.id
            });
            return {
                exito: true,
                datos: respuestaLogin,
                mensaje: 'Autenticación exitosa'
            };
        }
        catch (error) {
            // Auditoría de fallo
            this.registrarAuditoria('desconocido', 'login_fallido', {
                identificador: credenciales.identificador,
                error: error.message
            });
            return {
                exito: false,
                mensaje: error.message,
                codigoError: 'AUTHENTICATION_FAILED'
            };
        }
    }
    /**
     * Cierra la sesión de un usuario
     */
    async cerrarSesion(usuarioId) {
        try {
            this.sesionManager.cerrarSesion(usuarioId);
            // Auditoría
            this.registrarAuditoria(usuarioId, 'logout', {});
            return {
                exito: true,
                mensaje: 'Sesión cerrada exitosamente'
            };
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al cerrar sesión: ${error.message}`,
                codigoError: 'LOGOUT_ERROR'
            };
        }
    }
    // === GESTIÓN DE ROLES Y ENTIDADES ===
    /**
     * Asigna roles a un usuario
     */
    async asignarRoles(usuarioId, roles, solicitante) {
        try {
            // Validar permisos
            const contexto = { usuario: solicitante };
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
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al asignar roles: ${error.message}`,
                codigoError: 'ASSIGN_ROLES_ERROR'
            };
        }
    }
    /**
     * Asocia entidades a un usuario
     */
    async asociarEntidades(usuarioId, entidades, solicitante) {
        try {
            // Validar permisos
            const contexto = { usuario: solicitante };
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
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al asociar entidades: ${error.message}`,
                codigoError: 'ASSOCIATE_ENTITIES_ERROR'
            };
        }
    }
    // === CONSULTAS Y ESTADÍSTICAS ===
    /**
     * Lista todos los usuarios con filtros
     */
    async listarUsuarios(filtros = {}, solicitante) {
        try {
            // Validar permisos
            const contexto = { usuario: solicitante };
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
                usuarios = usuarios.filter(u => u.tieneRol(filtros.rol));
            }
            if (filtros.tipoEntidad) {
                usuarios = usuarios.filter(u => u.entidades.some(e => e.tipo === filtros.tipoEntidad));
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
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al listar usuarios: ${error.message}`,
                codigoError: 'LIST_USERS_ERROR'
            };
        }
    }
    /**
     * Obtiene estadísticas del sistema de usuarios
     */
    async obtenerEstadisticas(solicitante) {
        try {
            // Validar permisos de administrador
            const contexto = { usuario: solicitante };
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
            const estadisticas = {
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
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al obtener estadísticas: ${error.message}`,
                codigoError: 'STATS_ERROR'
            };
        }
    }
    // === MÉTODOS PRIVADOS ===
    validarDatosUsuario(datos) {
        const errores = [];
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
    buscarPorEmail(email) {
        return Array.from(this.usuarios.values()).find(u => u.email === email);
    }
    buscarPorUsername(username) {
        return Array.from(this.usuarios.values()).find(u => u.username === username);
    }
    buscarPorEmailOUsername(email, username) {
        return Array.from(this.usuarios.values()).find(u => u.email === email || u.username === username);
    }
    generarIdUnico() {
        return `usr_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    async hashearPasswordDefault(password) {
        // En producción usar bcrypt o similar
        return `hashed_${password}`;
    }
    async validarPasswordDefault(password, hash) {
        // En producción usar bcrypt.compare o similar
        return hash === `hashed_${password}`;
    }
    // === GESTIÓN DE CACHE ===
    obtenerDeCache(id) {
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
    guardarEnCache(id, usuario) {
        const expiracion = new Date(Date.now() + this.configuracion.tiempoVidaCache * 60 * 1000);
        this.cacheUsuarios.set(id, { usuario, expiracion });
    }
    limpiarCache() {
        this.cacheUsuarios.clear();
    }
    // === AUDITORÍA ===
    registrarAuditoria(usuarioId, accion, detalles) {
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
    async obtenerAuditoria(filtros = {}, solicitante) {
        try {
            // Validar permisos de administrador
            const contexto = { usuario: solicitante };
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
                registros = registros.filter(r => r.timestamp >= filtros.fechaInicio);
            }
            if (filtros.fechaFin) {
                registros = registros.filter(r => r.timestamp <= filtros.fechaFin);
            }
            // Limitar resultados
            const limite = filtros.limite || 100;
            registros = registros.slice(-limite);
            return {
                exito: true,
                datos: registros
            };
        }
        catch (error) {
            return {
                exito: false,
                mensaje: `Error al obtener auditoría: ${error.message}`,
                codigoError: 'AUDIT_ERROR'
            };
        }
    }
    // === GETTERS PÚBLICOS ===
    /**
     * Obtiene el gestor de sesiones
     */
    get gestorSesiones() {
        return this.sesionManager;
    }
    /**
     * Obtiene el validador de permisos
     */
    get validadorPermisos() {
        return this.permisoValidator;
    }
}
exports.UsuarioManager = UsuarioManager;
