/**
 * Ejemplos de uso del Sistema de Usuarios, Roles y Entidades
 * 
 * @description Muestra cómo implementar y usar el nuevo sistema RBAC
 * en diferentes escenarios de un sistema de retail
 */

import { 
  Usuario, 
  CrearUsuario, 
  LoginUsuario, 
  ConfiguracionUsuario 
} from "../interfaces/usuario";

import { 
  Entidad, 
  Rol, 
  Permisos, 
  RolesPredefinidos, 
  SesionContexto 
} from "../interfaces/entidades";

import { 
  Cliente, 
  Personal, 
  Proveedor, 
  CargosPersonal,
  CategoriaCliente, 
  DiaSemana
} from "../interfaces/persons";

import { 
  puede, 
  tieneRol, 
  crearSesionContexto, 
  crearRolPredefinido, 
  requierePermiso, 
  puedeMultiple, 
  obtenerPermisos 
} from "../utils/rbac";

// ========================================
// 1. CREACIÓN DE ROLES PREDEFINIDOS
// ========================================

/**
 * Ejemplo: Crear roles básicos del sistema
 */
export function crearRolesBasicos(): Rol[] {
  return [
    crearRolPredefinido(RolesPredefinidos.ADMIN, "rol_admin_001"),
    crearRolPredefinido(RolesPredefinidos.CAJERO, "rol_cajero_001"),
    crearRolPredefinido(RolesPredefinidos.VENDEDOR, "rol_vendedor_001"),
    crearRolPredefinido(RolesPredefinidos.CLIENTE, "rol_cliente_001"),
    crearRolPredefinido(RolesPredefinidos.PROVEEDOR, "rol_proveedor_001")
  ];
}

// ========================================
// 2. CREACIÓN DE ENTIDADES
// ========================================

/**
 * Ejemplo: Crear un cliente
 */
