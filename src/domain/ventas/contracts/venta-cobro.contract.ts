/** El efectivo es un importe del cobro, nunca un documento Pago. */
export type VentaCobroMedioDigital = "DIGITAL" | "TARJETA";
export type VentaCobroMedio = "EFECTIVO" | VentaCobroMedioDigital;
export type VentaCobroOrigenDigital =
  | "CAPTURADO"
  | "MANUAL"
  | "CONFIANZA"
  | "EVIDENCIA";

export interface VentaCobroDigitalInput {
  /** Identidad opaca estable de este componente dentro del cobro. */
  readonly key: string;
  readonly pagoId?: string;
  readonly origen: VentaCobroOrigenDigital;
  readonly metodoPago: VentaCobroMedioDigital;
  /** Importe recibido completo; no se sustituye por lo aplicado a la venta. */
  readonly montoRecibido: number;
}

export interface VentaCobroDigital extends VentaCobroDigitalInput {
  readonly montoAplicado: number;
}

/** Hecho confirmado por el operador; calcular un vuelto no crea este hecho. */
export interface VentaCobroDevolucion {
  readonly id: string;
  readonly metodoPago: VentaCobroMedio;
  readonly monto: number;
  readonly confirmadoAt: number;
  readonly operadorId: string;
  readonly cajaId?: string;
  readonly turnoCajaId?: string;
}

/** Hechos del cobro congelados al confirmar la venta, sin cambiar su precio. */
export interface VentaCobroSnapshot {
  readonly schemaVersion: 1;
  readonly totalVenta: number;
  readonly efectivoRecibido: number;
  readonly efectivoAplicado: number;
  readonly pagosDigitales: readonly VentaCobroDigital[];
  readonly devoluciones: readonly VentaCobroDevolucion[];
  readonly montoRecibido: number;
  readonly montoAplicado: number;
  readonly vueltoRequerido: number;
  readonly vueltoDevuelto: number;
  readonly vueltoPendiente: number;
}

export interface ResolveVentaCobroInput {
  readonly totalVenta: number;
  readonly pagosDigitales?: readonly VentaCobroDigitalInput[];
  /** Si falta, el operador confirma el saldo exacto restante en efectivo. */
  readonly efectivoRecibido?: number;
  readonly devoluciones?: readonly VentaCobroDevolucion[];
}

export interface VentaCobroMovimiento {
  /** Clave estable para que el consumidor genere un efecto idempotente. */
  readonly key: string;
  readonly tipo: "INGRESO" | "EGRESO";
  readonly monto: number;
  readonly metodoPago: VentaCobroMedio;
}

function minorUnits(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} debe ser un importe finito no negativo`);
  }
  const scaled = value * 100;
  const minor = Math.round(scaled);
  if (!Number.isSafeInteger(minor) || Math.abs(scaled - minor) > 0.000001) {
    throw new Error(`${field} debe tener como máximo dos decimales seguros`);
  }
  return minor;
}

function addMinor(left: number, right: number): number {
  const result = left + right;
  if (!Number.isSafeInteger(result)) {
    throw new Error("El cobro excede el límite monetario seguro");
  }
  return result;
}

function opaqueId(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${field} es requerido`);
  }
  return value;
}

function optionalOpaqueId(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : opaqueId(value, field);
}

function isDigitalMedium(value: unknown): value is VentaCobroMedioDigital {
  return value === "DIGITAL" || value === "TARJETA";
}

/**
 * Aplica primero los componentes digitales en el orden confirmado. El exceso
 * conserva su origen y queda pendiente hasta recibir devoluciones explícitas.
 */
