import { MetodoPago } from "./finanzas.contract";

export const EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION = 1 as const;

/** Version del algoritmo canonico usado antes de calcular `planHash`. */
export const EJECUCION_COBRO_CLIENTE_PLAN_CANONICALIZATION_VERSION = 1 as const;

export type EjecucionCobroClienteContractVersion =
  typeof EJECUCION_COBRO_CLIENTE_CONTRACT_VERSION;

/**
 * Identificador tecnico opaco que agrupa todos los componentes originados por
 * una misma accion de cobro. Su formato no contiene semantica de negocio.
 */
export type EjecucionCobroClienteId = string;

export type MonedaCuentaCliente = "PEN" | "USD";

export type EstadoCuentaCliente = "ACTIVA" | "SUSPENDIDA" | "CERRADA";

export type EstadoMovimientoCuentaCliente =
  "CONFIRMADO" | "ANULADO" | "RECHAZADO" | "CONTABILIZADO" | "REVERTIDO";

export type EstadoImputacionCuentaCliente = "APLICADA" | "REVERTIDA";

export type RolRecepcionCobroCliente = "CAJERO" | "VENDEDOR" | "SISTEMA";

export interface CuentaCliente {
  id: string;
  clienteId: string;
  estado: EstadoCuentaCliente;
  moneda?: MonedaCuentaCliente;
  aperturaAt?: Date;
  cierreAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type TipoMovimientoCuentaCliente =
  "DEPOSITO" | "COBRO" | "VENTA" | "DEVOLUCION" | "REVERSA" | "AJUSTE";

export type DireccionMovimientoCuentaCliente = "CREDITO" | "DEBITO";

export type OrigenMovimientoCuentaCliente =
  | "RECIBO_COBRO"
  | "COBRO"
  | "DEPOSITO"
  | "VENTA"
  | "PEDIDO"
  | "DEVOLUCION"
  | "REVERSA"
  | "RECURRENCIA"
  | "TRANSFERENCIA_CUSTODIA"
  | "MIGRACION"
  | "MANUAL"
  | "AJUSTE_MANUAL"
  | "EXTERNO";

export interface MovimientoCuentaCliente {
  id: string;
  /** Opcional unicamente para leer movimientos historicos. */
  ejecucionCobroId?: EjecucionCobroClienteId;
  /** Valor 1 exige una cabecera durable de la misma ejecucion. */
  ejecucionCobroManifestVersion?: EjecucionCobroClienteContractVersion;
  cuentaId: string;
  clienteId?: string;
  tipo: TipoMovimientoCuentaCliente;
  direccion: DireccionMovimientoCuentaCliente;
  monto: number;
  moneda: MonedaCuentaCliente;
  tipoOrigen: OrigenMovimientoCuentaCliente;
  origenId: string;
  estado?: EstadoMovimientoCuentaCliente;
  descripcion?: string;
  recepcionCobroId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  custodioId?: string;
  idempotencyKey?: string;
  creadoPorId?: string;
  reversaDeMovimientoId?: string;
  occurredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ImputacionCuentaCliente {
  id: string;
  /** Opcional unicamente para leer imputaciones historicas. */
  ejecucionCobroId?: EjecucionCobroClienteId;
  /** Valor 1 exige una cabecera durable de la misma ejecucion. */
  ejecucionCobroManifestVersion?: EjecucionCobroClienteContractVersion;
  /** Componente de la ejecucion que origino esta imputacion. */
  tipoComponenteEjecucionCobro?: TipoComponenteEjecucionCobroCliente;
  /** Actor que confirmo el componente; puede faltar en datos historicos. */
  creadoPorId?: string;
  /**
   * Identificador tecnico opaco de la `RecepcionCobroCliente` que aporto el
   * dinero nuevo. Es opcional al leer historia previa al manifest; para una
   * evidencia `DINERO_NUEVO` version 1 es obligatorio mediante
   * `ImputacionCuentaClienteManifestV1`.
   *
   * Nunca se deriva de `id`, `movimientoOrigenId` ni de su formato.
   */
  cobroId?: string;
  cuentaId?: string;
  clienteId?: string;
  movimientoOrigenId: string;
  movimientoDestinoId: string;
  monto: number;
  moneda: MonedaCuentaCliente;
  estado?: EstadoImputacionCuentaCliente;
  estrategia?: "FIFO";
  createdAt: Date;
}

export type EstadoRecepcionCobroCliente =
  | "CREADO"
  | "RECIBIDO"
  | "EN_TRANSFERENCIA_CUSTODIA"
  | "LIQUIDADO"
  | "RECHAZADO"
  | "ANULADO";

export interface RecepcionCobroCliente {
  id: string;
  /** Opcional unicamente para leer recepciones historicas. */
  ejecucionCobroId?: EjecucionCobroClienteId;
  /** Valor 1 exige una cabecera durable de la misma ejecucion. */
  ejecucionCobroManifestVersion?: EjecucionCobroClienteContractVersion;
  codigoConstancia?: string;
  clienteId: string;
  cuentaId?: string;
  monto: number;
  moneda: MonedaCuentaCliente;
  metodoPago: MetodoPago;
  creadoPorId: string;
  recibidoPorUsuarioId?: string;
  recibidoPorRol?: RolRecepcionCobroCliente;
  custodioId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  tipoOrigen?: OrigenMovimientoCuentaCliente;
  origenId?: string;
  estado: EstadoRecepcionCobroCliente;
  idempotencyKey: string;
  occurredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type EstadoEjecucionCobroCliente =
  | "EN_PROGRESO"
  | "CONFIRMADA"
  | "PARCIALMENTE_CONFIRMADA"
  | "RECHAZADA"
  | "ANULADA"
  | "REVERTIDA"
  | "RECUPERACION_REQUERIDA";

export type EstadoComponenteEjecucionCobroCliente =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "PARCIALMENTE_REVERTIDO"
  | "RECHAZADO"
  | "ANULADO"
  | "REVERTIDO"
  | "RECUPERACION_REQUERIDA";

export type TipoComponenteEjecucionCobroCliente =
  "DINERO_NUEVO" | "SALDO_FAVOR";

/**
 * Evidencia de imputacion producida por un componente de dinero nuevo bajo el
 * manifest version 1. La recepcion fuente queda enlazada de forma explicita;
 * su identidad es opaca y no se reconstruye desde otros identificadores.
 */
export interface ImputacionCuentaClienteDineroNuevoManifestV1 extends ImputacionCuentaCliente {
  ejecucionCobroId: EjecucionCobroClienteId;
  ejecucionCobroManifestVersion: 1;
  tipoComponenteEjecucionCobro: "DINERO_NUEVO";
  cobroId: string;
}

/**
 * Evidencia de imputacion que consume credito previo bajo el manifest version
 * 1. No exige una nueva recepcion porque `movimientoOrigenId` identifica el
 * credito aplicado.
 */
export interface ImputacionCuentaClienteSaldoFavorManifestV1 extends ImputacionCuentaCliente {
  ejecucionCobroId: EjecucionCobroClienteId;
  ejecucionCobroManifestVersion: 1;
  tipoComponenteEjecucionCobro: "SALDO_FAVOR";
}

/**
 * Union discriminada que deben usar los productores de evidencia MANIFEST_V1.
 * El contrato base permanece tolerante para poder leer documentos historicos.
 */
export type ImputacionCuentaClienteManifestV1 =
  | ImputacionCuentaClienteDineroNuevoManifestV1
  | ImputacionCuentaClienteSaldoFavorManifestV1;

const esIdentificadorOpacoNoVacio = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/**
 * Verifica unicamente los discriminantes y relaciones adicionales del
 * manifest version 1 sobre una imputacion base ya parseada. No recorta ni
 * interpreta identificadores opacos.
 */
export function esImputacionCuentaClienteManifestV1(
  imputacion: ImputacionCuentaCliente,
): imputacion is ImputacionCuentaClienteManifestV1 {
  if (
    imputacion.ejecucionCobroManifestVersion !== 1 ||
    !esIdentificadorOpacoNoVacio(imputacion.ejecucionCobroId)
  ) {
    return false;
  }
  if (imputacion.tipoComponenteEjecucionCobro === "SALDO_FAVOR") {
    return true;
  }
  return (
    imputacion.tipoComponenteEjecucionCobro === "DINERO_NUEVO" &&
    esIdentificadorOpacoNoVacio(imputacion.cobroId)
  );
}

export const TIPO_DOCUMENTO_EJECUCION_COBRO_CLIENTE =
  "ejecucion_cobro_cliente" as const;

export type EstadoCabeceraEjecucionCobroCliente =
  "EN_PROGRESO" | "CONFIRMADA" | "RECUPERACION_REQUERIDA";

export interface CreditoPlanEjecucionCobroCliente {
  /** Identidad contractual del movimiento de deuda; nunca se deriva de `_id`. */
  movimientoDestinoId: string;
  montoAplicadoEsperado: number;
}

export interface ComponentePlanEjecucionCobroClienteBase {
  /** Identidad explicita y unica del componente dentro de la ejecucion. */
  claveIdempotencia: string;
  montoAplicadoEsperado: number;
  creditos: CreditoPlanEjecucionCobroCliente[];
}

export interface ComponenteSaldoFavorPlanEjecucionCobroCliente extends ComponentePlanEjecucionCobroClienteBase {
  tipo: "SALDO_FAVOR";
}

/**
 * Ruta de custodia que debe materializarse cuando el dinero nuevo lo recibe
 * un actor distinto de CAJERO. Los identificadores son opacos y nunca se
 * completan, recortan ni reconstruyen a partir de su formato.
 */
export interface CustodiaEsperadaCobroCliente {
  custodioOrigenId: string;
  custodioDestinoId: string;
  turnoCajaOrigenId: string;
  turnoCajaDestinoId: string;
  cajaOrigenId?: string;
  cajaDestinoId?: string;
}

export interface ComponenteDineroNuevoPlanEjecucionCobroCliente extends ComponentePlanEjecucionCobroClienteBase {
  tipo: "DINERO_NUEVO";
  metodoPago: MetodoPago;
  /** Dinero recibido; puede superar lo aplicado y generar saldo a favor. */
  montoRecibidoEsperado: number;
  /**
   * Custodia comprometida por el plan. Es obligatoria si quien recibe es
   * VENDEDOR o SISTEMA y debe omitirse para CAJERO. La regla se valida con
   * `esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente`.
   */
  custodiaEsperada?: CustodiaEsperadaCobroCliente;
}

export type ComponentePlanEjecucionCobroCliente =
  | ComponenteSaldoFavorPlanEjecucionCobroCliente
  | ComponenteDineroNuevoPlanEjecucionCobroCliente;

/**
 * Comprueba que la ruta de custodia tenga todos sus identificadores
 * contractuales. No interpreta ni normaliza esos valores opacos.
 */
export function esCustodiaEsperadaCobroClienteCompleta(
  value: unknown,
): value is CustodiaEsperadaCobroCliente {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const custodia = value as Record<string, unknown>;
  return (
    esIdentificadorOpacoNoVacio(custodia.custodioOrigenId) &&
    esIdentificadorOpacoNoVacio(custodia.custodioDestinoId) &&
    esIdentificadorOpacoNoVacio(custodia.turnoCajaOrigenId) &&
    esIdentificadorOpacoNoVacio(custodia.turnoCajaDestinoId) &&
    (custodia.cajaOrigenId === undefined ||
      esIdentificadorOpacoNoVacio(custodia.cajaOrigenId)) &&
    (custodia.cajaDestinoId === undefined ||
      esIdentificadorOpacoNoVacio(custodia.cajaDestinoId))
  );
}

/**
 * Regla fail-closed de custodia por rol de recepcion. Un CAJERO ya recibe en
 * la custodia operativa de caja y no debe inventar una transferencia; todo
 * rol no-CAJERO necesita una ruta completa y explicita.
 */
export function esCustodiaEsperadaCompatibleConRolRecepcionCobroCliente(
  componente: ComponenteDineroNuevoPlanEjecucionCobroCliente,
  rolRecepcion: RolRecepcionCobroCliente,
): boolean {
  return rolRecepcion === "CAJERO"
    ? componente.custodiaEsperada === undefined
    : esCustodiaEsperadaCobroClienteCompleta(componente.custodiaEsperada);
}

export interface PlanEjecucionCobroCliente {
  montoAplicadoEsperado: number;
  /**
   * Admite como maximo un componente SALDO_FAVOR y cualquier cantidad de
   * componentes DINERO_NUEVO. Cada claveIdempotencia debe ser unica.
   */
  componentes: ComponentePlanEjecucionCobroCliente[];
}

const compararTextoOrdinal = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const normalizarMontoACentimos = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new TypeError("plan_ejecucion_cobro_monto_no_finito");
  }
  const centimos = Math.round(value * 100);
  if (!Number.isSafeInteger(centimos)) {
    throw new RangeError("plan_ejecucion_cobro_monto_fuera_de_rango");
  }
  const monto = centimos / 100;
  return Object.is(monto, -0) ? 0 : monto;
};

/** Ordena creditos por identidad opaca y normaliza sus montos a centimos. */
export function canonicalizarCreditosPlanEjecucionCobroCliente(
  creditos: CreditoPlanEjecucionCobroCliente[],
): CreditoPlanEjecucionCobroCliente[] {
  return creditos
    .map((credito) => ({
      movimientoDestinoId: credito.movimientoDestinoId,
      montoAplicadoEsperado: normalizarMontoACentimos(
        credito.montoAplicadoEsperado,
      ),
    }))
    .sort((left, right) => {
      const porId = compararTextoOrdinal(
        left.movimientoDestinoId,
        right.movimientoDestinoId,
      );
      return porId !== 0
        ? porId
        : left.montoAplicadoEsperado - right.montoAplicadoEsperado;
    });
}

/**
 * Agrupa evidencia de imputaciones por el credito destino contractual.
 *
 * Un credito del plan puede consumir varias fuentes de saldo a favor y, por
 * tanto, materializar varias imputaciones para el mismo movimiento destino.
 * Esta funcion suma esas filas en centimos sin interpretar el identificador.
 */
export function agruparEvidenciaCreditosEjecucionCobroCliente(
  creditos: readonly CreditoPlanEjecucionCobroCliente[],
): CreditoPlanEjecucionCobroCliente[] {
  const centimosPorDestino = new Map<string, number>();

  for (const credito of creditos) {
    if (
      typeof credito.movimientoDestinoId !== "string" ||
      credito.movimientoDestinoId.length === 0
    ) {
      throw new TypeError("evidencia_ejecucion_cobro_destino_invalido");
    }
    const monto = normalizarMontoACentimos(credito.montoAplicadoEsperado);
    const centimos = Math.round(monto * 100);
    if (centimos <= 0) {
      throw new RangeError("evidencia_ejecucion_cobro_monto_invalido");
    }
    const acumulado =
      (centimosPorDestino.get(credito.movimientoDestinoId) ?? 0) + centimos;
    if (!Number.isSafeInteger(acumulado)) {
      throw new RangeError("evidencia_ejecucion_cobro_monto_fuera_de_rango");
    }
    centimosPorDestino.set(credito.movimientoDestinoId, acumulado);
  }

  return [...centimosPorDestino.entries()]
    .map(([movimientoDestinoId, centimos]) => ({
      movimientoDestinoId,
      montoAplicadoEsperado: centimos / 100,
    }))
    .sort((left, right) =>
      compararTextoOrdinal(left.movimientoDestinoId, right.movimientoDestinoId),
    );
}

/**
 * Compara el plan (un destino por credito) con evidencia que puede contener
 * varias imputaciones por destino. Los IDs se comparan literalmente.
 */
export function coincidenCreditosPlanConEvidenciaEjecucionCobroCliente(
  creditosPlan: readonly CreditoPlanEjecucionCobroCliente[],
  evidencia: readonly CreditoPlanEjecucionCobroCliente[],
): boolean {
  try {
    const plan = canonicalizarCreditosPlanEjecucionCobroCliente([
      ...creditosPlan,
    ]);
    if (
      plan.length === 0 ||
      new Set(plan.map((credito) => credito.movimientoDestinoId)).size !==
        plan.length ||
      plan.some(
        (credito) =>
          credito.movimientoDestinoId.length === 0 ||
          credito.montoAplicadoEsperado <= 0,
      )
    ) {
      return false;
    }
    const evidenciaAgrupada =
      agruparEvidenciaCreditosEjecucionCobroCliente(evidencia);
    return JSON.stringify(plan) === JSON.stringify(evidenciaAgrupada);
  } catch {
    return false;
  }
}

/** Copia la ruta de custodia sin alterar ninguno de sus identificadores. */
export function canonicalizarCustodiaEsperadaCobroCliente(
  custodia: CustodiaEsperadaCobroCliente,
): CustodiaEsperadaCobroCliente {
  return {
    custodioOrigenId: custodia.custodioOrigenId,
    custodioDestinoId: custodia.custodioDestinoId,
    turnoCajaOrigenId: custodia.turnoCajaOrigenId,
    turnoCajaDestinoId: custodia.turnoCajaDestinoId,
    ...(custodia.cajaOrigenId === undefined
      ? {}
      : { cajaOrigenId: custodia.cajaOrigenId }),
    ...(custodia.cajaDestinoId === undefined
      ? {}
      : { cajaDestinoId: custodia.cajaDestinoId }),
  };
}

/**
 * Devuelve una copia canonica del plan para hashing e igualdad tecnica.
 *
 * Los arreglos se ordenan solo para serializacion: el comparador ordinal de
 * ECMAScript no interpreta IDs ni claves. Los montos se expresan en centimos
 * para evitar diferencias accidentales de representacion entre runtimes.
 */
export function canonicalizarPlanEjecucionCobroCliente(
  plan: PlanEjecucionCobroCliente,
): PlanEjecucionCobroCliente {
  const componentes = plan.componentes
    .map((componente): ComponentePlanEjecucionCobroCliente => {
      const creditos = canonicalizarCreditosPlanEjecucionCobroCliente(
        componente.creditos,
      );
      const base: ComponentePlanEjecucionCobroClienteBase = {
        claveIdempotencia: componente.claveIdempotencia,
        montoAplicadoEsperado: normalizarMontoACentimos(
          componente.montoAplicadoEsperado,
        ),
        creditos,
      };
      return componente.tipo === "SALDO_FAVOR"
        ? { tipo: "SALDO_FAVOR", ...base }
        : {
            tipo: "DINERO_NUEVO",
            ...base,
            metodoPago: componente.metodoPago,
            montoRecibidoEsperado: normalizarMontoACentimos(
              componente.montoRecibidoEsperado,
            ),
            ...(componente.custodiaEsperada === undefined
              ? {}
              : {
                  custodiaEsperada: canonicalizarCustodiaEsperadaCobroCliente(
                    componente.custodiaEsperada,
                  ),
                }),
          };
    })
    .sort((left, right) => {
      const porClave = compararTextoOrdinal(
        left.claveIdempotencia,
        right.claveIdempotencia,
      );
      if (porClave !== 0) return porClave;
      return compararTextoOrdinal(left.tipo, right.tipo);
    });

  return {
    montoAplicadoEsperado: normalizarMontoACentimos(plan.montoAplicadoEsperado),
    componentes,
  };
}

const canonicalizarValorJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizarValorJson);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => compararTextoOrdinal(left, right))) {
      result[key] = canonicalizarValorJson(item);
    }
    return result;
  }
  return value;
};

