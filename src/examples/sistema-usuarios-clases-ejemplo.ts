/**
 * Ejemplos de uso del Sistema de Usuarios con CLASES
 * 
 * @description Muestra cómo usar las clases Usuario, UsuarioManager, 
 * SesionManager y PermisoValidator en escenarios reales
 */

import { Usuario } from "../class/Usuario";
import { UsuarioManager } from "../class/UsuarioManager";
import { SesionManager } from "../class/SesionManager";
import { PermisoValidator, ContextoValidacion } from "../class/PermisoValidator";

import { 
  CrearUsuario,
  LoginUsuario,
  ConfiguracionUsuario 
} from "../interfaces/usuario";

import { 
  Permisos, 
  RolesPredefinidos 
} from "../interfaces/entidades";

import { 
  Cliente, 
  Personal, 
  CargosPersonal,
  CategoriaCliente,
  DiaSemana
} from "../interfaces/persons";

import { crearRolPredefinido } from "../utils/rbac";

// ========================================
// 1. CONFIGURACIÓN INICIAL DEL SISTEMA
// ========================================

/**
 * Inicializa el sistema completo de usuarios
 */
export function inicializarSistemaUsuarios(): UsuarioManager {
  console.log("🚀 Inicializando Sistema de Usuarios con Clases");
  
  // Configurar el UsuarioManager
  const usuarioManager = new UsuarioManager({
    auditoria: true,
    cache: true,
    tiempoVidaCache: 30, // 30 minutos
    sesiones: {
      tiempoExpiracionToken: 60, // 1 hora
      tiempoExpiracionRefresh: 7 * 24 * 60, // 7 días
      permitirSesionesConcurrentes: true,
      maxSesionesConcurrentes: 3
    }
  });

  console.log("✅ UsuarioManager configurado");
  console.log("✅ SesionManager integrado");
  console.log("✅ PermisoValidator activado");
  
  return usuarioManager;
}

// ========================================
// 2. CREACIÓN DE DATOS DE EJEMPLO
// ========================================

/**
 * Crea entidades de ejemplo
 */
