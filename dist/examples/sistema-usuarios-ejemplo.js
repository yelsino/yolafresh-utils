"use strict";
/**
 * Ejemplos de uso del Sistema de Usuarios, Roles y Entidades
 *
 * @description Muestra cómo implementar y usar el nuevo sistema RBAC
 * en diferentes escenarios de un sistema de retail
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearRolesBasicos = crearRolesBasicos;
exports.crearEjemploCliente = crearEjemploCliente;
exports.crearEjemploPersonal = crearEjemploPersonal;
exports.crearUsuarioCliente = crearUsuarioCliente;
exports.crearUsuarioCajero = crearUsuarioCajero;
exports.ejemploValidacionCajero = ejemploValidacionCajero;
exports.ejemploValidacionCliente = ejemploValidacionCliente;
exports.ejemploSesionUsuario = ejemploSesionUsuario;
exports.crearVenta = crearVenta;
exports.generarReporteVentas = generarReporteVentas;
exports.ejemploCompletoSistemaUsuarios = ejemploCompletoSistemaUsuarios;
exports.ejemploUsuarioMultipleEntidades = ejemploUsuarioMultipleEntidades;
const entidades_1 = require("../interfaces/entidades");
const persons_1 = require("../interfaces/persons");
const rbac_1 = require("../utils/rbac");
// ========================================
// 1. CREACIÓN DE ROLES PREDEFINIDOS
// ========================================
/**
 * Ejemplo: Crear roles básicos del sistema
 */
function crearRolesBasicos() {
    return [
        (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.ADMIN, "rol_admin_001"),
        (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.CAJERO, "rol_cajero_001"),
        (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.VENDEDOR, "rol_vendedor_001"),
        (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.CLIENTE, "rol_cliente_001"),
        (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.PROVEEDOR, "rol_proveedor_001")
    ];
}
// ========================================
// 2. CREACIÓN DE ENTIDADES
// ========================================
/**
 * Ejemplo: Crear un cliente
 */
function crearEjemploCliente() {
    return {
        id: "cli_001",
        tipo: "Cliente",
        nombres: "Juan Carlos",
        apellidos: "Pérez García",
        celular: "+51987654321",
        correo: "juan@email.com",
        dni: "12345678",
        direccion: "Av. Principal 123, Lima",
        pseudonimo: "Juan P.",
        creditosPendientes: 0,
        limiteCredito: 500,
        historialCompras: [],
        totalGastado: 0,
        categoria: persons_1.CategoriaCliente.REGULAR,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        activo: true,
        preferencias: {
            metodoPagoPreferido: "efectivo",
            horarioPreferido: "mañana",
            productosFavoritos: [],
            recibirPromociones: true,
            notificacionesWhatsApp: true
        }
    };
}
/**
 * Ejemplo: Crear personal (cajero)
 */
function crearEjemploPersonal() {
    return {
        id: "per_001",
        tipo: "Personal",
        nombres: "María Elena Rodríguez",
        cargo: persons_1.CargosPersonal.CAJERO,
        dni: "87654321",
        celular: "+51987654322",
        direccion: "Jr. Los Olivos 456, Lima",
        area: "Ventas",
        salario: 1200,
        fechaContratacion: new Date("2023-01-15"),
        fechaCreacion: new Date("2023-01-15"),
        fechaActualizacion: new Date(),
        activo: true,
        horarioTrabajo: {
            horaEntrada: "08:00",
            horaSalida: "17:00",
            diasTrabajo: [persons_1.DiaSemana.LUNES, persons_1.DiaSemana.MARTES, persons_1.DiaSemana.MIERCOLES, persons_1.DiaSemana.JUEVES, persons_1.DiaSemana.VIERNES],
            descansos: [{
                    horaInicio: "12:00",
                    horaFin: "13:00",
                    descripcion: "Almuerzo"
                }]
        }
    };
}
// ========================================
// 3. CREACIÓN DE USUARIOS
// ========================================
/**
 * Ejemplo: Crear usuario cliente
 */
function crearUsuarioCliente() {
    const cliente = crearEjemploCliente();
    const rolCliente = (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.CLIENTE, "rol_cli_001");
    return {
        id: "usr_cliente_001",
        email: "juan@email.com",
        username: "juan.perez",
        passwordHash: "hashed_password_here",
        roles: [rolCliente],
        entidades: [cliente],
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        intentosFallidos: 0,
        cuentaBloqueada: false,
        emailVerificado: true,
        configuraciones: {
            idioma: "es",
            zonaHoraria: "America/Lima",
            tema: "claro",
            notificaciones: {
                email: true,
                push: true,
                ventas: false,
                stockBajo: false,
                nuevosClientes: false
            },
            entidadPredeterminada: cliente.id
        }
    };
}
/**
 * Ejemplo: Crear usuario cajero (personal)
 */