export function resolveVentaCobro(input: ResolveVentaCobroInput): VentaCobroSnapshot {
  const total = minorUnits(input.totalVenta, "totalVenta");
  if (input.pagosDigitales !== undefined && !Array.isArray(input.pagosDigitales)) {
    throw new Error("pagosDigitales debe ser un arreglo");
  }
  if (input.devoluciones !== undefined && !Array.isArray(input.devoluciones)) {
    throw new Error("devoluciones debe ser un arreglo");
  }
  const keys = new Set<string>();
  const paymentIds = new Set<string>();
  let digitalReceived = 0;
  let pendingSale = total;
  const pagosDigitales = (input.pagosDigitales ?? []).map((raw, index) => {
    if (!raw || typeof raw !== "object") {
      throw new Error(`pagosDigitales[${index}] es inválido`);
    }
    const key = opaqueId(raw.key, `pagosDigitales[${index}].key`);
    if (keys.has(key)) throw new Error("pagosDigitales contiene una key duplicada");
    keys.add(key);
    const pagoId = optionalOpaqueId(raw.pagoId, `pagosDigitales[${index}].pagoId`);
    if (pagoId !== undefined) {
      if (paymentIds.has(pagoId)) throw new Error("El mismo pago no puede recibirse dos veces");
      paymentIds.add(pagoId);
    }
    if (!isDigitalMedium(raw.metodoPago)) {
      throw new Error(`pagosDigitales[${index}].metodoPago debe ser digital`);
    }
    if (!["CAPTURADO", "MANUAL", "CONFIANZA", "EVIDENCIA"].includes(raw.origen)) {
      throw new Error(`pagosDigitales[${index}].origen es inválido`);
    }
    const received = minorUnits(raw.montoRecibido, `pagosDigitales[${index}].montoRecibido`);
    if (received === 0) throw new Error("Los componentes digitales deben ser positivos");
    const applied = Math.min(received, pendingSale);
    pendingSale -= applied;
    digitalReceived = addMinor(digitalReceived, received);
    return {
      key,
      ...(pagoId !== undefined ? { pagoId } : {}),
      origen: raw.origen,
      metodoPago: raw.metodoPago,
      montoRecibido: received / 100,
      montoAplicado: applied / 100,
    };
  });

  const cashReceived = input.efectivoRecibido === undefined
    ? pendingSale
    : minorUnits(input.efectivoRecibido, "efectivoRecibido");
  if (cashReceived < pendingSale) {
    throw new Error("El importe recibido no cubre el total de la venta");
  }
  const cashApplied = pendingSale;
  const received = addMinor(digitalReceived, cashReceived);
  const requiredChange = received - total;
  const refundIds = new Set<string>();
  let refunded = 0;
  const devoluciones = (input.devoluciones ?? []).map((raw, index) => {
    if (!raw || typeof raw !== "object") {
      throw new Error(`devoluciones[${index}] es inválida`);
    }
    const id = opaqueId(raw.id, `devoluciones[${index}].id`);
    if (refundIds.has(id)) throw new Error("devoluciones contiene un id duplicado");
    refundIds.add(id);
    if (raw.metodoPago !== "EFECTIVO" && !isDigitalMedium(raw.metodoPago)) {
      throw new Error(`devoluciones[${index}].metodoPago es inválido`);
    }
    const amount = minorUnits(raw.monto, `devoluciones[${index}].monto`);
    if (amount === 0) throw new Error("Las devoluciones deben ser positivas");
    if (!Number.isSafeInteger(raw.confirmadoAt) || raw.confirmadoAt <= 0) {
      throw new Error(`devoluciones[${index}].confirmadoAt debe ser un timestamp positivo`);
    }
    const operadorId = opaqueId(raw.operadorId, `devoluciones[${index}].operadorId`);
    const cajaId = optionalOpaqueId(raw.cajaId, `devoluciones[${index}].cajaId`);
    const turnoCajaId = optionalOpaqueId(raw.turnoCajaId, `devoluciones[${index}].turnoCajaId`);
    refunded = addMinor(refunded, amount);
    return {
      id,
      metodoPago: raw.metodoPago,
      monto: amount / 100,
      confirmadoAt: raw.confirmadoAt,
      operadorId,
      ...(cajaId !== undefined ? { cajaId } : {}),
      ...(turnoCajaId !== undefined ? { turnoCajaId } : {}),
    };
  });
  if (refunded > requiredChange) {
    throw new Error("Lo devuelto no puede exceder el vuelto requerido");
  }
  return {
    schemaVersion: 1,
    totalVenta: total / 100,
    efectivoRecibido: cashReceived / 100,
    efectivoAplicado: cashApplied / 100,
    pagosDigitales,
    devoluciones,
    montoRecibido: received / 100,
    montoAplicado: total / 100,
    vueltoRequerido: requiredChange / 100,
    vueltoDevuelto: refunded / 100,
    vueltoPendiente: (requiredChange - refunded) / 100,
  };
}

