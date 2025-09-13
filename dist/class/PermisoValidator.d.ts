/**
 * Clase PermisoValidator - Validaciones avanzadas de permisos
 *
 * @description Proporciona validaciones complejas de permisos, contexto y reglas de negocio
 * para operaciones específicas del sistema de retail
 */
import { Usuario } from "./Usuario";
import { Entidad } from "../interfaces/entidades";
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
export declare class PermisoValidator {
    private reglasPersonalizadas;
    private cacheValidaciones;
    private auditoria;
    constructor();
    /**
     * Valida si un usuario puede realizar una acción específica
     */
    validarAccion(accion: string, contexto: ContextoValidacion): Promise<ResultadoValidacion>;
    /**
     * Valida múltiples acciones a la vez
     */
    validarMultiplesAcciones(acciones: string[], contexto: ContextoValidacion, requiereTodas?: boolean): Promise<ResultadoValidacion>;
    /**
     * Valida operaciones de ventas
     */
    validarOperacionVenta(operacion: 'crear' | 'ver' | 'editar' | 'eliminar' | 'reportes', contexto: ContextoValidacion): Promise<ResultadoValidacion>;
    /**
     * Valida operaciones de productos
     */
    validarOperacionProducto(operacion: 'crear' | 'ver' | 'editar' | 'eliminar' | 'stock', contexto: ContextoValidacion): Promise<ResultadoValidacion>;
    /**
     * Valida operaciones financieras
     */
    validarOperacionFinanciera(operacion: 'ver' | 'crear' | 'editar' | 'reportes', contexto: ContextoValidacion): Promise<ResultadoValidacion>;
    private validarBasico;
    private validarPermiso;
    private validarAccionEspecifica;
    private validarAccesoAdmin;
    private validarCreacionVenta;
    private validarEdicionVenta;
    private validarEliminacionVenta;
    private validarReportesVenta;
    private validarEliminacionPersonal;
    private validarEliminacionCliente;
    /**
     * Registra una regla de validación personalizada
     */
    registrarRegla(regla: ReglaValidacion): void;
    /**
     * Remueve una regla de validación personalizada
     */
    removerRegla(nombreRegla: string): void;
    /**
     * Aplica reglas personalizadas
     */
    private aplicarReglasPersonalizadas;
    private generarCacheKey;
    private obtenerDeCache;
    private guardarEnCache;
    /**
     * Limpia el cache de validaciones
     */
    limpiarCache(): void;
    private registrarYRetornar;
    /**
     * Obtiene el historial de auditoría
     */
    obtenerAuditoria(usuarioId?: string, limite?: number): Array<{
        contexto: ContextoValidacion;
        resultado: ResultadoValidacion;
        timestamp: Date;
    }>;
    private inicializarReglasBasicas;
}
