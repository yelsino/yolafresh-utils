import {
  INVENTORY_SCHEMA_VERSION,
  type ActorInventarioSnapshot,
  type ConversionUnidadInventarioSnapshot,
  type ResultadoValidacionInventario,
} from "../contracts/inventory-quantity.contract";
import {
  MOVIMIENTO_INVENTARIO_TYPE,
  OrigenMovimientoInventario,
  TipoMovimientoInventario,
  type MovimientoInventario,
  type MovimientoInventarioLinea,
} from "../contracts/movimiento-inventario.contract";
import {
  EstadoTransferenciaInventario,
  TRANSFERENCIA_INVENTARIO_TYPE,
  type AccionTransferenciaInventarioSnapshot,
  type AccionVersionadaTransferenciaInventarioSnapshot,
  type CierreDiferenciaTransferenciaInventarioLinea,
  type RecepcionTransferenciaInventarioLinea,
  type RecepcionTransferenciaInventarioSnapshot,
  type TransferenciaInventario,
  type TransferenciaInventarioLinea,
} from "../contracts/transferencia-inventario.contract";
import {
  convertirCantidadAUnidadBase,
  validarConversionInventario,
} from "./inventory.helpers";

const textoNoVacio = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const numeroFinito = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const timestampValido = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

// Una unidad mínima representable no puede ser indistinguible de cero.
const casiIguales = (left: number, right: number, precision: number): boolean =>
  Math.abs(left - right) < Math.pow(10, -precision) / 2;

const normalizarCero = (value: number, precision: number): number =>
  casiIguales(value, 0, precision) ? 0 : value;

const validarActor = (
  actor: ActorInventarioSnapshot | null | undefined,
  ruta: string,
  errores: string[],
): void => {
  if (!actor || !textoNoVacio(actor.usuarioId)) {
    errores.push(`${ruta}.actor.usuarioId es requerido`);
  }
  if (actor?.usuarioNombre !== undefined && !textoNoVacio(actor.usuarioNombre)) {
    errores.push(`${ruta}.actor.usuarioNombre no puede estar vacio`);
  }
  if (actor?.dispositivoId !== undefined && !textoNoVacio(actor.dispositivoId)) {
    errores.push(`${ruta}.actor.dispositivoId no puede estar vacio`);
  }
  if (actor?.sesionId !== undefined && !textoNoVacio(actor.sesionId)) {
    errores.push(`${ruta}.actor.sesionId no puede estar vacio`);
  }
};

const validarAccion = (
  accion: AccionTransferenciaInventarioSnapshot | null | undefined,
  ruta: string,
  errores: string[],
): void => {
  if (!accion) {
    errores.push(`${ruta} es requerida`);
    return;
  }
  if (!textoNoVacio(accion.operationId)) {
    errores.push(`${ruta}.operationId es requerido`);
  }
  if (!textoNoVacio(accion.idempotencyKey)) {
    errores.push(`${ruta}.idempotencyKey es requerida`);
  }
  validarActor(accion.actor, ruta, errores);
  if (!timestampValido(accion.registradaAt)) {
    errores.push(`${ruta}.registradaAt es invalida`);
  }
};

const validarAccionVersionada = (
  accion: AccionVersionadaTransferenciaInventarioSnapshot | null | undefined,
  ruta: string,
  errores: string[],
): void => {
  validarAccion(accion, ruta, errores);
  if (!accion || !Number.isSafeInteger(accion.expectedVersion) || accion.expectedVersion < 1) {
    errores.push(`${ruta}.expectedVersion debe ser un entero positivo`);
  }
};

const validarEvidencias = (
  evidenciaIds: readonly string[] | undefined,
  ruta: string,
  errores: string[],
): void => {
  if (evidenciaIds === undefined) return;
  if (
    !Array.isArray(evidenciaIds) ||
    evidenciaIds.some((evidenciaId) => !textoNoVacio(evidenciaId))
  ) {
    errores.push(`${ruta} solo admite IDs no vacios`);
  }
};