function crearUsuarioCajero() {
    const personal = crearEjemploPersonal();
    const rolCajero = (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.CAJERO, "rol_caj_001");
    return {
        id: "usr_cajero_001",
        email: "maria.cajero@tienda.com",
        username: "maria.cajero",
        passwordHash: "hashed_password_here",
        roles: [rolCajero],
        entidades: [personal],
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        intentosFallidos: 0,
        cuentaBloqueada: false,
        emailVerificado: true,
        configuraciones: {
            idioma: "es",
            zonaHoraria: "America/Lima",
            tema: "claro",
            notificaciones: {
                email: true,
                push: true,
                ventas: true,
                stockBajo: true,
                nuevosClientes: true
            },
            entidadPredeterminada: personal.id
        }
    };
}
// ========================================
// 4. EJEMPLOS DE VALIDACIÓN DE PERMISOS
// ========================================
/**
 * Ejemplo: Validar permisos de un cajero
 */
function ejemploValidacionCajero() {
    const usuarioCajero = crearUsuarioCajero();
    console.log("=== VALIDACIÓN DE PERMISOS - CAJERO ===");
    console.log(`Usuario: ${usuarioCajero.username}`);
    console.log(`¿Puede crear ventas?: ${(0, rbac_1.puede)(usuarioCajero, entidades_1.Permisos.VENTAS_CREAR)}`);
    console.log(`¿Puede ver productos?: ${(0, rbac_1.puede)(usuarioCajero, entidades_1.Permisos.PRODUCTOS_VER)}`);
    console.log(`¿Puede eliminar ventas?: ${(0, rbac_1.puede)(usuarioCajero, entidades_1.Permisos.VENTAS_ELIMINAR)}`);
    console.log(`¿Es administrador?: ${(0, rbac_1.tieneRol)(usuarioCajero, entidades_1.RolesPredefinidos.ADMIN)}`);
    console.log(`¿Es cajero?: ${(0, rbac_1.tieneRol)(usuarioCajero, entidades_1.RolesPredefinidos.CAJERO)}`);
    // Validar múltiples permisos
    const permisosVenta = [entidades_1.Permisos.VENTAS_CREAR, entidades_1.Permisos.PRODUCTOS_VER];
    console.log(`¿Puede hacer ventas completas?: ${(0, rbac_1.puedeMultiple)(usuarioCajero, permisosVenta, true)}`);
    // Obtener todos los permisos
    console.log(`Todos los permisos:`, (0, rbac_1.obtenerPermisos)(usuarioCajero));
}
/**
 * Ejemplo: Validar permisos de un cliente
 */
function ejemploValidacionCliente() {
    const usuarioCliente = crearUsuarioCliente();
    console.log("\n=== VALIDACIÓN DE PERMISOS - CLIENTE ===");
    console.log(`Usuario: ${usuarioCliente.username}`);
    console.log(`¿Puede ver productos?: ${(0, rbac_1.puede)(usuarioCliente, entidades_1.Permisos.PRODUCTOS_VER)}`);
    console.log(`¿Puede crear ventas?: ${(0, rbac_1.puede)(usuarioCliente, entidades_1.Permisos.VENTAS_CREAR)}`);
    console.log(`¿Puede ver perfil?: ${(0, rbac_1.puede)(usuarioCliente, entidades_1.Permisos.PERFIL_VER)}`);
    console.log(`¿Puede editar otros clientes?: ${(0, rbac_1.puede)(usuarioCliente, entidades_1.Permisos.CLIENTES_EDITAR)}`);
}
// ========================================
// 5. EJEMPLO DE SESIÓN Y CONTEXTO
// ========================================
/**
 * Ejemplo: Crear sesión de usuario
 */
function ejemploSesionUsuario() {
    const usuarioCajero = crearUsuarioCajero();
    const sesion = (0, rbac_1.crearSesionContexto)(usuarioCajero);
    console.log("\n=== CONTEXTO DE SESIÓN ===");
    console.log(`Usuario ID: ${sesion.usuarioId}`);
    console.log(`Entidad activa: ${sesion.entidadActiva.tipo} - ${sesion.entidadActiva.nombres}`);
    console.log(`Roles activos: ${sesion.rolesActivos.map(r => r.nombre).join(", ")}`);
    console.log(`Inicio de sesión: ${sesion.inicioSesion.toISOString()}`);
}
// ========================================
// 6. EJEMPLO DE MIDDLEWARE DE PERMISOS
// ========================================
/**
 * Ejemplo: Función que requiere permisos específicos
 */
