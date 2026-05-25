# Roles, Cargos y Permisos — YolaFresh POS

## 1. Objetivo

Este documento define la estructura funcional de cargos laborales, roles de aplicación y permisos para YolaFresh POS.

La finalidad es ordenar la administración de accesos del sistema, diferenciando claramente el trabajo real de una persona dentro del negocio y el nivel de acceso que tendrá dentro de la aplicación.

---

## 2. Conceptos principales

### Personal

Es la persona real que trabaja en el negocio.

Ejemplo: trabajador, colaborador, encargado, cajero, supervisor o administrador.

### Cargo laboral

Es el puesto o función que cumple una persona dentro del negocio.

Ejemplo: Cajero, Reponedor, Operador de Atención Comercial, Supervisor.

### Usuario de aplicación

Es la cuenta que permite ingresar a la app.

Un usuario debe estar asociado a un personal.

### Rol de aplicación

Es el grupo de accesos que tiene un usuario dentro de la app.

Ejemplo: Admin, Cajero, Ventas, Inventario, Compras.

### Permiso

Es una acción específica que el usuario puede realizar dentro del sistema.

Ejemplo: crear venta, abrir caja, ver productos, registrar compra, ver reportes.

---

## 3. Flujo funcional de registro

El flujo general recomendado es:

1. Registrar al personal.
2. Asignar un cargo laboral al personal.
3. Registrar o crear el usuario de la aplicación.
4. Asociar el usuario con el personal.
5. Asignar uno o varios roles al usuario.
6. El sistema habilita módulos y acciones según los roles asignados.

Ejemplo funcional:

| Elemento | Ejemplo |
|---|---|
| Personal | Juan Pérez |
| Cargo laboral | Operador de Atención Comercial |
| Usuario | Juan Pérez en la app |
| Rol de aplicación | Cajero |
| Accesos principales | Ventas, caja propia, clientes básicos y productos en consulta |

---

# 4. Cargos laborales

Los cargos laborales representan el trabajo real que realiza una persona en YolaFresh.

Un cargo no necesariamente define todo lo que la persona puede hacer en la aplicación. El cargo explica su función laboral; el rol define su acceso en el sistema.

---

## 4.1 Lista oficial de cargos iniciales

| Cargo | Descripción |
|---|---|
| Administrador | Administra el sistema, la operación general, usuarios, accesos y configuración del negocio. |
| Supervisor | Supervisa ventas, caja, inventario, personal operativo y cumplimiento de procedimientos. |
| Operador de Atención Comercial | Atiende clientes, pesa productos, registra ventas, cobra, apoya el despacho y mantiene su estación lista. |
| Cajero | Gestiona cobros, caja, movimientos de efectivo, apertura y cierre de turno. |
| Asistente de Operaciones Comerciales | Apoya la reposición, orden, carga, preparación de pedidos, despacho e inventario operativo. |
| Reponedor | Repone productos, mantiene ordenada la exhibición y asegura disponibilidad de mercadería. |
| Encargado de Compras | Gestiona compras, proveedores, costos, recepción de mercadería y abastecimiento. |
| Encargado de Inventario | Controla stock, conteos, ajustes, mermas, transferencias y revisión física de productos. |
| Encargado de Almacén | Organiza almacenes, recepción, salidas, ubicación y control físico de productos. |
| Despachador | Prepara y entrega mercadería correctamente, cuidando orden, peso, calidad y presentación. |
| Auxiliar Administrativo | Apoya registros, documentación, coordinación interna y tareas administrativas. |
| Contador | Revisa finanzas, egresos, ingresos, reportes, caja histórica, compras y cuentas. |
| Auditor | Revisa historial, movimientos, acciones críticas y cambios importantes del sistema. |
| Soporte Técnico | Revisa aspectos técnicos, impresoras, dispositivos, errores y configuración operativa. |

---

# 5. Roles de aplicación

Los roles de aplicación representan el acceso funcional dentro de la app.

Un usuario puede tener uno o varios roles según sus responsabilidades.

---

## 5.1 Lista oficial de roles iniciales