const validarLinea = (
  linea: TransferenciaInventarioLinea,
  index: number,
  errores: string[],
): void => {
  const ruta = `transferencia.items[${index}]`;
  if (!textoNoVacio(linea.id)) errores.push(`${ruta}.id es requerido`);
  if (!textoNoVacio(linea.productoBaseId)) {
    errores.push(`${ruta}.productoBaseId es requerido`);
  }
  if (linea.presentacionId !== undefined && !textoNoVacio(linea.presentacionId)) {
    errores.push(`${ruta}.presentacionId no puede estar vacio`);
  }
  if (!textoNoVacio(linea.unidadBase)) {
    errores.push(`${ruta}.unidadBase es requerida`);
  }

  const conversion = validarConversionInventario(linea.conversionSnapshot);
  errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
  if (
    linea.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
    linea.conversionSnapshot.presentacionId !== linea.presentacionId ||
    linea.conversionSnapshot.unidadBase !== linea.unidadBase
  ) {
    errores.push(`${ruta}.conversionSnapshot no corresponde a la linea`);
  }
  if (
    linea.presentacionId === undefined &&
    (linea.conversionSnapshot.factorUnidadBase !== 1 ||
      linea.conversionSnapshot.unidadOperacion !== linea.unidadBase)
  ) {
    errores.push(
      `${ruta} sin presentacion exige captura directa con factor 1 y unidad base`,
    );
  }

  if (!numeroFinito(linea.cantidadOperacion) || linea.cantidadOperacion <= 0) {
    errores.push(`${ruta}.cantidadOperacion debe ser mayor a 0`);
  }
  if (!numeroFinito(linea.cantidadBase) || linea.cantidadBase <= 0) {
    errores.push(`${ruta}.cantidadBase debe ser mayor a 0`);
  }
  if (
    conversion.valido &&
    numeroFinito(linea.cantidadOperacion) &&
    linea.cantidadOperacion > 0 &&
    numeroFinito(linea.cantidadBase)
  ) {
    const esperada = convertirCantidadAUnidadBase(
      linea.cantidadOperacion,
      linea.conversionSnapshot,
    );
    if (
      !casiIguales(
        linea.cantidadBase,
        esperada,
        linea.conversionSnapshot.precisionCantidadBase,
      )
    ) {
      errores.push(`${ruta}.cantidadBase no coincide con la conversion`);
    }
  }
  if (
    linea.costoUnitarioBaseSnapshot !== undefined &&
    (!numeroFinito(linea.costoUnitarioBaseSnapshot) ||
      linea.costoUnitarioBaseSnapshot < 0)
  ) {
    errores.push(`${ruta}.costoUnitarioBaseSnapshot no puede ser negativo`);
  }
};

const validarCantidadNoNegativa = (
  value: unknown,
  ruta: string,
  errores: string[],
): void => {
  if (!numeroFinito(value) || value < 0) {
    errores.push(`${ruta} debe ser un numero no negativo`);
  }
};

const validarLineaRecepcion = (
  linea: RecepcionTransferenciaInventarioLinea,
  ruta: string,
  lineasPorId: ReadonlyMap<string, TransferenciaInventarioLinea>,
  errores: string[],
): void => {
  if (!textoNoVacio(linea.lineaTransferenciaId)) {
    errores.push(`${ruta}.lineaTransferenciaId es requerido`);
  } else if (!lineasPorId.has(linea.lineaTransferenciaId)) {
    errores.push(`${ruta}.lineaTransferenciaId no existe en el envio`);
  }
  validarCantidadNoNegativa(
    linea.cantidadBaseAceptada,
    `${ruta}.cantidadBaseAceptada`,
    errores,
  );
  validarCantidadNoNegativa(
    linea.cantidadBaseRechazada,
    `${ruta}.cantidadBaseRechazada`,
    errores,
  );
  validarCantidadNoNegativa(
    linea.cantidadBaseFaltante,
    `${ruta}.cantidadBaseFaltante`,
    errores,
  );
  if (
    numeroFinito(linea.cantidadBaseAceptada) &&
    numeroFinito(linea.cantidadBaseRechazada) &&
    numeroFinito(linea.cantidadBaseFaltante) &&
    linea.cantidadBaseAceptada +
      linea.cantidadBaseRechazada +
      linea.cantidadBaseFaltante <=
      0
  ) {
    errores.push(`${ruta} debe registrar alguna cantidad`);
  }
  if (
    (linea.cantidadBaseRechazada > 0 || linea.cantidadBaseFaltante > 0) &&
    !textoNoVacio(linea.motivoCodigo)
  ) {
    errores.push(`${ruta}.motivoCodigo es requerido cuando existe diferencia`);
  }
  validarEvidencias(linea.evidenciaIds, `${ruta}.evidenciaIds`, errores);
};

const validarLineaCierre = (
  linea: CierreDiferenciaTransferenciaInventarioLinea,
  ruta: string,
  lineasPorId: ReadonlyMap<string, TransferenciaInventarioLinea>,
  errores: string[],
): void => {
  if (!textoNoVacio(linea.lineaTransferenciaId)) {
    errores.push(`${ruta}.lineaTransferenciaId es requerido`);
  } else if (!lineasPorId.has(linea.lineaTransferenciaId)) {
    errores.push(`${ruta}.lineaTransferenciaId no existe en el envio`);
  }
  validarCantidadNoNegativa(
    linea.cantidadBaseRechazada,
    `${ruta}.cantidadBaseRechazada`,
    errores,
  );
  validarCantidadNoNegativa(
    linea.cantidadBaseFaltante,
    `${ruta}.cantidadBaseFaltante`,
    errores,
  );
  if (
    numeroFinito(linea.cantidadBaseRechazada) &&
    numeroFinito(linea.cantidadBaseFaltante) &&
    linea.cantidadBaseRechazada + linea.cantidadBaseFaltante <= 0
  ) {
    errores.push(`${ruta} debe cerrar alguna cantidad`);
  }
  if (!textoNoVacio(linea.motivoCodigo)) {
    errores.push(`${ruta}.motivoCodigo es requerido`);
  }
  validarEvidencias(linea.evidenciaIds, `${ruta}.evidenciaIds`, errores);
};

const transicionesTransferencia: Readonly<
  Record<
    EstadoTransferenciaInventario,
    readonly EstadoTransferenciaInventario[]
  >
