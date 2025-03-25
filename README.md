# Yola Fresh Utils

Biblioteca de utilidades para proyectos Yola Fresh, tanto web como móvil.

## Instalación

```bash
npm install yola-fresh-utils
# o
yarn add yola-fresh-utils

npm run generate-exports
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

## Utilidades disponibles

### Formateo de fechas
- `formatToShortDate`: Formatea una fecha a formato corto (ej. "Enero 15,23")
- `formatearFecha`: Formatea una fecha a formato DD/MM/YYYY
- `getDaysDifference`: Obtiene la diferencia en días entre dos fechas
- `isToday`: Verifica si una fecha es hoy
- `addDays`: Añade días a una fecha

### Formateo de texto y números
- `formatearNumero`: Formatea un número a un formato específico
- `formatSolesPeruanos`: Formatea un monto a soles peruanos
- `roundAmount`: Redondea un monto a dos decimales
- `capitalizarPrimeraLetra`: Capitaliza la primera letra de un texto
- `convertToNumber`: Convierte un texto a número
- `abreviarNombreCliente`: Abrevia el nombre de un cliente
- `formatNameProduct`: Formatea el nombre de un producto
- `normalizeUnit`: Normaliza una unidad de medida

### Validadores
- `isValidEmail`: Valida si un correo electrónico tiene un formato válido
- `isValidPhone`: Valida si un número de teléfono tiene un formato válido
- `isValidPassword`: Valida si una contraseña cumple con los requisitos mínimos de seguridad
- `isNotEmpty`: Valida si un texto está vacío o solo contiene espacios
- `isValidNumber`: Valida si un valor es un número válido
- `isValidDate`: Valida si una fecha es válida
- `isValidUrl`: Valida si una URL tiene un formato válido

## Enums
- `OrderState`: Estados de un pedido
- `TipoVentaEnum`: Tipos de venta
- `EstadoStockEnum`: Estados de stock
- `TipoActualizacionEnum`: Tipos de actualización

## Interfaces
La biblioteca incluye numerosas interfaces para modelar entidades como:
- `Producto`
- `Usuario`
- `Carrito`
- `Pedido`
- `Lista`
- Y muchas más...

## Contribuir
Para contribuir a este proyecto, por favor crea un fork del repositorio, realiza tus cambios y envía un pull request.

## Licencia
ISC
