/**
 * Script para copiar archivos de documentación al directorio dist
 */

const fs = require('fs');
const path = require('path');

function copyDocsToDistribution() {
  console.log('📝 Copiando archivos de documentación...');
  
  const rootDir = path.join(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  
  // Crear directorio dist/docs si no existe
  const docsDistDir = path.join(distDir, 'docs');
  if (!fs.existsSync(docsDistDir)) {
    fs.mkdirSync(docsDistDir, { recursive: true });
  }
  
  // Archivos a copiar
  const filesToCopy = [
    'README.md',
    'GUIA-IMPLEMENTACION-USUARIOS.md',
    'SISTEMA-USUARIOS.md',
    'SISTEMA-USUARIOS-CLASES.md',
    'INSTALACION-GITHUB.md'
  ];
  
  let copiedCount = 0;
  
  filesToCopy.forEach(fileName => {
    const sourcePath = path.join(rootDir, fileName);
    const destPath = path.join(docsDistDir, fileName);
    
    try {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copiado: ${fileName}`);
        copiedCount++;
      } else {
        console.log(`⚠️  No encontrado: ${fileName}`);
      }
    } catch (error) {
      console.error(`❌ Error copiando ${fileName}:`, error.message);
    }
  });
  
  // También copiar README principal al root de dist
  const mainReadme = path.join(rootDir, 'README.md');
  const distReadme = path.join(distDir, 'README.md');
  
  try {
    if (fs.existsSync(mainReadme)) {
      fs.copyFileSync(mainReadme, distReadme);
      console.log(`✅ README.md copiado al root de dist`);
      copiedCount++;
    }
  } catch (error) {
    console.error(`❌ Error copiando README principal:`, error.message);
  }
  
  console.log(`🎉 Documentación copiada: ${copiedCount} archivos`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  copyDocsToDistribution();
}

module.exports = { copyDocsToDistribution };
