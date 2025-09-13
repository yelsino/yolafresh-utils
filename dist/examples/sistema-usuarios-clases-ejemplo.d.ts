/**
 * Ejemplos de uso del Sistema de Usuarios con CLASES
 *
 * @description Muestra cómo usar las clases Usuario, UsuarioManager,
 * SesionManager y PermisoValidator en escenarios reales
 */
import { UsuarioManager } from "../class/UsuarioManager";
import { Cliente, Personal } from "../interfaces/persons";
/**
 * Inicializa el sistema completo de usuarios
 */
export declare function inicializarSistemaUsuarios(): UsuarioManager;
/**
 * Crea entidades de ejemplo
 */
export declare function crearEntidadesEjemplo(): {
    cliente: Cliente;
    personal: Personal;
};
/**
 * Crea roles de ejemplo
 */
export declare function crearRolesEjemplo(): {
    rolAdmin: import("../interfaces/entidades").Rol;
    rolCajero: import("../interfaces/entidades").Rol;
    rolCliente: import("../interfaces/entidades").Rol;
};
/**
 * Ejemplo completo mostrando todo el flujo de trabajo
 */
export declare function ejemploCompletoConClases(): Promise<void>;
/**
 * Ejemplo específico de la clase Usuario
 */
export declare function ejemploClaseUsuario(): void;
/**
 * Ejemplo específico del SesionManager
 */
export declare function ejemploSesionManager(): Promise<void>;
/**
 * Ejemplo específico del PermisoValidator
 */
export declare function ejemploPermisoValidator(): Promise<void>;
/**
 * Ejecuta todos los ejemplos
 */
export declare function ejecutarTodosLosEjemplos(): Promise<void>;