| Rol | Enfoque |
|---|---|
| Admin | Control total del sistema. |
| Supervisor | Supervisión operativa y control de acciones importantes. |
| Cajero | Caja, cobros, ventas y cierre de turno propio. |
| Ventas | Atención comercial, ventas, clientes y consulta de productos. |
| Operaciones | Reposición, despacho, apoyo físico, preparación y tareas operativas. |
| Inventario | Stock, conteos, ajustes, mermas, almacenes y transferencias. |
| Compras | Compras, proveedores, costos, recepción y abastecimiento. |
| Finanzas | Ingresos, egresos, cuentas, caja histórica y reportes financieros. |
| Contador | Revisión financiera, reportes, compras, cuentas y control contable. |
| Auditor | Revisión y control sin modificación operativa. |
| Soporte Técnico | Configuración técnica, dispositivos, impresoras y soporte operativo. |
| Solo Lectura | Consulta autorizada sin crear, editar, anular ni eliminar registros. |

---

# 6. Permisos por módulo

Los permisos representan acciones específicas que se pueden habilitar o restringir.

---

## 6.1 Dashboard / Inicio

| Permiso | Descripción |
|---|---|
| Ver dashboard | Permite ingresar al inicio de la app. |
| Ver dashboard operativo | Permite ver información básica de operación. |
| Ver dashboard financiero | Permite ver información financiera. |
| Ver dashboard administrativo | Permite ver indicadores generales del negocio. |
| Ver alertas | Permite ver alertas operativas o administrativas. |

---

## 6.2 Punto de Venta

| Permiso | Descripción |
|---|---|
| Ver punto de venta | Permite acceder a la pantalla de venta. |
| Crear venta | Permite registrar una nueva venta. |
| Buscar productos | Permite buscar productos para vender. |
| Pesar productos | Permite registrar productos vendidos por peso. |
| Asignar cliente | Permite asociar un cliente a una venta. |
| Aplicar descuento | Permite aplicar descuentos autorizados. |
| Cambiar precio manualmente | Permite modificar el precio en una venta. |
| Anular producto de venta | Permite retirar un producto de una venta en proceso. |
| Imprimir comprobante | Permite imprimir comprobantes de venta. |
| Reimprimir comprobante | Permite reimprimir comprobantes anteriores. |

---

## 6.3 Ventas

| Permiso | Descripción |
|---|---|
| Crear ventas | Permite registrar ventas. |
| Ver ventas propias | Permite ver ventas realizadas por el mismo usuario. |
| Ver todas las ventas | Permite ver ventas de todos los usuarios. |
| Ver detalle de venta | Permite revisar una venta específica. |
| Editar venta | Permite modificar una venta registrada. |
| Anular venta | Permite anular ventas. |
| Anular venta propia reciente | Permite anular ventas propias dentro de una regla definida. |
| Ver reportes de ventas | Permite revisar reportes comerciales. |
| Exportar ventas | Permite exportar información de ventas. |
| Ver utilidad o margen | Permite ver información sensible de ganancia. |
| Ver costo de venta | Permite ver costos asociados a productos vendidos. |

---

## 6.4 Caja

| Permiso | Descripción |
|---|---|
| Ver caja propia | Permite ver la caja del usuario activo. |
| Ver todas las cajas | Permite ver cajas de otros usuarios o turnos. |
| Abrir caja | Permite iniciar turno de caja. |
| Cerrar caja propia | Permite cerrar la caja del usuario activo. |
| Cerrar cualquier caja | Permite cerrar cajas de otros usuarios. |
| Hacer arqueo propio | Permite hacer arqueo de caja propia. |
| Supervisar arqueo | Permite revisar o validar arqueos. |
| Crear movimiento de caja | Permite registrar entradas o salidas de dinero. |
| Anular movimiento de caja | Permite anular movimientos registrados. |
| Ver historial de turnos | Permite revisar turnos anteriores. |
| Ver detalle de turno | Permite revisar información de un turno específico. |
| Editar turno cerrado | Permite modificar información de un turno finalizado. |
| Exportar caja | Permite exportar información de caja. |

---

