/**
 * Script para verificar y construir el proyecto durante la instalación
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkAndBuild() {
  const distPath = path.join(__dirname, '..', 'dist');
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  console.log('🔍 Verificando estado del paquete...');
  
  // Verificar si existe dist
  const distExists = fs.existsSync(distPath);
  console.log(`📁 Carpeta dist: ${distExists ? '✅ Existe' : '❌ No existe'}`);
  
  if (!distExists) {
    console.log('🔨 Construyendo el paquete...');
    
    try {
      // Verificar si tenemos las dependencias de desarrollo
      const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
      const hasDevDeps = fs.existsSync(path.join(nodeModulesPath, 'typescript'));
      
      if (!hasDevDeps) {
        console.log('📦 Instalando dependencias de desarrollo...');
        execSync('npm install --only=dev', { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
      }
      
      // Construir
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      console.log('✅ Construcción completada');
      
    } catch (error) {
      console.error('❌ Error durante la construcción:', error.message);
      console.log('⚠️  El paquete puede no funcionar correctamente');
      
      // Crear un dist mínimo con un mensaje de error
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
        fs.writeFileSync(
          path.join(distPath, 'index.js'),
          `console.error('Este paquete necesita ser construido. Ejecuta: npm run build');
module.exports = {};`
        );
        fs.writeFileSync(
          path.join(distPath, 'index.d.ts'),
          `// Este paquete necesita ser construido
export {};`
        );
      }
    }
  } else {
    console.log('✅ El paquete ya está construido');
  }
  
  // Verificar que los archivos principales existen
  const mainFile = path.join(distPath, 'index.js');
  const typesFile = path.join(distPath, 'index.d.ts');
  
  console.log(`📄 index.js: ${fs.existsSync(mainFile) ? '✅' : '❌'}`);
  console.log(`📄 index.d.ts: ${fs.existsSync(typesFile) ? '✅' : '❌'}`);
  
  console.log('🎉 Verificación completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  checkAndBuild();
}

module.exports = { checkAndBuild };