/**
 * Serializacion JSON determinista que debe ser la entrada exacta de SHA-256.
 */
export function serializarPlanEjecucionCobroClienteCanonico(
  plan: PlanEjecucionCobroCliente,
): string {
  return JSON.stringify(
    canonicalizarValorJson(canonicalizarPlanEjecucionCobroCliente(plan)),
  );
}

/**
 * Cabecera durable del cobro logico. El documento CouchDB usa un `_id`
 * tecnico independiente; toda relacion usa `ejecucionCobroId` explicitamente.
 */
export interface CabeceraEjecucionCobroCliente {
  type: typeof TIPO_DOCUMENTO_EJECUCION_COBRO_CLIENTE;
  contractVersion: EjecucionCobroClienteContractVersion;
  ejecucionCobroId: EjecucionCobroClienteId;
  cuentaId: string;
  clienteId: string;
  moneda: MonedaCuentaCliente;
  /** SHA-256 del plan canonico e inmutable. */
  planHash: string;
  plan: PlanEjecucionCobroCliente;
  /** Claves exactas confirmadas; nunca tipos ni IDs tecnicos inferidos. */
  componentesConfirmados: string[];
  estado: EstadoCabeceraEjecucionCobroCliente;
  creadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
  confirmadaAt?: Date;
  recuperacionRequeridaAt?: Date;
  codigoError?: string;
}