> = Object.freeze({
  [EstadoTransferenciaInventario.BORRADOR]: Object.freeze([
    EstadoTransferenciaInventario.ENVIADA,
    EstadoTransferenciaInventario.CANCELADA,
  ]),
  [EstadoTransferenciaInventario.ENVIADA]: Object.freeze([
    EstadoTransferenciaInventario.PARCIALMENTE_RECIBIDA,
    EstadoTransferenciaInventario.RECIBIDA,
    EstadoTransferenciaInventario.CERRADA_CON_DIFERENCIA,
  ]),
  [EstadoTransferenciaInventario.PARCIALMENTE_RECIBIDA]: Object.freeze([
    EstadoTransferenciaInventario.RECIBIDA,
    EstadoTransferenciaInventario.CERRADA_CON_DIFERENCIA,
  ]),
  [EstadoTransferenciaInventario.RECIBIDA]: Object.freeze([]),
  [EstadoTransferenciaInventario.CERRADA_CON_DIFERENCIA]: Object.freeze([]),
  [EstadoTransferenciaInventario.CANCELADA]: Object.freeze([]),
});

export const puedeTransicionarTransferenciaInventario = (
  estadoActual: EstadoTransferenciaInventario,
  estadoDestino: EstadoTransferenciaInventario,
): boolean => transicionesTransferencia[estadoActual]?.includes(estadoDestino) ?? false;

export const puedeAgregarRecepcionTransferenciaInventario = (
  estadoActual: EstadoTransferenciaInventario,
): boolean =>
  estadoActual === EstadoTransferenciaInventario.ENVIADA ||
  estadoActual === EstadoTransferenciaInventario.PARCIALMENTE_RECIBIDA;

export const assertTransicionTransferenciaInventario = (
  estadoActual: EstadoTransferenciaInventario,
  estadoDestino: EstadoTransferenciaInventario,
): void => {
  if (!puedeTransicionarTransferenciaInventario(estadoActual, estadoDestino)) {
    throw new Error(
      `transicion_transferencia_inventario_v2_no_permitida:${estadoActual}:${estadoDestino}`,
    );
  }
};

export interface ResumenTransferenciaInventarioLinea {
  lineaTransferenciaId: string;
  unidadBase: TransferenciaInventarioLinea["unidadBase"];
  cantidadBaseEnviada: number;
  cantidadBaseAceptada: number;
  cantidadBaseRechazada: number;
  cantidadBaseFaltante: number;
  cantidadBaseEnTransito: number;
}

export interface ResumenTransferenciaInventarioPorUnidadBase {
  unidadBase: TransferenciaInventarioLinea["unidadBase"];
  cantidadBaseEnviada: number;
  cantidadBaseAceptada: number;
  cantidadBaseRechazada: number;
  cantidadBaseFaltante: number;
  cantidadBaseEnTransito: number;
}

export interface ResumenTransferenciaInventario {
  lineas: ResumenTransferenciaInventarioLinea[];
  /** Nunca suma kg, unidades, litros o metros entre sí. */
  totalesPorUnidadBase: ResumenTransferenciaInventarioPorUnidadBase[];
}

export const resumirTransferenciaInventario = (
  transferencia: Pick<
    TransferenciaInventario,
    "items" | "recepciones" | "cierreDiferencia"
  >,
): ResumenTransferenciaInventario => {
  const porId = new Map<string, ResumenTransferenciaInventarioLinea>();
  for (const linea of transferencia.items ?? []) {
    porId.set(linea.id, {
      lineaTransferenciaId: linea.id,
      unidadBase: linea.unidadBase,
      cantidadBaseEnviada: linea.cantidadBase,
      cantidadBaseAceptada: 0,
      cantidadBaseRechazada: 0,
      cantidadBaseFaltante: 0,
      cantidadBaseEnTransito: linea.cantidadBase,
    });
  }
  for (const recepcion of transferencia.recepciones ?? []) {
    for (const recibida of recepcion.items ?? []) {
      const acumulado = porId.get(recibida.lineaTransferenciaId);
      if (!acumulado) continue;
      acumulado.cantidadBaseAceptada += recibida.cantidadBaseAceptada;
      acumulado.cantidadBaseRechazada += recibida.cantidadBaseRechazada;
      acumulado.cantidadBaseFaltante += recibida.cantidadBaseFaltante;
    }
  }
  for (const diferencia of transferencia.cierreDiferencia?.items ?? []) {
    const acumulado = porId.get(diferencia.lineaTransferenciaId);
    if (!acumulado) continue;
    acumulado.cantidadBaseRechazada += diferencia.cantidadBaseRechazada;
    acumulado.cantidadBaseFaltante += diferencia.cantidadBaseFaltante;
  }

  const lineas = [...porId.values()].map((linea) => {
    const original = transferencia.items.find(
      (item) => item.id === linea.lineaTransferenciaId,
    );
    const precision = original?.conversionSnapshot.precisionCantidadBase ?? 6;
    return {
      ...linea,
      cantidadBaseEnTransito: normalizarCero(
        linea.cantidadBaseEnviada -
          linea.cantidadBaseAceptada -
          linea.cantidadBaseRechazada -
          linea.cantidadBaseFaltante,
        precision,
      ),
    };
  });
  const porUnidad = new Map<
    TransferenciaInventarioLinea["unidadBase"],
    ResumenTransferenciaInventarioPorUnidadBase
  >();
  for (const linea of lineas) {
    const total = porUnidad.get(linea.unidadBase) ?? {
      unidadBase: linea.unidadBase,
      cantidadBaseEnviada: 0,
      cantidadBaseAceptada: 0,
      cantidadBaseRechazada: 0,
      cantidadBaseFaltante: 0,
      cantidadBaseEnTransito: 0,
    };
    total.cantidadBaseEnviada += linea.cantidadBaseEnviada;
    total.cantidadBaseAceptada += linea.cantidadBaseAceptada;
    total.cantidadBaseRechazada += linea.cantidadBaseRechazada;
    total.cantidadBaseFaltante += linea.cantidadBaseFaltante;
    total.cantidadBaseEnTransito += linea.cantidadBaseEnTransito;
    porUnidad.set(linea.unidadBase, total);
  }
  return { lineas, totalesPorUnidadBase: [...porUnidad.values()] };
};

