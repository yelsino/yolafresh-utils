# 📋 Guía de Implementación - Sistema de Usuarios Yola Fresh Utils

## 🎯 Objetivo

Esta guía te ayudará a implementar el sistema completo de usuarios, roles y permisos en tu aplicación, utilizando las clases y interfaces de `yola-fresh-utils`.

---

## 📦 1. INSTALACIÓN Y CONFIGURACIÓN

### Paso 1: Instalar el paquete

```bash
npm install yola-fresh-utils
# o
yarn add yola-fresh-utils
```

### Paso 2: Importar los artefactos necesarios

```typescript
// Clases principales
import { 
  Usuario, 
  UsuarioManager, 
  SesionManager, 
  PermisoValidator 
} from 'yola-fresh-utils/class';

// O desde el paquete principal (con alias)
import { 
  UsuarioClass as Usuario,
  UsuarioManager, 
  SesionManager, 
  PermisoValidator 
} from 'yola-fresh-utils';

// Interfaces
import { 
  CrearUsuario, 
  LoginUsuario,
  Usuario as IUsuario 
} from 'yola-fresh-utils/interfaces';

// Utilidades
import { 
  Permisos, 
  RolesPredefinidos,
  crearRolPredefinido 
} from 'yola-fresh-utils/utils';
```

---

## 🏗️ 2. CONFIGURACIÓN INICIAL

### Paso 1: Inicializar el UsuarioManager

```typescript
// config/usuarios.ts
import { UsuarioManager } from 'yola-fresh-utils/class';
import bcrypt from 'bcrypt';

export const usuarioManager = new UsuarioManager({
  // Configuración de auditoría
  auditoria: true,
  
  // Configuración de cache
  cache: true,
  tiempoVidaCache: 30, // 30 minutos
  
  // Configuración de sesiones
  sesiones: {
    tiempoExpiracionToken: 60,        // 1 hora
    tiempoExpiracionRefresh: 10080,   // 7 días (en minutos)
    permitirSesionesConcurrentes: true,
    maxSesionesConcurrentes: 3,
    tiempoMaximoInactividad: 30       // 30 minutos
  },
  
  // Funciones de hashing (IMPORTANTE: Usar bcrypt en producción)
  hashearPassword: async (password: string) => {
    return await bcrypt.hash(password, 10);
  },
  
  validarPassword: async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
  }
});
```

### Paso 2: Crear roles del sistema

```typescript
// config/roles.ts
import { crearRolPredefinido, RolesPredefinidos } from 'yola-fresh-utils/utils';

export const rolesDelSistema = {
  admin: crearRolPredefinido(RolesPredefinidos.ADMIN, 'rol_admin_001'),
  cajero: crearRolPredefinido(RolesPredefinidos.CAJERO, 'rol_cajero_001'),
  vendedor: crearRolPredefinido(RolesPredefinidos.VENDEDOR, 'rol_vendedor_001'),
  cliente: crearRolPredefinido(RolesPredefinidos.CLIENTE, 'rol_cliente_001'),
  contador: crearRolPredefinido(RolesPredefinidos.CONTADOR, 'rol_contador_001')
};
```

---

## 👥 3. GESTIÓN DE USUARIOS

### Crear un Usuario Administrador (Primer Setup)

```typescript
// scripts/crear-admin.ts
import { usuarioManager, rolesDelSistema } from '../config/usuarios';

async function crearAdminInicial() {
  try {
    const datosAdmin = {
      email: 'admin@tuempresa.com',
      username: 'admin',
      password: 'TuPasswordSeguro123!',
      roleIds: [rolesDelSistema.admin.id],
      entidadIds: [] // Admin no necesita entidades específicas
    };

    const resultado = await usuarioManager.crearUsuario(
      datosAdmin,
      [rolesDelSistema.admin],
      [] // Sin entidades
      // Sin usuario creador (es el primer usuario)
    );

    if (resultado.exito) {
      console.log('✅ Administrador creado exitosamente');
      console.log(`ID: ${resultado.datos.id}`);
      console.log(`Email: ${resultado.datos.email}`);
    } else {
      console.error('❌ Error:', resultado.mensaje);
    }
  } catch (error) {
    console.error('❌ Error fatal:', error);
  }
}

// Ejecutar solo una vez
crearAdminInicial();
```