## 6.5 Cuentas y créditos

| Permiso | Descripción |
|---|---|
| Ver cuentas | Permite ver cuentas de clientes. |
| Ver cuentas propias | Permite ver cuentas atendidas por el usuario. |
| Ver todas las cuentas | Permite revisar todas las cuentas. |
| Crear crédito | Permite registrar venta o cuenta al crédito. |
| Registrar pago | Permite registrar pagos de clientes. |
| Editar cuenta | Permite modificar información de una cuenta. |
| Anular cuenta | Permite anular una cuenta o movimiento. |
| Ajustar deuda | Permite corregir saldos pendientes. |
| Ver historial de cuenta | Permite revisar movimientos de una cuenta. |
| Ver morosidad | Permite revisar cuentas vencidas o pendientes. |
| Exportar cuentas | Permite exportar información de cuentas. |

---

## 6.6 Productos

| Permiso | Descripción |
|---|---|
| Ver productos | Permite consultar el catálogo. |
| Crear productos | Permite registrar nuevos productos. |
| Editar productos | Permite modificar información general del producto. |
| Editar precio | Permite modificar precios de venta. |
| Ver costo | Permite ver costo de compra. |
| Ver utilidad | Permite ver utilidad o margen. |
| Desactivar producto | Permite ocultar o desactivar un producto. |
| Eliminar producto | Permite eliminar un producto si la política lo permite. |
| Ver stock | Permite consultar stock disponible. |
| Editar imagen | Permite cambiar imagen del producto. |
| Ver categorías | Permite consultar categorías. |
| Crear categorías | Permite crear categorías. |
| Editar categorías | Permite modificar categorías. |
| Desactivar categorías | Permite desactivar categorías. |

---

## 6.7 Inventario

| Permiso | Descripción |
|---|---|
| Ver inventario | Permite consultar inventario. |
| Ver inventario básico | Permite consultar stock limitado. |
| Ver todos los almacenes | Permite consultar stock de todos los almacenes. |
| Realizar conteo | Permite registrar conteos físicos. |
| Solicitar ajuste | Permite solicitar correcciones de inventario. |
| Aprobar ajuste | Permite aprobar ajustes de inventario. |
| Ajustar inventario | Permite modificar stock. |
| Transferir inventario | Permite mover productos entre almacenes. |
| Ver mermas | Permite consultar pérdidas o mermas. |
| Registrar merma | Permite registrar productos perdidos o dañados. |
| Ver historial de inventario | Permite revisar movimientos anteriores. |
| Exportar inventario | Permite exportar información de stock. |

---

## 6.8 Almacenes

| Permiso | Descripción |
|---|---|
| Ver almacenes | Permite consultar almacenes. |
| Crear almacén | Permite registrar un nuevo almacén. |
| Editar almacén | Permite modificar datos de almacén. |
| Desactivar almacén | Permite desactivar un almacén. |
| Ver recepciones | Permite revisar recepciones de mercadería. |
| Crear recepción | Permite registrar recepción de mercadería. |
| Anular recepción | Permite anular una recepción. |
| Ver transferencias | Permite revisar transferencias entre almacenes. |
| Crear transferencia | Permite transferir productos entre almacenes. |

---

## 6.9 Compras

| Permiso | Descripción |
|---|---|
| Ver compras | Permite consultar compras. |
| Crear compra | Permite registrar compras. |
| Editar compra | Permite modificar compras. |
| Aprobar compra | Permite validar compras. |
| Anular compra | Permite anular compras. |
| Recepcionar compra | Permite registrar mercadería recibida. |
| Ver costos | Permite ver costos de compra. |
| Registrar pago | Permite registrar pagos a proveedores. |
| Ver pagos | Permite revisar pagos relacionados a compras. |
| Exportar compras | Permite exportar información de compras. |

---

## 6.10 Clientes

