# 📦 Instalación desde GitHub

Esta guía explica cómo instalar `yola-fresh-utils` directamente desde GitHub.

## 🚀 Instalación Directa

```bash
# Instalar desde GitHub (rama principal)
npm install github:yelsino/yolafresh-utils

# O con yarn
yarn add github:yelsino/yolafresh-utils

# O con pnpm  
pnpm add github:yelsino/yolafresh-utils
```

## 🔧 Instalación con Rama Específica

```bash
# Instalar desde una rama específica
npm install github:yelsino/yolafresh-utils#rama-especifica

# Instalar desde un tag/release específico
npm install github:yelsino/yolafresh-utils#v1.0.2

# Instalar desde un commit específico
npm install github:yelsino/yolafresh-utils#abc1234
```

## ⚙️ Proceso Automático

Al instalar desde GitHub, el paquete:

1. **🔍 Verifica** si existe la carpeta `dist`
2. **📦 Instala** dependencias de desarrollo si es necesario
3. **🔨 Construye** el proyecto automáticamente
4. **📝 Copia** la documentación al directorio final
5. **✅ Valida** que todos los archivos están presentes

## 🛠️ Solución de Problemas

### Error: "Cannot find module"

```bash
# Limpiar cache e instalar de nuevo
npm cache clean --force
rm -rf node_modules package-lock.json
npm install github:yelsino/yolafresh-utils
```

### Error: "Build failed"

```bash
# Instalar dependencias manualmente y construir
cd node_modules/yola-fresh-utils
npm install
npm run build
```

### Verificar Instalación

```bash
# Probar que el paquete funciona
node -e "console.log(require('yola-fresh-utils'))"
```

## 📖 Uso Después de Instalación

```typescript
// Importar desde el paquete instalado
import { 
  ShoppingCart, 
  Usuario, 
  UsuarioManager,
  formatearFecha 
} from 'yola-fresh-utils';

// Usar normalmente
const carrito = ShoppingCart.paraPeru('cart-1', 'Mesa 5');
console.log('✅ Paquete funcionando correctamente');
```

## 🆚 Diferencias vs NPM Registry

| Aspecto | GitHub Install | NPM Registry |
|---------|----------------|--------------|
| **Velocidad** | ⚡ Más lento (build en tiempo real) | 🚀 Más rápido (pre-construido) |
| **Versión** | 📱 Siempre la más reciente | 📋 Versión específica publicada |
| **Dependencias** | 📦 Instala dev dependencies | 🎯 Solo dependencies |
| **Cache** | 🔄 Menos cacheable | ✅ Altamente cacheable |
| **Tamaño** | 📁 Incluye archivos fuente | 📦 Solo archivos necesarios |

## 💡 Recomendaciones

### Para Desarrollo
```bash
# Usar GitHub para obtener las últimas características
npm install github:yelsino/yolafresh-utils
```

### Para Producción
```bash
# Usar NPM registry para estabilidad
npm install yola-fresh-utils@^1.0.2
```

## 🔄 Actualización

```bash
# Actualizar a la última versión de GitHub
npm update yola-fresh-utils

# O forzar reinstalación
npm uninstall yola-fresh-utils
npm install github:yelsino/yolafresh-utils
```

## 📋 Verificación Post-Instalación

Después de instalar, verifica que todo funciona:

```javascript
// test-install.js
try {
  const utils = require('yola-fresh-utils');
  console.log('✅ Paquete cargado correctamente');
  console.log('📦 Exports disponibles:', Object.keys(utils));
  
  // Probar una función básica
  const { formatearFecha } = utils;
  console.log('📅 Fecha formateada:', formatearFecha(new Date()));
  
} catch (error) {
  console.error('❌ Error cargando el paquete:', error.message);
}
```

```bash
node test-install.js
```

---

## 🆘 Soporte

Si tienes problemas con la instalación desde GitHub:

1. **📝 Reporta** el issue en el repositorio
2. **🔍 Incluye** la salida completa del error
3. **💻 Menciona** tu sistema operativo y versión de Node
4. **📋 Lista** las versiones de npm/yarn/pnpm que usas