### Crear Empleados (Cajeros, Vendedores)

```typescript
// services/empleados.service.ts
import { usuarioManager, rolesDelSistema } from '../config/usuarios';
import { Personal, CargosPersonal } from 'yola-fresh-utils/interfaces';

export class EmpleadosService {
  
  async crearCajero(
    datos: {
      email: string;
      username: string;
      password: string;
      nombres: string;
      dni: string;
      celular: string;
      direccion: string;
    },
    usuarioCreador: Usuario
  ) {
    try {
      // 1. Crear entidad Personal
      const entidadPersonal: Personal = {
        id: `per_${Date.now()}`,
        tipo: 'Personal',
        nombres: datos.nombres,
        cargo: CargosPersonal.CAJERO,
        dni: datos.dni,
        celular: datos.celular,
        direccion: datos.direccion,
        fechaContratacion: new Date(),
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        activo: true
        // ... más campos según necesites
      };

      // 2. Crear usuario
      const datosUsuario = {
        email: datos.email,
        username: datos.username,
        password: datos.password,
        roleIds: [rolesDelSistema.cajero.id],
        entidadIds: [entidadPersonal.id]
      };

      const resultado = await usuarioManager.crearUsuario(
        datosUsuario,
        [rolesDelSistema.cajero],
        [entidadPersonal],
        usuarioCreador
      );

      return resultado;

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error creando cajero: ${error.message}`
      };
    }
  }

  async crearVendedor(datos: any, usuarioCreador: Usuario) {
    // Similar al cajero, pero con rol vendedor
    const entidadPersonal: Personal = {
      // ... configurar como Personal con cargo VENDEDOR
      cargo: CargosPersonal.VENDEDOR
    };

    return await usuarioManager.crearUsuario(
      datosUsuario,
      [rolesDelSistema.vendedor],
      [entidadPersonal],
      usuarioCreador
    );
  }
}
```

### Crear Clientes

```typescript
// services/clientes.service.ts
export class ClientesService {
  
