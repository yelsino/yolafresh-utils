import type {
  CabeceraEjecucionCobroCliente, CuentaCliente, ImputacionCuentaCliente,
  MonedaCuentaCliente, MovimientoCuentaCliente, RecepcionCobroCliente,
} from "./cuenta-cliente.contract";
import { coincidenCreditosPlanConEvidenciaEjecucionCobroCliente,
  esImputacionCuentaClienteManifestV1 } from "./cuenta-cliente.contract";
const aCentimos = (monto: number): number => {
  if (typeof monto !== "number" || !Number.isFinite(monto)) throw new Error("monto_invalido");
  const result = Math.round(monto * 100);
  if (!Number.isSafeInteger(result) || Math.abs(monto - result / 100) > 1e-8) throw new Error("monto_invalido");
  return result;
};

export type RelacionDevolucionNotaCredito = {
  operationId: string;
  notaCreditoId: string;
  ventaId: string;
  movimientoObjetivoId: string;
  montoImputadoCents: number;
};
export type MovimientoConDevolucionNotaCredito = MovimientoCuentaCliente & {
  devolucionNotaCredito?: RelacionDevolucionNotaCredito;
};
export type HechosFinancierosVenta = {
  cuentaId: string;
  clienteId: string;
  ventaId: string;
  movimientoVentaId: string;
  moneda: MonedaCuentaCliente;
  ventaCents: number;
  deudaPendienteCents: number;
  dineroCobradoVerificadoCents: number;
  saldoFavorAplicadoCents: number;
  otrosAjustesAplicadosCents: number;
  imputadoNoVerificadoCents: number;
};

/** Una marca CONFIRMADA no sustituye el cotejo del componente y sus destinos. */
function coincideDineroNuevoConManifest(input: {
  source: MovimientoCuentaCliente;
  receipt: RecepcionCobroCliente;
  header: CabeceraEjecucionCobroCliente;
  movimientos: readonly MovimientoCuentaCliente[];
  imputaciones: readonly ImputacionCuentaCliente[];
}): boolean {
  try {
    const { source, receipt, header } = input;
    const matches = header.plan?.componentes?.filter(component => component.claveIdempotencia === receipt.idempotencyKey);
    if (!matches || matches.length !== 1) return false;
    const component = matches[0];
    const allocations = input.imputaciones.filter(item => item.estado === "APLICADA" && item.movimientoOrigenId === source.id);
    if (component.tipo !== "DINERO_NUEVO" || component.metodoPago !== receipt.metodoPago ||
        aCentimos(component.montoRecibidoEsperado) !== aCentimos(receipt.monto) ||
        aCentimos(source.monto) !== aCentimos(receipt.monto) ||
        new Set(allocations.map(item => item.id)).size !== allocations.length ||
        allocations.some(item => !esImputacionCuentaClienteManifestV1(item) ||
          item.tipoComponenteEjecucionCobro !== "DINERO_NUEVO" || item.ejecucionCobroId !== source.ejecucionCobroId ||
          item.cobroId !== receipt.id || item.cuentaId !== source.cuentaId || item.clienteId !== source.clienteId ||
          item.moneda !== source.moneda || aCentimos(item.monto) <= 0) ||
        input.movimientos.filter(item => item.tipo === "COBRO" && item.estado === "CONTABILIZADO" &&
          item.recepcionCobroId === receipt.id).length !== 1) return false;
    const applied = allocations.reduce((sum, item) => sum + aCentimos(item.monto), 0);
    return Number.isSafeInteger(applied) && applied === aCentimos(component.montoAplicadoEsperado) &&
      coincidenCreditosPlanConEvidenciaEjecucionCobroCliente(component.creditos,
        allocations.map(item => ({ movimientoDestinoId: item.movimientoDestinoId, montoAplicadoEsperado: item.monto })));
  } catch {
    return false;
  }
}

export function debitoDeVentaExacto(cuenta: CuentaCliente, movimientos: readonly MovimientoCuentaCliente[], ventaId: string): MovimientoCuentaCliente | null {
  const candidatos = movimientos.filter(item => item.tipoOrigen === "VENTA" && item.origenId === ventaId &&
    item.tipo === "VENTA" && item.direccion === "DEBITO" && !item.reversaDeMovimientoId);
  if (candidatos.length > 1) throw new Error("nota_credito_debito_venta_ambiguo");
  const original = candidatos[0];
  if (!original) return null;
  if (original.cuentaId !== cuenta.id || original.clienteId !== cuenta.clienteId || original.estado !== "CONTABILIZADO" ||
      original.moneda !== (cuenta.moneda ?? "PEN") || aCentimos(original.monto) <= 0 ||
      movimientos.some(item => item.estado === "CONTABILIZADO" && item.tipo === "REVERSA" && item.reversaDeMovimientoId === original.id))
    throw new Error("nota_credito_debito_venta_invalido");
  return original;
}

