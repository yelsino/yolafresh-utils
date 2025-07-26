# Clases de Sistema POS - Reutilizable

Esta librería proporciona clases completamente reutilizables para crear sistemas de punto de venta (POS) en cualquier país o contexto fiscal.

## 🚀 Instalación y Uso Básico

```typescript
import { ShoppingCart, Venta, ConfiguracionFiscal } from 'yola-fresh-utils';
```

## 🛒 ShoppingCart - Carrito de Compras

### Crear un Carrito según País

```typescript
// Para Perú (IGV 18%)
const carritoPerú = ShoppingCart.paraPerú();

// Para México (IVA 16%)
const carritoMéxico = ShoppingCart.paraMéxico();

// Para Colombia (IVA 19%)
const carritoColombia = ShoppingCart.paraColombia();

// Sin impuestos
const carritoSinImpuestos = ShoppingCart.sinImpuestos();

// Cualquier país disponible
const carritoArgentina = ShoppingCart.paraPais('ARGENTINA');
```

### Configuración Personalizada

```typescript
// Tasa personalizada (ej: 15%)
const carritoPersonalizado = ShoppingCart.personalizado(0.15, 'IVA Personal');

// Configuración completa
const carrito = ShoppingCart.conConfiguracion({
  tasaImpuesto: 0.21,
  aplicaImpuesto: true,
  nombreImpuesto: 'IVA'
});
```

### Agregar Productos

```typescript
const producto = {
  id: 'prod-001',
  nombre: 'Manzana Red Delicious',
  precio: 5.50,
  tipoVenta: 'kg'
};

const carItem = {
  id: 'item-001',
  product: producto,
  quantity: 2.5,
  peso: 2.5 // Para productos pesables
};

carrito.agregarProducto(carItem);
```

### Gestionar Impuestos en Tiempo Real

```typescript
// Cambiar configuración fiscal después de crear el carrito
carrito.habilitarImpuesto(0.18, 'IGV');
carrito.deshabilitarImpuesto();

// Verificar configuración actual
console.log(carrito.configuracionFiscal);
console.log(carrito.impuesto); // Se recalcula automáticamente
```

## 📊 Venta - Venta Finalizada

### Crear Venta desde Carrito

```typescript
const carritoJSON = carrito.toJSON();

// Crear venta con configuración fiscal específica
const venta = Venta.fromShoppingCart(carritoJSON, {
  nombre: 'Venta #001',
  procedencia: ProcedenciaVenta.Tienda,
  tipoPago: 'Efectivo',
  dineroRecibido: 100,
  // ⭐ Sobrescribir configuración fiscal al finalizar
  configuracionFiscal: {
    tasaImpuesto: 0.15, // Cambiar a 15% en lugar del IGV 18%
    aplicaImpuesto: true,
    nombreImpuesto: 'ISC' // Impuesto especial
  }
});

console.log(venta.resumen);
console.log(venta.cambio); // Calculado automáticamente
```

## 🌍 Configuraciones Fiscales Predefinidas

### Países Disponibles

```typescript
import { CONFIGURACIONES_FISCALES, ConfiguracionFiscalFactory } from 'yola-fresh-utils';

// Ver todos los países disponibles
console.log(ConfiguracionFiscalFactory.paisesDisponibles());

// Usar configuraciones directamente
const configPerú = CONFIGURACIONES_FISCALES.PERU;
const configMéxico = CONFIGURACIONES_FISCALES.MEXICO;
const configSinImpuestos = CONFIGURACIONES_FISCALES.SIN_IMPUESTOS;
```

### Utilidades Fiscales

```typescript
import { FiscalUtils } from 'yola-fresh-utils';

// Calcular impuesto manualmente
const impuesto = FiscalUtils.calcularImpuesto(100, CONFIGURACIONES_FISCALES.PERU);

// Calcular total con impuesto
const total = FiscalUtils.calcularTotalConImpuesto(100, CONFIGURACIONES_FISCALES.PERU);

// Validar configuración
const { valida, errores } = FiscalUtils.validarConfiguracion(miConfiguracion);

// Formatear para mostrar
const texto = FiscalUtils.formatearPorcentaje(CONFIGURACIONES_FISCALES.PERU); // "IGV 18.00%"
```

## 🔧 Casos de Uso Comunes

### 1. Sistema POS para Restaurant (Sin Impuestos)