export function crearEjemploCliente(): Cliente {
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
    categoria: CategoriaCliente.REGULAR,
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
export function crearEjemploPersonal(): Personal {
  return {
    id: "per_001",
    tipo: "Personal",
    nombres: "María Elena Rodríguez",
    cargo: CargosPersonal.CAJERO,
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
      diasTrabajo: [DiaSemana.LUNES, DiaSemana.MARTES, DiaSemana.MIERCOLES, DiaSemana.JUEVES, DiaSemana.VIERNES],
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
export function crearUsuarioCliente(): Usuario {
  const cliente = crearEjemploCliente();
  const rolCliente = crearRolPredefinido(RolesPredefinidos.CLIENTE, "rol_cli_001");

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
export function crearUsuarioCajero(): Usuario {
  const personal = crearEjemploPersonal();
  const rolCajero = crearRolPredefinido(RolesPredefinidos.CAJERO, "rol_caj_001");

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
export function ejemploValidacionCajero() {
  const usuarioCajero = crearUsuarioCajero();
  
  console.log("=== VALIDACIÓN DE PERMISOS - CAJERO ===");
  console.log(`Usuario: ${usuarioCajero.username}`);
  console.log(`¿Puede crear ventas?: ${puede(usuarioCajero, Permisos.VENTAS_CREAR)}`);
  console.log(`¿Puede ver productos?: ${puede(usuarioCajero, Permisos.PRODUCTOS_VER)}`);
  console.log(`¿Puede eliminar ventas?: ${puede(usuarioCajero, Permisos.VENTAS_ELIMINAR)}`);
  console.log(`¿Es administrador?: ${tieneRol(usuarioCajero, RolesPredefinidos.ADMIN)}`);
  console.log(`¿Es cajero?: ${tieneRol(usuarioCajero, RolesPredefinidos.CAJERO)}`);
  
  // Validar múltiples permisos
  const permisosVenta = [Permisos.VENTAS_CREAR, Permisos.PRODUCTOS_VER];
  console.log(`¿Puede hacer ventas completas?: ${puedeMultiple(usuarioCajero, permisosVenta, true)}`);
  
  // Obtener todos los permisos
  console.log(`Todos los permisos:`, obtenerPermisos(usuarioCajero));
}

/**
 * Ejemplo: Validar permisos de un cliente
 */
export function ejemploValidacionCliente() {
  const usuarioCliente = crearUsuarioCliente();
  
  console.log("\n=== VALIDACIÓN DE PERMISOS - CLIENTE ===");
  console.log(`Usuario: ${usuarioCliente.username}`);
  console.log(`¿Puede ver productos?: ${puede(usuarioCliente, Permisos.PRODUCTOS_VER)}`);
  console.log(`¿Puede crear ventas?: ${puede(usuarioCliente, Permisos.VENTAS_CREAR)}`);
  console.log(`¿Puede ver perfil?: ${puede(usuarioCliente, Permisos.PERFIL_VER)}`);
  console.log(`¿Puede editar otros clientes?: ${puede(usuarioCliente, Permisos.CLIENTES_EDITAR)}`);
}

// ========================================
// 5. EJEMPLO DE SESIÓN Y CONTEXTO
// ========================================

/**
 * Ejemplo: Crear sesión de usuario
 */
export function ejemploSesionUsuario() {
  const usuarioCajero = crearUsuarioCajero();
  const sesion = crearSesionContexto(usuarioCajero);
  
  console.log("\n=== CONTEXTO DE SESIÓN ===");
  console.log(`Usuario ID: ${sesion.usuarioId}`);
  console.log(`Entidad activa: ${sesion.entidadActiva.tipo} - ${(sesion.entidadActiva as Personal).nombres}`);
  console.log(`Roles activos: ${sesion.rolesActivos.map(r => r.nombre).join(", ")}`);
  console.log(`Inicio de sesión: ${sesion.inicioSesion.toISOString()}`);
}

// ========================================
// 6. EJEMPLO DE MIDDLEWARE DE PERMISOS
// ========================================

/**
 * Ejemplo: Función que requiere permisos específicos
 */
export function crearVenta(usuario: Usuario, datosVenta: any) {
  // Middleware de validación
  requierePermiso(Permisos.VENTAS_CREAR)(usuario);
  
  console.log(`✅ Usuario ${usuario.username} autorizado para crear venta`);
  console.log(`Creando venta:`, datosVenta);
  
  // Aquí iría la lógica de creación de venta
  return { id: "venta_001", ...datosVenta };
}

/**
 * Ejemplo: Función que requiere múltiples permisos
 */
export function generarReporteVentas(usuario: Usuario) {
  const permisosRequeridos = [Permisos.VENTAS_VER, Permisos.VENTAS_REPORTES];
  
  if (!puedeMultiple(usuario, permisosRequeridos, true)) {
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
export function ejemploCompletoSistemaUsuarios() {
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
  } catch (error: any) {
    console.log("❌ Error:", (error as Error).message);
  }
  
  try {
    // El cliente NO puede crear ventas
    crearVenta(cliente, { producto: "Peras", cantidad: 3 });
  } catch (error: any) {
    console.log("❌ Error esperado:", (error as Error).message);
  }
  
  try {
    // El cajero NO puede generar reportes (no tiene ese permiso)
    generarReporteVentas(cajero);
  } catch (error: any) {
    console.log("❌ Error esperado:", (error as Error).message);
  }
  
  console.log("\n✅ Ejemplo completo finalizado");
}

// ========================================
// 8. CASOS DE USO ESPECÍFICOS
// ========================================

/**
 * Caso de uso: Usuario con múltiples entidades
 */
export function ejemploUsuarioMultipleEntidades() {
  const cliente = crearEjemploCliente();
  const personal = crearEjemploPersonal();
  
  // Usuario que es tanto cliente como empleado
  const usuario: Usuario = {
    id: "usr_multi_001",
    email: "usuario@email.com",
    username: "usuario.multi",
    passwordHash: "hash",
    roles: [
      crearRolPredefinido(RolesPredefinidos.CLIENTE, "rol_cli"),
      crearRolPredefinido(RolesPredefinidos.CAJERO, "rol_caj")
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
  console.log(`¿Puede crear ventas?: ${puede(usuario, Permisos.VENTAS_CREAR)}`);
  console.log(`¿Puede ver productos?: ${puede(usuario, Permisos.PRODUCTOS_VER)}`);
  
  // Crear sesión con entidad específica
  const sesionComoPersonal = crearSesionContexto(usuario, personal.id);
  console.log(`Sesión activa como: ${sesionComoPersonal.entidadActiva.tipo}`);
}

// Ejecutar ejemplo si se llama directamente
if (require.main === module) {
  ejemploCompletoSistemaUsuarios();
  ejemploUsuarioMultipleEntidades();
}