export function validarVentaCobro(
  data: unknown,
  totalVenta?: number,
): { valida: boolean; errores: string[] } {
  try {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("VentaCobroSnapshot es inválido");
    }
    const snapshot = data as VentaCobroSnapshot;
    if (snapshot.schemaVersion !== 1) throw new Error("VentaCobroSnapshot.schemaVersion debe ser 1");
    if (!Array.isArray(snapshot.pagosDigitales) || !Array.isArray(snapshot.devoluciones)) {
      throw new Error("VentaCobroSnapshot requiere pagosDigitales y devoluciones");
    }
    const expected = resolveVentaCobro(snapshot);
    const fields = [
      "totalVenta", "efectivoRecibido", "efectivoAplicado", "montoRecibido",
      "montoAplicado", "vueltoRequerido", "vueltoDevuelto", "vueltoPendiente",
    ] as const;
    for (const field of fields) {
      if (minorUnits(snapshot[field], `VentaCobroSnapshot.${field}`) !== minorUnits(expected[field], field)) {
        throw new Error(`VentaCobroSnapshot.${field} es inconsistente`);
      }
    }
    snapshot.pagosDigitales.forEach((digital, index) => {
      if (minorUnits(digital.montoAplicado, "montoAplicado") !== minorUnits(expected.pagosDigitales[index].montoAplicado, "montoAplicado")) {
        throw new Error(`VentaCobroSnapshot.pagosDigitales[${index}].montoAplicado es inconsistente`);
      }
    });
    if (totalVenta !== undefined && minorUnits(totalVenta, "totalVenta") !== minorUnits(expected.totalVenta, "totalVenta")) {
      throw new Error("VentaCobroSnapshot.totalVenta debe coincidir con el total comercial");
    }
    return { valida: true, errores: [] };
  } catch (error) {
    return { valida: false, errores: [error instanceof Error ? error.message : String(error)] };
  }
}

/** Copia validada para congelar/serializar el hecho sin compartir objetos mutables. */
export function copiarVentaCobro(data: VentaCobroSnapshot): VentaCobroSnapshot {
  const validation = validarVentaCobro(data);
  if (!validation.valida) throw new Error(validation.errores.join("; "));
  return resolveVentaCobro(data);
}

/** Lectura de transporte: inválido produce null, nunca un cobro inventado. */
export function parseVentaCobroSnapshot(data: unknown): VentaCobroSnapshot | null {
  if (!validarVentaCobro(data).valida) return null;
  return copiarVentaCobro(data as VentaCobroSnapshot);
}

/**
 * Registra bruto recibido y egresos efectivamente entregados. Su neto equivale
 * a totalVenta + vueltoPendiente; no se suma además otro ingreso por la venta.
 */
export function buildVentaCobroMovimientos(data: VentaCobroSnapshot): VentaCobroMovimiento[] {
  const cobro = copiarVentaCobro(data);
  const movements: VentaCobroMovimiento[] = cobro.pagosDigitales.map((digital) => ({
    key: `cobro:digital:${digital.key}`,
    tipo: "INGRESO",
    monto: digital.montoRecibido,
    metodoPago: digital.metodoPago,
  }));
  if (cobro.efectivoRecibido > 0) {
    movements.push({ key: "cobro:efectivo", tipo: "INGRESO", monto: cobro.efectivoRecibido, metodoPago: "EFECTIVO" });
  }
  movements.push(...cobro.devoluciones.map((refund): VentaCobroMovimiento => ({
    key: `cobro:devolucion:${refund.id}`,
    tipo: "EGRESO",
    monto: refund.monto,
    metodoPago: refund.metodoPago,
  })));
  return movements;
}
