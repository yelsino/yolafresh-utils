/**
 * Sistema de Entidades y Roles para Retail
 * 
 * @description Define la estructura base para manejar usuarios, roles y entidades
 * en un sistema de retail. Permite separar claramente entre:
 * - Usuario: cuenta digital con credenciales
 * - Entidad: contexto real (Cliente, Personal, Proveedor)
 * - Rol: permisos y capacidades en el sistema
 */

import type { Permisos } from "./permisos";

/**
 * Tipos de entidades disponibles en el sistema
 */
export type EntidadTipo = "Cliente" | "Personal" | "Proveedor";

/**
 * Interfaz base para todas las entidades del sistema
 * 
 * @description Representa el "contexto real" de un usuario en el sistema
 * Una entidad puede ser un Cliente, Personal o Proveedor
 */
export interface Entidad {
  /** Identificador único de la entidad */
  id: string;
  
  /** Tipo de entidad que determina su comportamiento */
  tipoEntidad: EntidadTipo;
  
  /** Fecha de creación de la entidad */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
  
  /** Estado activo/inactivo de la entidad */
  activo: boolean;
}

/**
 * Interfaz para definir roles en el sistema
 * 
 * @description Un rol define qué puede hacer un usuario dentro del sistema
 * Implementa Role-Based Access Control (RBAC)
 */
export interface Rol {
  /** Identificador único del rol */
  id: string;
  
  /** Nombre descriptivo del rol */
  nombre: string;
  
  /** Descripción del rol y sus responsabilidades */
  descripcion?: string;
  
  /** Lista de permisos que otorga este rol */
  permisos: Permisos[];
  
  /** Indica si el rol está activo */
  activo: boolean;
  
  /** Fecha de creación del rol */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
}

/**
 * Interfaz para el contexto de sesión de un usuario
 * 
 * @description Información que se mantiene durante la sesión activa
 */
export interface SesionContexto {
  /** Usuario autenticado */
  usuarioId: string;
  
  /** Entidad activa en la sesión (si tiene múltiples) */
  entidadActiva: Entidad;
  
  /** Roles activos en la sesión */
  rolesActivos: Rol[];
  
  /** Timestamp de inicio de sesión */
  inicioSesion: Date;
  
  /** Timestamp de última actividad */
  ultimaActividad: Date;
}
