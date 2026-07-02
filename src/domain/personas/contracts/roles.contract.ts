/**
 * Roles predefinidos oficiales del sistema.
 *
 * Representan seeds/helpers iniciales de RBAC.
 * No limitan la creación de roles personalizados en apps consumidoras.
 */
export enum RolesPredefinidos {
  ADMIN = "admin",
  SUPERVISOR = "supervisor",
  CAJERO = "cajero",
  VENTAS = "ventas",
  OPERACIONES = "operaciones",
  INVENTARIO = "inventario",
  COMPRAS = "compras",
  FINANZAS = "finanzas",
  VENDEDOR = "vendedor",
  CONTADOR = "contador",
  AUDITOR = "auditor",
  SOPORTE_TECNICO = "soporte-tecnico",
  SOLO_LECTURA = "solo-lectura",
}
