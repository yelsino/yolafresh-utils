"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
const expand_grants_1 = require("../../auth/helpers/expand-grants");
const is_system_admin_role_1 = require("../../auth/helpers/is-system-admin-role");
/**
 * Entidad de Dominio Usuario
 *
 * Implementa la lógica de negocio asociada a la cuenta de usuario.
 */
class Usuario {
    constructor(data) {
        this.roles = [];
        this.entidades = [];
        this.intentosFallidos = 0;
        this.cuentaBloqueada = false;
        this.emailVerificado = false;
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.passwordHash = data.passwordHash;
        this.roles = data.roles || [];
        this.entidades = data.entidades || [];
        this.activo = data.activo;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.fechaUltimoAcceso = data.fechaUltimoAcceso;
        this.intentosFallidos = data.intentosFallidos || 0;
        this.cuentaBloqueada = data.cuentaBloqueada || false;
        this.fechaBloqueo = data.fechaBloqueo;
        this.tokenVerificacion = data.tokenVerificacion;
        this.emailVerificado = data.emailVerificado || false;
        this.configuraciones = data.configuraciones;
        this.sesionActual = data.sesionActual;
        this.debeCambiarPassword = data.debeCambiarPassword;
    }
    /**
     * Verifica si el usuario tiene un rol específico
     */
    tieneRol(roleId) {
        return this.roles.some((rol) => rol.activo && rol.id === roleId);
    }
    /**
     * Verifica si el usuario es administrador
     */
    esAdmin() {
        return ((0, is_system_admin_role_1.isSystemAdminRole)(this.roles.filter((rol) => rol.activo).map((rol) => rol.id)) ||
            this.roles.some((rol) => { var _a; return rol.activo && ((_a = rol.flags) === null || _a === void 0 ? void 0 : _a.isSystemAdmin); }));
    }
    /**
     * Verifica si el usuario tiene un permiso específico
     */
    puede(permiso) {
        if (this.esAdmin())
            return true;
        return this.roles.some((rol) => {
            var _a;
            if (!rol.activo) {
                return false;
            }
            const permissionsExpanded = (_a = rol.permissionsExpanded) !== null && _a !== void 0 ? _a : (0, expand_grants_1.expandGrants)(rol.grants);
            return permissionsExpanded.includes(permiso);
        });
    }
    /**
     * Valida si el usuario puede operar en el sistema
     */
    validarEstadoOperacional() {
        if (!this.activo)
            throw new Error("Usuario inactivo");
        if (this.cuentaBloqueada)
            throw new Error("Cuenta bloqueada");
        if (!this.emailVerificado)
            throw new Error("Email no verificado");
    }
    toJSON() {
        return { ...this };
    }
    static fromJSON(data) {
        return new Usuario({
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            fechaUltimoAcceso: data.fechaUltimoAcceso ? new Date(data.fechaUltimoAcceso) : undefined,
            fechaBloqueo: data.fechaBloqueo ? new Date(data.fechaBloqueo) : undefined
        });
    }
}
exports.Usuario = Usuario;