| Permiso | Descripción |
|---|---|
| Ver clientes | Permite consultar clientes. |
| Crear clientes | Permite registrar nuevos clientes. |
| Editar clientes | Permite modificar datos de clientes. |
| Desactivar clientes | Permite desactivar clientes. |
| Ver detalle de cliente | Permite revisar información completa de cliente. |
| Ver cuentas de cliente | Permite revisar cuentas o créditos del cliente. |
| Ver historial de compras | Permite revisar compras realizadas por el cliente. |
| Exportar clientes | Permite exportar información de clientes. |

---

## 6.11 Proveedores

| Permiso | Descripción |
|---|---|
| Ver proveedores | Permite consultar proveedores. |
| Crear proveedores | Permite registrar proveedores. |
| Editar proveedores | Permite modificar proveedores. |
| Desactivar proveedores | Permite desactivar proveedores. |
| Ver detalle de proveedor | Permite revisar información completa del proveedor. |
| Ver pagos de proveedor | Permite consultar pagos realizados o pendientes. |
| Ver historial de compras | Permite revisar compras hechas a un proveedor. |
| Exportar proveedores | Permite exportar información de proveedores. |

---

## 6.12 Personal

| Permiso | Descripción |
|---|---|
| Ver personal | Permite consultar trabajadores registrados. |
| Crear personal | Permite registrar personal. |
| Editar personal | Permite modificar información del personal. |
| Desactivar personal | Permite desactivar personal. |
| Ver detalle de personal | Permite revisar información completa del personal. |
| Asignar cargo | Permite asignar cargo laboral. |
| Exportar personal | Permite exportar información del personal. |

---

## 6.13 Usuarios y accesos

| Permiso | Descripción |
|---|---|
| Ver usuarios | Permite consultar usuarios de la app. |
| Crear usuarios | Permite crear usuarios. |
| Editar usuarios | Permite modificar usuarios. |
| Desactivar usuarios | Permite desactivar usuarios. |
| Asociar usuario con personal | Permite vincular usuario con personal registrado. |
| Asignar roles | Permite asignar roles a usuarios. |
| Restablecer acceso | Permite ayudar a recuperar o restablecer acceso. |
| Ver sesiones | Permite revisar sesiones o accesos activos. |

---

## 6.14 Roles y permisos

| Permiso | Descripción |
|---|---|
| Ver roles | Permite consultar roles existentes. |
| Crear roles | Permite crear nuevos roles. |
| Editar roles | Permite modificar roles. |
| Desactivar roles | Permite desactivar roles. |
| Editar permisos de rol | Permite cambiar permisos asignados a un rol. |
| Asignar roles | Permite asignar roles a usuarios. |

---

## 6.15 Reportes y análisis

| Permiso | Descripción |
|---|---|
| Ver reportes | Permite acceder al área de reportes. |
| Ver reportes de ventas | Permite revisar reportes comerciales. |
| Ver reportes de caja | Permite revisar reportes de caja. |
| Ver reportes financieros | Permite revisar información financiera. |
| Ver reportes de inventario | Permite revisar reportes de stock. |
| Ver reportes de compras | Permite revisar reportes de compras. |
| Ver reportes de clientes | Permite revisar información comercial de clientes. |
| Exportar reportes | Permite descargar o compartir reportes. |
| Ver análisis operativo | Permite ver indicadores operativos. |
| Ver análisis financiero | Permite ver indicadores financieros. |

---

## 6.16 Pagos

| Permiso | Descripción |
|---|---|
| Ver pagos | Permite revisar pagos registrados. |
| Ver pagos digitales | Permite consultar pagos por billeteras o medios digitales. |
| Configurar pagos digitales | Permite configurar medios de pago. |
| Conciliar pagos | Permite validar pagos con registros internos. |
| Anular pago | Permite anular un pago registrado. |

---

## 6.17 Notificaciones

| Permiso | Descripción |
|---|---|
| Ver notificaciones | Permite ver el centro de notificaciones. |
| Ver notificaciones operativas | Permite ver alertas de operación. |
| Ver notificaciones financieras | Permite ver alertas relacionadas al dinero. |
| Ver notificaciones del sistema | Permite ver alertas técnicas o administrativas. |
| Marcar notificación como leída | Permite gestionar lectura de notificaciones. |
| Administrar notificaciones | Permite configurar o gestionar notificaciones. |