export function crearEntidadesEjemplo() {
  // Cliente ejemplo
  const cliente: Cliente = {
    id: "cli_001",
    tipo: "Cliente",
    nombres: "Ana María",
    apellidos: "González López",
    celular: "+51987654321",
    correo: "ana@email.com",
    dni: "12345678",
    direccion: "Av. Principal 123, Lima",
    pseudonimo: "Ana G.",
    creditosPendientes: 0,
    limiteCredito: 1000,
    historialCompras: [],
    totalGastado: 0,
    categoria: CategoriaCliente.VIP,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    activo: true,
    preferencias: {
      metodoPagoPreferido: "tarjeta",
      horarioPreferido: "tarde",
      productosFavoritos: ["prod_001", "prod_002"],
      recibirPromociones: true,
      notificacionesWhatsApp: true
    }
  };

  // Personal ejemplo
  const personal: Personal = {
    id: "per_001",
    tipo: "Personal",
    nombres: "Carlos Eduardo Ramírez",
    cargo: CargosPersonal.CAJERO,
    dni: "87654321",
    celular: "+51987654322",
    direccion: "Jr. Los Olivos 456, Lima",
    area: "Ventas",
    salario: 1500,
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

  return { cliente, personal };
}

/**
 * Crea roles de ejemplo
 */
export function crearRolesEjemplo() {
  return {
    rolAdmin: crearRolPredefinido(RolesPredefinidos.ADMIN, "rol_admin_001"),
    rolCajero: crearRolPredefinido(RolesPredefinidos.CAJERO, "rol_cajero_001"),
    rolCliente: crearRolPredefinido(RolesPredefinidos.CLIENTE, "rol_cliente_001")
  };
}

// ========================================
// 3. EJEMPLO COMPLETO - FLUJO DE TRABAJO
// ========================================

/**
 * Ejemplo completo mostrando todo el flujo de trabajo
 */
export async function ejemploCompletoConClases() {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 EJEMPLO COMPLETO CON CLASES");
  console.log("=".repeat(60));

  // 1. Inicializar sistema
  const usuarioManager = inicializarSistemaUsuarios();
  const { cliente, personal } = crearEntidadesEjemplo();
  const { rolAdmin, rolCajero, rolCliente } = crearRolesEjemplo();

  try {
    // ========================================
    // PASO 1: CREAR USUARIO ADMINISTRADOR
    // ========================================
    console.log("\n📝 PASO 1: Creando usuario administrador...");
    
    const datosAdmin: CrearUsuario = {
      email: "admin@tienda.com",
      username: "admin",
      password: "admin123456",
      roleIds: [rolAdmin.id],
      entidadIds: []
    };

    const resultadoAdmin = await usuarioManager.crearUsuario(
      datosAdmin,
      [rolAdmin],
      [] // Admin no necesita entidades específicas
    );

    if (!resultadoAdmin.exito) {
      throw new Error(`Error creando admin: ${resultadoAdmin.mensaje}`);
    }

    const usuarioAdmin = resultadoAdmin.datos!;
    console.log(`✅ Admin creado: ${usuarioAdmin.username} (${usuarioAdmin.id})`);

    // ========================================
    // PASO 2: CREAR USUARIO CAJERO
    // ========================================
    console.log("\n👨‍💼 PASO 2: Creando usuario cajero...");
    
    const datosCajero: CrearUsuario = {
      email: "carlos@tienda.com",
      username: "carlos.cajero",
      password: "cajero123",
      roleIds: [rolCajero.id],
      entidadIds: [personal.id]
    };

    const resultadoCajero = await usuarioManager.crearUsuario(
      datosCajero,
      [rolCajero],
      [personal],
      usuarioAdmin // Creado por el admin
    );

    if (!resultadoCajero.exito) {
      throw new Error(`Error creando cajero: ${resultadoCajero.mensaje}`);
    }

    const usuarioCajero = resultadoCajero.datos!;
    console.log(`✅ Cajero creado: ${usuarioCajero.username} (${usuarioCajero.id})`);
    console.log(`   📋 Roles: ${usuarioCajero.roles.map(r => r.nombre).join(", ")}`);
    console.log(`   🏢 Entidades: ${usuarioCajero.entidades.map(e => e.tipo).join(", ")}`);

    // ========================================
    // PASO 3: CREAR USUARIO CLIENTE
    // ========================================
    console.log("\n👤 PASO 3: Creando usuario cliente...");
    
    const datosCliente: CrearUsuario = {
      email: "ana@email.com",
      username: "ana.cliente",
      password: "cliente123",
      roleIds: [rolCliente.id],
      entidadIds: [cliente.id]
    };

    const resultadoCliente = await usuarioManager.crearUsuario(
      datosCliente,
      [rolCliente],
      [cliente],
      usuarioAdmin
    );

    if (!resultadoCliente.exito) {
      throw new Error(`Error creando cliente: ${resultadoCliente.mensaje}`);
    }

    const usuarioCliente = resultadoCliente.datos!;
    console.log(`✅ Cliente creado: ${usuarioCliente.username} (${usuarioCliente.id})`);
    console.log(`   📝 Nombre completo: ${usuarioCliente.obtenerNombreCompleto()}`);

    // ========================================
    // PASO 4: AUTENTICACIÓN DEL CAJERO
    // ========================================
    console.log("\n🔐 PASO 4: Autenticando cajero...");
    
    const credencialesCajero: LoginUsuario = {
      identificador: "carlos.cajero",
      password: "cajero123",
      entidadId: personal.id
    };

    const resultadoLogin = await usuarioManager.autenticar(credencialesCajero);
    
    if (!resultadoLogin.exito) {
      throw new Error(`Error en login: ${resultadoLogin.mensaje}`);
    }

    const loginRespuesta = resultadoLogin.datos!;
    console.log(`✅ Login exitoso para: ${loginRespuesta.usuario.username}`);
    console.log(`   🎫 Token: ${loginRespuesta.token.substring(0, 20)}...`);
    console.log(`   ⏰ Expira en: ${Math.round(loginRespuesta.expiraEn / 1000 / 60)} minutos`);
    console.log(`   🏢 Entidad activa: ${loginRespuesta.sesion.entidadActiva.tipo}`);

    // ========================================
    // PASO 5: VALIDACIONES DE PERMISOS
    // ========================================
    console.log("\n✅ PASO 5: Validando permisos...");
    
    const validator = usuarioManager.validadorPermisos;
    
    // Validar permisos del cajero
    const contextoCajero: ContextoValidacion = {
      usuario: usuarioCajero,
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0..."
    };

    console.log("\n🔍 Validaciones para CAJERO:");
    
    // Puede crear ventas
    const puedeCrearVentas = await validator.validarOperacionVenta('crear', contextoCajero);
    console.log(`   💰 Crear ventas: ${puedeCrearVentas.permitido ? '✅' : '❌'} ${puedeCrearVentas.mensaje || ''}`);

    // Puede ver productos
    const puedeVerProductos = await validator.validarOperacionProducto('ver', contextoCajero);
    console.log(`   📦 Ver productos: ${puedeVerProductos.permitido ? '✅' : '❌'} ${puedeVerProductos.mensaje || ''}`);

    // NO puede eliminar productos
    const puedeEliminarProductos = await validator.validarOperacionProducto('eliminar', contextoCajero);
    console.log(`   🗑️ Eliminar productos: ${puedeEliminarProductos.permitido ? '✅' : '❌'} ${puedeEliminarProductos.mensaje || ''}`);

    // NO puede operaciones financieras
    const puedeFinanzas = await validator.validarOperacionFinanciera('ver', contextoCajero);
    console.log(`   💼 Ver finanzas: ${puedeFinanzas.permitido ? '✅' : '❌'} ${puedeFinanzas.mensaje || ''}`);

    // Validar permisos del cliente
    const contextoCliente: ContextoValidacion = {
      usuario: usuarioCliente
    };

    console.log("\n🔍 Validaciones para CLIENTE:");
    
    // Puede ver productos
    const clientePuedeVerProductos = await validator.validarOperacionProducto('ver', contextoCliente);
    console.log(`   📦 Ver productos: ${clientePuedeVerProductos.permitido ? '✅' : '❌'} ${clientePuedeVerProductos.mensaje || ''}`);

    // NO puede crear ventas
    const clientePuedeCrearVentas = await validator.validarOperacionVenta('crear', contextoCliente);
    console.log(`   💰 Crear ventas: ${clientePuedeCrearVentas.permitido ? '✅' : '❌'} ${clientePuedeCrearVentas.mensaje || ''}`);

    // ========================================
    // PASO 6: GESTIÓN DE SESIONES
    // ========================================
    console.log("\n🎪 PASO 6: Gestión de sesiones...");
    
    const gestorSesiones = usuarioManager.gestorSesiones;
    
    // Obtener estadísticas de sesiones
    const estadisticasSesiones = gestorSesiones.obtenerEstadisticasSesiones();
    console.log(`   📊 Sesiones activas: ${estadisticasSesiones.sesionesActivas}`);
    console.log(`   👥 Usuarios únicos: ${estadisticasSesiones.usuariosUnicos}`);
    console.log(`   🎫 Tokens activos: ${estadisticasSesiones.tokensActivos}`);

    // Actualizar actividad
    gestorSesiones.actualizarActividad(usuarioCajero.id);
    console.log(`   ⚡ Actividad actualizada para: ${usuarioCajero.username}`);

    // ========================================
    // PASO 7: OPERACIONES CON LA CLASE USUARIO
    // ========================================
    console.log("\n👤 PASO 7: Operaciones con clase Usuario...");
    
    // Métodos de la clase Usuario
    console.log(`   📝 Nombre completo cajero: "${usuarioCajero.obtenerNombreCompleto()}"`);
    console.log(`   📝 Nombre completo cliente: "${usuarioCliente.obtenerNombreCompleto()}"`);
    
    console.log(`   🔐 Cajero es admin: ${usuarioCajero.esAdmin()}`);
    console.log(`   🔐 Admin es admin: ${usuarioAdmin.esAdmin()}`);
    
    console.log(`   ✅ Cajero puede crear ventas: ${usuarioCajero.puede(Permisos.VENTAS_CREAR)}`);
    console.log(`   ❌ Cliente puede crear ventas: ${usuarioCliente.puede(Permisos.VENTAS_CREAR)}`);
    
    // Permisos múltiples
    const permisosVenta = [Permisos.VENTAS_CREAR, Permisos.PRODUCTOS_VER];
    console.log(`   🎯 Cajero puede hacer ventas completas: ${usuarioCajero.puedeMultiple(permisosVenta, true)}`);
    
    // Obtener todos los permisos
    const permisosCajero = usuarioCajero.obtenerPermisos();
    console.log(`   📋 Total permisos cajero: ${permisosCajero.length}`);

    // ========================================
    // PASO 8: ESTADÍSTICAS DEL SISTEMA
    // ========================================
    console.log("\n📊 PASO 8: Estadísticas del sistema...");
    
    const resultadoEstadisticas = await usuarioManager.obtenerEstadisticas(usuarioAdmin);
    
    if (resultadoEstadisticas.exito) {
      const stats = resultadoEstadisticas.datos!;
      console.log(`   👥 Total usuarios: ${stats.totalUsuarios}`);
      console.log(`   ✅ Usuarios activos: ${stats.usuariosActivos}`);
      console.log(`   🔒 Usuarios bloqueados: ${stats.usuariosBloqueados}`);
      console.log(`   🎪 Sesiones activas: ${stats.sesionesActivas}`);
      
      console.log(`   📋 Distribución roles:`);
      Object.entries(stats.distribucionRoles).forEach(([rol, cantidad]) => {
        console.log(`      - ${rol}: ${cantidad}`);
      });
      
      console.log(`   🏢 Distribución entidades:`);
      Object.entries(stats.distribucionEntidades).forEach(([tipo, cantidad]) => {
        console.log(`      - ${tipo}: ${cantidad}`);
      });
    }

    // ========================================
    // PASO 9: CERRAR SESIÓN
    // ========================================
    console.log("\n🚪 PASO 9: Cerrando sesión...");
    
    const resultadoCerrarSesion = await usuarioManager.cerrarSesion(usuarioCajero.id);
    
    if (resultadoCerrarSesion.exito) {
      console.log(`   ✅ Sesión cerrada para: ${usuarioCajero.username}`);
      
      // Verificar que la sesión se cerró
      const sesionDespues = gestorSesiones.obtenerSesion(usuarioCajero.id);
      console.log(`   🔍 Sesión después del logout: ${sesionDespues ? 'ACTIVA' : 'CERRADA'}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 EJEMPLO COMPLETO FINALIZADO EXITOSAMENTE");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ ERROR EN EL EJEMPLO:", (error as Error).message);
    console.error("=".repeat(60));
  }
}

// ========================================
// 4. EJEMPLOS ESPECÍFICOS DE CLASES
// ========================================

/**
 * Ejemplo específico de la clase Usuario
 */
export function ejemploClaseUsuario() {
  console.log("\n👤 EJEMPLO: Clase Usuario");
  console.log("-".repeat(40));

  const { cliente, personal } = crearEntidadesEjemplo();
  const { rolCajero } = crearRolesEjemplo();

  // Crear usuario con la clase
  const usuario = new Usuario({
    id: "usr_ejemplo_001",
    email: "ejemplo@test.com",
    username: "ejemplo.usuario",
    passwordHash: "hashed_password",
    roles: [rolCajero],
    entidades: [personal],
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    intentosFallidos: 0,
    cuentaBloqueada: false,
    emailVerificado: true
  });

  console.log(`✅ Usuario creado: ${usuario.username}`);
  console.log(`📝 Nombre completo: ${usuario.obtenerNombreCompleto()}`);
  console.log(`🔐 Es admin: ${usuario.esAdmin()}`);
  console.log(`✅ Puede crear ventas: ${usuario.puede(Permisos.VENTAS_CREAR)}`);
  console.log(`📋 Total permisos: ${usuario.obtenerPermisos().length}`);
  console.log(`🏢 Puede acceder a entidad: ${usuario.puedeAccederEntidad(personal.id)}`);

  // Iniciar sesión
  const sesion = usuario.iniciarSesion(personal.id);
  console.log(`🎪 Sesión iniciada - Entidad activa: ${sesion.entidadActiva.tipo}`);

  // Serialización
  const usuarioJSON = usuario.toJSON();
  const usuarioPouchDB = usuario.toPouchDB();
  console.log(`💾 Serialización JSON: ${Object.keys(usuarioJSON).length} campos`);
  console.log(`🗃️ Serialización PouchDB: ${Object.keys(usuarioPouchDB).length} campos`);
}

/**
 * Ejemplo específico del SesionManager
 */
export async function ejemploSesionManager() {
  console.log("\n🎪 EJEMPLO: SesionManager");
  console.log("-".repeat(40));

  const sesionManager = new SesionManager({
    tiempoExpiracionToken: 30, // 30 minutos
    permitirSesionesConcurrentes: false,
    maxSesionesConcurrentes: 1
  });

  const { personal } = crearEntidadesEjemplo();
  const { rolCajero } = crearRolesEjemplo();

  const usuario = new Usuario({
    id: "usr_sesion_001",
    email: "sesion@test.com",
    username: "sesion.test",
    passwordHash: "hashed_test123",
    roles: [rolCajero],
    entidades: [personal],
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    intentosFallidos: 0,
    cuentaBloqueada: false,
    emailVerificado: true
  });

  try {
    // Autenticar usuario
    const credenciales: LoginUsuario = {
      identificador: "sesion.test",
      password: "test123",
      entidadId: personal.id
    };

    const validarPassword = async (password: string, hash: string) => {
      return hash === `hashed_${password}`;
    };

    const loginRespuesta = await sesionManager.autenticar(credenciales, usuario, validarPassword);
    
    console.log(`✅ Autenticación exitosa`);
    console.log(`🎫 Token: ${loginRespuesta.token.substring(0, 15)}...`);
    console.log(`⏰ Expira en: ${Math.round(loginRespuesta.expiraEn / 1000 / 60)} minutos`);

    // Obtener sesión
    const sesion = sesionManager.obtenerSesion(usuario.id);
    console.log(`🎪 Sesión obtenida: ${sesion ? 'ACTIVA' : 'NO ENCONTRADA'}`);

    // Actualizar actividad
    sesionManager.actualizarActividad(usuario.id);
    console.log(`⚡ Actividad actualizada`);

    // Estadísticas
    const stats = sesionManager.obtenerEstadisticasSesiones();
    console.log(`📊 Sesiones activas: ${stats.sesionesActivas}`);
    console.log(`👥 Usuarios únicos: ${stats.usuariosUnicos}`);

    // Cerrar sesión
    sesionManager.cerrarSesion(usuario.id);
    console.log(`🚪 Sesión cerrada`);

  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
  }
}

/**
 * Ejemplo específico del PermisoValidator
 */
export async function ejemploPermisoValidator() {
  console.log("\n✅ EJEMPLO: PermisoValidator");
  console.log("-".repeat(40));

  const validator = new PermisoValidator();
  const { cliente, personal } = crearEntidadesEjemplo();
  const { rolCajero, rolCliente } = crearRolesEjemplo();

  const usuarioCajero = new Usuario({
    id: "usr_validator_001",
    email: "validator@test.com",
    username: "validator.cajero",
    passwordHash: "hashed_password",
    roles: [rolCajero],
    entidades: [personal],
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    intentosFallidos: 0,
    cuentaBloqueada: false,
    emailVerificado: true
  });

  const usuarioCliente = new Usuario({
    id: "usr_validator_002",
    email: "cliente@test.com",
    username: "validator.cliente",
    passwordHash: "hashed_password",
    roles: [rolCliente],
    entidades: [cliente],
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    intentosFallidos: 0,
    cuentaBloqueada: false,
    emailVerificado: true
  });

  // Iniciar sesiones
  usuarioCajero.iniciarSesion(personal.id);
  usuarioCliente.iniciarSesion(cliente.id);

  // Contextos de validación
  const contextoCajero: ContextoValidacion = { usuario: usuarioCajero };
  const contextoCliente: ContextoValidacion = { usuario: usuarioCliente };

  console.log("🔍 Validaciones para CAJERO:");
  
  // Validar operaciones de venta
  const ventaCrear = await validator.validarOperacionVenta('crear', contextoCajero);
  console.log(`   💰 Crear venta: ${ventaCrear.permitido ? '✅' : '❌'} ${ventaCrear.mensaje || ''}`);

  const ventaEliminar = await validator.validarOperacionVenta('eliminar', contextoCajero);
  console.log(`   🗑️ Eliminar venta: ${ventaEliminar.permitido ? '✅' : '❌'} ${ventaEliminar.mensaje || ''}`);

  // Validar operaciones de producto
  const productoVer = await validator.validarOperacionProducto('ver', contextoCajero);
  console.log(`   📦 Ver producto: ${productoVer.permitido ? '✅' : '❌'} ${productoVer.mensaje || ''}`);

  const productoEliminar = await validator.validarOperacionProducto('eliminar', contextoCajero);
  console.log(`   🗑️ Eliminar producto: ${productoEliminar.permitido ? '✅' : '❌'} ${productoEliminar.mensaje || ''}`);

  console.log("\n🔍 Validaciones para CLIENTE:");
  
  // Validar para cliente
  const clienteVentaCrear = await validator.validarOperacionVenta('crear', contextoCliente);
  console.log(`   💰 Crear venta: ${clienteVentaCrear.permitido ? '✅' : '❌'} ${clienteVentaCrear.mensaje || ''}`);

  const clienteProductoVer = await validator.validarOperacionProducto('ver', contextoCliente);
  console.log(`   📦 Ver producto: ${clienteProductoVer.permitido ? '✅' : '❌'} ${clienteProductoVer.mensaje || ''}`);

  // Validaciones múltiples
  const accionesVenta = ['ventas:crear', 'productos:ver'];
  const validacionMultiple = await validator.validarMultiplesAcciones(accionesVenta, contextoCajero, true);
  console.log(`\n🎯 Cajero puede hacer venta completa: ${validacionMultiple.permitido ? '✅' : '❌'} ${validacionMultiple.mensaje || ''}`);

  // Obtener auditoría
  const auditoria = validator.obtenerAuditoria(undefined, 5);
  console.log(`\n📝 Registros de auditoría: ${auditoria.length}`);
}

// ========================================
// 5. FUNCIÓN PRINCIPAL PARA EJECUTAR EJEMPLOS
// ========================================

/**
 * Ejecuta todos los ejemplos
 */
export async function ejecutarTodosLosEjemplos() {
  console.log("🎯 EJECUTANDO TODOS LOS EJEMPLOS CON CLASES");
  console.log("=".repeat(80));

  // Ejemplo completo
  await ejemploCompletoConClases();

  // Ejemplos específicos
  ejemploClaseUsuario();
  await ejemploSesionManager();
  await ejemploPermisoValidator();

  console.log("\n🎉 TODOS LOS EJEMPLOS COMPLETADOS");
  console.log("=".repeat(80));
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarTodosLosEjemplos().catch(error => {
    console.error("❌ Error ejecutando ejemplos:", error);
  });
}
