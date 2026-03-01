const fs = require("fs");
const path = require("path");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function walkFiles(dirPath) {
  const out = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function writeJsStub(stubPath, targetPath) {
  const rel = toPosix(path.relative(path.dirname(stubPath), targetPath));
  const content = `'use strict';\nmodule.exports = require('${rel}');\n`;
  fs.writeFileSync(stubPath, content);
}

function writeDtsStub(stubPath, targetPath) {
  const relNoExt = toPosix(
    path
      .relative(path.dirname(stubPath), targetPath)
      .replace(/\.d\.ts$/, "")
      .replace(/\.ts$/, "")
      .replace(/\.js$/, ""),
  );
  const content = `export * from '${relNoExt}';\n`;
  fs.writeFileSync(stubPath, content);
}

function generateDomainStubs() {
  const repoRoot = path.resolve(__dirname, "..");
  const distDomainDir = path.join(repoRoot, "dist", "domain");
  const outDomainDir = path.join(repoRoot, "domain");

  if (!fs.existsSync(distDomainDir)) {
    throw new Error(`No existe ${distDomainDir}. Ejecuta build primero.`);
  }

  fs.rmSync(outDomainDir, { recursive: true, force: true });
  ensureDir(outDomainDir);

  const files = walkFiles(distDomainDir);
  for (const filePath of files) {
    const rel = path.relative(distDomainDir, filePath);
    const outPath = path.join(outDomainDir, rel);
    ensureDir(path.dirname(outPath));

    if (filePath.endsWith(".js")) {
      writeJsStub(outPath, filePath);
    } else if (filePath.endsWith(".d.ts")) {
      writeDtsStub(outPath, filePath);
    }
  }
}

generateDomainStubs();

