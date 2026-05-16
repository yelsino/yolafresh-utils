/**
 * Catálogo oficial de permisos del sistema.
 *
 * Formato:
 * - recurso:accion
 *
 * Reglas:
 * - minúsculas
 * - atómicos
 * - descriptivos
 * - sin lógica implícita por rol
 */
export enum Permisos {
  // Ventas
  VENTAS_CREAR = "ventas:crear",
  VENTAS_VER = "ventas:ver",
  VENTAS_EDITAR = "ventas:editar",
  VENTAS_ANULAR = "ventas:anular",
  VENTAS_REPORTES = "ventas:reportes",
  /** @deprecated Usa `VENTAS_ANULAR` */
  VENTAS_ELIMINAR = "ventas:anular",

  // Caja
  CAJA_ABRIR = "caja:abrir",
  CAJA_CERRAR = "caja:cerrar",
  CAJA_ARQUEO = "caja:arqueo",
  CAJA_MOVIMIENTOS = "caja:movimientos",

  // Productos
  PRODUCTOS_CREAR = "productos:crear",
  PRODUCTOS_VER = "productos:ver",
  PRODUCTOS_EDITAR = "productos:editar",
  PRODUCTOS_DESACTIVAR = "productos:desactivar",
  PRODUCTOS_STOCK = "productos:stock",
  /** @deprecated Usa `PRODUCTOS_DESACTIVAR` */
  PRODUCTOS_ELIMINAR = "productos:desactivar",

  // Inventario
  INVENTARIO_VER = "inventario:ver",
  INVENTARIO_AJUSTAR = "inventario:ajustar",
  INVENTARIO_CONTEO = "inventario:conteo",
  INVENTARIO_TRANSFERIR = "inventario:transferir",

  // Clientes
  CLIENTES_CREAR = "clientes:crear",
  CLIENTES_VER = "clientes:ver",
  CLIENTES_EDITAR = "clientes:editar",
  /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
  CLIENTES_ELIMINAR = "clientes:eliminar",

  // Personal
  PERSONAL_CREAR = "personal:crear",
  PERSONAL_VER = "personal:ver",
  PERSONAL_EDITAR = "personal:editar",
  /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
  PERSONAL_ELIMINAR = "personal:eliminar",

  // Proveedores
  PROVEEDORES_CREAR = "proveedores:crear",
  PROVEEDORES_VER = "proveedores:ver",
  PROVEEDORES_EDITAR = "proveedores:editar",
  /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
  PROVEEDORES_ELIMINAR = "proveedores:eliminar",

  // Compras
  COMPRAS_CREAR = "compras:crear",
  COMPRAS_APROBAR = "compras:aprobar",
  COMPRAS_ANULAR = "compras:anular",

  // Finanzas
  FINANZAS_VER = "finanzas:ver",
  FINANZAS_CREAR = "finanzas:crear",
  FINANZAS_EDITAR = "finanzas:editar",
  FINANZAS_REPORTES = "finanzas:reportes",

  // Sistema
  SISTEMA_ADMIN = "sistema:admin",
  SISTEMA_CONFIGURACION = "sistema:configuracion",
  SISTEMA_USUARIOS = "sistema:usuarios",
  SISTEMA_ROLES = "sistema:roles",

  // Perfil
  PERFIL_VER = "perfil:ver",
  PERFIL_EDITAR = "perfil:editar",
}
