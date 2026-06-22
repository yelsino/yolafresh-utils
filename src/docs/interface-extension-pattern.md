# Patrón de Extensión de Interfaces

## 📋 Resumen

Este documento explica cómo extender las interfaces de `yola-fresh-utils` para adaptarlas a diferentes contextos (SQLite, CouchDB, APIs, etc.) manteniendo la independencia de la librería.

## 🎯 Objetivo

Permitir que las aplicaciones creen interfaces específicas para sus necesidades sin que la librería tenga dependencias de tecnologías específicas.

## 🏗️ Patrón Base

### 1. Importar desde yola-fresh-utils

```typescript
import { IProducto, ToSnakeCase, ToCamelCase } from 'yola-fresh-utils';
```

### 2. Crear interfaces extendidas

```typescript
// Para SQLite (snake_case)
export interface ProductoSQLite extends ToSnakeCase<IProducto> {
  local_id?: number;
  sync_status?: 'pending' | 'synced' | 'conflict';
  last_sync?: string;
  version?: number;
}

// Para CouchDB
export interface ProductoCouchDB extends IProducto {
  _id?: string;
  _rev?: string;
  _deleted?: boolean;
  type: 'producto';
}

// Para APIs REST
export interface ProductoAPI extends IProducto {
  apiVersion?: string;
  etag?: string;
  lastModified?: string;
}
```

## 🔄 Transformaciones Automáticas

### Propiedades convertidas automáticamente:

| IProducto (camelCase) | ProductoSQLite (snake_case) |
|----------------------|-----------------------------|
| `productoId`         | `producto_id`               |
| `nombreProducto`     | `nombre_producto`           |
| `precioVenta`        | `precio_venta`              |
| `categorieId`        | `categorie_id`              |
| `fechaCreacion`      | `fecha_creacion`            |
| `fechaActualizacion` | `fecha_actualizacion`       |
| `tipoVenta`          | `tipo_venta`                |
| `precioCompra`       | `precio_compra`             |

### ⚠️ Consideraciones Especiales para SQLite

**Tipos de Datos Booleanos:**
SQLite no tiene un tipo de datos BOOLEAN nativo <mcreference link="https://www.sqlite.org/datatype3.html" index="3">3</mcreference>. En su lugar, los valores booleanos se almacenan como enteros:
- `false` → `0`
- `true` → `1`

```typescript
// En tu aplicación (TypeScript)
const producto: IProducto = {
  // ... otras propiedades
  activo: true,        // boolean
  disponible: false    // boolean
};

// Al transformar para SQLite
const productoSQL: ProductoSQLite = {
  ...objectToSnakeCase(producto),
  activo: 1,          // true → 1
  disponible: 0       // false → 0
};
```

**Recomendaciones para Booleanos en SQLite:**
1. Declara columnas booleanas como `INTEGER` con restricciones CHECK <mcreference link="https://sqldocs.org/sqlite-database/sqlite-boolean/" index="5">5</mcreference>
2. Usa transformadores automáticos para convertir boolean ↔ number
3. SQLite 3.23.0+ reconoce las palabras clave `TRUE` y `FALSE`, pero internamente siguen siendo 1 y 0 <mcreference link="https://www.sqlite.org/datatype3.html" index="3">3</mcreference>

```sql
-- Esquema SQLite recomendado
CREATE TABLE productos (
  producto_id TEXT PRIMARY KEY,
  nombre_producto TEXT NOT NULL,
  activo INTEGER CHECK (activo IN (0, 1)) DEFAULT 1,
  disponible INTEGER CHECK (disponible IN (0, 1)) DEFAULT 1
);
```

## 💡 Ejemplos Prácticos

### Ejemplo 1: Guardar en SQLite

```typescript
import { IProducto, objectToSnakeCase } from 'yola-fresh-utils';

// Datos de la aplicación
const producto: IProducto = {
  productoId: "123",
  nombreProducto: "Leche Entera",
  precioVenta: 25.50,
  categorieId: "5",
  // ... resto de propiedades
};

// Transformar para SQLite
const productoParaSQLite: ProductoSQLite = {
  ...objectToSnakeCase(producto),
  local_id: 1,
  sync_status: 'pending',
  last_sync: new Date().toISOString(),
  version: 1
};

// Guardar en SQLite
await db.executeSql(
  `INSERT INTO productos (
    producto_id, nombre_producto, precio_venta, 
    categorie_id, local_id, sync_status
  ) VALUES (?, ?, ?, ?, ?, ?)`,
  [
    productoParaSQLite.producto_id,
    productoParaSQLite.nombre_producto,
    productoParaSQLite.precio_venta,
    productoParaSQLite.categorie_id,
    productoParaSQLite.local_id,
    productoParaSQLite.sync_status
  ]
);
```

