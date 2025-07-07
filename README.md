# Yola Fresh Utils

Biblioteca de utilidades para proyectos Yola Fresh, tanto web como móvil.

## Instalación

```bash
npm install yola-fresh-utils
# o
yarn add yola-fresh-utils

pnpm run generate-exports
pnpm run build
git add .
git commit -m "Update recent"
git push
```

## Uso

```typescript
// Importar utilidades específicas
import { formatToShortDate, isValidEmail, formatSolesPeruanos } from 'yola-fresh-utils';

// Importar interfaces
import { Producto, Usuario, Pedido } from 'yola-fresh-utils';

// Importar enums
import { TipoVentaEnum, OrderState } from 'yola-fresh-utils';

// Ejemplos de uso
const fecha = new Date();
const fechaFormateada = formatToShortDate(fecha);

const precio = 25.5;
const precioFormateado = formatSolesPeruanos(precio); // "S/.25.50"

const email = "usuario@ejemplo.com";
if (isValidEmail(email)) {
  console.log("Email válido");
}
```

## Documentación de Funciones Exportadas

### Utilidades de Fechas

#### `formatToShortDate(fecha: Date): string`
Formatea una fecha a un formato corto personalizado.
```typescript
// Ejemplo: para fecha 15 de enero de 2023
formatToShortDate(new Date(2023, 0, 15)); // "Enero 15,23"
```

#### `formatearFecha(fecha: string | Date): string`
Formatea una fecha a formato DD/MM/YYYY.
```typescript
formatearFecha(new Date(2023, 0, 15)); // "15/01/2023"
formatearFecha("2023-01-15"); // "15/01/2023"
```

#### `getDaysDifference(fechaInicio: Date, fechaFin: Date): number`
Calcula la diferencia en días entre dos fechas.
```typescript
getDaysDifference(new Date(2023, 0, 1), new Date(2023, 0, 10)); // 9
```

#### `isToday(fecha: Date): boolean`
Verifica si una fecha corresponde al día actual.
```typescript
isToday(new Date()); // true si es hoy
```

#### `addDays(fecha: Date, dias: number): Date`
Añade un número específico de días a una fecha.
```typescript
addDays(new Date(2023, 0, 1), 5); // 2023-01-06
```

### Formateo de Texto y Números

#### `formatearNumero(numero: number): string`
Formatea un número, añadiendo ceros a la izquierda si es menor a 1000.
```typescript
formatearNumero(5); // "005"
formatearNumero(1500); // "1500"
```

#### `formatSolesPeruanos(amount: number, version?: Versions): string`
Formatea un monto a soles peruanos.
```typescript
formatSolesPeruanos(25.5); // "S/.25.50"
```

#### `roundAmount(amount: number): number`
Redondea un monto a dos decimales.
```typescript
roundAmount(25.567); // 25.57
```

#### `capitalizarPrimeraLetra(texto: string): string`
Capitaliza la primera letra de un texto.
```typescript
capitalizarPrimeraLetra("hola mundo"); // "Hola mundo"
```

#### `convertToNumber(text: any): number`
Convierte un texto a número, incluyendo soporte para números escritos en palabras.
```typescript
convertToNumber("5"); // 5
convertToNumber("cinco"); // 5
convertToNumber("veinticinco"); // 25
```

#### `abreviarNombreCliente(nombreCompleto: string, maxCaracteres: number = 20): string`
Abrevia el nombre de un cliente para que no exceda un número máximo de caracteres.
```typescript
abreviarNombreCliente("Juan Carlos Pérez González", 15); // "Juan C. P."
```

#### `formatNameProduct(texto: string): string`
Formatea el nombre de un producto, eliminando caracteres especiales y normalizando espacios.
```typescript
formatNameProduct("PAPA  AMARILLA   (KILO)"); // "Papa amarilla (kilo)"
```

#### `normalizeUnit(unit: string): string`
Normaliza una unidad de medida a un formato estándar.
```typescript
normalizeUnit("KG"); // "kg"
normalizeUnit("Kilogramos"); // "kg"
```

#### `formatCantidad({ cantidad, tipoVenta, mayoreo, abreviado, categoriaId }): string`
Formatea una cantidad según el tipo de venta y otros parámetros.
```typescript
formatCantidad({ 
  cantidad: 1500, 
  tipoVenta: TipoVentaEnum.Kilogramo, 
  abreviado: true 
}); // "1.5 kg"
```

#### `convertirPesoProducto(peso: number): number`
Convierte un peso decimal a gramos multiplicando por 1000.
```typescript
convertirPesoProducto(0.5); // 500
convertirPesoProducto(2); // 2 (no se modifica si es entero)
```

#### `formatMedidaAbarrotes(tipoVenta: TipoVentaEnum, categoriaId: string): string`
Formatea la medida de productos de abarrotes según su tipo de venta y categoría.
```typescript
formatMedidaAbarrotes(TipoVentaEnum.Docena, "5"); // "und"
```

#### `transformCloudinaryUrl(url, width, height, mode, background): string`
Transforma una URL de Cloudinary para ajustar dimensiones y otros parámetros.
```typescript
transformCloudinaryUrl("https://res.cloudinary.com/demo/image/upload/sample.jpg", 200, 200);
// Retorna URL con transformaciones aplicadas
```

