# 📚 Documentación de yola-fresh-utils

## 🎯 Bienvenido

Esta documentación te guiará en el uso de `yola-fresh-utils`, una librería TypeScript diseñada para aplicaciones offline-first con React Native, Expo y SQLite.

## 📋 Índice de Documentación

### 🏗️ Patrones de Diseño

- **[Patrón de Extensión de Interfaces](./interface-extension-pattern.md)**
  - Cómo extender interfaces para diferentes contextos (SQLite, CouchDB, APIs)
  - Transformaciones automáticas entre camelCase y snake_case
  - Mantener la independencia de la librería

### 💡 Ejemplos Prácticos

- **[Ejemplo Completo de Extensión](./examples/interface-extension-complete.ts)**
  - Implementación completa con SQLite y CouchDB
  - Servicios offline-first
  - Sincronización en tiempo real
  - Uso en componentes React Native

### 🔧 Guías de Implementación

- **[Configuración Inicial](#configuración-inicial)**
- **[Patrones Offline-First](#patrones-offline-first)**
- **[Sincronización de Datos](#sincronización-de-datos)**
- **[Mejores Prácticas](#mejores-prácticas)**

## 🚀 Configuración Inicial

### Instalación

```bash
npm install yola-fresh-utils
# o
yarn add yola-fresh-utils
```

### Importación Básica

```typescript
import { 
  IProducto, 
  IVenta, 
  IPedido,
  ToSnakeCase,
  ToCamelCase,
  objectToSnakeCase,
  objectToCamelCase,
  arrayToSnakeCase,
  arrayToCamelCase
} from 'yola-fresh-utils';
```

### Configuración TypeScript

Asegúrate de que tu `tsconfig.json` incluya:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

## 🏗️ Patrones Offline-First

### Principios Fundamentales

1. **SQLite como Fuente de Verdad Local**
   - Todos los datos se guardan primero en SQLite
   - La aplicación funciona completamente offline
   - La sincronización es un proceso secundario

2. **Transformaciones en los Bordes**
   - Usa camelCase en la aplicación
   - Transforma a snake_case solo para SQLite
   - Mantén las interfaces originales para APIs

3. **Sincronización Bidireccional**
   - Envía cambios locales al servidor
   - Recibe cambios del servidor
   - Maneja conflictos de manera elegante

### Flujo de Datos Típico

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Aplicación    │    │     SQLite       │    │    CouchDB      │
│   (camelCase)   │◄──►│   (snake_case)   │◄──►│   (camelCase)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
   IProducto              ProductoSQLite           ProductoCouchDB
```

## 🔄 Sincronización de Datos

### Estrategias de Sincronización

1. **Sincronización Manual**
   ```typescript
   await ProductoService.sincronizarTodos();
   ```

2. **Sincronización Automática**
   ```typescript
   SincronizacionTiempoReal.iniciar(30000); // Cada 30 segundos
   ```

3. **Sincronización por Eventos**
   ```typescript
   // Al recuperar conexión
   NetInfo.addEventListener(state => {
     if (state.isConnected) {
       ProductoService.sincronizarTodos();
     }
   });
   ```

### Manejo de Conflictos

```typescript
// Estrategia: Último en ganar
if (producto.version > productoRemoto.version) {
  // Mantener versión local
  await enviarAlServidor(producto);
} else {
  // Usar versión remota
  await guardarLocalmente(productoRemoto);
}
```

## 📱 Integración con React Native

### Hook Personalizado para Productos

```typescript
import { useState, useEffect } from 'react';
import { ProductoService, ProductoApp } from './services/ProductoService';

export function useProductos() {
  const [productos, setProductos] = useState<ProductoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const productosLocal = await ProductoService.obtenerTodos();
      setProductos(productosLocal);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const sincronizar = async () => {
    try {
      setSyncing(true);
      await ProductoService.sincronizarTodos();
      await cargarProductos(); // Recargar después de sincronizar
    } catch (error) {
      console.error('Error sincronizando:', error);
    } finally {
      setSyncing(false);
    }
  };

  const crearProducto = async (datos: Omit<IProducto, 'productoId' | 'fechaCreacion' | 'fechaActualizacion'>) => {
    try {
      const nuevoProducto = await ProductoService.crear(datos);
      setProductos(prev => [...prev, nuevoProducto]);
      return nuevoProducto;
    } catch (error) {
      console.error('Error creando producto:', error);
      throw error;
    }
  };

  return {
    productos,
    loading,
    syncing,
    cargarProductos,
    sincronizar,
    crearProducto
  };
}
```

### Componente de Lista de Productos

```typescript
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useProductos } from '../hooks/useProductos';
import { ProductoApp } from '../services/ProductoService';

export function ListaProductos() {
  const { productos, loading, syncing, sincronizar } = useProductos();

  const renderProducto = ({ item }: { item: ProductoApp }) => (
    <View style={styles.productoItem}>
      <Text style={styles.nombre}>{item.nombreProducto}</Text>
      <Text style={styles.precio}>${item.precioVenta.toFixed(2)}</Text>
      
      <View style={styles.estadoContainer}>
        {item.isLocal && (
          <Text style={styles.estadoLocal}>📱 Local</Text>
        )}
        {item.isSynced && (
          <Text style={styles.estadoSynced}>☁️ Sincronizado</Text>
        )}
        {item.hasConflicts && (
          <Text style={styles.estadoConflict}>⚠️ Conflicto</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Productos</Text>
        <TouchableOpacity 
          onPress={sincronizar} 
          disabled={syncing}
          style={styles.botonSync}
        >
          <Text style={styles.textoBoton}>
            {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={productos}
        renderItem={renderProducto}
        keyExtractor={item => item.productoId}
        refreshing={loading}
        onRefresh={() => {/* Implementar pull-to-refresh */}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  botonSync: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  textoBoton: {
    color: 'white',
    fontSize: 14,
  },
  productoItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  precio: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  estadoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  estadoLocal: {
    fontSize: 12,
    color: '#FF9500',
  },
  estadoSynced: {
    fontSize: 12,
    color: '#34C759',
  },
  estadoConflict: {
    fontSize: 12,
    color: '#FF3B30',
  },
});
```

## ✅ Mejores Prácticas

### 1. Estructura de Proyecto

```
src/
├── services/
│   ├── ProductoService.ts
│   ├── SQLiteService.ts
│   └── CouchDBService.ts
├── interfaces/
│   ├── ProductoSQLite.ts
│   ├── ProductoCouchDB.ts
│   └── ProductoApp.ts
├── hooks/
│   ├── useProductos.ts
│   └── useSincronizacion.ts
└── components/
    ├── ListaProductos.tsx
    └── FormularioProducto.tsx
```

### 2. Manejo de Errores

```typescript
try {
  await ProductoService.crear(datosProducto);
} catch (error) {
  if (error instanceof NetworkError) {
    // Guardar localmente y sincronizar después
    console.log('Sin conexión, guardado localmente');
  } else if (error instanceof ValidationError) {
    // Mostrar errores de validación al usuario
    Alert.alert('Error', error.message);
  } else {
    // Error inesperado
    console.error('Error inesperado:', error);
  }
}
```

### 3. Optimización de Rendimiento

```typescript
// Usar paginación para listas grandes
const productos = await ProductoService.obtenerPaginados({
  pagina: 1,
  limite: 20,
  filtros: { categoria: 'lacteos' }
});

// Usar debounce para búsquedas
const buscarProductos = useMemo(
  () => debounce(async (termino: string) => {
    const resultados = await ProductoService.buscar(termino);
    setResultados(resultados);
  }, 300),
  []
);
```

### 4. Testing

```typescript
// Mockear servicios para testing
jest.mock('../services/ProductoService', () => ({
  ProductoService: {
    crear: jest.fn(),
    obtenerPorId: jest.fn(),
    sincronizarTodos: jest.fn(),
  }
}));

// Test de componente
test('debe mostrar lista de productos', async () => {
  const productosSimulados = [
    { productoId: '1', nombreProducto: 'Test', precioVenta: 10 }
  ];
  
  (ProductoService.obtenerTodos as jest.Mock).mockResolvedValue(productosSimulados);
  
  render(<ListaProductos />);
  
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## 🔗 Enlaces Útiles

- [Repositorio en GitHub](https://github.com/tu-usuario/yola-fresh-utils)
- [Documentación de React Native](https://reactnative.dev/)
- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de SQLite](https://www.sqlite.org/docs.html)
- [Documentación de CouchDB](https://docs.couchdb.org/)

## 🤝 Contribuir

Si encuentras errores o tienes sugerencias:

1. Abre un issue en GitHub
2. Envía un pull request
3. Mejora la documentación

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles.

---

**¿Necesitas ayuda?** Revisa los ejemplos en la carpeta `examples/` o abre un issue en GitHub.