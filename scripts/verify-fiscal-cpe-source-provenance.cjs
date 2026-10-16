const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const repositoryRoot = resolve(__dirname, "..");
const manifestPath = resolve(__dirname, "fiscal-cpe-source-provenance.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const packageMetadata = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8"));
const mismatches = [];

if (packageMetadata.version !== manifest.artifactVersion) {
  mismatches.push(`package.json: expected version ${manifest.artifactVersion}, received ${packageMetadata.version}`);
}

const trackedFiles = [...manifest.files, ...manifest.localFiscalFiles];
for (const entry of trackedFiles) {
  const filePath = resolve(repositoryRoot, entry.path);
  let actual;
  try {
    actual = createHash("sha256").update(readFileSync(filePath)).digest("hex");
  } catch (error) {
    mismatches.push(`${entry.path}: ${error.code ?? error.message}`);
    continue;
  }
  if (actual !== entry.sha256) {
    mismatches.push(`${entry.path}: expected ${entry.sha256}, received ${actual}`);
  }
}

if (mismatches.length > 0) {
  console.error(`Fiscal CPE source provenance failed:\n${mismatches.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Fiscal CPE source provenance verified (${manifest.files.length} imported + ` +
    `${manifest.localFiscalFiles.length} fiscal files).`);
}
