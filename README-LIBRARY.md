# 🛒 Yola Fresh Utils

> Sistema POS completo y reutilizable con soporte fiscal para múltiples países

[![npm version](https://badge.fury.io/js/yola-fresh-utils.svg)](https://www.npmjs.com/package/yola-fresh-utils)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Características

- 🌍 **Multi-país**: Configuraciones fiscales para Perú, México, Colombia, Argentina y más
- 🧮 **Cálculos automáticos**: IGV, IVA y otros impuestos calculados automáticamente
- 🛒 **Carrito inteligente**: Manejo de productos pesables y por unidad
- 👥 **Trazabilidad completa**: Cliente, vendedor y datos de auditoría
- 📝 **Documentación rica**: IntelliSense completo en tu IDE
- 🔒 **Type-safe**: 100% TypeScript con validaciones estrictas
- 🚀 **Fácil de usar**: Factory methods para configuración rápida

## 📦 Instalación

```bash
npm install yola-fresh-utils
# o
yarn add yola-fresh-utils
# o
pnpm add yola-fresh-utils
```

## 🚀 Inicio Rápido

### Para Perú (IGV 18%)
```typescript
import { ShoppingCart, ProcedenciaVenta } from 'yola-fresh-utils';

// Crear carrito con IGV automático
const carrito = ShoppingCart.paraPeru('mesa-5', 'Mesa 5');

// Agregar productos
carrito.agregarProducto({
  id: 'item-001',
  product: {
    id: 'prod-001', 
    nombre: 'Ceviche',
    precio: 25.00
  },
  quantity: 2
});

// Ver totales automáticos
console.log(carrito.subtotal); // 50.00
console.log(carrito.impuesto); // 9.00 (IGV 18%)
console.log(carrito.total);    // 59.00
```

### Para México (IVA 16%)
```typescript
const carrito = ShoppingCart.paraMexico('pos-001', 'Venta Mostrador');
// IVA 16% aplicado automáticamente
```

### Sin impuestos (Servicios locales)
```typescript
const carrito = ShoppingCart.sinImpuestos('servicio-001', 'Servicio Técnico');
// Sin impuestos aplicados
```

## 📖 Documentación Interactiva

### En tu IDE verás algo como esto:

<details>
<summary>🎯 Autocompletado Inteligente</summary>

```typescript
carrito.
  ├── agregarProducto()     // Agregar o actualizar un CarItem en la venta
  ├── total                 // Total final a pagar (subtotal + impuestos - descuentos)
  ├── subtotal              // Subtotal sin impuestos ni descuentos  
  ├── impuesto              // Monto total de impuestos calculado automáticamente
  ├── configurarPago()      // Configurar datos de pago
  └── configurarTrazabilidad() // Configurar información de cliente y vendedor
```

</details>

<details>
<summary>📝 Documentación en Hover</summary>

Cuando haces hover sobre cualquier propiedad:

```
total: number
───────────────
Total final a pagar

@description Subtotal + impuestos - descuentos
@minimum 0
```

</details>

## 🌍 Configuraciones por País

| País | Impuesto | Nombre | Factory Method |
|------|----------|---------|----------------|
| 🇵🇪 Perú | 18% | IGV | `ShoppingCart.paraPeru()` |
| 🇲🇽 México | 16% | IVA | `ShoppingCart.paraMexico()` |
| 🇨🇴 Colombia | 19% | IVA | `ShoppingCart.paraColombia()` |
| 🇦🇷 Argentina | 21% | IVA | `ShoppingCart.paraArgentina()` |
| 🇪🇸 España | 21% | IVA | `ShoppingCart.paraEspana()` |
| 🚫 Sin impuestos | 0% | - | `ShoppingCart.sinImpuestos()` |

## 👥 Trazabilidad Completa

```typescript
import { Cliente, Personal, CargosPersonal } from 'yola-fresh-utils';

const cliente: Cliente = {
  id: 'cliente-001',
  nombres: 'Juan Pérez',
  celular: '999123456',
  // ... más campos documentados
};

const vendedor: Personal = {
  id: 'vendedor-001', 
  nombres: 'María González',
  cargo: CargosPersonal.VENDEDOR,
  // ... más campos documentados
};

carrito.configurarTrazabilidad({
  cliente,
  personal: vendedor,
  clienteColor: '#FF5733'
});
```

## 🛍️ Casos de Uso

### 🍕 Restaurant
```typescript
const carrito = ShoppingCart.sinImpuestos('mesa-8', 'Mesa 8');
// Perfecto para restaurants que no cobran IGV
```

### 🏪 Retail
```typescript
const carrito = ShoppingCart.paraPeru('tienda-001', 'Venta Tienda');
// Con IGV incluido automáticamente
```

### 🌐 E-commerce Multi-país
```typescript
function crearCarritoPorPais(codigoPais: string) {
  const configuraciones = {
    'PE': () => ShoppingCart.paraPeru(),
    'MX': () => ShoppingCart.paraMexico(),
    'CO': () => ShoppingCart.paraColombia(),
  };
  
  return configuraciones[codigoPais]?.() || ShoppingCart.sinImpuestos();
}
```

## 🔧 Configuración Personalizada

```typescript
import { ConfiguracionFiscal } from 'yola-fresh-utils';

// Configuración custom
const configChile: ConfiguracionFiscal = {
  tasaImpuesto: 0.19,
  aplicaImpuesto: true,
  nombreImpuesto: 'IVA Chile'
};

const carrito = ShoppingCart.conConfiguracion(configChile);
```

## 📊 Procesamiento de Ventas

```typescript
import { Venta, OrderState } from 'yola-fresh-utils';

// Finalizar venta
const carritoJSON = carrito.toJSON();
const venta = Venta.fromShoppingCart(carritoJSON);

console.log(venta.estaProcesada); // true
console.log(venta.resumen);       // Resumen completo
```

## 🎯 Beneficios para Desarrolladores

### ✅ En desarrollo verás:
- **Autocompletado inteligente**: Solo propiedades válidas
- **Documentación en línea**: Sin consultar docs externas
- **Validación de tipos**: Errores detectados temprano
- **Ejemplos integrados**: En cada interfaz
- **Restricciones claras**: Valores min/max documentados

### ✅ Para el negocio obtienes:
- **Cálculos exactos**: Matemática fiscal correcta
- **Auditoría completa**: Trazabilidad de todas las operaciones
- **Flexibilidad**: Funciona en cualquier país
- **Escalabilidad**: Probado en producción

## 🧪 Testing

```typescript
import { ShoppingCart } from 'yola-fresh-utils';

describe('ShoppingCart', () => {
  it('debe calcular IGV correctamente para Perú', () => {
    const carrito = ShoppingCart.paraPeru();
    
    carrito.agregarProducto({
      id: 'test-001',
      product: { id: 'prod-001', nombre: 'Test', precio: 100 },
      quantity: 1
    });
    
    expect(carrito.subtotal).toBe(100);
    expect(carrito.impuesto).toBe(18);
    expect(carrito.total).toBe(118);
  });
});
```

## 🤝 Contribuir

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/yola-fresh-utils.git

# Instalar dependencias
npm install

# Ejecutar tests
npm test

# Construir
npm run build
```

## 📄 Licencia

MIT © [Tu Nombre](https://github.com/tu-usuario)

---

## 💡 ¿Necesitas ayuda?

- 📚 [Documentación completa](./src/docs/types.md)
- 🐛 [Reportar issues](https://github.com/tu-usuario/yola-fresh-utils/issues)
- 💬 [Discusiones](https://github.com/tu-usuario/yola-fresh-utils/discussions)

---

**⭐ Si te gusta este proyecto, dale una estrella en GitHub**