/** Official allocations are not synonymous with money received: balance and returns remain separate. */
export function construirHechosFinancierosVenta(input: {
  cuenta: CuentaCliente;
  ventaId: string;
  movimientos: readonly MovimientoCuentaCliente[];
  imputaciones: readonly ImputacionCuentaCliente[];
  recepcionesPorId: ReadonlyMap<string, RecepcionCobroCliente>;
  cabecerasPorEjecucionId: ReadonlyMap<string, CabeceraEjecucionCobroCliente>;
}): HechosFinancierosVenta | null {
  const { cuenta, movimientos, imputaciones } = input;
  const original = debitoDeVentaExacto(cuenta, movimientos, input.ventaId);
  if (!original) return null;
  const sources = new Map(movimientos.map(item => [item.id, item]));
  if (sources.size !== movimientos.length) throw new Error("nota_credito_movimiento_duplicado");
  const allocations = imputaciones.filter(item => item.estado === "APLICADA" && item.movimientoDestinoId === original.id);
  const seen = new Set<string>();
  const result: HechosFinancierosVenta = {
    cuentaId: cuenta.id, clienteId: cuenta.clienteId, ventaId: input.ventaId, movimientoVentaId: original.id,
    moneda: original.moneda, ventaCents: aCentimos(original.monto), deudaPendienteCents: aCentimos(original.monto),
    dineroCobradoVerificadoCents: 0, saldoFavorAplicadoCents: 0, otrosAjustesAplicadosCents: 0, imputadoNoVerificadoCents: 0,
  };
  for (const allocation of allocations) {
    const amount = aCentimos(allocation.monto);
    const source = sources.get(allocation.movimientoOrigenId);
    if (seen.has(allocation.id) || amount <= 0 || allocation.cuentaId !== cuenta.id || allocation.clienteId !== cuenta.clienteId ||
        allocation.moneda !== original.moneda || !source || source.cuentaId !== cuenta.id || source.clienteId !== cuenta.clienteId ||
        source.estado !== "CONTABILIZADO" || source.direccion !== "CREDITO" || source.moneda !== original.moneda ||
        movimientos.some(item => item.estado === "CONTABILIZADO" && item.tipo === "REVERSA" && item.reversaDeMovimientoId === source.id))
      throw new Error("nota_credito_imputacion_venta_invalida");
    seen.add(allocation.id);
    const sourceApplied = imputaciones.filter(item => item.estado === "APLICADA" && item.movimientoOrigenId === source.id)
      .reduce((sum, item) => sum + aCentimos(item.monto), 0);
    if (!Number.isSafeInteger(sourceApplied) || sourceApplied > aCentimos(source.monto)) throw new Error("nota_credito_fuente_sobreimputada");
    result.deudaPendienteCents -= amount;
    if (result.deudaPendienteCents < 0) throw new Error("nota_credito_venta_sobreimputada");
    if (source.tipo === "DEVOLUCION" || source.tipo === "AJUSTE") {
      result.otrosAjustesAplicadosCents += amount;
      continue;
    }
    if (allocation.tipoComponenteEjecucionCobro === "SALDO_FAVOR" || source.tipo === "DEPOSITO") {
      result.saldoFavorAplicadoCents += amount;
      continue;
    }
    const receipt = source.recepcionCobroId ? input.recepcionesPorId.get(source.recepcionCobroId) : undefined;
    const header = source.ejecucionCobroId ? input.cabecerasPorEjecucionId.get(source.ejecucionCobroId) : undefined;
    const verified = receipt !== undefined && header !== undefined && source.tipo === "COBRO" && source.ejecucionCobroManifestVersion === 1 &&
      allocation.ejecucionCobroManifestVersion === 1 && allocation.tipoComponenteEjecucionCobro === "DINERO_NUEVO" &&
      allocation.ejecucionCobroId === source.ejecucionCobroId && receipt?.id === source.recepcionCobroId &&
      receipt.estado === "LIQUIDADO" && receipt.cuentaId === cuenta.id && receipt.clienteId === cuenta.clienteId &&
      receipt.moneda === original.moneda && receipt.ejecucionCobroManifestVersion === 1 && receipt.ejecucionCobroId === source.ejecucionCobroId &&
      (allocation.cobroId === undefined || allocation.cobroId === receipt.id) && aCentimos(receipt.monto) >= sourceApplied &&
      header?.type === "ejecucion_cobro_cliente" && header.contractVersion === 1 && header.estado === "CONFIRMADA" &&
      header.ejecucionCobroId === source.ejecucionCobroId && header.cuentaId === cuenta.id && header.clienteId === cuenta.clienteId && header.moneda === original.moneda &&
      typeof receipt.idempotencyKey === "string" && header.componentesConfirmados.includes(receipt.idempotencyKey) &&
      coincideDineroNuevoConManifest({ source, receipt, header, movimientos, imputaciones });
    if (verified) result.dineroCobradoVerificadoCents += amount;
    else result.imputadoNoVerificadoCents += amount;
  }
  return result;
}
