import type {
  CuentaProveedor,
  ImputacionCuentaProveedor,
  MovimientoCuentaProveedor,
  ResumenCuentaProveedor,
} from "../contracts/cuenta-proveedor.contract";

const CENTIMOS_POR_UNIDAD = 100;

export const aCentimosCuentaProveedor = (monto: number): number => {
  if (!Number.isFinite(monto)) {
    throw new Error("monto_cuenta_proveedor_invalido");
  }
  return Math.round(monto * CENTIMOS_POR_UNIDAD);
};

export const deCentimosCuentaProveedor = (centimos: number): number =>
  Number((centimos / CENTIMOS_POR_UNIDAD).toFixed(2));

export const normalizarMontoCuentaProveedor = (monto: number): number => {
  const centimos = aCentimosCuentaProveedor(monto);
  if (centimos <= 0) {
    throw new Error("monto_cuenta_proveedor_debe_ser_positivo");
  }
  return deCentimosCuentaProveedor(centimos);
};

type AcumuladoImputacion = {
  porOrigen: Map<string, number>;
  porDestino: Map<string, number>;
  cantidadActiva: number;
};

const ordenarPorFechaEId = <T extends { id: string; createdAt: Date }>(
  items: readonly T[],
): T[] =>
  [...items].sort((left, right) => {
    const byDate = left.createdAt.getTime() - right.createdAt.getTime();
    return byDate !== 0 ? byDate : left.id.localeCompare(right.id);
  });

const exigirLibroCompatible = (args: {
  cuenta: CuentaProveedor;
  movimientos: readonly MovimientoCuentaProveedor[];
  imputaciones: readonly ImputacionCuentaProveedor[];
}): void => {
  for (const movimiento of args.movimientos) {
    if (
      movimiento.cuentaId !== args.cuenta.id ||
      movimiento.proveedorId !== args.cuenta.proveedorId
    ) {
      throw new Error("movimiento_cuenta_proveedor_fuera_de_cuenta");
    }
    if (movimiento.moneda !== args.cuenta.moneda) {
      throw new Error("moneda_cuenta_proveedor_incompatible");
    }
    normalizarMontoCuentaProveedor(movimiento.monto);
  }

  for (const imputacion of args.imputaciones) {
    if (
      imputacion.cuentaId !== args.cuenta.id ||
      imputacion.proveedorId !== args.cuenta.proveedorId
    ) {
      throw new Error("imputacion_cuenta_proveedor_fuera_de_cuenta");
    }
    if (imputacion.moneda !== args.cuenta.moneda) {
      throw new Error("moneda_imputacion_cuenta_proveedor_incompatible");
    }
    normalizarMontoCuentaProveedor(imputacion.monto);
  }
};

const resolverMovimientosReversados = (
  movimientos: readonly MovimientoCuentaProveedor[],
): Set<string> => {
  const porId = new Map(movimientos.map((item) => [item.id, item]));
  const reversaPorOriginal = new Map<string, string>();
  const excluidos = new Set<string>();

  for (const movimiento of movimientos) {
    const originalId = String(movimiento.reversaDeMovimientoId || "").trim();
    if (movimiento.tipo !== "REVERSA") {
      if (originalId) {
        throw new Error("movimiento_cuenta_proveedor_no_reversa_con_referencia");
      }
      continue;
    }
    if (!originalId) {
      throw new Error("reversa_movimiento_cuenta_proveedor_sin_original");
    }
    const original = porId.get(originalId);
    if (!original || original.tipo === "REVERSA") {
      throw new Error("reversa_movimiento_cuenta_proveedor_original_invalido");
    }
    if (
      movimiento.direccion === original.direccion ||
      aCentimosCuentaProveedor(movimiento.monto) !==
        aCentimosCuentaProveedor(original.monto)
    ) {
      throw new Error("reversa_movimiento_cuenta_proveedor_incompatible");
    }
    if (reversaPorOriginal.has(originalId)) {
      throw new Error("movimiento_cuenta_proveedor_ya_reversado");
    }
    reversaPorOriginal.set(originalId, movimiento.id);
    excluidos.add(originalId);
    excluidos.add(movimiento.id);
  }

  return excluidos;
};

