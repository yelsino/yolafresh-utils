// Ejemplo de uso de yola-fresh-utils
const { 
  Producto, 
  TipoVentaEnum, 
  EstadoStockEnum,
  MedidasConverter,
  formatToShortDate 
} = require('./dist');

console.log('=== EJEMPLO DE USO DE YOLA-FRESH-UTILS ===\n');

// 1. Crear productos
console.log('1. Creando productos:');
const arroz = new Producto({
  id: 'prod-001',
  nombre: 'Arroz Premium',
  precio: 2500,
  tipoVenta: TipoVentaEnum.Kilogramo,
  stock: EstadoStockEnum.STOCK_MEDIO,
  precioCompra: 2000
});

const aceite = new Producto({
  id: 'prod-002', 
  nombre: 'Aceite Vegetal',
  precio: 850,
  tipoVenta: TipoVentaEnum.Litro,
  stock: EstadoStockEnum.STOCK_ALTO,
  precioCompra: 650
});

console.log(`- ${arroz.nombre}: $${arroz.precio} por ${arroz.tipoVenta}`);
console.log(`- ${aceite.nombre}: $${aceite.precio} por ${aceite.tipoVenta}`);

// 2. Formatear cantidades
console.log('\n2. Formateando cantidades:');
console.log(`- 2.5 kg de arroz: ${arroz.formatCantidad({ cantidad: 2.5, tipoVenta: TipoVentaEnum.Kilogramo })}`);
console.log(`- 1.5 litros de aceite: ${aceite.formatCantidad({ cantidad: 1.5, tipoVenta: TipoVentaEnum.Litro })}`);

// 3. Calcular precios con descuento
console.log('\n3. Calculando precios con descuento:');
console.log(`- Arroz con 10% descuento: $${arroz.calcularPrecioConDescuento(10)}`);
console.log(`- Aceite con 15% descuento: $${aceite.calcularPrecioConDescuento(15)}`);

// 4. Verificar estado del stock
console.log('\n4. Estado del stock:');
console.log(`- Arroz tiene stock bajo: ${arroz.tieneStockBajo()}`);
console.log(`- Aceite tiene stock bajo: ${aceite.tieneStockBajo()}`);
console.log(`- Arroz está disponible: ${arroz.estaDisponible()}`);

// 5. Calcular margen de ganancia
console.log('\n5. Margen de ganancia:');
console.log(`- Margen del arroz: ${arroz.calcularMargenGanancia()}%`);
console.log(`- Margen del aceite: ${aceite.calcularMargenGanancia()}%`);

// 6. Usar utilidades
console.log('\n6. Utilidades adicionales:');
console.log(`- Fecha actual formateada: ${formatToShortDate(new Date())}`);
console.log(`- Abreviación de kilogramo: ${MedidasConverter.getAbreviacion(TipoVentaEnum.Kilogramo)}`);
console.log(`- Abreviación de litro: ${MedidasConverter.getAbreviacion(TipoVentaEnum.Litro)}`);

// 7. Serializar productos
console.log('\n7. Serialización JSON:');
console.log('Producto arroz serializado:');
console.log(JSON.stringify(arroz.toJSON(), null, 2));

console.log('\n=== FIN DEL EJEMPLO ===');