  async registrarCliente(
    datos: {
      email: string;
      username: string;
      password: string;
      nombres: string;
      apellidos?: string;
      dni: string;
      celular: string;
      direccion: string;
    }
  ) {
    try {
      // 1. Crear entidad Cliente
      const entidadCliente: Cliente = {
        id: `cli_${Date.now()}`,
        tipo: 'Cliente',
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        dni: datos.dni,
        celular: datos.celular,
        correo: datos.email,
        direccion: datos.direccion,
        pseudonimo: `${datos.nombres} ${datos.apellidos?.charAt(0) || ''}.`,
        historialCompras: [],
        totalGastado: 0,
        categoria: CategoriaCliente.REGULAR,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        activo: true
        // ... más campos
      };

      // 2. Crear usuario cliente
      const datosUsuario = {
        email: datos.email,
        username: datos.username,
        password: datos.password,
        roleIds: [rolesDelSistema.cliente.id],
        entidadIds: [entidadCliente.id]
      };

      const resultado = await usuarioManager.crearUsuario(
        datosUsuario,
        [rolesDelSistema.cliente],
        [entidadCliente]
        // Sin usuario creador (auto-registro)
      );

      return resultado;

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error registrando cliente: ${error.message}`
      };
    }
  }
}
```

---

## 🔐 4. AUTENTICACIÓN

### Middleware de Autenticación (Express.js)

```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { usuarioManager } from '../config/usuarios';
import { Usuario } from 'yola-fresh-utils/class';

// Extender Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
      sesion?: SesionContexto;
    }
  }
}

export async function authMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token requerido' 
      });
    }

    // Validar token
    const tokenInfo = usuarioManager.gestorSesiones.validarToken(token);
    
    if (!tokenInfo) {
      return res.status(401).json({ 
        error: 'Token inválido o expirado' 
      });
    }

    // Obtener usuario
    const resultadoUsuario = await usuarioManager.obtenerUsuario(tokenInfo.usuarioId);
    
    if (!resultadoUsuario.exito) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // Obtener sesión
    const sesion = usuarioManager.gestorSesiones.obtenerSesion(tokenInfo.usuarioId);
    
    if (!sesion) {
      return res.status(401).json({ 
        error: 'Sesión expirada' 
      });
    }

    // Actualizar actividad
    usuarioManager.gestorSesiones.actualizarActividad(tokenInfo.usuarioId);

    // Agregar al request
    req.usuario = resultadoUsuario.datos;
    req.sesion = sesion;

    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Error de autenticación' 
    });
  }
}
```

### Rutas de Autenticación

```typescript
// routes/auth.routes.ts
import { Router } from 'express';
import { usuarioManager } from '../config/usuarios';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { identificador, password, entidadId } = req.body;

    const credenciales = {
      identificador,
      password,
      entidadId
    };

    const resultado = await usuarioManager.autenticar(credenciales);

    if (resultado.exito) {
      const { usuario, token, refreshToken, sesion, expiraEn } = resultado.datos;
      
      res.json({
        success: true,
        data: {
          usuario: {
            id: usuario.id,
            email: usuario.email,
            username: usuario.username,
            roles: usuario.roles.map(r => r.nombre),
            entidadActiva: sesion.entidadActiva
          },
          token,
          refreshToken,
          expiraEn
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: resultado.mensaje
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const resultado = await usuarioManager.cerrarSesion(req.usuario!.id);
    
    res.json({
      success: resultado.exito,
      message: resultado.mensaje
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cerrando sesión'
    });
  }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    const nuevoToken = await usuarioManager.gestorSesiones.refrescarToken(refreshToken);
    
    res.json({
      success: true,
      data: {
        token: nuevoToken.token,
        refreshToken: nuevoToken.refreshToken,
        expiraEn: nuevoToken.expiraEn
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido'
    });
  }
});

export default router;
```

---

## ✅ 5. VALIDACIÓN DE PERMISOS

### Middleware de Permisos

```typescript
// middleware/permisos.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { usuarioManager } from '../config/usuarios';
import { ContextoValidacion } from 'yola-fresh-utils/class';

export function requierePermiso(permiso: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ 
          error: 'Usuario no autenticado' 
        });
      }

      const contexto: ContextoValidacion = {
        usuario: req.usuario,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      const validator = usuarioManager.validadorPermisos;
      const resultado = await validator.validarAccion(permiso, contexto);

      if (resultado.permitido) {
        next();
      } else {
        res.status(403).json({
          error: 'Permisos insuficientes',
          mensaje: resultado.mensaje,
          codigo: resultado.codigoError
        });
      }
    } catch (error) {
      res.status(500).json({ 
        error: 'Error validando permisos' 
      });
    }
  };
}

export function requiereRol(rol: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado' 
      });
    }

    if (req.usuario.tieneRol(rol)) {
      next();
    } else {
      res.status(403).json({
        error: 'Rol insuficiente',
        rolRequerido: rol
      });
    }
  };
}
```

### Usar en Rutas Protegidas

```typescript
// routes/ventas.routes.ts
import { Router } from 'express';
import { authMiddleware, requierePermiso } from '../middleware';
import { Permisos } from 'yola-fresh-utils/utils';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Crear venta - Solo cajeros y vendedores
router.post('/', 
  requierePermiso(Permisos.VENTAS_CREAR),
  async (req, res) => {
    // Solo se ejecuta si el usuario puede crear ventas
    try {
      const nuevaVenta = await crearVenta(req.body, req.usuario);
      res.json({ success: true, data: nuevaVenta });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Ver ventas - Cajeros, vendedores, supervisores
router.get('/', 
  requierePermiso(Permisos.VENTAS_VER),
  async (req, res) => {
    try {
      const ventas = await obtenerVentas(req.usuario);
      res.json({ success: true, data: ventas });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Eliminar venta - Solo administradores
router.delete('/:id', 
  requierePermiso(Permisos.VENTAS_ELIMINAR),
  async (req, res) => {
    try {
      await eliminarVenta(req.params.id, req.usuario);
      res.json({ success: true, message: 'Venta eliminada' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
```

---

## 🎨 6. INTEGRACIÓN EN FRONTEND

### Servicio de Autenticación (React/Vue/Angular)

```typescript
// services/auth.service.ts
import axios from 'axios';

class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Recuperar tokens del localStorage
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    // Configurar interceptor para agregar token automáticamente
    this.setupInterceptors();
  }

  async login(identificador: string, password: string, entidadId?: string) {
    try {
      const response = await axios.post('/api/auth/login', {
        identificador,
        password,
        entidadId
      });

      if (response.data.success) {
        const { token, refreshToken, usuario } = response.data.data;
        
        // Guardar tokens
        this.token = token;
        this.refreshToken = refreshToken;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('usuario', JSON.stringify(usuario));

        return { success: true, usuario };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: 'Error de conexión' 
      };
    }
  }

  async logout() {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar tokens locales
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('usuario');
    }
  }

  getCurrentUser() {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  hasPermission(permiso: string): boolean {
    const usuario = this.getCurrentUser();
    if (!usuario) return false;
    
    // En el frontend, podrías mantener una lista de permisos del usuario
    // Esta información vendría en el login
    return usuario.permisos?.includes(permiso) || false;
  }

  hasRole(rol: string): boolean {
    const usuario = this.getCurrentUser();
    return usuario?.roles?.includes(rol) || false;
  }

  private setupInterceptors() {
    // Interceptor para agregar token automáticamente
    axios.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Interceptor para manejar tokens expirados
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            const response = await axios.post('/api/auth/refresh', {
              refreshToken: this.refreshToken
            });
            
            if (response.data.success) {
              const { token, refreshToken } = response.data.data;
              this.token = token;
              this.refreshToken = refreshToken;
              localStorage.setItem('token', token);
              localStorage.setItem('refreshToken', refreshToken);
              
              // Reintentar la petición original
              return axios.request(error.config);
            }
          } catch (refreshError) {
            this.logout();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}

export const authService = new AuthService();
```

### Componente de Protección de Rutas (React)

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { authService } from '../services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole,
  fallback = <div>No tienes permisos para ver esta página</div>
}: ProtectedRouteProps) {
  
  if (!authService.isAuthenticated()) {
    // Redirigir a login
    window.location.href = '/login';
    return null;
  }

  if (requiredPermission && !authService.hasPermission(requiredPermission)) {
    return fallback;
  }

  if (requiredRole && !authService.hasRole(requiredRole)) {
    return fallback;
  }

  return <>{children}</>;
}

// Uso en rutas
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/ventas" element={
          <ProtectedRoute requiredPermission="ventas:ver">
            <VentasPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
```

---

## 📊 7. MONITOREO Y ESTADÍSTICAS

### Dashboard de Administración

```typescript
// services/admin.service.ts
export class AdminService {
  