const registrarClaveAccion = (
  accion: AccionTransferenciaInventarioSnapshot | undefined,
  operationIds: Set<string>,
  idempotencyKeys: Set<string>,
  errores: string[],
): void => {
  if (!accion) return;
  if (operationIds.has(accion.operationId)) {
    errores.push("cada accion exige un operationId diferente");
  }
  if (idempotencyKeys.has(accion.idempotencyKey)) {
    errores.push("cada accion exige una idempotencyKey diferente");
  }
  operationIds.add(accion.operationId);
  idempotencyKeys.add(accion.idempotencyKey);
};

export function construirIdMovimientoTransferenciaInventario(
  transferenciaId: string,
  pierna: "SALIDA",
): string;
export function construirIdMovimientoTransferenciaInventario(
  transferenciaId: string,
  pierna: "ENTRADA",
  recepcionId: string,
): string;
export function construirIdMovimientoTransferenciaInventario(
  transferenciaId: string,
  pierna: "SALIDA" | "ENTRADA",
  recepcionId?: string,
): string {
  const id = transferenciaId.trim();
  if (!id) throw new Error("transferencia_id_requerido");
  if (pierna === "SALIDA") {
    return `movimiento_inventario_v2:transferencia:${encodeURIComponent(id)}:salida`;
  }
  const recibo = recepcionId?.trim();
  if (!recibo) throw new Error("recepcion_id_requerido_para_entrada");
  return `movimiento_inventario_v2:transferencia:${encodeURIComponent(id)}:entrada:${encodeURIComponent(recibo)}`;
}

