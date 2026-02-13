# Documentación de Tipos - Yola Fresh Utils

Esta librería proporciona tipos y clases completamente documentadas para sistemas de punto de venta.

## 🛒 Carrito de Compras (ShoppingCart)

### Interfaces Principales

#### `IShoppingCart`

Interfaz principal que define la estructura completa de un carrito de compras.

**Propósito**: Estandarizar la estructura de datos para carritos de compra reutilizables.

**Casos de uso**:

- Sistemas POS de restaurants
- E-commerce
- Aplicaciones de venta móvil
- Sistemas de inventario

#### `CarItem`

Representa un producto individual dentro del carrito.

**Propósito**: Encapsular toda la información necesaria de un producto en el carrito.

**Campos importantes**:

- `quantity`: Para productos normales es unidades, para pesables es el peso
- `peso`: Solo se usa cuando `tipoVenta` es por peso (kg, litros)
- `montoModificado`: Cuando es `true`, el precio no se recalcula automáticamente

### Configuración Fiscal

#### `ConfiguracionFiscal`

Define la configuración de impuestos para diferentes países.

**Configuraciones predefinidas**:

- `PERU`: IGV 18%
- `MEXICO`: IVA 16%
- `COLOMBIA`: IVA 19%
- `ARGENTINA`: IVA 21%
- `SIN_IMPUESTOS`: Para servicios locales

## 💰 Interfaces Financieras

#### `Ingreso`

Registro completo de un ingreso financiero en el sistema.

**Campos de trazabilidad**:

- `quienRegistroId`: ID del usuario que registró
- `fechaRegistro`: Timestamp de creación
- `fechaActualizacion`: Timestamp de última modificación

**Campos de negocio**:

- `monto`: Valor monetario del ingreso
- `tipoIngreso`: Contado vs Crédito
- `metodoPago`: Efectivo, tarjeta, digital, etc.

## 📦 Compras y logística (ERP)

En el módulo de compras, el modelo separa claramente lo económico de lo físico:

- `EventoCompra`: macro proceso logístico (viaje/campaña/abastecimiento).
- `Compra`: documento económico individual por proveedor (siempre dentro de un `EventoCompra`).
- `RecepcionMercaderia`: evento físico de ingreso ligado al proceso.
- `MovimientoInventario`: impacto real en stock (kardex).

Regla de dominio clave:

- `ICompra.eventoCompraId` es obligatorio: no puede existir una `Compra` fuera de un `EventoCompra`.

Motores stateless del flujo:

- `EventoCompraBuilder`: crea y ajusta el evento y sus ítems vinculados a proveedor.
- `CompraGenerator`: agrupa ítems por proveedor y genera compras en borrador.
- `RecepcionProcessor`: valida recepciones, genera movimiento y determina completitud.

## 👥 Gestión de Personas

#### `Cliente`

Información completa de un cliente del sistema.

#### `Personal`

Datos de empleados que pueden realizar ventas.

**Campos específicos**:

- `cargo`: Rol del empleado (VENDEDOR, CAJERO, etc.)
- `username`/`password`: Para autenticación

## 🔧 Uso en IDEs

### Visual Studio Code

```json
// settings.json
{
  "typescript.suggest.includeCompletions": "on",
  "typescript.suggest.jsdoc.generateReturns": true
}
```

### IntelliJ/WebStorm

Las anotaciones JSDoc se muestran automáticamente en:

- Autocompletado (Ctrl+Space)
- Hover sobre tipos
- Documentación rápida (Ctrl+Q)

### Otros IDEs

Cualquier IDE con soporte TypeScript mostrará la documentación JSDoc automáticamente.

## 📝 Ejemplos de Documentación en Tiempo Real

Cuando uses la librería, verás algo como esto:

```typescript
// Al escribir "carrito." el IDE muestra:
carrito.
  ├── id: string                    // Identificador único del carrito
  ├── items: CarItem[]             // Lista de productos en el carrito
  ├── subtotal: number             // Subtotal sin impuestos ni descuentos
  ├── total: number                // Total final a pagar
  ├── configurarTrazabilidad()     // Configurar información de trazabilidad
  └── agregarProducto()            // Agregar o actualizar un CarItem en la venta
```

## 🎯 Beneficios para Desarrolladores

1. **Autocompletado inteligente**: El IDE sugiere solo propiedades válidas
2. **Documentación en línea**: Sin necesidad de consultar documentación externa
3. **Validación de tipos**: Errores detectados en tiempo de desarrollo
4. **Ejemplos integrados**: Cada interfaz incluye ejemplos de uso
5. **Restricciones claras**: Valores mínimos/máximos documentados

## 🚀 Configuración Recomendada

Para obtener la mejor experiencia de desarrollo:

```bash
# Instalar tipos adicionales
npm install --save-dev @types/node

# Configurar TypeScript estricto
# tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

Esta configuración garantiza que aproveches al máximo la documentación integrada.