/**
 * Representación de la cabecera ya persistida cuando viaja junto al resultado
 * HTTP. `_id` es técnico y opaco; no se duplica como `id` ni se interpreta.
 */
export interface CabeceraEjecucionCobroClientePersistida extends CabeceraEjecucionCobroCliente {
  _id: string;
  _rev?: string;
}

export interface TotalesEjecucionCobroCliente {
  /** Dinero efectivamente recibido durante esta ejecucion. */
  montoDineroNuevo: number;
  /** Credito previo del cliente consumido durante esta ejecucion. */
  montoSaldoFavorAplicado: number;
  /** Suma de todas las imputaciones confirmadas de la ejecucion. */
  montoAplicado: number;
  /** Parte del monto aplicado que perdio efecto por reversa o compensacion. */
  montoRevertido?: number;
  /** Efecto vigente de la ejecucion despues de reversas o compensaciones. */
  montoAplicadoNeto?: number;
  /** Dinero nuevo que no fue imputado y permanece como credito abierto. */
  montoNoImputado: number;
  /**
   * Alias explicito para presentacion. Cuando existe debe ser igual a
   * montoNoImputado; es opcional para no duplicar el dato en productores que
   * no lo necesitan.
   */
  montoSaldoFavorGenerado?: number;
}

export interface ComponenteEjecucionCobroClienteBase {
  /** Identidad opaca del componente, si la proyección conserva su journal. */
  id?: string;
  estado: EstadoComponenteEjecucionCobroCliente;
  /** Identidad idempotente del comando, si está disponible en la lectura. */
  idempotencyKey?: string;
  /** Huella opcional del payload del componente para detectar reuso incompatible. */
  requestHash?: string;
  /** Movimientos de ledger producidos o consumidos por este componente. */
  movimientoIds: string[];
  /** Imputaciones producidas por este componente. */
  imputacionIds: string[];
  montoDisponible: number;
  /** Importe aplicado originalmente por este componente. */
  montoAplicado: number;
  /** Parte del importe aplicado que posteriormente perdio efecto. */
  montoRevertido?: number;
  /** Efecto vigente del componente despues de compensaciones. */
  montoAplicadoNeto?: number;
  montoNoImputado: number;
}

