/** Compatibilidad de nombres TypeScript; la lógica reside en un solo módulo. */
export {
  validarMovimientoInventario as validarMovimientoInventarioV2,
  construirIdMovimientoMermaInventario as construirIdMovimientoMermaInventarioV2,
  construirMovimientoAplicacionMermaInventario as construirMovimientoAplicacionMermaInventarioV2,
} from "./inventory.helpers";
export {
  puedeTransicionarTransferenciaInventario as puedeTransicionarTransferenciaInventarioV2,
  puedeAgregarRecepcionTransferenciaInventario as puedeAgregarRecepcionTransferenciaInventarioV2,
  assertTransicionTransferenciaInventario as assertTransicionTransferenciaInventarioV2,
  resumirTransferenciaInventario as resumirTransferenciaInventarioV2,
  construirIdMovimientoTransferenciaInventario as construirIdMovimientoTransferenciaInventarioV2,
  validarTransferenciaInventario as validarTransferenciaInventarioV2,
  assertTransferenciaInventario as assertTransferenciaInventarioV2,
  validarEvolucionTransferenciaInventario as validarEvolucionTransferenciaInventarioV2,
  assertEvolucionTransferenciaInventario as assertEvolucionTransferenciaInventarioV2,
  construirMovimientosTransferenciaInventario as construirMovimientosTransferenciaInventarioV2,
} from "./inventory-transfer.helpers";
export type {
  ResumenTransferenciaInventarioLinea as ResumenTransferenciaInventarioV2Linea,
  ResumenTransferenciaInventarioPorUnidadBase as ResumenTransferenciaInventarioV2PorUnidadBase,
  ResumenTransferenciaInventario as ResumenTransferenciaInventarioV2,
} from "./inventory-transfer.helpers";
