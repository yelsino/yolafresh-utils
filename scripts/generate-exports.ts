// @ts-nocheck

const fs = require('fs');
const path = require('path');

// Directorios a escanear
const directories = [
  { path: '../src/domain/shared/utils', prefix: '' },
  { path: '../src/domain/shared/interfaces', prefix: '' },
  { path: '../src/domain/shared/base', prefix: '' },
  { path: '../src/domain/shared/value-objects', prefix: '' },
];



// Función para generar las exportaciones para una carpeta específica
async function generateExportsForDirectory(dir: { path: string, prefix: string }) {
  const exportStatements: string[] = [];
  
  // Comentario inicial
  exportStatements.push('// Este archivo es generado automáticamente');
  exportStatements.push('// No modificar manualmente');
  exportStatements.push('');
  
  const dirName = path.basename(dir.path);
  exportStatements.push(`// Exportaciones de ${dirName}`);
  
  const fullPath = path.resolve(__dirname, dir.path);
  
  try {
    const files = fs.readdirSync(fullPath);
    
    // Filtrar solo archivos .ts que no sean index.ts o archivos de prueba
    const tsFiles = files.filter((file: string) => 
      file.endsWith('.ts') && 
      !file.endsWith('.test.ts') && 
      !file.endsWith('.spec.ts') && 
      file !== 'index.ts'
    );
    
    // Ordenar alfabéticamente
    tsFiles.sort();
    
    // Generar las líneas de exportación
    const isInterfacesDir = dir.path.includes('domain/shared/interfaces');
    for (const file of tsFiles) {
      const moduleName = path.basename(file, '.ts');
      if (isInterfacesDir && moduleName === 'pedido') continue;
      exportStatements.push(`export * from './${moduleName}';`);
    }
    if (isInterfacesDir) {
      exportStatements.push(
        "export type { Hora, Carrito, IntemList, ItemCarDB, ItemCar, Direccion as DireccionPedido, Register, Pedido, Tipo, ItemLista, Lista, UserCaracteristicProduct, SendEmail } from './pedido';",
      );
    }
    
    // Escribir al archivo de salida
    const outputPath = path.join(fullPath, 'index.ts');
    fs.writeFileSync(outputPath, exportStatements.join('\n'));
    
    console.log(`Exportaciones generadas en ${outputPath}`);
  } catch (error) {
    console.error(`Error al procesar el directorio ${dir.path}:`, error);
  }
}

// Función para generar el archivo index.ts principal
async function generateMainIndex() {
  const exportStatements: string[] = [];
  
  // Comentario inicial
  exportStatements.push('// Este archivo es generado automáticamente');
  exportStatements.push('// No modificar manualmente');
  exportStatements.push('');
  
  exportStatements.push('// Exportaciones por categoría');
  exportStatements.push("export * from './domain/shared/interfaces';");
  exportStatements.push("export * from './domain/shared/utils';");
  exportStatements.push("export * from './domain/shared/base';");
  exportStatements.push("export * from './domain/shared/value-objects';");
  exportStatements.push("export * from './domain/ventas/Venta';");
  exportStatements.push("export * from './domain/ventas/CarritoVenta';");
  exportStatements.push("export * from './domain/inventario/MovimientoInventarioService';");


  exportStatements.push('');
  
  exportStatements.push('// También puedes exportar directamente los módulos más utilizados aquí si lo deseas');
  exportStatements.push('// Por ejemplo:');
  exportStatements.push("// export { Producto, UpdateProducto } from './interfaces/producto';");
  exportStatements.push("// export { formatearFecha } from './utils/textos';");
  
  // Escribir al archivo de salida
  const outputPath = path.resolve(__dirname, '../src/index.ts');
  fs.writeFileSync(outputPath, exportStatements.join('\n'));
  
  console.log(`Exportaciones generadas en ${outputPath}`);
}

// Ejecutar la función principal
async function generateExports() {
  // Generar exportaciones para cada directorio
  for (const dir of directories) {
    await generateExportsForDirectory(dir);
  }
  
  // Generar el archivo index.ts principal
  await generateMainIndex();
}

// Ejecutar la función
generateExports().catch(console.error);