  async obtenerEstadisticasUsuarios(usuarioAdmin: Usuario) {
    const resultado = await usuarioManager.obtenerEstadisticas(usuarioAdmin);
    
    if (resultado.exito) {
      return resultado.datos;
      /*
      {
        totalUsuarios: 150,
        usuariosActivos: 140,
        usuariosBloqueados: 2,
        sesionesActivas: 25,
        distribucionRoles: {
          "cajero": 45,
          "vendedor": 30,
          "cliente": 70
        },
        distribucionEntidades: {
          "Cliente": 70,
          "Personal": 75
        }
      }
      */
    }
    
    return null;
  }

  async obtenerAuditoria(filtros: any, usuarioAdmin: Usuario) {
    return await usuarioManager.obtenerAuditoria(filtros, usuarioAdmin);
  }

  async obtenerSesionesActivas() {
    return usuarioManager.gestorSesiones.obtenerEstadisticasSesiones();
  }
}
```

---

## 🚨 8. CONSIDERACIONES IMPORTANTES

### Seguridad en Producción

```typescript
// config/security.ts
export const securityConfig = {
  // ✅ SIEMPRE usar HTTPS en producción
  useHttps: process.env.NODE_ENV === 'production',
  
  // ✅ Configurar CORS correctamente
  corsOptions: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  
  // ✅ Rate limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por ventana
  },
  
  // ✅ Configuración de tokens más estricta para producción
  tokenConfig: {
    tiempoExpiracionToken: process.env.NODE_ENV === 'production' ? 30 : 60, // 30 min en prod
    tiempoExpiracionRefresh: process.env.NODE_ENV === 'production' ? 1440 : 10080, // 1 día en prod
  }
};
```

### Variables de Entorno

```env
# .env
NODE_ENV=production
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
BCRYPT_ROUNDS=12
DB_CONNECTION_STRING=tu_conexion_db
ALLOWED_ORIGINS=https://tuapp.com,https://admin.tuapp.com