export const validarTransferenciaInventario = (
  transferencia: TransferenciaInventario,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  if (!textoNoVacio(transferencia.id)) errores.push("transferencia.id es requerido");
  if (transferencia.type !== TRANSFERENCIA_INVENTARIO_TYPE) {
    errores.push("transferencia.type es invalido");
  }
  if (transferencia.schemaVersion !== INVENTORY_SCHEMA_VERSION) {
    errores.push("transferencia.schemaVersion debe ser 2");
  }
  if (!Number.isSafeInteger(transferencia.version) || transferencia.version < 1) {
    errores.push("transferencia.version debe ser un entero positivo");
  }
  if (!Object.values(EstadoTransferenciaInventario).includes(transferencia.estado)) {
    errores.push("transferencia.estado es invalido");
  }
  if (!textoNoVacio(transferencia.empresaId)) errores.push("transferencia.empresaId es requerido");
  if (!textoNoVacio(transferencia.almacenOrigenId)) errores.push("transferencia.almacenOrigenId es requerido");
  if (!textoNoVacio(transferencia.almacenDestinoId)) errores.push("transferencia.almacenDestinoId es requerido");
  if (
    textoNoVacio(transferencia.almacenOrigenId) &&
    transferencia.almacenOrigenId === transferencia.almacenDestinoId
  ) {
    errores.push("transferencia exige almacenes origen y destino diferentes");
  }
  if (!textoNoVacio(transferencia.correlationId)) errores.push("transferencia.correlationId es requerido");
  validarEvidencias(transferencia.evidenciaIds, "transferencia.evidenciaIds", errores);

  const lineasPorId = new Map<string, TransferenciaInventarioLinea>();
  if (!Array.isArray(transferencia.items) || transferencia.items.length === 0) {
    errores.push("transferencia.items requiere al menos una linea");
  } else {
    transferencia.items.forEach((linea, index) => {
      validarLinea(linea, index, errores);
      if (textoNoVacio(linea.id)) {
        if (lineasPorId.has(linea.id)) {
          errores.push(`transferencia.items[${index}].id esta duplicado`);
        }
        lineasPorId.set(linea.id, linea);
      }
    });
  }

  validarAccion(transferencia.creacion, "transferencia.creacion", errores);
  if (transferencia.envio) {
    validarAccionVersionada(transferencia.envio, "transferencia.envio", errores);
    if (transferencia.envio.expectedVersion !== 1) {
      errores.push("transferencia.envio.expectedVersion debe ser 1");
    }
  }
  if (!Array.isArray(transferencia.recepciones)) {
    errores.push("transferencia.recepciones debe ser un arreglo");
  }

  const recepciones = Array.isArray(transferencia.recepciones)
    ? transferencia.recepciones
    : [];
  const recepcionIds = new Set<string>();
  let ultimaFecha = transferencia.envio?.registradaAt ?? transferencia.creacion?.registradaAt;
  recepciones.forEach((recepcion, recepcionIndex) => {
    const ruta = `transferencia.recepciones[${recepcionIndex}]`;
    validarAccionVersionada(recepcion, ruta, errores);
    if (!textoNoVacio(recepcion.id)) errores.push(`${ruta}.id es requerido`);
    else if (recepcionIds.has(recepcion.id)) errores.push(`${ruta}.id esta duplicado`);
    else recepcionIds.add(recepcion.id);
    const expectedVersion = 2 + recepcionIndex;
    if (recepcion.expectedVersion !== expectedVersion) {
      errores.push(`${ruta}.expectedVersion debe ser ${expectedVersion}`);
    }
    if (!transferencia.envio || recepcion.registradaAt < transferencia.envio.registradaAt) {
      errores.push(`${ruta} exige un envio anterior`);
    }
    if (timestampValido(ultimaFecha) && recepcion.registradaAt < ultimaFecha) {
      errores.push(`${ruta}.registradaAt debe conservar el orden de recepcion`);
    }
    ultimaFecha = recepcion.registradaAt;
    if (
      textoNoVacio(transferencia.id) &&
      textoNoVacio(recepcion.id) &&
      recepcion.movimientoEntradaId !==
        construirIdMovimientoTransferenciaInventario(
          transferencia.id,
          "ENTRADA",
          recepcion.id,
        )
    ) {
      errores.push(`${ruta}.movimientoEntradaId no es determinista`);
    }
    if (!Array.isArray(recepcion.items) || recepcion.items.length === 0) {
      errores.push(`${ruta}.items requiere al menos una linea`);
      return;
    }
    const ids = new Set<string>();
    let aceptadaTotal = 0;
    recepcion.items.forEach((linea, lineaIndex) => {
      const rutaLinea = `${ruta}.items[${lineaIndex}]`;
      validarLineaRecepcion(linea, rutaLinea, lineasPorId, errores);
      if (ids.has(linea.lineaTransferenciaId)) {
        errores.push(`${rutaLinea}.lineaTransferenciaId esta duplicado`);
      }
      ids.add(linea.lineaTransferenciaId);
      if (numeroFinito(linea.cantidadBaseAceptada)) {
        aceptadaTotal += linea.cantidadBaseAceptada;
      }
    });
    if (aceptadaTotal <= 0) {
      errores.push(`${ruta} debe aceptar stock para representar una recepcion fisica`);
    }
  });

  if (transferencia.cierreDiferencia) {
    const cierre = transferencia.cierreDiferencia;
    const ruta = "transferencia.cierreDiferencia";
    validarAccionVersionada(cierre, ruta, errores);
    const expectedVersion = 2 + recepciones.length;
    if (cierre.expectedVersion !== expectedVersion) {
      errores.push(`${ruta}.expectedVersion debe ser ${expectedVersion}`);
    }
    if (!transferencia.envio || cierre.registradaAt < transferencia.envio.registradaAt) {
      errores.push(`${ruta} exige un envio anterior`);
    }
    if (timestampValido(ultimaFecha) && cierre.registradaAt < ultimaFecha) {
      errores.push(`${ruta}.registradaAt no puede ser anterior al ultimo recibo`);
    }
    ultimaFecha = cierre.registradaAt;
    if (!Array.isArray(cierre.items) || cierre.items.length === 0) {
      errores.push(`${ruta}.items requiere al menos una linea`);
    } else {
      const ids = new Set<string>();
      cierre.items.forEach((linea, index) => {
        const rutaLinea = `${ruta}.items[${index}]`;
        validarLineaCierre(linea, rutaLinea, lineasPorId, errores);
        if (ids.has(linea.lineaTransferenciaId)) {
          errores.push(`${rutaLinea}.lineaTransferenciaId esta duplicado`);
        }
        ids.add(linea.lineaTransferenciaId);
      });
    }
  }

  if (transferencia.cancelacion) {
    validarAccionVersionada(
      transferencia.cancelacion,
      "transferencia.cancelacion",
      errores,
    );
    if (transferencia.cancelacion.expectedVersion !== 1) {
      errores.push("transferencia.cancelacion.expectedVersion debe ser 1");
    }
    if (!textoNoVacio(transferencia.cancelacion.motivoCodigo)) {
      errores.push("transferencia.cancelacion.motivoCodigo es requerido");
    }
    if (
      timestampValido(transferencia.cancelacion.registradaAt) &&
      transferencia.updatedAt < transferencia.cancelacion.registradaAt
    ) {
      errores.push("transferencia.updatedAt no puede ser anterior a cancelacion");
    }
  }

  const operationIds = new Set<string>();
  const idempotencyKeys = new Set<string>();
  registrarClaveAccion(transferencia.creacion, operationIds, idempotencyKeys, errores);
  registrarClaveAccion(transferencia.envio, operationIds, idempotencyKeys, errores);
  for (const recepcion of recepciones) {
    registrarClaveAccion(recepcion, operationIds, idempotencyKeys, errores);
  }
  registrarClaveAccion(
    transferencia.cierreDiferencia,
    operationIds,
    idempotencyKeys,
    errores,
  );
  registrarClaveAccion(
    transferencia.cancelacion,
    operationIds,
    idempotencyKeys,
    errores,
  );

  if (!timestampValido(transferencia.createdAt)) errores.push("transferencia.createdAt es invalido");
  if (!timestampValido(transferencia.updatedAt)) errores.push("transferencia.updatedAt es invalido");
  if (
    timestampValido(transferencia.createdAt) &&
    timestampValido(transferencia.updatedAt) &&
    transferencia.updatedAt < transferencia.createdAt
  ) {
    errores.push("transferencia.updatedAt no puede ser anterior a createdAt");
  }
  if (
    timestampValido(transferencia.creacion?.registradaAt) &&
    timestampValido(transferencia.createdAt) &&
    transferencia.creacion.registradaAt > transferencia.createdAt
  ) {
    errores.push("transferencia.creacion no puede ser posterior a createdAt");
  }
  if (
    transferencia.envio &&
    transferencia.envio.registradaAt < transferencia.creacion.registradaAt
  ) {
    errores.push("transferencia.envio no puede ser anterior a creacion");
  }
  if (
    transferencia.cancelacion &&
    transferencia.cancelacion.registradaAt < transferencia.creacion.registradaAt
  ) {
    errores.push("transferencia.cancelacion no puede ser anterior a creacion");
  }
  if (timestampValido(ultimaFecha) && transferencia.updatedAt < ultimaFecha) {
    errores.push("transferencia.updatedAt no puede ser anterior a una accion");
  }

  const salidaEsperada = textoNoVacio(transferencia.id)
    ? construirIdMovimientoTransferenciaInventario(transferencia.id, "SALIDA")
    : undefined;
  if (transferencia.envio) {
    if (transferencia.movimientoSalidaId !== salidaEsperada) {
      errores.push("transferencia con envio exige movimientoSalidaId determinista");
    }
  } else if (transferencia.movimientoSalidaId !== undefined) {
    errores.push("transferencia sin envio no admite movimientoSalidaId");
  }

  const resumen = resumirTransferenciaInventario(transferencia);
  for (const linea of resumen.lineas) {
    const original = lineasPorId.get(linea.lineaTransferenciaId);
    const precision = original?.conversionSnapshot.precisionCantidadBase ?? 6;
    if (linea.cantidadBaseEnTransito < -Math.pow(10, -precision) / 2) {
      errores.push(
        `transferencia.linea ${linea.lineaTransferenciaId} excede la cantidad enviada`,
      );
    }
  }

  const versionEsperada = transferencia.cancelacion
    ? 2
    : transferencia.envio
      ? 2 + recepciones.length + (transferencia.cierreDiferencia ? 1 : 0)
      : 1;
  if (transferencia.version !== versionEsperada) {
    errores.push(`transferencia.version debe ser ${versionEsperada} para sus acciones`);
  }

  const tieneDiferencia = resumen.lineas.some(
    (linea) =>
      linea.cantidadBaseRechazada > 0 || linea.cantidadBaseFaltante > 0,
  );
  const sinTransito = resumen.lineas.every(
    (linea) => linea.cantidadBaseEnTransito === 0,
  );
  switch (transferencia.estado) {
    case EstadoTransferenciaInventario.BORRADOR:
      if (
        transferencia.envio ||
        recepciones.length > 0 ||
        transferencia.cierreDiferencia ||
        transferencia.cancelacion ||
        transferencia.movimientoSalidaId
      ) {
        errores.push("transferencia BORRADOR no admite efectos posteriores");
      }
      break;
    case EstadoTransferenciaInventario.ENVIADA:
      if (!transferencia.envio || transferencia.movimientoSalidaId !== salidaEsperada) {
        errores.push("transferencia ENVIADA exige envio y salida determinista");
      }
      if (recepciones.length > 0 || transferencia.cierreDiferencia || transferencia.cancelacion) {
        errores.push("transferencia ENVIADA no admite recepciones, cierre ni cancelacion");
      }
      break;
    case EstadoTransferenciaInventario.PARCIALMENTE_RECIBIDA:
      if (!transferencia.envio || recepciones.length === 0 || transferencia.cancelacion) {
        errores.push("transferencia PARCIALMENTE_RECIBIDA exige envio y recepcion");
      }
      if (transferencia.cierreDiferencia || sinTransito) {
        errores.push("transferencia PARCIALMENTE_RECIBIDA exige cantidad aun en transito");
      }
      break;
    case EstadoTransferenciaInventario.RECIBIDA:
      if (
        !transferencia.envio ||
        recepciones.length === 0 ||
        transferencia.cierreDiferencia ||
        transferencia.cancelacion ||
        !sinTransito ||
        tieneDiferencia
      ) {
        errores.push("transferencia RECIBIDA exige recepcion total sin diferencias");
      }
      break;
    case EstadoTransferenciaInventario.CERRADA_CON_DIFERENCIA:
      if (
        !transferencia.envio ||
        transferencia.cancelacion ||
        !sinTransito ||
        !tieneDiferencia
      ) {
        errores.push(
          "transferencia CERRADA_CON_DIFERENCIA exige conciliar todo lo enviado y una diferencia",
        );
      }
      break;
    case EstadoTransferenciaInventario.CANCELADA:
      if (!transferencia.cancelacion) errores.push("transferencia CANCELADA exige cancelacion");
      if (
        transferencia.envio ||
        recepciones.length > 0 ||
        transferencia.cierreDiferencia ||
        transferencia.movimientoSalidaId
      ) {
        errores.push("solo un BORRADOR sin movimientos puede quedar CANCELADA");
      }
      break;
  }

  return { valido: errores.length === 0, errores };
};