export interface ComponenteDineroNuevoEjecucionCobroCliente extends ComponenteEjecucionCobroClienteBase {
  tipo: "DINERO_NUEVO";
  metodoPago: MetodoPago;
  /** Identificadores opacos de las recepciones producidas por el componente. */
  recepcionCobroIds: string[];
}

export interface ComponenteSaldoFavorEjecucionCobroCliente extends ComponenteEjecucionCobroClienteBase {
  tipo: "SALDO_FAVOR";
}

export type ComponenteEjecucionCobroCliente =
  | ComponenteDineroNuevoEjecucionCobroCliente
  | ComponenteSaldoFavorEjecucionCobroCliente;

/**
 * Agregado de lectura sintetizado para una accion de cobro. No es un documento
 * CouchDB ni reemplaza a la recepcion, al movimiento o a la imputacion.
 */
export interface EjecucionCobroCliente {
  contractVersion: EjecucionCobroClienteContractVersion;
  id: EjecucionCobroClienteId;
  cuentaId: string;
  clienteId: string;
  moneda: MonedaCuentaCliente;
  estado: EstadoEjecucionCobroCliente;
  componentes: ComponenteEjecucionCobroCliente[];
  totales: TotalesEjecucionCobroCliente;
  /** Puede faltar al sintetizar documentos históricos que no conservaron actor. */
  creadoPorId?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmadaAt?: Date;
  recuperacionRequeridaAt?: Date;
  codigoError?: string;
}

