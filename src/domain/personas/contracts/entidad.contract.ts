/**
 * Sistema de Entidades del dominio personas.
 *
 * @description Define la estructura base para manejar actores reales del negocio.
 * La autorización canónica vive en `src/domain/auth`.
 */

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
