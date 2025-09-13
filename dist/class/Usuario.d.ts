/**
 * Clase Usuario - Maneja toda la lógica de un usuario del sistema
 *
 * @description Implementa la lógica de negocio para usuarios, roles y entidades
 * Siguiendo el patrón establecido en ShoppingCart y Venta
 */
import { IUsuario, CrearUsuario, ConfiguracionUsuario } from "../interfaces/usuario";
import { Entidad, Rol, SesionContexto } from "../interfaces/entidades";
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
export declare class Usuario implements IUsuario {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly passwordHash: string;
    readonly fechaCreacion: Date;
    readonly emailVerificado: boolean;
    private _roles;
    private _entidades;
    private _activo;
    private _fechaActualizacion;
    private _fechaUltimoAcceso?;
    private _intentosFallidos;
    private _cuentaBloqueada;
    private _fechaBloqueo?;
    private _tokenVerificacion?;
    private _configuraciones?;
    private _sesionActual?;
    private _permisosCache?;
    private _cacheExpiracion?;
    constructor(data: IUsuario);
    get roles(): Rol[];
    get entidades(): Entidad[];
    get activo(): boolean;
    get fechaActualizacion(): Date;
    get fechaUltimoAcceso(): Date | undefined;
    get intentosFallidos(): number;
    get cuentaBloqueada(): boolean;
    get fechaBloqueo(): Date | undefined;
    get tokenVerificacion(): string | undefined;
    get configuraciones(): ConfiguracionUsuario | undefined;
    get sesionActual(): SesionContexto | undefined;
    /**
     * Verifica si el usuario tiene un permiso específico
     */
    puede(permiso: string): boolean;
    /**
     * Verifica si el usuario tiene múltiples permisos
     */
    puedeMultiple(permisos: string[], requiereTodos?: boolean): boolean;
    /**
     * Verifica si el usuario tiene un rol específico
     */
    tieneRol(nombreRol: string): boolean;
    /**
     * Verifica si el usuario es administrador
     */
    esAdmin(): boolean;
    /**
     * Obtiene todos los permisos del usuario (con cache)
     */
    obtenerPermisos(): string[];
    /**
     * Invalida el cache de permisos
     */
    private invalidarCachePermisos;
    /**
     * Agrega un rol al usuario
     */
    agregarRol(rol: Rol): void;
    /**
     * Remueve un rol del usuario
     */
    removerRol(rolId: string): void;
    /**
     * Reemplaza todos los roles del usuario
     */
    asignarRoles(nuevosRoles: Rol[]): void;
    /**
     * Obtiene el nombre para mostrar del usuario
     */
    obtenerNombreCompleto(): string;
    /**
     * Verifica si puede acceder a una entidad específica
     */
    puedeAccederEntidad(entidadId: string): boolean;
    /**
     * Obtiene entidades por tipo
     */
    obtenerEntidadesPorTipo<T extends Entidad>(tipo: string): T[];
    /**
     * Agrega una entidad al usuario
     */
    agregarEntidad(entidad: Entidad): void;
    /**
     * Remueve una entidad del usuario
     */
    removerEntidad(entidadId: string): void;
    /**
     * Inicia sesión del usuario
     */
    iniciarSesion(entidadActivaId?: string): SesionContexto;
    /**
     * Actualiza la actividad de la sesión
     */
    actualizarActividad(): void;
    /**
     * Cambia la entidad activa en la sesión
     */
    cambiarEntidadActiva(entidadId: string): void;
    /**
     * Cierra la sesión del usuario
     */
    cerrarSesion(): void;
    /**
     * Registra un intento de login fallido
     */
    registrarIntentoFallido(): void;
    /**
     * Bloquea la cuenta del usuario
     */
    bloquearCuenta(minutos?: number): void;
    /**
     * Desbloquea la cuenta del usuario
     */
    desbloquearCuenta(): void;
    /**
     * Verifica si el bloqueo ha expirado
     */
    verificarBloqueoExpirado(): boolean;
    /**
     * Activa o desactiva el usuario
     */
    cambiarEstadoActivo(activo: boolean): void;
    /**
     * Actualiza las configuraciones del usuario
     */
    actualizarConfiguraciones(nuevasConfiguraciones: Partial<ConfiguracionUsuario>): void;
    /**
     * Actualiza la fecha de modificación
     */
    private actualizarFechaModificacion;
    /**
     * Valida que el usuario esté en estado válido para operaciones
     */
    validarEstadoOperacional(): void;
    /**
     * Convierte a objeto plano para guardar en DB
     */
    toPouchDB(): any;
    /**
     * Convierte a JSON para APIs externas
     */
    toJSON(): IUsuario;
    /**
     * Crea Usuario desde datos de PouchDB
     */
    static fromPouchDB(doc: any): Usuario;
    /**
     * Crea Usuario desde datos de creación
     */
    static fromCrearUsuario(datos: CrearUsuario, id: string): Usuario;
    /**
     * Valida estructura de datos de usuario
     */
    static validar(data: Partial<IUsuario>): {
        valida: boolean;
        errores: string[];
    };
}