```typescript
const carrito = ShoppingCart.sinImpuestos('mesa-5');

carrito.agregarProducto({
  id: 'item-1',
  product: {
    id: 'plato-001',
    nombre: 'Ceviche',
    precio: 25.00
  },
  quantity: 2
});

const venta = Venta.fromShoppingCart(carrito.toJSON(), {
  nombre: 'Mesa 5 - Almuerzo',
  procedencia: ProcedenciaVenta.Tienda,
  tipoPago: 'Tarjeta'
});
```

### 2. E-commerce con Múltiples Países

```typescript
function crearCarritoParaPais(codigoPais: string) {
  const mapaConfiguraciones = {
    'PE': 'PERU',
    'MX': 'MEXICO',
    'CO': 'COLOMBIA',
    'AR': 'ARGENTINA'
  };
  
  const configKey = mapaConfiguraciones[codigoPais] || 'SIN_IMPUESTOS';
  return ShoppingCart.paraPais(configKey as keyof typeof CONFIGURACIONES_FISCALES);
}

const carritoCliente = crearCarritoParaPais('PE'); // IGV 18%
```

### 3. Cambio de Configuración Fiscal Durante la Venta

```typescript
const carrito = ShoppingCart.sinImpuestos();

// Agregar productos
carrito.agregarProducto(producto1);
carrito.agregarProducto(producto2);

// Cliente decide facturación (aplicar IGV)
carrito.habilitarImpuesto(0.18, 'IGV');

// El total se recalcula automáticamente
console.log(carrito.total); // Incluye IGV
```

### 4. Validation y Error Handling

```typescript
try {
  const carrito = ShoppingCart.paraPais('BRASIL'); // No existe
} catch (error) {
  console.error(error.message); // "Configuración fiscal no encontrada para: BRASIL"
}

// Validar antes de usar
const miConfig = { tasaImpuesto: 1.5 }; // Inválido (>1)
const { valida, errores } = FiscalUtils.validarConfiguracion(miConfig);

if (!valida) {
  console.error('Configuración inválida:', errores);
}
```

## 📋 Interfaces Principales

### ConfiguracionFiscal

```typescript
interface ConfiguracionFiscal {
  tasaImpuesto?: number;     // 0.18 = 18%
  aplicaImpuesto?: boolean;  // true/false
  nombreImpuesto?: string;   // 'IGV', 'IVA', etc.
}
```

### CarItem

```typescript
interface CarItem {
  id: string;
  product: Producto;
  quantity: number;
  precioUnitario?: number;
  montoModificado?: boolean;
  montoTotal?: number | null;
  tipoVenta?: TipoVentaEnum;
  peso?: number;
  descuento?: number;
}
```

## 🎯 Ventajas de Reutilización

### ✅ Lo que ya tienes listo:

1. **Configuraciones fiscales predefinidas** para múltiples países
2. **Cálculos automáticos** de impuestos y totales
3. **Validaciones** integradas
4. **Flexibilidad** para cambiar configuración en tiempo real
5. **Factory methods** para creación rápida
6. **Serialización** para persistencia
7. **Inmutabilidad** en ventas finalizadas
8. **TypeScript** completamente tipado

### 🚀 Para usar en otros proyectos:

1. Instala el paquete
2. Importa las clases
3. Usa los factory methods según tu país
4. ¡Listo para producción!

## 🔄 Ejemplo Completo de Flujo

```typescript
// 1. Crear carrito para el país específico
const carrito = ShoppingCart.paraPerú();

// 2. Agregar productos
carrito.agregarProducto({
  id: 'item-1',
  product: { id: 'prod-1', nombre: 'Producto A', precio: 100 },
  quantity: 2
});

// 3. Ver totales (IGV incluido automáticamente)
console.log(carrito.resumen);
// { subtotal: 200, impuesto: 36, total: 236 }

// 4. Procesar pago
const venta = Venta.fromShoppingCart(carrito.toJSON(), {
  nombre: 'Venta #001',
  procedencia: ProcedenciaVenta.Tienda,
  tipoPago: 'Efectivo',
  dineroRecibido: 250
});

// 5. Venta finalizada e inmutable
console.log(venta.cambio); // 14
console.log(venta.resumen);
```

## 🌟 Próximos Pasos

Tu librería ya está lista para ser reutilizada. Solo necesitas:

1. **Publicar como paquete npm** 
2. **Documentar casos de uso específicos** por industria
3. **Agregar más países** si es necesario
4. **Tests unitarios** para cada configuración

¡Felicidades! Has creado un sistema verdaderamente reutilizable. 🎉 