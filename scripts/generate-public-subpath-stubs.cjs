const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

const stubs = [
  { subpath: "ventas", target: "dist/domain/ventas/index" },
  { subpath: "ventas/contracts", target: "dist/domain/ventas/contracts/index" },
  { subpath: "ventas/entities", target: "dist/domain/ventas/entities/index" },
  { subpath: "ventas/events", target: "dist/domain/ventas/events/index" },
  { subpath: "compras", target: "dist/domain/compras/index" },
  { subpath: "compras/contracts", target: "dist/domain/compras/contracts/index" },
  { subpath: "compras/entities", target: "dist/domain/compras/entities/index" },
  { subpath: "inventario", target: "dist/domain/inventario/index" },
  { subpath: "inventario/contracts", target: "dist/domain/inventario/contracts/index" },
  { subpath: "tesoreria", target: "dist/domain/tesoreria/index" },
  { subpath: "tesoreria/contracts", target: "dist/domain/tesoreria/contracts/index" },
  { subpath: "finanzas", target: "dist/domain/finanzas/index" },
  { subpath: "finanzas/contracts", target: "dist/domain/finanzas/contracts/index" },
  { subpath: "finanzas/entities", target: "dist/domain/finanzas/entities/index" },
  { subpath: "personas", target: "dist/domain/personas/index" },
  { subpath: "personas/contracts", target: "dist/domain/personas/contracts/index" },
  { subpath: "personas/entities", target: "dist/domain/personas/entities/index" },
  { subpath: "contabilidad", target: "dist/domain/contabilidad/index" },
  { subpath: "contabilidad/contracts", target: "dist/domain/contabilidad/contracts/index" },
  { subpath: "contabilidad/entities", target: "dist/domain/contabilidad/entities/index" },
  { subpath: "shared/base", target: "dist/domain/shared/base/index" },
  { subpath: "shared/kernel", target: "dist/domain/shared/kernel/index" },
  { subpath: "shared/utils", target: "dist/domain/shared/utils/index" },
  { subpath: "shared/value-objects", target: "dist/domain/shared/value-objects/index" },
];

const rootDirs = [
  "ventas",
  "compras",
  "inventario",
  "tesoreria",
  "finanzas",
  "personas",
  "contabilidad",
  "shared",
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanRootStubs() {
  for (const dir of rootDirs) {
    fs.rmSync(path.join(repoRoot, dir), { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
}

function toPosixRelative(fromDir, toFileWithoutExt) {
  return path.relative(fromDir, toFileWithoutExt).split(path.sep).join("/");
}

function writeStub(subpath, target) {
  const outputDir = path.join(repoRoot, subpath);
  ensureDir(outputDir);

  const relativeTarget = toPosixRelative(outputDir, path.join(repoRoot, target));
  const jsContent = `module.exports = require("${relativeTarget}");\n`;
  const dtsContent = `export * from "${relativeTarget}";\n`;

  fs.writeFileSync(path.join(outputDir, "index.js"), jsContent);
  fs.writeFileSync(path.join(outputDir, "index.d.ts"), dtsContent);
}

function main() {
  cleanRootStubs();
  for (const stub of stubs) {
    writeStub(stub.subpath, stub.target);
  }
  console.log("Subpath stubs públicos generados.");
}

main();
