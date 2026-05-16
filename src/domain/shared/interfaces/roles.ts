/**
 * Roles predefinidos oficiales del sistema.
 *
 * Representan seeds/helpers iniciales de RBAC.
 * No limitan la creación de roles personalizados en apps consumidoras.
 */
export enum RolesPredefinidos {
  ADMIN = "admin",
  CAJERO = "cajero",
  VENDEDOR = "vendedor",
  SUPERVISOR = "supervisor",
  CONTADOR = "contador",
}