---

## 6.18 Configuración

| Permiso | Descripción |
|---|---|
| Ver configuración | Permite acceder al área de configuración. |
| Ver datos de empresa | Permite consultar información de empresa. |
| Editar datos de empresa | Permite modificar información de empresa. |
| Ver impresoras | Permite consultar impresoras configuradas. |
| Editar impresoras | Permite configurar impresoras. |
| Ver configuración del sistema | Permite consultar configuración general. |
| Editar configuración del sistema | Permite modificar configuración general. |
| Ver integraciones | Permite consultar integraciones externas. |
| Editar integraciones | Permite configurar integraciones externas. |

---

## 6.19 Auditoría

| Permiso | Descripción |
|---|---|
| Ver auditoría | Permite acceder al historial de auditoría. |
| Ver acciones críticas | Permite revisar acciones sensibles. |
| Exportar auditoría | Permite exportar registros de auditoría. |
| Ver auditoría de usuarios | Permite revisar cambios de usuarios y accesos. |
| Ver auditoría de caja | Permite revisar cambios o movimientos de caja. |
| Ver auditoría de ventas | Permite revisar acciones sobre ventas. |
| Ver auditoría financiera | Permite revisar acciones financieras. |

---

## 6.20 Utilidades

| Permiso | Descripción |
|---|---|
| Ver utilidades | Permite acceder a herramientas auxiliares. |
| Compartir vista | Permite usar funciones de compartir información. |
| Usar cámara | Permite usar cámara dentro de la app. |
| Ver menú principal | Permite acceder al menú principal de navegación. |

---

# 7. Matriz general por rol

## 7.1 Admin

Acceso completo al sistema.

Puede administrar usuarios, roles, permisos, configuración, ventas, caja, productos, compras, inventario, finanzas, reportes, auditoría e integraciones.

---

## 7.2 Supervisor

Acceso alto de operación.

Puede supervisar ventas, caja, inventario, compras, clientes, proveedores, reportes operativos, notificaciones y aprobaciones.

No debe tener control total sobre configuración crítica, roles principales o permisos del sistema salvo autorización especial.

---

## 7.3 Cajero

Acceso enfocado en caja y venta.

Puede usar punto de venta, crear ventas, cobrar, abrir caja, cerrar caja propia, registrar movimientos permitidos, consultar clientes y consultar productos.

No debe ver costos, utilidad, configuración, roles, usuarios ni reportes financieros globales.

---

## 7.4 Ventas

Acceso enfocado en atención comercial.

Puede vender, consultar productos, registrar clientes, asociar clientes a ventas y revisar sus ventas propias.

No debe manejar caja avanzada, reportes financieros, costos, compras ni configuración.

---

## 7.5 Operaciones

Acceso enfocado en operación física.

Puede consultar productos, apoyar inventario básico, registrar conteos o mermas permitidas, apoyar almacenes, despacho y reposición.

No debe ver finanzas, utilidad, caja completa ni configuración.

---

## 7.6 Inventario

Acceso enfocado en stock.

Puede ver inventario, realizar conteos, solicitar o aprobar ajustes según autorización, registrar mermas, revisar almacenes, transferencias e historial de inventario.

No debe administrar usuarios, roles, finanzas ni configuración crítica.

---

## 7.7 Compras

Acceso enfocado en abastecimiento.

Puede ver compras, registrar compras, gestionar proveedores, recepcionar mercadería, revisar costos y pagos relacionados a proveedores.

No debe administrar caja diaria ni usuarios del sistema.

---

## 7.8 Finanzas

Acceso enfocado en control financiero.

Puede revisar caja histórica, ingresos, egresos, cuentas, reportes financieros, pagos, compras y ventas en modo financiero.

No necesariamente debe operar punto de venta ni modificar productos.

---

## 7.9 Contador

Acceso enfocado en revisión contable.

Puede revisar reportes, caja, ventas, compras, pagos, cuentas, proveedores y exportar información contable.

No debe operar ventas ni hacer cambios comerciales salvo autorización.

---

## 7.10 Auditor

Acceso de revisión.