const acumularImputaciones = (
  imputaciones: readonly ImputacionCuentaProveedor[],
  movimientosActivos?: ReadonlySet<string>,
): AcumuladoImputacion => {
  const aplicacionesPorId = new Map<string, ImputacionCuentaProveedor>();
  const reversadoPorAplicacionId = new Map<string, number>();

  for (const imputacion of ordenarPorFechaEId(imputaciones)) {
    const monto = aCentimosCuentaProveedor(imputacion.monto);
    if (imputacion.tipo === "APLICACION") {
      if (imputacion.reversaDeImputacionId) {
        throw new Error("aplicacion_cuenta_proveedor_no_puede_referenciar_reversa");
      }
      aplicacionesPorId.set(imputacion.id, imputacion);
      continue;
    }

    const originalId = String(imputacion.reversaDeImputacionId || "").trim();
    const original = aplicacionesPorId.get(originalId);
    if (!original) {
      throw new Error("reversa_imputacion_cuenta_proveedor_sin_original");
    }
    if (
      original.movimientoOrigenId !== imputacion.movimientoOrigenId ||
      original.movimientoDestinoId !== imputacion.movimientoDestinoId
    ) {
      throw new Error("reversa_imputacion_cuenta_proveedor_incompatible");
    }
    const alreadyReversed = reversadoPorAplicacionId.get(originalId) ?? 0;
    if (alreadyReversed + monto > aCentimosCuentaProveedor(original.monto)) {
      throw new Error("reversa_imputacion_cuenta_proveedor_excede_original");
    }
    reversadoPorAplicacionId.set(originalId, alreadyReversed + monto);
  }

  const porOrigen = new Map<string, number>();
  const porDestino = new Map<string, number>();
  let cantidadActiva = 0;

  for (const [id, aplicacion] of aplicacionesPorId) {
    if (
      movimientosActivos &&
      (!movimientosActivos.has(aplicacion.movimientoOrigenId) ||
        !movimientosActivos.has(aplicacion.movimientoDestinoId))
    ) {
      continue;
    }
    const neto =
      aCentimosCuentaProveedor(aplicacion.monto) -
      (reversadoPorAplicacionId.get(id) ?? 0);
    if (neto <= 0) continue;
    porOrigen.set(
      aplicacion.movimientoOrigenId,
      (porOrigen.get(aplicacion.movimientoOrigenId) ?? 0) + neto,
    );
    porDestino.set(
      aplicacion.movimientoDestinoId,
      (porDestino.get(aplicacion.movimientoDestinoId) ?? 0) + neto,
    );
    cantidadActiva += 1;
  }

  return { porOrigen, porDestino, cantidadActiva };
};

export const reconstruirResumenCuentaProveedor = (args: {
  cuenta: CuentaProveedor;
  movimientos: readonly MovimientoCuentaProveedor[];
  imputaciones: readonly ImputacionCuentaProveedor[];
  reconstruidaAt?: Date;
  version?: number;
}): ResumenCuentaProveedor => {
  exigirLibroCompatible(args);
  const movimientos = ordenarPorFechaEId(
    args.movimientos.filter((item) => item.estado === "CONTABILIZADO"),
  );
  const movimientosReversados = resolverMovimientosReversados(movimientos);
  const movimientosActivos = movimientos.filter(
    (item) => !movimientosReversados.has(item.id),
  );
  const movimientoPorId = new Map(
    movimientosActivos.map((item) => [item.id, item]),
  );
  const acumulado = acumularImputaciones(
    args.imputaciones,
    new Set(movimientoPorId.keys()),
  );

  let saldoPorPagarCentimos = 0;
  let saldoDebitoNoAplicadoCentimos = 0;

  for (const [movimientoId, aplicado] of acumulado.porOrigen) {
    const movimiento = movimientoPorId.get(movimientoId);
    if (!movimiento || movimiento.direccion !== "DEBITO") {
      throw new Error("origen_imputacion_cuenta_proveedor_no_es_debito");
    }
    if (aplicado > aCentimosCuentaProveedor(movimiento.monto)) {
      throw new Error("imputacion_cuenta_proveedor_excede_origen");
    }
  }

  for (const [movimientoId, aplicado] of acumulado.porDestino) {
    const movimiento = movimientoPorId.get(movimientoId);
    if (!movimiento || movimiento.direccion !== "CREDITO") {
      throw new Error("destino_imputacion_cuenta_proveedor_no_es_credito");
    }
    if (aplicado > aCentimosCuentaProveedor(movimiento.monto)) {
      throw new Error("imputacion_cuenta_proveedor_excede_destino");
    }
  }

  for (const movimiento of movimientosActivos) {
    const monto = aCentimosCuentaProveedor(movimiento.monto);
    if (movimiento.direccion === "CREDITO") {
      saldoPorPagarCentimos +=
        monto - (acumulado.porDestino.get(movimiento.id) ?? 0);
    } else {
      saldoDebitoNoAplicadoCentimos +=
        monto - (acumulado.porOrigen.get(movimiento.id) ?? 0);
    }
  }

  const reconstruidaAt = args.reconstruidaAt ?? new Date();
  const ultimoMovimiento = movimientos[movimientos.length - 1];
  const saldoDebitoNoAplicado = deCentimosCuentaProveedor(
    saldoDebitoNoAplicadoCentimos,
  );

  return {
    id: args.cuenta.id,
    cuentaId: args.cuenta.id,
    proveedorId: args.cuenta.proveedorId,
    saldoPorPagar: deCentimosCuentaProveedor(saldoPorPagarCentimos),
    saldoFavorNegocio: saldoDebitoNoAplicado,
    saldoDebitoNoAplicado,
    moneda: args.cuenta.moneda,
    ultimoMovimientoId: ultimoMovimiento?.id,
    ultimoMovimientoAt: ultimoMovimiento?.occurredAt,
    cantidadMovimientosFuente: movimientos.length,
    cantidadImputacionesFuente: acumulado.cantidadActiva,
    version: args.version ?? 1,
    reconstruidaAt,
    updatedAt: reconstruidaAt,
  };
};