function crearVenta(usuario, datosVenta) {
    // Middleware de validación
    (0, rbac_1.requierePermiso)(entidades_1.Permisos.VENTAS_CREAR)(usuario);
    console.log(`✅ Usuario ${usuario.username} autorizado para crear venta`);
    console.log(`Creando venta:`, datosVenta);
    // Aquí iría la lógica de creación de venta
    return { id: "venta_001", ...datosVenta };
}
/**
 * Ejemplo: Función que requiere múltiples permisos
 */
function generarReporteVentas(usuario) {
    const permisosRequeridos = [entidades_1.Permisos.VENTAS_VER, entidades_1.Permisos.VENTAS_REPORTES];
    if (!(0, rbac_1.puedeMultiple)(usuario, permisosRequeridos, true)) {
        throw new Error("No tienes permisos suficientes para generar reportes de ventas");
    }
    console.log(`✅ Usuario ${usuario.username} autorizado para generar reportes`);
    // Aquí iría la lógica de generación de reportes
    return { reporte: "datos_del_reporte" };
}
// ========================================
// 7. EJEMPLO COMPLETO DE USO
// ========================================
/**
 * Ejemplo completo mostrando el flujo de trabajo
 */
function ejemploCompletoSistemaUsuarios() {
    console.log("🚀 EJEMPLO COMPLETO DEL SISTEMA DE USUARIOS\n");
    // 1. Crear usuarios
    const cajero = crearUsuarioCajero();
    const cliente = crearUsuarioCliente();
    // 2. Validar permisos
    ejemploValidacionCajero();
    ejemploValidacionCliente();
    // 3. Crear sesión
    ejemploSesionUsuario();
    // 4. Probar operaciones con permisos
    console.log("\n=== OPERACIONES CON PERMISOS ===");
    try {
        // El cajero puede crear ventas
        const venta = crearVenta(cajero, { producto: "Manzanas", cantidad: 5 });
        console.log("Venta creada:", venta);
    }
    catch (error) {
        console.log("❌ Error:", error.message);
    }
    try {
        // El cliente NO puede crear ventas
        crearVenta(cliente, { producto: "Peras", cantidad: 3 });
    }
    catch (error) {
        console.log("❌ Error esperado:", error.message);
    }
    try {
        // El cajero NO puede generar reportes (no tiene ese permiso)
        generarReporteVentas(cajero);
    }
    catch (error) {
        console.log("❌ Error esperado:", error.message);
    }
    console.log("\n✅ Ejemplo completo finalizado");
}
// ========================================
// 8. CASOS DE USO ESPECÍFICOS
// ========================================
/**
 * Caso de uso: Usuario con múltiples entidades
 */
function ejemploUsuarioMultipleEntidades() {
    const cliente = crearEjemploCliente();
    const personal = crearEjemploPersonal();
    // Usuario que es tanto cliente como empleado
    const usuario = {
        id: "usr_multi_001",
        email: "usuario@email.com",
        username: "usuario.multi",
        passwordHash: "hash",
        roles: [
            (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.CLIENTE, "rol_cli"),
            (0, rbac_1.crearRolPredefinido)(entidades_1.RolesPredefinidos.CAJERO, "rol_caj")
        ],
        entidades: [cliente, personal],
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        intentosFallidos: 0,
        cuentaBloqueada: false,
        emailVerificado: true
    };
    console.log("\n=== USUARIO CON MÚLTIPLES ENTIDADES ===");
    console.log(`Usuario: ${usuario.username}`);
    console.log(`Entidades: ${usuario.entidades.map(e => e.tipo).join(", ")}`);
    console.log(`Roles: ${usuario.roles.map(r => r.nombre).join(", ")}`);
    console.log(`¿Puede crear ventas?: ${(0, rbac_1.puede)(usuario, entidades_1.Permisos.VENTAS_CREAR)}`);
    console.log(`¿Puede ver productos?: ${(0, rbac_1.puede)(usuario, entidades_1.Permisos.PRODUCTOS_VER)}`);
    // Crear sesión con entidad específica
    const sesionComoPersonal = (0, rbac_1.crearSesionContexto)(usuario, personal.id);
    console.log(`Sesión activa como: ${sesionComoPersonal.entidadActiva.tipo}`);
}
// Ejecutar ejemplo si se llama directamente
if (require.main === module) {
    ejemploCompletoSistemaUsuarios();
    ejemploUsuarioMultipleEntidades();
}