### Herramientas DOM y Utilidades

#### `wait(ms: number): Promise<void>`
Crea una promesa que se resuelve después de un tiempo específico.
```typescript
await wait(1000); // Espera 1 segundo
```

#### `openModal(dialogId: string): void`
Abre un modal HTML dialog por su ID.
```typescript
openModal("mi-modal"); // Abre el modal con id="mi-modal"
```

#### `closeModal(dialogId: string): void`
Cierra un modal HTML dialog por su ID.
```typescript
closeModal("mi-modal"); // Cierra el modal con id="mi-modal"
```

#### `efectoClickClient(elementId: string, callback: () => void): void`
Aplica un efecto visual a un elemento y ejecuta una función callback.
```typescript
efectoClickClient("mi-boton", () => console.log("Botón clickeado"));
```

#### `efectoClickServer(elementId: string, callback: () => void): void`
Añade un evento de click a un elemento con efecto visual y ejecuta una función callback.
```typescript
efectoClickServer("mi-boton", () => console.log("Botón clickeado"));
```

### Validadores y Expresiones Regulares

#### `isValidEmail(email: string): boolean`
Valida si un correo electrónico tiene un formato válido.
```typescript
isValidEmail("usuario@ejemplo.com"); // true
```

#### `isValidPhone(phone: string): boolean`
Valida si un número de teléfono tiene un formato válido.
```typescript
isValidPhone("912345678"); // true
```

#### `isValidPassword(password: string): boolean`
Valida si una contraseña cumple con los requisitos mínimos de seguridad.
```typescript
isValidPassword("Abc123!"); // true/false dependiendo de los requisitos
```

#### `isNotEmpty(text: string): boolean`
Valida si un texto no está vacío o solo contiene espacios.
```typescript
isNotEmpty("  "); // false
isNotEmpty("texto"); // true
```

#### `isValidNumber(value: any): boolean`
Valida si un valor es un número válido.
```typescript
isValidNumber("123"); // true
isValidNumber("abc"); // false
```

#### `isValidDate(date: any): boolean`
Valida si una fecha es válida.
```typescript
isValidDate(new Date()); // true
isValidDate("2023-13-45"); // false
```

#### `isValidUrl(url: string): boolean`
Valida si una URL tiene un formato válido.
```typescript
isValidUrl("https://ejemplo.com"); // true
```

#### `buildCommandRegex(phrases: string[]): RegExp`
Construye una expresión regular a partir de un array de frases.
```typescript
buildCommandRegex(["manzana", "pera"]); // RegExp que coincide con "manzana" o "pera"
```

### Búsqueda y Filtrado

#### `searchCategory(clave: "id" | "nombre" | "tag", valor: string)`
Busca una categoría por su id, nombre o tag.
```typescript
searchCategory("nombre", "Frutas"); // Retorna la categoría si existe
```

## Enums

### `OrderState`
Estados de un pedido.
```typescript
enum OrderState {
  PENDIENTE = 'PENDIENTE',
  ATENDIENDO = 'ATENDIENDO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
  DESPACHADO = 'DESPACHADO',
}
```

### `TipoVentaEnum`
Tipos de venta para productos.
```typescript
enum TipoVentaEnum {
  Kilogramo = 'kilogramo',
  Unidad = 'unidad',
  Saco = 'saco',
  Docena = 'docena',
  Arroba = 'arroba',
  Caja = 'caja',
  Balde = 'balde',
  Bolsa = 'bolsa',
  Paquete = 'paquete',
  Gramo = 'gramo',
  Mililitro = 'mililitro',
  Litro = 'litro',
  SixPack = 'sixpack',
  Atado = 'atado',
}
```

### `EstadoStockEnum`
Estados de stock para productos.
```typescript
enum EstadoStockEnum {
  STOCK_AGOTADO = 'STOCK_AGOTADO',
  STOCK_BAJO = 'STOCK_BAJO',
  STOCK_MEDIO = 'STOCK_MEDIO',
  STOCK_ALTO = 'STOCK_ALTO',
}
```

### `TipoActualizacionEnum`
Tipos de actualización para productos.
```typescript
enum TipoActualizacionEnum {
  COMPRA_VENTA = 'COMPRA_VENTA',
  DESCUENTO = 'DESCUENTO',
  STOCK = 'STOCK',
}
```

## Interfaces

La biblioteca incluye numerosas interfaces para modelar entidades como:

### `Producto`
Interfaz para representar productos.
```typescript
interface Producto {
  id: string;
  nombre: string;
  precio: number;
  // ... otras propiedades
}
```

### `Usuario`
Interfaz para representar usuarios.
```typescript
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  // ... otras propiedades
}
```

### `Pedido`
Interfaz para representar pedidos.
```typescript
interface Pedido {
  id: string;
  clienteId: string;
  productos: ProductoPedido[];
  estado: OrderState;
  // ... otras propiedades
}
```

### `Carrito`
Interfaz para representar carritos de compra.
```typescript
interface Carrito {
  id: string;
  productos: ProductoCarrito[];
  // ... otras propiedades
}
```

## Contribuir
Para contribuir a este proyecto, por favor crea un fork del repositorio, realiza tus cambios y envía un pull request.

## Licencia
ISC