/**
 * Destino financiero enriquecido para presentar el detalle de un cobro sin
 * usar el formato de ningun identificador como dato de negocio.
 */
export interface CreditoDestinoEjecucionCobroClienteDetalle {
  movimientoDestinoId: string;
  tipoOrigen: OrigenMovimientoCuentaCliente;
  origenId: string;
  codigoVisible?: string;
  imputacionIds: string[];
  montoOriginal?: number;
  /** Saldo de la deuda inmediatamente antes de esta ejecucion, si es reconstruible. */
  saldoPendienteAnterior?: number;
  /** Importe aplicado originalmente por esta ejecucion. */
  montoAplicado: number;
  /** Parte del pago original que posteriormente perdio efecto. */
  montoRevertido?: number;
  /** Efecto vigente de esta ejecucion sobre el credito. */
  montoAplicadoNeto?: number;
  /** Saldo de la deuda despues de aplicar esta ejecucion, si es reconstruible. */
  saldoPendienteRestante?: number;
}

/**
 * Respuesta versionada para la vista "Ver cobro". Las colecciones permanecen
 * separadas porque cada documento conserva una responsabilidad distinta.
 */
export interface DetalleEjecucionCobroCliente {
  contractVersion: EjecucionCobroClienteContractVersion;
  ejecucion: EjecucionCobroCliente;
  recepciones: RecepcionCobroCliente[];
  movimientos: MovimientoCuentaCliente[];
  imputaciones: ImputacionCuentaCliente[];
  /**
   * Evidencia lossless de todas las transferencias generadas por la ejecucion.
   * Nunca debe sustituirse por un singular que descarte transferencias.
   */
  transferenciasCustodia: TransferenciaCustodiaCobro[];
  creditosDestino: CreditoDestinoEjecucionCobroClienteDetalle[];
  /** Reversas, devoluciones o ajustes posteriores que afectan la ejecucion. */
  movimientosCompensatorios: MovimientoCuentaCliente[];
}

