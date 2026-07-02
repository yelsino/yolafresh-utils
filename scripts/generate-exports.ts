// @ts-nocheck

const fs = require("fs");
const path = require("path");

const ROOT_INDEX_CONTENT = `// Este archivo es generado automáticamente
// No modificar manualmente

// Surface raíz mínima oficial
export * from "./domain/shared/base";
export * from "./domain/shared/kernel";
export * from "./domain/shared/utils";
export * from "./domain/shared/value-objects";
export {
  CarritoVenta,
  ProcedenciaVenta,
  Venta,
  VENTA_SNAPSHOT_TYPE,
  VentaSnapshot,
} from "./domain/ventas/entities";
export { RecurrenciaEntity } from "./domain/finanzas/entities";
`;

function generateMainIndex() {
  const outputPath = path.resolve(__dirname, "../src/index.ts");
  fs.writeFileSync(outputPath, ROOT_INDEX_CONTENT);
  console.log(`Exportaciones generadas en ${outputPath}`);
}

generateMainIndex();
