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
  // Dashboard / Inicio
  DASHBOARD_VER = "dashboard:ver",
  DASHBOARD_OPERATIVO = "dashboard:operativo",
  DASHBOARD_FINANCIERO = "dashboard:financiero",
  DASHBOARD_ADMINISTRATIVO = "dashboard:administrativo",
  ALERTAS_VER = "alertas:ver",

  // Punto de venta
  PUNTO_VENTA_VER = "punto-venta:ver",
  PUNTO_VENTA_CREAR = "punto-venta:crear",
  PUNTO_VENTA_BUSCAR_PRODUCTOS = "punto-venta:buscar-productos",
  PUNTO_VENTA_PESAR_PRODUCTOS = "punto-venta:pesar-productos",
  PUNTO_VENTA_ASIGNAR_CLIENTE = "punto-venta:asignar-cliente",
  PUNTO_VENTA_APLICAR_DESCUENTO = "punto-venta:aplicar-descuento",
  PUNTO_VENTA_CAMBIAR_PRECIO = "punto-venta:cambiar-precio",
  PUNTO_VENTA_ANULAR_ITEM = "punto-venta:anular-item",
  PUNTO_VENTA_IMPRIMIR_COMPROBANTE = "punto-venta:imprimir-comprobante",
  PUNTO_VENTA_REIMPRIMIR_COMPROBANTE = "punto-venta:reimprimir-comprobante",

  // Ventas
  VENTAS_CREAR = "ventas:crear",
  VENTAS_VER = "ventas:ver",
  VENTAS_EDITAR = "ventas:editar",
  VENTAS_ANULAR = "ventas:anular",
  VENTAS_REPORTES = "ventas:reportes",
  VENTAS_VER_PROPIAS = "ventas:ver-propias",
  VENTAS_VER_TODAS = "ventas:ver-todas",
  VENTAS_VER_DETALLE = "ventas:ver-detalle",
  VENTAS_ANULAR_PROPIA_RECIENTE = "ventas:anular-propia-reciente",
  VENTAS_EXPORTAR = "ventas:exportar",
  VENTAS_VER_UTILIDAD = "ventas:ver-utilidad",
  VENTAS_VER_COSTO = "ventas:ver-costo",
  /** @deprecated Usa `VENTAS_ANULAR` */
  VENTAS_ELIMINAR = "ventas:anular",

  // Caja
  CAJA_VER_PROPIA = "caja:ver-propia",
  CAJA_VER_TODAS = "caja:ver-todas",
  CAJA_ABRIR = "caja:abrir",
  CAJA_CERRAR = "caja:cerrar",
  CAJA_CERRAR_PROPIA = "caja:cerrar-propia",
  CAJA_CERRAR_CUALQUIERA = "caja:cerrar-cualquiera",
  CAJA_ARQUEO = "caja:arqueo",
  CAJA_ARQUEO_PROPIO = "caja:arqueo-propio",
  CAJA_SUPERVISAR_ARQUEO = "caja:supervisar-arqueo",
  CAJA_MOVIMIENTOS = "caja:movimientos",
  CAJA_ANULAR_MOVIMIENTO = "caja:anular-movimiento",
  CAJA_VER_HISTORIAL_TURNOS = "caja:ver-historial-turnos",
  CAJA_VER_DETALLE_TURNO = "caja:ver-detalle-turno",
  CAJA_EDITAR_TURNO_CERRADO = "caja:editar-turno-cerrado",
  CAJA_EXPORTAR = "caja:exportar",

  // Cuentas y creditos
  CUENTAS_VER = "cuentas:ver",
  CUENTAS_VER_PROPIAS = "cuentas:ver-propias",
  CUENTAS_VER_TODAS = "cuentas:ver-todas",
  CUENTAS_CREAR_CREDITO = "cuentas:crear-credito",
  CUENTAS_REGISTRAR_PAGO = "cuentas:registrar-pago",
  CUENTAS_EDITAR = "cuentas:editar",
  CUENTAS_ANULAR = "cuentas:anular",
  CUENTAS_AJUSTAR_DEUDA = "cuentas:ajustar-deuda",
  CUENTAS_VER_HISTORIAL = "cuentas:ver-historial",
  CUENTAS_VER_MOROSIDAD = "cuentas:ver-morosidad",
  CUENTAS_EXPORTAR = "cuentas:exportar",

  // Productos
  PRODUCTOS_CREAR = "productos:crear",
  PRODUCTOS_VER = "productos:ver",
  PRODUCTOS_EDITAR = "productos:editar",
  PRODUCTOS_EDITAR_PRECIO = "productos:editar-precio",
  PRODUCTOS_VER_COSTO = "productos:ver-costo",
  PRODUCTOS_VER_UTILIDAD = "productos:ver-utilidad",
  PRODUCTOS_DESACTIVAR = "productos:desactivar",
  PRODUCTOS_STOCK = "productos:stock",
  PRODUCTOS_EDITAR_IMAGEN = "productos:editar-imagen",
  /** @deprecated Usa `PRODUCTOS_DESACTIVAR` */
  PRODUCTOS_ELIMINAR = "productos:desactivar",
  CATEGORIAS_VER = "categorias:ver",
  CATEGORIAS_CREAR = "categorias:crear",
  CATEGORIAS_EDITAR = "categorias:editar",
  CATEGORIAS_DESACTIVAR = "categorias:desactivar",

  // Inventario
  INVENTARIO_VER = "inventario:ver",
  INVENTARIO_VER_BASICO = "inventario:ver-basico",
  INVENTARIO_VER_TODOS_ALMACENES = "inventario:ver-todos-almacenes",
  INVENTARIO_AJUSTAR = "inventario:ajustar",
  INVENTARIO_CONTEO = "inventario:conteo",
  INVENTARIO_SOLICITAR_AJUSTE = "inventario:solicitar-ajuste",
  INVENTARIO_APROBAR_AJUSTE = "inventario:aprobar-ajuste",
  INVENTARIO_TRANSFERIR = "inventario:transferir",
  INVENTARIO_VER_MERMAS = "inventario:ver-mermas",
  INVENTARIO_REGISTRAR_MERMA = "inventario:registrar-merma",
  INVENTARIO_VER_HISTORIAL = "inventario:ver-historial",
  INVENTARIO_EXPORTAR = "inventario:exportar",

  // Almacenes
  ALMACENES_VER = "almacenes:ver",
  ALMACENES_CREAR = "almacenes:crear",
  ALMACENES_EDITAR = "almacenes:editar",
  ALMACENES_DESACTIVAR = "almacenes:desactivar",
  ALMACENES_VER_RECEPCIONES = "almacenes:ver-recepciones",
  ALMACENES_CREAR_RECEPCION = "almacenes:crear-recepcion",
  ALMACENES_ANULAR_RECEPCION = "almacenes:anular-recepcion",
  ALMACENES_VER_TRANSFERENCIAS = "almacenes:ver-transferencias",
  ALMACENES_CREAR_TRANSFERENCIA = "almacenes:crear-transferencia",

  // Clientes
  CLIENTES_CREAR = "clientes:crear",
  CLIENTES_VER = "clientes:ver",
  CLIENTES_EDITAR = "clientes:editar",
  CLIENTES_DESACTIVAR = "clientes:desactivar",
  CLIENTES_VER_DETALLE = "clientes:ver-detalle",
  CLIENTES_VER_CUENTAS = "clientes:ver-cuentas",
  CLIENTES_VER_HISTORIAL_COMPRAS = "clientes:ver-historial-compras",
  CLIENTES_EXPORTAR = "clientes:exportar",
  /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
  CLIENTES_ELIMINAR = "clientes:eliminar",

  // Personal
  PERSONAL_CREAR = "personal:crear",
  PERSONAL_VER = "personal:ver",
  PERSONAL_EDITAR = "personal:editar",
  PERSONAL_DESACTIVAR = "personal:desactivar",
  PERSONAL_VER_DETALLE = "personal:ver-detalle",
  PERSONAL_ASIGNAR_CARGO = "personal:asignar-cargo",
  PERSONAL_EXPORTAR = "personal:exportar",
  /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
  PERSONAL_ELIMINAR = "personal:eliminar",

  // Proveedores
  PROVEEDORES_CREAR = "proveedores:crear",
  PROVEEDORES_VER = "proveedores:ver",
  PROVEEDORES_EDITAR = "proveedores:editar",
  PROVEEDORES_DESACTIVAR = "proveedores:desactivar",
  PROVEEDORES_VER_DETALLE = "proveedores:ver-detalle",
  PROVEEDORES_VER_PAGOS = "proveedores:ver-pagos",
  PROVEEDORES_VER_HISTORIAL_COMPRAS = "proveedores:ver-historial-compras",
  PROVEEDORES_EXPORTAR = "proveedores:exportar",
  /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
  PROVEEDORES_ELIMINAR = "proveedores:eliminar",

  // Compras
  COMPRAS_VER = "compras:ver",
  COMPRAS_CREAR = "compras:crear",
  COMPRAS_EDITAR = "compras:editar",
  COMPRAS_APROBAR = "compras:aprobar",
  COMPRAS_ANULAR = "compras:anular",
  COMPRAS_RECEPCIONAR = "compras:recepcionar",
  COMPRAS_VER_COSTOS = "compras:ver-costos",
  COMPRAS_REGISTRAR_PAGO = "compras:registrar-pago",
  COMPRAS_VER_PAGOS = "compras:ver-pagos",
  COMPRAS_EXPORTAR = "compras:exportar",

  // Finanzas
  FINANZAS_VER = "finanzas:ver",
  FINANZAS_CREAR = "finanzas:crear",
  FINANZAS_EDITAR = "finanzas:editar",
  FINANZAS_REPORTES = "finanzas:reportes",

  // Usuarios y accesos
  USUARIOS_VER = "usuarios:ver",
  USUARIOS_CREAR = "usuarios:crear",
  USUARIOS_EDITAR = "usuarios:editar",
  USUARIOS_DESACTIVAR = "usuarios:desactivar",
  USUARIOS_ASOCIAR_PERSONAL = "usuarios:asociar-personal",
  USUARIOS_ASIGNAR_ROLES = "usuarios:asignar-roles",
  USUARIOS_RESTABLECER_ACCESO = "usuarios:restablecer-acceso",
  USUARIOS_VER_SESIONES = "usuarios:ver-sesiones",

  // Roles y permisos
  ROLES_VER = "roles:ver",
  ROLES_CREAR = "roles:crear",
  ROLES_EDITAR = "roles:editar",
  ROLES_DESACTIVAR = "roles:desactivar",
  ROLES_EDITAR_PERMISOS = "roles:editar-permisos",
  ROLES_ASIGNAR = "roles:asignar",

  // Reportes y analisis
  REPORTES_VER = "reportes:ver",
  REPORTES_VENTAS_VER = "reportes:ventas",
  REPORTES_CAJA_VER = "reportes:caja",
  REPORTES_FINANZAS_VER = "reportes:finanzas",
  REPORTES_INVENTARIO_VER = "reportes:inventario",
  REPORTES_COMPRAS_VER = "reportes:compras",
  REPORTES_CLIENTES_VER = "reportes:clientes",
  REPORTES_EXPORTAR = "reportes:exportar",
  ANALISIS_OPERATIVO_VER = "analisis:operativo",
  ANALISIS_FINANCIERO_VER = "analisis:financiero",

  // Pagos
  PAGOS_VER = "pagos:ver",
  PAGOS_VER_DIGITALES = "pagos:ver-digitales",
  PAGOS_CONFIGURAR_DIGITALES = "pagos:configurar-digitales",
  PAGOS_CONCILIAR = "pagos:conciliar",
  PAGOS_ANULAR = "pagos:anular",

  // Notificaciones
  NOTIFICACIONES_VER = "notificaciones:ver",
  NOTIFICACIONES_VER_OPERATIVAS = "notificaciones:ver-operativas",
  NOTIFICACIONES_VER_FINANCIERAS = "notificaciones:ver-financieras",
  NOTIFICACIONES_VER_SISTEMA = "notificaciones:ver-sistema",
  NOTIFICACIONES_MARCAR_LEIDA = "notificaciones:marcar-leida",
  NOTIFICACIONES_ADMINISTRAR = "notificaciones:administrar",

  // Sistema
  SISTEMA_ADMIN = "sistema:admin",
  SISTEMA_CONFIGURACION = "sistema:configuracion",
  SISTEMA_USUARIOS = "sistema:usuarios",
  SISTEMA_ROLES = "sistema:roles",

  // Configuracion
  CONFIGURACION_VER = "configuracion:ver",
  CONFIGURACION_EMPRESA_VER = "configuracion:empresa-ver",
  CONFIGURACION_EMPRESA_EDITAR = "configuracion:empresa-editar",
  CONFIGURACION_IMPRESORAS_VER = "configuracion:impresoras-ver",
  CONFIGURACION_IMPRESORAS_EDITAR = "configuracion:impresoras-editar",
  CONFIGURACION_SISTEMA_VER = "configuracion:sistema-ver",
  CONFIGURACION_SISTEMA_EDITAR = "configuracion:sistema-editar",
  CONFIGURACION_INTEGRACIONES_VER = "configuracion:integraciones-ver",
  CONFIGURACION_INTEGRACIONES_EDITAR = "configuracion:integraciones-editar",

  // Auditoria
  AUDITORIA_VER = "auditoria:ver",
  AUDITORIA_VER_ACCIONES_CRITICAS = "auditoria:ver-acciones-criticas",
  AUDITORIA_EXPORTAR = "auditoria:exportar",
  AUDITORIA_USUARIOS_VER = "auditoria:usuarios",
  AUDITORIA_CAJA_VER = "auditoria:caja",
  AUDITORIA_VENTAS_VER = "auditoria:ventas",
  AUDITORIA_FINANZAS_VER = "auditoria:finanzas",

  // Utilidades
  UTILIDADES_VER = "utilidades:ver",
  UTILIDADES_COMPARTIR = "utilidades:compartir",
  UTILIDADES_USAR_CAMARA = "utilidades:usar-camara",
  UTILIDADES_MENU_PRINCIPAL = "utilidades:menu-principal",

  // Perfil
  PERFIL_VER = "perfil:ver",
  PERFIL_EDITAR = "perfil:editar",
}
