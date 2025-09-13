/**
 * Ejemplos de uso del Sistema de Usuarios, Roles y Entidades
 *
 * @description Muestra cómo implementar y usar el nuevo sistema RBAC
 * en diferentes escenarios de un sistema de retail
 */
import { IUsuario } from "..";
import { Rol } from "../interfaces/entidades";
import { Cliente, Personal } from "../interfaces/persons";
/**
 * Ejemplo: Crear roles básicos del sistema
 */
export declare function crearRolesBasicos(): Rol[];
/**
 * Ejemplo: Crear un cliente
 */
export declare function crearEjemploCliente(): Cliente;
/**
 * Ejemplo: Crear personal (cajero)
 */
export declare function crearEjemploPersonal(): Personal;
/**
 * Ejemplo: Crear usuario cliente
 */
export declare function crearUsuarioCliente(): IUsuario;
/**
 * Ejemplo: Crear usuario cajero (personal)
 */
export declare function crearUsuarioCajero(): IUsuario;
/**
 * Ejemplo: Validar permisos de un cajero
 */
export declare function ejemploValidacionCajero(): void;
/**
 * Ejemplo: Validar permisos de un cliente
 */
export declare function ejemploValidacionCliente(): void;
/**
 * Ejemplo: Crear sesión de usuario
 */
export declare function ejemploSesionUsuario(): void;
/**
 * Ejemplo: Función que requiere permisos específicos
 */
export declare function crearVenta(usuario: IUsuario, datosVenta: any): any;
/**
 * Ejemplo: Función que requiere múltiples permisos
 */
export declare function generarReporteVentas(usuario: IUsuario): {
    reporte: string;
};
/**
 * Ejemplo completo mostrando el flujo de trabajo
 */
export declare function ejemploCompletoSistemaUsuarios(): void;
/**
 * Caso de uso: Usuario con múltiples entidades
 */
export declare function ejemploUsuarioMultipleEntidades(): void;