Puede revisar historial, auditoría, ventas, caja, compras, inventario, usuarios y acciones críticas.

No debe crear, editar, anular ni eliminar registros operativos.

---

## 7.11 Soporte Técnico

Acceso técnico limitado.

Puede revisar configuración técnica, impresoras, dispositivos, estado de la app, utilidades e incidencias.

No debe ver información financiera sensible salvo autorización.

---

## 7.12 Solo Lectura

Acceso de consulta.

Puede ver información autorizada, pero no puede crear, editar, anular, eliminar ni aprobar registros.

---

# 8. Relación sugerida entre cargos y roles

| Cargo laboral | Roles sugeridos |
|---|---|
| Administrador | Admin |
| Supervisor | Supervisor |
| Operador de Atención Comercial | Ventas, Cajero |
| Cajero | Cajero |
| Asistente de Operaciones Comerciales | Operaciones |
| Reponedor | Operaciones |
| Encargado de Compras | Compras |
| Encargado de Inventario | Inventario |
| Encargado de Almacén | Inventario, Operaciones |
| Despachador | Operaciones, Ventas |
| Auxiliar Administrativo | Finanzas, Solo Lectura |
| Contador | Contador, Finanzas |
| Auditor | Auditor |
| Soporte Técnico | Soporte Técnico |

---

# 9. Acciones críticas

Las siguientes acciones deben tratarse como sensibles dentro del sistema:

| Acción crítica | Motivo |
|---|---|
| Cambiar roles | Puede entregar accesos indebidos. |
| Crear usuario | Permite acceso al sistema. |
| Desactivar usuario | Bloquea acceso de una persona. |
| Asignar permisos | Cambia el nivel de control del usuario. |
| Editar precios | Afecta ventas y utilidad. |
| Ver costos | Expone información sensible del negocio. |
| Anular ventas | Afecta dinero, caja y reportes. |
| Editar ventas cerradas | Cambia registros ya finalizados. |
| Abrir caja | Inicia responsabilidad de dinero. |
| Cerrar caja | Finaliza control de dinero. |
| Editar turno cerrado | Cambia información histórica. |
| Registrar egreso | Afecta salida de dinero. |
| Anular egreso | Cambia registros financieros. |
| Ajustar inventario | Afecta stock real. |
| Aprobar compra | Afecta costos y abastecimiento. |
| Anular compra | Afecta stock, proveedor y reportes. |
| Editar configuración | Puede afectar el funcionamiento del sistema. |
| Modificar integraciones | Puede afectar servicios externos. |
| Exportar reportes sensibles | Expone información del negocio. |

---

# 10. Reglas funcionales de acceso

1. Un usuario puede tener más de un rol.
2. Un cargo laboral no reemplaza al rol de aplicación.
3. El cargo explica la función laboral.
4. El rol define los accesos dentro de la app.
5. Las acciones críticas deben estar limitadas a roles autorizados.
6. Los roles deben poder ajustarse según la necesidad real del negocio.
7. La información sensible como costos, utilidad, caja histórica y reportes financieros debe protegerse.
8. Los usuarios operativos deben ver solo lo necesario para realizar su trabajo.
9. Los usuarios administrativos pueden tener mayor visibilidad según su responsabilidad.
10. Las acciones de consulta deben separarse de acciones de creación, edición, anulación o aprobación.

---

# 11. Resumen final

La estructura funcional recomendada para YolaFresh POS es:

| Nivel | Función |
|---|---|
| Personal | Representa a la persona real. |
| Cargo | Representa su puesto laboral. |
| Usuario | Representa su acceso a la app. |
| Rol | Representa su nivel de acceso. |
| Permiso | Representa cada acción permitida. |

Ejemplo final:

| Elemento | Ejemplo |
|---|---|
| Personal | Pedro Ramos |
| Cargo | Operador de Atención Comercial |
| Usuario | Pedro en la aplicación |
| Rol | Cajero |
| Accesos | Venta, cobro, caja propia, clientes básicos y productos en consulta |

Esta estructura permite ordenar el sistema sin mezclar funciones laborales con accesos digitales.
