import { isFiscalCompanyEnabled } from "./empresa.contract";

/** Preferencia comercial; nunca sustituye la habilitación ni la autorización fiscal. */
export type PoliticaEmisionEmpresa =
  | Readonly<{ modo: "MANUAL" }>
  | Readonly<{ modo: "AUTOMATICA"; comprobantePredeterminado: "BOLETA" | "FACTURA" }>;

/** NINGUNO no es un tipo de comprobante ni genera una intención fiscal. */
export type SeleccionComprobanteVenta = "NINGUNO" | "BOLETA" | "FACTURA";

/** Hecho comercial congelado al confirmar: no se recalcula con la configuración futura. */
export interface FiscalSaleDocumentSelection {
  readonly seleccion: SeleccionComprobanteVenta;
  readonly origen: "EMPRESA" | "OPERADOR";
  readonly politicaAplicada: PoliticaEmisionEmpresa;
}

const manual: PoliticaEmisionEmpresa = Object.freeze({ modo: "MANUAL" });
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function assertFiscalEmissionPolicy(value: unknown): asserts value is PoliticaEmisionEmpresa {
  if (!record(value) || (value.modo !== "MANUAL" && value.modo !== "AUTOMATICA") ||
    Object.keys(value).length !== (value.modo === "AUTOMATICA" ? 2 : 1) ||
    Object.keys(value).some(key => !["modo", ...(value.modo === "AUTOMATICA" ? ["comprobantePredeterminado"] : [])].includes(key)) ||
    value.modo === "AUTOMATICA" && value.comprobantePredeterminado !== "BOLETA" && value.comprobantePredeterminado !== "FACTURA") {
    throw new Error("FISCAL_EMISSION_POLICY_INVALID");
  }
}

/** Ausencia conserva el comportamiento histórico manual; una política corrupta no se interpreta. */
export function readFiscalEmissionPolicy(config: unknown): PoliticaEmisionEmpresa {
  const fiscal = record(config) && record(config.fiscal) ? config.fiscal : undefined;
  if (!fiscal || fiscal.politicaEmision === undefined) return manual;
  assertFiscalEmissionPolicy(fiscal.politicaEmision);
  return Object.freeze({ ...fiscal.politicaEmision });
}

export function assertFiscalSaleDocumentSelection(value: unknown): asserts value is FiscalSaleDocumentSelection {
  if (!record(value) || Object.keys(value).length !== 3 ||
    Object.keys(value).some(key => !["seleccion", "origen", "politicaAplicada"].includes(key)) ||
    typeof value.seleccion !== "string" || !["NINGUNO", "BOLETA", "FACTURA"].includes(value.seleccion) ||
    value.origen !== "EMPRESA" && value.origen !== "OPERADOR") {
    throw new Error("FISCAL_SALE_DOCUMENT_SELECTION_INVALID");
  }
  assertFiscalEmissionPolicy(value.politicaAplicada);
  if (value.origen === "EMPRESA" && value.seleccion !== "NINGUNO" &&
    (value.politicaAplicada.modo !== "AUTOMATICA" || value.seleccion !== value.politicaAplicada.comprobantePredeterminado)) {
    throw new Error("FISCAL_SALE_DOCUMENT_SELECTION_INVALID");
  }
}

/** Copia defensiva para restaurar venta/cola sin volver a aplicar la política actual. */
export function copyFiscalSaleDocumentSelection(value: FiscalSaleDocumentSelection): FiscalSaleDocumentSelection {
  assertFiscalSaleDocumentSelection(value);
  return Object.freeze({ ...value, politicaAplicada: Object.freeze({ ...value.politicaAplicada }) });
}

/** Una selección explícita del operador prevalece incluso cuando es NINGUNO. */
export function createFiscalSaleDocumentSelection(input: {
  readonly config: unknown;
  readonly seleccion?: SeleccionComprobanteVenta;
}): FiscalSaleDocumentSelection {
  const politicaAplicada = readFiscalEmissionPolicy(input.config);
  const seleccion = input.seleccion ?? (isFiscalCompanyEnabled(input.config) && politicaAplicada.modo === "AUTOMATICA"
    ? politicaAplicada.comprobantePredeterminado : "NINGUNO");
  return copyFiscalSaleDocumentSelection({ seleccion, origen: input.seleccion === undefined ? "EMPRESA" : "OPERADOR", politicaAplicada });
}