export type EstadoTransferenciaCustodiaCobro =
  "CREADA" | "RECIBIDA" | "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "ANULADA";

export interface TransferenciaCustodiaCobro {
  id: string;
  recepcionCobroId: string;
  custodioOrigenId: string;
  custodioDestinoId: string;
  turnoCajaOrigenId: string;
  turnoCajaDestinoId: string;
  cajaOrigenId?: string;
  cajaDestinoId?: string;
  estado: EstadoTransferenciaCustodiaCobro;
  idempotencyKey?: string;
  recibidaPorId?: string;
  rechazadaPorId?: string;
  anuladaPorId?: string;
  motivoRechazo?: string;
  motivoAnulacion?: string;
  solicitadaAt?: Date;
  aceptadaAt?: Date;
  createdAt: Date;
  resueltaAt?: Date;
}

export interface ResumenCuentaCliente {
  id?: string;
  cuentaId: string;
  clienteId?: string;
  saldoFavor: number;
  saldoPorCobrar: number;
  saldoCreditoNoAplicado?: number;
  moneda: MonedaCuentaCliente;
  ultimoAsientoId?: string;
  ultimoAsientoAt?: Date;
  cantidadAsientosFuente?: number;
  cantidadImputacionesFuente?: number;
  version?: number;
  reconstruidaAt?: Date;
  createdAt?: Date;
  updatedAt: Date;
}