export const planificarImputacionesCuentaProveedorFifo = (args: {
  cuenta: CuentaProveedor;
  movimientoOrigen: MovimientoCuentaProveedor;
  movimientos: readonly MovimientoCuentaProveedor[];
  imputaciones: readonly ImputacionCuentaProveedor[];
  montoMaximo?: number;
  createdAt: Date;
  idFactory: (index: number) => string;
}): ImputacionCuentaProveedor[] => {
  if (
    args.movimientoOrigen.cuentaId !== args.cuenta.id ||
    args.movimientoOrigen.direccion !== "DEBITO" ||
    args.movimientoOrigen.estado !== "CONTABILIZADO"
  ) {
    throw new Error("origen_imputacion_cuenta_proveedor_invalido");
  }

  exigirLibroCompatible({
    cuenta: args.cuenta,
    movimientos: args.movimientos,
    imputaciones: args.imputaciones,
  });
  const movimientosContabilizados = args.movimientos.filter(
    (item) => item.estado === "CONTABILIZADO",
  );
  const movimientosReversados = resolverMovimientosReversados(
    movimientosContabilizados,
  );
  if (movimientosReversados.has(args.movimientoOrigen.id)) {
    throw new Error("origen_imputacion_cuenta_proveedor_reversado");
  }
  const movimientosActivos = movimientosContabilizados.filter(
    (item) => !movimientosReversados.has(item.id),
  );
  const acumulado = acumularImputaciones(
    args.imputaciones,
    new Set(movimientosActivos.map((item) => item.id)),
  );
  const disponibleOrigen =
    aCentimosCuentaProveedor(args.movimientoOrigen.monto) -
    (acumulado.porOrigen.get(args.movimientoOrigen.id) ?? 0);
  let restante = Math.min(
    disponibleOrigen,
    args.montoMaximo === undefined
      ? disponibleOrigen
      : aCentimosCuentaProveedor(normalizarMontoCuentaProveedor(args.montoMaximo)),
  );
  if (restante <= 0) return [];

  const obligaciones = ordenarPorFechaEId(
    movimientosActivos.filter(
      (item) =>
        item.estado === "CONTABILIZADO" && item.direccion === "CREDITO",
    ),
  );
  const resultado: ImputacionCuentaProveedor[] = [];

  for (const obligacion of obligaciones) {
    if (restante <= 0) break;
    const pendiente =
      aCentimosCuentaProveedor(obligacion.monto) -
      (acumulado.porDestino.get(obligacion.id) ?? 0);
    if (pendiente <= 0) continue;
    const aplicado = Math.min(restante, pendiente);
    resultado.push({
      id: args.idFactory(resultado.length),
      cuentaId: args.cuenta.id,
      proveedorId: args.cuenta.proveedorId,
      tipo: "APLICACION",
      movimientoOrigenId: args.movimientoOrigen.id,
      movimientoDestinoId: obligacion.id,
      monto: deCentimosCuentaProveedor(aplicado),
      moneda: args.cuenta.moneda,
      estrategia: "FIFO",
      createdAt: args.createdAt,
    });
    restante -= aplicado;
  }

  return resultado;
};
