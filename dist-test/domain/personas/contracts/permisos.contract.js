"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permisos = void 0;
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
var Permisos;
(function (Permisos) {
    // Dashboard / Inicio
    Permisos["DASHBOARD_VER"] = "dashboard:ver";
    Permisos["DASHBOARD_OPERATIVO"] = "dashboard:operativo";
    Permisos["DASHBOARD_FINANCIERO"] = "dashboard:financiero";
    Permisos["DASHBOARD_ADMINISTRATIVO"] = "dashboard:administrativo";
    Permisos["ALERTAS_VER"] = "alertas:ver";
    // Punto de venta
    Permisos["PUNTO_VENTA_VER"] = "punto-venta:ver";
    Permisos["PUNTO_VENTA_CREAR"] = "punto-venta:crear";
    Permisos["PUNTO_VENTA_BUSCAR_PRODUCTOS"] = "punto-venta:buscar-productos";
    Permisos["PUNTO_VENTA_PESAR_PRODUCTOS"] = "punto-venta:pesar-productos";
    Permisos["PUNTO_VENTA_ASIGNAR_CLIENTE"] = "punto-venta:asignar-cliente";
    Permisos["PUNTO_VENTA_APLICAR_DESCUENTO"] = "punto-venta:aplicar-descuento";
    Permisos["PUNTO_VENTA_CAMBIAR_PRECIO"] = "punto-venta:cambiar-precio";
    Permisos["PUNTO_VENTA_ANULAR_ITEM"] = "punto-venta:anular-item";
    Permisos["PUNTO_VENTA_IMPRIMIR_COMPROBANTE"] = "punto-venta:imprimir-comprobante";
    Permisos["PUNTO_VENTA_REIMPRIMIR_COMPROBANTE"] = "punto-venta:reimprimir-comprobante";
    // Ventas
    Permisos["VENTAS_CREAR"] = "ventas:crear";
    Permisos["VENTAS_VER"] = "ventas:ver";
    Permisos["VENTAS_EDITAR"] = "ventas:editar";
    Permisos["VENTAS_ANULAR"] = "ventas:anular";
    Permisos["VENTAS_REPORTES"] = "ventas:reportes";
    Permisos["VENTAS_VER_PROPIAS"] = "ventas:ver-propias";
    Permisos["VENTAS_VER_TODAS"] = "ventas:ver-todas";
    Permisos["VENTAS_VER_DETALLE"] = "ventas:ver-detalle";
    Permisos["VENTAS_ANULAR_PROPIA_RECIENTE"] = "ventas:anular-propia-reciente";
    Permisos["VENTAS_EXPORTAR"] = "ventas:exportar";
    Permisos["VENTAS_VER_UTILIDAD"] = "ventas:ver-utilidad";
    Permisos["VENTAS_VER_COSTO"] = "ventas:ver-costo";
    /** @deprecated Usa `VENTAS_ANULAR` */
    Permisos["VENTAS_ELIMINAR"] = "ventas:anular";
    // Caja
    Permisos["CAJA_VER_PROPIA"] = "caja:ver-propia";
    Permisos["CAJA_VER_TODAS"] = "caja:ver-todas";
    Permisos["CAJA_ABRIR"] = "caja:abrir";
    Permisos["CAJA_CERRAR"] = "caja:cerrar";
    Permisos["CAJA_CERRAR_PROPIA"] = "caja:cerrar-propia";
    Permisos["CAJA_CERRAR_CUALQUIERA"] = "caja:cerrar-cualquiera";
    Permisos["CAJA_ARQUEO"] = "caja:arqueo";
    Permisos["CAJA_ARQUEO_PROPIO"] = "caja:arqueo-propio";
    Permisos["CAJA_SUPERVISAR_ARQUEO"] = "caja:supervisar-arqueo";
    Permisos["CAJA_MOVIMIENTOS"] = "caja:movimientos";
    Permisos["CAJA_ANULAR_MOVIMIENTO"] = "caja:anular-movimiento";
    Permisos["CAJA_VER_HISTORIAL_TURNOS"] = "caja:ver-historial-turnos";
    Permisos["CAJA_VER_DETALLE_TURNO"] = "caja:ver-detalle-turno";
    Permisos["CAJA_EDITAR_TURNO_CERRADO"] = "caja:editar-turno-cerrado";
    Permisos["CAJA_EXPORTAR"] = "caja:exportar";
    // Cuentas y creditos
    Permisos["CUENTAS_VER"] = "cuentas:ver";
    Permisos["CUENTAS_VER_PROPIAS"] = "cuentas:ver-propias";
    Permisos["CUENTAS_VER_TODAS"] = "cuentas:ver-todas";
    Permisos["CUENTAS_CREAR_CREDITO"] = "cuentas:crear-credito";
    Permisos["CUENTAS_REGISTRAR_PAGO"] = "cuentas:registrar-pago";
    Permisos["CUENTAS_EDITAR"] = "cuentas:editar";
    Permisos["CUENTAS_ANULAR"] = "cuentas:anular";
    Permisos["CUENTAS_AJUSTAR_DEUDA"] = "cuentas:ajustar-deuda";
    Permisos["CUENTAS_VER_HISTORIAL"] = "cuentas:ver-historial";
    Permisos["CUENTAS_VER_MOROSIDAD"] = "cuentas:ver-morosidad";
    Permisos["CUENTAS_EXPORTAR"] = "cuentas:exportar";
    // Productos
    Permisos["PRODUCTOS_CREAR"] = "productos:crear";
    Permisos["PRODUCTOS_VER"] = "productos:ver";
    Permisos["PRODUCTOS_EDITAR"] = "productos:editar";
    Permisos["PRODUCTOS_EDITAR_PRECIO"] = "productos:editar-precio";
    Permisos["PRODUCTOS_VER_COSTO"] = "productos:ver-costo";
    Permisos["PRODUCTOS_VER_UTILIDAD"] = "productos:ver-utilidad";
    Permisos["PRODUCTOS_DESACTIVAR"] = "productos:desactivar";
    Permisos["PRODUCTOS_STOCK"] = "productos:stock";
    Permisos["PRODUCTOS_EDITAR_IMAGEN"] = "productos:editar-imagen";
    /** @deprecated Usa `PRODUCTOS_DESACTIVAR` */
    Permisos["PRODUCTOS_ELIMINAR"] = "productos:desactivar";
    Permisos["CATEGORIAS_VER"] = "categorias:ver";
    Permisos["CATEGORIAS_CREAR"] = "categorias:crear";
    Permisos["CATEGORIAS_EDITAR"] = "categorias:editar";
    Permisos["CATEGORIAS_DESACTIVAR"] = "categorias:desactivar";
    // Inventario
    Permisos["INVENTARIO_VER"] = "inventario:ver";
    Permisos["INVENTARIO_VER_BASICO"] = "inventario:ver-basico";
    Permisos["INVENTARIO_VER_TODOS_ALMACENES"] = "inventario:ver-todos-almacenes";
    Permisos["INVENTARIO_AJUSTAR"] = "inventario:ajustar";
    Permisos["INVENTARIO_CONTEO"] = "inventario:conteo";
    Permisos["INVENTARIO_SOLICITAR_AJUSTE"] = "inventario:solicitar-ajuste";
    Permisos["INVENTARIO_APROBAR_AJUSTE"] = "inventario:aprobar-ajuste";
    Permisos["INVENTARIO_TRANSFERIR"] = "inventario:transferir";
    Permisos["INVENTARIO_VER_MERMAS"] = "inventario:ver-mermas";
    Permisos["INVENTARIO_REGISTRAR_MERMA"] = "inventario:registrar-merma";
    Permisos["INVENTARIO_VER_HISTORIAL"] = "inventario:ver-historial";
    Permisos["INVENTARIO_EXPORTAR"] = "inventario:exportar";
    // Almacenes
    Permisos["ALMACENES_VER"] = "almacenes:ver";
    Permisos["ALMACENES_CREAR"] = "almacenes:crear";
    Permisos["ALMACENES_EDITAR"] = "almacenes:editar";
    Permisos["ALMACENES_DESACTIVAR"] = "almacenes:desactivar";
    Permisos["ALMACENES_VER_RECEPCIONES"] = "almacenes:ver-recepciones";
    Permisos["ALMACENES_CREAR_RECEPCION"] = "almacenes:crear-recepcion";
    Permisos["ALMACENES_ANULAR_RECEPCION"] = "almacenes:anular-recepcion";
    Permisos["ALMACENES_VER_TRANSFERENCIAS"] = "almacenes:ver-transferencias";
    Permisos["ALMACENES_CREAR_TRANSFERENCIA"] = "almacenes:crear-transferencia";
    // Clientes
    Permisos["CLIENTES_CREAR"] = "clientes:crear";
    Permisos["CLIENTES_VER"] = "clientes:ver";
    Permisos["CLIENTES_EDITAR"] = "clientes:editar";
    Permisos["CLIENTES_DESACTIVAR"] = "clientes:desactivar";
    Permisos["CLIENTES_VER_DETALLE"] = "clientes:ver-detalle";
    Permisos["CLIENTES_VER_CUENTAS"] = "clientes:ver-cuentas";
    Permisos["CLIENTES_VER_HISTORIAL_COMPRAS"] = "clientes:ver-historial-compras";
    Permisos["CLIENTES_EXPORTAR"] = "clientes:exportar";
    /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
    Permisos["CLIENTES_ELIMINAR"] = "clientes:eliminar";
    // Personal
    Permisos["PERSONAL_CREAR"] = "personal:crear";
    Permisos["PERSONAL_VER"] = "personal:ver";
    Permisos["PERSONAL_EDITAR"] = "personal:editar";
    Permisos["PERSONAL_DESACTIVAR"] = "personal:desactivar";
    Permisos["PERSONAL_VER_DETALLE"] = "personal:ver-detalle";
    Permisos["PERSONAL_ASIGNAR_CARGO"] = "personal:asignar-cargo";
    Permisos["PERSONAL_EXPORTAR"] = "personal:exportar";
    /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
    Permisos["PERSONAL_ELIMINAR"] = "personal:eliminar";
    // Proveedores
    Permisos["PROVEEDORES_CREAR"] = "proveedores:crear";
    Permisos["PROVEEDORES_VER"] = "proveedores:ver";
    Permisos["PROVEEDORES_EDITAR"] = "proveedores:editar";
    Permisos["PROVEEDORES_DESACTIVAR"] = "proveedores:desactivar";
    Permisos["PROVEEDORES_VER_DETALLE"] = "proveedores:ver-detalle";
    Permisos["PROVEEDORES_VER_PAGOS"] = "proveedores:ver-pagos";
    Permisos["PROVEEDORES_VER_HISTORIAL_COMPRAS"] = "proveedores:ver-historial-compras";
    Permisos["PROVEEDORES_EXPORTAR"] = "proveedores:exportar";
    /** @deprecated Evitar eliminar; usar desactivar/anular en la app consumidora */
    Permisos["PROVEEDORES_ELIMINAR"] = "proveedores:eliminar";
    // Compras
    Permisos["COMPRAS_VER"] = "compras:ver";
    Permisos["COMPRAS_CREAR"] = "compras:crear";
    Permisos["COMPRAS_EDITAR"] = "compras:editar";
    Permisos["COMPRAS_APROBAR"] = "compras:aprobar";
    Permisos["COMPRAS_ANULAR"] = "compras:anular";
    Permisos["COMPRAS_RECEPCIONAR"] = "compras:recepcionar";
    Permisos["COMPRAS_VER_COSTOS"] = "compras:ver-costos";
    Permisos["COMPRAS_REGISTRAR_PAGO"] = "compras:registrar-pago";
    Permisos["COMPRAS_VER_PAGOS"] = "compras:ver-pagos";
    Permisos["COMPRAS_EXPORTAR"] = "compras:exportar";
    // Finanzas
    Permisos["FINANZAS_VER"] = "finanzas:ver";
    Permisos["FINANZAS_CREAR"] = "finanzas:crear";
    Permisos["FINANZAS_EDITAR"] = "finanzas:editar";
    Permisos["FINANZAS_REPORTES"] = "finanzas:reportes";
    // Usuarios y accesos
    Permisos["USUARIOS_VER"] = "usuarios:ver";
    Permisos["USUARIOS_CREAR"] = "usuarios:crear";
    Permisos["USUARIOS_EDITAR"] = "usuarios:editar";
    Permisos["USUARIOS_DESACTIVAR"] = "usuarios:desactivar";
    Permisos["USUARIOS_ASOCIAR_PERSONAL"] = "usuarios:asociar-personal";
    Permisos["USUARIOS_ASIGNAR_ROLES"] = "usuarios:asignar-roles";
    Permisos["USUARIOS_RESTABLECER_ACCESO"] = "usuarios:restablecer-acceso";
    Permisos["USUARIOS_VER_SESIONES"] = "usuarios:ver-sesiones";
    // Roles y permisos
    Permisos["ROLES_VER"] = "roles:ver";
    Permisos["ROLES_CREAR"] = "roles:crear";
    Permisos["ROLES_EDITAR"] = "roles:editar";
    Permisos["ROLES_DESACTIVAR"] = "roles:desactivar";
    Permisos["ROLES_EDITAR_PERMISOS"] = "roles:editar-permisos";
    Permisos["ROLES_ASIGNAR"] = "roles:asignar";
    // Reportes y analisis
    Permisos["REPORTES_VER"] = "reportes:ver";
    Permisos["REPORTES_VENTAS_VER"] = "reportes:ventas";
    Permisos["REPORTES_CAJA_VER"] = "reportes:caja";
    Permisos["REPORTES_FINANZAS_VER"] = "reportes:finanzas";
    Permisos["REPORTES_INVENTARIO_VER"] = "reportes:inventario";
    Permisos["REPORTES_COMPRAS_VER"] = "reportes:compras";
    Permisos["REPORTES_CLIENTES_VER"] = "reportes:clientes";
    Permisos["REPORTES_EXPORTAR"] = "reportes:exportar";
    Permisos["ANALISIS_OPERATIVO_VER"] = "analisis:operativo";
    Permisos["ANALISIS_FINANCIERO_VER"] = "analisis:financiero";
    // Pagos
    Permisos["PAGOS_VER"] = "pagos:ver";
    Permisos["PAGOS_VER_DIGITALES"] = "pagos:ver-digitales";
    Permisos["PAGOS_CONFIGURAR_DIGITALES"] = "pagos:configurar-digitales";
    Permisos["PAGOS_CONCILIAR"] = "pagos:conciliar";
    Permisos["PAGOS_ANULAR"] = "pagos:anular";
    // Notificaciones
    Permisos["NOTIFICACIONES_VER"] = "notificaciones:ver";
    Permisos["NOTIFICACIONES_VER_OPERATIVAS"] = "notificaciones:ver-operativas";
    Permisos["NOTIFICACIONES_VER_FINANCIERAS"] = "notificaciones:ver-financieras";
    Permisos["NOTIFICACIONES_VER_SISTEMA"] = "notificaciones:ver-sistema";
    Permisos["NOTIFICACIONES_MARCAR_LEIDA"] = "notificaciones:marcar-leida";
    Permisos["NOTIFICACIONES_ADMINISTRAR"] = "notificaciones:administrar";
    // Sistema
    Permisos["SISTEMA_ADMIN"] = "sistema:admin";
    Permisos["SISTEMA_CONFIGURACION"] = "sistema:configuracion";
    Permisos["SISTEMA_USUARIOS"] = "sistema:usuarios";
    Permisos["SISTEMA_ROLES"] = "sistema:roles";
    // Configuracion
    Permisos["CONFIGURACION_VER"] = "configuracion:ver";
    Permisos["CONFIGURACION_EMPRESA_VER"] = "configuracion:empresa-ver";
    Permisos["CONFIGURACION_EMPRESA_EDITAR"] = "configuracion:empresa-editar";
    Permisos["CONFIGURACION_IMPRESORAS_VER"] = "configuracion:impresoras-ver";
    Permisos["CONFIGURACION_IMPRESORAS_EDITAR"] = "configuracion:impresoras-editar";
    Permisos["CONFIGURACION_SISTEMA_VER"] = "configuracion:sistema-ver";
    Permisos["CONFIGURACION_SISTEMA_EDITAR"] = "configuracion:sistema-editar";
    Permisos["CONFIGURACION_INTEGRACIONES_VER"] = "configuracion:integraciones-ver";
    Permisos["CONFIGURACION_INTEGRACIONES_EDITAR"] = "configuracion:integraciones-editar";
    // Impresoras
    Permisos["IMPRESORAS_VER"] = "impresoras:ver";
    Permisos["IMPRESORAS_CONECTAR"] = "impresoras:conectar";
    Permisos["IMPRESORAS_DESCONECTAR"] = "impresoras:desconectar";
    Permisos["IMPRESORAS_PROBAR"] = "impresoras:probar";
    // Auditoria
    Permisos["AUDITORIA_VER"] = "auditoria:ver";
    Permisos["AUDITORIA_VER_ACCIONES_CRITICAS"] = "auditoria:ver-acciones-criticas";
    Permisos["AUDITORIA_EXPORTAR"] = "auditoria:exportar";
    Permisos["AUDITORIA_USUARIOS_VER"] = "auditoria:usuarios";
    Permisos["AUDITORIA_CAJA_VER"] = "auditoria:caja";
    Permisos["AUDITORIA_VENTAS_VER"] = "auditoria:ventas";
    Permisos["AUDITORIA_FINANZAS_VER"] = "auditoria:finanzas";
    // Utilidades
    Permisos["UTILIDADES_VER"] = "utilidades:ver";
    Permisos["UTILIDADES_COMPARTIR"] = "utilidades:compartir";
    Permisos["UTILIDADES_USAR_CAMARA"] = "utilidades:usar-camara";
    Permisos["UTILIDADES_MENU_PRINCIPAL"] = "utilidades:menu-principal";
    // Perfil
    Permisos["PERFIL_VER"] = "perfil:ver";
    Permisos["PERFIL_EDITAR"] = "perfil:editar";
})(Permisos || (exports.Permisos = Permisos = {}));