export const assertTransferenciaInventario = (
  transferencia: TransferenciaInventario,
): void => {
  const validacion = validarTransferenciaInventario(transferencia);
  if (!validacion.valido) throw new Error(validacion.errores.join("; "));
};

const serializarEstable = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => serializarEstable(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${serializarEstable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const mismos = (left: unknown, right: unknown): boolean =>
  serializarEstable(left) === serializarEstable(right);

/**
 * Valida la escritura contra la raiz vigente. Un replay byte-equivalente es
 * idempotente; cualquier cambio real debe sumar una version y una sola accion.
 */
export const validarEvolucionTransferenciaInventario = (
  actual: TransferenciaInventario,
  candidata: TransferenciaInventario,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  const validaActual = validarTransferenciaInventario(actual);
  const validaCandidata = validarTransferenciaInventario(candidata);
  errores.push(
    ...validaActual.errores.map((error) => `actual.${error}`),
    ...validaCandidata.errores.map((error) => `candidata.${error}`),
  );
  if (errores.length > 0) return { valido: false, errores };
  if (mismos(actual, candidata)) return { valido: true, errores: [] };
  if (actual.version === candidata.version) {
    return {
      valido: false,
      errores: ["la misma version solo admite un replay identico"],
    };
  }
  if (candidata.version !== actual.version + 1) {
    errores.push("la candidata debe incrementar version exactamente en uno");
  }

  for (const campo of [
    "id",
    "type",
    "schemaVersion",
    "empresaId",
    "almacenOrigenId",
    "almacenDestinoId",
    "numeroTransferencia",
    "motivoCodigo",
    "motivoDetalle",
    "observaciones",
    "evidenciaIds",
    "items",
    "correlationId",
    "creacion",
    "createdAt",
  ] as const) {
    if (!mismos(actual[campo], candidata[campo])) {
      errores.push(`transferencia.${campo} es inmutable despues de crear`);
    }
  }
  if (
    !mismos(actual.envio, candidata.envio) &&
    actual.envio !== undefined
  ) {
    errores.push("transferencia.envio es append-only");
  }
  if (!mismos(actual.cancelacion, candidata.cancelacion) && actual.cancelacion) {
    errores.push("transferencia.cancelacion es append-only");
  }
  if (
    !mismos(actual.cierreDiferencia, candidata.cierreDiferencia) &&
    actual.cierreDiferencia
  ) {
    errores.push("transferencia.cierreDiferencia es append-only");
  }
  if (
    candidata.recepciones.length < actual.recepciones.length ||
    !mismos(
      actual.recepciones,
      candidata.recepciones.slice(0, actual.recepciones.length),
    )
  ) {
    errores.push("transferencia.recepciones solo admite append");
  }

  const envioAgregado = !actual.envio && Boolean(candidata.envio);
  const cancelacionAgregada = !actual.cancelacion && Boolean(candidata.cancelacion);
  const cierreAgregado =
    !actual.cierreDiferencia && Boolean(candidata.cierreDiferencia);
  const recepcionesAgregadas =
    candidata.recepciones.length - actual.recepciones.length;
  const accionesAgregadas =
    Number(envioAgregado) +
    Number(cancelacionAgregada) +
    Number(cierreAgregado) +
    recepcionesAgregadas;
  if (accionesAgregadas !== 1 || recepcionesAgregadas > 1) {
    errores.push("cada evolucion debe anexar exactamente una accion");
  }
  const accionAgregada = envioAgregado
    ? candidata.envio
    : cancelacionAgregada
      ? candidata.cancelacion
      : cierreAgregado
        ? candidata.cierreDiferencia
        : recepcionesAgregadas === 1
          ? candidata.recepciones[candidata.recepciones.length - 1]
          : undefined;
  if (accionAgregada?.expectedVersion !== actual.version) {
    errores.push("la accion agregada tiene expectedVersion obsoleta");
  }
  if (candidata.updatedAt < actual.updatedAt) {
    errores.push("transferencia.updatedAt no puede retroceder");
  }
  return { valido: errores.length === 0, errores };
};

export const assertEvolucionTransferenciaInventario = (
  actual: TransferenciaInventario,
  candidata: TransferenciaInventario,
): void => {
  const resultado = validarEvolucionTransferenciaInventario(actual, candidata);
  if (!resultado.valido) throw new Error(resultado.errores.join("; "));
};

const construirLineaSalida = (
  linea: TransferenciaInventarioLinea,
  almacenId: string,
): MovimientoInventarioLinea => ({
  id: `${linea.id}:salida`,
  productoBaseId: linea.productoBaseId,
  almacenId,
  cantidadOperacion: linea.cantidadOperacion,
  conversionSnapshot: linea.conversionSnapshot,
  cantidadBaseDelta: -linea.cantidadBase,
  unidadBase: linea.unidadBase,
  costoUnitarioBase: linea.costoUnitarioBaseSnapshot,
  monedaCosto: linea.monedaCosto,
  lote: linea.lote,
  fechaVencimiento: linea.fechaVencimiento,
});

const construirConversionBaseRecepcion = (
  linea: TransferenciaInventarioLinea,
  recepcion: RecepcionTransferenciaInventarioSnapshot,
): ConversionUnidadInventarioSnapshot => ({
  productoBaseId: linea.productoBaseId,
  unidadOperacion: linea.unidadBase,
  unidadBase: linea.unidadBase,
  factorUnidadBase: 1,
  precisionCantidadBase: linea.conversionSnapshot.precisionCantidadBase,
  capturadaAt: recepcion.registradaAt,
});

const construirEntradaRecepcion = (
  transferencia: TransferenciaInventario,
  recepcion: RecepcionTransferenciaInventarioSnapshot,
): MovimientoInventario => {
  const lineasPorId = new Map(
    transferencia.items.map((linea) => [linea.id, linea] as const),
  );
  const items: MovimientoInventarioLinea[] = recepcion.items
    .filter((linea) => linea.cantidadBaseAceptada > 0)
    .map((recibida) => {
      const linea = lineasPorId.get(recibida.lineaTransferenciaId)!;
      return {
        id: `${linea.id}:entrada:${encodeURIComponent(recepcion.id)}`,
        productoBaseId: linea.productoBaseId,
        almacenId: transferencia.almacenDestinoId,
        cantidadOperacion: recibida.cantidadBaseAceptada,
        conversionSnapshot: construirConversionBaseRecepcion(linea, recepcion),
        cantidadBaseDelta: recibida.cantidadBaseAceptada,
        unidadBase: linea.unidadBase,
        costoUnitarioBase: linea.costoUnitarioBaseSnapshot,
        monedaCosto: linea.monedaCosto,
        lote: linea.lote,
        fechaVencimiento: linea.fechaVencimiento,
      };
    });
  return {
    id: recepcion.movimientoEntradaId,
    type: MOVIMIENTO_INVENTARIO_TYPE,
    schemaVersion: INVENTORY_SCHEMA_VERSION,
    estado: "APLICADO",
    tipo: TipoMovimientoInventario.TRANSFERENCIA_ENTRADA,
    almacenId: transferencia.almacenDestinoId,
    origen: {
      tipo: OrigenMovimientoInventario.TRANSFERENCIA,
      documentoId: transferencia.id,
    },
    items,
    operationId: recepcion.operationId,
    idempotencyKey: `${recepcion.idempotencyKey}:movimiento_entrada`,
    correlationId: transferencia.correlationId,
    causationId: transferencia.envio!.operationId,
    actor: recepcion.actor,
    fechaEfectiva: recepcion.registradaAt,
    registradoAt: recepcion.registradaAt,
  };
};

/**
 * Materializa una salida total y una entrada por cada recibo. IDs y claves son
 * deterministas, por lo que reintentar la misma raiz no duplica stock.
 */
export const construirMovimientosTransferenciaInventario = (
  transferencia: TransferenciaInventario,
): MovimientoInventario[] => {
  assertTransferenciaInventario(transferencia);
  if (
    transferencia.estado === EstadoTransferenciaInventario.BORRADOR ||
    transferencia.estado === EstadoTransferenciaInventario.CANCELADA
  ) {
    return [];
  }
  const envio = transferencia.envio!;
  const salida: MovimientoInventario = {
    id: transferencia.movimientoSalidaId!,
    type: MOVIMIENTO_INVENTARIO_TYPE,
    schemaVersion: INVENTORY_SCHEMA_VERSION,
    estado: "APLICADO",
    tipo: TipoMovimientoInventario.TRANSFERENCIA_SALIDA,
    almacenId: transferencia.almacenOrigenId,
    origen: {
      tipo: OrigenMovimientoInventario.TRANSFERENCIA,
      documentoId: transferencia.id,
    },
    items: transferencia.items.map((linea) =>
      construirLineaSalida(linea, transferencia.almacenOrigenId),
    ),
    operationId: envio.operationId,
    idempotencyKey: `${envio.idempotencyKey}:movimiento_salida`,
    correlationId: transferencia.correlationId,
    causationId: transferencia.creacion.operationId,
    actor: envio.actor,
    fechaEfectiva: envio.registradaAt,
    registradoAt: envio.registradaAt,
  };
  return [
    salida,
    ...transferencia.recepciones.map((recepcion) =>
      construirEntradaRecepcion(transferencia, recepcion),
    ),
  ];
};