### Ejemplo 2: Leer de SQLite

```typescript
import { objectToCamelCase } from 'yola-fresh-utils';

// Leer de SQLite
const result = await db.executeSql(
  'SELECT * FROM productos WHERE local_id = ?', 
  [1]
);

const datosSQL = result.rows.item(0);

// Transformar de vuelta a camelCase para la app
const productoParaApp: IProducto = objectToCamelCase(datosSQL);

// Ahora puedes usar productoParaApp en tu aplicación
console.log(productoParaApp.nombreProducto); // "Leche Entera"
console.log(productoParaApp.precioVenta);    // 25.50
```

### Ejemplo 3: Sincronizar con CouchDB

```typescript
// Preparar para CouchDB
const productoParaCouchDB: ProductoCouchDB = {
  ...producto,
  _id: `producto_${producto.productoId}`,
  type: 'producto'
};

// Enviar a CouchDB
const response = await fetch('https://tu-couchdb.com/productos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(productoParaCouchDB)
});

const result = await response.json();

// Actualizar con _rev de CouchDB
productoParaCouchDB._rev = result.rev;
```

## 🔧 Utilidades Disponibles

### Funciones de Transformación

```typescript
// Transformar objetos individuales
objectToSnakeCase(objeto)   // camelCase → snake_case
objectToCamelCase(objeto)   // snake_case → camelCase

// Transformar arrays
arrayToSnakeCase(array)     // Array camelCase → Array snake_case
arrayToCamelCase(array)     // Array snake_case → Array camelCase

// Transformar cadenas
camelToSnakeCase(string)    // "nombreProducto" → "nombre_producto"
snakeToCamelCase(string)    // "nombre_producto" → "nombreProducto"
```

### Tipos Genéricos

```typescript
// Tipos para transformación automática
type ProductoSnake = ToSnakeCase<IProducto>;
type ProductoCamel = ToCamelCase<ProductoSnakeFromDB>;

// Función tipada
function guardarEnSQLite(producto: IProducto): ProductoSnake {
  return objectToSnakeCase(producto) as ProductoSnake;
}
```

### Transformadores Personalizados

```typescript
import { createTransformer, NamingConverter } from 'yola-fresh-utils';

// Crear transformadores reutilizables
const toSnake = createTransformer('camel', 'snake');
const toCamel = createTransformer('snake', 'camel');

// Mapeo personalizado
const mapeoCustom = {
  'productoId': 'id_producto',
  'nombreProducto': 'nombre',
  'precioVenta': 'precio'
};

const productoCustom = NamingConverter.transformKeys(producto, mapeoCustom);
```

## 🎯 Beneficios del Patrón

### ✅ Ventajas

- **Independencia**: La librería no conoce tecnologías específicas
- **Flexibilidad**: Cada app puede extender según sus necesidades
- **Tipado fuerte**: TypeScript garantiza la compatibilidad
- **Reutilización**: Las utilidades son genéricas y reutilizables
- **Mantenibilidad**: Cambios en IProducto se propagan automáticamente
- **Consistencia**: Mismo patrón para todas las interfaces

### 🔄 Flujo Completo Offline-First

```typescript
// 1. Datos en la app (camelCase)
const producto: IProducto = { /* datos */ };

// 2. Guardar localmente en SQLite (snake_case)
const productoSQL = objectToSnakeCase(producto);
await guardarEnSQLite(productoSQL);

// 3. Sincronizar con CouchDB cuando hay conexión
const productoCouchDB: ProductoCouchDB = {
  ...producto,
  _id: `producto_${producto.productoId}`,
  type: 'producto'
};
await sincronizarConCouchDB(productoCouchDB);

// 4. Leer de SQLite y usar en la app
const datosSQL = await leerDeSQLite(id);
const productoApp = objectToCamelCase(datosSQL);
```

## 📚 Interfaces Disponibles

Todas las interfaces de `yola-fresh-utils` pueden extenderse usando este patrón:

- `IProducto`
- `IVenta`
- `Pedido`
- `ICompra`
- `IPersona`
- `IFinanzas`
- Y todas las demás...

## 🚀 Mejores Prácticas

1. **Mantén la librería independiente**: Nunca agregues dependencias específicas
2. **Usa tipos genéricos**: Aprovecha `ToSnakeCase` y `ToCamelCase`
3. **Transforma en los bordes**: Convierte solo al guardar/leer de bases de datos
4. **Mantén consistencia**: Usa el mismo patrón en toda tu aplicación
5. **Documenta tus extensiones**: Explica qué propiedades adicionales agregaste

## 🔍 Ejemplo Completo

Ver el archivo `examples/interface-extension-complete.ts` para un ejemplo completo de implementación en una aplicación React Native con SQLite y CouchDB.