# Configuración de sesiones
SESSION_TOKEN_EXPIRY=30
SESSION_REFRESH_EXPIRY=1440
MAX_CONCURRENT_SESSIONS=2
```

### Persistencia en Base de Datos

```typescript
// repositories/usuario.repository.ts
export class UsuarioRepository {
  
  async save(usuario: Usuario): Promise<void> {
    // Usar toPouchDB() para obtener datos serializables
    const data = usuario.toPouchDB();
    await this.db.collection('usuarios').doc(usuario.id).set(data);
  }

  async findById(id: string): Promise<Usuario | null> {
    const doc = await this.db.collection('usuarios').doc(id).get();
    
    if (doc.exists) {
      // Usar fromPouchDB() para reconstruir la instancia
      return Usuario.fromPouchDB(doc.data());
    }
    
    return null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const query = await this.db.collection('usuarios')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!query.empty) {
      return Usuario.fromPouchDB(query.docs[0].data());
    }
    
    return null;
  }
}
```

---

## 🎯 9. CHECKLIST DE IMPLEMENTACIÓN

### Configuración Inicial
- [ ] Instalar `yola-fresh-utils`
- [ ] Configurar `UsuarioManager` con funciones de hashing
- [ ] Crear roles predefinidos del sistema
- [ ] Crear usuario administrador inicial

### Backend
- [ ] Implementar middleware de autenticación
- [ ] Implementar middleware de permisos
- [ ] Crear rutas de autenticación (login, logout, refresh)
- [ ] Proteger rutas con validaciones de permisos
- [ ] Configurar persistencia en base de datos
- [ ] Implementar auditoría y logs

### Frontend
- [ ] Crear servicio de autenticación
- [ ] Implementar interceptores de HTTP
- [ ] Crear componentes de protección de rutas
- [ ] Implementar manejo de tokens expirados
- [ ] Crear interfaces de administración

### Seguridad
- [ ] Configurar HTTPS
- [ ] Implementar rate limiting
- [ ] Configurar CORS
- [ ] Usar variables de entorno para secretos
- [ ] Implementar logging de seguridad

### Testing
- [ ] Tests unitarios para clases principales
- [ ] Tests de integración para flujos completos
- [ ] Tests de seguridad (intentos de bypass)
- [ ] Tests de rendimiento

---

## 📞 10. SOPORTE Y TROUBLESHOOTING

### Errores Comunes

**Error: "Usuario no tiene permisos"**
```typescript
// Verificar que el usuario tenga el rol correcto
console.log('Roles del usuario:', usuario.roles.map(r => r.nombre));
console.log('Permisos del usuario:', usuario.obtenerPermisos());
```

**Error: "Token expirado"**
```typescript
// Verificar configuración de expiración
console.log('Configuración de tokens:', usuarioManager.gestorSesiones.obtenerConfiguracion());
```

**Error: "Sesión no encontrada"**
```typescript
// Verificar sesiones activas
const stats = usuarioManager.gestorSesiones.obtenerEstadisticasSesiones();
console.log('Sesiones activas:', stats.sesionesActivas);
```

### Logs Útiles

```typescript
// Habilitar logs detallados
const usuarioManager = new UsuarioManager({
  auditoria: true, // Habilitar auditoría completa
  // ... otras configuraciones
});

// Obtener logs de auditoría
const auditoria = await usuarioManager.obtenerAuditoria({
  usuarioId: 'usr_problematico',
  limite: 100
}, adminUser);

console.log('Últimas 100 acciones del usuario:', auditoria.datos);
```

---

## 🎉 Conclusión

Con esta guía tienes todo lo necesario para implementar el sistema completo de usuarios en tu aplicación. El sistema es:

✅ **Seguro** - Hashing, tokens, validaciones  
✅ **Escalable** - Roles, permisos, entidades  
✅ **Auditable** - Logs completos de todas las acciones  
✅ **Flexible** - Configurable según tus necesidades  
✅ **Robusto** - Manejo de errores y casos edge  

¡Listo para implementar en producción! 🚀
